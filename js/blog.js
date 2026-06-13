// js/blog.js - 完整版，自动加载文章列表
(function () {
    const blogSection = document.getElementById('blog');
    if (!blogSection) {
        console.error('❌ 找不到 #blog 元素，请确认 HTML 中存在该 section');
        return;
    }

    let blogContainer = document.getElementById('blogContainer');
    if (!blogContainer) {
        blogContainer = document.createElement('div');
        blogContainer.id = 'blogContainer';
        const containerDiv = blogSection.querySelector('.section-container');
        if (containerDiv) containerDiv.appendChild(blogContainer);
        else blogSection.appendChild(blogContainer);
    }

    // 加载文章列表
    async function loadArticleList() {
        try {
            console.log('正在加载文章列表...');
            const res = await fetch('articles/list.json');
            if (!res.ok) throw new Error(`HTTP ${res.status} - 文件不存在`);
            const articles = await res.json();
            console.log('文章列表加载成功', articles);
            renderArticleList(articles);
        } catch (error) {
            console.error('加载文章列表失败:', error);
            blogContainer.innerHTML = `<p style="color: red; text-align:center;">❌ 文章列表加载失败：${error.message}<br>请确保 articles/list.json 存在且路径正确。</p>`;
        }
    }

    function renderArticleList(articles) {
        if (!articles || articles.length === 0) {
            blogContainer.innerHTML = '<p style="text-align:center;">暂无文章，请稍后访问。</p>';
            return;
        }

        let html = `<div class="articles-grid">`;
        articles.forEach(article => {
            const coverUrl = article.cover || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23ddd\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'%23999\'%3E📷%3C/text%3E%3C/svg%3E';
            html += `
                <div class="article-card">
                    <div class="article-cover" style="background-image: url('${coverUrl}');"></div>
                    <div class="article-info">
                        <h3>${escapeHtml(article.title)}</h3>
                        <div class="article-meta">📅 ${article.date}</div>
                        <p>${escapeHtml(article.summary)}</p>
                        <button class="btn-readmore" data-id="${article.id}">阅读全文 →</button>
                    </div>
                </div>
            `;
        });
        html += `</div><button class="btn-back-to-list" style="display:none;">← 返回文章列表</button>`;
        blogContainer.innerHTML = html;

        // 绑定阅读全文事件
        document.querySelectorAll('.btn-readmore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                loadAndRenderMarkdown(id);
            });
        });

        // 返回列表按钮（初始隐藏，详情页显示）
        const backBtn = blogContainer.querySelector('.btn-back-to-list');
        if (backBtn) backBtn.style.display = 'none';
    }

    async function loadAndRenderMarkdown(articleId) {
        try {
            console.log(`正在加载文章 ${articleId}.md ...`);
            const res = await fetch(`articles/${articleId}.md`);
            if (!res.ok) throw new Error(`HTTP ${res.status} - 文件不存在`);
            const mdText = await res.text();
            console.log(`文章 ${articleId}.md 加载成功，长度 ${mdText.length} 字符`);

            let htmlContent;
            if (typeof marked !== 'undefined') {
                // marked 4.x+ 是异步的
                htmlContent = await marked.parse(mdText);
            } else {
                throw new Error('marked 库未加载，请检查脚本顺序');
            }

            blogContainer.innerHTML = `
                <div class="article-detail">
                    <div class="article-detail-content">${htmlContent}</div>
                    <button class="btn-back-to-list-detail">← 返回文章列表</button>
                </div>
            `;

            const backBtn = blogContainer.querySelector('.btn-back-to-list-detail');
            backBtn.addEventListener('click', () => loadArticleList());

            // 代码高亮（如果 hljs 已加载）
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('.article-detail-content pre code').forEach(block => {
                    hljs.highlightElement(block);
                });
            }

            window.scrollTo({ top: blogSection.offsetTop - 80, behavior: 'smooth' });
        } catch (error) {
            console.error(`加载文章 ${articleId} 失败:`, error);
            blogContainer.innerHTML = `
                <div class="article-detail">
                    <p style="color: red;">❌ 文章加载失败：${error.message}</p>
                    <button class="btn-back-to-list-detail">← 返回文章列表</button>
                </div>
            `;
            const backBtn = blogContainer.querySelector('.btn-back-to-list-detail');
            backBtn.addEventListener('click', () => loadArticleList());
        }
        // 高亮代码
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('.article-detail-content pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
        // 增强代码块（添加行号、复制按钮等）
        if (typeof enhanceCodeBlocks !== 'undefined') {
            enhanceCodeBlocks(document.querySelector('.article-detail-content'));
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // 页面加载完成后自动加载文章列表
    document.addEventListener('DOMContentLoaded', () => {
        loadArticleList();
    });

    // 导航点击时如果容器为空或不是列表视图，重新加载（防止重复加载）
    const blogNav = document.getElementById('blogNavLink');
    if (blogNav) {
        blogNav.addEventListener('click', (e) => {
            if (!blogContainer.querySelector('.articles-grid')) {
                loadArticleList();
            }
        });
    }

    // 如果页面直接通过 hash 访问，同样加载
    if (window.location.hash === '#blog') {
        // 等待 DOM 准备就绪
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadArticleList);
        } else {
            loadArticleList();
        }
    }
})();