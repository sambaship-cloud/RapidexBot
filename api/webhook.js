exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  res.status(200).send('Minimal webhook works!');
};
