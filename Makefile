FILEPATH	=	./docker-compose.yml
COMPOSE		=	docker compose -f

# ------------  RULES  ------------------------------------------------------ #
all:			up

up:
			@$(COMPOSE) $(FILEPATH) up -d

down:
			@$(COMPOSE) $(FILEPATH) down

start:
			@$(COMPOSE) $(FILEPATH) start

stop:
			@$(COMPOSE) $(FILEPATH) stop

cleanimg:
			@docker image prune -a

cleanvol:
			@docker volume rm $(shell docker volume ls -q)

fclean:			down cleanimg

re:			fclean all

.PHONY:			all up down start stop cleanimg cleanvol fclean re
