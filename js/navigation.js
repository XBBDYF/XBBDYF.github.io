const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('navLinks');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 50);
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    scrollProgress.style.width = `${Math.min((scrollY / totalHeight) * 100, 100)}%`;
    backToTop.classList.toggle('visible', scrollY > 600);
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if(scrollY >= sectionTop && scrollY < sectionTop + sectionHeight){
            navLinks.forEach(link => { link.classList.remove('active'); if(link.getAttribute('href') === `#${section.id}`) link.classList.add('active'); });
        }
    });
});
hamburger?.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinksContainer.classList.toggle('active'); });
navLinks.forEach(link => link.addEventListener('click', () => { hamburger.classList.remove('active'); navLinksContainer.classList.remove('active'); }));
const getCurrentTheme = () => localStorage.getItem('theme') || 'light';
const applyTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme); themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙'; localStorage.setItem('theme', theme); };
applyTheme(getCurrentTheme());
themeToggle.addEventListener('click', () => { const current = document.documentElement.getAttribute('data-theme'); applyTheme(current === 'dark' ? 'light' : 'dark'); });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));