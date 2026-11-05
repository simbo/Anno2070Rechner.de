#!/usr/bin/env bash
#
# Removes the old site from Uberspace once the new one is live elsewhere: the
# web domains, the database (including all user data) and the site folder.
# Runs locally. Without --execute it only checks and prints what it would do.
# Mail domains and mailboxes are never touched.
#
# Usage: scripts/uberspace-cleanup.sh [--execute]
#
# It refuses to delete anything unless a verified export from
# uberspace-export.sh still matches the server and the domain no longer points
# to Uberspace. Deleting cannot be undone.

set -euo pipefail

HOST=${ANNO_UBERSPACE_HOST:-simbo}
REMOTE_DIR=${ANNO_REMOTE_DIR:-/var/www/virtual/simbo/anno2070rechner.de}
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

case "$REMOTE_DIR" in
	*..*) fail "Unzulässiger Pfad: $REMOTE_DIR" ;;
	/*/"$DOMAIN") ;;
	*) fail "Unzulässiger Pfad: $REMOTE_DIR" ;;
esac

step "Export prüfen"
[[ -f $EXPORT_DIR/meta/VERIFIED ]] || fail "Kein geprüfter Export in $EXPORT_DIR. Zuerst uberspace-export.sh ausführen."
DB=$(cat "$EXPORT_DIR/meta/db-name")
[[ $DB =~ ^[A-Za-z0-9_]+_[A-Za-z0-9_]+$ ]] || fail "Datenbank '$DB' sieht nicht nach einer eigenen Datenbank aus (erwartet: konto_name)."
echo "Geprüfter Export vom $(cat "$EXPORT_DIR/meta/VERIFIED")"

step "Prüfen, dass die Domain nicht mehr auf Uberspace zeigt"
SERVER=$(ssh -G "$HOST" | awk '$1 == "hostname" { print $2 }')
for type in A AAAA; do
	server_ips=$(dig +short "$type" "$SERVER" | grep -E '^[0-9a-fA-F:.]+$' || true)
	for name in "$DOMAIN" "www.$DOMAIN"; do
		for ip in $(dig +short "$type" "$name" | grep -E '^[0-9a-fA-F:.]+$' || true); do
			if grep -Fxq "$ip" <<< "$server_ips"; then
				fail "$name zeigt noch auf $SERVER ($ip)."
			fi
		done
	done
done
[[ -n $(dig +short A "$DOMAIN") ]] || fail "$DOMAIN hat keinen A-Eintrag."
curl -fsS -o /dev/null --max-time 20 "https://$DOMAIN/" || fail "https://$DOMAIN/ antwortet nicht."
HEADERS=$(curl -sSI --max-time 20 "https://$DOMAIN/")
if grep -Eiq 'PHPSESSID|x-powered-by: *php' <<< "$HEADERS"; then
	fail "https://$DOMAIN/ wird noch von PHP ausgeliefert."
fi
echo "Ok: $DOMAIN wird nicht mehr von $SERVER ausgeliefert."
echo "MX-Einträge (bleiben unangetastet): $(dig +short MX "$DOMAIN" | tr '\n' ' ')"

step "Prüfen, dass der Server noch dem Export entspricht"
DIR_EXISTS=false
if ssh "$HOST" "test -d '$REMOTE_DIR'"; then
	DIR_EXISTS=true
	ssh "$HOST" "cd '$REMOTE_DIR' && find . -type f -exec sha256sum {} +" | LC_ALL=C sort -k2 \
		| diff "$EXPORT_DIR/meta/remote-sha256.txt" - > /dev/null \
		|| fail "Dateien auf dem Server haben sich seit dem Export geändert. Export erneut ausführen."
fi

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

DOMAINS=$(ssh "$HOST" "uberspace web domain list" 2>/dev/null | grep -Ex "(www\.)?${DOMAIN//./\\.}" || true)
WWW_LINK=$(dirname "$REMOTE_DIR")/www.$DOMAIN
WWW_EXISTS=false
if ssh "$HOST" "test -L '$WWW_LINK'"; then
	WWW_EXISTS=true
fi
REDIRECT_DIR=$(dirname "$REMOTE_DIR")/redirect-to/$DOMAIN
REDIRECT_EXISTS=false
if ssh "$HOST" "test -d '$REDIRECT_DIR'"; then
	REDIRECT_EXISTS=true
fi

step "Geplante Löschungen auf $HOST"
for d in $DOMAINS; do echo "  - Web-Domain:  $d"; done
$DB_EXISTS && echo "  - Datenbank:   $DB (inklusive users und sessions, die nicht im Export sind)"
$WWW_EXISTS && echo "  - Symlink:     $WWW_LINK"
$REDIRECT_EXISTS && echo "  - Umleitung:   $REDIRECT_DIR"
$DIR_EXISTS && echo "  - Ordner:      $REMOTE_DIR"

if ! $EXECUTE; then
	printf '\nProbelauf: Es wurde nichts gelöscht. Zum Ausführen: %s --execute\n' "$0"
	exit 0
fi

printf '\nDas lässt sich nicht rückgängig machen. Zum Bestätigen die Domain eintippen: '
read -r answer
[[ $answer == "$DOMAIN" ]] || fail "Bestätigung stimmt nicht überein."

step "Lösche"
for d in $DOMAINS; do
	ssh "$HOST" "uberspace web domain del '$d'"
done
if $DB_EXISTS; then
	ssh "$HOST" "mysql -e 'DROP DATABASE $DB'"
fi
if $WWW_EXISTS; then
	ssh "$HOST" "rm '$WWW_LINK'"
fi
if $REDIRECT_EXISTS; then
	ssh "$HOST" "rm -rf '$REDIRECT_DIR'"
fi
if $DIR_EXISTS; then
	ssh "$HOST" "rm -rf '$REMOTE_DIR'"
fi

step "Fertig"
echo "Die Seite ist von $HOST entfernt. Der Export bleibt in $EXPORT_DIR."
