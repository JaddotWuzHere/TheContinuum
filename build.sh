#!/usr/bin/env bash
set -e

# Pick which language to build based on env var
if [ "$LOCALE" = "zh" ]; then
  echo "Building Chinese version..."
  # Copy your Chinese content into the main content folder
  rm -rf content
  cp -r content-zh content
else
  echo "Building English version..."
  rm -rf content
  cp -r content-en content
fi

npx quartz build

