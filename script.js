/**
 * Common JavaScript functionality for Utilitaires.ca
 * Handles theme switching, back navigation, and zoom controls
 */

// Theme Toggle Function
function initializeTheme() {
    const themeButton = document.getElementById('themeButton');
    console.log('Initializing theme functionality');
    console.log('Theme button found:', !!themeButton);
    
    if (themeButton) {
        // Check for saved user preference and apply it
        const darkMode = localStorage.getItem('darkMode') === 'true';
        console.log('Dark theme preference:', darkMode);
        
        // Apply theme on load
        if (darkMode) {
            document.documentElement.classList.add('dark-theme');
            document.body.classList.add('dark-theme');
            themeButton.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Toggle theme on button click
        themeButton.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-theme');
            document.body.classList.toggle('dark-theme');
            
            const isDarkMode = document.documentElement.classList.contains('dark-theme');
            localStorage.setItem('darkMode', isDarkMode);
            
            // Update button icon
            themeButton.innerHTML = isDarkMode 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
                
            console.log('Theme toggled, dark mode:', isDarkMode);
            console.log('Current container-bg value:', getComputedStyle(document.documentElement).getPropertyValue('--container-bg').trim());
            
            // Force repaint for elements that might not update correctly
            document.querySelectorAll('.suggestion-container, .weather-container, .forecast-item')
                .forEach(el => {
                    // Force a repaint by briefly toggling a harmless property
                    const display = el.style.display;
                    el.style.display = 'none';
                    setTimeout(() => {
                        el.style.display = display;
                    }, 5);
                });
        });
    }
}

// Initialize back button functionality
function initBackButton() {
    const backButton = document.getElementById('backButton');
    
    // Skip if no back button is found
    if (!backButton) return;
    
    backButton.addEventListener('click', () => {
        if (document.referrer && new URL(document.referrer).host === window.location.host) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    });
}

// Initialize zoom functionality
function initZoom() {
    // Skip zoom for index page
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
        return;
    }
    
    // Create a unique storage key for each page
    const pageIdentifier = window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_');
    const zoomStorageKey = `pageZoomLevel_${pageIdentifier}`;
    
    // Add zoom controls to the control buttons
    const controlButtons = document.querySelector('.control-buttons');
    if (!controlButtons) return; // Guard clause if element doesn't exist
    
    // Create zoom in button
    const zoomInButton = document.createElement('button');
    zoomInButton.id = 'zoomInButton';
    zoomInButton.title = 'Zoom in';
    zoomInButton.innerHTML = '<i class="fas fa-search-plus"></i>';
    
    // Create zoom out button
    const zoomOutButton = document.createElement('button');
    zoomOutButton.id = 'zoomOutButton';
    zoomOutButton.title = 'Zoom out';
    zoomOutButton.innerHTML = '<i class="fas fa-search-minus"></i>';
    
    // Add buttons to control section
    controlButtons.appendChild(zoomInButton);
    controlButtons.appendChild(zoomOutButton);
    
    // Get main element to apply zoom to
    const mainContent = document.querySelector('main');
    if (!mainContent) return; // Guard clause if element doesn't exist
    
    // Get saved zoom level from localStorage for this specific page
    let zoomLevel = parseFloat(localStorage.getItem(zoomStorageKey)) || 1.0;
    
    // Apply saved zoom level to main content only
    mainContent.style.transformOrigin = 'center';
    mainContent.style.transform = `scale(${zoomLevel})`;
    
    // Set zoom parameters
    const ZOOM_STEP = 0.2;
    const ZOOM_INTERVAL = 150; // ms between zoom steps when holding button
    
    let zoomInterval = null;
    
    // Zoom in handlers
    function startZoomIn() {
        // Clear any existing interval first
        stopZoom();
        
        // Perform initial zoom
        zoomLevel += ZOOM_STEP;
        applyZoom();
        
        // Set interval for continuous zooming while button is held
        zoomInterval = setInterval(() => {
            zoomLevel += ZOOM_STEP;
            applyZoom();
        }, ZOOM_INTERVAL);
    }
    
    // Zoom out handlers
    function startZoomOut() {
        // Clear any existing interval first
        stopZoom();
        
        // Perform initial zoom
        zoomLevel -= ZOOM_STEP;
        // Prevent going to zero or negative zoom which would make content invisible
        if (zoomLevel <= 0.05) zoomLevel = 0.05;
        applyZoom();
        
        // Set interval for continuous zooming while button is held
        zoomInterval = setInterval(() => {
            zoomLevel -= ZOOM_STEP;
            // Prevent going to zero or negative zoom which would make content invisible
            if (zoomLevel <= 0.05) zoomLevel = 0.05;
            applyZoom();
        }, ZOOM_INTERVAL);
    }
    
    // Stop zooming
    function stopZoom() {
        if (zoomInterval) {
            clearInterval(zoomInterval);
            zoomInterval = null;
        }
    }
    
    // Add event listeners for mouse and touch
    zoomInButton.addEventListener('mousedown', startZoomIn);
    zoomInButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startZoomIn();
    });
    
    zoomOutButton.addEventListener('mousedown', startZoomOut);
    zoomOutButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startZoomOut();
    });
    
    // Add event listeners to stop zooming
    document.addEventListener('mouseup', stopZoom);
    document.addEventListener('touchend', stopZoom);
    
    // Stop zooming if mouse leaves the button
    zoomInButton.addEventListener('mouseleave', stopZoom);
    zoomOutButton.addEventListener('mouseleave', stopZoom);
    
    // Also add click handlers for better accessibility/compatibility
    zoomInButton.addEventListener('click', (e) => e.preventDefault());
    zoomOutButton.addEventListener('click', (e) => e.preventDefault());
    
    // Apply zoom and save to localStorage with page-specific key
    function applyZoom() {
        mainContent.style.transform = `scale(${zoomLevel})`;
        localStorage.setItem(zoomStorageKey, zoomLevel.toString());
    }
}

// Initialize all common functionality
function initializeCommon() {
    console.log('Initializing common functionality');
    initializeTheme();
    initBackButton();
    initZoom();
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    initializeCommon();
});

// Backup initialization in case DOMContentLoaded has already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready, initializing directly');
    setTimeout(initializeCommon, 1);
}