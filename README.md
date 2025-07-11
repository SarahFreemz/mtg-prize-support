# MTG Prize Support Calculator

A web application for calculating Magic: The Gathering tournament prize distributions based on entry fees, player counts, and pack prices.

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
- **Responsive Design**: Works on desktop and mobile devices using Bootstrap 5
- **Real-time Results**: Instant calculations as you input data

## Project Structure

- **src/server.js**: Express server and main calculation logic
- **src/public/PrizeSupportForm.html**: Frontend form and user interface
- **package.json**: Node.js dependencies and scripts
- **Dockerfile**: Container configuration for deployment
- **README.md**: Project documentation

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mtg-prize-support-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   Open your browser to `http://localhost:8080`

### Docker Deployment

1. **Build the Docker image**:
   ```bash
   docker build -t mtg-prize-support-app .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8080:8080 mtg-prize-support-app
   ```

## How It Works

### Calculation Flow

1. **Total Revenue**: `Number of Players × Entry Fee`
2. **After Tax**: `Total Revenue ÷ (1 + Sales Tax Rate)`
3. **Store Profit**: `After Tax × Store Profit Rate`
4. **TO Payout**: `After Tax × TO Payout Rate` (if enabled)
5. **Prize Pool**: `After Tax - Store Profit - TO Payout`
6. **Packs per Type**: `Prize Pool ÷ (Pack Price × Store Cost Factor)` (rounded up)

### Default Configuration

- **Store Profit Rate**: 20% of revenue
- **TO Payout Rate**: 20% of revenue (when enabled)
- **Store Cost Factor**: 60% (wholesale cost as percentage of retail)
- **Sales Tax Rate**: 6%

## Usage Guidelines

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

4. **Calculate Results**:
   - Click "Submit" to see prize distribution
   - Results show total packs available for each type

## API Reference

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

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **Deployment**: Docker, Fly.io compatible

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.