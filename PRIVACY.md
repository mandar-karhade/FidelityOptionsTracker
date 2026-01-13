# Privacy Policy

**Last updated: January 2026**

## Overview

Fidelity Options Tracker is a browser extension that helps you analyze your options trading activity. This privacy policy explains how the extension handles your data.

## Data Collection

### What We Collect

The extension captures the following data from your Fidelity Activity & Orders page:

- Trade dates
- Option symbols (ticker, strike, expiry, type)
- Trade actions (buy/sell, open/close)
- Quantities and prices
- Commissions and fees
- Order status

### What We Do NOT Collect

- Account numbers or balances
- Personal identification information
- Login credentials
- Social security numbers
- Any data from pages other than Activity & Orders

## Data Storage

**All data is stored locally on your device.**

- Data is stored using Chrome's local storage API
- Data never leaves your browser
- Data is not synced across devices
- Data is not backed up to any cloud service

## Data Transmission

**This extension does NOT transmit any data to external servers.**

- No analytics or telemetry
- No third-party services
- No network requests to external endpoints
- The only network activity is loading the Fidelity website itself

## Data Sharing

**We do not share your data with anyone.**

- No data is sold
- No data is shared with third parties
- No data is used for advertising

## Data Retention

- Data remains in your browser until you clear it
- Uninstalling the extension removes all stored data
- You can clear data manually via Chrome's extension settings

## Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Store your trade data locally so it persists between sessions |
| `scripting` | Inject a script to read trade data from Fidelity's page |
| `tabs` | Open the analytics dashboard in a new browser tab |
| `host_permissions: digital.fidelity.com` | Only activate on Fidelity's website |

## Security

- The extension only runs on `digital.fidelity.com`
- No external scripts are loaded (Chart.js is bundled locally)
- No sensitive data is logged to the console in production
- Source code is open and available for review

## Your Rights

You can:

- View all stored data via Chrome DevTools
- Export your data to CSV from the dashboard
- Delete all data by uninstalling the extension
- Review the source code on GitHub

## Changes to This Policy

Any changes to this privacy policy will be posted in the GitHub repository with an updated date.

## Contact

For questions or concerns about this privacy policy, please open an issue on GitHub:

https://github.com/mandar-karhade/FidelityOptionsTracker/issues

## Open Source

This extension is open source. You can review the complete source code at:

https://github.com/mandar-karhade/FidelityOptionsTracker
