const http = require('http');

const data = JSON.stringify({
  numPlayers: 8,
  entryFee: 10,
  withTO: true,
  packs: [{ name: 'Booster', price: 10 }],
  eventPacks: [],
  config: {},
  mode: 'prize',
  additionalCosts: 0
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/process',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Non-JSON response:\n', body);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(2);
});

req.write(data);
req.end();
