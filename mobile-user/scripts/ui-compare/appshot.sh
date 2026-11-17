#!/usr/bin/env bash
# Screenshots of the installed app on a running emulator/device, one per route, via deep links.
# usage: WAIT=8 bash appshot.sh <outdir> <path1> [path2...]
A="${ADB:-$HOME/Android/Sdk/platform-tools/adb}"
out="$1"; shift; mkdir -p "$out"
for p in "$@"; do
  name=$(echo "$p" | sed -E 's/[^a-zA-Z0-9]+/_/g; s/^_|_$//g'); [ -z "$name" ] && name=root
  "$A" shell am start -W -a android.intent.action.VIEW -d "sewzella://${p#/}" com.sewzella.user >/dev/null 2>&1
  sleep "${WAIT:-7}"
  "$A" exec-out screencap -p > "$out/$name.png"
done
echo "app shots: $#"
