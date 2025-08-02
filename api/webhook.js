import { MessagingResponse } from 'twilio';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const buf = await buffer(req);
  const params = new URLSearchParams(buf.toString());
  const incomingMsg = params.get('Body')?.trim();

  const twiml = new MessagingResponse();
  const reply = incomingMsg
    ? `You said: "${incomingMsg}"`
    : "Please send a message.";

  twiml.message(reply);
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
