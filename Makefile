lint:
	yarn -s run eslint --color uppie.js

test: lint

min:
	yarn -s run terser uppie.js -o uppie.min.js --mangle --compress --unsafe --comments '/uppie/' && wc -c uppie.min.js
	cat README.md | sed -E "s/[0-9]+ bytes/$$(yarn -s run gzip-size --raw uppie.min.js) bytes/" > README.md

deps:
	rm -rf node_modules
	yarn

update:
	yarn -s run updates -cu
	$(MAKE) deps

publish:
	npm publish
	git push -u --follow-tags

patch: test
	yarn -s run versions -Cac 'make min' patch uppie.js uppie.min.js
	$(MAKE) publish

minor: test min
	yarn -s run versions -Cac 'make min' minor uppie.js uppie.min.js
	$(MAKE) publish

major: test min
	yarn -s run versions -Cac 'make min' major uppie.js uppie.min.js
	$(MAKE) publish

.PHONY: lint test min deps update publish patch minor major

