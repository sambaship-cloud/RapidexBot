import { saveLeadToSheet } from '../../lib/saveLeadToSheet.js'; // Adjust if needed
import { MessagingResponse } from 'twilio/lib/twiml/MessagingResponse.js';

const users = new Map();

export default async function handler(req, res) {
  const twiml = new MessagingResponse();

  const incomingMsg = req.body.Body?.trim();
  const from = req.body.From;

  let user = users.get(from);

  if (!user) {
    user = { step: 0, lang: null };
    users.set(from, user);
  }

  let reply = '';

  // Detect language
  if (!user.lang) {
    if (incomingMsg.toLowerCase() === 'oi' || incomingMsg.toLowerCase().startsWith('olá')) {
      user.lang = 'pt';
    } else {
      user.lang = 'en';
    }
  }

  const lang = user.lang;

  switch (user.step) {
    case 0:
      reply = lang === 'pt'
        ? 'Olá! Bem-vindo à RapidEx 🇧🇷✈️🇺🇸\n\nQual é o seu nome completo?'
        : 'Hello! Welcome to RapidEx 🇺🇸📦🇧🇷\n\nWhat is your full name?';
      user.step++;
      break;

    case 1:
      user.name = incomingMsg;
      reply = lang === 'pt'
        ? `Obrigado, ${user.name}! Qual é o seu email?`
        : `Thanks, ${user.name}! What is your email?`;
      user.step++;
      break;

    case 2:
      user.email = incomingMsg;
      reply = lang === 'pt'
        ? 'Qual é o seu endereço completo no Brasil?'
        : 'What is your full address in Brazil?';
      user.step++;
      break;

    case 3:
      user.address = incomingMsg;
      reply = lang === 'pt'
        ? 'Por favor, informe seu CPF:'
        : 'Please enter your CPF:';
      user.step++;
      break;

    case 4:
      user.cpf = incomingMsg;

      try {
        await saveLeadToSheet({
          phone: from,
          name: user.name,
          email: user.email,
          address: user.address,
          cpf: user.cpf,
        });

        reply = lang === 'pt'
          ? `✅ Tudo certo, ${user.name}!\n\nSeus dados foram salvos com sucesso. Em breve você receberá seu endereço nos EUA. Obrigado por escolher a RapidEx!`
          : `✅ All set, ${user.name}!\n\nYour info was saved successfully. You’ll receive your U.S. address shortly. Thanks for choosing RapidEx!`;
      } catch (error) {
        console.error('❌ Error saving to Google Sheets:', error);
        reply = lang === 'pt'
          ? '⚠️ Ocorreu um erro ao salvar seus dados. Por favor, tente novamente mais tarde.'
          : '⚠️ There was an error saving your info. Please try again later.';
      }

      users.delete(from); // Reset session
      break;

    default:
      reply = lang === 'pt'
        ? 'Olá novamente! Qual é o seu nome completo?'
        : 'Hi again! What is your full name?';
      user.step = 1;
      break;
  }

  twiml.message(reply);
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
