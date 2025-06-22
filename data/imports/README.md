# Portfolio CSV Import Guide

## Supported Brokers

### Charles Schwab
The CSV should include these columns:
- **Date** - Transaction date
- **Action** - Buy/Sell
- **Symbol** - Stock ticker
- **Description** - Company name (optional)
- **Quantity** - Number of shares
- **Price** - Price per share
- **Fees & Comm** - Transaction fees
- **Amount** - Total amount

### Fidelity
The CSV should include these columns:
- **Run Date** - Transaction date
- **Account** - Account name (optional)
- **Action** - "YOU BOUGHT" or "YOU SOLD"
- **Symbol** - Stock ticker
- **Security Description** - Fund/stock name
- **Quantity** - Number of shares
- **Price ($)** - Price per share
- **Commission ($)** - Transaction fees
- **Amount ($)** - Total amount

## Sample Files
I've created sample CSV files for testing:
- `sample_schwab_portfolio.csv` - Example Schwab format
- `sample_fidelity_portfolio.csv` - Example Fidelity Roth IRA format

## How to Export from Your Broker

### Charles Schwab
1. Log into your Schwab account
2. Go to "History" or "Transactions"
3. Select date range
4. Click "Export" → "CSV"

### Fidelity
1. Log into your Fidelity account
2. Go to "Activity & Orders" → "History"
3. Select your account and date range
4. Click "Download" → Choose "CSV" format

## Notes
- The system automatically detects which broker format you're using
- Only BUY and SELL transactions are imported
- Dividends and other transaction types are skipped (for now)
