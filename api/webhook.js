const { MessagingResponse } = require('twilio');
const { buffer } = require('micro');

exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const buf = await buffer(req);
    const params = new URLSearchParams(buf.toString());
    const incomingMsg = params.get('Body')?.trim();

    const twiml = new MessagingResponse();
    const reply = incomingMsg
      ? `You said: "${incomingMsg}"`
      : 'Plea
