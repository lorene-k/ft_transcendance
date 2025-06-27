FROM	node:22

WORKDIR	/app

COPY	package.json ./
COPY	package-lock.json ./

RUN     npm install

COPY	app.js ./
COPY	plugins/ ./plugins/
COPY	routes/ ./routes/
COPY	test/ ./test/

RUN     mkdir -p db

EXPOSE	8080

CMD     ["npm", "run", "dev"]