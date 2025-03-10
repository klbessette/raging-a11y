// Background script for the Raging A11y extension

console.log("[Raging A11y] Background script loaded");

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Raging A11y] Extension installed/updated");
});

// Handle messages from the DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Raging A11y] Background script received message:", message);
  console.log("[Raging A11y] Message sender:", sender);

  if (message.action === "highlight-element") {
    console.log("[Raging A11y] Forwarding highlight request to content script");
    // Forward the message to the content script in the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log("[Raging A11y] Sending message to tab:", tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          console.log(
            "[Raging A11y] Received response from content script:",
            response
          );
          sendResponse(response);
        });
      } else {
        console.error("[Raging A11y] No active tab found");
        sendResponse({ success: false, error: "No active tab found" });
      }
    });
    return true; // Keep the message channel open for the async response
  }
});
