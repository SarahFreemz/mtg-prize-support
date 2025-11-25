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

    // Prize pool after subtracting storeProfit, toPayout, event & prize pack costs and additional costs
    let prizePool = totalEntryFeeMinusTax - storeProfit - toPayout - eventPackCost - prizePackCost - addCosts;

    // Build results
    const results = [];
    results.push(`Mode: ${selectedMode}`);
    results.push(`Total revenue (before tax): $${totalEntryFee.toFixed(2)}`);
    results.push(`Sales tax rate: ${(settings.salesTaxRate * 100).toFixed(2)}%`);
    results.push(`Revenue after tax: $${totalEntryFeeMinusTax.toFixed(2)}`);
    results.push(`Store profit (${(settings.storeProfitRate * 100).toFixed(2)}%): $${storeProfit.toFixed(2)}`);
    if (withTO) results.push(`TO payout (${(settings.toPayoutRate * 100).toFixed(2)}%): $${toPayout.toFixed(2)}`);
    results.push(`Event packs total store cost: $${eventPackCost.toFixed(2)}`);
    results.push(`Prize packs total store cost: $${prizePackCost.toFixed(2)}`);
    results.push(`Additional costs: $${addCosts.toFixed(2)}`);
    results.push(`Remaining prize pool: $${prizePool.toFixed(2)}`);

    // If prize packs were provided with totalQty, list them with cost and quantity
    if (prizeList.length > 0) {
      results.push('');
      results.push('Prize packs breakdown:');
      prizeList.forEach((p, i) => {
        const name = p.name || `Pack ${i+1}`;
        const price = parseFloat(p.price) || 0;
        const totalQty = parseInt(p.totalQty || p.qty || 0, 10) || 0;
        const storeCost = price * settings.storeCostFactor;
        const totalCost = (storeCost * totalQty);
        results.push(`${name}: qty ${totalQty}, store cost per pack $${storeCost.toFixed(2)}, total $${totalCost.toFixed(2)}`);
      });
    }

    // If prizePool is negative, warn user
    if (prizePool < 0) {
      results.push('');
      results.push('Warning: remaining prize pool is negative. Revenue does not cover the configured costs/allocations.');
    }

    // Additionally: compute for each prize pack how many more packs could be purchased with the remaining prizePool (if positive)
    let allocatablePacks = [];
    if (prizeList.length > 0) {
      allocatablePacks = prizeList.map((p, i) => {
        const name = p.name || `Pack ${i+1}`;
        const price = parseFloat(p.price) || 0;
        const storeCostPerPack = price * settings.storeCostFactor;
        const purchasable = (storeCostPerPack > 0 && prizePool > 0) ? Math.floor(prizePool / storeCostPerPack) : 0;
        return { name, price, storeCostPerPack, purchasable };
      });
    }

    // Structure event packs with computed units and store cost per pack for client consumption
    const eventPacksStructured = Array.isArray(eventPacks) && eventPacks.length > 0 ? eventPacks.map((ep, i) => {
      const price = parseFloat(ep.price) || 0;
      const qtyPerPlayer = parseInt(ep.qtyPerPlayer || 0, 10) || 0;
      const units = qtyPerPlayer * players;
      const storeCostPerPack = price * settings.storeCostFactor;
      return { name: ep.name || `EventPack ${i+1}`, price, qtyPerPlayer, units, storeCostPerPack };
    }) : [];

    // Structured prize list with store cost per pack
    const prizeListStructured = prizeList.map((p, i) => {
      const price = parseFloat(p.price) || 0;
      const totalQty = parseInt(p.totalQty || p.qty || 0, 10) || 0;
      const storeCostPerPack = price * settings.storeCostFactor;
      return { name: p.name || `Pack ${i+1}`, price, totalQty, storeCostPerPack };
    });

    // Build per-mode HTML human summaries so each client/page can prefer its own structure.
    function buildSummaryForMode(mode) {
      const parts = [];
      parts.push('<div><strong>MTG Prize Support</strong></div>');

      if (mode === 'entry-fee') {
        // Entry-fee focused summary: emphasize revenue and tax
        parts.push('<div>Total revenue (before tax): $' + totalEntryFee.toFixed(2) + '</div>');
        parts.push('<div>Revenue after tax: $' + totalEntryFeeMinusTax.toFixed(2) + '</div>');
        parts.push('<div>Store profit: $' + storeProfit.toFixed(2) + '</div>');
        parts.push('<div style="margin-top:6px;">Per-player entry fee: $' + (fee.toFixed ? fee.toFixed(2) : parseFloat(fee).toFixed(2)) + '</div>');
        if (withTO && typeof toPayout === 'number' && toPayout > 0) {
          parts.push('<div style="margin-top:8px;padding:6px;border:1px solid #000;background:#f8f9fa;">');
          parts.push('<strong>TO payout:</strong> $' + toPayout.toFixed(2) + '</div>');
        }
        return parts.join('');
      }

      if (mode === 'to-payout') {
        // TO payout focused summary: make the TO payout very prominent, de-emphasize remaining prize pool
        if (withTO && typeof toPayout === 'number' && toPayout > 0) {
          parts.push('<div style="margin-top:8px;padding:8px;border:2px solid #000;background:#fff3cd;">');
          parts.push('<div style="font-weight:700;font-size:1.05em;">TO payout: $' + toPayout.toFixed(2) + '</div>');
          parts.push('</div>');
        } else {
          parts.push('<div style="margin-top:8px;"><em>No TO payout configured.</em></div>');
        }
        // remaining prize pool shown plainly (no strong)
        parts.push('<div style="margin-top:6px;">Remaining prize pool: $' + prizePool.toFixed(2) + '</div>');
        // small allocatable packs list if any
        if (allocatablePacks.length > 0) {
          parts.push('<div style="margin-top:6px;"><small>Packs available (whole packs):</small></div>');
          parts.push('<ul>');
          allocatablePacks.forEach(p => parts.push('<li>' + (p.name || 'pack') + ': ' + p.purchasable + '</li>'));
          parts.push('</ul>');
        }
        return parts.join('');
      }

      // Default: 'prize' mode summary (prize distribution focused)
      parts.push('<div>Total revenue (before tax): $' + totalEntryFee.toFixed(2) + '</div>');
      parts.push('<div>Revenue after tax: $' + totalEntryFeeMinusTax.toFixed(2) + '</div>');
      parts.push('<div>Store profit: $' + storeProfit.toFixed(2) + '</div>');
      if (withTO && typeof toPayout === 'number' && toPayout > 0) {
        parts.push('<div style="margin-top:8px;padding:6px;border:1px solid #000;background:#f8f9fa;">');
        parts.push('<strong>TO payout:</strong> $' + toPayout.toFixed(2));
        parts.push('</div>');
      }
      // emphasize remaining prize pool for prize mode
      parts.push('<div style="margin-top:6px;"><strong>Remaining prize pool:</strong> $' + prizePool.toFixed(2) + '</div>');
      if (allocatablePacks.length > 0) {
        parts.push('<div style="margin-top:6px;"><strong>Packs available (whole packs):</strong></div>');
        parts.push('<ul>');
        allocatablePacks.forEach(p => parts.push('<li>' + (p.name || 'pack') + ': ' + p.purchasable + '</li>'));
        parts.push('</ul>');
      }
      return parts.join('');
    }

    const humanSummaryHtmlByMode = {
      prize: buildSummaryForMode('prize'),
      'to-payout': buildSummaryForMode('to-payout'),
      'entry-fee': buildSummaryForMode('entry-fee')
    };

    // Backwards-compatible single summary equals the selected mode's summary
    const humanSummaryHtml = humanSummaryHtmlByMode[selectedMode] || humanSummaryHtmlByMode.prize;

    // Return the settings and result summary (keep backward compat fields too)
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
        allocatablePacks // [{name, price, storeCostPerPack, purchasable}]
      },
      // backward-compatible plain text result
      result: results.join('\n'),
      // structured fields for richer clients
      resultLines: results,
      humanSummary: results.join('\n'),
      humanSummaryHtmlByMode,
      humanSummaryHtml,
      prizeList: prizeListStructured,
      eventPacks: eventPacksStructured
    });

  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ error: 'Calculation failed', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});