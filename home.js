let storedData = {
    characters: [],
    sprites: [],
    recruits: []
};

// 修改DEBUG_MODE为可配置
let DEBUG_MODE = localStorage.getItem('debugMode') === 'true' || false; // 初始化从本地存储读取
let debugStatusElement = null;

// 在DOM加载后初始化调试开关
document.addEventListener('DOMContentLoaded', () => {
    const debugToggle = document.getElementById('debugToggle');
    debugToggle.checked = DEBUG_MODE;
    debugToggle.addEventListener('change', handleDebugToggle);
    updateDebugStatusDisplay();
});

function handleDebugToggle(e) {
    DEBUG_MODE = e.target.checked;
    localStorage.setItem('debugMode', DEBUG_MODE);
    updateDebugStatusDisplay();

    if (!DEBUG_MODE) {
        document.body.classList.add('no-animation');
        // 移除所有调试消息
        document.querySelectorAll('.status-message').forEach(msg => {
            msg.classList.add('hide');
            setTimeout(() => msg.remove(), 300);
        });
    } else {
        document.body.classList.remove('no-animation');
    }
}

function updateDebugStatusDisplay() {
    const debugContainer = document.querySelector('.debug-container') || createDebugContainer();

    if (DEBUG_MODE) {
        // 创建多个调试消息
        const messages = [
            'DEBUG 模式已启用',
            '当前会话ID: ' + Date.now(),
            '请关闭 DEBUG 模式'
        ];

        debugContainer.innerHTML = ''; // 清空旧内容
        messages.forEach(msg => {
            const element = document.createElement('div');
            element.className = 'debug-status';
            element.textContent = msg;
            debugContainer.appendChild(element);
        });

        console.warn('DEBUG 管理员模式已启用');
    } else {
        debugContainer.remove();
    }
}

function createDebugContainer() {
    const container = document.createElement('div');
    container.className = 'debug-container';
    container.style.cssText = `
        position: fixed;
        left: 20px;
        bottom: 20px;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        z-index: 10000;
    `;
    document.body.appendChild(container);
    return container;
}

// 修改showMessage函数
function showMessage(text, type = 'info') {
    if (!DEBUG_MODE && type === 'info') return; // 非调试模式不显示普通提示

    // ...原有代码保持不变...
    messageBox.style.animationDuration = DEBUG_MODE ? '0.4s' : '0s';
}

// 修改console.error劫持
console.error = function (...args) {
    if (!DEBUG_MODE) return originalConsoleError.apply(console, args);

    // 原有代码保持不变...
};

// 在初始化主题代码块后添加调试初始化
(function () {
    // 原有主题初始化代码...
    DEBUG_MODE = localStorage.getItem('debugMode') === 'true' || false;
})();
function logParseProcess(line, result) {
    if (DEBUG_MODE) console.log(`解析行: ${line} → `, result);
}

// 文件选择事件监听
document.getElementById('txtFile').addEventListener('change', function (e) {
    const fileName = this.files[0]?.name || '未选择文件';
    document.getElementById('fileName').textContent = fileName;
});

// 文件编辑器显示切换
document.getElementById('showEditorBtn').addEventListener('click', () => {
    const editor = document.getElementById('fileContentEditor');
    editor.classList.toggle('hidden');
});

// 文件处理主逻辑
function processFile() {
    const editorContent = document.getElementById('fileContentEditor').value;
    const file = document.getElementById('txtFile').files[0];

    if (editorContent) {
        processContent(editorContent);
    } else if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('fileContentEditor').value = e.target.result;
            processContent(e.target.result);
        };
        reader.readAsText(file);
    } else {
        showMessage('请选择文件或输入内容', 'error');
    }
}

// 数据解析核心逻辑
function parseData(text) {
    const result = { characters: [], sprites: [], recruits: [] };
    let validEntryCount = 0;
    const seenIDs = new Set();

    text.split('\n').forEach((line, lineNumber) => {
        try {
            line = line.trim();
            // 跳过空行和注释行
            if (!line || line.startsWith('#')) return;

            // 匹配以下格式：
            // 1. ID:名称 
            // 2. ID: 名称（带空格） 
            // 3. ID:"带引号名称"
            // 4. ID:0 "带数字前缀名称"
            const idMatch = line.match(/^(\w+)[:：]/);
            if (!idMatch) throw new Error(`格式错误：无法解析ID`);

            const rawID = idMatch[1].trim();
            let name = line.slice(idMatch[0].length).trim();

            // 移除尾部注释
            name = name.split(/#/)[0].trim();

            // 处理数字前缀
            const numberPrefix = name.match(/^(\d+)\s/);
            if (numberPrefix) {
                name = name.slice(numberPrefix[0].length).trim();
            }

            // 处理引号包裹
            const quotedName = name.match(/^"(.*)"$/);
            if (quotedName) {
                name = quotedName[1];
            }

            // 有效性校验
            if (!rawID) throw new Error("缺少角色ID");
            if (!name) throw new Error("角色名称不能为空");
            if (seenIDs.has(rawID)) throw new Error(`重复的角色ID: ${rawID}`);

            // 提取国家标签（取ID前缀）
            const tag = rawID.split('_')[0];
            if (!tag) throw new Error("无效的ID格式");

            // 生成角色定义代码
            const characterCode = [
                `\t# ${name}`,
                `\t${rawID} = {`,
                `\t\tname = "${rawID}"`,
                `\t\tportraits = {`,
                `\t\t\tcivilian = {`,
                `\t\t\t\tlarge = "GFX_${rawID}"`,
                `\t\t\t\tsmall = "GFX_${rawID}_small"`,
                `\t\t\t}`,
                `\t\t\tarmy = {`,
                `\t\t\t\tlarge = "GFX_${rawID}"`,
                `\t\t\t\tsmall = "GFX_${rawID}_small"`,
                `\t\t\t}`,
                `\t\t}`,
                `\t}`
            ].join('\n');

            // 生成图片注册代码
            const spriteCode = [
                `\t# ${name}`,
                `\tspriteType = {`,
                `\t\tname = "GFX_${rawID}"`,
                `\t\ttexturefile = "gfx/leaders/${tag}/${rawID}.dds"`,
                `\t\tlegacy_lazy_load = no`,
                `\t}`,
                `\tspriteType = {`,
                `\t\tname = "GFX_${rawID}_small"`,
                `\t\ttexturefile = "gfx/interface/ideas/${tag}/${rawID}.dds"`,
                `\t\tlegacy_lazy_load = no`,
                `\t}`
            ].join('\n');

            // 生成招募代码
            const recruitCode = `recruit_character = ${rawID} # ${name}`;

            // 存入结果
            result.characters.push(characterCode);
            result.sprites.push(spriteCode);
            result.recruits.push(recruitCode);

            seenIDs.add(rawID);
            validEntryCount++;
        } catch (error) {
            console.warn(`第 ${lineNumber + 1} 行处理失败: ${error.message}`, line);
        }
    });

    // 空数据保护
    if (validEntryCount === 0) {
        throw new Error("没有找到有效数据，请检查文件格式");
    }

    return result;
}

// 数据存储管理
function updateStoredData(newData) {
    const append = document.getElementById('appendMode').checked;

    if (!append) {
        storedData = {
            characters: [],
            sprites: [],
            recruits: []
        };
    }

    storedData.characters.push(...newData.characters);
    storedData.sprites.push(...newData.sprites);
    storedData.recruits.push(...newData.recruits);
}

// 输出更新
function updateOutputs() {
    document.getElementById('output1').value = `characters = {\n${storedData.characters.join('\n')}\n}`;
    document.getElementById('output2').value = `spriteTypes = {\n${storedData.sprites.join('\n')}\n}`;
    document.getElementById('output3').value = storedData.recruits.join('\n');
}

// 图形化编辑器功能模块
document.getElementById('openModalBtn').addEventListener('click', () => {
    const modal = document.getElementById('addCharacterModal');
    modal.classList.add('show');
    loadExistingCharacters();
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('addCharacterModal').classList.remove('show');
});

document.getElementById('addRowBtn').addEventListener('click', (e) => {
    e.preventDefault();
    addFormRow();
});

document.getElementById('saveChangesBtn').addEventListener('click', (e) => {
    e.preventDefault();
    saveCharacterEdits();
});

// 动态添加表单行
function addFormRow(data = { id: '', name: '' }) {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.innerHTML = `
        <div class="input-group">
            <input type="text" class="character-id" 
                   placeholder="角色ID (例: GER_helmut)" 
                   value="${data.id}"
                   data-validate="^\\w+$">
        </div>
        <div class="input-group">
            <input type="text" class="character-name"
                   placeholder="角色名称 (例: 赫尔穆特)"
                   value="${data.name}"
                   data-validate=".+">
        </div>
    `;

    // 添加实时验证
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            validateInput(this);
        });
    });

    document.getElementById('formContainer').appendChild(row);
}

function validateInput(input) {
    const regex = new RegExp(input.dataset.validate);
    const isValid = regex.test(input.value.trim());
    input.parentElement.classList.toggle('invalid', !isValid);

    if (!isValid) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', 'error-message');
    } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
    }
}

// 加载现有数据到编辑器
function loadExistingCharacters() {
    const content = document.getElementById('fileContentEditor').value;
    const lines = content.split('\n');
    const formContainer = document.getElementById('formContainer');

    formContainer.innerHTML = '';

    lines.forEach(line => {
        try {
            line = line.trim();
            // 跳过空行和注释行
            if (!line || line.startsWith('#')) return;

            // 分割注释部分
            let [mainPart] = line.split(/#/);
            mainPart = mainPart.trim();
            if (!mainPart) return;

            // 提取ID部分
            const idMatch = mainPart.match(/^(\w+)[:：]/);
            if (!idMatch) return;

            const rawID = idMatch[1].trim();
            let name = mainPart.slice(idMatch[0].length).trim();

            // 处理数字前缀
            const numberPrefix = name.match(/^(\d+)\s/);
            if (numberPrefix) {
                name = name.slice(numberPrefix[0].length).trim();
            }

            // 处理引号包裹
            const quotedName = name.match(/^"(.*)"$/);
            if (quotedName) {
                name = quotedName[1];
            }

            // 添加表单行（显示原始ID和纯净名称）
            addFormRow({
                id: rawID,
                name: name
            });

        } catch (error) {
            console.warn('解析行失败:', line, error);
        }
    });
}

// 保存图形化编辑结果
function saveCharacterEdits() {
    try {
        const rows = document.querySelectorAll('.form-row'); // 获取所有编辑行
        let newContent = '';
        let validEntries = 0;
        const seenIDs = new Set();

        // =================================================================
        // 核心遍历逻辑（对应截图中的列表行）
        rows.forEach((row, index) => {
            // 获取角色ID输入（对应截图左侧白框）
            const idInput = row.querySelector('.character-id');
            // 获取角色名称输入（对应截图右侧白框）
            const nameInput = row.querySelector('.character-name');

            // 空值校验
            if (!idInput || !nameInput) return;
            const rawID = idInput.value.trim();
            let rawName = nameInput.value.trim();

            // 跳过完全空行（如图中PLP_Rimuru_Tempest行）
            if (!rawID && !rawName) return;

            // 格式校验
            if (!/^\w+$/.test(rawID)) {
                showMessage(`第${index + 1}行ID格式错误: ${rawID}`, 'error');
                return;
            }

            // 重复ID检查（如图中CHI_chiang_kaishek重复情况）
            if (seenIDs.has(rawID)) {
                showMessage(`重复ID: ${rawID}`, 'warning');
                return;
            }
            seenIDs.add(rawID);

            // 处理名称中的特殊字符（如图中0和示例文本）
            let formattedName = rawName;
            if (formattedName.includes(' ') || formattedName.includes("'")) {
                formattedName = `"${formattedName.replace(/"/g, '')}"`; // 包裹引号
            }

            // 构建最终行（匹配截图中的ID:名称格式）
            newContent += `${rawID}: ${formattedName}\n`;
            validEntries++;
        });
        // =================================================================

        // 空内容检查（防止生成空文件）
        if (validEntries === 0) {
            throw new Error('没有有效数据可保存');
        }

        // 更新文件编辑器（对应主界面）
        document.getElementById('fileContentEditor').value = newContent;
        processContent(newContent);

        showMessage(`成功保存 ${validEntries} 个角色`, 'success');
        document.getElementById('addCharacterModal').classList.remove('show');

    } catch (error) {
        showMessage(`保存失败: ${error.message}`, 'error');
    }
}

function sanitizeName(name) {
    if (name.includes(' ') || name.includes("'")) {
        return `"${name.replace(/"/g, '')}"`; // 移除已有引号后重新包裹
    }
    return name;
}

// 打开模态框时
document.getElementById('openModalBtn').addEventListener('click', () => {
    const modal = document.getElementById('addCharacterModal');
    modal.classList.add('show');
    // 强制重绘触发动画
    void modal.offsetWidth;
    loadExistingCharacters();
});

// 关闭模态框时
document.querySelector('.close').addEventListener('click', () => {
    const modal = document.getElementById('addCharacterModal');
    modal.classList.add('closing');
    
    // 等待动画完成
    setTimeout(() => {
        modal.classList.remove('show', 'closing');
    }, 300);
});

// 点击模态框外部关闭
document.getElementById('addCharacterModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('closing');
        setTimeout(() => {
            this.classList.remove('show', 'closing');
        }, 300);
    }
});

// 处理内容函数
function processContent(content) {
    try {
        const parsedData = parseData(content);
        updateStoredData(parsedData);
        updateOutputs();
        showMessage('数据生成成功!', 'success');
    } catch (error) {
        console.error('处理过程中发生错误:', error);
        showMessage(`处理失败: ${error.message}`, 'error');
    }
}

// 状态提示系统
function showMessage(text, type = 'info') {
    const container = document.querySelector('.status-container') || createMessageContainer();
    const messageBox = document.createElement('div');

    // 错误消息自动截断处理
    if (typeof text !== 'string') {
        try {
            text = JSON.stringify(text);
        } catch {
            text = String(text);
        }
    }

    messageBox.className = `status-message status-${type}`;
    messageBox.innerHTML = `
        <div class="message-content">${text}</div>
        ${type === 'error' ? '<div class="error-stack"></div>' : ''}
    `;

    container.insertBefore(messageBox, container.firstChild);

    // 自动滚动到最新消息
    requestAnimationFrame(() => {
        messageBox.classList.add('show');
        container.scrollTo(0, 0);
    });

    // 自动隐藏
    const dismissTime = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        messageBox.classList.remove('show');
        setTimeout(() => messageBox.remove(), 300);
    }, dismissTime);
}

// 添加全局错误监听
window.addEventListener('error', function (event) {
    const errorMsg = [
        `错误: ${event.message}`,
        `文件: ${event.filename}`,
        `行号: ${event.lineno}:${event.colno}`
    ].join('\n');

    showMessage(errorMsg, 'error');

    // 保留原始控制台输出
    return false;
});

// 劫持console.error
const originalConsoleError = console.error;
console.error = function (...args) {
    const errorMsg = args.map(arg => {
        if (arg instanceof Error) {
            return `错误: ${arg.message}\n堆栈: ${arg.stack}`;
        }
        return String(arg);
    }).join('\n');

    showMessage(errorMsg, 'error');
    originalConsoleError.apply(console, args);
};

function createMessageContainer() {
    const container = document.createElement('div');
    container.className = 'status-container';
    document.body.appendChild(container);
    return container;
}

// 剪贴板功能
document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', async () => {
        const targetId = button.dataset.target;
        const textarea = document.getElementById(targetId);

        try {
            await navigator.clipboard.writeText(textarea.value);
            showMessage('内容已复制到剪贴板!', 'success');
            button.classList.add('copied-feedback');
            setTimeout(() => button.classList.remove('copied-feedback'), 1000);
        } catch (err) {
            showMessage('复制失败，请手动选择文本复制', 'error');
        }
    });
});

// 主题切换功能
themeToggle.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.querySelector('.theme-label').textContent = theme === 'dark' ? '夜间模式' : '白天模式';

    // 新增主题切换提示
    const themeName = theme === 'dark' ? '夜间模式' : '白天模式';
    showMessage(`已切换至 ${themeName}`, 'success'); // 使用success类型确保始终显示
});

// 初始化工具提示
document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', createTooltip);
    el.addEventListener('mouseleave', removeTooltip);
});

function createTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = this.dataset.tooltip;

    const rect = this.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 30}px`;

    document.body.appendChild(tooltip);
    this._tooltip = tooltip;
}

function removeTooltip() {
    if (this._tooltip) {
        this._tooltip.remove();
        delete this._tooltip;
    }
}