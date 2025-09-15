class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  track(error, context) {
    const errorEntry = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      context,
      type: error.name
    };

    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    console.error(`[${context}] Error:`, error);
    return errorEntry;
  }

  getRecent(count = 10) {
    return this.errors.slice(0, count);
  }

  clear() {
    this.errors = [];
  }
}

export default new ErrorTracker();
