push:
	heroku container:push web --app cuddlefish-hasura

release:
	heroku container:release web --app cuddlefish-hasura

push-and-release: push release
	@echo "Pushed and released to Heroku!"
