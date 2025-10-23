#!/bin/bash
# sync Obsidian vault into Quartz and preview locally

# vault path
VAULT="/home/jaddotwuzhere/Desktop/The Continuum"
QUARTZ="/home/jaddotwuzhere/Desktop/quartz"

# copy updated markdown
rsync -av --delete \
  --exclude='.obsidian' \
  --exclude='.trash' \
  "$VAULT/" "$QUARTZ/content/"

# build + serve locally
cd "$QUARTZ"
npx quartz build --serve

