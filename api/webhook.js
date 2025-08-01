import twilio from 'twilio';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check for GET requests
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Bot is running!',
      timestamp: new Date().toISOString()
    });
  }

  // Handle WhatsApp messages (POST requests from Twilio)
  if (req.method === 'POST') {
    try {
      console.log('Received webhook:', req.body);

      // Extract message details from Twilio webhook
      const incomingMessage = req.body.Body || '';
      const from = req.body.From || '';
      const to = req.body.To || '';

      console.log(`Message from ${from}: ${incomingMessage}`);

      // Simple bot responses
      let responseMessage = '';

      if (incomingMessage.toLowerCase().includes('hello') || incomingMessage.toLowerCase().includes('hi')) {
        responseMessage = '👋 Hello! I\'m your WhatsApp bot. How can I help you today?';
      } else if (incomingMessage.toLowerCase().includes('help')) {
        responseMessage = `🤖 I'm a simple bot! Try saying:
- "hello" for a greeting
- "time" for current time
- "joke" for a joke`;
      } else if (incomingMessage.toLowerCase().includes('time')) {
        responseMessage = `🕐 Current time: ${new Date().toLocaleString()}`;
      } else if (incomingMessage.toLowerCase().includes('joke')) {
        const jokes = [
          'Why don\'t scientists trust atoms? Because they make up everything!',
          'Why did the math book look so sad? Because it was full of problems!',
          'What do you call a fake noodle? An impasta!'
        ];
        responseMessage = jokes[Math.floor(Math.random() * jokes.length)];
      } else {
        responseMessage = `You said: "${incomingMessage}". I'm a simple bot - try saying "help" to see what I can do!`;
      }

      // Create Twilio response using TwiML
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(responseMessage);

      // Set proper content type for Twilio
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());

    } catch (error) {
      console.error('Webhook error:', error);
      
      // Send error response in TwiML format
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Sorry, I encountered an error. Please try again.');
      
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}