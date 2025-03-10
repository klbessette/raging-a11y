// This script is injected into the page to handle communication between the DevTools panel and the page

console.log("[Raging A11y] Content script loaded");

// Listen for messages from the DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Raging A11y] Content script received message:", message);

  if (message.action === "highlight-element") {
    console.log(
      "[Raging A11y] Highlighting element with selector:",
      message.selector
    );
    const result = highlightElement(message.selector);
    sendResponse({ success: true, result });
    return true;
  }
});

// Highlight an element on the page
function highlightElement(selector) {
  console.log("[Raging A11y] Content script highlighting element:", selector);

  // Remove previous highlights
  const previousHighlights = document.querySelectorAll(
    ".a11y-devtools-highlight"
  );
  console.log(
    "[Raging A11y] Removing previous highlights:",
    previousHighlights.length
  );

  previousHighlights.forEach((el) => {
    el.classList.remove("a11y-devtools-highlight");
    el.style.outline = "";
    el.style.outlineOffset = "";
  });

  // Find and highlight the element
  try {
    const element = document.querySelector(selector);
    if (element) {
      console.log("[Raging A11y] Element found, applying highlight");
      element.classList.add("a11y-devtools-highlight");
      element.style.outline = "4px solid #4285f4";
      element.style.outlineOffset = "4px";
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    } else {
      console.log("[Raging A11y] Element not found with selector:", selector);
      return false;
    }
  } catch (error) {
    console.error("[Raging A11y] Error highlighting element:", error);
    return false;
  }
}
