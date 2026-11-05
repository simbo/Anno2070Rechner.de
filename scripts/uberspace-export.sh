#!/usr/bin/env bash
#
# Copies the live site and its game data from Uberspace to this machine and
# verifies the copy. Runs locally and only reads on the server; nothing is
# changed there and no temporary files are created.
#
# Usage: scripts/uberspace-export.sh
#
# The export contains game assets and the server's conf/ (with its database
# password), so it lives outside the repository. Tables other than game_* are
# exported as structure and row count only, so user data stays on the server.

set -euo pipefail

HOST=${ANNO_UBERSPACE_HOST:-simbo}
REMOTE_DIR=${ANNO_REMOTE_DIR:-/var/www/virtual/simbo/anno2070rechner.de}
EXPORT_DIR=${ANNO_EXPORT_DIR:-$HOME/projects/private/Anno2070Rechner-export}

step() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nFEHLER: %s\n' "$*" >&2; exit 1; }

umask 077
mkdir -p "$EXPORT_DIR/site" "$EXPORT_DIR/db/tsv" "$EXPORT_DIR/meta"
rm -f "$EXPORT_DIR/meta/VERIFIED"

step "Verbindung und Datenbank prüfen ($HOST)"
ssh "$HOST" "test -f '$REMOTE_DIR/conf/mysql.ini'" \
	|| fail "$REMOTE_DIR/conf/mysql.ini wurde auf $HOST nicht gefunden."
DB=$(ssh "$HOST" "sed -n 's/^database[[:space:]]*=[[:space:]]*\"\\(.*\\)\".*/\\1/p' '$REMOTE_DIR/conf/mysql.ini'" | tr -d '\r')
[[ $DB =~ ^[A-Za-z0-9_]+$ ]] || fail "Datenbankname nicht lesbar: '$DB'"
echo "Datenbank: $DB"
echo "$DB" > "$EXPORT_DIR/meta/db-name"

TABLES=$(ssh "$HOST" "mysql -N -B -e 'SHOW TABLES' $DB") \
	|| fail "Kein Zugriff auf die Datenbank. Liegt auf dem Server eine gültige ~/.my.cnf?"
for t in $TABLES; do
	[[ $t =~ ^[A-Za-z0-9_]+$ ]] || fail "Unerwarteter Tabellenname: '$t'"
done
GAME_TABLES=$(echo "$TABLES" | grep '^game_' || true)
[[ -n $GAME_TABLES ]] || fail "Keine game_*-Tabellen in $DB gefunden."

step "Server-Infos sichern"
ssh "$HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" > "$EXPORT_DIR/meta/server-info.txt" <<'EOF'
section() { printf '\n### %s\n' "$*"; }
section "Domain-Ordner";    ls -la "$(dirname "$REMOTE_DIR")"
section "Web-Domains";      uberspace web domain list 2>&1 || true
section "Web-Backends";     uberspace web backend list 2>&1 || true
section "Mail-Domains";     uberspace mail domain list 2>&1 || true
section "Mail-Benutzer";    uberspace mail user list 2>&1 || true
section "PHP-Version";      php -v 2>&1 | head -1 || true
section "Crontab";          crontab -l 2>&1 || true
section "MySQL-Zeichensatz"; mysql -e "SHOW VARIABLES LIKE 'character_set%'" 2>&1 || true
EOF

step "Dateien kopieren (kann bei vielen Bildern etwas dauern)"
rsync -a --delete "$HOST:$REMOTE_DIR/" "$EXPORT_DIR/site/"

step "Datenbank exportieren"
: > "$EXPORT_DIR/meta/table-counts.tsv"
for t in $TABLES; do
	count=$(ssh "$HOST" "mysql -N -B -e 'SELECT COUNT(*) FROM $t' $DB")
	printf '%s\t%s\n' "$t" "$count" >> "$EXPORT_DIR/meta/table-counts.tsv"
done
ssh "$HOST" "mysqldump --no-data --no-tablespaces --default-character-set=binary $DB" > "$EXPORT_DIR/db/schema.sql"
# Binary charset keeps the stored bytes untouched, so encoding can be judged afterwards.
# shellcheck disable=SC2086 # the table list is meant to split
ssh "$HOST" "mysqldump --single-transaction --no-tablespaces --skip-extended-insert --default-character-set=binary $DB" $GAME_TABLES > "$EXPORT_DIR/db/game-data.sql"
for t in $GAME_TABLES; do
	ssh "$HOST" "mysql -B --default-character-set=binary -e 'SELECT * FROM $t' $DB" > "$EXPORT_DIR/db/tsv/$t.tsv"
done

step "Kopie prüfen"
ssh "$HOST" "cd '$REMOTE_DIR' && find . -type f -exec sha256sum {} +" | LC_ALL=C sort -k2 > "$EXPORT_DIR/meta/remote-sha256.txt"
(cd "$EXPORT_DIR/site" && find . -type f -exec shasum -a 256 {} +) | LC_ALL=C sort -k2 > "$EXPORT_DIR/meta/local-sha256.txt"
diff "$EXPORT_DIR/meta/remote-sha256.txt" "$EXPORT_DIR/meta/local-sha256.txt" > "$EXPORT_DIR/meta/sha256.diff" \
	|| fail "Dateien weichen vom Server ab, siehe $EXPORT_DIR/meta/sha256.diff"

for f in schema game-data; do
	grep -q 'Dump completed' <<< "$(tail -n 1 "$EXPORT_DIR/db/$f.sql")" || fail "db/$f.sql ist unvollständig."
done

for t in $GAME_TABLES; do
	expected=$(awk -F '\t' -v t="$t" '$1 == t { print $2 }' "$EXPORT_DIR/meta/table-counts.tsv")
	lines=$(wc -l < "$EXPORT_DIR/db/tsv/$t.tsv" | tr -d ' ')
	# mysql -B prints a header line, except for empty tables.
	[[ $expected -eq 0 && $lines -eq 0 || $lines -eq $((expected + 1)) ]] \
		|| fail "$t: $expected Zeilen auf dem Server, aber $lines Zeilen in der TSV-Datei."
done

date '+%Y-%m-%d %H:%M:%S %z' > "$EXPORT_DIR/meta/VERIFIED"

step "Fertig und geprüft"
echo "Ablage:  $EXPORT_DIR"
echo "Dateien: $(wc -l < "$EXPORT_DIR/meta/local-sha256.txt" | tr -d ' ') ($(du -sh "$EXPORT_DIR/site" | cut -f1))"
echo "Tabellen (Zeilen):"
sed 's/^/  /' "$EXPORT_DIR/meta/table-counts.tsv"
