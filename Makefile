SOURCE_FILES := index.ts
DIST_FILES := dist/index.js

node_modules: pnpm-lock.yaml
	pnpm install
	@touch node_modules

.PHONY: deps
deps: node_modules

.PHONY: lint
lint: node_modules
	pnpm exec eslint-silverwind --color .
	pnpm exec tsgo

.PHONY: lint-fix
lint-fix: node_modules
	pnpm exec eslint-silverwind --color . --fix
	pnpm exec tsgo

.PHONY: browsers
browsers: node_modules
	pnpm exec playwright install --only-shell chromium firefox webkit

.PHONY: test
test: browsers
	pnpm exec vitest

.PHONY: test-update
test-update: browsers
	pnpm exec vitest -u

.PHONY: build
build: node_modules $(DIST_FILES)

$(DIST_FILES): $(SOURCE_FILES) pnpm-lock.yaml tsdown.config.ts
	pnpm exec tsdown

.PHONY: publish
publish: build
	pnpm publish --no-git-checks

.PHONY: update
update: update-js update-actions

.PHONY: update-js
update-js: node_modules
	pnpm exec updates -u -f package.json
	rm -rf node_modules pnpm-lock.yaml
	pnpm install
	@touch node_modules

.PHONY: patch minor major
patch minor major: node_modules lint test build
	pnpm exec versions -R $@ package.json

.PHONY: update-actions
update-actions: node_modules
	pnpm exec updates -u -M actions
