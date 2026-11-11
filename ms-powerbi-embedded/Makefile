.PHONY: build up down logs shell test

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f --tail=100

shell:
	docker exec -it powerbi-api /bin/bash

redis-cli:
	docker exec -it powerbi-redis redis-cli

test:
	ENVIRONMENT=test pytest tests/ -v
