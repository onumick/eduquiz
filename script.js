let currentLevel = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let startTime = 0;
let endTime = 0;
let localStorageAvailable = false;
let soundEnabled = true;

try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    localStorageAvailable = true;
} catch (e) {
    console.warn('localStorage not available');
}

const screens = {
    welcome: document.getElementById('welcome-screen'),
    level: document.getElementById('level-screen'),
    quiz: document.getElementById('quiz-screen'),
    summary: document.getElementById('summary-screen')
};

const loadingOverlay = document.getElementById('loading-overlay');
const levelContainer = document.getElementById('level-container');
const optionsContainer = document.getElementById('options-container');
const questionText = document.getElementById('question-text');
const currentQuestionEl = document.getElementById('current-question');
const totalQuestionsEl = document.getElementById('total-questions');
const progressFill = document.querySelector('.progress-fill');
const feedbackContainer = document.getElementById('feedback-container');
const feedbackIcon = document.getElementById('feedback-icon');
const feedbackText = document.getElementById('feedback-text');
const explanationText = document.getElementById('explanation-text');
const nextQuestionBtn = document.getElementById('next-question-btn');
const finalScoreEl = document.getElementById('final-score');
const totalScoreEl = document.getElementById('total-score');
const earnedXpEl = document.getElementById('earned-xp');
const timeTakenEl = document.getElementById('time-taken');
const encouragementMessageEl = document.getElementById('encouragement-message');
const confettiCanvas = document.getElementById('confetti-canvas');
const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');

document.addEventListener('DOMContentLoaded', init);

document.getElementById('start-btn').addEventListener('click', () => {
    showScreen(screens.level);
    document.body.classList.add('nav-hidden');
});

document.getElementById('sound-toggle').addEventListener('click', toggleSound);

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', handleBackButtonClick);
});

document.getElementById('next-question-btn').addEventListener('click', () => {
    hideFeedback();
    nextQuestion();
});

document.getElementById('quiz-exit-btn').addEventListener('click', () => {
    showExitConfirmationModal();
});

document.getElementById('retry-btn').addEventListener('click', () => {
    startQuiz(currentQuestions);
});

document.getElementById('change-level-btn').addEventListener('click', () => {
    showScreen(screens.level);
});

document.getElementById('change-topic-btn').addEventListener('click', () => {
    showScreen(screens.level);
});

document.getElementById('go-home-btn').addEventListener('click', () => {
    showScreen(screens.welcome);
    document.body.classList.remove('nav-hidden');
});

async function init() {
    showLoading();
    try {
        document.body.classList.remove('nav-hidden');
        
        document.getElementById('exit-confirm-btn').addEventListener('click', () => {
            hideExitConfirmationModal();
            showScreen(screens.level);
        });
        
        document.getElementById('exit-cancel-btn').addEventListener('click', hideExitConfirmationModal);
        
        populateLevels();
        loadSavedData();
        
        hideLoading();
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Failed to load quiz data. Please try again later.');
        hideLoading();
    }
}

function showScreen(screen) {
    Object.values(screens).forEach(s => {
        if (s) s.classList.remove('active');
    });
    
    if (screen) screen.classList.add('active');
}

function handleBackButtonClick() {
    const activeScreen = document.querySelector('.screen.active');
    
    if (activeScreen === screens.level) {
        showScreen(screens.welcome);
        document.body.classList.remove('nav-hidden');
    } else if (activeScreen === screens.quiz) {
        showScreen(screens.level);
    }
}

function populateLevels() {
    levelContainer.innerHTML = '';
    const levels = ['young', 'big'];
    
    levels.forEach(level => {
        const levelCard = document.createElement('div');
        levelCard.className = 'selection-card';
        levelCard.innerHTML = `
            <i class="fas fa-child"></i>
            <span>${level.charAt(0).toUpperCase() + level.slice(1)}</span>
        `;
        
        levelCard.addEventListener('click', () => {
            currentLevel = level;
            saveData('currentLevel', currentLevel);
            loadQuestions(level);
        });
        
        levelContainer.appendChild(levelCard);
    });
}

async function loadQuestions(level) {
    showLoading();
    try {
        const response = await fetch(`data/${level}.json`);
        const questions = await response.json();
        startQuiz(questions);
        hideLoading();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please try again later.');
        hideLoading();
    }
}

function startQuiz(questions) {
    currentQuestions = questions;
    currentQuestionIndex = 0;
    score = 0;
    
    totalQuestionsEl.textContent = currentQuestions.length;
    startTime = new Date();
    
    loadQuestion();
    showScreen(screens.quiz);
}

function loadQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    updateProgress();
    
    questionText.textContent = question.question;
    
    optionsContainer.innerHTML = '';
    
    const correctAnswer = question.answer;
    const shuffledOptions = shuffleArray([...question.options]);
    
    shuffledOptions.forEach((option) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option;
        
        optionBtn.addEventListener('click', () => {
            selectAnswer(option, shuffledOptions, correctAnswer);
        });
        
        optionsContainer.appendChild(optionBtn);
    });
}

function selectAnswer(selectedOption, shuffledOptions, correctAnswer) {
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === correctAnswer;
    
    playSound(isCorrect);
    
    const optionButtons = optionsContainer.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.classList.add('disabled');
    });
    
    const correctIndex = shuffledOptions.indexOf(correctAnswer);
    optionButtons[correctIndex].classList.add('correct');
    if (!isCorrect) {
        const selectedIndex = shuffledOptions.indexOf(selectedOption);
        optionButtons[selectedIndex].classList.add('wrong');
    }
    
    if (isCorrect) {
        score++;
    }
    
    showFeedback(isCorrect, question.explanation, correctAnswer);
}

function showFeedback(isCorrect, explanation, correctAnswer) {
    feedbackIcon.className = '';
    
    if (isCorrect) {
        feedbackIcon.className = 'fas fa-check-circle correct';
        feedbackText.textContent = 'Correct!';
        explanationText.textContent = explanation;
        showConfetti();
    } else {
        feedbackIcon.className = 'fas fa-times-circle wrong';
        feedbackText.textContent = 'Incorrect';
        explanationText.textContent = `The correct answer is: ${correctAnswer}. ${explanation || ''}`;
    }
    
    feedbackContainer.style.display = 'flex';
}

function hideFeedback() {
    feedbackContainer.style.display = 'none';
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        endTime = new Date();
        showSummary();
    }
}

function showSummary() {
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    
    finalScoreEl.textContent = score;
    totalScoreEl.textContent = currentQuestions.length;
    earnedXpEl.textContent = xpPoints;
    timeTakenEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    const percentage = (score / currentQuestions.length) * 100;
    let message = '';
    
    if (percentage >= 90) {
        message = 'Outstanding! You\'re a genius!';
    } else if (percentage >= 70) {
        message = 'Great job! Keep it up!';
    } else if (percentage >= 50) {
        message = 'Good effort! You\'re making progress!';
    } else {
        message = 'Keep practicing! You\'ll get better!';
    }
    
    encouragementMessageEl.textContent = message;
    showScreen(screens.summary);
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function updateProgress() {
    const progress = ((currentQuestionIndex) / currentQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function saveData(key, value) {
    if (localStorageAvailable) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

function loadSavedData() {
    if (localStorageAvailable) {
        const savedLevel = localStorage.getItem('currentLevel');
        if (savedLevel) {
            currentLevel = JSON.parse(savedLevel);
        }
        
        const savedSoundEnabled = localStorage.getItem('soundEnabled');
        if (savedSoundEnabled !== null) {
            soundEnabled = savedSoundEnabled === 'true';
            const soundIcon = document.getElementById('sound-icon');
            soundIcon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }
}

function showConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    const gravity = 0.3;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 360,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
    
    let animationFrame;
    const animate = () => {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation * Math.PI / 180);
            
            ctx.fillStyle = particle.color;
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            
            ctx.restore();
            
            particle.y += particle.speed;
            particle.x += Math.sin(particle.angle * Math.PI / 180) * 2;
            particle.rotation += particle.rotationSpeed;
            particle.speed += gravity;
        });
        
        const isComplete = particles.every(p => p.y > confettiCanvas.height);
        
        if (isComplete) {
            cancelAnimationFrame(animationFrame);
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        } else {
            animationFrame = requestAnimationFrame(animate);
        }
    };
    
    animate();
}

function playSound(isCorrect) {
    if (!soundEnabled) return;
    
    try {
        if (isCorrect) {
            correctSound.currentTime = 0;
            correctSound.play();
        } else {
            incorrectSound.currentTime = 0;
            incorrectSound.play();
        }
    } catch (error) {
        console.error("Error playing sound:", error);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundIcon = document.getElementById('sound-icon');
    
    if (soundEnabled) {
        soundIcon.className = 'fas fa-volume-up';
    } else {
        soundIcon.className = 'fas fa-volume-mute';
    }
    
    if (localStorageAvailable) {
        localStorage.setItem('soundEnabled', soundEnabled);
    }
}

function showExitConfirmationModal() {
    const modal = document.getElementById('exit-confirmation-modal');
    modal.classList.add('active');
}

function hideExitConfirmationModal() {
    const modal = document.getElementById('exit-confirmation-modal');
    modal.classList.remove('active');
}
