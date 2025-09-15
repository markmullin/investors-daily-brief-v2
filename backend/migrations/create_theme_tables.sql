-- Database schema for earnings theme extraction and discovery
-- Run this in PostgreSQL to create the necessary tables

-- Table to store company themes summary
CREATE TABLE IF NOT EXISTS company_themes (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  themes JSONB NOT NULL,
  recurring_themes JSONB,
  emerging_themes JSONB,
  keywords JSONB,
  theme_categories JSONB,
  transcript_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast symbol lookup
CREATE INDEX IF NOT EXISTS idx_company_themes_symbol ON company_themes(symbol);

-- Table for theme-to-company mappings (for discovery)
CREATE TABLE IF NOT EXISTS theme_mappings (
  id SERIAL PRIMARY KEY,
  theme VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  symbol VARCHAR(10) NOT NULL,
  sentiment VARCHAR(20),
  importance VARCHAR(20),
  quarter VARCHAR(20),
  context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(theme, symbol, quarter)
);

-- Indexes for theme discovery
CREATE INDEX IF NOT EXISTS idx_theme_mappings_theme ON theme_mappings(theme);
CREATE INDEX IF NOT EXISTS idx_theme_mappings_symbol ON theme_mappings(symbol);
CREATE INDEX IF NOT EXISTS idx_theme_mappings_category ON theme_mappings(category);
CREATE INDEX IF NOT EXISTS idx_theme_mappings_sentiment ON theme_mappings(sentiment);
CREATE INDEX IF NOT EXISTS idx_theme_mappings_importance ON theme_mappings(importance);
CREATE INDEX IF NOT EXISTS idx_theme_mappings_created_at ON theme_mappings(created_at);

-- Full text search index for theme discovery
CREATE INDEX IF NOT EXISTS idx_theme_mappings_theme_text ON theme_mappings USING gin(to_tsvector('english', theme));

-- User theme preferences (for personalized discovery)
CREATE TABLE IF NOT EXISTS user_theme_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  themes JSONB NOT NULL,
  categories JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Theme analytics (track popular themes)
CREATE TABLE IF NOT EXISTS theme_analytics (
  id SERIAL PRIMARY KEY,
  theme VARCHAR(100) NOT NULL,
  search_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_searched TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(theme)
);
