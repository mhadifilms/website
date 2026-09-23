#!/bin/zsh
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")"
if /usr/bin/curl -fsS http://127.0.0.1:4179/api/galleries >/dev/null 2>&1; then
  open http://127.0.0.1:4179
  echo "The gallery publisher is already open."
  exit 0
fi
node scripts/gallery-publisher.mjs &
publisher_pid=$!
trap 'kill "$publisher_pid" 2>/dev/null || true' EXIT
sleep 2
if ! kill -0 "$publisher_pid" 2>/dev/null; then
  echo "The gallery publisher could not start. Read the message above."
  exit 1
fi
open http://127.0.0.1:4179
echo "Keep this window open while you add photos. Close it to stop the gallery publisher."
wait "$publisher_pid"
