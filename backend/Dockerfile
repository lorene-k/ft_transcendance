FROM	node:22

WORKDIR	/app

COPY	package.json ./
COPY	package-lock.json ./

RUN     npm install
RUN     npm install fastify
RUN     npm install @fastify/cors

COPY	app.js ./
COPY	plugins/ ./plugins/
COPY	routes/ ./routes/
COPY	test/ ./test/

EXPOSE	8080

CMD     ["npm", "run", "dev"]