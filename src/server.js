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
  const { numPlayers, entryFee, withTO, packs, config } = req.body;
  let results = [];
  
  // Default configuration values
  const defaultConfig = {
    storeProfitRate: 0.20,     // 20%
    toPayoutRate: 0.20,        // 20%
    storeCostFactor: 0.60,     // 60%
    salesTaxRate: 0.06         // 6%
  };
  
  // Use provided config or defaults
  const settings = { ...defaultConfig, ...config };
  
  // Calculate total entry fee minus tax
  const salesTaxMultiplier = 1 + settings.salesTaxRate;
  let totalEntryFeeMinusTax = numPlayers * entryFee / salesTaxMultiplier;

  // Store profit calculation
  let storeProfit = (totalEntryFeeMinusTax * settings.storeProfitRate).toFixed(2);

  // TO payout calculation
  let toPayout = 0;
  if (withTO) {
    toPayout = (totalEntryFeeMinusTax * settings.toPayoutRate).toFixed(2);
  }

  // Remove store profit and TO payout from prize pool
  let prizePool = totalEntryFeeMinusTax - storeProfit - (withTO ? toPayout : 0);
  prizePool = prizePool.toFixed(2);

  console.log('Received packs:', packs);

  if (!packs || packs.length === 0) {
    results.push('No prize packs entered.');
  } else {
    results.push('Prize Distribution');
    if (withTO) {
      results.push(`TO Payout: $${toPayout}`);
    }
    
    // For each pack, calculate how many can be distributed
    packs.forEach((pack, i) => {
      console.log(`Pack ${i}:`, pack, 'Name:', pack.name, 'Price:', pack.price);
      const packName = pack && pack.name ? pack.name : 'Unnamed Pack';
      const price = parseFloat(pack.price);
      if (isNaN(price) || price <= 0) {
        results.push(`${packName}: Invalid price`);
        return;
      }
      const storeCostPerPack = price * settings.storeCostFactor;
      const numPacks = Math.ceil(prizePool / storeCostPerPack);
      results.push(`${packName}: ${numPacks} pack(s)`);
    });
  }

  res.json({ result: results.join('\n') });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});