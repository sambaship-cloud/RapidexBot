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
      user.email = incomingMsg;
      reply = lang === 'pt'
        ? 'Qual é o seu endereço completo no Brasil?'
        : 'What is your full address in Brazil?';
      user.step = 3;
      break;

    case 3:
      user.address = incomingMsg;
      reply = lang === 'pt'
        ? 'Por favor, informe seu CPF:'
        : 'Please enter your CPF:';
      user.step = 4;
      break;

    case 4:
      user.cpf = incomingMsg;
      reply = lang === 'pt'
        ? `✅ Tudo certo, ${user.name}!\n\nSeus dados foram salvos com sucesso. Em breve você receberá seu endereço nos EUA. Obrigado por escolher a RapidEx!`
        : `✅ All set, ${user.name}!\n\nYour info was saved successfully. You’ll receive your U.S. address shortly. Thanks for choosing RapidEx!`;
      user.step = 5;
      break;

    default:
      reply = lang === 'pt'
        ? `Olá, ${user.name || ''}! Você já completou o cadastro.`
        : `Hi ${user.name || ''}, you’ve already completed the sign-up.`;
      break;
  }

  await updateUserStepOrCreate(user);

  twiml.message(reply);
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
