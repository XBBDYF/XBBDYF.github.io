// js/code-block-enhancer.js
(function() {
    // 辅助函数：转义 HTML 特殊字符
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // 增强所有代码块：行号、语言标签、复制按钮
    function enhanceCodeBlocks(container = document) {
        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            // 避免重复处理
            if (block.parentElement?.parentElement?.classList?.contains('code-block-wrapper')) return;

            const pre = block.parentElement;
            const originalCode = block.textContent;
            const lines = originalCode.split(/\r?\n/);
            // 去除末尾多余的空行（保留行号一致）
            if (lines.length > 1 && lines[lines.length-1] === '') lines.pop();
            const lineCount = lines.length;

            // 获取语言
            let lang = 'code';
            const classList = block.className.split(' ');
            for (let cls of classList) {
                if (cls.startsWith('language-')) {
                    lang = cls.replace('language-', '');
                    break;
                }
            }

            // 创建包装器
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';

            // 头部：语言标签 + 复制按钮
            const header = document.createElement('div');
            header.className = 'code-block-header';
            const langSpan = document.createElement('span');
            langSpan.className = 'code-lang';
            langSpan.textContent = lang.toUpperCase();
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(originalCode);
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('复制失败', err);
                }
            });
            header.appendChild(langSpan);
            header.appendChild(copyBtn);

            // 内容区：行号 + 代码行（按行拆分）
            const linesContainer = document.createElement('div');
            linesContainer.className = 'code-block-lines';

            const lineNumbersDiv = document.createElement('div');
            lineNumbersDiv.className = 'line-numbers';
            const codeLinesDiv = document.createElement('div');
            codeLinesDiv.className = 'code-lines';

            // 高亮每一行（使用 highlight.js 对完整代码已经高亮，但这里需要保留高亮标签）
            // 为了保持高亮，我们不能简单拆分行，因为高亮标签可能跨行。所以这里取巧：
            // 获取高亮后的 HTML，然后按行拆分（保留标签）
            const highlightedHtml = block.innerHTML; // 已经高亮
            const lineFragments = splitHighlightedHtmlByLines(highlightedHtml, lines.length);

            for (let i = 0; i < lineCount; i++) {
                const lineNumDiv = document.createElement('div');
                lineNumDiv.textContent = i + 1;
                lineNumbersDiv.appendChild(lineNumDiv);

                const codeLineDiv = document.createElement('div');
                // 填充高亮后的行内容
                const lineContent = lineFragments[i] || '';
                codeLineDiv.innerHTML = lineContent === '' ? ' ' : lineContent;
                codeLinesDiv.appendChild(codeLineDiv);
            }

            linesContainer.appendChild(lineNumbersDiv);
            linesContainer.appendChild(codeLinesDiv);

            wrapper.appendChild(header);
            wrapper.appendChild(linesContainer);

            // 替换原 pre
            pre.parentNode.replaceChild(wrapper, pre);
        });
    }

    // 辅助函数：将高亮后的 HTML 按行拆分（保留标签结构）
    function splitHighlightedHtmlByLines(html, lineCount) {
        // 创建临时 div 来解析 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // 获取所有文本行（保留原始文本内容）
        const linesText = tempDiv.innerText.split(/\r?\n/);
        if (linesText.length > lineCount) linesText.pop(); // 去除末尾空行

        // 我们需要逐字符遍历原始 HTML，根据文本换行符来分割 HTML 标签
        // 简单高效的方法：使用正则匹配标签和文本，构建行数组
        const fragments = new Array(lineCount).fill('');
        let currentLine = 0;
        let isTag = false;
        let buffer = '';
        let i = 0;
        const chars = html.split('');
        
        while (i < chars.length && currentLine < lineCount) {
            const ch = chars[i];
            if (ch === '<') {
                // 进入标签
                isTag = true;
                buffer += ch;
            } else if (ch === '>') {
                buffer += ch;
                if (isTag) {
                    // 标签结束，将整个标签加入当前行
                    fragments[currentLine] += buffer;
                    buffer = '';
                    isTag = false;
                }
            } else {
                if (isTag) {
                    // 标签内字符
                    buffer += ch;
                } else {
                    // 普通文本字符
                    if (ch === '\n') {
                        // 换行：完成当前行，转到下一行
                        currentLine++;
                        buffer = '';
                    } else {
                        buffer += ch;
                    }
                    // 如果当前行还有未刷新的文本，并且遇到换行或者结束
                    if (buffer && (ch !== '\n' || i === chars.length-1)) {
                        fragments[currentLine] += buffer;
                        buffer = '';
                    }
                }
            }
            i++;
        }
        // 如果最后一行没有内容，补空格
        for (let i = 0; i < lineCount; i++) {
            if (!fragments[i]) fragments[i] = ' ';
        }
        return fragments;
    }

    window.enhanceCodeBlocks = enhanceCodeBlocks;
})();