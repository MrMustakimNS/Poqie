// Complete Login System
class LoginSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkURLParams();
        this.setupPasswordToggles();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin();
            } else if (e.target.id === 'signupForm') {
                e.preventDefault();
                this.handleSignup();
            }
        });

        // Toggle between login/signup
        const authToggle = document.getElementById('authToggle');
        if (authToggle) {
            authToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForm();
            });
        }

        // Auto-fill from URL parameters
        this.autoFillFromURL();
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'signup') {
            this.showSignupForm();
        }
    }

    setupPasswordToggles() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-password')) {
                const toggle = e.target.closest('.toggle-password');
                const input = toggle.closest('.password-input').querySelector('input');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                toggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            }
        });
    }

    autoFillFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const password = urlParams.get('password');

        if (email) {
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.value = decodeURIComponent(email);
        }

        if (password) {
            const passwordInput = document.getElementById('password');
            if (passwordInput) passwordInput.value = decodeURIComponent(password);
        }
    }

    toggleAuthForm() {
        const isLogin = document.getElementById('authTitle').textContent.includes('Welcome');
        
        if (isLogin) {
            this.showSignupForm();
            window.history.pushState({}, '', '?action=signup');
        } else {
            this.showLoginForm();
            window.history.pushState({}, '', 'login.html');
        }
    }

    showSignupForm() {
        document.getElementById('authTitle').textContent = 'Create Account';
        document.getElementById('authSubtitle').textContent = 'Join thousands securing their URLs';
        document.getElementById('authButton').innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        document.getElementById('authFooterText').innerHTML = 'Already have an account? <a href="#" id="authToggle">Sign in</a>';
        
        // Add confirm password field if not exists
        if (!document.getElementById('confirmPassword')) {
            const passwordGroup = document.querySelector('.password-input').closest('.form-group');
            const confirmPasswordHTML = `
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <div class="password-input">
                        <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="Confirm your password">
                        <button type="button" class="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `;
            passwordGroup.insertAdjacentHTML('afterend', confirmPasswordHTML);
        }
        
        document.getElementById('authForm').id = 'signupForm';
    }

    showLoginForm() {
        document.getElementById('authTitle').textContent = 'Welcome Back';
        document.getElementById('authSubtitle').textContent = 'Sign in to your secure URL shortener account';
        document.getElementById('authButton').innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        document.getElementById('authFooterText').innerHTML = 'Don\'t have an account? <a href="#" id="authToggle">Sign up</a>';
        
        // Remove confirm password field
        const confirmPasswordGroup = document.querySelectorAll('.form-group')[2];
        if (confirmPasswordGroup && document.getElementById('confirmPassword')) {
            confirmPasswordGroup.remove();
        }
        
        document.getElementById('authForm').id = 'loginForm';
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('authButton');
        const errorDiv = document.getElementById('errorMessage');

        // Basic validation
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        try {
            this.setLoadingState(submitBtn, true);
            this.hideError();

            console.log('Attempting login with:', email);
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('✅ Login successful:', user.email);
            
            this.showNotification('🎉 Successfully signed in! Redirecting...', 'success');
            
            // Update user's last login
            await this.updateUserLastLogin(user.uid);
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleSignup() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const submitBtn = document.getElementById('authButton');
        const errorDiv = document.getElementById('errorMessage');

        // Validation
        if (!email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (!this.isStrongPassword(password)) {
            this.showError('Password must be at least 8 characters with uppercase, lowercase letters and numbers');
            return;
        }

        try {
            this.setLoadingState(submitBtn, true);
            this.hideError();

            console.log('Creating account for:', email);
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('✅ Account created:', user.email);
            
            // Create user profile
            await this.createUserProfile(user);
            
            this.showNotification('🎉 Account created successfully!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Signup error:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async createUserProfile(user) {
        const userData = {
            email: user.email,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            profile: {
                displayName: user.email.split('@')[0],
                avatar: null
            },
            settings: {
                theme: 'dark',
                notifications: true,
                security: {
                    twoFactor: false,
                    loginAlerts: true
                }
            },
            stats: {
                linksCreated: 0,
                totalClicks: 0
            }
        };

        try {
            await db.ref(`users/${user.uid}`).set(userData);
            console.log('✅ User profile created');
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async updateUserLastLogin(uid) {
        try {
            await db.ref(`users/${uid}/lastLogin`).set(new Date().toISOString());
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    handleAuthError(error) {
        let errorMessage = 'An error occurred during authentication';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many attempts. Please try again later';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled';
                break;
            default:
                errorMessage = error.message || 'Authentication failed';
        }

        this.showError(errorMessage);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        // Also show notification
        this.showNotification(message, 'error');
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    setLoadingState(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
        }
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isStrongPassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    checkAuthState() {
        auth.onAuthStateChanged((user) => {
            const currentPage = window.location.pathname.split('/').pop();
            
            if (user) {
                console.log('User is signed in:', user.email);
                // If user is on login page but already signed in, redirect to dashboard
                if (currentPage === 'login.html') {
                    console.log('Redirecting to dashboard...');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } else {
                console.log('User is signed out');
                // If user is on dashboard but not signed in, redirect to login
                if (currentPage === 'dashboard.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Test function to check current auth state
    getCurrentUser() {
        return auth.currentUser;
    }
}

// Initialize login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginSystem = new LoginSystem();
    
    // Test: Check if we can access Firebase
    console.log('Firebase auth object:', auth);
    console.log('Current user:', auth.currentUser);
    
    // Add a test button for debugging (remove in production)
    const testButton = document.createElement('button');
    testButton.textContent = 'Debug Auth';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '10000';
    testButton.style.padding = '10px';
    testButton.style.background = '#333';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', () => {
        console.log('Current Auth State:', auth.currentUser);
        console.log('Firebase Config:', firebaseConfig);
    });
    
    document.body.appendChild(testButton);
});
