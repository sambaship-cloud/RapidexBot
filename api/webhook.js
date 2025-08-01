export default function handler(req, res) {
  if (req.method === 'POST') {
    const incomingMsg = req.body.Body.toLowerCase();

    let reply = '';

    // English & Portuguese triggers
    if (incomingMsg.includes('how') || incomingMsg.includes('como funciona')) {
      reply = `📦 Welcome to RapidEx 🇺🇸🇧🇷\n\n🇺🇸 How it works:\n1️⃣ Get your free U.S. address\n2️⃣ Shop at any U.S. store\n3️⃣ We receive, repackage, and forward your packages to Brazil\n\n🇧🇷 Como funciona:\n1️⃣ Você recebe um endereço gratuito nos EUA\n2️⃣ Compra em qualquer loja americana\n3️⃣ A RapidEx reenvia seus pacotes para o Brasil`;
    } else if (
      incomingMsg.includes('price') ||
      incomingMsg.includes('cost') ||
      incomingMsg.includes('preço') ||
      incomingMsg.includes('quanto')
    ) {
      reply = `💰 RapidEx Pricing:\n\n🇺🇸 - $10 flat forwarding fee per box\n- Shipping via USPS, FedEx, or DHL\n- Rates based on size & weight\n\n🇧🇷 - Taxa de reenvio: $10 por caixa\n- Frete via USPS, FedEx ou DHL\n- Custo baseado em tamanho e peso`;
    } else if (
      incomingMsg.includes('start') ||
      incomingMsg.includes('começar') ||
      incomingMsg.includes('signup') ||
      incomingMsg.includes('cadastro')
    ) {
      reply = `🚀 Ready to get started with RapidEx?\n\n🇺🇸 Reply with your email to receive your free U.S. address.\n\n🇧🇷 Responda com seu e-mail para receber seu endereço nos EUA gratuitamente.`;
    } else {
      reply = `👋 Welcome to RapidEx 🇺🇸📦🇧🇷\n\n🇺🇸 Type:\n- "How" to learn how it works\n- "Price" to get pricing info\n- "Start" to begin\n\n🇧🇷 Digite:\n- "Como funciona" para entender o processo\n- "Preço" para saber os custos\n- "Começar" para iniciar`;
    }

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
