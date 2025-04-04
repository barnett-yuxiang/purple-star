(function() {
  // 创建选择区域的UI元素
  const overlay = document.createElement('div');
  overlay.id = 'screenshot-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  overlay.style.zIndex = '9999999';
  overlay.style.cursor = 'crosshair';

  // 添加说明文字
  const instructions = document.createElement('div');
  instructions.textContent = 'Click to start selection, move mouse, then click again to finish (Press ESC to cancel)';
  instructions.style.position = 'fixed';
  instructions.style.top = '10px';
  instructions.style.left = '50%';
  instructions.style.transform = 'translateX(-50%)';
  instructions.style.padding = '10px';
  instructions.style.backgroundColor = 'white';
  instructions.style.borderRadius = '5px';
  instructions.style.zIndex = '10000000';
  instructions.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  instructions.style.fontFamily = 'Arial, sans-serif';

  // 添加确认按钮
  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Capture This Area';
  confirmButton.style.position = 'fixed';
  confirmButton.style.display = 'none'; // 初始隐藏
  confirmButton.style.padding = '8px 16px';
  confirmButton.style.backgroundColor = '#4CAF50';
  confirmButton.style.color = 'white';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '4px';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.zIndex = '10000001';
  confirmButton.style.fontFamily = 'Arial, sans-serif';
  confirmButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

  document.body.appendChild(instructions);
  document.body.appendChild(overlay);
  document.body.appendChild(confirmButton);

  // 实现选择区域的逻辑
  let startX, startY;
  let selectionBox = null;
  let selectionMode = 'idle'; // 'idle', 'selecting', 'selected'

  // 添加ESC键取消功能
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      cleanupAndExit();
    }
  });

  // 鼠标点击事件处理
  overlay.addEventListener('mousedown', function(e) {
    // 如果已经选择完成，忽略点击
    if (selectionMode === 'selected') return;

    // 如果是第一次点击，开始选择
    if (selectionMode === 'idle') {
      startSelection(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // 鼠标移动事件处理
  const mouseMoveHandler = function(e) {
    if (selectionMode !== 'selecting') return;

    updateSelectionBox(e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
  };

  // 鼠标释放事件处理
  const mouseUpHandler = function(e) {
    if (selectionMode !== 'selecting') return;

    // 完成选择
    completeSelection();
    e.preventDefault();
    e.stopPropagation();
  };

  // 触摸事件处理
  overlay.addEventListener('touchstart', function(e) {
    if (selectionMode === 'selected') return;

    if (selectionMode === 'idle') {
      const touch = e.touches[0];
      startSelection(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  }, { passive: false });

  const touchMoveHandler = function(e) {
    if (selectionMode !== 'selecting') return;

    const touch = e.touches[0];
    updateSelectionBox(touch.clientX, touch.clientY);
    e.preventDefault();
  };

  const touchEndHandler = function(e) {
    if (selectionMode !== 'selecting') return;

    completeSelection();
    e.preventDefault();
  };

  // 确认按钮点击事件
  confirmButton.addEventListener('click', function() {
    captureSelectedArea();
  });

  // 开始选择
  function startSelection(x, y) {
    startX = x;
    startY = y;
    selectionMode = 'selecting';

    // 创建选择框
    if (!selectionBox) {
      selectionBox = document.createElement('div');
      selectionBox.style.position = 'fixed';
      selectionBox.style.border = '2px dashed white';
      selectionBox.style.backgroundColor = 'rgba(0, 123, 255, 0.2)';
      selectionBox.style.zIndex = '10000000';
      document.body.appendChild(selectionBox);
    }

    // 设置选择框的初始位置
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';

    // 更新说明文字
    instructions.textContent = 'Release mouse button to complete selection (Press ESC to cancel)';

    // 添加事件监听器
    document.addEventListener('mousemove', mouseMoveHandler, { passive: false });
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);
  }

  // 更新选择框
  function updateSelectionBox(x, y) {
    // 计算选择框的宽度和高度
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);

    // 计算选择框的左上角坐标
    const left = Math.min(x, startX);
    const top = Math.min(y, startY);

    // 更新选择框的位置和大小
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }

  // 完成选择
  function completeSelection() {
    selectionMode = 'selected';

    // 移除事件监听器
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('touchmove', touchMoveHandler);
    document.removeEventListener('touchend', touchEndHandler);

    // 获取选择框的位置和大小
    const rect = {
      left: parseInt(selectionBox.style.left),
      top: parseInt(selectionBox.style.top),
      width: parseInt(selectionBox.style.width),
      height: parseInt(selectionBox.style.height)
    };

    // 检查选择区域是否有效
    if (rect.width < 10 || rect.height < 10) {
      console.log("Selected area too small, restarting");
      selectionMode = 'idle';
      if (selectionBox) {
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
      }
      instructions.textContent = 'Click to start selection, move mouse, then release to finish (Press ESC to cancel)';
      return;
    }

    console.log("Selection complete:", rect);

    // 更新说明文字
    instructions.textContent = 'Area selected. Click "Capture This Area" to proceed or ESC to cancel.';

    // 显示确认按钮
    confirmButton.style.display = 'block';
    confirmButton.style.left = (rect.left + rect.width / 2 - confirmButton.offsetWidth / 2) + 'px';
    confirmButton.style.top = (rect.top + rect.height + 10) + 'px';
  }

  // 捕获选定区域
  function captureSelectedArea() {
    // 获取选择框的位置和大小
    const rect = {
      left: parseInt(selectionBox.style.left),
      top: parseInt(selectionBox.style.top),
      width: parseInt(selectionBox.style.width),
      height: parseInt(selectionBox.style.height)
    };

    console.log("CAPTURE: Original selection rect:", rect);

    // 保存选择区域信息
    const captureRect = { ...rect };

    // 完全移除所有UI元素，确保它们不会出现在截图中
    safeRemove(overlay);
    safeRemove(instructions);
    safeRemove(selectionBox);
    safeRemove(confirmButton);

    // 移除任何可能存在的旧加载指示器
    removeAllLoadingIndicators();

    // 确保DOM更新后再进行截图 - 增加延迟确保UI完全消失
    setTimeout(() => {
      // 直接使用chrome.tabs.captureVisibleTab API - 不显示任何加载指示器
      chrome.runtime.sendMessage({
        action: "captureVisibleTab"
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("CAPTURE: Runtime error:", chrome.runtime.lastError);
          return;
        }

        if (response && response.dataUrl) {
          console.log("CAPTURE: Received screenshot from background");

          // 截图完成后，再显示加载指示器
          const loadingIndicator = showLoadingIndicator();

          // 处理图像
          processScreenshot(response.dataUrl, captureRect, loadingIndicator);
        } else {
          console.error("CAPTURE: Failed to capture screenshot");
        }
      });
    }, 100);
  }

  // 显示加载指示器并返回元素引用
  function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'screenshot-loading-indicator-' + Date.now();
    loadingIndicator.textContent = 'Processing...';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.padding = '10px 20px';
    loadingIndicator.style.backgroundColor = 'white';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    loadingIndicator.style.zIndex = '10000001';
    document.body.appendChild(loadingIndicator);

    return loadingIndicator;
  }

  // 移除所有加载指示器
  function removeAllLoadingIndicators() {
    console.log("Removing all loading indicators");

    // 查找所有可能的加载指示器
    const indicators = [
      ...document.querySelectorAll('div[style*="Processing..."]'),
      ...document.querySelectorAll('div[id^="screenshot-loading-indicator-"]'),
      ...Array.from(document.querySelectorAll('div[style*="position: fixed"]'))
        .filter(el => el.textContent && el.textContent.includes('Processing'))
    ];

    console.log(`Found ${indicators.length} loading indicators to remove`);

    indicators.forEach(indicator => {
      safeRemove(indicator);
    });
  }

  // 处理截图
  function processScreenshot(dataUrl, rect, loadingIndicator) {
    console.log("PROCESS: Processing screenshot with rect:", rect);

    const img = new Image();

    img.onload = function() {
      console.log("PROCESS: Image loaded with dimensions:", img.width, "x", img.height);
      console.log("PROCESS: Window dimensions:", window.innerWidth, "x", window.innerHeight);

      // 创建canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 计算图像与窗口的比例
      const imgRatio = img.width / window.innerWidth;
      console.log("PROCESS: Image to window ratio:", imgRatio);

      // 根据比例调整坐标
      const x = Math.round(rect.left * imgRatio);
      const y = Math.round(rect.top * imgRatio);
      const width = Math.round(rect.width * imgRatio);
      const height = Math.round(rect.height * imgRatio);

      console.log("PROCESS: Adjusted crop coordinates:", x, y, width, height);

      // 设置canvas大小
      canvas.width = width;
      canvas.height = height;

      // 绘制裁剪区域
      try {
        ctx.drawImage(
          img,
          x, y, width, height,
          0, 0, width, height
        );

        // 获取裁剪后的图像数据
        const croppedImageData = canvas.toDataURL('image/png');

        // 发送裁剪后的图像数据到background
        chrome.runtime.sendMessage({
          action: "areaSelected",
          imageData: croppedImageData
        });

        // 移除加载指示器
        safeRemove(loadingIndicator);
      } catch (err) {
        console.error("PROCESS: Error cropping image:", err);

        // 发送原始图像数据
        chrome.runtime.sendMessage({
          action: "areaSelected",
          imageData: dataUrl,
          error: err.message
        });

        // 移除加载指示器
        safeRemove(loadingIndicator);
      }
    };

    img.onerror = function(err) {
      console.error("PROCESS: Error loading image:", err);

      // 发送原始图像数据
      chrome.runtime.sendMessage({
        action: "areaSelected",
        imageData: dataUrl,
        error: "Failed to load image"
      });

      // 移除加载指示器
      safeRemove(loadingIndicator);
    };

    img.src = dataUrl;
  }

  // 安全地移除元素的辅助函数
  function safeRemove(element) {
    if (element && element.parentNode) {
      try {
        element.parentNode.removeChild(element);
      } catch (e) {
        console.error("Error removing element:", e);
      }
    }
  }

  // 清理并退出
  function cleanupAndExit() {
    // 移除所有添加的元素
    safeRemove(overlay);
    safeRemove(instructions);
    safeRemove(selectionBox);
    safeRemove(confirmButton);

    // 移除所有加载指示器
    if (window.removeAllLoadingIndicators) {
      window.removeAllLoadingIndicators();
    } else {
      // 查找所有可能的加载指示器
      const indicators = document.querySelectorAll('div[style*="Processing..."]');
      indicators.forEach(indicator => {
        safeRemove(indicator);
      });

      // 额外的安全措施
      const allFixedElements = document.querySelectorAll('div[style*="position: fixed"]');
      allFixedElements.forEach(el => {
        if (el.textContent && el.textContent.includes('Processing')) {
          safeRemove(el);
        }
      });
    }

    // 移除事件监听器
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('touchmove', touchMoveHandler);
    document.removeEventListener('touchend', touchEndHandler);
  }

  // 处理选定区域
  function processSelectedArea(rect) {
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;

    // 获取页面滚动位置
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // 计算相对于整个文档的坐标（考虑滚动和DPR）
    // 注意：这里我们不乘以DPR，因为captureVisibleTab已经考虑了DPR
    const documentRect = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      dpr: dpr
    };

    // 保存原始视口坐标用于调试
    const originalRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      scrollX: scrollX,
      scrollY: scrollY
    };

    console.log("Original viewport rect:", originalRect);
    console.log("Document rect for capture:", documentRect);

    // 设置超时，确保即使消息发送失败，加载指示器也会被移除
    const timeoutId = setTimeout(() => {
      console.log("Message sending timeout - cleaning up loading indicator");
      window.removeAllLoadingIndicators();
    }, 15000); // 15秒超时

    // 添加全局错误处理
    window.addEventListener('error', function(event) {
      console.error("Global error caught during screenshot process:", event.error);
      window.removeAllLoadingIndicators();
    }, { once: true });

    // 尝试使用background脚本处理图像
    try {
      // 发送消息到背景脚本，包含所有必要的信息
      chrome.runtime.sendMessage({
        action: "captureVisibleForArea",
        rect: documentRect,
        originalRect: originalRect,
        scrollInfo: {
          scrollX: scrollX,
          scrollY: scrollY
        }
      });
      clearTimeout(timeoutId);
    } catch (e) {
      console.error("Error sending message to background:", e);
      window.removeAllLoadingIndicators();
    }
  }

  function processImageInContent(dataUrl, rect, originalRect) {
    console.log("Processing image in content script");
    console.log("Processing rect:", rect);
    console.log("Original rect:", originalRect);

    // 立即创建一个全局函数来移除所有加载指示器
    window.removeAllLoadingIndicators = function() {
      console.log("Removing all loading indicators");
      // 使用更精确的选择器
      const indicators = [
        ...document.querySelectorAll('div[style*="Processing..."]'),
        ...document.querySelectorAll('div[id^="screenshot-loading-indicator-"]'),
        ...Array.from(document.querySelectorAll('div[style*="position: fixed"]'))
          .filter(el => el.textContent && el.textContent.includes('Processing'))
      ];

      console.log(`Found ${indicators.length} loading indicators to remove`);

      indicators.forEach(indicator => {
        try {
          if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
            console.log("Successfully removed an indicator");
          }
        } catch (e) {
          console.error("Error removing indicator:", e);
        }
      });
    };

    // 设置多个超时，确保加载指示器被移除
    setTimeout(window.removeAllLoadingIndicators, 5000);  // 5秒
    setTimeout(window.removeAllLoadingIndicators, 10000); // 10秒
    setTimeout(window.removeAllLoadingIndicators, 15000); // 15秒

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = function() {
      console.log("Image loaded in content with dimensions:", img.width, "x", img.height);

      // 确保矩形尺寸有效 - 不应用DPR，因为截图已经考虑了DPR
      const x = Math.max(0, rect.left);
      const y = Math.max(0, rect.top);
      const width = Math.min(rect.width, img.width - x);
      const height = Math.min(rect.height, img.height - y);

      console.log("Calculated crop dimensions in content:", x, y, width, height);

      if (width <= 0 || height <= 0) {
        console.error("Invalid crop dimensions:", x, y, width, height);
        chrome.runtime.sendMessage({
          action: "areaSelected",
          imageData: dataUrl
        });
        window.removeAllLoadingIndicators();
        return;
      }

      // 设置画布大小
      canvas.width = width;
      canvas.height = height;

      // 绘制选定区域
      try {
        ctx.drawImage(
          img,
          x, y, width, height,
          0, 0, width, height
        );

        // 获取处理后的图像数据
        const processedImageData = canvas.toDataURL('image/png');

        console.log("Successfully processed area screenshot in content");

        // 发送处理后的图像数据回背景脚本
        chrome.runtime.sendMessage({
          action: "areaSelected",
          imageData: processedImageData
        }, function(response) {
          // 确保在消息发送完成后移除加载指示器
          window.removeAllLoadingIndicators();
        });

        // 立即尝试移除加载指示器
        window.removeAllLoadingIndicators();

      } catch (err) {
        console.error("Error drawing image in content:", err);
        chrome.runtime.sendMessage({
          action: "areaSelected",
          imageData: dataUrl
        });
        window.removeAllLoadingIndicators();
      }
    };

    img.onerror = function(e) {
      console.error("Failed to load image in content:", e);
      chrome.runtime.sendMessage({
        action: "areaSelected",
        imageData: dataUrl
      });
      window.removeAllLoadingIndicators();
    };

    img.src = dataUrl;
  }
})();