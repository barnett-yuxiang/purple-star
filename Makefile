.PHONY: build clean

# Build the extension zip package
build:
	@echo "Building Enhanced Screenshot extension package..."
	@zip -r enhanced-screenshot.zip . -x ".git*" -x ".github/*" -x "*.yml" -x "*.md" -x ".DS_Store" -x "node_modules/*" -x "*.gitignore" -x "publish/*" -x "Makefile"
	@echo "Package created: enhanced-screenshot.zip"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -f enhanced-screenshot.zip
	@echo "Clean complete"
