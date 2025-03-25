// Timer variables
let totalSeconds = 0;
let remainingSeconds = 0;
let timerInterval;
let isRunning = false;
let startTime;
let pausedTime = 0;

// DOM elements
const timerSelectionView = document.getElementById('timerSelectionView');
const customTimerView = document.getElementById('customTimerView');
const countdownView = document.getElementById('countdownView');

const displayHours = document.getElementById('displayHours');
const displayMinutes = document.getElementById('displayMinutes');
const displaySeconds = document.getElementById('displaySeconds');

const hoursInput = document.getElementById('hoursInput');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');

const progressFill = document.getElementById('progressFill');
const flashToggle = document.getElementById('flashToggle');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const timerContainer = document.getElementById('timerContainer');
const progressToggle = document.getElementById('progressToggle');

// Format time to always display two digits
function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

// Update the countdown display
function updateDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    displayHours.textContent = formatTime(hours);
    displayMinutes.textContent = formatTime(minutes);
    displaySeconds.textContent = formatTime(secs);
    
    // Only update progress bar if it's visible
    if (progressToggle.checked) {
        const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
        progressFill.style.width = `${progress}%`;
        document.querySelector('.progress-bar').style.display = 'block';
    } else {
        document.querySelector('.progress-bar').style.display = 'none';
    }
    
    // Update document title
    document.title = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(secs)} - Timer`;
}

// Run the countdown
function runTimer() {
    const currentTime = new Date().getTime();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000) + pausedTime;
    remainingSeconds = totalSeconds - elapsedTime;
    
    if (remainingSeconds <= 0) {
        finishTimer();
        return;
    }
    
    updateDisplay(remainingSeconds);
}

// Start the timer with specified minutes
function startTimer(minutes) {
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    startTime = new Date().getTime();
    pausedTime = 0;
    isRunning = true;
    
    // Show countdown view
    timerSelectionView.classList.add('hidden');
    customTimerView.classList.add('hidden');
    countdownView.classList.remove('hidden');
    
    // Setup initial display
    updateDisplay(remainingSeconds);
    
    // Start countdown
    timerInterval = setInterval(runTimer, 1000);
}

// Start custom timer
function startCustomTimer() {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    
    const totalMinutes = (hours * 60) + minutes + (seconds / 60);
    
    if (totalMinutes <= 0) {
        alert('Please enter a valid time');
        return;
    }
    
    startTimer(totalMinutes);
}

// Pause the timer
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timerInterval);
    isRunning = false;
    pausedTime = totalSeconds - remainingSeconds;
    
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');
}

// Resume the timer
function resumeTimer() {
    if (isRunning) return;
    
    startTime = new Date().getTime();
    isRunning = true;
    
    resumeBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    
    timerInterval = setInterval(runTimer, 1000);
}

// Cancel the timer
function cancelTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    // Reset view
    timerContainer.classList.remove('flash-animation');
    countdownView.classList.add('hidden');
    timerSelectionView.classList.remove('hidden');
    
    pauseBtn.classList.remove('hidden');
    resumeBtn.classList.add('hidden');
    
    // Reset title
    document.title = 'Timer - Utilitaires.ca';
}

// Finish the timer
function finishTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    // Play audio notification if available
    try {
        const audio = new Audio('alert.mp3');
        audio.play();
    } catch (e) {
        console.log('Audio alert not available');
    }
    
    // Flash animation if enabled
    if (flashToggle.checked) {
        timerContainer.classList.add('flash-animation');
    }
    
    updateDisplay(0);
    
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.add('hidden');
}

// Load flash and progress bar preferences from localStorage
function loadPreferences() {
    // Existing flash preference
    const flashPreference = localStorage.getItem('flashOnFinish');
    if (flashPreference !== null) {
        flashToggle.checked = flashPreference === 'true';
    }
    
    // Add progress bar preference
    const progressPreference = localStorage.getItem('showProgressBar');
    if (progressPreference !== null) {
        progressToggle.checked = progressPreference === 'true';
    }
    
    // Apply initial progress bar visibility
    if (!progressToggle.checked) {
        document.querySelector('.progress-bar').style.display = 'none';
    }
    
    // Save flash preference when changed
    flashToggle.addEventListener('change', () => {
        localStorage.setItem('flashOnFinish', flashToggle.checked);
    });
    
    // Save progress bar preference when changed
    progressToggle.addEventListener('change', () => {
        localStorage.setItem('showProgressBar', progressToggle.checked);
        
        // Update visibility immediately
        document.querySelector('.progress-bar').style.display = 
            progressToggle.checked ? 'block' : 'none';
    });
}

// Initialize event listeners
function initEventListeners() {
    // Preset button listeners
    document.querySelectorAll('.preset-btn:not(.custom-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.getAttribute('data-minutes'));
            startTimer(minutes);
        });
    });
    
    // Custom timer button
    document.querySelector('.custom-btn').addEventListener('click', () => {
        timerSelectionView.classList.add('hidden');
        customTimerView.classList.remove('hidden');
    });
    
    // Custom timer controls
    document.getElementById('startCustomBtn').addEventListener('click', startCustomTimer);
    document.getElementById('cancelCustomBtn').addEventListener('click', () => {
        customTimerView.classList.add('hidden');
        timerSelectionView.classList.remove('hidden');
    });
    
    // Countdown controls
    pauseBtn.addEventListener('click', pauseTimer);
    resumeBtn.addEventListener('click', resumeTimer);
    cancelBtn.addEventListener('click', cancelTimer);
}

// Initialize timer with fixed size
function initializeTimer() {
    // Set a fixed size for the timer container
    timerContainer.style.width = '400px';
    timerContainer.style.minHeight = '400px';
    timerContainer.style.position = 'relative';
    timerContainer.style.overflow = 'hidden';
}

// Initialize timer-specific functionality
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    initEventListeners();
    initializeTimer();
});
