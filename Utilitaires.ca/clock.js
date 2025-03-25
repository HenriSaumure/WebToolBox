function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Initialize clock with fixed size
function initializeClock() {
    const clockContainer = document.getElementById('clockContainer');
    const clockElement = document.getElementById('clock');
    
    // Set a fixed size for the clock
    clockContainer.style.width = '300px';
    clockContainer.style.height = '150px';
    clockContainer.style.display = 'flex';
    clockContainer.style.justifyContent = 'center';
    clockContainer.style.alignItems = 'center';
    
    // Set font size for the clock
    clockElement.style.fontSize = '3rem';
    clockElement.style.fontFamily = 'monospace';
    clockElement.style.textAlign = 'center';
}

// Initialize clock functionality and start the timer
document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    setInterval(updateClock, 1000);
    updateClock();
});