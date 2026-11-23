#!/usr/bin/env sh
# Install the effort readout into omp's auto-discovered extensions folder.
# Copies index.ts only; no configuration or secrets are written anywhere.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
dest="${OMP_EXTENSIONS_DIR:-$HOME/.omp/agent/extensions}/omp-effort"
mkdir -p "$dest"
cp "$here/index.ts" "$dest/index.ts"
echo "installed: $dest/index.ts"
echo "restart omp; the status area then shows 'effort <level>' beside the other extension statuses."
