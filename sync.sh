#!/usr/bin/env bash
set -euo pipefail

# obsidian vault path
VAULT="/home/jaddotwuzhere/Desktop/The Continuum/"

# version argument in format: v(x.y.z)
# x := Major update
# y := Minor update (e.g. new page, new section, etc)
# z := Fixes (e.g. section rewrite, typos, etc)
VERSION="${1-}"

# commit message
MSG="Update Wiki"
[[ -n "$VERSION" ]] && MSG="Update Wiki to $VERSION"

git fetch origin
git pull --rebase origin main

rsync -av --delete "$VAULT" content/

git add -A

if ! git diff --cached --quiet; then
  git commit -m "$MSG"
  git push origin main

  if [[ -n "$VERSION" ]]; then
    git tag -a "$VERSION" -m "Wiki $VERSION"
    git push origin "$VERSION"
  fi
else
  echo "No changes; nothing to commit."
fi

