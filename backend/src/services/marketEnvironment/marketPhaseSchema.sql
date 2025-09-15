-- Market Phase Tracking Schema
-- Stores historical market phases and transitions for pattern recognition

-- Table to store daily market phase calculations
CREATE TABLE IF NOT EXISTS market_phases (
    id SERIAL PRIMARY KEY,
    calculation_date DATE NOT NULL UNIQUE,
    
    -- Phase Classification
    phase VARCHAR(20) NOT NULL, -- 'BULL', 'BEAR', 'CORRECTION', 'CONSOLIDATION'
    sub_phase VARCHAR(30), -- 'EARLY_BULL', 'LATE_BULL', 'BEAR_RALLY', etc.
    confidence DECIMAL(5,2), -- 0-100 confidence score
    
    -- Supporting Metrics
    sp500_level DECIMAL(10,2),
    sp500_change_from_peak DECIMAL(6,2), -- % from 52-week high
    sp500_change_from_trough DECIMAL(6,2), -- % from 52-week low
    days_in_current_phase INTEGER,
    
    -- Breadth Indicators
    percent_above_50ma DECIMAL(5,2),
    percent_above_200ma DECIMAL(5,2),
    advancing_declining_ratio DECIMAL(6,2),
    new_highs INTEGER,
    new_lows INTEGER,
    
    -- Sentiment Indicators
    vix_level DECIMAL(6,2),
    vix_percentile DECIMAL(5,2), -- Where VIX sits vs 1-year range
    put_call_ratio DECIMAL(6,3),
    fear_greed_index INTEGER, -- 0-100 scale
    
    -- Fundamental Context
    market_pe DECIMAL(6,2),
    pe_percentile_10y DECIMAL(5,2), -- Where PE sits vs 10-year history
    earnings_growth_yoy DECIMAL(6,2),
    earnings_revision_trend VARCHAR(10), -- 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
    
    -- Macro Context
    treasury_10y DECIMAL(5,3),
    yield_curve_slope DECIMAL(5,3), -- 10Y-2Y spread
    high_yield_spread DECIMAL(6,2),
    dollar_index DECIMAL(6,2),