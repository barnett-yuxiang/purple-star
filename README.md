# Enhanced Screenshot

Enhanced Screenshot is a browser extension that allows you to capture and customize screenshots with various background options and rounded corners.

## Features

- Capture visible tab screenshot
- Apply solid color or gradient background
- Add padding and rounded corners to the screenshot
- Save the customized screenshot

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/enhanced-screenshot.git
    ```
2. Navigate to the project directory:
    ```sh
    cd enhanced-screenshot
    ```
3. Load the extension in your browser:
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the project directory

## Usage

1. Click the extension icon to open the popup.
2. Click "Capture Screen" to take a screenshot of the current tab.
3. Customize the screenshot using the available controls.
4. Click "Save Image" to download the customized screenshot.

## Build

To create a ZIP file of the extension for distribution, use the provided GitHub Actions workflow:

1. Trigger the workflow manually from the GitHub Actions tab.
2. The ZIP file will be available as an artifact in the workflow run.

## License

This project is licensed under the MIT License.
