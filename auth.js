// Auth related functionality

// WARNING: Client-side password handling is insecure!
// Passwords should ALWAYS be sent securely (HTTPS) to a server
// and hashed server-side using a strong, salted algorithm (like bcrypt or Argon2).
// Storing plain text or weakly hashed passwords in localStorage is a major security risk.
// This function is removed as it provides a false sense of security.
/*
function hashPassword(password) { 
    // ... insecure hashing logic removed ...
}
*/

// Initialize authentication state
function initAuth() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // User is logged in, show the app
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser.name || currentUser.email;
    } else {
        // User is not logged in, show the login page
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }
}

// Show sign up form
document.getElementById('show-signup').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('signup-card').style.display = 'block';
});

// Show login form
document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('signup-card').style.display = 'none';
    document.getElementById('login-card').style.display = 'block';
});

// Handle signup form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorElement = document.getElementById('signup-error');
    
    // Simple validation
    if (!email || !password) {
        errorElement.textContent = 'Email and password are required';
        return;
    }
    
    // Password strength validation
    if (password.length < 8) {
        errorElement.textContent = 'Password must be at least 8 characters long';
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
        errorElement.textContent = 'An account with this email already exists';
        return;
    }
    
    // WARNING: Storing plain text password in localStorage is highly insecure!
    // In a real application, send the password to the server for secure hashing and storage.
    const newUser = { name, email, password: password }; // Storing plain text for demo - VERY INSECURE
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set current user and log in
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // Clear form and error
    document.getElementById('signup-form').reset();
    errorElement.textContent = '';
    
    // Initialize user's prediction history
    const userPredictions = {
        email: email,
        predictions: []
    };
    saveUserPredictions(userPredictions);
    
    // Show the app
    initAuth();
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Simple validation
    if (!email || !password) {
        errorElement.textContent = 'Email and password are required';
        return;
    }
    
    // Check credentials
    const users = JSON.parse(localStorage.getItem('users')) || [];
    // WARNING: Comparing plain text password from localStorage is highly insecure!
    // In a real application, send the password to the server for secure comparison.
    const user = users.find(u => u.email === email && u.password === password); // Comparing plain text for demo - VERY INSECURE
    
    if (user) {
        // Set current user and log in
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Clear form and error
        document.getElementById('login-form').reset();
        errorElement.textContent = '';
        
        // Show the app
        initAuth();
    } else {
        errorElement.textContent = 'Invalid email or password';
    }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', function() {
    // Remove current user from storage
    localStorage.removeItem('currentUser');
    
    // Clear chat history from session storage
    sessionStorage.removeItem('chatHistory');
    
    // If chat.js clearChatHistory function exists, call it to clear UI and server history
    if (typeof clearChatHistory === 'function') {
        clearChatHistory();
    } else {
        // Fallback: just clear the chat messages UI
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }
    
    // Show login page
    initAuth();
});

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
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
