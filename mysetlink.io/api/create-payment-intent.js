const Stripe = require('stripe');

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const currency = 'eur';

async function parseBody(req) {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  if (!stripe) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Stripe not configured' }));
  }

  let amount = 0;
  try {
    const body = await parseBody(req);
    amount = Number(body.amount) || 0;
  } catch (err) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
  }

  if (!Number.isFinite(amount) || amount < 50) {
    // minimum 50 cents
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Amount must be at least 50 (cents)' }));
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: { enabled: true }
    });
    return res.end(JSON.stringify({ clientSecret: intent.client_secret }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Unable to create payment intent' }));
  }
};
