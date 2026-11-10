#!/usr/bin/env bash
#
# Unpacks or packs the private image ZIP: the interface images and game icons are
# not part of this repository. images.txt lists the images the site uses, with
# their checksums. Usually `pnpm dev` downloads missing images from the live
# site; the ZIP is the backup and the way in before v2.0.0 is live. Runs locally
# and does not touch a server.
#
# Usage:
#   scripts/setup-images.sh <path to the ZIP> [--force]   unpack into img/
#   scripts/setup-images.sh --pack <path to the ZIP>      pack img/ by images.txt
#
# The ZIP holds a top-level folder img/. An existing img/ is only replaced with
# --force. A symbolic link is removed; the files it points to stay untouched.

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET=${ANNO_IMAGE_DIR:-$ROOT/img}
LIST=$ROOT/images.txt
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

fail() {
	echo "Fehler: $1" >&2
	exit 1
}

# Checks every image of images.txt in a folder against its checksum.
verify() {
	local dir=$1
	(cd "$dir" && awk '!/^#/ { print $1 "  " $3 }' "$LIST" | shasum -a 256 --check --quiet) ||
		fail "Die Bilder in $dir passen nicht zu images.txt."
}

pack() {
	local zip=$1
	[[ -n $zip ]] || fail "Aufruf: scripts/setup-images.sh --pack <Pfad zum ZIP>"
	[[ ! -e $zip ]] || fail "$zip existiert schon."
	verify "$TARGET"
	mkdir "$WORK/img"
	awk '!/^#/ { print $3 }' "$LIST" | while read -r path; do
		mkdir -p "$WORK/img/$(dirname "$path")"
		cp -L "$TARGET/$path" "$WORK/img/$path"
	done
	(cd "$WORK" && zip -q -X -r "$WORK/images.zip" img)
	mv "$WORK/images.zip" "$zip"
	echo "$zip enthält $(grep -vc '^#' "$LIST") Bilder."
}

unpack() {
	local zip=$1 force=$2
	[[ -n $zip ]] || fail "Aufruf: scripts/setup-images.sh <Pfad zum ZIP> [--force]"
	[[ -f $zip ]] || fail "$zip wurde nicht gefunden."
	unzip -Z1 "$zip" > "$WORK/files"
	grep -qx 'img/user-menu.png' "$WORK/files" || fail "$zip enthält kein img/user-menu.png."

	unzip -q "$zip" -d "$WORK"
	verify "$WORK/img"

	if [[ -e $TARGET || -L $TARGET ]]; then
		[[ $force == --force ]] || fail "$TARGET existiert schon. Mit --force ersetzen."
		if [[ -L $TARGET ]]; then
			rm "$TARGET"
		else
			rm -rf "$TARGET"
		fi
	fi
	mv "$WORK/img" "$TARGET"
	echo "Bilder liegen in $TARGET ($(find "$TARGET" -type f | wc -l | tr -d ' ') Dateien)."
}

if [[ ${1:-} == --pack ]]; then
	pack "${2:-}"
else
	unpack "${1:-}" "${2:-}"
fi
