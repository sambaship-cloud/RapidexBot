import { MessagingResponse } from 'twilio/lib/twiml/MessagingResponse.js';
import { getUserByPhone, updateUserStepOrCreate } from '../../lib/saveLeadToSheet.js';

export default async function handler(req, res) {
  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body?.trim();
  const from = req.body.From;

  if (!incomingMsg) {
    twiml.message("Please send a valid message.");
    return res.status(200).setHeader('Content-Type', 'text/xml').send(twiml.toString());
  }

  const user = await getUserByPhone(from) || { phone: from, step: 0 };
  const lang = user.lang || (incomingMsg.toLowerCase().startsWith('oi') ? 'pt' : 'en');
  let reply = '';

  switch (user.step) {
    case 0:
      reply = lang === 'pt'
        ? 'Olá! Bem-vindo à RapidEx 🇧🇷✈️🇺🇸\n\nQual é o seu nome completo?'
        : 'Hello! Welcome to RapidEx 🇺🇸📦🇧🇷\n\nWhat is your full name?';
      user.step = 1;
      break;

    case 1:
      user.name = incomingMsg;
      reply = lang === 'pt'
        ? `Obrigado, ${user.name}! Qual é o seu email?`
        : `Thanks, ${user.name}! What is your email?`;
      user.step = 2;
      break;

    case 2:
      user.email
