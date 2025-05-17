document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initNavigation();
    initDarkMode();

    const disclaimer = document.querySelector('.disclaimer-banner');
    const closeBtn = document.getElementById('close-disclaimer');

    if (localStorage.getItem('disclaimerDismissed')) {
        disclaimer.style.display = 'none';
    }

    closeBtn.addEventListener('click', function() {
        disclaimer.style.display = 'none';
        localStorage.setItem('disclaimerDismissed', 'true');
    });

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
    const errorBanner = document.getElementById('api-error-banner');
    const errorText = document.getElementById('api-error-text');
    const retryButton = document.getElementById('retry-api-connection');

    if (!errorBanner || !errorText || !retryButton) {
        return;
    }

    errorText.textContent = message;
    errorBanner.style.display = 'block';

    if (!retryButton.dataset.listenerAttached) {
        retryButton.addEventListener('click', async function() {
            errorBanner.style.display = 'none'; 
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
        retryButton.dataset.listenerAttached = 'true';
    }
}

function hideApiError() {
    const errorBanner = document.getElementById('api-error-banner');
    if (errorBanner) {
        errorBanner.style.display = 'none';
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
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
                        document.querySelector('.chat-input-container').classList.remove('hidden');
                    } else {
                        document.querySelector('.chat-input-container').classList.add('hidden');
                    }
                    if (targetPage === 'history') {
                        displayPredictionHistory();
                    }
                    if (targetPage === 'chatbot') {
                        const chatMessages = document.getElementById('chat-messages');
                        if (chatMessages.children.length === 0) {
                            if (typeof initializeChatUI === 'function') {
                                initializeChatUI();
                            } else if (typeof chatHistory !== 'undefined' && chatHistory && chatHistory.length > 0) {
                                addBotMessage(chatHistory[0][0]);
                            }
                        }
                    }
                } else {
                    page.classList.add('hidden');
                }
            });
        });
    });
}

window.addEventListener('resize', function() {
    handleResponsiveLayout();
});

function handleResponsiveLayout() {
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.menu-toggle')) {
            const menuToggle = document.createElement('button');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.appendChild(menuToggle);
            
            menuToggle.addEventListener('click', function() {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('active');
            });
            
            document.addEventListener('click', function(event) {
                const sidebar = document.querySelector('.sidebar');
                const menuToggle = document.querySelector('.menu-toggle');
                
                if (sidebar && menuToggle && !sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    } else {
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.remove();
        }
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
}

handleResponsiveLayout();

function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const toggleIcon = darkModeToggle.querySelector('i');
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
