import OpenAI from 'openai';
import logger from './logger.js';
import { sanitizeInput } from './validation.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are SmartDirect Bot, a helpful bilingual assistant for a US-to-Brazil mail redirecting and shipping company. 

LANGUAGE RULES:
- ALWAYS respond in the same language the customer uses
- If they write in Portuguese, respond in Portuguese
- If they write in English, respond in English
- If mixed languages, use the predominant language

MEASUREMENT SUPPORT:
- Accept both metric (kg, cm) and imperial (lbs, inches) measurements
- Always confirm measurements back to customers in their preferred units
- For quotes: "peso: X kg (Y lbs)" or "weight: X lbs (Y kg)"

CURRENCY SUPPORT:
- Always show prices in both USD and Brazilian Real (BRL)
- Format: "US$ X.XX / R$ Y.YY" 
- Use current exchange rates when possible

Your services:
- Mail forwarding from US to Brazil
- Customs documentation and procedures
- Package consolidation and repackaging
- International shipping with tracking
- Customer support in English and Portuguese

Key information:
- Maximum weight: 68 kg (150 lbs)
- Maximum dimension: 274 cm (108 inches) on any side
- Delivery time: 3-10 business days typically
- Service fee included in all quotes
- CPF required for Brazilian customs clearance
- We handle all customs paperwork

For shipping quotes, customers need:
- Package weight (accept kg or lbs)
- Dimensions (accept cm or inches)
- Destination CEP (Brazilian postal code)

PORTUGUESE PHRASES TO USE:
- "Cotação de frete" (shipping quote)
- "Prazo de entrega" (delivery time)
- "Taxa de serviço incluída" (service fee included)
- "Precisa do CPF para alfândega" (need CPF for customs)

Keep responses helpful and professional. Always format measurements and prices clearly.`;

export async function handleIncomingMessage(message, userContext = {}) {
  try {
    const sanitizedMessage = sanitizeInput(message);
    
    if (!sanitizedMessage) {
      return "I'm sorry, I didn't receive a valid message. Could you please try again?";
    }

    logger.info('Processing GPT request', { 
      messageLength: sanitizedMessage.length,
      userContext: userContext 
    });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: sanitizedMessage }
    ];

    // Add context if available
    if (userContext.previousQuote) {
      messages.splice(1, 0, {
        role: 'assistant',
        content: `Previous quote context: ${userContext.previousQuote}`
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
    });

    const reply = response.choices[0].message.content;
    
    logger.info('GPT response generated successfully', { 
      responseLength: reply.length,
      tokensUsed: response.usage?.total_tokens 
    });

    return reply;

  } catch (error) {
    logger.error('OpenAI API error:', {
      error: error.message,
      type: error.type,
      code: error.code
    });

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return "I'm temporarily unavailable due to high demand. Please try again in a few minutes or contact our customer service.";
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return "I'm receiving too many requests right now. Please wait a moment and try again.";
    }

    if (error.code === 'invalid_api_key') {
      logger.error('Invalid OpenAI API key configured');
      return "I'm temporarily unavailable. Please contact our customer service for assistance.";
    }

    // Generic error message for users
    return "I'm having trouble processing your request right now. Please try again in a moment, or contact our customer service if the issue persists.";
  }
}

export async function generateCustomsAdvice(packageData) {
  try {
    const { weight, dimensions, destination, contents } = packageData;
    
    const prompt = `Generate customs advice for shipping a package from US to Brazil:
- Weight: ${weight} lbs
- Dimensions: ${dimensions.length}x${dimensions.width}x${dimensions.height} inches
- Destination: ${destination.zip}
- Contents: ${contents || 'General merchandise'}

Provide brief advice about:
1. Required documentation
2. Potential duties/taxes
3. Prohibited items to avoid
4. Tips for smooth customs clearance

Keep response under 200 words and in a helpful tone.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.5,
    });

    return response.choices[0].message.content;

  } catch (error) {
    logger.error('Error generating customs advice:', error);
    return "For customs information, please contact our customer service team who can provide detailed guidance for your specific shipment.";
  }
}