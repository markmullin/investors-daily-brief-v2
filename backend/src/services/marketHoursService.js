class MarketHoursService {
  constructor() {
    this.marketHoursCache = null;
    this.lastCacheUpdate = null;
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
  }

  isMarketOpen() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = nyTime.getDay();
    const hour = nyTime.getHours();
    const minute = nyTime.getMinutes();

    // Check if it's a weekday
    if (day === 0 || day === 6) return false;

    // Convert current time to minutes since midnight
    const currentMinutes = hour * 60 + minute;

    // Market hours: 9:30 AM - 4:00 PM EST
    const marketOpen = 9 * 60 + 30;  // 9:30 AM
    const marketClose = 16 * 60;     // 4:00 PM

    return currentMinutes >= marketOpen && currentMinutes < marketClose;
  }

  isPreMarket() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = nyTime.getDay();
    const hour = nyTime.getHours();
    const minute = nyTime.getMinutes();

    if (day === 0 || day === 6) return false;

    const currentMinutes = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30;  // 9:30 AM
    const preMarketOpen = 4 * 60;    // 4:00 AM

    return currentMinutes >= preMarketOpen && currentMinutes < marketOpen;
  }

  isAfterHours() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = nyTime.getDay();
    const hour = nyTime.getHours();
    const minute = nyTime.getMinutes();

    if (day === 0 || day === 6) return false;

    const currentMinutes = hour * 60 + minute;
    const marketClose = 16 * 60;     // 4:00 PM
    const afterHoursClose = 20 * 60; // 8:00 PM

    return currentMinutes >= marketClose && currentMinutes < afterHoursClose;
  }

  getMarketStatus() {
    if (this.isMarketOpen()) return 'OPEN';
    if (this.isPreMarket()) return 'PRE_MARKET';
    if (this.isAfterHours()) return 'AFTER_HOURS';
    return 'CLOSED';
  }
}

export default new MarketHoursService();
