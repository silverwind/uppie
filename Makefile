VERSION := $(shell jq -r .version < package.json)

lint:
	npx eslint --color --quiet --ignore-pattern *.min.js .

test:
	$(MAKE) lint

min:
	npx uglifyjs uppie.js -o uppie.min.js --mangle --compress --unsafe --comments '/uppie/' && wc -c uppie.min.js
	cat README.md | sed -E "s/[0-9]+ bytes/$$($(BIN)/gzip-size --raw uppie.min.js) bytes/" > README.md
	git diff --exit-code &>/dev/null || git commit -am "rebuild"

update:
	npx updates -u
	rm -rf node_modules
	npm i --no-package-lock

publish:
	npm publish
	git push -u --follow-tags

patch:
	$(MAKE) lint
	cat uppie.min.js | sed -E "s/v[0-9\.]+/v$$($(BIN)/semver -i patch $(VERSION))/" > uppie.min.js
	cat uppie.js | sed -E "s/v[0-9\.]+/v$$($(BIN)/semver -i patch $(VERSION))/" > uppie.js
	git diff --exit-code &>/dev/null || git commit -am "bump version"
	$(MAKE) min
	npx ver patch
	$(MAKE) publish

minor:
	$(MAKE) lint
	cat uppie.min.js | sed -E "s/v[0-9\.]+/v$$($(BIN)/semver -i minor $(VERSION))/" > uppie.min.js
	cat uppie.js | sed -E "s/v[0-9\.]+/v$$($(BIN)/semver -i minor $(VERSION))/" > uppie.js
	git diff --exit-code &>/dev/null || git commit -am "bump version"
	$(MAKE) min
	npx ver minor
	$(MAKE) publish

major:
	$(MAKE) lint
	cat uppie.min.js | sed -E "s/v[0-9\.]+/v$$($(BIN)/semver -i major $(VERSION))/" > uppie.min.js
	cat uppie.js | sed -E "s/v[0-9\.]+/v$$($(BIN)/semver -i major $(VERSION))/" > uppie.js
	git diff --exit-code &>/dev/null || git commit -am "bump version"
	$(MAKE) min
	npx ver major
	$(MAKE) publish

.PHONY: lint test min update publish patch minor major

