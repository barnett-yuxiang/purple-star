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

document.addEventListener('DOMContentLoaded', function() {
  initializePreview();

  // 从背景脚本获取可能存在的区域截图
  chrome.runtime.sendMessage({action: "getAreaScreenshot"}, function(response) {
    if (response && response.imageData) {
      console.log("Received area screenshot in popup");
      // 创建图像对象
      const img = new Image();
      img.onload = function() {
        console.log("Area screenshot loaded, dimensions:", img.width, "x", img.height);
        capturedImage = img;
        updatePreview();

        // 显示保存按钮
        document.getElementById('saveBtn').classList.remove('hidden');

        // 隐藏空状态提示
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
          emptyState.classList.add('hidden');
        }
      };
      img.src = response.imageData;
    } else {
      // 显示空状态提示
      const emptyState = document.getElementById('empty-state');
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
    }
  });

  // 获取预览区域
  const previewContainer = document.getElementById('previewContainer');

  // 确保元素存在
  if (previewContainer) {
    // 添加删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-button';
    deleteButton.innerHTML = '🗑️';
    deleteButton.title = 'Delete screenshot';
    deleteButton.classList.add('delete-button');

    // 将删除按钮添加到预览容器
    previewContainer.appendChild(deleteButton);

    // 添加删除按钮的点击事件
    deleteButton.addEventListener('click', function() {
      // 发送消息到background脚本，清除保存的截图
      chrome.runtime.sendMessage({
        action: "clearScreenshot"
      }, function() {
        // 清除预览图像
        const previewCanvas = document.getElementById('previewCanvas');
        if (previewCanvas) {
          const ctx = previewCanvas.getContext('2d');
          ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          previewCanvas.classList.remove('has-content');
        }

        // 隐藏保存按钮
        document.getElementById('saveBtn').classList.add('hidden');

        // 显示空状态提示
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
          emptyState.classList.remove('hidden');
        }

        // 重置全局变量
        capturedImage = null;
      });
    });
  }

  // 获取按钮元素
  const captureBtn = document.getElementById('captureBtn');
  const selectAreaBtn = document.getElementById('selectAreaBtn');

  // 截取整个屏幕 - 修复版本
  captureBtn.addEventListener('click', function() {
    // 发送消息到background脚本，让它处理截图
    // 这样即使popup关闭，background也能继续执行
    chrome.runtime.sendMessage({
      action: "captureEntireScreen"
    });

    // 关闭popup
    window.close();
  });

  // 选择区域
  selectAreaBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) return;

      const activeTab = tabs[0];

      // 关闭popup
      window.close();

      // 注入内容脚本
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        files: ['content-selector.js']
      }).catch(err => {
        console.error("Script injection failed:", err);
      });
    });
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
  document.getElementById(id).addEventListener('input', updatePreview);
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

function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
