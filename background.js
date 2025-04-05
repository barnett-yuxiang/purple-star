// Log when the background script is initialized
console.log('Enhanced Screenshot background script initialized');

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'popupOpened') {
    console.log('Popup was opened');

    // Clear any old screenshots when popup is opened
    // This ensures we don't unnecessarily store screenshots long-term
    chrome.storage.local.remove('latestScreenshot', () => {
      console.log('Cleared previous screenshot data from storage');
    });
  }

  if (message.action === 'captureVisiblePortion') {
    // Capture the visible portion of the page
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing tab:', chrome.runtime.lastError);
        sendResponse({error: chrome.runtime.lastError.message});
      } else {
        sendResponse({dataUrl: dataUrl});
      }
    });
    return true; // Keep the message channel open for async response
  }

  if (message.action === 'fullPageScreenshotReady') {
    console.log('Full page screenshot is ready');

    // Store in local storage
    chrome.storage.local.set({ 'latestScreenshot': message.dataUrl }, () => {
      console.log('Full page screenshot saved to local storage');
    });

    // Forward to the popup if it's open
    chrome.runtime.sendMessage({
      action: 'screenshotReady',
      dataUrl: message.dataUrl
    });
  }

  if (message.action === 'captureError') {
    console.error('Screenshot capture error:', message.error);

    // Notify popup of error
    chrome.runtime.sendMessage({
      action: 'captureError',
      error: message.error
    });
  }

  if (message.action === 'downloadComplete') {
    // Show notification for successful download
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Enhanced Screenshot',
      message: 'Screenshot downloaded successfully!',
      priority: 2
    });
  }

  if (message.action === 'downloadError') {
    // Show notification for download error
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Enhanced Screenshot',
      message: 'Error downloading screenshot. Please try again.',
      priority: 2
    });
  }

  // Ensure the listener returns true for async responses
  return true;
});

// Function to capture a screenshot of a tab
function captureTab(tabId) {
  chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Error capturing tab:', chrome.runtime.lastError);
      return;
    }

    // We would send this to the popup for processing
    console.log('Tab captured. Data URL length:', dataUrl.length);

    // Store screenshot in local storage for retrieval by popup
    // This is temporary storage and will be cleared when popup is reopened
    chrome.storage.local.set({ 'latestScreenshot': dataUrl }, () => {
      console.log('Screenshot saved to local storage');

      // Notify popup that screenshot is ready
      chrome.runtime.sendMessage({
        action: 'screenshotReady',
        dataUrl: dataUrl
      });
    });
  });
}

// Function to capture full page screenshot (would require content script injection)
function captureFullPage(tabId) {
  // This would be implemented using a content script to scroll and capture multiple screenshots
  console.log('Full page screenshot not fully implemented');

  // For now, just capture the visible part
  captureTab(tabId);
}

// Log runtime errors
chrome.runtime.onError.addListener((error) => {
  console.error('Runtime error:', error);
});

// Clean up storage when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.remove('latestScreenshot', () => {
    console.log('Cleaned up screenshot data on extension unload');
  });
});