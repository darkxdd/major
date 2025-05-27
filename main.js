// Cache DOM elements that are frequently accessed or used across multiple functions
let disclaimerBanner, closeDisclaimerButton, apiErrorBanner, apiErrorText, retryApiConnectionButton;
let chatInputContainerGlobal, sidebarGlobal; // For elements used in specific init/handler functions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cached elements after DOM is loaded
    disclaimerBanner = document.querySelector('.disclaimer-banner');
    closeDisclaimerButton = document.getElementById('close-disclaimer');
    apiErrorBanner = document.getElementById('api-error-banner');
    apiErrorText = document.getElementById('api-error-text');
    retryApiConnectionButton = document.getElementById('retry-api-connection');
    chatInputContainerGlobal = document.querySelector('.chat-input-container');
    sidebarGlobal = document.querySelector('.sidebar');

    initAuth(); // Assumes auth.js might use some global selectors if not self-contained
    initNavigation();
    initDarkMode();

    if (disclaimerBanner && closeDisclaimerButton) {
        if (localStorage.getItem('disclaimerDismissed')) {
            disclaimerBanner.style.display = 'none';
        }

        closeDisclaimerButton.addEventListener('click', function() {
            disclaimerBanner.style.display = 'none';
            localStorage.setItem('disclaimerDismissed', 'true');
        });
    }

    document.addEventListener('gradioApiReady', handleApiReady);
});

function handleApiReady(event) {
    const { status, error } = event.detail;
    if (status) {
        hideApiError(); 
    } else {
        showApiError(); 
    }
}

function showApiError(message = "We're experiencing technical difficulties connecting to our AI services. Please try again later.") {
    // apiErrorBanner, apiErrorText, retryApiConnectionButton are now module-scoped variables
    if (!apiErrorBanner || !apiErrorText || !retryApiConnectionButton) {
        return;
    }

    apiErrorText.textContent = message;
    apiErrorBanner.style.display = 'block';

    if (!retryApiConnectionButton.dataset.listenerAttached) {
        retryApiConnectionButton.addEventListener('click', async function() {
            apiErrorBanner.style.display = 'none'; 
            try {
                if (!window.gradioApi) {
                    showApiError("Initialization error. Please refresh.");
                    return;
                }
                const success = await window.gradioApi.test(true); 
                if (success) {
                    hideApiError();
                } else {
                    showApiError(); 
                }
            } catch (err) {
                showApiError(); 
            }
        });
        retryApiConnectionButton.dataset.listenerAttached = 'true';
    }
}

function hideApiError() {
    // apiErrorBanner is a module-scoped variable
    if (apiErrorBanner) {
        apiErrorBanner.style.display = 'none';
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item'); // Queried once per init, acceptable
    const pages = document.querySelectorAll('.page'); // Queried once per init, acceptable
    // chatInputContainerGlobal is now a module-scoped variable
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
            
            pages.forEach(page => {
                if (page.id === targetPage + '-page') {
                    page.classList.remove('hidden');
                    if (targetPage === 'chatbot') {
                        if (chatInputContainerGlobal) chatInputContainerGlobal.classList.remove('hidden');
                    } else {
                        if (chatInputContainerGlobal) chatInputContainerGlobal.classList.add('hidden');
                    }
                    if (targetPage === 'history') {
                        displayPredictionHistory();
                    }
                    if (targetPage === 'chatbot') {
                        const chatMessages = document.getElementById('chat-messages'); // Specific to this block, acceptable
                        if (chatMessages && chatMessages.children.length === 0) {
                            if (typeof initializeChatUI === 'function') {
                                initializeChatUI();
                            } else if (typeof chatHistory !== 'undefined' && chatHistory && chatHistory.length > 0) {
                                addBotMessage(chatHistory[0][0]); // Assumes addBotMessage is globally available or defined elsewhere
                            }
                        }
                    }
                } else {
                    page.classList.add('hidden');
                }
            });
        });
    });
    
    // Initialize emergency dropdown toggle
    initEmergencyDropdown();
}

window.addEventListener('resize', function() {
    handleResponsiveLayout();
});

function handleResponsiveLayout() {
    // sidebarGlobal is now a module-scoped variable
    const menuToggleCurrent = document.querySelector('.menu-toggle'); // menuToggle is dynamic

    if (window.innerWidth <= 768) {
        if (!menuToggleCurrent) {
            const menuToggle = document.createElement('button');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.appendChild(menuToggle);
            
            menuToggle.addEventListener('click', function() {
                if (sidebarGlobal) sidebarGlobal.classList.toggle('active');
            });
            
            document.addEventListener('click', function(event) {
                const currentMenuToggle = document.querySelector('.menu-toggle'); // Re-query as it might have been removed
                if (sidebarGlobal && currentMenuToggle && 
                    !sidebarGlobal.contains(event.target) && 
                    event.target !== currentMenuToggle && 
                    !currentMenuToggle.contains(event.target)) {
                    sidebarGlobal.classList.remove('active');
                }
            });
        }
    } else {
        if (menuToggleCurrent) {
            menuToggleCurrent.remove();
        }
        if (sidebarGlobal) {
            sidebarGlobal.classList.remove('active');
        }
    }
}

handleResponsiveLayout(); // Initial call

function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle'); // Specific to this function
    const body = document.body; // Specific to this function
    const toggleIcon = darkModeToggle ? darkModeToggle.querySelector('i') : null; // Specific to this function
    const storageKey = 'themePreference';

    // Function to set the theme
    const setTheme = (isDark) => {
        body.classList.toggle('dark-mode', isDark);
        toggleIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
    };

    // Get saved preference or system preference
    const savedPreference = localStorage.getItem(storageKey);
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine initial theme
    let currentThemeIsDark;
    if (savedPreference) {
        currentThemeIsDark = savedPreference === 'dark';
    } else {
        currentThemeIsDark = systemPrefersDark; // Default to system preference if no save
    }

    // Apply the initial theme
    setTheme(currentThemeIsDark);

    // Add event listener to the toggle button
    darkModeToggle.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-mode');
        setTheme(!isDark); // Toggle the theme
    });
}

function initEmergencyDropdown() {
    const emergencyToggle = document.getElementById('emergency-toggle');
    const emergencyDropdown = document.getElementById('emergency-dropdown');
    const toggleIcon = document.querySelector('.emergency-toggle-icon');
    
    // Check if dropdown should be open based on localStorage
    const isOpen = localStorage.getItem('emergencyDropdownOpen') === 'true';
    if (isOpen) {
        emergencyDropdown.classList.add('active');
        toggleIcon.classList.add('active');
    } else {
        // Ensure dropdown is fully closed by default
        emergencyDropdown.classList.remove('active');
        toggleIcon.classList.remove('active');
    }
    
    emergencyToggle.addEventListener('click', function() {
        emergencyDropdown.classList.toggle('active');
        toggleIcon.classList.toggle('active');
        
        // Store dropdown state
        const isNowOpen = emergencyDropdown.classList.contains('active');
        localStorage.setItem('emergencyDropdownOpen', isNowOpen);
    });
}
