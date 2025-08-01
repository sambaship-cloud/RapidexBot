import { MessagingResponse } from 'twilio/lib/twiml/MessagingResponse.js';

// In-memory storage (for testing - will reset on each deployment)
const users = new Map();

export default async function handler(req, res) {
  try {
    const twiml = new MessagingResponse();
    const incomingMsg = req.body.Body?.trim();
    const from = req.body.From;

    console.log('Received message:', incomingMsg, 'from:', from);

    if (!incomingMsg || !from) {
      twiml.message("Please send a valid message.");
      return res.status(200).setHeader('Content-Type', 'text/xml').send(twiml.toString());
    }

    // Get user from memory or create new
    let user = users.get(from) || { phone: from, step: 0 };
    const lang = user.lang || (incomingMsg.toLowerCase().startsWith('oi') ? 'pt' : 'en');
    let reply = '';

    switch (user.step) {
      case 0:
        reply = lang === 'pt'
          ? 'Olá! Bem-vindo à RapidEx 🇧🇷✈️🇺🇸\n\nQual é o seu nome completo?'
          : 'Hello! Welcome to RapidEx 🇺🇸📦🇧🇷\n\nWhat is your full name?';
        user.step = 1;
        user.lang = lang;
        break;

      case 1:
        user.name = incomingMsg;
        reply = lang === 'pt'
          ? `Obrigado, ${user.name}! Qual é o seu email?`
          : `Thanks, ${user.name}! What is your email?`;
        user.step = 2;
        break;

      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(incomingMsg)) {
          reply = lang === 'pt'
            ? 'Por favor, forneça um email válido:'
            : 'Please provide a valid email address:';
          break;
        }
        
        user.email = incomingMsg;
        reply = lang === 'pt'
          ? `Perfeito! Agora, qual é a sua cidade?`
          : `Perfect! Now, what is your city?`;
        user.step = 3;
        break;

      case 3:
        user.city = incomingMsg;
        reply = lang === 'pt'
          ? `Obrigado pelas informações, ${user.name}!\n\nDados coletados:\n📧 ${user.email}\n🏙️ ${user.city}\n\nEm breve entraremos em contato!`
          : `Thanks for the information, ${user.name}!\n\nData collected:\n📧 ${user.email}\n🏙️ ${user.city}\n\nWe'll be in touch soon!`;
        user.step = 4;
        break;

      default:
        reply = lang === 'pt'
          ? 'Olá! Como posso ajudá-lo hoje? Digite "reiniciar" para começar novamente.'
          : 'Hello! How can I help you today? Type "restart" to begin again.';
        
        if (incomingMsg.toLowerCase().includes('reiniciar') || incomingMsg.toLowerCase().includes('restart')) {
          user.step = 0;
          reply = lang === 'pt'
            ? 'Vamos começar novamente! Qual é o seu nome completo?'
            : 'Let\'s start over! What is your full name?';
          user.step = 1;
        }
        break;
    }

    // Save user to memory
    users.set(from, user);
    
    console.log('Sending reply:', reply);
    twiml.message(reply);
    return res.status(200).setHeader('Content-Type', 'text/xml').send(twiml.toString());

  } catch (error) {
    console.error('Handler error:', error);
    
    const twiml = new MessagingResponse();
    twiml.message("Sorry, something went wrong. Please try again later.");
    return res.status(500).setHeader('Content-Type', 'text/xml').send(twiml.toString());
  }
}