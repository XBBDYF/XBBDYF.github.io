const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            const el = entry.target;
            const target = +el.getAttribute('data-count');
            let count = 0;
            const increment = target / 40;
            const timer = setInterval(() => {
                count += increment;
                if(count >= target){ el.textContent = target + (target > 10 ? '+' : ''); clearInterval(timer); }
                else el.textContent = Math.floor(count) + '+';
            }, 30);
            statsObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });
statNumbers.forEach(num => statsObserver.observe(num));