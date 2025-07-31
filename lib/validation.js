import logger from './logger.js';

export function validateBrazilCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid patterns
  const invalidPatterns = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ];
  
  if (invalidPatterns.includes(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

export function validateBrazilCEP(cep) {
  if (!cep || typeof cep !== 'string') return false;
  const cleanCEP = cep.replace(/\D/g, '');
  return /^\d{8}$/.test(cleanCEP);
}

export function validatePackageData(packageData) {
  const errors = [];
  
  if (!packageData) {
    errors.push('Package data is required');
    return { isValid: false, errors };
  }
  
  // Validate weight
  if (!packageData.weight || isNaN(packageData.weight) || packageData.weight <= 0) {
    errors.push('Valid weight is required (must be a positive number)');
  }
  
  if (packageData.weight > 150) {
    errors.push('Weight cannot exceed 150 lbs for international shipping');
  }
  
  // Validate dimensions
  if (!packageData.dimensions) {
    errors.push('Package dimensions are required');
  } else {
    const { length, width, height } = packageData.dimensions;
    
    if (!length || isNaN(length) || length <= 0) {
      errors.push('Valid length is required');
    }
    if (!width || isNaN(width) || width <= 0) {
      errors.push('Valid width is required');
    }
    if (!height || isNaN(height) || height <= 0) {
      errors.push('Valid height is required');
    }
    
    // Check dimensional weight limits
    if (length && width && height) {
      const maxDimension = Math.max(length, width, height);
      const totalDimensions = length + width + height;
      
      if (maxDimension > 108) {
        errors.push('No single dimension can exceed 108 inches');
      }
      
      if (totalDimensions > 165) {
        errors.push('Length + width + height cannot exceed 165 inches');
      }
    }
  }
  
  // Validate destination
  if (!packageData.destination) {
    errors.push('Destination information is required');
  } else {
    if (!packageData.destination.zip || !validateBrazilCEP(packageData.destination.zip)) {
      errors.push('Valid Brazilian CEP (postal code) is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000); // Limit to 1000 characters
}

export function validateWebhookSignature(signature, payload, secret) {
  // Implement webhook signature validation if using WhatsApp Business API
  // This is a placeholder - implement based on your webhook provider
  try {
    // Add your signature validation logic here
    return true;
  } catch (error) {
    logger.error('Webhook signature validation failed:', error);
    return false;
  }
}