#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
TYPE="${1:-apk}"
P=credentials/keystore.properties
prop() { grep "^$1=" "$P" | cut -d= -f2-; }
NAME=$(node -p "require('./app.config.js').expo.slug")
VER=$(node -p "require('./app.config.js').expo.version")
CODE=$(node -p "require('./app.config.js').expo.android.versionCode")
STAMP=android/.prebuild-stamp
SUM=$(cat app.config.js package-lock.json google-services.json 2>/dev/null | sha1sum | cut -c1-40)
if [ ! -d android ] || [ "$(cat $STAMP 2>/dev/null)" != "$SUM" ]; then
  npx expo prebuild --platform android --clean --no-install
  printf '\norg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g\norg.gradle.parallel=true\norg.gradle.caching=true\n' >> android/gradle.properties
  echo "$SUM" > $STAMP
fi
TASK=assembleRelease; [ "$TYPE" = aab ] && TASK=bundleRelease
# read signing values before cd (the properties path is relative to the app folder)
KS="$PWD/$(prop storeFile)"; SP="$(prop storePassword)"; KA="$(prop keyAlias)"; KP="$(prop keyPassword)"
[ -f "$KS" ] || { echo "Keystore not found: $KS"; exit 1; }
(cd android && ./gradlew "$TASK" \
  -PreactNativeArchitectures="${ABIS:-arm64-v8a,armeabi-v7a}" \
  -Pandroid.injected.signing.store.file="$KS" \
  -Pandroid.injected.signing.store.password="$SP" \
  -Pandroid.injected.signing.key.alias="$KA" \
  -Pandroid.injected.signing.key.password="$KP")
mkdir -p ../releases
if [ "$TYPE" = aab ]; then
  OUT="../releases/$NAME-v$VER-$CODE.aab"
  cp android/app/build/outputs/bundle/release/app-release.aab "$OUT"
else
  OUT="../releases/$NAME-v$VER-$CODE.apk"
  cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
  BT=$(ls -d "${ANDROID_HOME:-$HOME/Android/Sdk}"/build-tools/* | sort -V | tail -1)
  "$BT/apksigner" verify --print-certs "$OUT" | grep -E "SHA-1|SHA-256"
fi
sha256sum "$OUT"
