export const validateMarketData = (data) => {
  const required = ['symbol', 'price', 'change', 'changePercent', 'volume'];
  return required.every(field => data[field] !== undefined && data[field] !== null);
};

export const validateMacroData = (data) => {
  const required = ['value', 'date'];
  return required.every(field => data?.[field] !== undefined && data?.[field] !== null);
};

export const validateNewsData = (article) => {
  const required = ['title', 'url', 'publishedAt'];
  return required.every(field => article[field] !== undefined && article[field] !== null);
};

export const sanitizeNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

export const sanitizeDate = (date) => {
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};
