// Main application functionality

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication (should run regardless of API status)
    initAuth();
    
    // Set up navigation
    initNavigation();

    // Initialize dark mode toggle
    initDarkMode();

    // Handle disclaimer dismissal
    const disclaimer = document.querySelector('.disclaimer-banner');
    const closeBtn = document.getElementById('close-disclaimer');

    // Check if user has previously dismissed the disclaimer
    if (localStorage.getItem('disclaimerDismissed')) {
        disclaimer.style.display = 'none';
    }

    // Handle close button click
    closeBtn.addEventListener('click', function() {
        disclaimer.style.display = 'none';
        localStorage.setItem('disclaimerDismissed', 'true');
    });

    // Listen for the API readiness event from gradio.js
    document.addEventListener('gradioApiReady', handleApiReady);
});

// Handle the result of the initial API test
function handleApiReady(event) {
    const { status, error } = event.detail;
    if (status) {
        console.log("API status check (event): API is ready and working.");
        hideApiError(); // Ensure error banner is hidden if it was shown
    } else {
        console.warn("API status check (event): API failed initial test.", error);
        showApiError(); // Show error banner
    }
    // Remove the listener after first check if needed, though it's likely harmless to keep
    // document.removeEventListener('gradioApiReady', handleApiReady);
}

// Show an API error message to the user
function showApiError(message = "We're experiencing technical difficulties connecting to our AI services. Please try again later.") {
    const errorBanner = document.getElementById('api-error-banner');
    const errorText = document.getElementById('api-error-text');
    const retryButton = document.getElementById('retry-api-connection');

    if (!errorBanner || !errorText || !retryButton) {
        console.error('API error banner elements not found in the DOM.');
        return;
    }

    // Update message and show banner
    errorText.textContent = message;
    errorBanner.style.display = 'block';

    // Ensure retry button listener is attached (or re-attach if necessary, though ideally once)
    // To prevent multiple listeners, we can remove it first if it might be called multiple times
    // For simplicity here, assuming it's set up once or the event listener handles duplicates gracefully.
    // If this function can be called multiple times leading to multiple listeners on retryButton,
    // consider adding a flag or removing the listener before adding it.
    if (!retryButton.dataset.listenerAttached) {
        retryButton.addEventListener('click', async function() {
            errorBanner.style.display = 'none'; // Hide banner while retrying
            console.log("Retrying API connection...");
            try {
                if (!window.gradioApi) {
                    console.error("Cannot retry: gradioApi not found.");
                    showApiError("Initialization error. Please refresh.");
                    return;
                }
                const success = await window.gradioApi.test(true); // Force re-test
                if (success) {
                    console.log("API connection successful on retry.");
                    hideApiError();
                } else {
                    console.warn("API connection failed on retry.");
                    showApiError(); // Show error again
                }
            } catch (err) {
                console.error("Error during API retry:", err);
                showApiError(); // Show error again
            }
        });
        retryButton.dataset.listenerAttached = 'true';
    }
}

// Hide the API error banner
function hideApiError() {
    const errorBanner = document.getElementById('api-error-banner');
    if (errorBanner) {
        errorBanner.style.display = 'none';
    }
}

// Initialize navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // Update active nav item
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show selected page, hide others
            pages.forEach(page => {
                if (page.id === targetPage + '-page') {
                    page.classList.remove('hidden');
                    // Show chat input only on chatbot page
                    if (targetPage === 'chatbot') {
                        document.querySelector('.chat-input-container').classList.remove('hidden');
                    } else {
                        document.querySelector('.chat-input-container').classList.add('hidden');
                    }
                    // Load prediction history if history page is selected
                    if (targetPage === 'history') {
                        displayPredictionHistory();
                    }
                    // Display initial chat message if chat page is selected and messages are empty
                    if (targetPage === 'chatbot') {
                        const chatMessages = document.getElementById('chat-messages');
                        // Initialize chat UI if it's empty and we have a chat.js initializeChatUI function
                        if (chatMessages.children.length === 0) {
                            if (typeof initializeChatUI === 'function') {
                                initializeChatUI();
                            } else if (typeof chatHistory !== 'undefined' && chatHistory && chatHistory.length > 0) {
                                // Fallback to old method if initializeChatUI isn't available
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

// Add responsive menu toggle for mobile
window.addEventListener('resize', function() {
    handleResponsiveLayout();
});

function handleResponsiveLayout() {
    if (window.innerWidth <= 768) {
        // Mobile layout
        if (!document.querySelector('.menu-toggle')) {
            const menuToggle = document.createElement('button');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.appendChild(menuToggle);
            
            menuToggle.addEventListener('click', function() {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', function(event) {
                const sidebar = document.querySelector('.sidebar');
                const menuToggle = document.querySelector('.menu-toggle');
                
                if (sidebar && menuToggle && !sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    } else {
        // Desktop layout
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

// Initial call to handle responsive layout
handleResponsiveLayout();

// Initialize Dark Mode Toggle
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
