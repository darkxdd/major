// Cache DOM elements at module scope
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userNameElement = document.getElementById('user-name');
const loginCard = document.getElementById('login-card');
const signupCard = document.getElementById('signup-card');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const logoutButton = document.getElementById('logout-btn');
const passwordToggles = document.querySelectorAll('.toggle-password');

// Input fields - these are typically accessed for their value within event listeners,
// so caching them at module scope is fine, or they could be queried inside if preferred for locality.
const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');


function initAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        if (authContainer) authContainer.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        if (userNameElement) userNameElement.textContent = currentUser.name || currentUser.email;
    } else {
        if (authContainer) authContainer.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
    }
}

if (showSignupLink) {
    showSignupLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (loginCard) loginCard.style.display = 'none';
        if (signupCard) signupCard.style.display = 'block';
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (signupCard) signupCard.style.display = 'none';
        if (loginCard) loginCard.style.display = 'block';
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = signupNameInput.value;
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        // errorElement (signupError) is already cached
        
        if (!email || !password) {
            if (signupError) signupError.textContent = 'Email and password are required';
            return;
        }
        
        if (password.length < 8) {
            if (signupError) signupError.textContent = 'Password must be at least 8 characters long';
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(user => user.email === email)) {
            if (signupError) signupError.textContent = 'An account with this email already exists';
            return;
        }
        
        const newUser = { name, email, password: password }; 
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        signupForm.reset();
        if (signupError) signupError.textContent = '';
        
        const userPredictions = {
            email: email,
            predictions: []
        };
        saveUserPredictions(userPredictions); // Assumes global function
        
        initAuth();
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        // errorElement (loginError) is already cached
        
        if (!email || !password) {
            if (loginError) loginError.textContent = 'Email and password are required';
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password); 
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            loginForm.reset();
            if (loginError) loginError.textContent = '';
            
            initAuth();
        } else {
            if (loginError) loginError.textContent = 'Invalid email or password';
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        
        sessionStorage.removeItem('chatHistory');
        
        if (typeof clearChatHistory === 'function') {
            clearChatHistory();
        } else {
            // Fallback if clearChatHistory is not available (e.g. if chat.js hasn't loaded)
            const chatMessages = document.getElementById('chat-messages'); // Query here as it's a fallback
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
        }
        
        initAuth();
    });
}

if (passwordToggles) {
    passwordToggles.forEach(icon => {
        icon.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
}
