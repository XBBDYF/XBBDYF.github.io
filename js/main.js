document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if(contactForm) contactForm.addEventListener('submit', (e) => { e.preventDefault(); alert('感谢您的留言！我会尽快回复。'); e.target.reset(); });
    // 生成可视化条 (确保有20个)
    const vizContainer = document.getElementById('visualizerBars');
    if(vizContainer && vizContainer.children.length === 0){
        for(let i=0;i<20;i++){ const bar = document.createElement('span'); bar.className = 'v-bar'; vizContainer.appendChild(bar); }
        window.location.reload(); // 简单刷新让音乐播放器重新获取bars，实际无需
    }
});