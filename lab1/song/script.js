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
let extraTimeOffered = false;
let canGuess = false;

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

const extraTimeContainer = document.getElementById('extra-time-container');
const optionsContainer = document.getElementById('options-container');

// Buttons
const guessEarlyBtn = document.getElementById('guess-early-btn');
const addTimeBtn = document.getElementById('add-time-btn');
const skipTimeBtn = document.getElementById('skip-time-btn');
const nextBtn = document.getElementById('next-btn');

// Initialize
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextRound);
guessEarlyBtn.addEventListener('click', showOptions);
addTimeBtn.addEventListener('click', () => useExtraTime(5));
skipTimeBtn.addEventListener('click', showOptions);

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
    
    // Reset Play Button
    playBtn.style.pointerEvents = 'auto';
    playBtn.style.opacity = '1';
    
    // Reset UI
    feedbackText.innerText = '點擊播放並在 30 秒內猜出歌名！';
    feedbackText.style.color = 'inherit';
    extraTimeContainer.style.display = 'none';
    optionsContainer.style.display = 'none';
    guessEarlyBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    extraTimeOffered = false;
    canGuess = false;
    optionsContainer.innerHTML = '';
    
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
    if (!gameActive || playBtn.style.pointerEvents === 'none') return;
    
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
    
    if (!canGuess) {
        guessEarlyBtn.style.display = 'block';
    }

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
            clearInterval(countdownInterval);
            countdownInterval = null;
            stopAudio();
            guessEarlyBtn.style.display = 'none';
            
            if (!extraTimeOffered) {
                playBtn.style.pointerEvents = 'none';
                playBtn.style.opacity = '0.5';
                showExtraTimePrompt();
            } else {
                showOptions();
            }
        }
    }, 1000);
}

function showExtraTimePrompt() {
    extraTimeOffered = true;
    feedbackText.innerText = '時間到囉！🐱';
    extraTimeContainer.style.display = 'block';
}

function useExtraTime(seconds) {
    extraTimeContainer.style.display = 'none';
    timeLeft = seconds;
    timerText.innerText = timeLeft;
    playBtn.style.pointerEvents = 'auto';
    playBtn.style.opacity = '1';
    playAudio();
}

function showOptions() {
    extraTimeContainer.style.display = 'none';
    guessEarlyBtn.style.display = 'none';
    optionsContainer.style.display = 'grid';
    feedbackText.innerText = '請選擇正確的歌名！✨';
    canGuess = true;
    
    // Only generate if not already visible
    if (optionsContainer.innerHTML === '') {
        generateOptions();
    }
}

function generateOptions() {
    optionsContainer.innerHTML = '';
    
    let options = [targetSong];
    let otherSongs = songs.filter(s => s.title !== targetSong.title);
    otherSongs.sort(() => Math.random() - 0.5);
    options.push(...otherSongs.slice(0, 3));
    options.sort(() => Math.random() - 0.5);
    
    options.forEach(song => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = song.title;
        btn.onclick = () => handleGuess(song.title, btn);
        optionsContainer.appendChild(btn);
    });
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

function handleGuess(userAnswer, btn) {
    if (!gameActive || !canGuess) return;

    const correctAnswer = targetSong.title;

    if (userAnswer === correctAnswer) {
        // Correct Guess
        canGuess = false;
        stopAudio();
        clearInterval(countdownInterval);
        countdownInterval = null;
        
        // Disable and style buttons
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach(b => {
            b.disabled = true;
            if (b.innerText === correctAnswer) {
                b.classList.add('correct');
            }
        });

        playBtn.style.pointerEvents = 'none';
        playBtn.style.opacity = '0.5';
        nextBtn.style.display = 'block';
        score += 100;
        updateScore();
        feedbackText.innerText = '✨ 太棒了！答對了！';
        feedbackText.style.color = '#15803d';
    } else {
        // Wrong Guess
        btn.disabled = true;
        btn.classList.add('wrong');
        feedbackText.innerText = '❌ 猜錯囉，再試試看！';
        feedbackText.style.color = '#991b1b';
        
        // Reset feedback text color after 2 seconds if still playing
        setTimeout(() => {
            if (gameActive && canGuess) {
                feedbackText.innerText = isPlaying ? '正在播放... ⚡️' : '請選擇正確的歌名！✨';
                feedbackText.style.color = 'inherit';
            }
        }, 2000);
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
