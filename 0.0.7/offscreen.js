// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.action === 'processArea') {
    processAreaScreenshot(message.dataUrl, message.rect);
  } else if (message.action === 'processAndSave') {
    processAndSaveScreenshot(message.imageData);
  }
});

// 处理区域截图
function processAreaScreenshot(dataUrl, rect) {
  console.log("Offscreen processing area screenshot with rect:", rect);

  const img = new Image();

  img.onload = function() {
    console.log("Image loaded with dimensions:", img.width, "x", img.height);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // 计算裁剪坐标
    const x = Math.round(rect.left);
    const y = Math.round(rect.top);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    console.log("Crop coordinates:", x, y, width, height);

    // 检查坐标是否有效
    if (width <= 0 || height <= 0 || x < 0 || y < 0 || x + width > img.width || y + height > img.height) {
      console.error("Invalid crop dimensions:", x, y, width, height);
      chrome.runtime.sendMessage({
        target: 'background',
        action: 'areaProcessed',
        processedImageData: dataUrl // 失败时返回原始数据
      });
      return;
    }

    // 设置canvas大小
    canvas.width = width;
    canvas.height = height;

    // 清除canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制裁剪区域
    try {
      ctx.drawImage(
        img,
        x, y, width, height,
        0, 0, width, height
      );

      // 获取裁剪后的图像数据
      const processedImageData = canvas.toDataURL('image/png');

      console.log("Successfully processed area screenshot");

      // 发送处理后的图像数据到background
      chrome.runtime.sendMessage({
        target: 'background',
        action: 'areaProcessed',
        processedImageData: processedImageData
      });
    } catch (err) {
      console.error("Error cropping image:", err);

      // 发送原始图像数据
      chrome.runtime.sendMessage({
        target: 'background',
        action: 'areaProcessed',
        processedImageData: dataUrl,
        error: err.message
      });
    }

    // 通知background关闭离屏文档
    setTimeout(() => {
      chrome.runtime.sendMessage({
        target: 'background',
        action: 'closeOffscreen'
      });
    }, 500);
  };

  img.onerror = function(err) {
    console.error("Error loading image:", err);

    // 发送原始图像数据
    chrome.runtime.sendMessage({
      target: 'background',
      action: 'areaProcessed',
      processedImageData: dataUrl,
      error: "Failed to load image"
    });

    // 通知background关闭离屏文档
    setTimeout(() => {
      chrome.runtime.sendMessage({
        target: 'background',
        action: 'closeOffscreen'
      });
    }, 500);
  };

  // 设置跨域属性
  img.crossOrigin = "anonymous";
  img.src = dataUrl;
}

// 处理并保存截图
function processAndSaveScreenshot(imageData) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // 设置画布大小
    canvas.width = img.width;
    canvas.height = img.height;

    // 绘制圆角矩形
    ctx.beginPath();
    const cornerRadius = 20;
    ctx.moveTo(cornerRadius, 0);
    ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, cornerRadius);
    ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, cornerRadius);
    ctx.arcTo(0, canvas.height, 0, 0, cornerRadius);
    ctx.arcTo(0, 0, canvas.width, 0, cornerRadius);
    ctx.clip();

    // 绘制图像
    ctx.drawImage(img, 0, 0);

    // 转换为Blob
    canvas.toBlob((blob) => {
      const filename = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;

      // 创建下载链接
      const url = URL.createObjectURL(blob);

      // 通过消息告诉背景脚本下载图像
      chrome.runtime.sendMessage({
        target: 'background',
        action: 'downloadImage',
        url: url,
        filename: filename
      });

      // 通知背景脚本关闭离屏文档
      setTimeout(() => {
        chrome.runtime.sendMessage({
          target: 'background',
          action: 'closeOffscreen'
        });
      }, 500);
    });
  };
  img.src = imageData;
}