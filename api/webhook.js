// Simplified webhook for debugging Vercel deployment
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle health check (GET request)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SmartDirect Bot Webhook',
      message: 'Webhook is working!'
    });
  }

  // Handle POST requests
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Message field is required'
        });
      }

      // Simple response for now
      let reply = "Hello! I'm SmartDirect Bot. I can help you with shipping quotes from US to Brazil.";
      
      // Detect language
      const isPortuguese = /frete|envio|entrega|pacote|quanto|custo|preço|valor|real|reais|kg|quilos|centímetros|rastreio|alfândega|imposto|taxa|cpf|cep|brasil/i.test(message);
      
      if (isPortuguese) {
        reply = "Olá! Sou o SmartDirect Bot. Posso ajudar com cotações de frete dos EUA para o Brasil.";
      }

      // Check for quote request
      if (/quote|frete|shipping|price|cost|quanto|custo|cotação|envio|preço/i.test(message)) {
        if (isPortuguese) {
          reply = `📦 Para uma cotação de frete, preciso das seguintes informações:

📏 Peso do pacote (kg ou lbs)
📐 Dimensões (comprimento x largura x altura em cm ou polegadas)
📍 CEP de destino no Brasil

Exemplo: "3 kg, 30x20x15 cm para CEP 01310-100"`;
        } else {
          reply = `📦 For a shipping quote, I need the following information:

📏 Package weight (kg or lbs)
📐 Dimensions (length x width x height in cm or inches)
📍 Destination CEP (Brazilian postal code)

Example: "5 lbs, 12x8x6 inches to 01310-100"`;
        }
      }

      return res.status(200).json({
        reply: reply,
        timestamp: new Date().toISOString(),
        requestId: `req-${Date.now()}`
      });

    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: 'Method not allowed',
    message: 'Only GET and POST methods are supported'
  });
}