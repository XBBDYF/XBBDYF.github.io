const resumeBtn = document.getElementById('lockedResumeBtn');
if(resumeBtn){
    resumeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resumeBtn.classList.add('shake-animation');
        setTimeout(() => resumeBtn.classList.remove('shake-animation'), 500);
        alert('🔒 暂不想求职，感谢您的关注！目前专注于技术积累与学历提升。');
    });
}