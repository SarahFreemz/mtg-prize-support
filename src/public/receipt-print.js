/* Shared receipt printing utilities for MTG Prize Support pages
 * Exposes a global `ReceiptPrinter` with:
 *  - buildReceiptText(result) -> string
 *  - attachPrintHandler(selector, getTextFn) -> attaches click handler to open print popup
 */
(function (global) {
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function isoNow() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function safeNum(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return v.toFixed(2);
    var n = parseFloat(v);
    return Number.isFinite(n) ? n.toFixed(2) : String(v);
  }

  function buildReceiptText(result) {
    // result is expected to be the JSON the server returns. Build a compact receipt-style text.
    var lines = [];
    lines.push('MTG Prize Support');
    lines.push('Printed: ' + isoNow());
    lines.push('');

    try {
      if (result && result.totals) {
        var t = result.totals;
        if (typeof t.totalEntryFee === 'number') lines.push('Total entry fees: $' + safeNum(t.totalEntryFee));
        if (typeof t.totalEntryFeeMinusTax === 'number') lines.push('After tax: $' + safeNum(t.totalEntryFeeMinusTax));

        // Make TO payout more prominent on printed receipts by showing it in a separated block near the top
        // Only show the TO payout block when it's a positive amount. If `withTO` was unchecked the server
        // returns 0 for toPayout and we should not include the prominence block on the receipt.
        if (typeof t.toPayout === 'number' && t.toPayout > 0) {
          lines.push('');
          lines.push('======================================');
          lines.push('*** TO PAYOUT (to organizer): $' + safeNum(t.toPayout) + ' ***');
          lines.push('======================================');
          lines.push('');
        }

        if (typeof t.storeProfit === 'number') lines.push('Store profit: $' + safeNum(t.storeProfit));
        if (typeof t.prizePool === 'number') lines.push('Prize pool: $' + safeNum(t.prizePool));
        lines.push('');
        if (Array.isArray(t.allocatablePacks) && t.allocatablePacks.length) {
          lines.push('Purchasable packs:');
          t.allocatablePacks.forEach(function (p) {
            lines.push(' - ' + (p.name || 'pack') + ': ' + (p.purchasable || 0));
          });
          lines.push('');
        }
      }

      if (result && result.result) {
        lines.push('Summary:');
        // keep it compact — collapse multi-line server result into lines
        var rl = String(result.result).split(/\r?\n/).slice(0, 200);
        rl.forEach(function (ln) { lines.push(ln); });
      }
    } catch (e) {
      lines.push(String(result));
    }

    return lines.join('\n');
  }

  function openPrintWindow(bodyHtml) {
    var w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return null;
    try {
      w.document.open();
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title>');
      w.document.write('<style>body{font-family:monospace;font-size:12px;padding:10px;} pre{white-space:pre-wrap;}</style>');
      w.document.write('</head><body>');
      w.document.write(bodyHtml);
      w.document.write('</body></html>');
      w.document.close();
      return w;
    } catch (e) {
      try { w.close(); } catch (e) {}
      return null;
    }
  }

  function attachPrintHandler(selector, getTextFn) {
    function onClick() {
      var text = '';
      try { text = (typeof getTextFn === 'function') ? getTextFn() : window.__lastReceiptText || '' } catch (e) { text = window.__lastReceiptText || ''; }
      if (!text) {
        alert('No receipt available to print. Generate a result first.');
        return;
      }
      // Build small HTML with mono font and a narrow width for receipt printers
      var html = '<pre>' + escapeHtml(text) + '</pre>';
      var w = openPrintWindow(html);
      if (!w) { alert('Pop-up blocked. Allow pop-ups for this site to use printing.'); return; }
      // Give the popup a moment to render, then trigger print and close
      setTimeout(function () {
        try { w.focus(); w.print(); } catch (e) {}
        setTimeout(function () { try { w.close(); } catch (e) {} }, 100);
      }, 250);
    }

    function escapeHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    var el = null;
    try { el = document.querySelector(selector); } catch (e) { el = null; }
    if (!el) return false;
    el.addEventListener('click', onClick);
    return true;
  }

  global.ReceiptPrinter = {
    buildReceiptText: buildReceiptText,
    attachPrintHandler: attachPrintHandler
  };

})(window);
