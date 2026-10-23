# Chrome Web Store Listing — JSONTool

> Last Updated: 2026-10-23

## Store Listing

**Extension Name** [REQUIRED]
JSONTool

**Short Description** [REQUIRED]
Fast JSON formatting, visual diff comparison, table view, and history snapshot manager running 100% locally in your browser.

**Detailed Description** [REQUIRED]
JSONTool is a clean, modern, and privacy-first browser extension for developers and data analysts working with JSON. 

All operations run entirely on your device — your data never leaves your browser.

Key Features:
- Format & Beautify: Instantly format, indent, compact, and sort complex JSON documents with one click.
- JS Object & Loose Syntax: Effortlessly parse and convert loose JavaScript object literals into valid JSON.
- Visual Diff Comparison: Side-by-side real-time diff view to quickly identify, highlight, and review changes between two JSON payloads.
- Interactive Table View: Automatically convert arrays of JSON objects into customizable data tables with column resizing, multi-column sorting, and instant search.
- Multi-Tab Session & Snapshots: Keep multiple JSON tabs open without losing your place; save instant snapshots to revisit earlier revisions at any time.
- Modern Fluent 2 Interface: Clean acrylic glass styling with seamless dark and light mode support.

How to Use:
1. Click the JSONTool icon in your browser toolbar to open the workspace.
2. Paste or type your JSON into the editor.
3. Use the toolbar buttons to format, compact, sort keys, or switch to Table and Diff views.
4. Press Ctrl+S (Cmd+S on Mac) anytime to save a snapshot to your local history.

Privacy & Security:
JSONTool does not make network requests, does not use external tracking or analytics, and does not require third-party accounts. Your payloads stay in your local browser storage.

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
A fast and secure local tool for formatting, comparing, and viewing JSON data in your browser.

**Primary Language** [REQUIRED]
Chinese (Simplified) / English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `public/icons/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ To be captured | Main Editor & Formatting (Dark/Light mode) |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ To be captured | Side-by-Side Diff View |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ To be captured | Interactive Table View |
| Screenshot 4 | 1280×800 | ⬜ To be captured | Multi-tab & History Snapshots |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ To be created | Promo banner |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Used exclusively to save user editor tabs, snapshots, and interface preferences (theme and language) in the browser's local storage (`chrome.storage.local`). No data is ever transmitted to remote servers. |

---

## Privacy & Data Use

### Data Collection
**Does the extension collect user data?** No

JSONTool processes all JSON text locally in the browser runtime and stores user-saved snapshots strictly in browser local storage. No data is collected, logged, or transferred off-device.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Distribution

**Visibility**: Public
**Regions**: All regions

---

## Developer Info

**Publisher Name**: JSONTool Developer
**Support URL**: https://github.com/liu7say/JSONTool/issues
**Homepage URL**: https://github.com/liu7say/JSONTool

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.7.0 | 2026-10-23 | Initial Chrome Web Store package with Fluent 2 design, i18n, table view, and diff mode. | Draft |
