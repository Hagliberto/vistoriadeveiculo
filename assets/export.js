/* Exportação seletiva usando exclusivamente o layout de impressão A4 · v1.5.8.
   O HTML de impressão é a única fonte do PDF. Sem canvas, sem PNG ou CDNs. */
(() => {
  'use strict';
  const modal = document.getElementById('export-modal');
  if (!modal) return;
  const feedback = document.getElementById('export-feedback');
  const buttons = [...modal.querySelectorAll('[data-export-format]')];
  const closeButton = document.getElementById('btn-close-export');
  const checklistToggle = document.getElementById('export-include-checklist');
  const detail = document.getElementById('export-checklist-detail');
  const categories = document.getElementById('export-checklist-categories');
  const categoriesSchema = (typeof CHECKLIST_SCHEMA !== 'undefined' ? CHECKLIST_SCHEMA : []);
  let previousFocus = null;
  let contentReady = false;

  function setup() {
    if (contentReady) return;
    contentReady = true;
    categories.innerHTML = '';
    categoriesSchema.forEach(section => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'export-category-check';
      input.value = String(section.id);
      input.checked = true;
      const text = document.createElement('span');
      text.textContent = section.title;
      label.append(input, text);
      categories.appendChild(label);
    });
    checklistToggle.addEventListener('change', updateChecklistVisibility);
    updateChecklistVisibility();
  }
  function updateChecklistVisibility() {
    detail.hidden = !checklistToggle.checked;
  }
  function open() {
    if (!modal.hidden) return;
    setup();
    const mobile = document.getElementById('mobile-actions-sheet');
    if (mobile && !mobile.hidden) document.getElementById('btn-close-actions')?.click();
    previousFocus = document.activeElement;
    feedback.textContent = 'O PDF utiliza o mesmo layout A4 da impressão. Selecione apenas as seções necessárias.';
    modal.hidden = false;
    document.body.classList.add('export-open');
    closeButton.focus();
  }
  function close() {
    modal.hidden = true;
    document.body.classList.remove('export-open');
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
  }
  window.openExportModal = open;
  document.querySelectorAll('[data-open-export]').forEach(button => button.addEventListener('click', open));
  closeButton.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') {e.preventDefault();e.stopPropagation();close();}
    if (e.key !== 'Tab') return;
    const focusable = [closeButton, ...modal.querySelectorAll('input:not(:disabled), button:not(:disabled)')]
      .filter((node, index, all) => all.indexOf(node) === index && !node.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
    else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
  });

  function applyPrintSelection() {
    const body = document.body;
    body.classList.add('print-selective');
    body.classList.toggle('print-omit-croqui', !document.getElementById('export-include-croqui').checked);
    body.classList.toggle('print-omit-checklist', !checklistToggle.checked);
    body.classList.toggle('print-omit-signatures', !document.getElementById('export-include-signatures').checked);
    body.classList.toggle('print-omit-photos', !document.getElementById('export-include-photos').checked);

    const picked = new Set([...categories.querySelectorAll('.export-category-check:checked')].map(input => input.value));
    const onlyChecked = document.getElementById('export-only-checked').checked;
    categoriesSchema.forEach(section => {
      const sectionElement = document.getElementById(`exp-sec-${section.id}`);
      if (sectionElement) sectionElement.classList.toggle('print-exclude-category', !picked.has(String(section.id)));
      section.items.forEach((_, index) => {
        const row = document.getElementById(`row-${section.id}_${index}`);
        if (!row) return;
        const status = appState?.checklist?.[`${section.id}_${index}`]?.status;
        row.classList.toggle('print-exclude-row', onlyChecked && !['ok','nok','na'].includes(status));
      });
    });
  }

  async function execute() {
    if (!modal.hidden) close();
    applyPrintSelection();
    // Valida dados e reutiliza o mesmo HTML/CSS do fluxo de impressão oficial.
    if (typeof validateAndPrint !== 'function') {
      feedback.textContent = 'A impressão não está disponível nesta versão do aplicativo.';
      open();
      return;
    }
    validateAndPrint();
  }
  buttons.forEach(button => button.addEventListener('click', execute));
})();
