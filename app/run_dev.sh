#!/bin/bash
# little script to launch everything in watch mode (reload app and compile everything on change)
# can be launch directly or with `npm run dev`
set -euo pipefail


npx tsc --build --watch &
tsc_pid=$!
sleep 1

npx @tailwindcss/cli -i public/styles/tailwind.css -o public/styles/compiled.css --watch &
tailwind_pid=$!
sleep 1

node --watch src/app.js
node_pid=$!

# Kill all background tasks on exit
trap "kill $tsc_pid $tailwind_pid $node_pid EXIT"

wait


