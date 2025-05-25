FROM	node:22

WORKDIR	/app

COPY	package.json ./
COPY	package-lock.json ./

RUN	npm install
RUN	npm install tailwindcss @tailwindcss/vite

COPY	assets/ ./assets/
COPY    config/ ./config/
COPY	src/ ./src/
COPY    index.html ./
COPY	.prettierrc ./
COPY	.prettierignore ./

EXPOSE	3000

CMD     ["npm", "run", "dev", "--", "--host"]
