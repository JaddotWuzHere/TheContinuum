#!/usr/bin/env bash
set -euo pipefail

LOCALE="${LOCALE:-en}"
echo ">> Building locale: $LOCALE"

# clean previous build and content root
rm -rf public .quartz temp-content quartz.config.ts

# create a temporary content folder
mkdir -p temp-content
cp -R "content/$LOCALE/." temp-content/

# copy localized content into place as root
rm -rf content-root
mv temp-content content-root

# pick the correct config
if [ "$LOCALE" = "zh" ]; then
  cp quartz.config.zh.ts quartz.config.ts
else
  cp quartz.config.en.ts quartz.config.ts
fi

# run Quartz build on content-root instead of full tree
npx quartz build --directory content-root

# move result into public (Quartz should already output to /public)

