import axios from 'axios';
import logger from './logger.js';

let exchangeRateCache = {
  rate: null,
  timestamp: null,
  expiry: 3600000 // 1 hour cache
};

export async function getUSDToBRLRate() {
  try {
    // Check cache first
    if (exchangeRateCache.rate && 
        exchangeRateCache.timestamp && 
        (Date.now() - exchangeRateCache.timestamp) < exchangeRateCache.expiry) {
      return exchangeRateCache.rate;
    }

    // Fetch current rate from free API
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 5000
    });

    const rate = response.data.rates.BRL;
    
    if (rate && !isNaN(rate)) {
      exchangeRateCache = {
        rate: rate,
        timestamp: Date.now()
      };
      
      logger.info('Exchange rate updated', { rate, timestamp: new Date().toISOString() });
      return rate;
    }

    throw new Error('Invalid exchange rate received');

  } catch (error) {
    logger.error('Failed to fetch exchange rate:', error.message);
    
    // Fallback to cached rate if available
    if (exchangeRateCache.rate) {
      logger.warn('Using cached exchange rate due to API failure');
      return exchangeRateCache.rate;
    }
    
    // Ultimate fallback - approximate rate
    logger.warn('Using fallback exchange rate');
    return 5.2; // Approximate USD to BRL rate
  }
}

export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  try {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return `${currency === 'BRL' ? 'R$' : '$'} 0.00`;
    }

    const formatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    // Handle Brazilian Real formatting
    if (currency === 'BRL') {
      if (locale.startsWith('pt')) {
        return new Intl.NumberFormat('pt-BR', formatOptions).format(numAmount);
      } else {
        // For English speakers, use a cleaner BRL format
        return `R$ ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    // Handle USD formatting
    return new Intl.NumberFormat(locale, formatOptions).format(numAmount);

  } catch (error) {
    logger.error('Currency formatting error:', error);
    return `${currency === 'BRL' ? 'R$' : '$'} ${amount}`;
  }
}

export async function convertAndFormatPrice(usdAmount, targetCurrency = 'USD', locale = 'en-US') {
  try {
    const usdPrice = parseFloat(usdAmount);
    
    if (isNaN(usdPrice)) {
      return {
        usd: formatCurrency(0, 'USD', locale),
        brl: formatCurrency(0, 'BRL', locale),
        rate: 0
      };
    }

    const exchangeRate = await getUSDToBRLRate();
    const brlPrice = usdPrice * exchangeRate;

    return {
      usd: formatCurrency(usdPrice, 'USD', locale),
      brl: formatCurrency(brlPrice, 'BRL', locale),
      rate: exchangeRate,
      usdAmount: usdPrice,
      brlAmount: brlPrice
    };

  } catch (error) {
    logger.error('Price conversion error:', error);
    return {
      usd: formatCurrency(usdAmount, 'USD', locale),
      brl: 'Conversion unavailable',
      rate: 0
    };
  }
}