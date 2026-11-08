#!/usr/bin/env bash
#
# Unpacks the private image ZIP for development: the interface images and game
# icons are not part of this repository. Runs locally and does not touch a server.
#
# Usage: scripts/setup-images.sh <path to the ZIP> [--force]
#
# The ZIP holds a top-level folder img/. An existing img/ is only replaced with
# --force. A symbolic link is removed; the files it points to stay untouched.

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET=${ANNO_IMAGE_DIR:-$ROOT/img}
ZIP=${1:-}
FORCE=${2:-}

fail() {
	echo "Fehler: $1" >&2
	exit 1
}

[[ -n $ZIP ]] || fail "Aufruf: scripts/setup-images.sh <Pfad zum ZIP> [--force]"
[[ -f $ZIP ]] || fail "$ZIP wurde nicht gefunden."
unzip -l "$ZIP" | grep -q ' img/user-menu\.png$' || fail "$ZIP enthält kein img/user-menu.png."

if [[ -e $TARGET || -L $TARGET ]]; then
	[[ $FORCE == --force ]] || fail "$TARGET existiert schon. Mit --force ersetzen."
	if [[ -L $TARGET ]]; then
		rm "$TARGET"
	else
		rm -rf "$TARGET"
	fi
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
unzip -q "$ZIP" -d "$WORK"
mv "$WORK/img" "$TARGET"
echo "Bilder liegen in $TARGET ($(find "$TARGET" -type f | wc -l | tr -d ' ') Dateien)."
