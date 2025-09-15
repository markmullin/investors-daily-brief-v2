// Fix for Money Supply data processing in MacroeconomicEnvironment.jsx
// This replaces the Group 5 Money Supply processing section

        // Group 5: Money Supply & Money Market Funds with BOTH absolute and YoY values  
        if (monetaryPolicyData.data) {
          console.log('💰 MONEY SUPPLY GROUP - Processing monetary data...');
          console.log('Available keys:', Object.keys(monetaryPolicyData.data));
          
          const moneySupplyData = [];
          
          // Get both absolute and YoY values for M2
          const m2Absolute = cleanDataset(monetaryPolicyData.data.M2SL || []);
          const m2YoY = cleanDataset(monetaryPolicyData.data.M2_YOY || []);
          
          // Get both absolute and YoY values for Money Market Funds
          const mmfAbsolute = cleanDataset(monetaryPolicyData.data.MMMFFAQ027S || monetaryPolicyData.data.MONEY_MARKET_FUNDS || []);
          const mmfYoY = cleanDataset(monetaryPolicyData.data.MMF_YOY || []);
          
          // Combine dates from all series
          const dates = [...new Set([
            ...m2Absolute.map(d => d.date),
            ...m2YoY.map(d => d.date),
            ...mmfAbsolute.map(d => d.date),
            ...mmfYoY.map(d => d.date)
          ])].sort();
          
          dates.forEach(date => {
            const m2AbsPoint = m2Absolute.find(d => d.date === date);
            const m2YoYPoint = m2YoY.find(d => d.date === date);
            const mmfAbsPoint = mmfAbsolute.find(d => d.date === date);
            const mmfYoYPoint = mmfYoY.find(d => d.date === date);
            
            moneySupplyData.push({
              date: date,
              M2_YOY: m2YoYPoint ? m2YoYPoint.value : null,
              MMF_YOY: mmfYoYPoint ? mmfYoYPoint.value : null,
              // CRITICAL FIX: Convert from billions to trillions by dividing by 1000
              MONEY_MARKET_FUNDS: mmfAbsPoint ? mmfAbsPoint.value / 1000 : null, // Convert to trillions
              M2_ABSOLUTE: m2AbsPoint ? m2AbsPoint.value / 1000 : null // Convert to trillions
            });
          });
          
          console.log('💰 Money Supply sample (with trillions conversion):', moneySupplyData[moneySupplyData.length - 1]);
          laggingResults['MONEY_SUPPLY'] = moneySupplyData;
        }
        
        // Group 6: Labor Market & Consumer Health - FIXED with proper data keys
        const laborData = [];
        
        // Get unemployment data
        const unemployment = cleanDataset(laborConsumerData.data?.UNRATE || []);
        
        // FIX: Check multiple possible keys for Real Personal Income
        const realIncome = cleanDataset(
          laborConsumerData.data?.W875RX1 || 
          laborConsumerData.data?.REAL_PERSONAL_INCOME || 
          laborConsumerData.data?.REAL_INCOME_YOY || 
          []
        );
        
        // Get retail sales data
        const retailSales = cleanDataset(
          laborConsumerData.data?.RSXFS || 
          laborConsumerData.data?.RETAIL_YOY || 
          laborConsumerData.data?.RETAIL_SALES_YOY || 
          []
        );
        
        console.log('👥 LABOR CONSUMER - Data availability:');
        console.log('  Unemployment:', unemployment.length, 'points');
        console.log('  Real Income:', realIncome.length, 'points');
        console.log('  Retail Sales:', retailSales.length, 'points');
        
        // Combine labor consumer data
        const laborDates = [...new Set([
          ...unemployment.map(d => d.date),
          ...realIncome.map(d => d.date),
          ...retailSales.map(d => d.date)
        ])].sort();
        
        laborDates.forEach(date => {
          const unempPoint = unemployment.find(d => d.date === date);
          const incomePoint = realIncome.find(d => d.date === date);
          const retailPoint = retailSales.find(d => d.date === date);
          
          laborData.push({
            date: date,
            unemployment: unempPoint ? unempPoint.value : null,
            realIncome: incomePoint ? incomePoint.value : null,
            retailSales: retailPoint ? retailPoint.value : null
          });
        });
        
        console.log('👥 Labor Consumer sample:', laborData[laborData.length - 1]);
        laggingResults[LAGGING_INDICATORS.LABOR_CONSUMER] = laborData;
