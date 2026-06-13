// js/blog.js

let currentArticleId = null;
const blogSection = document.getElementById('blog');
const blogContainer = document.getElementById('blogContainer');  // 使用现有容器

// 加载文章列表
async function loadArticleList() {
    const res = await fetch('articles/list.json');
    const articles = await res.json();
    renderArticleList(articles);
}

// 渲染卡片列表
function renderArticleList(articles) {
    let html = `<div class="articles-grid">`;
    articles.forEach(article => {
        html += `
            <div class="article-card" data-id="${article.id}">
                <div class="article-cover" style="background-image: url('${article.cover || 'img/default-cover.jpg'}');"></div>
                <div class="article-info">
                    <h3>${article.title}</h3>
                    <div class="article-meta">📅 ${article.date}</div>
                    <p>${article.summary}</p>
                    <button class="btn-readmore" data-id="${article.id}">阅读全文 →</button>
                </div>
            </div>
        `;
    });
    html += `</div><button class="btn-back-to-list" style="display:none;">← 返回文章列表</button>`;
    blogContainer.innerHTML = html;

    // 绑定阅读全文按钮事件
    document.querySelectorAll('.btn-readmore').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            loadAndRenderMarkdown(id);
        });
    });

    // 返回列表按钮事件
    const backBtn = blogContainer.querySelector('.btn-back-to-list');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            renderArticleList(articles);
            backBtn.style.display = 'none';
            window.scrollTo({ top: blogSection.offsetTop - 80, behavior: 'smooth' });
        });
    }
}

// 加载并渲染 Markdown
async function loadAndRenderMarkdown(articleId) {
    const res = await fetch(`articles/${articleId}.md`);
    const mdText = await res.text();
    
    // 使用 marked.js 解析
    const htmlContent = marked.parse(mdText);
    
    // 显示文章详情视图
    blogContainer.innerHTML = `
        <div class="article-detail">
            <div class="article-detail-content">${htmlContent}</div>
            <button class="btn-back-to-list-detail">← 返回文章列表</button>
        </div>
    `;
    
    // 重新绑定返回事件
    const backBtn = blogContainer.querySelector('.btn-back-to-list-detail');
    backBtn.addEventListener('click', () => {
        loadArticleList(); // 重新加载列表
    });
    
    // 高亮代码
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('.article-detail-content pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    window.scrollTo({ top: blogSection.offsetTop - 80, behavior: 'smooth' });
}

// 监听导航点击，初次加载文章列表
const blogNavLink = document.getElementById('blogNavLink');
if (blogNavLink) {
    blogNavLink.addEventListener('click', (e) => {
        if (blogContainer.children.length === 0) {
            loadArticleList();
        }
    });
}

// 页面直接访问 #blog 时也加载
if (window.location.hash === '#blog') {
    loadArticleList();
}