#!/bin/bash
cd /app

# installation
if [ ! -d "node_modules" ]; then
    xargs -a dep.txt npm install --no-fund --no-audit
    xargs -a dev_dep.txt npm install --save-dev --no-fund --no-audit
fi

npx tsc --build
npx @tailwindcss/cli -i public/styles/tailwind.css -o public/styles/compiled.css

# Lancer ngrok en arrière-plan
ngrok config add-authtoken 32Knh6p1gzSAQwnxmuptNR5U87w_3FeBcPT54xrff5Hy9Q5Er
# ngrok http --log=stdout --log-level=error https://localhost:8080 > /dev/null &
# sleep 5

# Récupérer l'URL publique ngrok
NGROK_URL=$(curl --silent http://localhost:4040/api/tunnels \
    | grep -o '"public_url":"[^"]*"' \
    | sed 's/"public_url":"//;s/"$//')

echo "URL de ngrok : $NGROK_URL"

# Lancer le serveur Node.js
exec "$@"
