function initAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser.name || currentUser.email;
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }
}

document.getElementById('show-signup').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('signup-card').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('signup-card').style.display = 'none';
    document.getElementById('login-card').style.display = 'block';
});

document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorElement = document.getElementById('signup-error');
    
    if (!email || !password) {
        errorElement.textContent = 'Email and password are required';
        return;
    }
    
    if (password.length < 8) {
        errorElement.textContent = 'Password must be at least 8 characters long';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
        errorElement.textContent = 'An account with this email already exists';
        return;
    }
    
    const newUser = { name, email, password: password }; 
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    document.getElementById('signup-form').reset();
    errorElement.textContent = '';
    
    const userPredictions = {
        email: email,
        predictions: []
    };
    saveUserPredictions(userPredictions);
    
    initAuth();
});

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!email || !password) {
        errorElement.textContent = 'Email and password are required';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password); 
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        document.getElementById('login-form').reset();
        errorElement.textContent = '';
        
        initAuth();
    } else {
        errorElement.textContent = 'Invalid email or password';
    }
});

document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    
    sessionStorage.removeItem('chatHistory');
    
    if (typeof clearChatHistory === 'function') {
        clearChatHistory();
    } else {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }
    
    initAuth();
});

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
