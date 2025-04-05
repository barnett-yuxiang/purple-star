# Enhanced Screenshot Product Specification (Spec-En.md)

Enhanced Screenshot is a browser extension designed to enhance screenshot functionality, improving user experience and efficiency. This document details the product’s UI layout and interaction rules.

## UI Layout

The interface is presented in a popup window defined in `popup.html`, with a fixed width of 400px and a maximum height of 600px vertically. A scrollbar will appear if content exceeds this height.

The interface comprises four functional sections, arranged vertically from top to bottom:

### 1. Screenshot Mode Selection

Three buttons aligned horizontally to execute different screenshot modes:

- **Full Page**: Captures the entire webpage content, including scrolling areas.
- **Select Area**: Users manually select and capture any area on the screen by dragging the mouse.
- **SmartCapture**: Intelligent capture mode, automatically recognizing and selecting semantic elements such as social media cards (e.g., Twitter or Instagram posts).

### 2. Preview Section

Displays a live preview of the screenshot, including content and background:

- Visually designed as a rounded rectangle with a grey dashed border.
- Screenshot content and background are centrally displayed in the selected aspect ratio. Initially shows a placeholder with distinct foreground and background colors for easy differentiation.
- Two quick-action buttons positioned horizontally in the top-right corner:
  - **Aspect Ratio Selection**: Provides three predefined options (1:1, 4:3, 16:9) as a dropdown, indicating the currently selected ratio.
  - **Clear Button**: Quickly clears the current screenshot content, reverting to the default placeholder.

### 3. Screenshot and Background Editing Section

Offers simple editing features vertically arranged from top to bottom:

- **Padding Adjustment**: Adjusts the padding between the screenshot and background, defaulting to 45px, adjustable between 0-100px.
- **Background Color Selection**: Displays four modern gradient color options horizontally, each presented as a rectangle.
- **Corner Radius Adjustment**: Adjusts the corner radius of the screenshot image, ranging from 0-30px.

### 4. Download Section

- After completing customizations, users can click the download button to save the screenshot.
- Screenshots are saved to the system's default "Downloads" folder.
- The download button is disabled when the preview section is empty and becomes enabled only when screenshot content is available.
