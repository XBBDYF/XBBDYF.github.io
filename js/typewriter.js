const typewriterEl = document.getElementById('typewriter');
const texts = ['洗不白de衣服', '一个小菜鸟', '一个开发者', '一个学习者', '我不知道写什么了……', '你还在看什么？', '别这么无聊了……', '看看其他的吧……', '…………', '别看了……', '真没了……'];
let textIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 100;
function typeWriter() {
    const currentText = texts[textIndex];
    if(isDeleting) charIndex--, typeSpeed = 50;
    else charIndex++, typeSpeed = 120;
    typewriterEl.textContent = currentText.substring(0, charIndex);
    if(!isDeleting && charIndex === currentText.length) typeSpeed = 2000, isDeleting = true;
    else if(isDeleting && charIndex === 0) isDeleting = false, textIndex = (textIndex+1)%texts.length, typeSpeed = 500;
    setTimeout(typeWriter, typeSpeed);
}
setTimeout(typeWriter, 500);