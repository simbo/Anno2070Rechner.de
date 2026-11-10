#!/usr/bin/env bash
#
# Removes the database of the old PHP site from Uberspace once the static site
# has replaced it there (including all user data). The web folder, the web
# domains and the www redirect stay, because the static site uses them; see
# docs/hosting.md. Runs locally. Without --execute it only checks and prints
# what it would do. Mail domains and mailboxes are never touched.
#
# Usage: scripts/uberspace-cleanup.sh [--execute]
#
# It refuses to delete anything unless a verified export from
# uberspace-export.sh still matches the database and the domain serves the
# static site from v2.0.0 on. Deleting cannot be undone.

set -euo pipefail

HOST=${ANNO_UBERSPACE_HOST:-simbo}
EXPORT_DIR=${ANNO_EXPORT_DIR:-$HOME/projects/private/Anno2070Rechner-export}
DOMAIN=anno2070rechner.de
KNOWN_TABLES=" game_buildcosts_products game_buildings game_demands game_objects game_productionbuildings game_products game_residencebuildings sessions user_has_right users "

EXECUTE=false
case "${1:-}" in
	'') ;;
	--execute) EXECUTE=true ;;
	*) echo "Aufruf: $0 [--execute]" >&2; exit 2 ;;
esac

step() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nABBRUCH: %s\nEs wurde nichts gelöscht.\n' "$*" >&2; exit 1; }

step "Export prüfen"
[[ -f $EXPORT_DIR/meta/VERIFIED ]] || fail "Kein geprüfter Export in $EXPORT_DIR. Zuerst uberspace-export.sh ausführen."
DB=$(cat "$EXPORT_DIR/meta/db-name")
[[ $DB =~ ^[A-Za-z0-9_]+_[A-Za-z0-9_]+$ ]] || fail "Datenbank '$DB' sieht nicht nach einer eigenen Datenbank aus (erwartet: konto_name)."
echo "Geprüfter Export vom $(cat "$EXPORT_DIR/meta/VERIFIED")"

step "Prüfen, dass die statische Seite live ist"
VERSION=$(curl -fsS --max-time 20 "https://$DOMAIN/version.txt" 2>/dev/null || true)
[[ $VERSION =~ ^([0-9]+)\.[0-9]+\.[0-9]+$ ]] || fail "https://$DOMAIN/version.txt fehlt. Die statische Seite ist noch nicht live."
((BASH_REMATCH[1] >= 2)) || fail "https://$DOMAIN/ läuft mit $VERSION, erwartet ist v2.0.0 oder neuer."
HEADERS=$(curl -sSI --max-time 20 "https://$DOMAIN/population")
if grep -Eiq 'PHPSESSID|x-powered-by: *php' <<< "$HEADERS"; then
	fail "https://$DOMAIN/ wird noch von PHP ausgeliefert."
fi
echo "Ok: $DOMAIN läuft mit $VERSION."

step "Prüfen, dass die Datenbank noch dem Export entspricht"
DB_EXISTS=false
if [[ -n $(ssh "$HOST" "mysql -N -B -e \"SHOW DATABASES LIKE '$DB'\"") ]]; then
	DB_EXISTS=true
	for t in $(ssh "$HOST" "mysql -N -B -e 'SHOW TABLES' $DB"); do
		[[ $KNOWN_TABLES == *" $t "* ]] || fail "Unbekannte Tabelle '$t' in $DB."
		if [[ $t == game_* ]]; then
			count=$(ssh "$HOST" "mysql -N -B -e 'SELECT COUNT(*) FROM $t' $DB")
			expected=$(awk -F '\t' -v t="$t" '$1 == t { print $2 }' "$EXPORT_DIR/meta/table-counts.tsv")
			[[ $count == "$expected" ]] || fail "$t: $count Zeilen auf dem Server, $expected im Export."
		fi
	done
fi
echo "Ok."

if ! $DB_EXISTS; then
	step "Fertig"
	echo "Die Datenbank $DB gibt es auf $HOST nicht mehr."
	exit 0
fi

step "Geplante Löschung auf $HOST"
echo "  - Datenbank:   $DB (inklusive users und sessions, die nicht im Export sind)"

if ! $EXECUTE; then
	printf '\nProbelauf: Es wurde nichts gelöscht. Zum Ausführen: %s --execute\n' "$0"
	exit 0
fi

printf '\nDas lässt sich nicht rückgängig machen. Zum Bestätigen den Datenbanknamen eintippen: '
read -r answer
[[ $answer == "$DB" ]] || fail "Bestätigung stimmt nicht überein."

step "Lösche"
ssh "$HOST" "mysql -e 'DROP DATABASE $DB'"

step "Fertig"
echo "Die Datenbank $DB ist von $HOST entfernt. Der Export bleibt in $EXPORT_DIR."
echo "Den MySQL-Zugang der alten Seite trotzdem ändern, siehe docs/rebuild-plan.md#next-steps."
