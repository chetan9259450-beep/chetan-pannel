export default async function handler(req, res) {
  // Allow browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (payload.key) {
      payload.key = String(payload.key).trim().replace(/^["']|["']$/g, '');
    }
    if (payload.action) {
      payload.action = String(payload.action).trim();
    }
    if (payload && Array.isArray(payload.orders)) {
      payload.orders = payload.orders.join(',');
    }
    const params = new URLSearchParams(payload);

    const apiRes = await fetch('https://finesmmpanel.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
