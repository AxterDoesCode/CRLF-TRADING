.PHONY: npm python go activity_ui encoding_api history_service

npm:
	npm --version

python:
	python --version

go:
	go version

activity_ui: npm
	cd ActivityUI/activity-ui && npm install && npm run dev

encoding_api: python
	cd EncodingAPI && python manage.py runserver

history_service: go
	cd HistoryService && go build && ./m
