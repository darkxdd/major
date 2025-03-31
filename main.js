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
    let errorBanner = document.getElementById('api-error-banner');
    
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'api-error-banner';
        errorBanner.className = 'api-error-banner';
        errorBanner.style.display = 'none'; // Initially hidden
        document.body.appendChild(errorBanner);

        errorBanner.innerHTML = `
            <div class="api-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p id="api-error-text"></p> 
                <button class="retry-btn" id="retry-api-connection">Retry Connection</button>
            </div>
        `;
        
        // Add retry button functionality
        document.getElementById('retry-api-connection').addEventListener('click', async function() {
            errorBanner.style.display = 'none'; // Hide banner while retrying
            console.log("Retrying API connection...");
            try {
                // Ensure gradioApi is available before testing
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
    }
    
    // Update message and show banner
    document.getElementById('api-error-text').textContent = message;
    errorBanner.style.display = 'block';
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
                    
                    // Load prediction history if history page is selected
                    if (targetPage === 'history') {
                        displayPredictionHistory();
                    }
                    
                    // Display initial chat message if chat page is selected and messages are empty
                    if (targetPage === 'chatbot') {
                        const chatMessages = document.getElementById('chat-messages');
                        if (chatMessages.children.length === 0 && chatHistory && chatHistory.length > 0) {
                            addBotMessage(chatHistory[0][0]);
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
                
                if (!sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
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
        document.querySelector('.sidebar').classList.remove('active');
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
