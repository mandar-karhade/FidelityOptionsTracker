# Fidelity Options Tracker

A Chrome extension that tracks and analyzes your options trading activity from Fidelity.

## Features

- **Automatic Data Capture**: Intercepts trade data when you visit the Fidelity Activity & Orders page
- **Analytics Dashboard**: View P&L metrics, charts, and trade breakdowns
- **Trade History**: Sortable, filterable table of all your options trades
- **CSV Export**: Download your trade data for external analysis
- **Aggregation**: Group trades by ticker, date, expiry, action, and type

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/mandar-karhade/FidelityOptionsTracker.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the cloned folder

5. The extension icon will appear in your toolbar

## Usage

1. Log in to your Fidelity account
2. Navigate to **Activity & Orders** page
3. Click the extension icon - it will automatically open the dashboard
4. View your options trading analytics

## Dashboard Features

### Summary Cards
- Total P&L
- Total Trades
- Win Rate
- Premium Collected
- Fees & Commission

### Charts
- Cumulative P&L over time
- P&L by ticker

### Trade History
- Filter by cancelled/executed trades
- Aggregate view to combine similar trades
- Export to CSV

## Privacy

**Your data stays local.** This extension:

- Stores all data locally in Chrome storage
- Does NOT transmit any data to external servers
- Does NOT collect any personal information
- Only activates on Fidelity's website (`digital.fidelity.com`)

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Permissions

The extension requires these permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Store trade data locally in your browser |
| `scripting` | Inject script to capture trade data from Fidelity |
| `tabs` | Open the dashboard in a new tab |
| `host_permissions` | Only access `digital.fidelity.com` |

## Tech Stack

- Vanilla JavaScript
- Chart.js for visualizations
- Chrome Extension Manifest V3

## License

MIT License - see [LICENSE](LICENSE) for details.

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to Fidelity Investments. Use at your own risk. The extension is provided "as is" without warranty of any kind.
