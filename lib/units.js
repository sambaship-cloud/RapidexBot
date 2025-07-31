import logger from './logger.js';

// Conversion constants
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;
const INCHES_TO_CM = 2.54;
const CM_TO_INCHES = 0.393701;

export function detectLanguage(message) {
  // Portuguese keywords detection
  const portugueseKeywords = [
    'frete', 'envio', 'entrega', 'pacote', 'encomenda', 'correios',
    'quanto', 'custo', 'preço', 'valor', 'real', 'reais', 'dólar',
    'kg', 'quilos', 'centímetros', 'cm', 'metros', 'rastreio',
    'alfândega', 'imposto', 'taxa', 'cpf', 'cep', 'brasil'
  ];

  const lowerMessage = message.toLowerCase();
  const hasPortuguese = portugueseKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  return hasPortuguese ? 'pt' : 'en';
}

export function detectUnits(message) {
  const lowerMessage = message.toLowerCase();
  
  // Weight unit detection
  const hasMetricWeight = /\b(\d+(?:\.\d+)?)\s*(kg|quilos?|kilograma?s?)\b/i.test(lowerMessage);
  const hasImperialWeight = /\b(\d+(?:\.\d+)?)\s*(lbs?|pounds?|libras?)\b/i.test(lowerMessage);
  
  // Dimension unit detection
  const hasMetricDimensions = /\b(\d+(?:\.\d+)?)\s*(cm|centímetros?|metros?)\b/i.test(lowerMessage);
  const hasImperialDimensions = /\b(\d+(?:\.\d+)?)\s*(in|inches?|polegadas?)\b/i.test(lowerMessage);
  
  return {
    weight: hasMetricWeight ? 'metric' : (hasImperialWeight ? 'imperial' : 'unknown'),
    dimensions: hasMetricDimensions ? 'metric' : (hasImperialDimensions ? 'imperial' : 'unknown'),
    language: detectLanguage(message)
  };
}

export function parseWeight(weightString) {
  if (!weightString || typeof weightString !== 'string') return null;
  
  const lowerWeight = weightString.toLowerCase();
  
  // Try to extract number and unit
  const kgMatch = lowerWeight.match(/(\d+(?:\.\d+)?)\s*(kg|quilos?|kilograma?s?)/);
  const lbsMatch = lowerWeight.match(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?|libras?)/);
  
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    return {
      value: kg,
      unit: 'kg',
      inLbs: kg * KG_TO_LBS,
      inKg: kg
    };
  }
  
  if (lbsMatch) {
    const lbs = parseFloat(lbsMatch[1]);
    return {
      value: lbs,
      unit: 'lbs',
      inLbs: lbs,
      inKg: lbs * LBS_TO_KG
    };
  }
  
  // Try to parse just a number (assume context-based unit)
  const numberMatch = lowerWeight.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const value = parseFloat(numberMatch[1]);
    // If no unit specified, we'll need context to determine
    return {
      value: value,
      unit: 'unknown',
      raw: value
    };
  }
  
  return null;
}

export function parseDimensions(dimensionString) {
  if (!dimensionString || typeof dimensionString !== 'string') return null;
  
  const lowerDim = dimensionString.toLowerCase();
  
  // Look for patterns like "30x20x15 cm" or "12x8x6 inches"
  const cmMatch = lowerDim.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(cm|centímetros?)/);
  const inchMatch = lowerDim.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(in|inches?|polegadas?)?/);
  
  if (cmMatch) {
    const [, l, w, h] = cmMatch;
    const length = parseFloat(l);
    const width = parseFloat(w);
    const height = parseFloat(h);
    
    return {
      length: length,
      width: width,
      height: height,
      unit: 'cm',
      inInches: {
        length: length * CM_TO_INCHES,
        width: width * CM_TO_INCHES,
        height: height * CM_TO_INCHES
      },
      inCm: {
        length: length,
        width: width,
        height: height
      }
    };
  }
  
  if (inchMatch) {
    const [, l, w, h] = inchMatch;
    const length = parseFloat(l);
    const width = parseFloat(w);
    const height = parseFloat(h);
    
    return {
      length: length,
      width: width,
      height: height,
      unit: 'in',
      inInches: {
        length: length,
        width: width,
        height: height
      },
      inCm: {
        length: length * INCHES_TO_CM,
        width: width * INCHES_TO_CM,
        height: height * INCHES_TO_CM
      }
    };
  }
  
  return null;
}

export function convertWeight(weight, fromUnit, toUnit) {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * KG_TO_LBS;
  }
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight * LBS_TO_KG;
  }
  
  return weight;
}

export function convertDimensions(dimensions, fromUnit, toUnit) {
  if (fromUnit === toUnit) return dimensions;
  
  const convert = fromUnit === 'cm' && toUnit === 'in' ? CM_TO_INCHES : INCHES_TO_CM;
  
  return {
    length: dimensions.length * convert,
    width: dimensions.width * convert,
    height: dimensions.height * convert
  };
}

export function formatWeight(weight, unit, locale = 'en') {
  const formatted = parseFloat(weight).toFixed(1);
  
  if (locale.startsWith('pt')) {
    return unit === 'kg' ? `${formatted} kg` : `${formatted} libras`;
  } else {
    return unit === 'kg' ? `${formatted} kg` : `${formatted} lbs`;
  }
}

export function formatDimensions(dimensions, unit, locale = 'en') {
  const l = parseFloat(dimensions.length).toFixed(1);
  const w = parseFloat(dimensions.width).toFixed(1);
  const h = parseFloat(dimensions.height).toFixed(1);
  
  if (locale.startsWith('pt')) {
    const unitLabel = unit === 'cm' ? 'cm' : 'polegadas';
    return `${l} x ${w} x ${h} ${unitLabel}`;
  } else {
    const unitLabel = unit === 'cm' ? 'cm' : 'inches';
    return `${l} x ${w} x ${h} ${unitLabel}`;
  }
}

export function extractPackageInfoAdvanced(message) {
  try {
    const detectedUnits = detectUnits(message);
    const language = detectedUnits.language;
    
    logger.info('Parsing package info', { 
      detectedUnits, 
      messagePreview: message.substring(0, 100) 
    });
    
    // Parse weight
    const weightInfo = parseWeight(message);
    if (!weightInfo) return null;
    
    // Parse dimensions  
    const dimensionInfo = parseDimensions(message);
    if (!dimensionInfo) return null;
    
    // Extract CEP
    const cepMatch = message.match(/(\d{5}-?\d{3}|\d{8})/);
    if (!cepMatch) return null;
    
    // Convert everything to imperial for UPS API (UPS uses imperial)
    const weightInLbs = weightInfo.unit === 'kg' ? weightInfo.inLbs : weightInfo.value;
    const dimensionsInInches = dimensionInfo.unit === 'cm' ? dimensionInfo.inInches : {
      length: dimensionInfo.length,
      width: dimensionInfo.width,
      height: dimensionInfo.height
    };
    
    return {
      weight: weightInLbs,
      dimensions: dimensionsInInches,
      destination: {
        zip: cepMatch[1].replace(/\D/g, '')
      },
      original: {
        weight: weightInfo,
        dimensions: dimensionInfo,
        language: language
      }
    };
    
  } catch (error) {
    logger.error('Error parsing package info:', error);
    return null;
  }
}