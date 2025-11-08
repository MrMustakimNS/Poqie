// Advanced Redirect System with Password Protection
class SecureRedirect {
    constructor() {
        this.slug = null;
        this.linkData = null;
        this.countdown = 10;
        this.countdownInterval = null;
        this.encryption = encryptionSystem;
        this.init();
    }

    async init() {
        this.slug = this.getSlugFromURL();
        
        if (!this.slug) {
            this.showError('Invalid URL', 'This shortened URL is invalid.');
            return;
        }

        await this.loadLinkData();
    }

    getSlugFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    }

    async loadLinkData() {
        try {
            this.showLoading();
            
            const snapshot = await db.ref('links/' + this.slug).once('value');
            this.linkData = snapshot.val();

            if (!this.linkData) {
                this.showError('Link Not Found', 'This link doesn\'t exist or has been deleted.');
                return;
            }

            // Check if link is expired
            if (this.isLinkExpired()) {
                this.showError('Link Expired', 'This link has expired and is no longer available.');
                return;
            }

            // Check if link has reached max clicks
            if (this.hasReachedMaxClicks()) {
                this.showError('Link Limit Reached', 'This link has reached its maximum number of clicks.');
                return;
            }

            // Check if password protected
            if (this.linkData.passwordProtected) {
                this.showPasswordScreen();
            } else {
                this.startRedirectProcess();
            }

        } catch (error) {
            console.error('Error loading link:', error);
            this.showError('Loading Error', 'Failed to load the link. Please try again.');
        }
    }

    isLinkExpired() {
        if (!this.linkData.expiration) return false;
        const expirationDate = new Date(this.linkData.expiration);
        return new Date() > expirationDate;
    }

    hasReachedMaxClicks() {
        if (!this.linkData.maxClicks) return false;
        return this.linkData.clicks >= this.linkData.maxClicks;
    }

    showLoading() {
        document.getElementById('loadingScreen').style.display = 'block';
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('redirectScreen').style.display = 'none';
        document.getElementById('errorScreen').style.display = 'none';
    }

    showPasswordScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('passwordScreen').style.display = 'block';
        document.getElementById('redirectScreen').style.display = 'none';
        document.getElementById('errorScreen').style.display = 'none';

        this.setupPasswordForm();
    }

    showRedirectScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('redirectScreen').style.display = 'block';
        document.getElementById('errorScreen').style.display = 'none';
    }

    showError(title, message) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('redirectScreen').style.display = 'none';
        document.getElementById('errorScreen').style.display = 'block';

        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorMessage').textContent = message;
    }

    setupPasswordForm() {
        const form = document.getElementById('passwordForm');
        const toggleBtn = document.getElementById('toggleLinkPassword');
        const passwordInput = document.getElementById('linkPassword');

        // Password visibility toggle
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.verifyPassword();
        });
    }

    async verifyPassword() {
        const password = document.getElementById('linkPassword').value;
        
        try {
            const isValid = this.encryption.verifyPassword(
                password,
                this.linkData.passwordHash,
                this.linkData.passwordSalt
            );

            if (isValid) {
                this.startRedirectProcess();
            } else {
                this.showPasswordError('Invalid password. Please try again.');
            }
        } catch (error) {
            console.error('Password verification error:', error);
            this.showPasswordError('Error verifying password. Please try again.');
        }
    }

    showPasswordError(message) {
        const form = document.getElementById('passwordForm');
        let errorDiv = form.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    async startRedirectProcess() {
        this.showRedirectScreen();
        
        try {
            // Get user key (in real app, this would be more secure)
            const userKey = this.encryption.generateUserKey(this.linkData.userId, "default_pass_2024");
            
            // Decrypt URL
            const decryptedData = this.encryption.decryptURL(
                this.linkData.encryptedData,
                userKey,
                this.linkData.iv,
                this.linkData.salt
            );

            // Update click count
            await this.updateClickCount();

            // Display destination URL
            document.getElementById('destinationUrl').textContent = decryptedData.url;

            // Start countdown
            this.startCountdown(decryptedData.url);

        } catch (error) {
            console.error('Decryption error:', error);
            this.showError('Security Error', 'Failed to decrypt the link. It may be corrupted.');
        }
    }

    async updateClickCount() {
        const newClickCount = (this.linkData.clicks || 0) + 1;
        await db.ref('links/' + this.slug + '/clicks').set(newClickCount);
        this.linkData.clicks = newClickCount;
    }

    startCountdown(destinationUrl) {
        const countdownElement = document.getElementById('countdown');
        const countdownText = document.getElementById('countdownText');
        
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            countdownElement.textContent = this.countdown;
            countdownText.textContent = this.countdown;
            
            if (this.countdown <= 0) {
                this.redirectToDestination(destinationUrl);
            }
        }, 1000);

        // Skip redirect button
        document.getElementById('skipRedirect').addEventListener('click', () => {
            this.redirectToDestination(destinationUrl);
        });
    }

    redirectToDestination(url) {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        window.location.href = url;
    }
}

// Initialize redirect system
let secureRedirect;
document.addEventListener('DOMContentLoaded', () => {
    secureRedirect = new SecureRedirect();
});
