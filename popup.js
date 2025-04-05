document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced Screenshot popup loaded');

  // DOM Elements
  const fullPageBtn = document.getElementById('fullPageBtn');
  const selectAreaBtn = document.getElementById('selectAreaBtn');
  const smartCaptureBtn = document.getElementById('smartCaptureBtn');
  const aspectRatioSelect = document.getElementById('aspectRatio');
  const clearBtn = document.getElementById('clearBtn');
  const paddingSlider = document.getElementById('paddingSlider');
  const paddingValue = document.getElementById('paddingValue');
  const radiusSlider = document.getElementById('radiusSlider');
  const radiusValue = document.getElementById('radiusValue');
  const downloadBtn = document.getElementById('downloadBtn');
  const previewContent = document.getElementById('previewContent');
  const previewContainer = document.getElementById('previewContainer');
  const aspectContainer = document.getElementById('aspectContainer');
  const hintText = document.querySelector('.hint-text');
  const colorOptions = document.querySelectorAll('.color-option');

  // State
  let currentScreenshot = null;
  let currentSettings = {
    aspectRatio: aspectRatioSelect.value,
    padding: parseInt(paddingSlider.value),
    cornerRadius: parseInt(radiusSlider.value),
    backgroundGradient: null
  };

  // Event Listeners
  fullPageBtn.addEventListener('click', takeFullPageScreenshot);
  selectAreaBtn.addEventListener('click', takeSelectAreaScreenshot);
  smartCaptureBtn.addEventListener('click', takeSmartCaptureScreenshot);
  clearBtn.addEventListener('click', clearScreenshot);
  aspectRatioSelect.addEventListener('change', updateAspectRatio);
  paddingSlider.addEventListener('input', updatePadding);
  radiusSlider.addEventListener('input', updateCornerRadius);
  downloadBtn.addEventListener('click', downloadScreenshot);

  // Set up color options
  colorOptions.forEach(option => {
    option.style.backgroundImage = option.dataset.gradient;
    option.addEventListener('click', () => {
      // If this is already selected, unselect it
      if (option.dataset.selected === "true") {
        option.dataset.selected = "false";
        currentSettings.backgroundGradient = null;
      } else {
        // Remove selection from all options
        colorOptions.forEach(opt => opt.dataset.selected = "false");
        // Set this one as selected
        option.dataset.selected = "true";
        currentSettings.backgroundGradient = option.dataset.gradient;
      }

      // Enable or disable the clear button based on if there's a background or screenshot
      updateClearButtonState();

      // Update the preview
      updatePreview();
    });
  });

  // Initialize aspect container with correct ratio
  initializeAspectRatio();

  // Functions
  function initializeAspectRatio() {
    updateAspectContainerSize();
  }

  function updateAspectContainerSize() {
    // Get aspect ratio values
    const [width, height] = currentSettings.aspectRatio.split(':').map(Number);
    const ratio = width / height;

    // Get container dimensions
    const containerWidth = previewContainer.clientWidth;
    const containerHeight = previewContainer.clientHeight;

    // Calculate dimensions for the aspect container
    let newWidth, newHeight;

    if (containerWidth / containerHeight > ratio) {
      // Container is wider than the aspect ratio
      newHeight = containerHeight;
      newWidth = newHeight * ratio;
    } else {
      // Container is taller than the aspect ratio
      newWidth = containerWidth;
      newHeight = newWidth / ratio;
    }

    // Update the aspect container size
    aspectContainer.style.width = `${newWidth}px`;
    aspectContainer.style.height = `${newHeight}px`;
  }

  function updateClearButtonState() {
    // Enable clear button if there's a screenshot or background selected
    if (currentScreenshot || currentSettings.backgroundGradient) {
      clearBtn.disabled = false;
    } else {
      clearBtn.disabled = true;
    }
  }

  function takeFullPageScreenshot() {
    console.log('Taking full page screenshot');
    fullPageBtn.disabled = true;
    fullPageBtn.textContent = 'Capturing...';

    // Show a capturing indicator in the preview
    hintText.textContent = 'Capturing full page...';
    hintText.style.display = 'block';

    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        finishCapturing(false);
        return;
      }

      const activeTab = tabs[0];

      // First, try to use the Chrome API to capture the visible part
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
        if (chrome.runtime.lastError) {
          console.error('Error capturing tab:', chrome.runtime.lastError);
          finishCapturing(false);
          return;
        }

        // For the full page, we need to communicate with the content script
        chrome.tabs.sendMessage(activeTab.id, {action: "captureFullPage"}, function(response) {
          if (chrome.runtime.lastError || !response) {
            console.log('Content script not ready or not available, injecting it...');

            // Inject the content script
            chrome.scripting.executeScript({
              target: {tabId: activeTab.id},
              files: ['content-script.js']
            }, function() {
              if (chrome.runtime.lastError) {
                console.error('Failed to inject content script:', chrome.runtime.lastError);
                // Fall back to using just the visible part
                processScreenshot(dataUrl);
              } else {
                // Try again after injection
                setTimeout(() => {
                  chrome.tabs.sendMessage(activeTab.id, {action: "captureFullPage"}, function(response) {
                    if (chrome.runtime.lastError || !response) {
                      // Still failing, use the visible part
                      processScreenshot(dataUrl);
                    }
                  });
                }, 500);
              }
            });
          } else {
            // Content script responded, we should receive the full screenshot soon
            // For now, we'll use the visible part
            processScreenshot(dataUrl);
          }
        });
      });
    });
  }

  function finishCapturing(success) {
    fullPageBtn.disabled = false;
    fullPageBtn.textContent = 'Full Page';

    if (!success) {
      hintText.textContent = 'Capture failed. Try again.';
      setTimeout(() => {
        hintText.textContent = 'Capture Image';
      }, 2000);
    }
  }

  function processScreenshot(dataUrl) {
    if (!dataUrl) {
      finishCapturing(false);
      return;
    }

    // Save the screenshot data
    currentScreenshot = dataUrl;

    // Update UI
    updateClearButtonState();
    downloadBtn.disabled = false;

    // Enable corner radius control
    radiusSlider.disabled = false;

    // Update preview
    updatePreview();

    // Finish the capturing process
    finishCapturing(true);

    // Store the screenshot in local storage for retrieval if needed
    chrome.storage.local.set({ 'latestScreenshot': dataUrl }, () => {
      console.log('Screenshot saved to local storage');
    });
  }

  function takeSelectAreaScreenshot() {
    console.log('Select Area feature not implemented yet');
    // This feature would be implemented later as per your instructions
  }

  function takeSmartCaptureScreenshot() {
    console.log('SmartCapture feature not implemented yet');
    // This feature would be implemented later as per your instructions
  }

  function updatePreview() {
    // First, ensure the aspect container is the right size
    updateAspectContainerSize();

    // Apply background to the aspect container if selected
    if (currentSettings.backgroundGradient) {
      aspectContainer.style.backgroundImage = currentSettings.backgroundGradient;
    } else {
      aspectContainer.style.backgroundImage = 'none';
    }

    // Handle the screenshot preview
    if (!currentScreenshot) {
      // Show hint text if no screenshot
      hintText.style.display = 'block';
      previewContent.innerHTML = '';

      // Disable corner radius control
      radiusSlider.disabled = true;
      return;
    }

    // Hide hint text
    hintText.style.display = 'none';

    // Enable corner radius control
    radiusSlider.disabled = false;

    // Clear previous content
    previewContent.innerHTML = '';

    // Create image element for the screenshot
    const img = document.createElement('img');
    img.src = currentScreenshot;
    img.style.borderRadius = `${currentSettings.cornerRadius}px`;

    // Apply padding to the image
    const paddingSize = `${currentSettings.padding}px`;
    img.style.maxWidth = `calc(100% - ${currentSettings.padding * 2}px)`;
    img.style.maxHeight = `calc(100% - ${currentSettings.padding * 2}px)`;

    // Add the image to the preview
    previewContent.appendChild(img);
  }

  function clearScreenshot() {
    // Clear screenshot if there is one
    if (currentScreenshot) {
      currentScreenshot = null;
      downloadBtn.disabled = true;
      radiusSlider.disabled = true;
    }

    // Clear background selection if there is one
    if (currentSettings.backgroundGradient) {
      currentSettings.backgroundGradient = null;
      // Remove selection from all color options
      colorOptions.forEach(opt => opt.dataset.selected = "false");
    }

    // Update clear button state
    updateClearButtonState();

    // Show hint text
    hintText.textContent = 'Capture Image';
    hintText.style.display = 'block';
    previewContent.innerHTML = '';

    // Clear background from container
    aspectContainer.style.backgroundImage = 'none';

    // Clear the stored screenshot from local storage
    chrome.storage.local.remove('latestScreenshot', () => {
      console.log('Cleared screenshot data from storage');
    });
  }

  function updateAspectRatio() {
    currentSettings.aspectRatio = aspectRatioSelect.value;
    updatePreview();
  }

  function updatePadding() {
    currentSettings.padding = parseInt(paddingSlider.value);
    paddingValue.textContent = `${currentSettings.padding}px`;
    updatePreview();
  }

  function updateCornerRadius() {
    currentSettings.cornerRadius = parseInt(radiusSlider.value);
    radiusValue.textContent = `${currentSettings.cornerRadius}px`;
    updatePreview();
  }

  function downloadScreenshot() {
    if (!currentScreenshot) return;

    // Disable the download button during processing
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';

    // Create a canvas with the screenshot and the background
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
      try {
        // Get aspect ratio
        const [width, height] = currentSettings.aspectRatio.split(':').map(Number);
        const ratio = width / height;

        // Calculate canvas dimensions
        let canvasWidth, canvasHeight;

        if (img.width / img.height > ratio) {
          // Image is wider than the desired aspect ratio
          canvasWidth = img.width + (currentSettings.padding * 2);
          canvasHeight = canvasWidth / ratio;
        } else {
          // Image is taller than the desired aspect ratio
          canvasHeight = img.height + (currentSettings.padding * 2);
          canvasWidth = canvasHeight * ratio;
        }

        // Set canvas size
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // If background is selected, draw it
        if (currentSettings.backgroundGradient) {
          // Create a temporary canvas for the gradient background
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;

          // Create gradient
          const gradient = parseGradient(currentSettings.backgroundGradient, tempCtx);
          tempCtx.fillStyle = gradient;
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Draw background gradient to main canvas
          ctx.drawImage(tempCanvas, 0, 0);
        } else {
          // If no background selected, fill with white
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Calculate centered position for the image
        const x = (canvas.width - img.width) / 2;
        const y = (canvas.height - img.height) / 2;

        // Apply corner radius to the image
        if (currentSettings.cornerRadius > 0) {
          // Save the canvas state
          ctx.save();

          // Create a path for the rounded rectangle
          roundedRect(ctx, x, y, img.width, img.height, currentSettings.cornerRadius);

          // Clip to the path
          ctx.clip();

          // Draw the image
          ctx.drawImage(img, x, y);

          // Restore the canvas state
          ctx.restore();
        } else {
          // Just draw the image normally
          ctx.drawImage(img, x, y);
        }

        // Convert to data URL and prepare for download
        const dataUrl = canvas.toDataURL('image/png');

        // Use chrome.downloads API for better handling
        chrome.downloads.download({
          url: dataUrl,
          filename: `screenshot-${new Date().toISOString().slice(0, 10)}.png`,
          saveAs: false
        }, (downloadId) => {
          // Reset download button
          downloadBtn.disabled = false;
          downloadBtn.textContent = 'Download Screenshot';

          if (chrome.runtime.lastError) {
            console.error('Download error:', chrome.runtime.lastError);
            chrome.runtime.sendMessage({ action: 'downloadError' });
            return;
          }

          // Notify background script that download was successful
          chrome.runtime.sendMessage({ action: 'downloadComplete' });
        });
      } catch (error) {
        console.error('Error processing screenshot for download:', error);

        // Reset download button
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download Screenshot';

        // Notify background script of the error
        chrome.runtime.sendMessage({ action: 'downloadError' });
      }
    };

    img.onerror = function() {
      console.error('Error loading image for download');

      // Reset download button
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download Screenshot';

      // Notify background script of the error
      chrome.runtime.sendMessage({ action: 'downloadError' });
    };

    img.src = currentScreenshot;
  }

  // Helper function to draw a rounded rectangle
  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function parseGradient(gradientString, ctx) {
    // If no gradient provided, return white
    if (!gradientString) return '#ffffff';

    // Extract gradient details from the CSS gradient string
    const match = gradientString.match(/linear-gradient\((.*?),(.*?),(.*?)\)/);
    if (!match) return '#ffffff'; // Default white if pattern doesn't match

    const direction = match[1].trim();
    const color1 = match[2].trim();
    const color2 = match[3].trim();

    let gradient;

    if (direction.includes('deg')) {
      // Convert degree-based gradient
      const deg = parseFloat(direction);
      const radian = (deg * Math.PI) / 180;

      // Calculate start and end points
      const x0 = 0.5 + 0.5 * Math.cos(radian + Math.PI);
      const y0 = 0.5 + 0.5 * Math.sin(radian + Math.PI);
      const x1 = 0.5 + 0.5 * Math.cos(radian);
      const y1 = 0.5 + 0.5 * Math.sin(radian);

      gradient = ctx.createLinearGradient(
        x0 * ctx.canvas.width,
        y0 * ctx.canvas.height,
        x1 * ctx.canvas.width,
        y1 * ctx.canvas.height
      );
    } else if (direction === 'to right') {
      gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    } else {
      // Default to top-to-bottom for other cases
      gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    }

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    return gradient;
  }

  // When the popup opens, check for a stored screenshot
  chrome.storage.local.get(['latestScreenshot'], (result) => {
    if (result.latestScreenshot) {
      // Restore the previous screenshot if it exists
      processScreenshot(result.latestScreenshot);
    }
  });

  // Notify background script
  chrome.runtime.sendMessage({action: 'popupOpened'});

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'screenshotReady' && message.dataUrl) {
      processScreenshot(message.dataUrl);
    }
    return true;
  });

  // Handle window resize
  window.addEventListener('resize', updateAspectContainerSize);
});