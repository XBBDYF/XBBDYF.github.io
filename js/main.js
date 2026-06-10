// ==================== 粒子背景 ====================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
const particleCount = 80;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
});

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0ea5e9';
        ctx.globalAlpha = 0.5;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    const maxDistance = 120;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDistance) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0ea5e9';
                ctx.globalAlpha = 0.15 * (1 - dist / maxDistance);
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    connectParticles();
    requestAnimationFrame(animateParticles);
}

resizeCanvas();
initParticles();
animateParticles();

// ==================== 导航栏交互 ====================
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
    let scrollY = window.scrollY;
    if (scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${section.id}`) {
                    link.classList.add('active');
                }
            });
        }
    });

    const scrollProgress = document.getElementById('scrollProgress');
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    const progress = (scrollY / totalHeight) * 100;
    scrollProgress.style.width = `${Math.min(progress, 100)}%`;

    const backToTop = document.getElementById('backToTop');
    if (scrollY > 600) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
    });
});

// ==================== 主题切换 ====================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

const getCurrentTheme = () => localStorage.getItem('theme') || 'light';
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
};

const savedTheme = getCurrentTheme();
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
});

// ==================== 打字机效果 ====================
const typewriterEl = document.getElementById('typewriter');
const texts = ['洗不白de衣服', '一个开发者', '创意构建者', '终身学习者'];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function typeWriter() {
    const currentText = texts[textIndex];
    if (isDeleting) {
        charIndex--;
        typeSpeed = 50;
    } else {
        charIndex++;
        typeSpeed = 120;
    }

    typewriterEl.textContent = currentText.substring(0, charIndex);

    if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typeSpeed = 500;
    }

    setTimeout(typeWriter, typeSpeed);
}

setTimeout(typeWriter, 500);

// ==================== 数字递增动画 ====================
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = +el.getAttribute('data-count');
            let count = 0;
            const increment = target / 40;
            const timer = setInterval(() => {
                count += increment;
                if (count >= target) {
                    el.textContent = target + (target > 10 ? '+' : '');
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(count) + '+';
                }
            }, 30);
            statsObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(num => statsObserver.observe(num));

// ==================== 项目筛选 ====================
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const noProjectsMsg = document.getElementById('noProjectsMsg');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        let visibleCount = 0;
        projectCards.forEach(card => {
            const categories = card.getAttribute('data-category').split(' ');
            if (filter === 'all' || categories.includes(filter)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        noProjectsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    });
});

// ==================== 音乐播放器 (支持本地文件/在线URL) ====================
const musicFab = document.getElementById('musicFab');
const musicPlayer = document.getElementById('musicPlayer');
const musicPlayerClose = document.getElementById('musicPlayerClose');
const audio = new Audio();

// ★★★★★ 播放列表配置 ★★★★★
// 您可以在此处修改歌曲信息，src 支持本地路径（如 'music/歌曲名.mp3'）或在线URL
const playlist = [
    { title: '清晨阳光', artist: '轻音乐', src: 'music/morning.mp3' },
    { title: '代码节奏', artist: '电子', src: 'music/code.mp3' },
    { title: '星空', artist: '钢琴曲', src: 'music/starry.mp3' }
];

let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let loopMode = 'none'; // 'none', 'one', 'all'

// UI元素
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingArtist = document.getElementById('nowPlayingArtist');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const progressBar = document.getElementById('musicProgressBar');
const progressFill = document.getElementById('musicProgressFill');
const progressThumb = document.getElementById('musicProgressThumb');
const btnPlayIcon = document.getElementById('btnPlayIcon');
const playlistContainer = document.getElementById('musicPlaylist');
const volumeSlider = document.getElementById('musicVolumeSlider');
const visualizerBars = document.querySelectorAll('.v-bar');

// 格式化时间
function formatTime(sec) {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 渲染播放列表
function renderPlaylist() {
    playlistContainer.innerHTML = '';
    playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentTrackIndex ? 'active' : ''}`;
        item.innerHTML = `<span>${track.title} - ${track.artist}</span>`;
        item.addEventListener('click', () => {
            currentTrackIndex = index;
            loadAndPlayTrack();
        });
        playlistContainer.appendChild(item);
    });
}

// 更新播放列表高亮
function updatePlaylistActive() {
    document.querySelectorAll('.playlist-item').forEach((item, idx) => {
        item.classList.toggle('active', idx === currentTrackIndex);
    });
}

// 加载指定索引的歌曲（不自动播放）
function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    audio.src = track.src;
    nowPlayingTitle.textContent = track.title;
    nowPlayingArtist.textContent = track.artist;
    // 重置进度显示
    currentTimeEl.textContent = '00:00';
    totalTimeEl.textContent = '00:00';
    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
    updatePlaylistActive();
}

// 加载并播放
function loadAndPlayTrack() {
    loadTrack(currentTrackIndex);
    audio.play().then(() => {
        isPlaying = true;
        updatePlayButton();
    }).catch(err => {
        console.warn('播放失败，请检查音频文件是否存在:', err);
        isPlaying = false;
        updatePlayButton();
    });
}

// 更新播放按钮图标
function updatePlayButton() {
    btnPlayIcon.textContent = isPlaying ? '⏸️' : '▶️';
}

// 播放/暂停
function togglePlay() {
    if (!audio.src) {
        // 若无音频源，尝试加载当前曲目
        loadTrack(currentTrackIndex);
    }
    if (audio.paused) {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
        }).catch(e => console.warn('无法播放:', e));
    } else {
        audio.pause();
        isPlaying = false;
        updatePlayButton();
    }
}

// 下一首
function playNext() {
    if (loopMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn(e));
        return;
    }
    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    }
    loadAndPlayTrack();
}

// 上一首
function playPrev() {
    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    }
    loadAndPlayTrack();
}

// 循环模式切换
function toggleLoop() {
    const modes = ['none', 'one', 'all'];
    const currentIdx = modes.indexOf(loopMode);
    loopMode = modes[(currentIdx + 1) % modes.length];
    const btnLoop = document.getElementById('btnLoop');
    btnLoop.textContent = loopMode === 'one' ? '🔂' : '🔁';
    // 重置audio的loop属性
    audio.loop = (loopMode === 'one');
}

// 进度条更新
audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isNaN(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressThumb.style.left = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }
});

// 元数据加载完成
audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
});

// 播放结束
audio.addEventListener('ended', () => {
    if (loopMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn(e));
    } else if (loopMode === 'all') {
        playNext();
    } else {
        isPlaying = false;
        updatePlayButton();
    }
});

// 进度条点击
progressBar.addEventListener('click', (e) => {
    if (!audio.duration || isNaN(audio.duration)) return;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

// 音量控制
volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
});
audio.volume = volumeSlider.value / 100;

// 可视化条动画
function animateVisualizer() {
    if (isPlaying) {
        visualizerBars.forEach(bar => {
            const h = Math.random() * 40 + 10;
            bar.style.height = `${h}px`;
        });
    } else {
        visualizerBars.forEach(bar => bar.style.height = '5px');
    }
    requestAnimationFrame(() => setTimeout(animateVisualizer, 200));
}
animateVisualizer();

// 按钮事件绑定
document.getElementById('btnPlay').addEventListener('click', togglePlay);
document.getElementById('btnNext').addEventListener('click', playNext);
document.getElementById('btnPrev').addEventListener('click', playPrev);
document.getElementById('btnShuffle').addEventListener('click', () => {
    isShuffle = !isShuffle;
    document.getElementById('btnShuffle').style.color = isShuffle ? 'var(--accent)' : '';
});
document.getElementById('btnLoop').addEventListener('click', toggleLoop);

// 播放器打开/关闭
musicFab.addEventListener('click', () => {
    musicPlayer.classList.toggle('open');
});
musicPlayerClose.addEventListener('click', () => {
    musicPlayer.classList.remove('open');
});

// 初始化播放器
renderPlaylist();
loadTrack(currentTrackIndex); // 仅加载，不自动播放

// ==================== 回到顶部 ====================
document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ==================== 联系表单 ====================
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('感谢您的留言！');
    e.target.reset();
});