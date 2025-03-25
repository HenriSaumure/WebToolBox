// Weather API configuration
const BASE_URL = 'https://api.open-meteo.com/v1';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// DOM elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const wind = document.getElementById('wind');
const humidity = document.getElementById('humidity');
const weatherIcon = document.getElementById('weather-icon-img');
const forecastContainer = document.getElementById('forecast-container');
const errorMessage = document.getElementById('error-message');
const autocompleteList = document.createElement('div'); // New element for autocomplete
const loader = document.createElement('div'); // New element for loader

// Add autocomplete list to DOM
autocompleteList.className = 'suggestion-container';
cityInput.parentNode.appendChild(autocompleteList);

// Add loader to DOM
loader.className = 'loader';
loader.innerHTML = '<div class="spinner"></div>';
loader.style.display = 'none';
document.querySelector('.weather-container').appendChild(loader);

// Weather condition codes mapping to descriptions and icons
const weatherCodes = {
    0: { description: "Clear sky", icon: "01d", },
    1: { description: "Mainly clear", icon: "02d" },
    2: { description: "Partly cloudy", icon: "03d" },
    3: { description: "Overcast", icon: "04d" },
    45: { description: "Fog", icon: "50d" },
    48: { description: "Depositing rime fog", icon: "50d" },
    51: { description: "Light drizzle", icon: "09d" },
    53: { description: "Moderate drizzle", icon: "09d" },
    55: { description: "Dense drizzle", icon: "09d" },
    56: { description: "Light freezing drizzle", icon: "09d" },
    57: { description: "Dense freezing drizzle", icon: "09d" },
    61: { description: "Slight rain", icon: "10d" },
    63: { description: "Moderate rain", icon: "10d" },
    65: { description: "Heavy rain", icon: "10d" },
    66: { description: "Light freezing rain", icon: "13d" },
    67: { description: "Heavy freezing rain", icon: "13d" },
    71: { description: "Slight snow fall", icon: "13d" },
    73: { description: "Moderate snow fall", icon: "13d" },
    75: { description: "Heavy snow fall", icon: "13d" },
    77: { description: "Snow grains", icon: "13d" },
    80: { description: "Slight rain showers", icon: "09d" },
    81: { description: "Moderate rain showers", icon: "09d" },
    82: { description: "Violent rain showers", icon: "09d" },
    85: { description: "Slight snow showers", icon: "13d" },
    86: { description: "Heavy snow showers", icon: "13d" },
    95: { description: "Thunderstorm", icon: "11d" },
    96: { description: "Thunderstorm with slight hail", icon: "11d" },
    99: { description: "Thunderstorm with heavy hail", icon: "11d" }
};

// Add CSS for autocomplete and loader
const style = document.createElement('style');
style.textContent = `
    .suggestion-container {
        position: absolute;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        background: white;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        z-index: 100;
        display: none;
        margin-top: 2px;
    }
    .suggestion-item {
        padding: 12px 15px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
        font-size: 14px;
    }
    .suggestion-item:hover {
        background-color: #f8f9fa;
    }
    .suggestion-item:last-child {
        border-bottom: none;
    }
    .loader {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Debounce function to limit API calls
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Function to fetch city suggestions
function fetchCitySuggestions(query) {
    if (!query || query.length < 2) {
        autocompleteList.style.display = 'none';
        return;
    }
    
    fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=5`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Autocomplete API response:', data);
            autocompleteList.innerHTML = '';
            
            if (data.results && data.results.length > 0) {
                data.results.forEach(city => {
                    // Skip Boucherville in autocomplete results
                    if (city.name === 'Boucherville') {
                        return;
                    }
                    
                    const item = setupAutocompleteItem(city);
                    autocompleteList.appendChild(item);
                });
                
                autocompleteList.style.display = 'block';
            } else {
                autocompleteList.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching city suggestions:', error);
            autocompleteList.style.display = 'none';
        });
}

// Add debounced input listener for autocomplete
cityInput.addEventListener('input', debounce(function() {
    fetchCitySuggestions(this.value);
}, 300));

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
    if (e.target !== cityInput && !e.target.classList.contains('suggestion-item')) {
        autocompleteList.style.display = 'none';
    }
});

// Focus event to show suggestions if already typed
cityInput.addEventListener('focus', () => {
    if (cityInput.value.length >= 2) {
        fetchCitySuggestions(cityInput.value);
    }
});

// Event listeners
searchBtn.addEventListener('click', fetchWeatherData);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeatherData();
    }
});

// Local storage functions for saving search history - Improved
function saveLastSearch(city) {
    if (!city || typeof city !== 'string') {
        console.warn(`Invalid city to save: ${city}`);
        return;
    }
    
    console.log(`Saving last search: ${city}`);
    try {
        localStorage.setItem('lastSearchedCity', city);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function getLastSearch() {
    try {
        const lastCity = localStorage.getItem('lastSearchedCity');
        console.log(`Retrieved last search: ${lastCity || 'none'}`);
        return lastCity;
    } catch (e) {
        console.error('Error retrieving from localStorage:', e);
        return null;
    }
}

// Show loader function
function showLoader() {
    if (loader) {
        loader.style.display = 'flex';
    } else {
        console.warn('Loader element not found');
    }
}

// Hide loader function
function hideLoader() {
    if (loader) {
        loader.style.display = 'none';
    } else {
        console.warn('Loader element not found');
    }
}

// Initialize with default city or last searched city - Fixed implementation
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded - initializing weather app');
    
    // Check if all required DOM elements are present
    if (!cityInput || !searchBtn || !cityName || !weatherIcon) {
        console.error('Critical DOM elements missing. Check your HTML structure.');
        return;
    }
    
    // Make city name clickable to focus on search bar
    if (cityName) {
        cityName.addEventListener('click', () => {
            cityInput.focus();
            cityInput.select(); // Select all text in the input
        });
        cityName.title = "Click to change city"; // Add tooltip
    }
    
    // Clear any existing values before loading to prevent issues
    localStorage.removeItem('defaultCity');
    
    // Try to get last search from local storage
    try {
        const lastCity = getLastSearch();
        
        // If we have a last searched city, use it
        if (lastCity && lastCity.trim() !== '') {
            console.log(`Found last search: ${lastCity}, initiating search`);
            cityInput.value = lastCity;
            
            // Use setTimeout to ensure the search happens after the page is fully loaded
            setTimeout(() => {
                try {
                    // Use the exact string from localStorage - don't modify it
                    fetchWeatherData(lastCity);
                } catch (error) {
                    console.error('Error searching with last city:', error);
                    fetchWeatherData('Montreal'); // Fall back to default if there's an error
                }
            }, 100);
            return;
        }
        
        // Check if there's any text already in the search field (e.g. from page refresh)
        const searchFieldValue = cityInput.value.trim();
        if (searchFieldValue) {
            console.log(`Found value in search field: ${searchFieldValue}, initiating search`);
            
            // Use setTimeout to ensure the search happens after the page is fully loaded
            setTimeout(() => {
                try {
                    fetchWeatherData(searchFieldValue);
                } catch (error) {
                    console.error('Error searching with field value:', error);
                    fetchWeatherData('Montreal'); // Fall back to default if there's an error
                }
            }, 100);
            return;
        }
        
        // Otherwise use geolocation or default
        console.log('No saved search found, attempting to use geolocation');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log(`Geolocation success: (${position.coords.latitude}, ${position.coords.longitude})`);
                    fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error(`Geolocation error: ${error.code} - ${error.message}`);
                    console.log('Falling back to default city: Montreal');
                    fetchWeatherData('Montreal'); // Default city
                },
                { timeout: 10000, maximumAge: 600000 } // 10s timeout, 10min cache
            );
        } else {
            console.log('Geolocation not supported, using default city: Montreal');
            fetchWeatherData('Montreal'); // Default city if geolocation not supported
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        // Fall back to default city if there's any error during initialization
        fetchWeatherData('Montreal');
    }
});

// Enhanced version of fetchWeatherByCoords - Ensure it saves the city name properly
function fetchWeatherByCoords(lat, lon, displayName = null) {
    console.log(`Fetching weather by coordinates: (${lat}, ${lon})`);
    showLoader();
    
    // If we already have the display name, we can skip the reverse geocoding
    if (displayName) {
        console.log(`Using provided display name: ${displayName}`);
        cityName.textContent = displayName;
        cityInput.value = displayName;
        
        // Save the name for next time
        saveLastSearch(displayName);
        
        // Fetch weather data using coordinates
        fetch(`${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`)
            .then(response => {
                if (!response.ok) {
                    console.error(`Weather API error: ${response.status} ${response.statusText}`);
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Weather data received:', data);
                updateWeatherData(data);
                if (errorMessage) {
                    hideError();
                }
                hideLoader();
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                if (errorMessage) {
                    showError(error.message || 'Failed to fetch weather data');
                } else {
                    console.error('Error element not found in the DOM');
                }
                hideLoader();
            });
    } else {
        // Original implementation for reverse geocoding
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
            .then(response => {
                if (!response.ok) {
                    console.error(`Reverse geocoding API error: ${response.status} ${response.statusText}`);
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(geoData => {
                console.log('Reverse geocoding response:', geoData);
                
                if (!geoData.city) {
                    console.warn('No city found in reverse geocoding response, using nearest locality');
                    geoData.city = geoData.locality || 'Unknown';
                }
                
                // Make sure we have a country code
                const countryCode = geoData.countryCode || geoData.countryName || '';
                
                // Don't use Boucherville as a default
                const cityDisplayName = `${geoData.city}${countryCode ? ', ' + countryCode : ''}`;
                console.log(`Current location: ${cityDisplayName}`);
                
                // Don't automatically set Boucherville
                if (geoData.city !== 'Boucherville') {
                    cityName.textContent = cityDisplayName;
                    cityInput.value = cityDisplayName;
                    
                    // Save for next visit
                    saveLastSearch(cityDisplayName);
                } else {
                    console.log('Avoiding setting Boucherville as default');
                    throw new Error('Using Montreal instead of Boucherville');
                }
                
                // Fetch weather data using coordinates
                return fetch(`${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            })
            .then(response => {
                if (!response.ok) {
                    console.error(`Weather API error: ${response.status} ${response.statusText}`);
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Weather data received:', data);
                updateWeatherData(data);
                if (errorMessage) {
                    hideError();
                }
                hideLoader();
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                
                // If there was an error and it's about Boucherville, use Montreal
                if (error.message && error.message.includes('Boucherville')) {
                    console.log('Falling back to Montreal');
                    fetchWeatherData('Montreal');
                    return;
                }
                
                if (errorMessage) {
                    showError(error.message || 'Failed to fetch weather data');
                } else {
                    console.error('Error element not found in the DOM');
                }
                hideLoader();
            });
    }
}

// Modify fetchWeatherData to handle complex city names better
function fetchWeatherData(city) {
    // Specifically handle if someone has managed to save Boucherville
    if (city === 'Boucherville, Canada' || city === 'Boucherville, CA') {
        console.log('Detected Boucherville, using Montreal instead');
        localStorage.removeItem('lastSearchedCity');
        city = 'Montreal';
    }
    
    city = city || cityInput.value.trim();
    
    if (!city) {
        console.log('No city provided, skipping search');
        if (errorMessage) {
            showError('Please enter a city name to search');
        }
        return;
    }
    
    console.log(`Fetching weather data for: ${city}`);
    showLoader();
    
    try {
        // Check for Quebec special case
        let searchTerm = city;
        if (city.toLowerCase().includes('quebec') && city.split(',').length > 2) {
            // Handle the special case for Quebec with multiple commas
            console.log('Special case: Quebec with multiple segments detected');
            searchTerm = 'Quebec, Canada';
        }
        
        // First try to geocode the city name to get coordinates
        fetch(`${GEO_URL}?name=${encodeURIComponent(searchTerm)}&count=1`)
            .then(response => {
                if (!response.ok) {
                    console.error(`Geocoding API error: ${response.status} ${response.statusText}`);
                    throw new Error('Network error. Please try again later.');
                }
                return response.json();
            })
            .then(geoData => {
                console.log('Geocoding response:', geoData);
                
                if (!geoData.results || geoData.results.length === 0) {
                    // If we can't find the exact city, try a more flexible search
                    console.warn(`City not found: ${searchTerm}, trying more flexible search`);
                    
                    try {
                        // Extract the first part of the city name (before any comma)
                        const simplifiedCity = typeof searchTerm === 'string' ? searchTerm.split(',')[0].trim() : searchTerm;
                        
                        if (simplifiedCity !== searchTerm) {
                            console.log(`Trying simplified city name: ${simplifiedCity}`);
                            return fetch(`${GEO_URL}?name=${encodeURIComponent(simplifiedCity)}&count=1`);
                        } else {
                            throw new Error(`City "${searchTerm}" not found. Please check spelling and try again.`);
                        }
                    } catch (error) {
                        console.error('Error processing city name:', error);
                        throw new Error(`City "${searchTerm}" not found. Please check spelling and try again.`);
                    }
                }
                
                const location = geoData.results[0];
                
                // Format the city name for display and storage
                // Keep the original format if it came from autocomplete
                let cityDisplayName;
                
                if (city.includes(location.name) && city.includes(location.country)) {
                    // This is likely from autocomplete, keep the original format
                    cityDisplayName = city;
                    console.log(`Using original display name format: ${cityDisplayName}`);
                } else {
                    // Standard format
                    cityDisplayName = `${location.name}, ${location.country}`;
                    console.log(`Using standard display name format: ${cityDisplayName}`);
                }
                
                console.log(`Found location: ${cityDisplayName} (${location.latitude}, ${location.longitude})`);
                
                cityName.textContent = cityDisplayName;
                cityInput.value = cityDisplayName;
                
                // Save search to local storage
                saveLastSearch(cityDisplayName);
                
                // Now fetch the weather using the coordinates
                return fetch(`${BASE_URL}/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            })
            .then(response => {
                // If this is a geocoding retry response, process it differently
                if (response.url && response.url.includes(GEO_URL)) {
                    return response.json().then(data => {
                        if (!data.results || data.results.length === 0) {
                            throw new Error(`City not found. Please check spelling and try again.`);
                        }
                        
                        const location = data.results[0];
                        
                        // Keep original name if available
                        let cityDisplayName;
                        if (city.includes(location.name)) {
                            cityDisplayName = city;
                        } else {
                            cityDisplayName = `${location.name}, ${location.country}`;
                        }
                        
                        console.log(`Found location with simplified search: ${cityDisplayName}`);
                        
                        cityName.textContent = cityDisplayName;
                        cityInput.value = cityDisplayName;
                        
                        // Save search to local storage - preserve original format when possible
                        saveLastSearch(cityDisplayName);
                        
                        // Now fetch the weather using the coordinates
                        return fetch(`${BASE_URL}/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
                    });
                }
                
                // Regular weather API response
                if (!response.ok) {
                    console.error(`Weather API error: ${response.status} ${response.statusText}`);
                    throw new Error('Weather service unavailable. Please try again later.');
                }
                return response.json();
            })
            .then(data => {
                // Make sure we're handling a weather data object, not response
                if (typeof data === 'object' && data.toString() === '[object Response]') {
                    console.log('Received Response object instead of data, getting JSON');
                    return data.json();
                }
                
                // If this is still a geocoding response, process it differently
                if (data.results && data.generationtime_ms && !data.current) {
                    throw new Error('Unable to retrieve weather data. Please try a different city.');
                }
                
                console.log('Weather data received:', data);
                updateWeatherData(data);
                if (errorMessage) {
                    hideError();
                }
                hideLoader();
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                if (errorMessage) {
                    // Provide user-friendly error messages
                    if (error.message.includes('split')) {
                        showError('Invalid city format. Please try a different search.');
                    } else if (error.message.includes('undefined')) {
                        showError('Something went wrong. Please try again.');
                    } else {
                        showError(error.message || 'Failed to fetch weather data');
                    }
                } else {
                    console.error('Error element not found in the DOM');
                }
                hideLoader();
            });
    } catch (outerError) {
        console.error('Outer error in fetchWeatherData:', outerError);
        if (errorMessage) {
            showError('Something went wrong. Please try again.');
        }
        hideLoader();
    }
}

// Update the updateWeatherData function to handle Response objects better
function updateWeatherData(data) {
    try {
        // Check if we have a Response object instead of data
        if (data instanceof Response) {
            console.log('Data is a Response object, extracting JSON');
            data.json().then(jsonData => {
                updateWeatherData(jsonData);
            }).catch(error => {
                console.error('Error extracting JSON from Response:', error);
                throw new Error('Invalid weather data format');
            });
            return;
        }
        
        // Check if we have the required data
        if (!data || !data.current || !data.daily) {
            console.error('Invalid weather data format:', data);
            throw new Error('Invalid weather data received');
        }
        
        // Format date
        const date = new Date();
        currentDate.textContent = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Update current weather
        const currentTemp = Math.round(data.current.temperature_2m);
        temperature.textContent = `${currentTemp}°`;
        
        const weatherCode = data.current.weather_code;
        const weatherInfo = weatherCodes[weatherCode] || { description: "Unknown", icon: "50d" };
        
        description.textContent = weatherInfo.description;
        weatherIcon.src = `https://openweathermap.org/img/wn/${weatherInfo.icon}@4x.png`;
        
        // Update wind and humidity
        wind.textContent = `${Math.round(data.current.wind_speed_10m)} km/h`;
        humidity.textContent = `${data.current.relative_humidity_2m}%`;
        
        // Update forecast
        updateForecast(data.daily);
        
        console.log('Weather UI updated successfully');
    } catch (error) {
        console.error('Error updating weather UI:', error);
        if (errorMessage) {
            showError('Error displaying weather data. Please try again.');
        }
    }
}

// Update the function that handles autocomplete selection to preserve format
function setupAutocompleteItem(city) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    
    // Format display name with more details for disambiguation
    let displayName = city.name;
    
    // Include admin1 (state/province) for Canada, USA and larger countries
    if (city.admin1 && ['Canada', 'United States of America', 'Russia', 'China', 'Brazil', 'India'].includes(city.country)) {
        displayName += `, ${city.admin1}`;
    }
    
    if (city.country) displayName += `, ${city.country}`;
    
    item.textContent = displayName;
    
    // Store the location data as a data attribute
    item.dataset.lat = city.latitude;
    item.dataset.lon = city.longitude;
    item.dataset.name = city.name;
    item.dataset.country = city.country;
    item.dataset.admin1 = city.admin1 || '';
    
    item.addEventListener('click', () => {
        // Use the exact coordinates for weather lookup instead of name
        cityInput.value = displayName;
        autocompleteList.style.display = 'none';
        
        // Use coordinates directly to avoid geocoding again
        fetchWeatherByCoords(city.latitude, city.longitude, displayName);
    });
    
    return item;
}

// Function to update forecast
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Process daily forecast data
    for (let i = 0; i < 5 && i < data.time.length; i++) {
        const date = new Date(data.time[i]);
        const dayName = getDayName(date);
        const maxTemp = Math.round(data.temperature_2m_max[i]);
        const minTemp = Math.round(data.temperature_2m_min[i]);
        const weatherCode = data.weather_code[i];
        const iconCode = weatherCodes[weatherCode]?.icon || "04d";
        const weatherDesc = weatherCodes[weatherCode]?.description || "Unknown weather";
        
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${weatherDesc}">
            </div>
            <div class="forecast-temp">${maxTemp}°C</div>
            <div class="forecast-min-temp">${minTemp}°C</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    }
}

// Helper functions
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Show error message with improved styling
function showError(message = 'An error occurred. Please try again.') {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Scroll to error message if it's not visible
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        console.error('Error element not found when showing error:', message);
        // Create an error element if it doesn't exist
        const newErrorMessage = document.createElement('div');
        newErrorMessage.id = 'error-message';
        newErrorMessage.className = 'error-message';
        newErrorMessage.textContent = message;
        newErrorMessage.style.display = 'block';
        
        // Try to append it to the weather container
        const weatherContainer = document.querySelector('.weather-container');
        if (weatherContainer) {
            weatherContainer.appendChild(newErrorMessage);
        } else {
            // Last resort - append to body
            document.body.appendChild(newErrorMessage);
        }
    }
}

// Hide error message
function hideError() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    } else {
        console.warn('Error element not found when hiding error');
    }
}
