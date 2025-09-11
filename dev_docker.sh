cd app
cp ../dep.txt dep.txt
cp ../dev_dep.txt dev_dep.txt
rm -rf node_modules package.json package-lock.json
mv package_dummy.json package.json

xargs -a dep.txt npm install
xargs -a dev_dep.txt npm install --save-dev

exec "$@"