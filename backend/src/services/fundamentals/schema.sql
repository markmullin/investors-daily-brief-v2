-- Fundamental Rankings Database Schema
-- Run this to set up the tables for S&P 500 fundamental rankings

-- Table to store S&P 500 constituent list
CREATE TABLE IF NOT EXISTS sp500_constituents (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    added_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store raw fundamental data for each company
CREATE TABLE IF NOT EXISTS company_fundamentals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period VARCHAR(10) NOT NULL, -- 'annual', 'Q1', 'Q2', etc.
    
    -- Income Statement Data
    revenue BIGINT,
    net_income BIGINT,
    gross_profit BIGINT,
    operating_income BIGINT,
    
    -- Balance Sheet Data
    total_assets BIGINT,
    total_liabilities BIGINT,
    shareholder_equity BIGINT,
    total_debt BIGINT,
    
    -- Cash Flow Data
    operating_cash_flow BIGINT,
    free_cash_flow BIGINT,
    capital_expenditures BIGINT,
    
    -- Calculated Ratios
    profit_margin DECIMAL(8,4),
    roe DECIMAL(8,4),
    debt_to_equity DECIMAL(8,4),
    
    -- Analyst Estimates (forward-looking)
    projected_revenue_growth_1y DECIMAL(8,4),
    projected_earnings_growth_1y DECIMAL(8,4),
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'FMP_API',
    collection_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT unique_fundamental_record UNIQUE (symbol, fiscal_year, fiscal_period)
);

-- Table to store calculated rankings for each metric
CREATE TABLE IF NOT EXISTS fundamental_rankings (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    
    -- Metric information
    metric_type VARCHAR(50) NOT NULL, -- 'revenue_growth_yoy', 'profit_margin', etc.
    metric_value DECIMAL(12,4),
    metric_rank INTEGER,
    percentile DECIMAL(5,2),
    
    -- Additional context
    fiscal_year INTEGER,
    sector VARCHAR(100),
    market_cap BIGINT,
    
    -- Metadata
    calculation_date DATE DEFAULT CURRENT_DATE,
    is_top_5 BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for fast top 5 queries
    INDEX idx_rankings_top5 (metric_type, metric_rank, is_top_5),
    INDEX idx_rankings_symbol (symbol),
    INDEX idx_rankings_date (calculation_date)
);

-- Table to store batch processing logs
CREATE TABLE IF NOT EXISTS fundamental_batch_logs (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    
    -- Processing statistics
    total_companies INTEGER,
    successful_companies INTEGER,
    failed_companies INTEGER,
    api_calls_made INTEGER,
    
    -- Status and errors
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_details TEXT,
    performance_stats JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fundamentals_symbol_year ON company_fundamentals(symbol, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_fundamentals_collection_date ON company_fundamentals(collection_date);
CREATE INDEX IF NOT EXISTS idx_rankings_metric_rank ON fundamental_rankings(metric_type, metric_rank);

-- View for easy access to latest rankings
CREATE OR REPLACE VIEW latest_fundamental_rankings AS
SELECT 
    fr.*,
    cf.market_cap,
    cf.sector
FROM fundamental_rankings fr
JOIN sp500_constituents cf ON fr.symbol = cf.symbol
WHERE fr.calculation_date = (
    SELECT MAX(calculation_date) 
    FROM fundamental_rankings fr2 
    WHERE fr2.metric_type = fr.metric_type
)
ORDER BY fr.metric_type, fr.metric_rank;

-- View for top 5 performers in each metric
CREATE OR REPLACE VIEW top5_fundamental_performers AS
SELECT 
    metric_type,
    symbol,
    company_name,
    metric_value,
    metric_rank,
    sector,
    calculation_date
FROM latest_fundamental_rankings
WHERE metric_rank <= 5
ORDER BY metric_type, metric_rank;