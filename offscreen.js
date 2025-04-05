// Offscreen document for handling operations that require a DOM
// Used for full page screenshots and image processing

console.log('Offscreen document loaded');

// Canvas element for image manipulation
const canvas = document.getElementById('screenshotCanvas');
const ctx = canvas.getContext('2d');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Offscreen received message:', message);

  if (message.action === 'processFullPageScreenshot') {
    processFullPageScreenshot(message.screenshots, message.settings);
    sendResponse({ status: 'processing' });
  }

  if (message.action === 'applyEffects') {
    applyEffects(message.imageData, message.settings);
    sendResponse({ status: 'processing' });
  }

  // Return true to indicate async response
  return true;
});

// Process multiple screenshots into a single full-page image
async function processFullPageScreenshot(screenshots, settings) {
  console.log('Processing full page screenshot with', screenshots.length, 'parts');

  // This is a placeholder for future implementation
  // Would combine multiple screenshots into one full page image

  // For now, we'll just use the first screenshot if available
  if (screenshots && screenshots.length > 0) {
    const result = screenshots[0];

    // Send the processed result back
    chrome.runtime.sendMessage({
      action: 'fullPageScreenshotReady',
      dataUrl: result
    });
  }
}

// Apply visual effects to an image
async function applyEffects(imageData, settings) {
  console.log('Applying effects with settings:', settings);

  // This is a placeholder for future implementation
  // Would apply filters, borders, and other effects to the screenshot

  // Send the unmodified image back for now
  chrome.runtime.sendMessage({
    action: 'effectsApplied',
    dataUrl: imageData
  });
}

// Let the extension know the offscreen document is ready
chrome.runtime.sendMessage({ action: 'offscreenReady' });