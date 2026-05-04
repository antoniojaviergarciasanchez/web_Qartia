#!/bin/zsh
cd "/Users/antonio/Documents/qartia-web-local" || exit 1

if ! lsof -iTCP:8000 -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  python3 -m http.server 8000 >/tmp/qartia-web-local.log 2>&1 &
  sleep 1
fi

open "http://localhost:8000/index.html"
