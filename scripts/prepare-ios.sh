#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != Darwin ]]; then
  echo "Run this setup on a Mac with Xcode installed." >&2
  exit 1
fi
xcodebuild -version
sdk="$(xcrun --sdk iphoneos --show-sdk-version)"
if (( ${sdk%%.*} < 26 )); then
  echo "Select Xcode with the iOS 26 SDK or later, then rerun." >&2
  exit 1
fi

npm ci
core="$(node -p "require('./node_modules/@capacitor/core/package.json').version")"
npm install --save-exact "@capacitor/ios@$core"
npm run build
if [[ ! -d ios ]]; then
  npx cap add ios
fi
npx cap sync ios
npx cap open ios
