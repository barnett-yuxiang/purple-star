// Log when the background script is initialized
console.log('Background script initialized at', new Date().toISOString());

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message in background script:', message);

    if (message.action === 'popupOpened') {
        console.log('Popup was opened at', new Date().toISOString());
    }

    if (message.action === 'takeScreenshot') {
        console.log(`Taking ${message.type} screenshot`);

        // Here you would implement the actual screenshot functionality based on the type

        // For demonstration, just show a notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Enhanced Screenshot',
            message: `${message.type} screenshot feature triggered!`,
            priority: 2
        });

        // Log the screenshot action
        console.log(`Screenshot action (${message.type}) completed at`, new Date().toISOString());
    }

    return true; // Indicates async response
});

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed or updated:', details.reason);
    console.log('Extension version:', chrome.runtime.getManifest().version);
});

// Log when a tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log('Tab activated:', activeInfo.tabId);
});

console.log('Background script setup complete!');