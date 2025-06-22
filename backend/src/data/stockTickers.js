// Stock Tickers Map with company names for search functionality
export const STOCK_TICKERS = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'GOOGL': 'Alphabet Inc. (Google) Class A',
    'GOOG': 'Alphabet Inc. (Google) Class C',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'BRK.B': 'Berkshire Hathaway Inc. Class B',
    'UNH': 'UnitedHealth Group Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'JNJ': 'Johnson & Johnson',
    'V': 'Visa Inc.',
    'PG': 'Procter & Gamble Co.',
    'MA': 'Mastercard Inc.',
    'HD': 'Home Depot Inc.',
    'CVX': 'Chevron Corporation',
    'ABBV': 'AbbVie Inc.',
    'LLY': 'Eli Lilly and Company',
    'PFE': 'Pfizer Inc.',
    'BAC': 'Bank of America Corp.',
    'KO': 'Coca-Cola Company',
    'PEP': 'PepsiCo Inc.',
    'AVGO': 'Broadcom Inc.',
    'COST': 'Costco Wholesale Corporation',
    'TMO': 'Thermo Fisher Scientific Inc.',
    'CSCO': 'Cisco Systems Inc.',
    'WMT': 'Walmart Inc.',
    'ABT': 'Abbott Laboratories',
    'MRK': 'Merck & Co. Inc.',
    'DIS': 'Walt Disney Company',
    'VZ': 'Verizon Communications Inc.',
    'CMCSA': 'Comcast Corporation',
    'ADBE': 'Adobe Inc.',
    'CRM': 'Salesforce Inc.',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices Inc.',
    'INTC': 'Intel Corporation',
    'IBM': 'International Business Machines Corporation',
    'T': 'AT&T Inc.',
    'PYPL': 'PayPal Holdings Inc.',
    'QCOM': 'Qualcomm Inc.',
    'NKE': 'Nike Inc.',
    'XOM': 'Exxon Mobil Corporation',
    'TXN': 'Texas Instruments Inc.',
    'DHR': 'Danaher Corporation',
    'PM': 'Philip Morris International Inc.',
    'ORCL': 'Oracle Corporation',
    'NEE': 'NextEra Energy Inc.',
    'MS': 'Morgan Stanley',
    'RTX': 'Raytheon Technologies Corporation',
    'WFC': 'Wells Fargo & Company',
    'LIN': 'Linde plc',
    'UPS': 'United Parcel Service Inc.',
    'BMY': 'Bristol-Myers Squibb Company',
    'C': 'Citigroup Inc.',
    'ACN': 'Accenture plc',
    'LOW': 'Lowe\'s Companies Inc.',
    'MDT': 'Medtronic plc',
    'SBUX': 'Starbucks Corporation',
    'AMGN': 'Amgen Inc.',
    'AMT': 'American Tower Corporation',
    'CAT': 'Caterpillar Inc.',
    'BA': 'Boeing Company',
    'GS': 'Goldman Sachs Group Inc.',
    'SPY': 'SPDR S&P 500 ETF',
    'QQQ': 'Invesco QQQ Trust (Nasdaq 100)',
    'IWM': 'iShares Russell 2000 ETF',
    'DIA': 'SPDR Dow Jones Industrial Average ETF'
};

// For quick validation and sanitization of stock symbols
export const isValidStockSymbol = (symbol) => {
    const normalizedSymbol = symbol?.toUpperCase();
    return (
        // Check in our predefined map
        STOCK_TICKERS.hasOwnProperty(normalizedSymbol) ||
        // Standard ETFs
        ['SPY', 'QQQ', 'DIA', 'IWM', 'XLF', 'XLE', 'XLK', 'XLV', 'XLI', 
         'XLP', 'XLY', 'XLB', 'XLU', 'XLRE', 'XLC', 'VOO', 'VTI', 'VEA', 
         'VWO', 'BND', 'IBIT', 'TLT', 'GLD'].includes(normalizedSymbol) ||
        // Valid formatting pattern (1-5 letters, optionally followed by .US)
        /^[A-Z]{1,5}(\.US)?$/.test(normalizedSymbol)
    );
};

// Helper to format symbol for API calls
export const formatSymbolForAPI = (symbol) => {
    const normalizedSymbol = symbol?.toUpperCase();
    // Add .US if needed for EOD API
    return normalizedSymbol.includes('.US') ? normalizedSymbol : `${normalizedSymbol}.US`;
};

// Extract just the stock symbol without extension
export const getBaseSymbol = (symbol) => {
    return symbol?.replace(/\.US$/, '');
};
