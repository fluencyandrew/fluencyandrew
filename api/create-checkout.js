const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, customerEmail, customerName, sessionTime } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `https://fluencyandrew.vercel.app/pricing.html?success=true&session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(customerName)}&email=${encodeURIComponent(customerEmail)}&time=${encodeURIComponent(sessionTime)}`,
      cancel_url: `https://fluencyandrew.vercel.app/pricing.html?cancelled=true`,
      metadata: { customerName, sessionTime }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};