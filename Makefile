SOURCE_FILES := index.ts
DIST_FILES := dist/index.js

node_modules: pnpm-lock.yaml
	pnpm install
	@touch node_modules

.PHONY: deps
deps: node_modules

.PHONY: lint
lint: node_modules
	pnpm exec eslint --color .
	pnpm exec tsc

.PHONY: lint-fix
lint-fix: node_modules
	pnpm exec eslint --color . --fix
	pnpm exec tsc

.PHONY: test
test: node_modules
	pnpm exec vitest

.PHONY: test-update
test-update: node_modules
	pnpm exec vitest -u

.PHONY: build
build: node_modules $(DIST_FILES)

$(DIST_FILES): $(SOURCE_FILES) pnpm-lock.yaml vite.config.ts
	pnpm exec vite build

.PHONY: publish
publish: node_modules
	git push -u --tags origin master
	pnpm publish

.PHONY: update
update: node_modules
	pnpm exec updates -cu
	rm -rf node_modules pnpm-lock.yaml
	pnpm install
	@touch node_modules

.PHONY: path
patch: node_modules lint test build
	pnpm exec versions patch package.json pnpm-lock.yaml
	@$(MAKE) --no-print-directory publish

.PHONY: minor
minor: node_modules lint test build
	pnpm exec versions minor package.json pnpm-lock.yaml
	@$(MAKE) --no-print-directory publish

.PHONY: major
major: node_modules lint test build
	pnpm exec versions major package.json pnpm-lock.yaml
	@$(MAKE) --no-print-directory publish
