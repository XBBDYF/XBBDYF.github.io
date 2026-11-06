/* Optional enhancements for the classic edition. Reading works without JavaScript. */
(() => {
  'use strict';
  const search = document.querySelector('.retro-search');
  if (search) {
    search.hidden = false;
    const input = search.querySelector('input');
    const rows = [...document.querySelectorAll('.post-row')];
    const status = document.querySelector('.search-status');
    const empty = document.querySelector('.search-empty');
    const filter = () => {
      const query = input.value.trim().toLocaleLowerCase();
      let count = 0;
      rows.forEach(row => {
        row.hidden = !row.dataset.search.toLocaleLowerCase().includes(query);
        if (!row.hidden) count++;
      });
      status.hidden = query.length === 0;
      status.textContent = `找到 ${count} 篇日志${query ? `，关键词：${input.value.trim()}` : ''}`;
      empty.hidden = count > 0;
    };
    search.addEventListener('submit', event => { event.preventDefault(); filter(); });
    input.addEventListener('input', filter);
    document.querySelector('#clear-search')?.addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
  }

  const copyPage = document.querySelector('.copy-page');
  if (copyPage) {
    copyPage.hidden = false;
    copyPage.addEventListener('click', async () => {
      const status = document.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText(location.href.split('#')[0]);
        status.textContent = '链接已复制，欢迎分享。';
      } catch (_) { status.textContent = '请在浏览器地址栏复制本文链接。'; }
    });
  }
  document.querySelectorAll('.article-content pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const label = document.createElement('span');
    label.className = 'code-label'; label.textContent = (code.className.match(/language-([\w+-]+)/)?.[1] || 'CODE').toUpperCase();
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'copy-code'; button.textContent = '复制代码';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = '复制成功';
      } catch (_) {
        const range = document.createRange(); range.selectNodeContents(code);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        button.textContent = '已选中，请手动复制';
      }
      setTimeout(() => { button.textContent = '复制代码'; }, 2200);
    });
    pre.append(label, button);
  });

  const play = document.querySelector('#music-play');
  if (play) {
    play.hidden = false;
    const audio = document.querySelector('#retro-audio');
    const track = document.querySelector('#music-track');
    const status = document.querySelector('#music-status');
    const root = document.body.dataset.root;
    const tracks = ['心予報.mp3', 'Oh! Susanna.mp3', 'Montagem pitty.mp3', '天天天国地獄国 (feat. ななひら & P丸様。).mp3'];
    audio.volume = 0.5;
    track.addEventListener('change', () => {
      audio.pause(); audio.removeAttribute('src'); audio.load(); audio.hidden = true;
      play.textContent = '播放 ▶'; status.textContent = '歌曲已选择，点击播放后加载。';
    });
    play.addEventListener('click', async () => {
      if (!audio.paused) { audio.pause(); return; }
      if (!audio.getAttribute('src')) audio.src = root + 'music/' + tracks[Number(track.value)];
      audio.hidden = false; play.disabled = true; status.textContent = '音乐正在加载，请稍等…';
      try { await audio.play(); } catch (_) { status.textContent = '这首歌暂时没有播放，点击可重试。'; }
      finally { play.disabled = false; }
    });
    audio.addEventListener('playing', () => { play.textContent = '暂停 Ⅱ'; status.textContent = '正在播放：' + track.selectedOptions[0].textContent; });
    audio.addEventListener('pause', () => { play.textContent = '播放 ▶'; if (audio.getAttribute('src')) status.textContent = '播放已暂停。'; });
    audio.addEventListener('ended', () => { play.textContent = '再听一次 ↻'; status.textContent = '播放结束。'; });
    audio.addEventListener('error', () => { play.disabled = false; audio.removeAttribute('src'); status.textContent = '音乐加载失败，点击播放重试。'; });
  }
})();
