#!/usr/bin/env bash
set -euo pipefail

VAULT="/home/jaddotwuzhere/Desktop/The Continuum/"

git fetch origin
git pull --rebase origin main

rsync -av --delete "$VAULT" content/

git add -A
git diff --cached --quiet || git commit -m "sync notes"
git push origin main

