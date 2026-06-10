// 全局变量
let currentChatId = null;
let chatHistory = {};
let settings = {
    darkMode: false,
    thinkMode: false,
    defaultModel: 'deepseek-r1:8b'
};
let uploadedImages = []; // 存储上传的图片数据
let uploadedTextFiles = []; // 存储上传的文本文件数据
let currentAbortController = null; // 用于中止请求

// 支持的文件类型和对应的图标
const FILE_TYPES = {
    'txt': { icon: 'fas fa-file-alt', type: 'txt', color: 'file-type-txt' },
    'pdf': { icon: 'fas fa-file-pdf', type: 'pdf', color: 'file-type-pdf' },
    'doc': { icon: 'fas fa-file-word', type: 'doc', color: 'file-type-doc' },
    'docx': { icon: 'fas fa-file-word', type: 'docx', color: 'file-type-docx' },
    'md': { icon: 'fas fa-markdown', type: 'md', color: 'file-type-md' },
    'csv': { icon: 'fas fa-file-csv', type: 'csv', color: 'file-type-csv' },
    'json': { icon: 'fas fa-file-code', type: 'json', color: 'file-type-json' },
    'xml': { icon: 'fas fa-file-code', type: 'xml', color: 'file-type-xml' },
    'html': { icon: 'fas fa-file-code', type: 'html', color: 'file-type-html' }
};

// 支持图片的模型列表
const IMAGE_SUPPORTED_MODELS = ['qwen3-vl:4b'];

// DOM 元素
const newChatBtn = document.getElementById('new-chat-btn');
const historyList = document.getElementById('history-list');
const modelSelect = document.getElementById('model-select');
const modelInfo = document.getElementById('model-info');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.querySelector('.close-modal');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const thinkModeToggle = document.getElementById('think-mode-toggle');
const defaultModelSelect = document.getElementById('default-model');
const saveSettingsBtn = document.getElementById('save-settings');
const chatTitle = document.getElementById('chat-title');
const deleteCurrentChatBtn = document.getElementById('delete-current-chat');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const stopBtn = document.getElementById('stop-btn'); // 停止按钮

// 文件上传相关元素
const fileUploadArea = document.getElementById('file-upload-area');
const toggleFileBtn = document.getElementById('toggle-file-btn');
const imageUpload = document.getElementById('image-upload');
const textUpload = document.getElementById('text-upload');
const uploadedImagesContainer = document.getElementById('uploaded-images');
const uploadedTextFilesContainer = document.getElementById('uploaded-text-files');
const clearImagesBtn = document.getElementById('clear-images');
const clearTextFilesBtn = document.getElementById('clear-text-files');
const filePreview = document.getElementById('file-preview');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    applySettings();
    initEventListeners();
    renderHistoryList();
    
    if (Object.keys(chatHistory).length > 0) {
        const firstChatId = Object.keys(chatHistory)[0];
        loadChat(firstChatId);
    } else {
        createNewChat();
    }
    
    // 初始化模型支持状态
    updateModelSupport();
});

// 加载本地存储
function loadFromLocalStorage() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
    }

    const savedSettings = localStorage.getItem('aiChatSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    localStorage.setItem('aiChatSettings', JSON.stringify(settings));
}

// 应用设置
function applySettings() {
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }

    thinkModeToggle.checked = settings.thinkMode;
    defaultModelSelect.value = settings.defaultModel;
    modelSelect.value = settings.defaultModel;
}

// 初始化事件监听
function initEventListeners() {
    newChatBtn.addEventListener('click', createNewChat);
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
    closeModal.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    saveSettingsBtn.addEventListener('click', () => {
        settings.darkMode = darkModeToggle.checked;
        settings.thinkMode = thinkModeToggle.checked;
        settings.defaultModel = defaultModelSelect.value;
        applySettings();
        saveToLocalStorage();
        settingsModal.style.display = 'none';
    });
    deleteCurrentChatBtn.addEventListener('click', () => {
        if (currentChatId && confirm('确定要删除当前聊天记录吗？')) {
            delete chatHistory[currentChatId];
            saveToLocalStorage();
            renderHistoryList();
            createNewChat();
        }
    });
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 停止按钮点击事件
    stopBtn.addEventListener('click', stopGeneration);
    
    chatMessages.addEventListener('click', (e) => {
        const thinkingHeader = e.target.closest('.thinking-header');
        if (thinkingHeader) {
            const thinkingContainer = thinkingHeader.closest('.thinking-container');
            const thinkingContent = thinkingContainer.querySelector('.thinking-content');
            const thinkingToggle = thinkingContainer.querySelector('.thinking-toggle');
            thinkingContent.classList.toggle('collapsed');
            thinkingToggle.classList.toggle('collapsed');
        }
        
        // 图片点击放大
        const messageImage = e.target.closest('.message-image');
        if (messageImage) {
            showImageModal(messageImage.querySelector('img').src);
        }
    });

    // 文件上传相关事件
    toggleFileBtn.addEventListener('click', toggleFileUpload);
    imageUpload.addEventListener('change', handleImageUpload);
    textUpload.addEventListener('change', handleTextFileUpload);
    clearImagesBtn.addEventListener('click', clearUploadedImages);
    clearTextFilesBtn.addEventListener('click', clearUploadedTextFiles);
    
    // 模型选择变化时更新支持状态
    modelSelect.addEventListener('change', updateModelSupport);
}

// 停止生成函数
function stopGeneration() {
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
        
        // 更新UI
        stopBtn.style.display = 'none';
        sendBtn.style.display = 'flex';
        
        // 在最后一条消息中添加停止提示
        const lastMessage = chatMessages.querySelector('.message.assistant-message:last-child');
        if (lastMessage) {
            const stoppedDiv = document.createElement('div');
            stoppedDiv.className = 'stopped-message';
            stoppedDiv.textContent = '用户已停止生成回复';
            lastMessage.appendChild(stoppedDiv);
        }
    }
}

// 切换文件上传区域显示
function toggleFileUpload() {
    const isVisible = fileUploadArea.style.display !== 'none';
    fileUploadArea.style.display = isVisible ? 'none' : 'block';
    updateModelSupport();
}

// 处理图片上传
function handleImageUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            continue;
        }

        // 检查文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                name: file.name,
                data: e.target.result, // Base64数据
                type: file.type,
                size: file.size
            };
            uploadedImages.push(imageData);
            renderUploadedImages();
            updateFilePreview();
        };
        reader.readAsDataURL(file);
    }
    
    // 清空input以便再次选择相同文件
    event.target.value = '';
}

// 处理文本文件上传
async function handleTextFileUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // 检查文件类型
        if (!FILE_TYPES[fileExtension]) {
            alert(`不支持的文件类型: ${fileExtension}`);
            continue;
        }

        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB');
            continue;
        }

        try {
            const fileContent = await readFileContent(file, fileExtension);
            const textFileData = {
                name: file.name,
                extension: fileExtension,
                content: fileContent,
                size: file.size,
                type: FILE_TYPES[fileExtension].type
            };
            uploadedTextFiles.push(textFileData);
            renderUploadedTextFiles();
            updateFilePreview();
        } catch (error) {
            console.error('文件读取错误:', error);
            alert(`文件 ${file.name} 读取失败: ${error.message}`);
        }
    }
    
    // 清空input以便再次选择相同文件
    event.target.value = '';
}

// 读取文件内容
async function readFileContent(file, extension) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                let content = '';
                
                switch (extension) {
                    case 'txt':
                    case 'md':
                    case 'csv':
                    case 'json':
                    case 'xml':
                    case 'html':
                        content = e.target.result;
                        break;
                        
                    case 'pdf':
                        content = await parsePdfFile(e.target.result);
                        break;
                        
                    case 'doc':
                    case 'docx':
                        content = await parseWordFile(e.target.result);
                        break;
                        
                    default:
                        content = e.target.result;
                }
                
                // 限制内容长度（前10000个字符）
                if (content.length > 10000) {
                    content = content.substring(0, 10000) + '\n\n...（内容已截断，显示前10000个字符）';
                }
                
                resolve(content);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('文件读取失败'));
        
        if (extension === 'pdf' || extension === 'doc' || extension === 'docx') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file, 'UTF-8');
        }
    });
}

// 解析PDF文件
async function parsePdfFile(arrayBuffer) {
    try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
            
            // 限制解析前5页
            if (i >= 5) {
                fullText += '\n...（PDF文档较大，已解析前5页）';
                break;
            }
        }
        
        return fullText;
    } catch (error) {
        throw new Error('PDF解析失败: ' + error.message);
    }
}

// 解析Word文件
async function parseWordFile(arrayBuffer) {
    try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        throw new Error('Word文档解析失败: ' + error.message);
    }
}

// 渲染已上传的图片
function renderUploadedImages() {
    uploadedImagesContainer.innerHTML = '';
    
    uploadedImages.forEach((image, index) => {
        const imageElement = document.createElement('div');
        imageElement.className = 'uploaded-file';
        imageElement.innerHTML = `
            <img src="${image.data}" alt="${image.name}">
            <span class="file-name">${image.name}</span>
            <button class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const removeBtn = imageElement.querySelector('.remove-file');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeImage(index);
        });
        
        uploadedImagesContainer.appendChild(imageElement);
    });
}

// 渲染已上传的文本文件
function renderUploadedTextFiles() {
    uploadedTextFilesContainer.innerHTML = '';
    
    uploadedTextFiles.forEach((file, index) => {
        const fileInfo = FILE_TYPES[file.extension] || FILE_TYPES['txt'];
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.innerHTML = `
            <div class="file-icon ${fileInfo.color}">
                <i class="${fileInfo.icon}"></i>
            </div>
            <span class="file-name">${file.name}</span>
            <button class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const removeBtn = fileElement.querySelector('.remove-file');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeTextFile(index);
        });
        
        // 点击文件显示预览
        fileElement.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-file')) {
                showFilePreview(file);
            }
        });
        
        uploadedTextFilesContainer.appendChild(fileElement);
    });
}

// 更新文件预览
function updateFilePreview() {
    if (uploadedTextFiles.length > 0) {
        // 显示最后一个上传的文件预览
        showFilePreview(uploadedTextFiles[uploadedTextFiles.length - 1]);
    } else {
        filePreview.innerHTML = '';
    }
}

// 显示文件预览
function showFilePreview(file) {
    const fileInfo = FILE_TYPES[file.extension] || FILE_TYPES['txt'];
    filePreview.innerHTML = `
        <div class="file-preview-title">
            <i class="${fileInfo.icon} ${fileInfo.color}"></i>
            ${file.name} (${formatFileSize(file.size)})
        </div>
        <div class="file-preview-content">${file.content}</div>
    `;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 移除图片
function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderUploadedImages();
    updateFilePreview();
}

// 移除文本文件
function removeTextFile(index) {
    uploadedTextFiles.splice(index, 1);
    renderUploadedTextFiles();
    updateFilePreview();
}

// 清空所有上传的图片
function clearUploadedImages() {
    uploadedImages = [];
    renderUploadedImages();
    updateFilePreview();
}

// 清空所有上传的文本文件
function clearUploadedTextFiles() {
    uploadedTextFiles = [];
    renderUploadedTextFiles();
    updateFilePreview();
}

// 更新模型支持状态
function updateModelSupport() {
    const selectedModel = modelSelect.value;
    const isImageSupported = IMAGE_SUPPORTED_MODELS.includes(selectedModel);
    
    // 更新模型信息提示
    modelInfo.innerHTML = isImageSupported ? 
        '<small>✓ 该模型支持图片识别和文本解析</small>' : 
        '<small>✓ 该模型支持文本解析（不支持图片识别）</small>';
    
    // 如果模型不支持图片，隐藏图片上传区域
    const imageUploadSection = document.getElementById('image-upload-section');
    if (!isImageSupported) {
        imageUploadSection.style.display = 'none';
        clearUploadedImages();
    } else {
        imageUploadSection.style.display = 'block';
    }
    
    // 文本文件上传始终可用
    const textUploadSection = document.getElementById('text-upload-section');
    textUploadSection.style.display = 'block';
}

// 显示图片模态框
function showImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <span class="close-image-modal">&times;</span>
        <div class="image-modal-content">
            <img src="${imageSrc}" alt="预览图片">
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    const closeBtn = modal.querySelector('.close-image-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 创建新聊天
function createNewChat() {
    currentChatId = Date.now().toString();
    chatHistory[currentChatId] = {
        title: '新聊天',
        messages: []
    };
    
    chatTitle.textContent = '新聊天';
    clearChatMessages();
    clearUploadedImages();
    clearUploadedTextFiles();
    fileUploadArea.style.display = 'none';
    renderHistoryList();
    saveToLocalStorage();
    userInput.focus();
}

// 清空聊天消息UI
function clearChatMessages() {
    chatMessages.innerHTML = '<div class="welcome-message"><h3>欢迎使用本地AI助手</h3><p>请选择模型并输入问题开始交流</p></div>';
}

// 渲染历史记录列表
function renderHistoryList() {
    historyList.innerHTML = '';
    const sortedChatIds = Object.keys(chatHistory).sort((a, b) => b - a);
    
    sortedChatIds.forEach(chatId => {
        const chat = chatHistory[chatId];
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.chatId = chatId;
        
        if (chatId === currentChatId) {
            historyItem.style.backgroundColor = 'var(--border-color)';
        }
        
        historyItem.innerHTML = `
            <span class="history-item-title">${chat.title}</span>
            <span class="history-item-delete" data-chat-id="${chatId}">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        historyItem.addEventListener('click', (e) => {
            if (!e.target.closest('.history-item-delete')) {
                loadChat(chatId);
            }
        });
        
        const deleteBtn = historyItem.querySelector('.history-item-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('确定要删除这条聊天记录吗？')) {
                delete chatHistory[chatId];
                if (chatId === currentChatId) {
                    createNewChat();
                }
                saveToLocalStorage();
                renderHistoryList();
            }
        });
        
        historyList.appendChild(historyItem);
    });
}

// 加载指定聊天
function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chatHistory[chatId];
    
    chatTitle.textContent = chat.title;
    renderChatMessages(chat.messages);
    clearUploadedImages();
    clearUploadedTextFiles();
    fileUploadArea.style.display = 'none';
    renderHistoryList();
    userInput.focus();
}

// 渲染聊天消息
function renderChatMessages(messages) {
    clearChatMessages();
    if (messages.length === 0) return;
    
    messages.forEach(msg => {
        addMessageToUI(msg.role, msg.content, msg.thinking, msg.duration, msg.images, msg.files);
    });
    
    scrollToBottom();
}

// 添加消息到UI
function addMessageToUI(role, content, thinking = '', duration = 0, images = [], files = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    
    let messageContent = '';
    
    // 用户消息：显示图片和文件
    if (role === 'user') {
        // 显示图片
        if (images && images.length > 0) {
            images.forEach(imgData => {
                messageContent += `<div class="message-image"><img src="${imgData}" alt="上传的图片" class="message-image-preview"></div>`;
            });
        }
        
        // 显示文件
        if (files && files.length > 0) {
            files.forEach(file => {
                const fileInfo = FILE_TYPES[file.extension] || FILE_TYPES['txt'];
                messageContent += `
                    <div class="message-file">
                        <div class="file-info">
                            <div class="file-icon-small ${fileInfo.color}">
                                <i class="${fileInfo.icon}"></i>
                            </div>
                            <div class="file-details">
                                <div class="file-name-small">${file.name}</div>
                                <div class="file-size">${formatFileSize(file.size)}</div>
                            </div>
                        </div>
                        <div class="file-content-preview">${file.content}</div>
                    </div>
                `;
            });
        }
    }
    
    // 助手消息：思考内容
    if (role === 'assistant' && settings.thinkMode && thinking) {
        messageContent += `
            <div class="thinking-container">
                <div class="thinking-header">
                    <strong>思考过程</strong>
                    <span class="thinking-toggle">▶</span>
                </div>
                <div class="thinking-content">${thinking}</div>
            </div>
        `;
    }
    
    // 基础内容
    messageContent += `<div class="message-content">${content || '<span class="loading">思考中……</span>'}</div>`;
    
    // 耗时信息
    if (role === 'assistant' && duration) {
        const durationSec = (duration / 1e9).toFixed(2);
        messageContent += `
            <div class="duration-info">
                <strong>总计耗时：</strong>${durationSec} 秒
            </div>
        `;
    }
    
    messageDiv.innerHTML = messageContent;
    
    // 移除欢迎消息
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        chatMessages.removeChild(welcomeMsg);
    }
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 滚动到底部
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 发送消息
async function sendMessage() {
    const inputText = userInput.value.trim();
    const currentModel = modelSelect.value;
    const isImageSupported = IMAGE_SUPPORTED_MODELS.includes(currentModel);
    
    // 验证输入
    if (!inputText && uploadedImages.length === 0 && uploadedTextFiles.length === 0) {
        alert('请输入消息或上传文件');
        return;
    }
    
    // 如果上传了图片但模型不支持，给出提示
    if (uploadedImages.length > 0 && !isImageSupported) {
        alert('当前选择的模型不支持图片识别，请切换至支持图片的模型（如qwen3-vl:4b）');
        return;
    }

    // 准备用户消息数据
    const userMsg = {
        role: 'user',
        content: inputText
    };
    
    // 如果有图片，添加到消息中
    if (uploadedImages.length > 0 && isImageSupported) {
        // 提取Base64数据（去掉data URL前缀）
        const imageDataArray = uploadedImages.map(img => {
            return img.data.split(',')[1]; // 只保留Base64数据部分
        });
        userMsg.images = imageDataArray;
    }
    
    // 如果有文本文件，添加到消息中
    if (uploadedTextFiles.length > 0) {
        // 为每个文件创建简化的文件信息
        userMsg.files = uploadedTextFiles.map(file => ({
            name: file.name,
            extension: file.extension,
            content: file.content,
            size: file.size,
            type: file.type
        }));
        
        // 将文件内容添加到文本内容中
        if (!userMsg.content) {
            userMsg.content = '请分析以下文档内容：\n\n';
        }
        
        uploadedTextFiles.forEach((file, index) => {
            userMsg.content += `\n\n文档 ${index + 1} (${file.name}):\n${file.content}`;
        });
    }

    // 添加用户消息到UI和历史
    addMessageToUI('user', inputText, '', 0, 
        uploadedImages.map(img => img.data),
        uploadedTextFiles.map(file => ({
            name: file.name,
            extension: file.extension,
            content: file.content.substring(0, 200) + (file.content.length > 200 ? '...' : ''),
            size: file.size
        }))
    );
    chatHistory[currentChatId].messages.push(userMsg);
    
    // 更新聊天标题
    if (chatHistory[currentChatId].messages.length === 1) {
        let title = inputText;
        if (!title) {
            if (uploadedImages.length > 0 && uploadedTextFiles.length > 0) {
                title = '图片和文档对话';
            } else if (uploadedImages.length > 0) {
                title = '图片对话';
            } else if (uploadedTextFiles.length > 0) {
                title = '文档分析';
            } else {
                title = '新聊天';
            }
        }
        chatHistory[currentChatId].title = title.length > 20 ? title.substring(0, 20) + '...' : title;
        chatTitle.textContent = chatHistory[currentChatId].title;
        renderHistoryList();
    }
    
    // 清空输入框和文件
    userInput.value = '';
    clearUploadedImages();
    clearUploadedTextFiles();
    fileUploadArea.style.display = 'none';
    
    saveToLocalStorage();
    
    // 创建AI回答区域
    const assistantMsgDiv = document.createElement('div');
    assistantMsgDiv.className = 'message assistant-message';
    
    if (settings.thinkMode) {
        assistantMsgDiv.innerHTML = `
            <div class="thinking-container">
                <div class="thinking-header">
                    <strong>思考过程</strong>
                    <span class="thinking-toggle">▶</span>
                </div>
                <div class="thinking-content collapsed"></div>
            </div>
            <div class="message-content"><span class="loading">思考中……</span></div>
        `;
    } else {
        assistantMsgDiv.innerHTML = `<div class="message-content"><span class="loading">思考中……</span></div>`;
    }
    
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        chatMessages.removeChild(welcomeMsg);
    }
    
    chatMessages.appendChild(assistantMsgDiv);
    scrollToBottom();
    
    // 显示停止按钮，隐藏发送按钮
    stopBtn.style.display = 'flex';
    sendBtn.style.display = 'none';
    
    // 构建请求数据
    const requestData = {
        model: currentModel,
        messages: chatHistory[currentChatId].messages,
        stream: true,
        think: settings.thinkMode,
        keep_alive: '5m'
    };
    
    try {
        // 创建AbortController用于中止请求
        currentAbortController = new AbortController();
        
        const response = await fetch('http://192.168.1.14:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: currentAbortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let thinkingContent = '';
        let totalDuration = 0;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    if (data.message?.content) {
                        assistantContent += data.message.content;
                        assistantMsgDiv.querySelector('.message-content').textContent = assistantContent;
                    }
                    
                    if (settings.thinkMode && data.message?.thinking) {
                        thinkingContent += data.message.thinking;
                        const thinkingContentEl = assistantMsgDiv.querySelector('.thinking-content');
                        if (thinkingContentEl) {
                            thinkingContentEl.textContent = thinkingContent;
                            thinkingContentEl.classList.remove('collapsed');
                            assistantMsgDiv.querySelector('.thinking-toggle').classList.remove('collapsed');
                        }
                    }
                    
                    if (data.done) {
                        totalDuration = data.total_duration || 0;
                        
                        if (totalDuration) {
                            const durationSec = (totalDuration / 1e9).toFixed(2);
                            const durationDiv = document.createElement('div');
                            durationDiv.className = 'duration-info';
                            durationDiv.innerHTML = `<strong>总计耗时：</strong>${durationSec} 秒`;
                            assistantMsgDiv.appendChild(durationDiv);
                        }
                        
                        const assistantMsg = {
                            role: 'assistant',
                            content: assistantContent,
                            thinking: thinkingContent,
                            duration: totalDuration
                        };
                        chatHistory[currentChatId].messages.push(assistantMsg);
                        saveToLocalStorage();
                    }
                    
                    scrollToBottom();
                } catch (e) {
                    console.error('解析JSON失败:', e);
                }
            }
        }
    } catch (error) {
        // 如果是中止请求导致的错误，不显示错误信息
        if (error.name === 'AbortError') {
            console.log('请求已被用户中止');
            
            // 保存已生成的部分内容
            const assistantMsg = {
                role: 'assistant',
                content: assistantContent,
                thinking: thinkingContent,
                duration: 0,
                stopped: true
            };
            chatHistory[currentChatId].messages.push(assistantMsg);
            saveToLocalStorage();
        } else {
            console.error('发送消息失败:', error);
            const assistantMsgDiv = chatMessages.querySelector('.message.assistant-message:last-child');
            if (assistantMsgDiv) {
                assistantMsgDiv.querySelector('.message-content').textContent = `出错了：${error.message}`;
            }
            
            chatHistory[currentChatId].messages.push({
                role: 'assistant',
                content: `出错了：${error.message}`,
                thinking: '',
                duration: 0
            });
            saveToLocalStorage();
        }
    } finally {
        // 恢复按钮状态
        stopBtn.style.display = 'none';
        sendBtn.style.display = 'flex';
        currentAbortController = null;
    }
}