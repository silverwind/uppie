
lint:
	eslint --color --quiet --ignore-pattern *.min.js .

min:
	uglifyjs uppie.js -o uppie.min.js --mangle --compress --screw-ie8 --unsafe --comments '/uppie/' && wc -c uppie.min.js

publish:
	npm publish
	git push --follow-tags

patch:
	$(MAKE) lint
	$(MAKE) min
	npm version patch
	$(MAKE) publish

minor:
	$(MAKE) lint
	$(MAKE) min
	npm version minor
	$(MAKE) publish

major:
	$(MAKE) lint
	$(MAKE) min
	npm version major
	$(MAKE) publish

.PHONY: lint min publish patch minor major
