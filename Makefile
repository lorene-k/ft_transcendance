APP_DIR := ./app
IMAGE_NAME := transcendance
CONTAINER_NAME := transcendance
HOST_PORT := 8080
NGROK_PORT := 4040

.PHONY: all build run  stop

all: build prod

build:
	docker build -t $(IMAGE_NAME) .

dev:
	-docker run -it --rm -v $(PWD)/app:/app -p $(HOST_PORT):8080 -p $(NGROK_PORT):4040 $(IMAGE_NAME) npm run dev

prod:
	-docker run -it --rm -v $(PWD)/app:/app -p $(HOST_PORT):8080 -p $(NGROK_PORT):4040 $(IMAGE_NAME)

bash:
	-docker run -it --rm -v $(PWD)/app:/app -p $(HOST_PORT):8080 -p $(NGROK_PORT):4040 $(IMAGE_NAME) /bin/bash

stop:
	-docker rm -f $(CONTAINER_NAME)
