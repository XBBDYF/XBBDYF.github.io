/* Progressive enhancement: all content and links work without this script. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const theme = $('.theme-toggle');
  const updateThemeLabel = () => {
    if (!theme) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    theme.setAttribute('aria-label', dark ? '切换到浅色主题' : '切换到深色主题');
    theme.title = theme.getAttribute('aria-label');
  };
  theme?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('xb-theme', dark ? 'dark' : 'light'); } catch (_) { /* Storage is optional. */ }
    updateThemeLabel();
  });
  updateThemeLabel();

  const toolbar = $('.filter-toolbar');
  if (toolbar) {
    toolbar.hidden = false;
    const cards = [...document.querySelectorAll('.post-card')];
    const buttons = [...toolbar.querySelectorAll('[data-filter]')];
    const input = $('#search');
    let selected = '全部';
    const result = $('.search-result');
    const filterPosts = () => {
      const query = input.value.trim().toLocaleLowerCase();
      let visible = 0;
      cards.forEach(card => {
        card.hidden = !((selected === '全部' || card.dataset.category === selected) && card.dataset.search.toLocaleLowerCase().includes(query));
        if (!card.hidden) visible++;
      });
      buttons.forEach(button => {
        const active = button.dataset.filter === selected;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      $('.empty-state').hidden = visible > 0;
      $('.end-note').hidden = selected !== '全部' || query.length > 0;
      result.hidden = selected === '全部' && !query;
      result.textContent = `找到 ${visible} 篇手记${query ? ` · 关键词：${input.value.trim()}` : ''}`;
    };
    buttons.forEach(button => button.addEventListener('click', () => { selected = button.dataset.filter; filterPosts(); }));
    input.addEventListener('input', filterPosts);
    $('.reset-search').addEventListener('click', () => { selected = '全部'; input.value = ''; filterPosts(); input.focus(); });
  }

  document.querySelectorAll('.prose pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const label = document.createElement('span');
    label.className = 'code-label';
    label.textContent = (code.className.match(/language-([\w+-]+)/)?.[1] || 'CODE').toUpperCase();
    const copy = document.createElement('button');
    copy.type = 'button'; copy.className = 'copy-code'; copy.textContent = '复制代码';
    copy.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(code.textContent);
        copy.textContent = '已复制 ✓';
      } catch (_) {
        const range = document.createRange(); range.selectNodeContents(code);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        copy.textContent = '已选中，请手动复制';
      }
      setTimeout(() => { copy.textContent = '复制代码'; }, 2400);
    });
    pre.append(label, copy);
  });

  const music = $('.music-card');
  if (music) {
    music.hidden = false;
    const toggle = $('#music-toggle'), panel = $('#music-panel'), select = $('#track'), audio = $('#audio'), play = $('#play-music'), status = $('.music-status');
    const paths = ['music/心予報.mp3', 'music/Oh! Susanna.mp3', 'music/Montagem pitty.mp3', 'music/天天天国地獄国 (feat. ななひら & P丸様。).mp3'];
    toggle.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
      toggle.setAttribute('aria-label', panel.hidden ? '打开音乐播放器' : '收起音乐播放器');
    });
    // Selecting a track never downloads it. The first request only follows Play.
    select.addEventListener('change', () => {
      audio.pause(); audio.removeAttribute('src'); audio.load(); audio.hidden = true;
      play.textContent = '播放音乐 ▶'; status.textContent = '点击播放后才加载音频';
    });
    play.addEventListener('click', async () => {
      if (!audio.paused) { audio.pause(); return; }
      if (!audio.getAttribute('src')) audio.src = paths[Number(select.value)];
      audio.hidden = false; play.disabled = true; status.textContent = '正在加载音乐…';
      try { await audio.play(); } catch (_) { status.textContent = '音乐暂时没有播放，点击可重试。'; }
      finally { play.disabled = false; }
    });
    audio.addEventListener('playing', () => { play.textContent = '暂停音乐 Ⅱ'; status.textContent = `正在播放：${select.selectedOptions[0].textContent}`; });
    audio.addEventListener('pause', () => { play.textContent = '播放音乐 ▶'; if (audio.getAttribute('src')) status.textContent = '已暂停'; });
    audio.addEventListener('ended', () => { play.textContent = '重新播放 ↻'; status.textContent = '播放结束'; });
    audio.addEventListener('error', () => { play.disabled = false; status.textContent = '音乐加载失败，点击播放重试。'; audio.removeAttribute('src'); });
    audio.volume = 0.5;
  }
})();
