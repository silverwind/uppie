lint:
	npx eslint --color --quiet --ignore-pattern *.min.js .

test:
	$(MAKE) lint

min:
	npx terser uppie.js -o uppie.min.js --mangle --compress --unsafe --comments '/uppie/' && wc -c uppie.min.js
	cat README.md | sed -E "s/[0-9]+ bytes/$$(npx gzip-size --raw uppie.min.js) bytes/" > README.md

deps:
	rm -rf node_modules
	npm i

update:
	npx updates -cu
	$(MAKE) deps

publish:
	npm publish
	git push -u --follow-tags

patch:
	$(MAKE) test
	$(MAKE) min
	npx ver patch uppie.js uppie.min.js
	$(MAKE) publish

minor:
	$(MAKE) test
	$(MAKE) min
	npx ver minor uppie.js uppie.min.js
	$(MAKE) publish

major:
	$(MAKE) test
	$(MAKE) min
	npx ver major uppie.js uppie.min.js
	$(MAKE) publish

.PHONY: lint test min deps update publish patch minor major

