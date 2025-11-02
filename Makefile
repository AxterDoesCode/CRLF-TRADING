.PHONY: npm python go activity_ui encoding_api test_encoding_api history_service trading_api test

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

test_encoding_api: python
	cd EncodingAPI && pytest .

history_service: go
	cd HistoryService && go build && ./m

trading_api: npm
	cd TradingAPI && npm install && node index.js

test: test_encoding_api
