# Enhanced Screenshot Extension

A Chrome extension designed to enhance screenshot functionality with beautiful backgrounds and customization options.

## Features

- **Full Page Screenshots**: Capture the entire webpage content, including scrolling areas.
- **Customization Options**:
  - Adjust padding between screenshot and background
  - Choose from multiple background gradient options
  - Customize corner radius
  - Select different aspect ratios (1:1, 4:3, 16:9)
- **Easy Download**: Simple one-click download of enhanced screenshots

## Installation

### Development Mode

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Enhanced Screenshot extension should now appear in your extensions list

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store
2. Search for "Enhanced Screenshot"
3. Click "Add to Chrome"

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Select a screenshot mode:
   - **Full Page**: Captures the entire webpage
   - **Select Area**: (Coming soon) Manually select an area to capture
   - **SmartCapture**: (Coming soon) Automatically identify and capture UI elements
3. Customize your screenshot with the available options
4. Click "Download" to save the enhanced image

## Project Structure

- `popup.html` - The main extension popup UI
- `popup.js` - JavaScript for the popup functionality
- `styles.css` - Styling for the popup UI
- `background.js` - Background script for extension functionality
- `content-script.js` - Content script for interacting with web pages
- `manifest.json` - Extension configuration file

## Development

### Future Enhancements

- Implement Select Area functionality for manual region selection
- Implement SmartCapture for intelligent UI element detection
- Add more background style options
- Add text overlay capabilities

## License

MIT License
