export default function handler(req, res) {
  return res.status(200).json({ 
    message: "It works!",
    method: req.method,
    timestamp: new Date().toISOString()
  });
}