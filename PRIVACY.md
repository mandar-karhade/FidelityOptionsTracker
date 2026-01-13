# Privacy Policy

**Last updated: January 2026**

## Overview

Fidelity Options Tracker is a browser extension that helps you analyze your options trading activity. **We do not collect any data.** All processing happens locally in your browser.

## No Data Collection

**This extension does not collect, transmit, or store any data on external servers.**

- No analytics
- No telemetry
- No tracking
- No data leaves your browser

## What the Extension Accesses Locally

The extension reads the following data from your Fidelity Activity & Orders page to display in your local dashboard:

- Trade dates
- Option symbols (ticker, strike, expiry, type)
- Trade actions (buy/sell, open/close)
- Quantities and prices
- Commissions and fees
- Order status

This data is accessed only when you visit the Fidelity Activity page and is stored locally in your browser using Chrome's storage API. **It never leaves your device.**

## What the Extension Does NOT Access

- Account numbers or balances
- Personal identification information
- Login credentials
- Social security numbers
- Any data from pages other than Activity & Orders

## Local Storage Only

- All data stays in your browser's local storage
- Data is not synced across devices
- Data is not backed up to any cloud service
- Uninstalling the extension removes all stored data

## No External Communication

This extension makes **zero network requests** to external servers. The only network activity is your normal browsing of the Fidelity website.

## Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Store trade data locally in your browser (not externally) |
| `scripting` | Read trade data from Fidelity's page |
| `tabs` | Open the analytics dashboard in a new browser tab |
| `host_permissions: digital.fidelity.com` | Only activate on Fidelity's website |

## Your Control

You can:
- View all locally stored data via Chrome DevTools
- Export your data to CSV from the dashboard
- Delete all data by uninstalling the extension
- Review the source code on GitHub

## Open Source

This extension is fully open source. Review the code yourself:

https://github.com/mandar-karhade/FidelityOptionsTracker

## Contact

Questions? Open an issue on GitHub:

https://github.com/mandar-karhade/FidelityOptionsTracker/issues
