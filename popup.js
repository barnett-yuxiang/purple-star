document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const visiblePageBtn = document.getElementById('visiblePage');
  const selectAreaBtn = document.getElementById('selectArea');
  const smartCaptureBtn = document.getElementById('smartCapture');
  const previewContainer = document.getElementById('preview-container');
  const placeholder = document.getElementById('placeholder');
  const screenshotPreview = document.getElementById('screenshot-preview');
  const clearBtn = document.getElementById('clear-btn');
  const paddingRange = document.getElementById('padding-range');
  const paddingValue = document.getElementById('padding-value');
  const radiusRange = document.getElementById('radius-range');
  const radiusValue = document.getElementById('radius-value');
  const downloadBtn = document.getElementById('download-btn');
  const bgColorOptions = document.querySelectorAll('.bg-color-option');

  // State variables
  let currentScreenshot = null;
  let currentBackgroundClass = 'gradient-1';

  // Event Listeners
  visiblePageBtn.addEventListener('click', captureVisibleTab);
  clearBtn.addEventListener('click', clearScreenshot);
  downloadBtn.addEventListener('click', downloadScreenshot);

  // Padding range slider
  paddingRange.addEventListener('input', function() {
    const value = this.value;
    paddingValue.textContent = `${value}px`;
    applyPadding(value);
  });

  // Corner radius slider
  radiusRange.addEventListener('input', function() {
    const value = this.value;
    radiusValue.textContent = `${value}px`;
    applyRadius(value);
  });

  // Background color options
  bgColorOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove active class from all options
      bgColorOptions.forEach(opt => opt.classList.remove('active'));

      // Add active class to selected option
      this.classList.add('active');

      // Update current background class
      currentBackgroundClass = this.dataset.gradient;

      // Apply the background if screenshot exists
      if (currentScreenshot) {
        applyBackground(currentBackgroundClass);
      }
    });
  });

  // Functions
  function captureVisibleTab() {
    // Show loading state
    placeholder.textContent = 'Capturing...';

    // Send message to background script to capture the visible tab
    chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, response => {
      if (response && response.success) {
        // Store the screenshot
        currentScreenshot = response.dataUrl;

        // Update the UI
        updatePreview(response.dataUrl);

        // Enable editing controls
        enableEditingControls();
      } else {
        // Show error
        placeholder.textContent = 'Failed to capture screenshot';
        console.error('Screenshot capture failed:', response?.error || 'Unknown error');
      }
    });
  }

  function updatePreview(dataUrl) {
    // Hide placeholder
    placeholder.style.display = 'none';

    // Set the image source
    screenshotPreview.src = dataUrl;
    screenshotPreview.style.display = 'block';

    // Apply styling based on current settings
    applyPadding(paddingRange.value);
    applyRadius(radiusRange.value);
    applyBackground(currentBackgroundClass);

    // Enable the clear and download buttons
    clearBtn.disabled = false;
    downloadBtn.disabled = false;
  }

  function clearScreenshot() {
    // Reset the preview
    screenshotPreview.src = '';
    screenshotPreview.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Capture Image';

    // Reset state
    currentScreenshot = null;

    // Reset background color to the first option
    bgColorOptions.forEach(opt => opt.classList.remove('active'));
    bgColorOptions[0].classList.add('active');
    currentBackgroundClass = 'gradient-1';

    // Remove gradient class from preview container
    previewContainer.classList.remove('gradient-1', 'gradient-2', 'gradient-3', 'gradient-4');

    // Disable editing controls
    disableEditingControls();
  }

  function downloadScreenshot() {
    if (!currentScreenshot) return;

    // Create a canvas to combine the screenshot with the background
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a temporary image to get the original dimensions
    const tempImg = new Image();
    tempImg.onload = function() {
      // Set canvas size based on image dimensions with padding
      const padding = parseInt(paddingRange.value);
      canvas.width = tempImg.width + (padding * 2);
      canvas.height = tempImg.height + (padding * 2);

      // Fill with the selected background gradient
      const gradient = getGradient(ctx, canvas.width, canvas.height, currentBackgroundClass);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image with padding
      ctx.drawImage(tempImg, padding, padding, tempImg.width, tempImg.height);

      // Apply corner radius (if needed in the future)
      // This would require a more complex approach with clipping paths

      // Convert to data URL and download
      const finalDataUrl = canvas.toDataURL('image/png');

      // Send message to background script to download
      chrome.runtime.sendMessage({
        action: 'downloadScreenshot',
        dataUrl: finalDataUrl,
        filename: `screenshot_${getTimestamp()}.png`
      });
    };

    // Set the source to trigger the onload event
    tempImg.src = currentScreenshot;
  }

  function getGradient(ctx, width, height, gradientClass) {
    // Create gradient at 45 degrees
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    switch (gradientClass) {
      case 'gradient-1':
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#4ECDC4');
        break;
      case 'gradient-2':
        gradient.addColorStop(0, '#A8E6CF');
        gradient.addColorStop(1, '#FFD3B6');
        break;
      case 'gradient-3':
        gradient.addColorStop(0, '#3494E6');
        gradient.addColorStop(1, '#EC6EAD');
        break;
      case 'gradient-4':
        gradient.addColorStop(0, '#DAE2F8');
        gradient.addColorStop(1, '#D6A4A4');
        break;
      default:
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#4ECDC4');
    }

    return gradient;
  }

  function applyPadding(value) {
    if (screenshotPreview.style.display === 'block') {
      screenshotPreview.style.padding = `${value}px`;
    }
  }

  function applyRadius(value) {
    if (screenshotPreview.style.display === 'block') {
      screenshotPreview.style.borderRadius = `${value}px`;
    }
  }

  function applyBackground(gradientClass) {
    if (screenshotPreview.style.display === 'block') {
      // Remove all gradient classes
      previewContainer.classList.remove('gradient-1', 'gradient-2', 'gradient-3', 'gradient-4');

      // Add the selected gradient class
      previewContainer.classList.add(gradientClass);
    }
  }

  function enableEditingControls() {
    paddingRange.disabled = false;
    radiusRange.disabled = false;
  }

  function disableEditingControls() {
    paddingRange.disabled = true;
    radiusRange.disabled = true;
    clearBtn.disabled = true;
    downloadBtn.disabled = true;
  }

  function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }
});
