// Shared additional costs progressive-enhancement and UX
// Behavior:
// - HTML shows helper text and input by default (for non-JS users)
// - When JS runs we hide the helper text/input and show the "Add additional costs" button
// - Clicking Add reveals the helper text and input; Remove hides and resets

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addAdditionalCostsBtn');
  const wrapper = document.getElementById('additionalCostsWrapper');
  const input = document.getElementById('additionalCosts');
  const removeBtn = document.getElementById('removeAdditionalCostsBtn');
  const textEl = document.getElementById('additionalCostsText');

  if (!addBtn || !wrapper || !input) return;

  // Progressive enhancement: HTML shows helper/input by default for non-JS.
  // Now hide helper/input and show the Add button instead.
  try {
    addBtn.style.display = '';
  } catch (e) {}
  if (textEl) textEl.style.display = 'none';
  wrapper.style.display = 'none';
  input.disabled = true;

  addBtn.addEventListener('click', () => {
    if (textEl) textEl.style.display = '';
    wrapper.style.display = '';
    input.disabled = false;
    input.focus();
    addBtn.style.display = 'none';
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      wrapper.style.display = 'none';
      if (textEl) textEl.style.display = 'none';
      input.disabled = true;
      input.value = '0';
      addBtn.style.display = '';
    });
  }
});
