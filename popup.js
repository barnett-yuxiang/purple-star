document.getElementById('captureBtn').addEventListener('click', () => {
  chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
    chrome.runtime.sendMessage({
      action: "saveScreenshot", 
      imageData: dataUrl
    });
  });
});
