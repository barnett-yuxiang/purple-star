.PHONY: check package clean help

# Extract version from manifest.json
VERSION := $(shell grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
PACKAGE_NAME := enhanced-screenshot-v$(VERSION).zip
DIST_DIR := dist

# JavaScript files to check
JS_FILES := background.js content-script.js popup.js

help:
	@echo "Enhanced Screenshot - Build Commands"
	@echo "====================================="
	@echo "make check   - Check JavaScript syntax"
	@echo "make package - Package extension"
	@echo "make clean   - Remove dist directory"
	@echo ""
	@echo "Current version: $(VERSION)"

# Check JavaScript syntax
check:
	@echo "Checking JavaScript syntax..."
	@errors=0; \
	for file in $(JS_FILES); do \
		if node --check $$file 2>/dev/null; then \
			echo "[OK] $$file"; \
		else \
			echo "[ERROR] $$file - syntax error"; \
			node --check $$file; \
			errors=$$((errors + 1)); \
		fi \
	done; \
	if [ $$errors -eq 0 ]; then \
		echo ""; \
		echo "All JavaScript files passed syntax check"; \
	else \
		echo ""; \
		echo "Found $$errors file(s) with syntax errors"; \
		exit 1; \
	fi

# Package extension
package:
	@echo "Packaging v$(VERSION)..."
	@mkdir -p $(DIST_DIR)
	@zip -r $(DIST_DIR)/$(PACKAGE_NAME) \
		manifest.json \
		background.js \
		content-script.js \
		popup.html \
		popup.css \
		popup.js \
		icons/
	@echo "Package created: $(DIST_DIR)/$(PACKAGE_NAME)"

# Clean dist directory
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(DIST_DIR)
	@echo "Clean complete"
