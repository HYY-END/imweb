const songs = [
    { title: 'Deja Vu', file: 'Deja Vu.mp3' },
    { title: 'GGUM', file: 'GGUM.mp3' },
    { title: 'Crown', file: 'crown.m4a' },
    { title: 'Potato', file: 'potato.m4a' },
    { title: '一半一半', file: '一半一半.mp3' },
    { title: '海嶼你', file: '海嶼你.m4a' }
];

let currentRound = 0;
let score = 0;
let targetSong = null;
let isPlaying = false;
let gameActive = false;
let playTimeout = null;
let countdownInterval = null;
let timeLeft = 30;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const vinyl = document.getElementById('vinyl');
const feedbackText = document.getElementById('feedback');
const scoreDisplay = document.getElementById('score');
const roundDisplay = document.getElementById('current-round');
const progressFill = document.getElementById('progress-fill');
const finalScore = document.getElementById('final-score');
const audio = document.getElementById('game-audio');
const timerText = document.getElementById('timer');

// New Input Elements
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');

// Initialize
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
playBtn.addEventListener('click', togglePlay);
submitBtn.addEventListener('click', handleGuess);
nextBtn.addEventListener('click', nextRound);

answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuess();
});

function startGame() {
    currentRound = 0;
    score = 0;
    gameActive = true;
    
    // Shuffle songs for a random order each time
    songs.sort(() => Math.random() - 0.5);
    
    updateScore();
    showScreen('game-screen');
    nextRound();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function nextRound() {
    if (currentRound >= songs.length) {
        endGame();
        return;
    }

    currentRound++;
    updateProgress();
    
    // Select target song
    targetSong = songs[currentRound - 1];
    
    // Reset UI
    feedbackText.innerText = '點擊播放並在 30 秒內猜出歌名！';
    feedbackText.style.color = 'inherit';
    answerInput.value = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    submitBtn.style.display = 'block';
    nextBtn.style.display = 'none';
    answerInput.focus();
    
    resetTimer();
    stopAudio();
    
    // Set audio source
    audio.src = targetSong.file;
    
    // Auto-play the song
    audio.oncanplaythrough = () => {
        if (gameActive && !isPlaying) playAudio();
        audio.oncanplaythrough = null; // Prevent re-triggering
    };
}

function togglePlay() {
    if (!gameActive) return;
    
    if (isPlaying) {
        stopAudio();
    } else {
        playAudio();
    }
}

function playAudio() {
    audio.play();
    isPlaying = true;
    playIcon.innerText = '⏸';
    vinyl.classList.add('playing');
    feedbackText.innerText = '正在播放... ⚡️';

    // Timer Logic
    if (!countdownInterval) {
        startTimer();
    }
}

function startTimer() {
    countdownInterval = setInterval(() => {
        timeLeft--;
        timerText.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            stopAudio();
            feedbackText.innerText = '時間到！請輸入答案！';
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(countdownInterval);
    countdownInterval = null;
    timeLeft = 30;
    timerText.innerText = timeLeft;
}

function stopAudio() {
    audio.pause();
    isPlaying = false;
    playIcon.innerText = '▶';
    vinyl.classList.remove('playing');
}

function handleGuess() {
    if (!gameActive || answerInput.disabled) return;

    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = targetSong.title.toLowerCase();

    if (!userAnswer) {
        feedbackText.innerText = '請輸入答案喔！🐱';
        return;
    }

    stopAudio();
    clearInterval(countdownInterval);
    countdownInterval = null;
    
    answerInput.disabled = true;
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';

    if (userAnswer === correctAnswer) {
        score += 100;
        updateScore();
        feedbackText.innerText = '✨ 太棒了！答對了！';
        feedbackText.style.color = '#15803d';
    } else {
        feedbackText.innerText = `❌ 答錯囉，答案是：${targetSong.title}`;
        feedbackText.style.color = '#991b1b';
    }
}

function updateScore() {
    scoreDisplay.innerText = score;
}

function updateProgress() {
    roundDisplay.innerText = `Round ${currentRound}/${songs.length}`;
    progressFill.style.width = `${(currentRound / songs.length) * 100}%`;
}

function endGame() {
    gameActive = false;
    finalScore.innerText = score;
    showScreen('result-screen');
}

// Handle audio end
audio.onended = () => {
    stopAudio();
};

// Error handling for audio
audio.onerror = () => {
    console.error("Audio failed to load:", audio.src);
    feedbackText.innerText = "音檔載入失敗，請確認檔案路徑";
};
