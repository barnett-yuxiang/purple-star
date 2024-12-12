let capturedImage = null;

function drawBackground(ctx, width, height) {
  const bgType = document.getElementById('bgType').value;
  
  if (bgType === 'solid') {
    ctx.fillStyle = document.getElementById('bgColor').value;
    ctx.fillRect(0, 0, width, height);
  } else {
    const startColor = document.getElementById('gradientStart').value;
    const endColor = document.getElementById('gradientEnd').value;
    const direction = document.getElementById('gradientDirection').value;
    
    let gradient;
    switch (direction) {
      case 'horizontal':
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        break;
      case 'vertical':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        break;
      case 'diagonal':
        gradient = ctx.createLinearGradient(0, 0, width, height);
        break;
    }
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function updatePreview() {
  if (!capturedImage) return;

  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const padding = parseInt(document.getElementById('padding').value);
  
  canvas.width = capturedImage.width + padding * 2;
  canvas.height = capturedImage.height + padding * 2;
  
  // Draw background
  drawBackground(ctx, canvas.width, canvas.height);
  
  // Draw image
  ctx.drawImage(capturedImage, padding, padding);
}

document.getElementById('captureBtn').addEventListener('click', () => {
  chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
    const img = new Image();
    img.onload = function() {
      capturedImage = img;
      updatePreview();
      document.getElementById('saveBtn').classList.remove('hidden');
    };
    img.src = dataUrl;
  });
});

document.getElementById('bgType').addEventListener('change', (e) => {
  const isSolid = e.target.value === 'solid';
  document.getElementById('solidColorControls').style.display = 
    isSolid ? 'block' : 'none';
  document.getElementById('gradientControls').style.display = 
    isSolid ? 'none' : 'block';
  updatePreview();
});

// Add event listeners for all controls
['padding', 'bgColor', 'gradientStart', 'gradientEnd', 'gradientDirection']
  .forEach(id => {
    document.getElementById(id).addEventListener('change', updatePreview);
  });

document.getElementById('saveBtn').addEventListener('click', () => {
  const canvas = document.getElementById('previewCanvas');
  canvas.toBlob((blob) => {
    const filename = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
    chrome.downloads.download({
      url: URL.createObjectURL(blob),
      filename: filename,
      saveAs: false
    });
  });
});
