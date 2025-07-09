function doGet() {
  return HtmlService.createHtmlOutputFromFile('PrizeSupportForm')
    .setTitle('Prize Support Calculator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function processPrizeSupportForm(payload) {
  var numPlayers = parseInt(payload.numPlayers, 10);
  var entryFee = parseFloat(payload.entryFee);
  var withTO = !!payload.withTO;
  var packs = payload.packs || [];
  var results = [];
  var totalEntryFeeMinusTax = numPlayers * entryFee / 1.06;
  console.log('Total Entry Fee Minus Tax: ' + totalEntryFeeMinusTax);
  var toPayout = (totalEntryFeeMinusTax * .2).toFixed(2); // Deduct TO fee
  var storeProfit = toPayout

  if (packs.length === 0) {
    results.push('No prize packs entered.');
  } else if (withTO) {
    results.push(`TO Payout: $${toPayout}\r`);
    results.push('Prize Packs:\n');
    packs.forEach(function(entry) {
      var name = entry.name || entry.packName || '';
      var price = parseFloat(entry.price);
      var adjPrice = price * .6; // Adjust price for store profit
      if (!name || isNaN(price)) return;
      var totalPacks = Math.ceil((totalEntryFeeMinusTax - toPayout - storeProfit)/ adjPrice);
      Logger.log(totalPacks);

      results.push(`{${name}: ${totalPacks}}`);
    });
  } else {
    results.push('Prize Packs:\n');
    packs.forEach(function(entry) {
      var name = entry.name || entry.packName || '';
      var price = parseFloat(entry.price);
      var adjPrice = price * .6; // Adjust price for store profit
      if (!name || isNaN(price)) return;
      var totalPacks = Math.ceil((totalEntryFeeMinusTax - storeProfit)/ adjPrice);
      Logger.log(totalPacks);
      results.push(`{${name}: ${totalPacks}}`);
    });
  }

  return results.join('\r\n');
}
