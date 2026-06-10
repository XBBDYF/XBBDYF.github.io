const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [];
const particleCount = 80;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
class Particle {
    constructor() { this.reset(); }
    reset() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = (Math.random() - 0.5) * 0.8; this.vy = (Math.random() - 0.5) * 0.8; this.radius = Math.random() * 2 + 1; }
    update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > width) this.vx *= -1; if (this.y < 0 || this.y > height) this.vy *= -1; }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0ea5e9'; ctx.globalAlpha = 0.5; ctx.fill(); }
}
function initParticles() { particles = Array.from({ length: particleCount }, () => new Particle()); }
function connectParticles() {
    const maxDistance = 120;
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++) { const dx = particles[i].x-particles[j].x, dy = particles[i].y-particles[j].y, dist = Math.hypot(dx,dy); if(dist<maxDistance){ ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0ea5e9'; ctx.globalAlpha = 0.15*(1-dist/maxDistance); ctx.lineWidth=0.8; ctx.stroke(); } }
    ctx.globalAlpha=1;
}
function animateParticles() { ctx.clearRect(0,0,width,height); particles.forEach(p=>{ p.update(); p.draw(); }); connectParticles(); requestAnimationFrame(animateParticles); }
resizeCanvas(); initParticles(); animateParticles();