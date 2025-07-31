import { handleIncomingMessage, generateCustomsAdvice } from '../lib/gpt.js';
import { generateQuote, getTrackingInfo } from '../lib/ups.js';
import { validatePackageData, sanitizeInput, validateWebhookSignature } from '../lib/validation.js';
import { detectLanguage, extractPackageInfoAdvanced } from '../lib/units.js';
import logger from '../lib/logger.js';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please wait a moment before sending another message.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function extractPackageInfo(message) {
  // Use the advanced parser that handles multiple languages and units
  return extractPackageInfoAdvanced(message);
}

function extractTrackingNumber(message) {
  // UPS tracking numbers are typically 18 characters, starting with 1Z
  const upsMatch = message.match(/1Z[A-Z0-9]{16}/i);
  if (upsMatch) return upsMatch[0].toUpperCase();

  // Generic tracking number pattern
  const genericMatch = message.match(/[A-Z0-9]{10,20}/);
  if (genericMatch) return genericMatch[0].toUpperCase();

  return null;
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  logger.info('Webhook request received', {
    requestId,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      logger.warn('Invalid method attempted', { requestId, method: req.method });
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST requests are accepted'
      });
    }

    // Apply rate limiting
    limiter(req, res, async () => {
      try {
        const body = req.body;

        // Validate webhook signature if configured
        const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'];
        if (process.env.WHATSAPP_VERIFY_TOKEN && signature) {
          if (!validateWebhookSignature(signature, JSON.stringify(body), process.env.WHATSAPP_VERIFY_TOKEN)) {
            logger.warn('Invalid webhook signature', { requestId });
            return res.status(401).json({ error: 'Unauthorized' });
          }
        }

        // Validate required fields
        if (!body || !body.message) {
          logger.warn('Missing message in request body', { requestId, body });
          return res.status(400).json({ 
            error: 'Bad request',
            message: 'Message field is required'
          });
        }

        // Extract and sanitize user message
        const userMessage = sanitizeInput(body.message.text || body.message.content || body.message);
        const userId = body.userId || body.from || 'anonymous';
        const userLanguage = detectLanguage(userMessage);
        
        if (!userMessage) {
          logger.warn('Empty or invalid message', { requestId, userId });
          const errorMsg = userLanguage === 'pt' 
            ? 'Conteúdo de mensagem válido é obrigatório'
            : 'Valid message content is required';
          return res.status(400).json({
            error: 'Bad request',
            message: errorMsg
          });
        }

        logger.info('Processing user message', {
          requestId,
          userId,
          messageLength: userMessage.length,
          messagePreview: userMessage.substring(0, 50) + '...',
          detectedLanguage: userLanguage
        });

        let response = null;

        // Check for tracking request
        if (/track|tracking|rastreio|where is my|status|onde está/i.test(userMessage)) {
          const trackingNumber = extractTrackingNumber(userMessage);
          
          if (trackingNumber) {
            logger.info('Processing tracking request', { requestId, trackingNumber });
            const trackingResult = await getTrackingInfo(trackingNumber);
            
            if (trackingResult.success) {
              const tracking = trackingResult.tracking;
              if (userLanguage === 'pt') {
                response = `📦 Atualização de Rastreamento para ${tracking.number}:\n\n` +
                         `Status: ${tracking.status}\n` +
                         `Localização: ${tracking.location}\n` +
                         `Última Atualização: ${tracking.lastUpdate}\n` +
                         `Entrega Prevista: ${tracking.estimatedDelivery}`;
              } else {
                response = `📦 Tracking Update for ${tracking.number}:\n\n` +
                         `Status: ${tracking.status}\n` +
                         `Location: ${tracking.location}\n` +
                         `Last Update: ${tracking.lastUpdate}\n` +
                         `Estimated Delivery: ${tracking.estimatedDelivery}`;
              }
            } else {
              const errorPrefix = userLanguage === 'pt' ? '❌' : '❌';
              response = `${errorPrefix} ${trackingResult.error}\n${trackingResult.details?.join('\n') || ''}`;
            }
          } else {
            const promptMsg = userLanguage === 'pt' 
              ? "O usuário está perguntando sobre rastreamento mas não forneceu um número de rastreamento. Peça para fornecer o número de rastreamento."
              : "The user is asking about tracking but didn't provide a tracking number. Please ask them to provide their tracking number.";
            response = await handleIncomingMessage(promptMsg, { language: userLanguage });
          }
        }
        // Check for quote request (multilingual keywords)
        else if (/quote|frete|shipping|price|cost|quanto|custo|cotação|envio|preço/i.test(userMessage)) {
          logger.info('Processing quote request', { requestId, language: userLanguage });
          
          // Try to extract package info from message
          const packageInfo = extractPackageInfo(userMessage) || body.package;
          
          if (packageInfo) {
            const quoteResult = await generateQuote(packageInfo, userLanguage);
            
            if (quoteResult.success) {
              response = quoteResult.message;
              
              // Optionally add customs advice
              if (body.includeCustomsAdvice) {
                const customsAdvice = await generateCustomsAdvice(packageInfo);
                const customsHeader = userLanguage === 'pt' 
                  ? '\n\n📋 Informações Alfandegárias:\n'
                  : '\n\n📋 Customs Information:\n';
                response += `${customsHeader}${customsAdvice}`;
              }
              
              logger.info('Quote generated successfully', { 
                requestId, 
                finalRate: quoteResult.quote?.finalRate,
                transitTime: quoteResult.quote?.transitTime,
                language: userLanguage
              });
            } else {
              response = `❌ ${quoteResult.error}\n${quoteResult.details?.join('\n') || ''}`;
              logger.warn('Quote generation failed', { requestId, error: quoteResult.error });
            }
          } else {
            const promptMsg = userLanguage === 'pt'
              ? "O usuário está pedindo uma cotação de frete mas não forneceu informações completas do pacote. " +
                "Peça para fornecer: peso (em kg ou lbs), dimensões (CxLxA em cm ou polegadas), e CEP de destino."
              : "The user is asking for a shipping quote but didn't provide complete package information. " +
                "Please ask them to provide: weight (in kg or lbs), dimensions (LxWxH in cm or inches), and destination CEP.";
            response = await handleIncomingMessage(promptMsg, { language: userLanguage });
          }
        }
        // Check for customs/documentation questions (multilingual)
        else if (/customs|documentation|cpf|tax|duty|alfandega|documentos|imposto|taxa|alfândega/i.test(userMessage)) {
          logger.info('Processing customs inquiry', { requestId, language: userLanguage });
          
          if (body.package) {
            response = await generateCustomsAdvice(body.package);
          } else {
            response = await handleIncomingMessage(userMessage, { language: userLanguage });
          }
        }
        // General conversation
        else {
          logger.info('Processing general message', { requestId, language: userLanguage });
          
          const userContext = {
            userId: userId,
            previousQuote: body.previousQuote,
            language: userLanguage
          };
          
          response = await handleIncomingMessage(userMessage, userContext);
        }

        const processingTime = Date.now() - startTime;
        
        logger.info('Request processed successfully', {
          requestId,
          processingTime,
          responseLength: response?.length || 0,
          language: userLanguage
        });

        return res.status(200).json({ 
          reply: response,
          requestId: requestId,
          processingTime: processingTime,
          language: userLanguage
        });

      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        logger.error('Error processing webhook request', {
          requestId,
          error: error.message,
          stack: error.stack,
          processingTime
        });

        return res.status(500).json({
          error: 'Internal server error',
          message: 'We encountered an issue processing your request. Please try again.',
          requestId: requestId
        });
      }
    });

  } catch (error) {
    logger.error('Critical webhook error', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'A critical error occurred. Please contact support.',
      requestId: requestId
    });
  }
}

// Health check endpoint
export async function healthCheck(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  // Check OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    health.status = 'error';
    health.issues = health.issues || [];
    health.issues.push('OpenAI API key not configured');
  }

  // Check UPS credentials
  if (!process.env.UPS_CLIENT_ID || !process.env.UPS_CLIENT_SECRET) {
    health.status = 'warning';
    health.issues = health.issues || [];
    health.issues.push('UPS API credentials not fully configured');
  }

  const statusCode = health.status === 'ok' ? 200 : health.status === 'warning' ? 200 : 503;
  
  res.status(statusCode).json(health);
}