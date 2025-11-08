// Enhanced Authentication System
class AdvancedAuth {
    constructor() {
        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.checkAuthState();
    }

    setupAuthListeners() {
        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form handler
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Social auth handlers
        this.setupSocialAuth();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        const errorDiv = document.getElementById('errorMessage');
        const submitBtn = document.getElementById('authButton');

        try {
            // Show loading state
            this.setLoadingState(submitBtn, true);

            // Set persistence based on remember me
            const persistence = rememberMe ? 
                firebase.auth.Auth.Persistence.LOCAL : 
                firebase.auth.Auth.Persistence.SESSION;
            
            await auth.setPersistence(persistence);

            // Sign in user
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Success - redirect to dashboard
            window.location.href = 'dashboard.html';

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
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('errorMessage');
        const submitBtn = document.getElementById('authButton');

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showError(errorDiv, 'Passwords do not match');
            return;
        }

        // Validate password strength
        if (!this.isStrongPassword(password)) {
            this.showError(errorDiv, 'Password must be at least 8 characters with uppercase, lowercase, and numbers');
            return;
        }

        try {
            // Show loading state
            this.setLoadingState(submitBtn, true);

            // Create user account
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user profile in database
            await this.createUserProfile(user);

            // Send verification email
            await user.sendEmailVerification();

            // Success - redirect to dashboard
            window.location.href = 'dashboard.html';

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

        await firebaseService.writeData(`users/${user.uid}`, userData);
    }

    setupSocialAuth() {
        // Google auth
        const googleBtn = document.querySelector('.social-btn.google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // GitHub auth
        const githubBtn = document.querySelector('.social-btn.github');
        if (githubBtn) {
            githubBtn.addEventListener('click', () => this.signInWithGitHub());
        }
    }

    async signInWithGoogle() {
        // Implement Google OAuth
        this.showError(document.getElementById('errorMessage'), 'Google sign-in coming soon!');
    }

    async signInWithGitHub() {
        // Implement GitHub OAuth
        this.showError(document.getElementById('errorMessage'), 'GitHub sign-in coming soon!');
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
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    setLoadingState(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
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
        auth.onAuthStateChanged((user) => {
            const currentPage = window.location.pathname.split('/').pop();
            
            if (user) {
                // User is signed in
                if (currentPage === 'login.html' || currentPage === 'index.html') {
                    window.location.href = 'dashboard.html';
                }
                
                // Update user last login
                if (currentPage === 'dashboard.html') {
                    this.updateLastLogin(user.uid);
                }
            } else {
                // User is signed out
                if (currentPage === 'dashboard.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    async updateLastLogin(uid) {
        await firebaseService.updateData(`users/${uid}`, {
            lastLogin: new Date().toISOString()
        });
    }

    // Password reset functionality
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset email sent' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update user profile
    async updateProfile(uid, updates) {
        return await firebaseService.updateData(`users/${uid}/profile`, updates);
    }

    // Delete user account
    async deleteAccount(user) {
        try {
            // Delete user data from database
            await db.ref(`users/${user.uid}`).remove();
            
            // Delete user's links
            await this.deleteUserLinks(user.uid);
            
            // Delete auth account
            await user.delete();
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteUserLinks(uid) {
        // Implementation to delete all user's links
        // This would need to query and delete all links belonging to the user
    }
}

// Initialize authentication system
const advancedAuth = new AdvancedAuth();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = advancedAuth;
}
