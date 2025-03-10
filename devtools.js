// Create a panel in Chrome DevTools
console.log("[Raging A11y] DevTools script loaded");

chrome.devtools.panels.create(
  "Raging A11y", // Panel title
  "images/icon16.png", // Panel icon
  "panel.html", // Panel HTML page
  function (panel) {
    // Panel created
    console.log("[Raging A11y] A11y panel created successfully");

    panel.onShown.addListener(function (window) {
      console.log("[Raging A11y] A11y panel shown");
    });

    panel.onHidden.addListener(function () {
      console.log("[Raging A11y] A11y panel hidden");
    });
  }
);
