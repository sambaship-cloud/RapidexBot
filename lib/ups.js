import axios from 'axios';
import logger from './logger.js';
import { convertAndFormatPrice } from './currency.js';
import { formatWeight, formatDimensions } from './units.js';

const UPS_BASE_URL = 'https://wwwcie.ups.com/api'; // Use production URL: https://onlinetools.ups.com/api
const MARKUP_PERCENTAGE = parseFloat(process.env.MARKUP_PERCENTAGE) || 20;

// Mock UPS API responses for development/testing
const MOCK_MODE = !process.env.UPS_CLIENT_ID || process.env.NODE_ENV === 'development';

async function getUPSAccessToken() {
  if (MOCK_MODE) {
    return 'mock_token';
  }

  try {
    const response = await axios.post(`${UPS_BASE_URL}/security/v1/oauth/token`, 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.UPS_CLIENT_ID}:${process.env.UPS_CLIENT_SECRET}`).toString('base64')}`
        },
        timeout: 10000
      }
    );

    return response.data.access_token;
  } catch (error) {
    logger.error('Failed to get UPS access token:', error.message);
    throw new Error('Unable to authenticate with UPS API');
  }
}

export async function generateQuote(packageData, language = 'en') {
  try {
    logger.info('Generating shipping quote', { 
      weight: packageData.weight, 
      destination: packageData.destination?.zip,
      language 
    });

    if (MOCK_MODE) {
      return generateMockQuote(packageData, language);
    }

    const accessToken = await getUPSAccessToken();
    
    const quoteRequest = {
      RateRequest: {
        Request: {
          SubVersion: "1801",
          RequestOption: "Rate",
          TransactionReference: {
            CustomerContext: `quote-${Date.now()}`
          }
        },
        Shipment: {
          Shipper: {
            Address: {
              PostalCode: process.env.SHIPPER_POSTAL_CODE || "33545",
              CountryCode: "US"
            }
          },
          ShipTo: {
            Address: {
              PostalCode: packageData.destination.zip,
              CountryCode: "BR"
            }
          },
          ShipmentWeight: {
            UnitOfMeasurement: {
              Code: "LBS"
            },
            Weight: packageData.weight.toString()
          },
          Package: {
            PackagingType: {
              Code: "02"
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "IN"
              },
              Length: packageData.dimensions.length.toString(),
              Width: packageData.dimensions.width.toString(),
              Height: packageData.dimensions.height.toString()
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: "LBS"
              },
              Weight: packageData.weight.toString()
            }
          },
          Service: {
            Code: "11" // UPS Standard
          }
        }
      }
    };

    const response = await axios.post(`${UPS_BASE_URL}/rating/v1/Rate`, quoteRequest, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'transId': `quote-${Date.now()}`,
        'transactionSrc': 'testing'
      },
      timeout: 15000
    });

    const ratedShipment = response.data.RateResponse.RatedShipment;
    const baseRate = parseFloat(ratedShipment.TotalCharges.MonetaryValue);
    const finalRate = baseRate * (1 + MARKUP_PERCENTAGE / 100);
    const transitTime = ratedShipment.GuaranteedDaysToDelivery || '5-7';

    const pricing = await convertAndFormatPrice(finalRate, 'USD', language);

    const quote = {
      baseRate,
      finalRate,
      transitTime,
      service: 'UPS Standard',
      pricing
    };

    return {
      success: true,
      quote,
      message: formatQuoteMessage(quote, packageData, language)
    };

  } catch (error) {
    logger.error('UPS API error:', error.message);
    
    return {
      success: false,
      error: language === 'pt' ? 'Erro ao calcular frete' : 'Error calculating shipping rate',
      details: [language === 'pt' ? 'Tente novamente em alguns minutos' : 'Please try again in a few minutes']
    };
  }
}

function generateMockQuote(packageData, language = 'en') {
  // Mock shipping calculation
  const baseRate = 28 + (packageData.weight * 2.5) + (packageData.dimensions.length * 0.5);
  const finalRate = baseRate * (1 + MARKUP_PERCENTAGE / 100);
  
  return new Promise(async (resolve) => {
    const pricing = await convertAndFormatPrice(finalRate, 'USD', language);
    
    const quote = {
      baseRate,
      finalRate,
      transitTime: '5-7',
      service: 'UPS Standard',
      pricing
    };

    resolve({
      success: true,
      quote,
      message: formatQuoteMessage(quote, packageData, language)
    });
  });
}

function formatQuoteMessage(quote, packageData, language = 'en') {
  const isPortuguese = language === 'pt';
  
  // Format weight and dimensions in original units if available
  const originalWeight = packageData.original?.weight;
  const originalDimensions = packageData.original?.dimensions;
  
  let weightDisplay, dimensionsDisplay;
  
  if (originalWeight && originalDimensions) {
    if (originalWeight.unit === 'kg' && originalDimensions.unit === 'cm') {
      // Show metric first, imperial in parentheses
      weightDisplay = `${formatWeight(originalWeight.value, 'kg', language)} (${formatWeight(packageData.weight, 'lbs', language)})`;
      dimensionsDisplay = `${formatDimensions(originalDimensions, 'cm', language)} (${formatDimensions(packageData.dimensions, 'in', language)})`;
    } else {
      // Show imperial first, metric in parentheses if conversion available
      weightDisplay = formatWeight(packageData.weight, 'lbs', language);
      dimensionsDisplay = formatDimensions(packageData.dimensions, 'in', language);
      
      if (originalWeight.inKg) {
        weightDisplay += ` (${formatWeight(originalWeight.inKg, 'kg', language)})`;
      }
      if (originalDimensions.inCm) {
        dimensionsDisplay += ` (${formatDimensions(originalDimensions.inCm, 'cm', language)})`;
      }
    }
  } else {
    // Fallback to converted displays
    weightDisplay = formatWeight(packageData.weight, 'lbs', language);
    dimensionsDisplay = formatDimensions(packageData.dimensions, 'in', language);
  }

  if (isPortuguese) {
    return `📦 Cotação de Frete:

💰 Valor Total: ${quote.pricing.usd} / ${quote.pricing.brl}
⏱️ Prazo de Entrega: ${quote.transitTime} dias úteis
📏 Peso: ${weightDisplay}
📐 Dimensões: ${dimensionsDisplay}
🚚 Serviço: ${quote.service} para Brasil

Taxa de serviço de ${MARKUP_PERCENTAGE}% incluída
Câmbio: US$ 1 = R$ ${quote.pricing.rate.toFixed(2)}`;
  } else {
    return `📦 Shipping Quote:

💰 Total Cost: ${quote.pricing.usd} / ${quote.pricing.brl}
⏱️ Estimated Transit: ${quote.transitTime} business days
📏 Weight: ${weightDisplay}
📐 Dimensions: ${dimensionsDisplay}
🚚 Service: ${quote.service} to Brazil

${MARKUP_PERCENTAGE}% service fee included
Exchange rate: US$ 1 = R$ ${quote.pricing.rate.toFixed(2)}`;
  }
}

export async function getTrackingInfo(trackingNumber) {
  try {
    logger.info('Getting tracking info', { trackingNumber });

    if (MOCK_MODE) {
      return {
        success: true,
        tracking: {
          number: trackingNumber,
          status: 'In Transit',
          location: 'Miami, FL',
          lastUpdate: '2025-07-30 14:30',
          estimatedDelivery: '2025-08-03'
        }
      };
    }

    const accessToken = await getUPSAccessToken();
    
    const response = await axios.get(
      `${UPS_BASE_URL}/track/v1/details/${trackingNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'transId': `track-${Date.now()}`,
          'transactionSrc': 'testing'
        },
        timeout: 10000
      }
    );

    const shipment = response.data.trackResponse.shipment[0];
    const activity = shipment.package[0].activity[0];

    return {
      success: true,
      tracking: {
        number: trackingNumber,
        status: activity.status.description,
        location: `${activity.location.address.city}, ${activity.location.address.stateProvinceCode}`,
        lastUpdate: activity.date + ' ' + activity.time,
        estimatedDelivery: shipment.deliveryDate?.[0]?.date || 'N/A'
      }
    };

  } catch (error) {
    logger.error('Tracking error:', error.message);
    
    return {
      success: false,
      error: 'Unable to retrieve tracking information',
      details: ['Please verify the tracking number and try again']
    };
  }
}