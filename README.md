# Raging A11y

A set of a11y testing tools for the web.

- A Chrome DevTools extension for accessibility testing.

## Features

- Analyzes the accessibility of the current page.
- Displays findings in a table format.
- Summarizes findings grouped by severity.
- Drill down to issues and offending elements.
- Identify offending elements on the page.

## Installation

### Development Mode

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now be installed and visible in your Chrome DevTools

### From Chrome Web Store

_Coming soon_

## Usage

1. Open Chrome DevTools (F12 or Right-click > Inspect)
2. Navigate to the "A11y" panel in DevTools
3. Click the "Scan" button to analyze the current page
4. Review the summary of findings by severity
5. Click on a severity count to view the specific issues
6. Click on an issue to view the affected elements
7. Click on an element to highlight it on the page

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `devtools.html` & `devtools.js`: DevTools panel initialization
- `panel.html`, `panel.css`, & `panel.js`: Main UI and functionality
- `background.js`: Background script for extension initialization
- `content-script.js`: Content script for page interaction

### Technologies Used

- JavaScript
- HTML/CSS
- [axe-core](https://github.com/dequelabs/axe-core): Accessibility testing library

## License

MIT

## Credits

This extension uses the [axe-core](https://github.com/dequelabs/axe-core) library by Deque Systems.
