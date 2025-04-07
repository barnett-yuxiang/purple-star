// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureVisibleTab') {
    captureVisibleTab(sendResponse);
    return true; // Required for async sendResponse
  } else if (message.action === 'downloadScreenshot') {
    downloadScreenshot(message.dataUrl, message.filename);
    sendResponse({ success: true });
  }
});

// Function to capture the visible part of the tab
async function captureVisibleTab(sendResponse) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Capture the visible area
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    // Send the dataUrl back to the popup
    sendResponse({ success: true, dataUrl });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to download the screenshot
function downloadScreenshot(dataUrl, filename) {
  // Create a download
  chrome.downloads.download({
    url: dataUrl,
    filename: filename || 'screenshot.png',
    saveAs: false
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);

      // Show notification on error
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Download Failed',
        message: 'There was an error downloading your screenshot.'
      });
    } else {
      // Show notification on success
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Screenshot Saved',
        message: 'Your screenshot has been saved successfully.'
      });
    }
  });
}
