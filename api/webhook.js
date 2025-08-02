const { buffer } = require('micro');
const { MessagingResponse } = require('twilio');

exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const buf = await buffer(req);
    const params = new URLSearchParams(buf.toString());
    const body = params.get('Body') || '';

    const twiml = new MessagingResponse();
    twiml.message(`You said: "${body.trim()}"`);

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  } catch (err) {
    console.error('Error in handler:', err);
    res.status(500).send('Internal Server Error');
  }
};
