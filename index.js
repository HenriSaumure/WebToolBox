// Navigation options data
const navOptions = [
    {
        id: 'timer',
        name: 'Timer',
        icon: 'fa-hourglass-half',
        description: 'Simple countdown timer',
        url: 'timer.html'
    },
    {
        id: 'clock',
        name: 'Clock',
        icon: 'fa-clock',
        description: 'Digital clock display',
        url: 'clock.html'
    },
    {
        id: 'weather',
        name: 'Weather',
        icon: 'fa-cloud-sun',
        description: 'Current weather information',
        url: 'weather.html'
    },
    // Add other tools as needed
];

// DOM elements
const searchBox = document.getElementById('search-box');
const suggestionsContainer = document.getElementById('suggestions');
const navButtonsContainer = document.getElementById('nav-buttons');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    
    // Clear search field on page load
    if (searchBox) {
        searchBox.value = '';
    }
    
    generateToolCards(navOptions);
    setupSearch();
});

// Setup search functionality
function setupSearch() {
    if (!searchBox || !suggestionsContainer) return; // Guard clause if elements don't exist
    
    // Search input event
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        
        if (searchTerm.length > 0) {
            // Filter options based on search term
            const filteredOptions = navOptions.filter(option => 
                option.name.toLowerCase().includes(searchTerm) || 
                option.description.toLowerCase().includes(searchTerm)
            );
            
            // Update the tool grid with filtered results
            generateToolCards(filteredOptions, true);
            
            // Show suggestions
            showSuggestions(filteredOptions);
        } else {
            // Show all tools when search is empty
            generateToolCards(navOptions, true);
            hideSuggestions();
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target !== searchBox && event.target !== suggestionsContainer) {
            hideSuggestions();
        }
    });
    
    // Focus event to show suggestions
    searchBox.addEventListener('focus', () => {
        if (searchBox.value.length > 0) {
            const filteredOptions = navOptions.filter(option => 
                option.name.toLowerCase().includes(searchBox.value.toLowerCase()) || 
                option.description.toLowerCase().includes(searchBox.value.toLowerCase())
            );
            showSuggestions(filteredOptions);
        }
    });
    
    // Clear search field when page is reloaded
    window.addEventListener('beforeunload', () => {
        searchBox.value = '';
    });
}

// Show suggestions dropdown
function showSuggestions(options) {
    suggestionsContainer.innerHTML = '';
    
    if (options.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    options.forEach(option => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = option.name;
        
        // Direct navigation to the tool page when clicked
        suggestionItem.addEventListener('click', () => {
            window.location.href = option.url;
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = 'block';
}

// Hide suggestions dropdown
function hideSuggestions() {
    suggestionsContainer.style.display = 'none';
}

// Generate tool cards
function generateToolCards(options, clearFirst = false) {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return; // Guard clause if element doesn't exist
    
    // Clear existing cards if specified
    if (clearFirst) {
        toolsGrid.innerHTML = '';
    }
    
    options.forEach(tool => {
        const toolCard = document.createElement('a');
        toolCard.href = tool.url;
        toolCard.classList.add('tool-card');
        toolCard.setAttribute('data-tool-id', tool.id);
        
        toolCard.innerHTML = `
            <div class="tool-icon">
                <i class="fas ${tool.icon}"></i>
            </div>
            <div class="tool-info">
                <h2>${tool.name}</h2>
                <p>${tool.description}</p>
            </div>
        `;
        
        toolsGrid.appendChild(toolCard);
    });
    
    // Show empty state if no tools
    if (options.length === 0 && clearFirst) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-search"></i>
            <p>No tools found. Try a different search.</p>
        `;
        toolsGrid.appendChild(emptyState);
    }
}
