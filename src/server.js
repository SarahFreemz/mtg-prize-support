const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve home / index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/prize', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'PrizeSupportForm.html'));
});
app.get('/to-payout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'TOPayoutForm.html'));
});
app.get('/entry-fee', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'EntryFeeForm.html'));
});

// /process endpoint accepts a 'mode' field in body to choose behavior
app.post('/process', (req, res) => {
  try {
    const {
      numPlayers,
      entryFee,
      withTO,
      packs,
      config,
      mode,
      eventPacks,
      prizePacks,
      additionalCosts
    } = req.body;

    // Basic input validation
    const players = parseInt(numPlayers, 10);
    const fee = parseFloat(entryFee);
    if (!players || isNaN(players) || players < 1) {
      return res.status(400).json({ error: 'Invalid number of players' });
    }
    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({ error: 'Invalid entry fee' });
    }

    // Default configuration values
    const baseDefaults = {
      storeProfitRate: 0.20, // 20%
      toPayoutRate: 0.20,    // 20%
      storeCostFactor: 0.60, // 60%
      salesTaxRate: 0.06     // 6%
    };

    // Per-mode defaults (tweak as needed)
    const modeDefaults = {
      prize: { ...baseDefaults },
      'to-payout': { ...baseDefaults },
      'entry-fee': { ...baseDefaults }
    };

    const selectedMode = mode && modeDefaults[mode] ? mode : 'prize';
    const defaults = modeDefaults[selectedMode];

    // Compose final settings (explicit config overrides defaults if provided)
    const settings = { ...defaults, ...(config || {}) };

    // Parse additionalCosts (optional)
    const addCosts = parseFloat(additionalCosts) || 0;

    // Calculate total entry fee minus sales tax
    const salesTaxMultiplier = 1 + settings.salesTaxRate;
    const totalEntryFee = players * fee;
    const totalEntryFeeMinusTax = totalEntryFee / salesTaxMultiplier;

    // Compute store profit and TO payout (both are percentages of the pre-allocation pool)
    const storeProfit = totalEntryFeeMinusTax * settings.storeProfitRate;
    const toPayout = withTO ? totalEntryFeeMinusTax * settings.toPayoutRate : 0;

    // Compute event pack costs: qtyPerPlayer * players * (price * storeCostFactor)
    let eventPackCost = 0;
    if (Array.isArray(eventPacks) && eventPacks.length > 0) {
      eventPackCost = eventPacks.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0;
        const qtyPerPlayer = parseInt(p.qtyPerPlayer || 0, 10) || 0;
        const units = qtyPerPlayer * players;
        const storeCost = price * settings.storeCostFactor;
        return sum + units * storeCost;
      }, 0);
    }

    // Compute prize pack costs: totalQty * (price * storeCostFactor)
    let prizePackCost = 0;
    const prizeList = Array.isArray(prizePacks) && prizePacks.length > 0 ? prizePacks : (Array.isArray(packs) ? packs : []);
    if (prizeList.length > 0) {
      prizePackCost = prizeList.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0;
        // prize pack may provide totalQty or be used as a 'price' only list; support both
        const totalQty = parseInt(p.totalQty || p.qty || 0, 10) || 0;
        const storeCost = price * settings.storeCostFactor;
        return sum + totalQty * storeCost;
      }, 0);
    }

    // Decide whether to subtract existing prize pack costs before calculating remaining prize pool.
    // For 'prize' mode we do NOT subtract prize pack costs because the purpose is to show
    // how many packs the remaining pool can buy; users may not know quantities ahead of time.
    const prizePackCostSubtracted = selectedMode === 'prize' ? 0 : prizePackCost;

    // Prize pool after subtracting storeProfit, toPayout, event pack costs, (optionally) prize pack costs, and additional costs
    let prizePool = totalEntryFeeMinusTax - storeProfit - toPayout - eventPackCost - prizePackCostSubtracted - addCosts;

  // Prepare variable to hold per-pack allocatable counts (filled below if applicable)
  let allocByType = null;

    // Build results
    const results = [];
    results.push(`Mode: ${selectedMode}`);
    results.push(`Total revenue (before tax): $${totalEntryFee.toFixed(2)}`);
    results.push(`Sales tax rate: ${(settings.salesTaxRate * 100).toFixed(2)}%`);
    results.push(`Revenue after tax: $${totalEntryFeeMinusTax.toFixed(2)}`);
    results.push(`Store profit (${(settings.storeProfitRate * 100).toFixed(2)}%): $${storeProfit.toFixed(2)}`);
    if (withTO) results.push(`TO payout (${(settings.toPayoutRate * 100).toFixed(2)}%): $${toPayout.toFixed(2)}`);
    results.push(`Event packs total store cost: $${eventPackCost.toFixed(2)}`);
    results.push(`Prize packs total store cost (if accounting existing quantities): $${prizePackCost.toFixed(2)}`);
    results.push(`Additional costs: $${addCosts.toFixed(2)}`);
    results.push(`Remaining prize pool: $${prizePool.toFixed(2)}`);

    // If prizePool is negative, warn user
    if (prizePool < 0) {
      results.push('');
      results.push('Warning: remaining prize pool is negative. Revenue does not cover the configured costs/allocations.');
    }

    // Additionally: compute for each prize pack how many more packs could be purchased with the remaining prizePool (if positive)
    if (prizePool > 0 && prizeList.length > 0) {
      // Compute structured allocatable counts but do not append per-pack lines to the human-readable result.
      allocByType = prizeList.map((p, i) => {
        const name = p.name || `Pack ${i+1}`;
        const price = parseFloat(p.price) || 0;
        const storeCost = price * settings.storeCostFactor;
        const purchasable = storeCost > 0 ? Math.floor(prizePool / storeCost) : 0;
        return { name, purchasable };
      });
    }

    // Return the settings and result summary
    res.json({
      mode: selectedMode,
      settings,
      totals: {
        totalEntryFee,
        totalEntryFeeMinusTax,
        storeProfit,
        toPayout,
        eventPackCost,
        prizePackCost,
        additionalCosts: addCosts,
        prizePool,
        allocatablePacks: allocByType
      },
      result: results.join('\n')
    });

  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ error: 'Calculation failed', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});