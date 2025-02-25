// 全局变量存储截图数据
let capturedAreaImage = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理来自content script的截图数据
  if (request.action === "areaSelected" && request.imageData) {
    capturedAreaImage = request.imageData;

    // 尝试打开popup
    try {
      chrome.action.openPopup();
    } catch (e) {
      console.log("无法自动打开popup，用户需要手动点击扩展图标");
      // 显示通知提醒用户
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '区域已选择',
        message: '点击扩展图标查看并编辑您的截图'
      });
    }

    sendResponse({status: "received"});
    return true;
  }

  // 处理来自popup的获取截图请求
  if (request.action === "getAreaScreenshot") {
    sendResponse({imageData: capturedAreaImage});
    return true;
  }

  // 处理来自popup的准备选择区域请求
  if (request.action === "prepareAreaSelection") {
    // 不需要立即回调，因为popup可能已经关闭
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        return;
      }

      const activeTab = tabs[0];

      // 注入内容脚本
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        files: ['content-selector.js']
      }).catch(err => {
        console.error("Script injection failed:", err);
      });
    });

    // 立即响应，不等待脚本注入完成
    sendResponse({status: "processing"});
    return false; // 不保持消息通道开放
  }

  // 处理备用截图方法
  if (request.action === "captureVisibleForArea") {
    console.log("Received area capture request with rect:", request.rect);
    console.log("Original rect:", request.originalRect);
    console.log("Scroll info:", request.scrollInfo);

    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
      if (chrome.runtime.lastError) {
        console.error("Screenshot capture failed:", chrome.runtime.lastError);
        return;
      }

      console.log("Captured full screenshot, processing area...");

      // 使用 offscreen document 处理图像
      // 传递所有相关信息
      const fullRect = {
        ...request.rect,
        scrollInfo: request.scrollInfo,
        originalRect: request.originalRect
      };

      processAreaScreenshot(dataUrl, fullRect);

      // 尝试打开popup
      try {
        chrome.action.openPopup();
      } catch (e) {
        console.log("无法自动打开popup");
        // 显示通知提醒用户
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '区域已选择',
          message: '点击扩展图标查看并编辑您的截图'
        });
      }
    });
    return true;
  }

  // 处理来自content script的截图请求
  if (request.action === "captureVisibleForContentProcessing") {
    chrome.tabs.captureVisibleTab({ format: 'png' })
      .then(dataUrl => {
        sendResponse({ dataUrl: dataUrl });
      })
      .catch(error => {
        console.error("Error capturing tab:", error);
        sendResponse({ error: error.message });
      });
    return true; // 异步响应
  }

  // 处理保存截图请求
  if (request.action === "saveScreenshot") {
    if (request.imageData) {
      const filename = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
      chrome.downloads.download({
        url: request.imageData,
        filename: filename,
        saveAs: true
      });
    }
    return true;
  }

  // 处理captureVisibleTab请求
  if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
      if (chrome.runtime.lastError) {
        console.error("Screenshot capture failed:", chrome.runtime.lastError);
        sendResponse({error: chrome.runtime.lastError.message});
        return;
      }

      console.log("Screenshot captured successfully");
      sendResponse({dataUrl: dataUrl});
    });
    return true; // 异步响应
  }

  // 处理清除截图请求
  if (request.action === "clearScreenshot") {
    capturedAreaImage = null;
    sendResponse({status: "cleared"});
    return true;
  }
});

// 监听来自离屏文档的消息
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.target === 'background') {
    if (message.action === 'areaProcessed') {
      console.log("Received processed area image");
      capturedAreaImage = message.processedImageData;
    } else if (message.action === 'closeOffscreen') {
      console.log("Closing offscreen document");
      chrome.offscreen.closeDocument().catch(err => {
        console.error("Failed to close offscreen document:", err);
      });
    } else if (message.action === 'downloadImage') {
      console.log("Processing download request");
      // 处理下载请求
      const downloadOptions = {
        url: message.url,
        filename: message.filename,
        saveAs: false
      };

      chrome.downloads.download(downloadOptions, () => {
        // 下载完成后释放URL
        URL.revokeObjectURL(message.url);
      });
    }
  }
});

// 检查是否已存在离屏文档
async function hasOffscreenDocument() {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    return existingContexts.length > 0;
  } catch (e) {
    // 如果API不支持，假设没有离屏文档
    return false;
  }
}

// 使用 offscreen document 处理图像
async function processAreaScreenshot(dataUrl, rect) {
  console.log("Processing area screenshot with rect:", rect);

  try {
    // 检查是否已存在离屏文档
    const hasDocument = await hasOffscreenDocument();
    if (hasDocument) {
      await chrome.offscreen.closeDocument();
    }

    // 创建离屏文档
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Process screenshot'
    });

    // 发送消息到离屏文档处理图像
    chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'processArea',
      dataUrl: dataUrl,
      rect: rect
    });
  } catch (err) {
    console.error("Failed to create offscreen document:", err);
    // 使用备用方法处理图像
    processImageDirectly(dataUrl, rect);
  }
}

async function processAndSaveScreenshot(imageData) {
  try {
    // 检查是否已存在离屏文档
    const hasDocument = await hasOffscreenDocument();
    if (hasDocument) {
      await chrome.offscreen.closeDocument();
    }

    // 创建一个离屏文档来处理图像
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Process and save screenshot'
    });

    // 发送消息到离屏文档
    chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'processAndSave',
      imageData: imageData
    });
  } catch (err) {
    console.error("Failed to create offscreen document:", err);
    // 使用备用方法直接下载
    const filename = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
    chrome.downloads.download({
      url: imageData,
      filename: filename,
      saveAs: false
    });
  }
}

// 添加备用方法，直接在background中处理图像
function processImageDirectly(dataUrl, rect) {
  console.log("Using fallback method to process image");

  // 由于background.js是service worker，不能使用DOM API
  // 我们只能保存原始截图，不做裁剪
  capturedAreaImage = dataUrl;

  console.log("Saved full screenshot as fallback");
}
