// DOM 元素
const filterButtons = document.querySelectorAll('.filter-btn');
const projectsGrid = document.getElementById('projectsGrid');
const noProjectsMsg = document.getElementById('noProjectsMsg');
let allProjects = [];

// 等待动画相关
let loadingIndicator = null;
const loadingHTML = '<div class="loading-indicator"><div class="loading-spinner"></div><span>筛选项目中...</span></div>';

// 工具函数：添加等待动画
function showLoading() {
    if (loadingIndicator) return;
    loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'projects-loading';
    loadingIndicator.innerHTML = loadingHTML;
    if (projectsGrid.nextSibling) {
        projectsGrid.parentNode.insertBefore(loadingIndicator, projectsGrid.nextSibling);
    } else {
        projectsGrid.parentNode.appendChild(loadingIndicator);
    }
    projectsGrid.style.opacity = '0.3';
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.remove();
        loadingIndicator = null;
    }
    projectsGrid.style.opacity = '1';
}

// 工具函数：延迟执行（用于模拟动画效果）
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 核心筛选函数
function filterProjects(category) {
    showLoading();
    
    // 使用 setTimeout 让加载动画有机会显示
    setTimeout(() => {
        let hasVisibleProjects = false;
        
        allProjects.forEach(project => {
            const projectCategories = project.dataset.category.split(' ');
            const shouldShow = category === 'all' || projectCategories.includes(category);
            
            if (shouldShow) {
                project.style.display = 'block';
                hasVisibleProjects = true;
                // 添加入场动画效果
                project.style.animation = 'none';
                project.offsetHeight; // 强制重绘
                project.style.animation = 'fadeInUp 0.5s ease forwards';
            } else {
                project.style.display = 'none';
            }
        });
        
        // 显示或隐藏"无结果"提示
        if (noProjectsMsg) {
            noProjectsMsg.style.display = hasVisibleProjects ? 'none' : 'block';
            if (hasVisibleProjects) {
                noProjectsMsg.style.animation = 'none';
            } else {
                noProjectsMsg.style.animation = 'fadeInUp 0.5s ease forwards';
            }
        }
        
        hideLoading();
    }, 150);
}

// 初始化所有项目并绑定筛选事件
function initProjectFilters() {
    if (!projectsGrid) return;
    
    // 获取所有项目卡片，如果初始状态是隐藏的，先显示
    allProjects = Array.from(document.querySelectorAll('.project-card'));
    allProjects.forEach(project => {
        project.style.display = 'block';
        // 为每个项目添加入场动画
        project.style.animation = 'fadeInUp 0.6s ease forwards';
        project.style.opacity = '0';
        project.style.animationFillMode = 'forwards';
    });
    
    // 绑定筛选按钮事件
    if (filterButtons.length) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 更新按钮激活状态
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 获取筛选类别
                const filterValue = btn.dataset.filter;
                filterProjects(filterValue);
            });
        });
    }
    
    // 初始时显示所有项目
    filterProjects('all');
}

// 添加项目卡片的入场动画（交错效果）
function addStaggeredAnimation() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
    });
}

// 监听 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    initProjectFilters();
    addStaggeredAnimation();
});

// 添加一些额外的动画样式（如果尚未定义）
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .projects-loading {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
    }
    
    .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--tag-bg);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .project-card {
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        opacity: 0;
    }
    
    .project-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);