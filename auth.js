// Auth related functionality

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
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
        errorElement.textContent = 'An account with this email already exists';
        return;
    }
    
    // Create new user
    const newUser = { name, email, password };
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
    const user = users.find(u => u.email === email && u.password === password);
    
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
