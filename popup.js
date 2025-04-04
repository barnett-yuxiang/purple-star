document.addEventListener('DOMContentLoaded', function () {
    console.log('Popup DOM loaded');

    const button1 = document.getElementById('id1');
    const button2 = document.getElementById('id2');
    const button3 = document.getElementById('id3');

    button1.addEventListener('click', function () {
        console.log('Full Page');
        chrome.runtime.sendMessage({ action: 'takeScreenshot', type: 'fullPage' });
    });
    button2.addEventListener('click', function () {
        console.log('Current Tab');
        chrome.runtime.sendMessage({ action: 'takeScreenshot', type: 'currentTab' });
    });
    button3.addEventListener('click', function () {
        console.log('Selected Area');
        chrome.runtime.sendMessage({ action: 'takeScreenshot', type: 'selectedArea' });
    });

    // Send a message to the background script that popup is opened
    chrome.runtime.sendMessage({action: 'popupOpened'});
});