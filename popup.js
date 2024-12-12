const gradientPresets = {
  preset1: { start: '#FF6B6B', end: '#4ECDC4' },
  preset2: { start: '#A8E6CF', end: '#FFD3B6' },
  preset3: { start: '#3494E6', end: '#EC6EAD' },
  preset4: { start: '#DAE2F8', end: '#D6A4A4' }
};

let capturedImage = null;

function drawBackground(ctx, width, height) {
  const bgType = document.getElementById('bgType').value;

  if (bgType === 'solid') {
    ctx.fillStyle = document.getElementById('bgColor').value;
    ctx.fillRect(0, 0, width, height);
  } else {
    const selectedPreset = document.querySelector('input[name="gradientPreset"]:checked').value;
    const { start, end } = gradientPresets[selectedPreset];

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function extractColors(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const colorCounts = {};
  const blockSize = 5;

  // Sample colors from the image
  for (let i = 0; i < data.length; i += blockSize * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Skip whites and near-whites
    if (r > 250 && g > 250 && b > 250) continue;
    // Skip blacks and near-blacks
    if (r < 5 && g < 5 && b < 5) continue;

    const rgb = `${r},${g},${b}`;
    colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
  }

  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([rgb]) => rgb.split(',').map(Number));

  // If we don't have enough distinct colors, generate complementary colors
  if (sortedColors.length < 2) {
    const primary = sortedColors[0] || [100, 149, 237]; // Default cornflower blue
    const secondary = generateComplementaryColor(primary);
    return {
      primary: rgbToHex(primary),
      secondary: rgbToHex(secondary)
    };
  }

  // Find two colors with good contrast
  let primaryColor = sortedColors[0];
  let secondaryColor = null;

  // Look for a second color with good contrast
  for (let i = 1; i < sortedColors.length; i++) {
    if (getColorContrast(primaryColor, sortedColors[i]) > 50) {
      secondaryColor = sortedColors[i];
      break;
    }
  }

  // If no good contrast found, generate complementary
  if (!secondaryColor) {
    secondaryColor = generateComplementaryColor(primaryColor);
  }

  return {
    primary: rgbToHex(primaryColor),
    secondary: rgbToHex(secondaryColor)
  };
}

function getColorContrast(rgb1, rgb2) {
  return Math.abs(rgb1[0] - rgb2[0]) +
         Math.abs(rgb1[1] - rgb2[1]) +
         Math.abs(rgb1[2] - rgb2[2]);
}

function generateComplementaryColor(rgb) {
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  hsl[0] = (hsl[0] + 180) % 360; // Rotate hue by 180 degrees
  return hslToRgb(hsl[0], hsl[1], hsl[2]);
}

function rgbToHex(rgb) {
  return `#${rgb.map(x => ('0' + Math.round(x).toString(16)).slice(-2)).join('')}`;
}

function applyRoundedCorners(ctx, x, y, width, height, radius) {
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

// Initialize preview area
function initializePreview() {
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');

  // Set initial canvas size to match container
  const previewContainer = document.getElementById('previewContainer');
  canvas.width = previewContainer.clientWidth;
  canvas.height = previewContainer.clientHeight;
}

function updatePreview() {
  if (!capturedImage) return;

  const previewContainer = document.getElementById('previewContainer');
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const padding = parseInt(document.getElementById('padding').value);
  document.getElementById('paddingValue').textContent = `${padding}px`;

  // Calculate dimensions
  const containerWidth = previewContainer.clientWidth - 40;
  const containerHeight = previewContainer.clientHeight - 40;

  let canvasWidth = capturedImage.width + padding * 2;
  let canvasHeight = capturedImage.height + padding * 2;

  // Calculate scale to fit within container while maintaining aspect ratio
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed

  // Set canvas dimensions
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Draw background
  drawBackground(ctx, canvas.width, canvas.height);

  // Draw image with rounded corners
  ctx.save();
  applyRoundedCorners(ctx, padding, padding, capturedImage.width, capturedImage.height, 12);
  ctx.clip();
  ctx.drawImage(capturedImage, padding, padding);
  ctx.restore();

  // Apply scale
  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = 'center';
  canvas.classList.add('has-content');
}

// Add event listener for padding slider
document.getElementById('padding').addEventListener('input', function(e) {
  const value = e.target.value;
  document.getElementById('paddingValue').textContent = `${value}px`;
  updatePreview();
});

document.getElementById('captureBtn').addEventListener('click', () => {
  // Show save button on each click to allow multiple captures
  document.getElementById('saveBtn').classList.remove('hidden');

  chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
    const img = new Image();
    img.onload = function() {
      capturedImage = img;

      // Keep current background type selection
      const currentBgType = document.getElementById('bgType').value;
      const isSolid = currentBgType === 'solid';

      // Update controls visibility based on current selection
      document.getElementById('solidColorControls').classList.toggle('hidden', !isSolid);
      document.getElementById('gradientControls').classList.toggle('hidden', isSolid);

      updatePreview();
    };
    img.src = dataUrl;
  });
});

document.getElementById('bgType').addEventListener('change', (e) => {
  const isSolid = e.target.value === 'solid';
  document.getElementById('solidColorControls').classList.toggle('hidden', !isSolid);
  document.getElementById('gradientControls').classList.toggle('hidden', isSolid);
  updatePreview();
});

// Simplify event listener list
['padding', 'bgColor'].forEach(id => {
  document.getElementById(id).addEventListener('change', updatePreview);
});

document.querySelectorAll('input[name="gradientPreset"]').forEach(input => {
  input.addEventListener('change', updatePreview);
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const canvas = document.getElementById('previewCanvas');
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const filename = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    }, () => {
      URL.revokeObjectURL(url); // Clean up the object URL
    });
  });
});
