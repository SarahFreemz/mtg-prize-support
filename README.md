# MTG Prize Support Calculator

A web application for calculating Magic: The Gathering (or other TCG) tournament prize distributions based on entry fees, player counts, and pack prices.

Currently deployed at https://mtg-prize-support.fly.dev/

## Overview

This application helps tournament organizers calculate how many prize packs can be distributed based on:
- Number of players and entry fees
- Store profit margins and operational costs
- Tournament Organizer (TO) payouts
- Sales tax considerations
- Pack wholesale costs

## Features

- **Dynamic Prize Calculation**: Automatically calculates available prize packs based on revenue and costs
- **Configurable Parameters**: Adjust store profit rates, TO payouts, cost factors, and tax rates
- **Multiple Pack Types**: Support for different pack types with varying prices
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Results**: Instant calculations as you input data

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mtg-prize-support-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser to `http://localhost:8080`

## How It Works

### Basic Calculation Flow

1. **Total Revenue**: `Number of Players × Entry Fee`
2. **After Tax**: `Total Revenue ÷ (1 + Sales Tax Rate)`
3. **Store Profit**: `After Tax × Store Profit Rate`
4. **TO Payout**: `After Tax × TO Payout Rate` (if enabled)
5. **Prize Pool**: `After Tax - Store Profit - TO Payout`
6. **Packs per Type**: `Prize Pool ÷ (Pack Price × Store Cost Factor)` (rounded up)

### Configuration Options

- **Store Profit Rate**: Percentage of revenue retained as store profit (default: 20%)
- **TO Payout Rate**: Percentage paid to tournament organizer (default: 20%)
- **Store Cost Factor**: Wholesale cost as percentage of retail price (default: 60%)
- **Sales Tax Rate**: Local sales tax percentage (default: 6%)

## Usage

1. **Enter Tournament Details**:
   - Number of players
   - Entry fee per player
   - Check "With TO" if paying a tournament organizer

2. **Add Prize Packs**:
   - Enter pack name and retail price
   - Use "Add Another" for multiple pack types
   - Use "Remove Last" to delete entries

3. **Adjust Configuration** (optional):
   - Click the gear icon to modify calculation parameters
   - Settings reset to defaults on page refresh

4. **Calculate**:
   - Click "Submit" to see prize distribution
   - Results show total packs available for each type

## Example

**Tournament Setup**:
- 8 players × $15 entry = $120 total
- With TO payout enabled
- Thunder Junction packs at $5.99 retail

**Calculation** (using defaults):
- After 6% tax: $113.21
- Store profit (20%): $22.64
- TO payout (20%): $22.64
- Prize pool: $67.93
- Thunder Junction packs: $67.93 ÷ ($5.99 × 0.6) = 19 packs

## File Structure

```
src/
├── server.js              # Express server and calculation logic
├── public/
│   └── PrizeSupportForm.html  # Frontend form and UI
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## API

### POST `/process`

Processes tournament data and returns prize calculations.

**Request Body**:
```javascript
{
  "numPlayers": 8,
  "entryFee": 15,
  "withTO": true,
  "config": {
    "storeProfitRate": 0.20,
    "toPayoutRate": 0.20,
    "storeCostFactor": 0.60,
    "salesTaxRate": 0.06
  },
  "packs": [
    {
      "name": "Thunder Junction",
      "price": "5.99"
    }
  ]
}
```

**Response**:
```javascript
{
  "result": "Prize Distribution\nTO Payout: $22.64\nThunder Junction: 19 pack(s)"
}
```

## Development

### Local Development
```bash
npm start
```
Server runs on `http://localhost:8080`

### Technologies Used
- **Backend**: Node.js, Express
- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **Styling**: Bootstrap CSS framework

## Deployment

The app can be deployed to any Node.js hosting platform:

- **Fly.io**: `flyctl deploy`
- **Heroku**: Standard Node.js deployment
- **Vercel**: Upload project files
- **DigitalOcean**: App Platform deployment

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For questions or issues, please open an issue in the repository.