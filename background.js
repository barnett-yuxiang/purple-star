chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveScreenshot") {
    // Create rounded rectangle canvas
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw rounded rectangle
      ctx.beginPath();
      const cornerRadius = 20;
      ctx.moveTo(cornerRadius, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, cornerRadius);
      ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, cornerRadius);
      ctx.arcTo(0, canvas.height, 0, 0, cornerRadius);
      ctx.arcTo(0, 0, canvas.width, 0, cornerRadius);
      ctx.clip();

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Convert to Blob
      canvas.toBlob((blob) => {
        const filename = `screenshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
        const downloadOptions = {
          url: URL.createObjectURL(blob),
          filename: filename,
          saveAs: false
        };

        chrome.downloads.download(downloadOptions);
      });
    };
    img.src = request.imageData;
  }
});
