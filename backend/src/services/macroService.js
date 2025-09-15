import eodService from './eodService.js';

export const getMacroMetrics = async () => {
    try {
        // Get single stock data for TLT
        const tltData = await eodService.getSingleStockData('TLT.US');
        console.log('TLT Data:', tltData);

        return {
            tlt: {
                price: tltData?.price || 0,
                change: tltData?.changePercent || 0,
                volume: tltData?.volume || 0
            },
            usdIndex: {
                price: 0,
                change: 0
            },
            bitcoin: {
                price: 0,
                change: 0
            }
        };
    } catch (error) {
        console.error('Error fetching macro metrics:', error);
        return {
            tlt: { price: 0, change: 0, volume: 0 },
            usdIndex: { price: 0, change: 0 },
            bitcoin: { price: 0, change: 0 }
        };
    }
};
