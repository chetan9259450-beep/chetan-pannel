const http = require('http');

const PORT = 5000;

http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        let params;
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed && Array.isArray(parsed.orders)) {
            parsed.orders = parsed.orders.join(',');
          }
          if (parsed.key) {
            parsed.key = String(parsed.key).trim().replace(/^["']|["']$/g, '');
          }
          if (parsed.action) {
            parsed.action = String(parsed.action).trim();
          }
          params = new URLSearchParams(parsed);
        } catch (_) {
          params = new URLSearchParams(rawBody);
        }

        const action = params.get('action') || 'unknown';
        const keyLen = (params.get('key') || '').length;
        console.log(`[PROXY REQ] action=${action} | keyLength=${keyLen}`);

        const upstreamRes = await fetch('https://finesmmpanel.com/api/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: params.toString()
        });

        const text = await upstreamRes.text();
        console.log(`[PROXY RES] FineSMM HTTP ${upstreamRes.status}: ${text.slice(0, 150)}`);

        res.writeHead(upstreamRes.status, { 'Content-Type': 'application/json' });
        res.end(text);
      } catch (err) {
        console.error(`[PROXY ERROR]`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
}).listen(PORT, () => {
  console.log(`CORS Proxy running on http://localhost:${PORT}`);
});
