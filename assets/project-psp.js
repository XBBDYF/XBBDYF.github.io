(() => {
  'use strict';
  const dialog = document.querySelector('#psp-project-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    let trigger = null;
    document.querySelectorAll('[data-psp-project]').forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', dialog.id);
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault(); trigger = link;
        const image = dialog.querySelector('img[data-src]');
        if (image && !image.getAttribute('src')) image.src = image.dataset.src;
        dialog.showModal();
        document.documentElement.classList.add('psp-modal-open');
      });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('psp-modal-open');
      const status = dialog.querySelector('.psp-copy-status');
      if (status) status.textContent = '';
      trigger?.focus({preventScroll:true});
    });
  }
  document.querySelectorAll('[data-copy-group]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const status = button.parentElement.querySelector('.psp-copy-status');
      try {
        await navigator.clipboard.writeText(button.dataset.copyGroup);
        status.textContent = '群号已复制，打开 QQ 搜索群号即可。';
      } catch (_) {
        const number = button.parentElement.querySelector('.psp-group-number strong');
        const range = document.createRange(); range.selectNodeContents(number);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        status.textContent = '已选中群号，请长按或手动复制。';
      }
    });
  });
})();
