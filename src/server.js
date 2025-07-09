const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (like your HTML form) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'PrizeSupportForm.html'));
});

// Handle form submissions
app.post('/process', (req, res) => {
  const { numPlayers, entryFee, withTO, packs } = req.body;
  let results = [];
  let totalEntryFeeMinusTax = numPlayers * entryFee / 1.06;

  // Store profit is always 20% of the pool
  let storeProfit = (totalEntryFeeMinusTax * 0.2).toFixed(2);

  // TO payout is also always 20% of the pool (if withTO is true)
  let toPayout = 0;
  if (withTO) {
    toPayout = (totalEntryFeeMinusTax * 0.2).toFixed(2);
  }

  // Remove store profit and TO payout from prize pool
  let prizePool = totalEntryFeeMinusTax - storeProfit - (withTO ? toPayout : 0);

  if (!packs || packs.length === 0) {
    results.push('No prize packs entered.');
  } else {
    results.push('Prize Distribution');
    if (withTO) {
      results.push(`TO Payout: $${toPayout}`);
    }
    // For each pack, calculate how many can be distributed
    packs.forEach((pack, i) => {
      const packName = pack && pack.name ? pack.name : 'Unnamed Pack';
      const price = parseFloat(pack.price);
      if (isNaN(price) || price <= 0) {
        results.push(`${packName}: Invalid price`);
        return;
      }
      const storeCostPerPack = price * 0.6;
      const numPacks = Math.ceil(prizePool / storeCostPerPack);
      results.push(`${packName}: ${numPacks} pack(s)`);
    });
  }

  res.json({ result: results.join('\n') });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});