export default async function handler(req, res) {
  console.log("Incoming request:", req.method);

  try {
    if (req.method !== 'POST') {
      return res.status(405).end('Method Not Allowed');
    }

    const buf = await buffer(req);
    console.log("Raw buffer:", buf.toString());

    const data = new URLSearchParams(buf.toString());
    const incomingMsg = data.get('Body')?.trim();
    const from = data.get('From');

    console.log("Message:", incomingMsg, "From:", from);

    // Rest of your code...
