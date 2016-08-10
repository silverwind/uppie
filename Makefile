
lint:
	eslint --color --quiet --ignore-pattern *.min.js .

min:
	uglifyjs uppie.js -o uppie.min.js --mangle --compress --screw-ie8 --unsafe --comments '/uppie/' && wc -c uppie.min.js
	cat README.md | sed -E "s/([0-9]+) bytes/$$(gzip-size uppie.min.js) bytes/g" > README.md
	git diff --exit-code &>/dev/null || git commit -am "rebuild"

bump:
	cat uppie.min.js | perl -pe "s|v[\d\.]+|v$$(jq -r .version < package.json)|" > uppie.min.js
	cat uppie.js | perl -pe "s|v[\d\.]+|v$$(jq -r .version < package.json)|" > uppie.js
	git diff --exit-code &>/dev/null || git commit -am "bump version"

publish:
	npm publish
	git push -u --follow-tags

patch:
	$(MAKE) lint
	$(MAKE) bump
	$(MAKE) min
	npm version patch
	$(MAKE) publish

minor:
	$(MAKE) lint
	$(MAKE) bump
	$(MAKE) min
	npm version minor
	$(MAKE) publish

major:
	$(MAKE) lint
	$(MAKE) bump
	$(MAKE) min
	npm version major
	$(MAKE) publish

.PHONY: lint min publish patch minor major
