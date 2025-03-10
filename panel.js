// Store the results of the accessibility scan
let axeResults = null;
let issuesByType = {
  critical: [],
  serious: [],
  moderate: [],
  minor: [],
  none: [],
};
let incompleteByType = {
  critical: [],
  serious: [],
  moderate: [],
  minor: [],
  none: [],
};
let passesByType = {
  critical: [],
  serious: [],
  moderate: [],
  minor: [],
  none: [],
};
let currentSeverity = null;
let currentIssue = null;
let currentTab = "violations"; // Default tab

// WCAG Standards configuration
const wcagStandards = {
  wcag2a: "WCAG 2.0 Level A",
  wcag2aa: "WCAG 2.0 Level AA",
  wcag21a: "WCAG 2.1 Level A",
  wcag21aa: "WCAG 2.1 Level AA",
  wcag22a: "WCAG 2.2 Level A",
  wcag22aa: "WCAG 2.2 Level AA",
};

console.log("[Raging A11y] Panel script loaded");

// DOM elements
const scanButton = document.getElementById("scan-button");
const configButton = document.getElementById("config-button");
const configPanel = document.getElementById("config-panel");
const selectAllButton = document.getElementById("select-all-standards");
const clearAllButton = document.getElementById("clear-all-standards");
const activeStandards = document.getElementById("active-standards");
const standardsTagsContainer = activeStandards.querySelector(".standards-tags");
const loadingIndicator = document.getElementById("loading");
const issuesList = document.getElementById("issues-list");
const elementsList = document.getElementById("elements-list");
const incompleteIssuesList = document.getElementById("incomplete-issues-list");
const incompleteElementsList = document.getElementById(
  "incomplete-elements-list"
);
const passesIssuesList = document.getElementById("passes-issues-list");
const passesElementsList = document.getElementById("passes-elements-list");
const severityItems = document.querySelectorAll(".severity-item");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

// Initialize event listeners
function initEventListeners() {
  console.log("[Raging A11y] Initializing event listeners");
  // Scan button click event
  scanButton.addEventListener("click", runAccessibilityScan);

  // Configuration button click event
  configButton.addEventListener("click", () => {
    configPanel.classList.toggle("hidden");
  });

  // Select all standards
  selectAllButton.addEventListener("click", () => {
    document
      .querySelectorAll('.standard-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = true;
      });
  });

  // Clear all standards
  clearAllButton.addEventListener("click", () => {
    document
      .querySelectorAll('.standard-item input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
  });

  // Tab button click events
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");
      console.log(`[Raging A11y] Tab clicked: ${tabName}`);
      switchTab(tabName);
    });
  });

  // Severity item click events
  severityItems.forEach((item) => {
    item.addEventListener("click", () => {
      const severity = item.getAttribute("data-severity");
      const type = item.getAttribute("data-type") || "violations";
      console.log(
        `[Raging A11y] Severity item clicked: ${severity}, type: ${type}`
      );

      const issuesByTypeMap = {
        violations: issuesByType,
        incomplete: incompleteByType,
        passes: passesByType,
      };

      if (issuesByTypeMap[type][severity].length > 0) {
        switch (type) {
          case "incomplete":
            showIncompleteIssuesForSeverity(severity);
            break;
          case "passes":
            showPassesForSeverity(severity);
            break;
          default:
            showIssuesForSeverity(severity);
        }
      } else {
        console.log(`[Raging A11y] No ${type} found for severity: ${severity}`);
      }
    });
  });
  console.log("[Raging A11y] Event listeners initialized");
}

// Switch between tabs
function switchTab(tabName) {
  console.log(`[Raging A11y] Switching to tab: ${tabName}`);
  currentTab = tabName;

  // Update active tab button
  tabButtons.forEach((button) => {
    if (button.getAttribute("data-tab") === tabName) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  // Update active tab content
  tabContents.forEach((content) => {
    if (content.id === `${tabName}-tab`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });

  // Reset UI state for the new tab
  currentSeverity = null;
  currentIssue = null;

  // Clear issue and element lists
  const listMap = {
    violations: [issuesList, elementsList],
    incomplete: [incompleteIssuesList, incompleteElementsList],
    passes: [passesIssuesList, passesElementsList],
  };

  if (listMap[tabName]) {
    listMap[tabName].forEach((list) => (list.innerHTML = ""));
  }
}

// Get selected WCAG standards
function getSelectedStandards() {
  const checkboxes = document.querySelectorAll(
    '.standard-item input[type="checkbox"]:checked'
  );
  return Array.from(checkboxes).map((checkbox) => checkbox.value);
}

// Update active standards display
function updateActiveStandards() {
  const selectedStandards = getSelectedStandards();

  if (selectedStandards.length > 0) {
    standardsTagsContainer.innerHTML = selectedStandards
      .map(
        (standard) =>
          `<span class="standard-tag">${wcagStandards[standard]}</span>`
      )
      .join("");
    activeStandards.classList.remove("hidden");
  } else {
    activeStandards.classList.add("hidden");
  }
}

// Run the accessibility scan
function runAccessibilityScan() {
  console.log("[Raging A11y] Starting accessibility scan");

  const selectedStandards = getSelectedStandards();
  if (selectedStandards.length === 0) {
    alert("Please select at least one WCAG standard to test against.");
    return;
  }

  // Show loading indicator
  loadingIndicator.classList.remove("hidden");

  // Reset UI
  resetUI();

  // Hide config panel if open
  configPanel.classList.add("hidden");

  // For debugging - uncomment to use test data instead of real scan
  // testPopulateData();
  // return;

  // Execute the scan in the inspected window with selected standards
  console.log("[Raging A11y] Injecting axe-core into inspected window");

  // Simplified approach - inject axe and run directly
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      console.log('[Raging A11y - Page Context] Starting scan with standards:', ${JSON.stringify(
        selectedStandards
      )});
      
      // Load axe if not already loaded
      if (!window.axe) {
        console.log('[Raging A11y - Page Context] Loading axe-core');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
        script.onload = runAxeScan;
        document.head.appendChild(script);
      } else {
        console.log('[Raging A11y - Page Context] axe-core already loaded');
        runAxeScan();
      }
      
      function runAxeScan() {
        console.log('[Raging A11y - Page Context] Running axe scan');
        axe.run({
          runOnly: {
            type: 'tag',
            values: ${JSON.stringify(selectedStandards)}
          }
        })
        .then(results => {
          console.log('[Raging A11y - Page Context] Scan completed');
          window.__axeResults = results;
          console.log('[Raging A11y - Page Context] Results stored in window.__axeResults');
        })
        .catch(error => {
          console.error('[Raging A11y - Page Context] Scan error:', error);
          window.__axeScanError = error.message;
        });
      }
    })();
  `,
    (result, error) => {
      if (error) {
        console.error("[Raging A11y] Error injecting axe-core:", error);
        loadingIndicator.classList.add("hidden");
        return;
      }

      console.log("[Raging A11y] Scan initiated, checking for results");
      // Wait for the scan to complete and get results
      setTimeout(checkScanResults, 1000);
    }
  );
}

// Check for scan results
function checkScanResults() {
  console.log("[Raging A11y] Checking for scan results");

  chrome.devtools.inspectedWindow.eval(
    "window.__axeResults",
    (results, error) => {
      if (error) {
        console.error("[Raging A11y] Error checking scan results:", error);
        setTimeout(checkScanResults, 1000);
        return;
      }

      if (!results) {
        console.log("[Raging A11y] No results yet, checking again in 1 second");
        setTimeout(checkScanResults, 1000);
        return;
      }

      console.log("[Raging A11y] Scan results received:", results);
      processResults(results);
    }
  );
}

// Test function to populate data
function testPopulateData() {
  console.log("[Raging A11y] Populating test data");

  // Create test data
  const testResults = {
    violations: [
      {
        id: "test-violation-1",
        impact: "critical",
        help: "Test Critical Violation",
        helpUrl: "https://example.com",
        description: "This is a test critical violation",
        nodes: [
          { html: "<div>Test Element 1</div>", target: ["div"] },
          { html: "<span>Test Element 2</span>", target: ["span"] },
        ],
      },
      {
        id: "test-violation-2",
        impact: "serious",
        help: "Test Serious Violation",
        helpUrl: "https://example.com",
        description: "This is a test serious violation",
        nodes: [{ html: "<a>Test Element 3</a>", target: ["a"] }],
      },
    ],
    incomplete: [
      {
        id: "test-incomplete-1",
        impact: "moderate",
        help: "Test Moderate Incomplete",
        helpUrl: "https://example.com",
        description: "This is a test moderate incomplete issue",
        nodes: [
          { html: "<button>Test Element 4</button>", target: ["button"] },
        ],
      },
    ],
    passes: [
      {
        id: "test-pass-1",
        impact: "minor",
        help: "Test Minor Pass",
        helpUrl: "https://example.com",
        description: "This is a test minor pass",
        nodes: [{ html: "<img>Test Element 5</img>", target: ["img"] }],
      },
    ],
  };

  // Process the test results
  processResults(testResults);

  // Hide loading indicator
  loadingIndicator.classList.add("hidden");
}

// Inject axe-core into the inspected window
function injectAxeCore(selectedStandards) {
  return new Promise((resolve, reject) => {
    console.log("[Raging A11y - Page Context] Attempting to inject axe-core");

    // Run axe
    function runAxe() {
      console.log("[Raging A11y - Page Context] Running axe-core scan");
      console.log(
        "[Raging A11y - Page Context] Selected standards:",
        selectedStandards
      );

      axe
        .run({
          runOnly: {
            type: "tag",
            values: selectedStandards,
          },
        })
        .then((results) => {
          console.log(
            "[Raging A11y - Page Context] axe-core scan completed successfully"
          );
          console.log(
            "[Raging A11y - Page Context] Violations found:",
            results.violations.length
          );
          console.log(
            "[Raging A11y - Page Context] Incomplete found:",
            results.incomplete.length
          );
          window.__axeResults = results;
          window.__axeScanInProgress = false;
          resolve(results); // Resolve the promise with the results
        })
        .catch((error) => {
          console.error(
            "[Raging A11y - Page Context] Error running axe-core scan:",
            error
          );
          window.__axeScanError = error.message;
          window.__axeScanInProgress = false;
          reject(error); // Reject the promise with the error
        });
    }

    // Check if axe is already loaded
    if (window.axe) {
      console.log("[Raging A11y - Page Context] axe-core already loaded");
      window.__axeScanInProgress = true;
      runAxe();
      return;
    }

    // Load axe-core
    console.log("[Raging A11y - Page Context] Loading axe-core from CDN");
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
    script.onload = () => {
      console.log("[Raging A11y - Page Context] axe-core loaded successfully");
      window.__axeScanInProgress = true;
      runAxe();
    };
    script.onerror = (err) => {
      console.error(
        "[Raging A11y - Page Context] Failed to load axe-core",
        err
      );
      window.__axeScanError = "Failed to load axe-core";
      reject(err);
    };
    document.head.appendChild(script);
  });
}

// Check if the scan has completed
function checkScanStatus() {
  console.log("[Raging A11y] Checking scan status");
  chrome.devtools.inspectedWindow.eval(
    `
    ({
      inProgress: window.__axeScanInProgress,
      error: window.__axeScanError,
      results: window.__axeResults
    })
  `,
    (status, error) => {
      if (error) {
        console.error("[Raging A11y] Error checking scan status:", error);
        loadingIndicator.classList.add("hidden");
        return;
      }

      if (status.error) {
        console.error("[Raging A11y] Scan error:", status.error);
        loadingIndicator.classList.add("hidden");
        return;
      }

      if (status.inProgress) {
        // Scan still in progress, check again
        console.log(
          "[Raging A11y] Scan still in progress, checking again in 500ms"
        );
        setTimeout(checkScanStatus, 500);
        return;
      }

      // Scan completed
      console.log("[Raging A11y] Scan completed, processing results");
      processResults(status.results);
      loadingIndicator.classList.add("hidden");
    }
  );
}

// Process the scan results
function processResults(results) {
  console.log("[Raging A11y] Processing scan results:", results);
  if (!results) {
    console.error("[Raging A11y] No results to process");
    loadingIndicator.classList.add("hidden");
    return;
  }

  axeResults = results;

  // Reset all issue types
  issuesByType = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
    none: [],
  };
  incompleteByType = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
    none: [],
  };
  passesByType = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
    none: [],
  };

  // Process violations
  if (results.violations) {
    console.log("[Raging A11y] Processing violations:", results.violations);
    results.violations.forEach((violation) => {
      const issue = {
        id: violation.id,
        impact: violation.impact || "none",
        help: violation.help,
        helpUrl: violation.helpUrl,
        description: violation.description,
        nodes: violation.nodes,
      };
      console.log(
        `[Raging A11y] Adding violation with impact ${issue.impact}:`,
        issue
      );
      issuesByType[issue.impact].push(issue);
    });

    // Log violations summary
    Object.entries(issuesByType).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`[Raging A11y] ${severity} violations:`, issues.length);
      }
    });
  }

  // Process incomplete
  if (results.incomplete) {
    console.log("[Raging A11y] Processing incomplete:", results.incomplete);
    results.incomplete.forEach((incomplete) => {
      const issue = {
        id: incomplete.id,
        impact: incomplete.impact || "none",
        help: incomplete.help,
        helpUrl: incomplete.helpUrl,
        description: incomplete.description,
        nodes: incomplete.nodes,
      };
      console.log(
        `[Raging A11y] Adding incomplete with impact ${issue.impact}:`,
        issue
      );
      incompleteByType[issue.impact].push(issue);
    });

    // Log incomplete summary
    Object.entries(incompleteByType).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`[Raging A11y] ${severity} incomplete:`, issues.length);
      }
    });
  }

  // Process passes
  if (results.passes) {
    console.log("[Raging A11y] Processing passes:", results.passes);
    results.passes.forEach((pass) => {
      const issue = {
        id: pass.id,
        impact: pass.impact || "none",
        help: pass.help,
        helpUrl: pass.helpUrl,
        description: pass.description,
        nodes: pass.nodes,
      };
      console.log(
        `[Raging A11y] Adding pass with impact ${issue.impact}:`,
        issue
      );
      passesByType[issue.impact].push(issue);
    });

    // Log passes summary
    Object.entries(passesByType).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`[Raging A11y] ${severity} passes:`, issues.length);
      }
    });
  }

  // Log final state
  console.log("[Raging A11y] Final state:", {
    issuesByType,
    incompleteByType,
    passesByType,
  });

  // Update UI
  console.log("[Raging A11y] Updating UI components");
  updateSummaryCounts();
  updateTabCounts();
  updateActiveStandards();

  // Show initial results
  const firstViolationSeverity = Object.entries(issuesByType).find(
    ([severity, issues]) => issues.length > 0
  )?.[0];

  if (firstViolationSeverity) {
    console.log(
      `[Raging A11y] Showing initial violations for severity: ${firstViolationSeverity}`
    );
    showIssuesForSeverity(firstViolationSeverity);
  } else {
    console.log("[Raging A11y] No violations found to display");
  }

  loadingIndicator.classList.add("hidden");
}

// Update the summary counts with more logging
function updateSummaryCounts() {
  console.log("[Raging A11y] Updating summary counts");

  const updateCounts = (type, counts) => {
    console.log(`[Raging A11y] Updating counts for type: ${type}`, counts);
    Object.keys(counts).forEach((severity) => {
      const prefix = type ? `${type}-` : "";
      const countId = `${prefix}${severity}-count`;
      const issueCount = counts[severity].length;
      const elementCount = counts[severity].reduce(
        (total, issue) => total + (issue.nodes?.length || 0),
        0
      );

      console.log(
        `[Raging A11y] Updating ${countId}: ${issueCount} issues, ${elementCount} elements`
      );

      const countElement = document.getElementById(countId);
      if (!countElement) {
        console.error(`[Raging A11y] Count element not found: ${countId}`);
        return;
      }

      const severityItem = countElement.closest(".severity-item");
      if (!severityItem) {
        console.error(
          `[Raging A11y] Severity item not found for count: ${countId}`
        );
        return;
      }

      // Update the count
      countElement.textContent = issueCount;

      // Update or create the elements count
      const existingElementsCount =
        severityItem.querySelector(".elements-count");
      if (elementCount > 0) {
        if (existingElementsCount) {
          existingElementsCount.textContent = `${elementCount} elements`;
        } else {
          const elementsCountDiv = document.createElement("div");
          elementsCountDiv.className = "elements-count";
          elementsCountDiv.textContent = `${elementCount} elements`;
          severityItem.appendChild(elementsCountDiv);
        }
      } else if (existingElementsCount) {
        existingElementsCount.remove();
      }
    });
  };

  updateCounts("", issuesByType);
  updateCounts("incomplete", incompleteByType);
  updateCounts("passes", passesByType);
}

// Update the tab counts
function updateTabCounts() {
  // Calculate total violations
  const totalViolations = Object.values(issuesByType).reduce(
    (total, issues) => total + issues.length,
    0
  );
  const totalIncomplete = Object.values(incompleteByType).reduce(
    (total, issues) => total + issues.length,
    0
  );

  // Update violations tab
  const violationsTab = document.querySelector(
    '.tab-button[data-tab="violations"]'
  );
  let violationsCount = violationsTab.querySelector(".tab-count");
  if (!violationsCount) {
    violationsCount = document.createElement("span");
    violationsCount.className = "tab-count";
    violationsTab.appendChild(violationsCount);
  }
  violationsCount.textContent = totalViolations;
  violationsCount.style.display = totalViolations > 0 ? "inline-flex" : "none";

  // Update incomplete tab
  const incompleteTab = document.querySelector(
    '.tab-button[data-tab="incomplete"]'
  );
  let incompleteCount = incompleteTab.querySelector(".tab-count");
  if (!incompleteCount) {
    incompleteCount = document.createElement("span");
    incompleteCount.className = "tab-count";
    incompleteTab.appendChild(incompleteCount);
  }
  incompleteCount.textContent = totalIncomplete;
  incompleteCount.style.display = totalIncomplete > 0 ? "inline-flex" : "none";
}

// Helper function to escape HTML and wrap in pre/code tags
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Show issues for a specific severity
function showIssuesForSeverity(severity) {
  console.log(`[Raging A11y] Showing issues for severity: ${severity}`);

  // Highlight the selected severity
  document.querySelectorAll(".severity-item").forEach((item) => {
    if (item.dataset.severity === severity && !item.dataset.type) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Get issues for the selected severity
  const issues = issuesByType[severity] || [];
  console.log(
    `[Raging A11y] Found ${issues.length} issues for severity ${severity}:`,
    issues
  );

  // Clear the issues list
  const issuesList = document.getElementById("issues-list");
  issuesList.innerHTML = "";

  // Clear the elements list
  const elementsList = document.getElementById("elements-list");
  elementsList.innerHTML = "";

  // Display issues
  if (issues.length === 0) {
    console.log(`[Raging A11y] No issues found for severity: ${severity}`);
    issuesList.innerHTML =
      '<div class="no-issues">No issues found for this severity level.</div>';
    return;
  }

  // Add issues to the list
  issues.forEach((issue, index) => {
    console.log(`[Raging A11y] Adding issue ${index} to list:`, issue);
    const issueItem = document.createElement("div");
    issueItem.className = "issue-item";
    issueItem.dataset.index = index;

    // Create severity indicator first
    const issueSeverity = document.createElement("div");
    issueSeverity.className = `issue-severity ${severity}`;
    issueSeverity.textContent =
      severity.charAt(0).toUpperCase() + severity.slice(1);

    const issueHeader = document.createElement("div");
    issueHeader.className = "issue-header";

    const issueTitle = document.createElement("div");
    issueTitle.className = "issue-title";
    issueTitle.textContent = issue.help;

    const issueCount = document.createElement("span");
    issueCount.className = "issue-count-badge";
    issueCount.textContent = issue.nodes.length;

    issueHeader.appendChild(issueTitle);
    issueHeader.appendChild(issueCount);

    const issueDescription = document.createElement("div");
    issueDescription.className = "issue-description";
    issueDescription.innerHTML = `<pre><code>${escapeHtml(
      issue.description
    )}</code></pre>`;

    // Add elements in the correct order
    issueItem.appendChild(issueSeverity);
    issueItem.appendChild(issueHeader);
    issueItem.appendChild(issueDescription);

    // Add click event to show elements
    issueItem.addEventListener("click", () => {
      // Remove active class from all issues
      document.querySelectorAll(".issue-item").forEach((item) => {
        item.classList.remove("active");
      });

      // Add active class to clicked issue
      issueItem.classList.add("active");

      // Show elements for the issue
      showElementsForIssue(severity, index);
    });

    issuesList.appendChild(issueItem);
  });

  // Show elements for the first issue
  if (issues.length > 0) {
    console.log(`[Raging A11y] Showing elements for first issue`);
    const firstIssueItem = issuesList.querySelector(".issue-item");
    if (firstIssueItem) {
      firstIssueItem.classList.add("active");
      showElementsForIssue(severity, 0);
    }
  }
}

// Show incomplete issues for a specific severity
function showIncompleteIssuesForSeverity(severity) {
  console.log(
    `[Raging A11y] Showing incomplete issues for severity: ${severity}`
  );

  // Highlight the selected severity
  document
    .querySelectorAll('.severity-item[data-type="incomplete"]')
    .forEach((item) => {
      if (item.dataset.severity === severity) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

  // Get issues for the selected severity
  const issues = incompleteByType[severity] || [];
  console.log(
    `[Raging A11y] Found ${issues.length} incomplete issues for severity ${severity}`
  );

  // Clear the issues list
  const issuesList = document.getElementById("incomplete-issues-list");
  issuesList.innerHTML = "";

  // Clear the elements list
  const elementsList = document.getElementById("incomplete-elements-list");
  elementsList.innerHTML = "";

  // Display issues
  if (issues.length === 0) {
    console.log(
      `[Raging A11y] No incomplete issues found for severity: ${severity}`
    );
    issuesList.innerHTML =
      '<div class="no-issues">No incomplete issues found for this severity level.</div>';
    return;
  }

  // Add issues to the list
  issues.forEach((issue, index) => {
    console.log(
      `[Raging A11y] Adding incomplete issue ${index} to list:`,
      issue
    );
    const issueItem = document.createElement("div");
    issueItem.className = "issue-item";
    issueItem.dataset.index = index;

    // Create severity indicator first
    const issueSeverity = document.createElement("div");
    issueSeverity.className = `issue-severity ${severity}`;
    issueSeverity.textContent =
      severity.charAt(0).toUpperCase() + severity.slice(1);

    const issueHeader = document.createElement("div");
    issueHeader.className = "issue-header";

    const issueTitle = document.createElement("div");
    issueTitle.className = "issue-title";
    issueTitle.textContent = issue.help;

    const issueCount = document.createElement("span");
    issueCount.className = "issue-count-badge";
    issueCount.textContent = issue.nodes.length;

    issueHeader.appendChild(issueTitle);
    issueHeader.appendChild(issueCount);

    const issueDescription = document.createElement("div");
    issueDescription.className = "issue-description";
    issueDescription.innerHTML = `<pre><code>${escapeHtml(
      issue.description
    )}</code></pre>`;

    // Add elements in the correct order
    issueItem.appendChild(issueSeverity);
    issueItem.appendChild(issueHeader);
    issueItem.appendChild(issueDescription);

    // Add click event to show elements
    issueItem.addEventListener("click", () => {
      // Remove active class from all issues
      document.querySelectorAll(".issue-item").forEach((item) => {
        item.classList.remove("active");
      });

      // Add active class to clicked issue
      issueItem.classList.add("active");

      // Show elements for the issue
      showElementsForIssue(severity, index, "incomplete");
    });

    issuesList.appendChild(issueItem);
  });

  // Show elements for the first issue
  if (issues.length > 0) {
    console.log(`[Raging A11y] Showing elements for first incomplete issue`);
    const firstIssueItem = issuesList.querySelector(".issue-item");
    if (firstIssueItem) {
      firstIssueItem.classList.add("active");
      showElementsForIssue(severity, 0, "incomplete");
    }
  }
}

// Show passes for a specific severity
function showPassesForSeverity(severity) {
  console.log(`[Raging A11y] Showing passes for severity: ${severity}`);

  // Highlight the selected severity
  document
    .querySelectorAll('.severity-item[data-type="passes"]')
    .forEach((item) => {
      if (item.dataset.severity === severity) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

  // Get issues for the selected severity
  const issues = passesByType[severity] || [];
  console.log(
    `[Raging A11y] Found ${issues.length} passes for severity ${severity}`
  );

  // Clear the issues list
  const issuesList = document.getElementById("passes-issues-list");
  issuesList.innerHTML = "";

  // Clear the elements list
  const elementsList = document.getElementById("passes-elements-list");
  elementsList.innerHTML = "";

  // Display issues
  if (issues.length === 0) {
    console.log(`[Raging A11y] No passes found for severity: ${severity}`);
    issuesList.innerHTML =
      '<div class="no-issues">No passes found for this severity level.</div>';
    return;
  }

  // Add issues to the list
  issues.forEach((issue, index) => {
    console.log(`[Raging A11y] Adding pass ${index} to list:`, issue);
    const issueItem = document.createElement("div");
    issueItem.className = "issue-item";
    issueItem.dataset.index = index;

    // Create severity indicator first
    const issueSeverity = document.createElement("div");
    issueSeverity.className = `issue-severity ${severity}`;
    issueSeverity.textContent =
      severity.charAt(0).toUpperCase() + severity.slice(1);

    const issueHeader = document.createElement("div");
    issueHeader.className = "issue-header";

    const issueTitle = document.createElement("div");
    issueTitle.className = "issue-title";
    issueTitle.textContent = issue.help;

    const issueCount = document.createElement("span");
    issueCount.className = "issue-count-badge";
    issueCount.textContent = issue.nodes.length;

    issueHeader.appendChild(issueTitle);
    issueHeader.appendChild(issueCount);

    const issueDescription = document.createElement("div");
    issueDescription.className = "issue-description";
    issueDescription.innerHTML = `<pre><code>${escapeHtml(
      issue.description
    )}</code></pre>`;

    // Add elements in the correct order
    issueItem.appendChild(issueSeverity);
    issueItem.appendChild(issueHeader);
    issueItem.appendChild(issueDescription);

    // Add click event to show elements
    issueItem.addEventListener("click", () => {
      // Remove active class from all issues
      document.querySelectorAll(".issue-item").forEach((item) => {
        item.classList.remove("active");
      });

      // Add active class to clicked issue
      issueItem.classList.add("active");

      // Show elements for the issue
      showElementsForIssue(severity, index, "passes");
    });

    issuesList.appendChild(issueItem);
  });

  // Show elements for the first issue
  if (issues.length > 0) {
    console.log(`[Raging A11y] Showing elements for first pass`);
    const firstIssueItem = issuesList.querySelector(".issue-item");
    if (firstIssueItem) {
      firstIssueItem.classList.add("active");
      showElementsForIssue(severity, 0, "passes");
    }
  }
}

// Show elements for a specific issue
function showElementsForIssue(severity, issueIndex, type = "violations") {
  console.log(
    `[Raging A11y] Showing elements for ${type} issue: ${severity} #${issueIndex}`
  );

  // Get the issue
  let issue;
  if (type === "violations") {
    issue = issuesByType[severity][issueIndex];
  } else if (type === "incomplete") {
    issue = incompleteByType[severity][issueIndex];
  } else if (type === "passes") {
    issue = passesByType[severity][issueIndex];
  }

  if (!issue) {
    console.error(
      `[Raging A11y] Issue not found: ${type} ${severity} #${issueIndex}`
    );
    return;
  }

  console.log(`[Raging A11y] Found issue:`, issue);

  // Get the elements list
  let elementsList;
  if (type === "violations") {
    elementsList = document.getElementById("elements-list");
  } else if (type === "incomplete") {
    elementsList = document.getElementById("incomplete-elements-list");
  } else if (type === "passes") {
    elementsList = document.getElementById("passes-elements-list");
  }

  if (!elementsList) {
    console.error(`[Raging A11y] Elements list not found for type: ${type}`);
    return;
  }

  // Clear the elements list
  elementsList.innerHTML = "";

  // Display elements
  if (!issue.nodes || issue.nodes.length === 0) {
    console.log(`[Raging A11y] No elements found for issue: ${issue.help}`);
    elementsList.innerHTML =
      '<div class="no-elements">No elements found for this issue.</div>';
    return;
  }

  console.log(
    `[Raging A11y] Found ${issue.nodes.length} elements for issue: ${issue.help}`
  );

  // Add elements to the list
  issue.nodes.forEach((node, index) => {
    console.log(`[Raging A11y] Adding element ${index} to list:`, node);
    const elementItem = document.createElement("div");
    elementItem.className = "element-item";

    const elementSelector = document.createElement("div");
    elementSelector.className = "element-selector";
    elementSelector.textContent = node.target.join(" > ");

    const elementHtml = document.createElement("div");
    elementHtml.className = "element-html";
    elementHtml.innerHTML = `<pre><code>${escapeHtml(node.html)}</code></pre>`;

    elementItem.appendChild(elementSelector);
    elementItem.appendChild(elementHtml);

    // Add click event to highlight element
    elementItem.addEventListener("click", () => {
      console.log(`[Raging A11y] Element clicked: ${node.target.join(" > ")}`);
      highlightElement(node.target);
    });

    elementsList.appendChild(elementItem);
  });
}

// Highlight an element on the page
function highlightElement(target) {
  // Create a selector from the target
  const selector = target.join(" > ");
  console.log(`[Raging A11y] Attempting to highlight element: ${selector}`);

  // Use both methods for highlighting:
  // 1. Direct eval in the inspected window (works in most cases)
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      console.log('[Raging A11y - Page Context] Highlighting element: ${selector.replace(
        /'/g,
        "\\'"
      )}');
      // Remove previous highlights
      const previousHighlights = document.querySelectorAll('.raging-a11y-highlight');
      previousHighlights.forEach(el => {
        el.classList.remove('raging-a11y-highlight');
        el.style.outline = '';
        el.style.outlineOffset = '';
      });
      
      // Find and highlight the element
      try {
        const element = document.querySelector('${selector.replace(
          /'/g,
          "\\'"
        )}');
        if (element) {
          console.log('[Raging A11y - Page Context] Element found and highlighted');
          element.classList.add('raging-a11y-highlight');
          element.style.outline = '10px dashed #4285f4';
          element.style.outlineOffset = '2px';
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        } else {
          console.log('[Raging A11y - Page Context] Element not found with selector: ${selector.replace(
            /'/g,
            "\\'"
          )}');
        }
      } catch (error) {
        console.error('[Raging A11y - Page Context] Error highlighting element:', error);
      }
      return false;
    })();
  `,
    (result, error) => {
      if (error) {
        console.error(
          "[Raging A11y] Error highlighting element via eval:",
          error
        );

        // 2. Message passing through content script (backup method)
        console.log(
          "[Raging A11y] Trying to highlight via content script message passing"
        );
        chrome.runtime.sendMessage(
          {
            action: "highlight-element",
            selector: selector,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "[Raging A11y] Error sending message:",
                chrome.runtime.lastError
              );
            } else {
              console.log(
                "[Raging A11y] Message sent to content script, response:",
                response
              );
            }
          }
        );
      } else {
        console.log("[Raging A11y] Element highlight result:", result);
      }
    }
  );
}

// Reset the UI
function resetUI() {
  console.log("[Raging A11y] Resetting UI");
  // Clear all lists
  [
    issuesList,
    elementsList,
    incompleteIssuesList,
    incompleteElementsList,
    passesIssuesList,
    passesElementsList,
  ].forEach((list) => (list.innerHTML = ""));

  // Reset state
  currentSeverity = null;
  currentIssue = null;

  // Remove active classes
  severityItems.forEach((item) => item.classList.remove("active"));

  // Reset all counts
  const severities = ["critical", "serious", "moderate", "minor", "none"];
  const types = ["", "incomplete-", "passes-"];

  types.forEach((type) => {
    severities.forEach((severity) => {
      document.getElementById(`${type}${severity}-count`).textContent = "0";
    });
  });

  // Reset tab counts
  const countElements = document.querySelectorAll(".tab-count");
  countElements.forEach((count) => {
    count.style.display = "none";
    count.textContent = "0";
  });

  // Switch to violations tab
  switchTab("violations");
}

// Initialize the panel
function initPanel() {
  console.log("[Raging A11y] Initializing panel");
  initEventListeners();
}

// Start the panel when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Raging A11y] DOM content loaded");
  initPanel();
});
