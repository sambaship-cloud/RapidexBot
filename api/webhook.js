const sessions = {};

export default function handler(req, res) {
  if (req.method === 'POST') {
    const incomingMsg = req.body.Body?.trim();
    const from = req.body.From;
    const user = sessions[from] || { step: 0, lang: null };

    // Auto-detect language on first message
    if (user.step === 0 && !user.lang) {
      const msg = incomingMsg.toLowerCase();
      const isPortuguese = /oi|como|preço|cpf|endereço|começar|cadastro/.test(msg);
      user.lang = isPortuguese ? 'pt' : 'en';
    }

    const lang = user.lang;
    let reply = '';

    switch (user.step) {
      case 0:
        reply = lang === 'pt'
          ? `👋 Bem-vindo à RapidEx!\nVamos começar.\nQual é o seu nome completo?`
          : `👋 Welcome to RapidEx 🇺🇸📦🇧🇷\nLet's get you set up!\nWhat is your full name?`;
        user.step = 1;
        break;

      case 1:
        user.name = incomingMsg;
        reply = lang === 'pt'
          ? `📧 Obrigado, ${user.name}!\nPor favor, digite seu e-mail:`
          : `📧 Thanks, ${user.name}!\nPlease enter your email address:`;
        user.step = 2;
        break;

      case 2:
        user.email = incomingMsg;
        reply = lang === 'pt'
          ? `🏠 Ótimo! Agora, qual é o seu **endereço completo no Brasil** (incluindo CEP)?`
          : `🏠 Great! Now, what's your full **Brazilian shipping address** (including ZIP code)?`;
        user.step = 3;
        break;

      case 3:
        user.address = incomingMsg;
        reply = lang === 'pt'
          ? `🔢 Por fim, digite seu **CPF (Cadastro de Pessoas Físicas):**`
          : `🔢 Lastly, please enter your **CPF (Cadastro de Pessoas Físicas):**`;
        user.step = 4;
        break;

      case 4:
        user.cpf = incomingMsg;
        reply = lang === 'pt'
          ? `✅ Tudo certo, ${user.name}!\n\nSeus dados:\n📛 Nome: ${user.name}\n📧 E-mail: ${user.email}\n🏠 Endereço: ${user.address}\n🪪 CPF: ${user.cpf}\n\nVamos configurar seu endereço nos EUA e entraremos em contato em breve. Obrigado por escolher a RapidEx!`
          : `✅ All done, ${user.name}!\n\nHere's what we got:\n📛 Name: ${user.name}\n📧 Email: ${user.email}\n🏠 Address: ${user.address}\n🪪 CPF: ${user.cpf}\n\nWe'll now set up your U.S. forwarding address and reach out soon. Thank you for choosing RapidEx!`;
        console.log("New RapidEx Signup:", user);
        user.step = 0;
        user.lang = null; // reset for next session
        break;

      default:
        reply = lang === 'pt'
          ? `Olá! Vamos começar de novo. Qual é o seu nome completo?`
          : `Hi! Let's start again. What is your full name?`;
        user.step = 1;
        break;
    }

    sessions[from] = user;

    const twiml = `
      <Response>
        <Message>${reply}</Message>
      </Response>
    `;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
  } else {
    res.status(200).json({ status: "RapidEx bot is running!", timestamp: new Date().toISOString() });
  }
}
