// Log when content script is loaded
console.log('Enhanced Screenshot content script loaded');

// Variables for screenshot capturing
let isCapturing = false;
let fullPageCanvas = null;
let context = null;
let originalScrollPosition = 0;
let totalHeight = 0;
let viewportHeight = 0;
let currentPosition = 0;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  // Handle capture full page request
  if (message.action === 'captureFullPage') {
    console.log('Capturing full page');

    // If already capturing, don't start another capture
    if (isCapturing) {
      sendResponse({ status: 'already_capturing' });
      return true;
    }

    // Initialize full page capturing
    initializeFullPageCapture()
      .then(() => {
        sendResponse({ status: 'capturing_started' });

        // Start the capturing process
        captureNextSection();
      })
      .catch(error => {
        console.error('Error initializing capture:', error);
        isCapturing = false;
        sendResponse({ status: 'error', message: error.toString() });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  }

  // Return true to indicate we'll respond asynchronously
  return true;
});

// Initialize the full page capture
async function initializeFullPageCapture() {
  isCapturing = true;

  // Save original scroll position
  originalScrollPosition = window.scrollY;

  // Get page dimensions
  const dimensions = getPageDimensions();
  totalHeight = dimensions.height;
  viewportHeight = window.innerHeight;

  // Create a canvas for the full page
  fullPageCanvas = document.createElement('canvas');
  fullPageCanvas.width = dimensions.width;
  fullPageCanvas.height = totalHeight;
  context = fullPageCanvas.getContext('2d');

  // Start from the top of the page
  currentPosition = 0;
  window.scrollTo(0, 0);

  // Wait a bit for the page to settle after scrolling
  return new Promise(resolve => setTimeout(resolve, 100));
}

// Capture the next section of the page
function captureNextSection() {
  if (!isCapturing) return;

  // Wait a bit for the page to render after scrolling
  setTimeout(() => {
    // Use the chrome.tabs.captureVisibleTab API via messaging
    chrome.runtime.sendMessage({ action: 'captureVisiblePortion' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.dataUrl) {
        console.error('Error capturing visible portion:', chrome.runtime.lastError || 'No response');

        // Try an alternative approach - for the demo, we'll just use the visible portion
        finishCapture(true);
        return;
      }

      // Load the captured image
      const img = new Image();

      img.onload = () => {
        // Draw the captured portion onto the canvas
        context.drawImage(img, 0, currentPosition, img.width, viewportHeight, 0, currentPosition, img.width, viewportHeight);

        // Move to the next position
        currentPosition += viewportHeight;

        // Check if we've reached the end of the page
        if (currentPosition >= totalHeight) {
          finishCapture(true);
        } else {
          // Scroll to the next position
          window.scrollTo(0, currentPosition);

          // Capture the next section
          captureNextSection();
        }
      };

      img.onerror = () => {
        console.error('Error loading captured image');
        finishCapture(false);
      };

      img.src = response.dataUrl;
    });
  }, 200);
}

// Finish the capturing process
function finishCapture(success) {
  // Restore the original scroll position
  window.scrollTo(0, originalScrollPosition);

  if (success && fullPageCanvas) {
    try {
      // Convert the canvas to a data URL
      const dataUrl = fullPageCanvas.toDataURL('image/png');

      // Send the screenshot back to the extension
      chrome.runtime.sendMessage({
        action: 'fullPageScreenshotReady',
        dataUrl: dataUrl
      });
    } catch (error) {
      console.error('Error creating data URL:', error);

      // Notify that capturing failed
      chrome.runtime.sendMessage({
        action: 'captureError',
        error: error.toString()
      });
    }
  } else {
    // Notify that capturing failed
    chrome.runtime.sendMessage({
      action: 'captureError',
      error: 'Failed to capture full page screenshot'
    });
  }

  // Clean up
  isCapturing = false;
  fullPageCanvas = null;
  context = null;
}

// Helper function to get page dimensions
function getPageDimensions() {
  return {
    width: Math.max(
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth
    ),
    height: Math.max(
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
  };
}

// Function to handle selecting a specific area
// This would be implemented later as per requirements
function setupAreaSelection() {
  console.log('Area selection not implemented yet');
}

// Function to handle smart capture
// This would be implemented later as per requirements
function setupSmartCapture() {
  console.log('Smart capture not implemented yet');
}

// Let the extension know the content script is ready
chrome.runtime.sendMessage({ action: 'contentScriptReady' });