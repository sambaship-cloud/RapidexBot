const sessions = {};

export default function handler(req, res) {
  if (req.method === 'POST') {
    const incomingMsg = req.body.Body?.trim();
    const from = req.body.From;
    const user = sessions[from] || { step: 0 };

    let reply = '';

    switch (user.step) {
      case 0:
        reply = `👋 Welcome to RapidEx 🇺🇸📦🇧🇷\nLet's get you set up!\n\nWhat is your full name?`;
        user.step = 1;
        break;

      case 1:
        user.name = incomingMsg;
        reply = `📧 Thanks, ${user.name}!\nPlease enter your email address:`;
        user.step = 2;
        break;

      case 2:
        user.email = incomingMsg;
        reply = `🏠 Great! Now, what's your full **Brazilian shipping address** (including ZIP code)?`;
        user.step = 3;
        break;

      case 3:
        user.address = incomingMsg;
        reply = `🔢 Lastly, please enter your **CPF** (Cadastro de Pessoas Físicas):`;
        user.step = 4;
        break;

      case 4:
        user.cpf = incomingMsg;
        reply = `✅ All done, ${user.name}!\n\nHere's what we got:\n\n📛 Name: ${user.name}\n📧 Email: ${user.email}\n🏠 Address: ${user.address}\n🪪 CPF: ${user.cpf}\n\nWe'll now set up your U.S. forwarding address and reach out soon. Obrigado! 🇧🇷`;

        // You can log or email this data to yourself manually for now
        console.log("New RapidEx Signup:", user);

        user.step = 0; // Reset for future interactions
        break;

      default:
        reply = `Hi! Let's start over. What is your full name?`;
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
