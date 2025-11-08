// Complete Fixed Authentication System
class AdvancedAuth {
    constructor() {
        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.checkAuthState();
        this.setupUI();
    }

    setupUI() {
        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = e.target.closest('.password-input').querySelector('input');
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                e.target.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        });

        // Form toggle between login/signup
        const authToggle = document.getElementById('authToggle');
        if (authToggle) {
            authToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForm();
            });
        }

        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'signup') {
            this.showSignupForm();
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
        
        // Add confirm password field
        const passwordGroup = document.querySelector('.form-group:nth-child(2)');
        if (passwordGroup && !document.getElementById('confirmPassword')) {
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
        this.setupUI(); // Re-setup UI for new elements
    }

    showLoginForm() {
        document.getElementById('authTitle').textContent = 'Welcome Back';
        document.getElementById('authSubtitle').textContent = 'Sign in to your secure URL shortener account';
        document.getElementById('authButton').innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        document.getElementById('authFooterText').innerHTML = 'Don\'t have an account? <a href="#" id="authToggle">Sign up</a>';
        
        // Remove confirm password field
        const confirmPasswordGroup = document.querySelector('.form-group:nth-child(3)');
        if (confirmPasswordGroup && document.getElementById('confirmPassword')) {
            confirmPasswordGroup.remove();
        }
        
        document.getElementById('authForm').id = 'loginForm';
    }

    setupAuthListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('authButton');
        const errorDiv = document.getElementById('errorMessage');

        try {
            this.setLoadingState(submitBtn, true);
            this.hideError(errorDiv);

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Show success notification
            if (window.showNotification) {
                window.showNotification('Successfully signed in!', 'success');
            }
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            this.handleAuthError(error, errorDiv);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const submitBtn = document.getElementById('authButton');
        const errorDiv = document.getElementById('errorMessage');

        // Validation
        if (password !== confirmPassword) {
            this.showError(errorDiv, 'Passwords do not match');
            return;
        }

        if (!this.isStrongPassword(password)) {
            this.showError(errorDiv, 'Password must be at least 8 characters with uppercase, lowercase, and numbers');
            return;
        }

        try {
            this.setLoadingState(submitBtn, true);
            this.hideError(errorDiv);

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user profile
            await this.createUserProfile(user);

            // Show success notification
            if (window.showNotification) {
                window.showNotification('Account created successfully!', 'success');
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            this.handleAuthError(error, errorDiv);
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
                notifications: true
            },
            stats: {
                linksCreated: 0,
                totalClicks: 0
            }
        };

        await db.ref(`users/${user.uid}`).set(userData);
    }

    handleAuthError(error, errorDiv) {
        let errorMessage = 'An error occurred during authentication';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
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
            default:
                errorMessage = error.message;
        }

        this.showError(errorDiv, errorMessage);
    }

    showError(errorDiv, message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Also show notification
        if (window.showNotification) {
            window.showNotification(message, 'error');
        }
    }

    hideError(errorDiv) {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    setLoadingState(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            
            // Restore original button text based on form type
            const isSignup = document.getElementById('authTitle').textContent.includes('Create');
            button.innerHTML = isSignup ? 
                '<i class="fas fa-user-plus"></i> Create Account' : 
                '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    isStrongPassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
    }

    checkAuthState() {
        if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                const currentPage = window.location.pathname.split('/').pop();
                
                if (user) {
                    // User is signed in
                    if (currentPage === 'login.html' || currentPage === 'index.html') {
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    }
                } else {
                    // User is signed out
                    if (currentPage === 'dashboard.html') {
                        window.location.href = 'login.html';
                    }
                }
            });
        }
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.advancedAuth = new AdvancedAuth();
});
