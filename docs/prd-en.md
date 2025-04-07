# Enhanced Screenshot Product Specification (Spec-En.md)

Enhanced Screenshot is a browser extension designed to provide advanced screenshot capabilities, improving user experience and productivity. This document describes the product's UI layout and interaction rules in detail.

## UI Layout

The product interface is presented as a popup defined in the `popup.html` file, with a fixed width of 400px and a maximum vertical height of 600px. If content exceeds this height, a scrollbar is displayed.

The interface is divided vertically into four functional areas:

### 1. Screenshot Mode Selection

Three horizontally aligned buttons execute different screenshot functionalities:

- **Visible Page**: Captures all visible content within the current browser window.
- **Select Area**: Allows users to freely select any area on the screen by dragging the mouse.
- **Smart Capture**: Automatically identifies and captures semantic elements on a webpage, such as social media posts or cards.

### 2. Preview Area

Displays the live visual preview of the final screenshot combined with the selected background color:

- Designed as a rounded rectangle with a grey dashed border.
- Screenshot content is centered, and the background color fills the preview area proportionally based on screenshot dimensions (fills either width or height, leaving white spaces where necessary).
- Padding adjusts the distance between the screenshot and background.
- The initial state shows a default placeholder with the prompt 'Capture Image'.
- Provides a quick-access button:
  - **Clear**: Quickly clears the current screenshot content.

### 3. Editing Area

Provides basic editing options arranged vertically:

- **Padding Adjustment**: Adjusts padding between screenshot and background, with a default preset value, selectable within a range of 0-100 (unit to be determined based on visible effect).
- **Background Color Selection**: Horizontally presents four modern gradient color options (each consisting of two colors, gradient direction from bottom-left to top-right), defaulting to the first option.
- **Corner Radius Adjustment**: Adjusts the corner radius of the screenshot, with a default of 5px, selectable between 0-30px.

### 4. Download Area

- Button text: "Download"
- Once customization is complete, clicking the download button saves the final screenshot to the user's local device.
- Default save location is the system's "Downloads" folder.
- If the preview area is empty, the download button is disabled.

---

### Additional Interaction Rules:

- When no screenshot is available in the preview area, editing functions in the Edit area are disabled, though users may pre-select background colors (which take effect after capturing).
- Background color selection is single-choice, defaulting to the first option.
- Padding adjusts the space between the screenshot and background.

---

### Additional Notes:

- The initial product version prioritizes the implementation of the Visible Page mode. Select Area and Smart Capture modes are temporarily disabled and will be enabled progressively in subsequent versions.
