// Enhanced Dashboard Functionality
class AdvancedDashboard {
    constructor() {
        this.user = null;
        this.encryption = encryptionSystem;
        this.userKey = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.loadUserData();
        this.setupEventListeners();
        this.loadUserLinks();
        this.updateStats();
    }

    async checkAuth() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.user = user;
                    await this.generateUserKey();
                    this.updateUI();
                    resolve(user);
                } else {
                    window.location.href = 'login.html';
                }
            });
        });
    }

    async generateUserKey() {
        // In a real app, you'd get this from user input or secure storage
        const userPassword = await this.getUserPassword();
        this.userKey = this.encryption.generateUserKey(this.user.uid, userPassword);
    }

    async getUserPassword() {
        // This is a simplified version - in production, use a more secure method
        return this.user.uid + "default_pass_2024";
    }

    loadUserData() {
        document.getElementById('userName').textContent = this.user.email.split('@')[0];
        document.getElementById('userEmail').textContent = this.user.email;
        document.getElementById('userAvatar').innerHTML = `<i class="fas fa-user"></i>`;
    }

    setupEventListeners() {
        // URL Shortener Form
        document.getElementById('urlForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.shortenURL();
        });

        // Advanced Options Toggle
        document.getElementById('advancedToggle').addEventListener('click', () => {
            this.toggleAdvancedOptions();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    async shortenURL() {
        const originalUrl = document.getElementById('originalUrl').value;
        const customSlug = document.getElementById('customSlug').value;
        const password = document.getElementById('linkPassword').value;
        const expiration = document.getElementById('expiration').value;
        const maxClicks = document.getElementById('maxClicks').value;

        if (!this.isValidUrl(originalUrl)) {
            this.showNotification('Please enter a valid URL', 'error');
            return;
        }

        try {
            // Generate slug
            const slug = customSlug || this.encryption.generateSecureSlug();

            // Check if slug exists
            const exists = await this.checkSlugExists(slug);
            if (exists) {
                this.showNotification('This custom URL is already taken', 'error');
                return;
            }

            // Prepare encryption options
            const options = {
                password: password,
                expires: expiration || null,
                maxClicks: maxClicks || null,
                metadata: {
                    userId: this.user.uid,
                    customSlug: !!customSlug
                }
            };

            // Encrypt URL
            const encryptedData = this.encryption.encryptURL(originalUrl, this.userKey, options);

            // Prepare link data
            const linkData = {
                encryptedData: encryptedData.encryptedData,
                iv: encryptedData.iv,
                salt: encryptedData.salt,
                userId: this.user.uid,
                slug: slug,
                createdAt: new Date().toISOString(),
                clicks: 0,
                isActive: true,
                passwordProtected: !!password,
                expiration: expiration,
                maxClicks: maxClicks
            };

            // Add password hash if provided
            if (password) {
                const passwordHash = this.encryption.hashPassword(password);
                linkData.passwordHash = passwordHash.hash;
                linkData.passwordSalt = passwordHash.salt;
            }

            // Save to database
            await this.saveLink(linkData);

            // Show success
            this.showNotification('URL shortened successfully!', 'success');
            this.resetForm();
            this.loadUserLinks();

        } catch (error) {
            console.error('Error shortening URL:', error);
            this.showNotification('Error shortening URL', 'error');
        }
    }

    async checkSlugExists(slug) {
        const snapshot = await db.ref('links/' + slug).once('value');
        return snapshot.exists();
    }

    async saveLink(linkData) {
        // Save to main links collection
        await db.ref('links/' + linkData.slug).set(linkData);
        
        // Save to user's links collection
        await db.ref('users/' + this.user.uid + '/links/' + linkData.slug).set({
            createdAt: linkData.createdAt,
            isActive: true
        });
    }

    async loadUserLinks() {
        const linksList = document.getElementById('linksList');
        linksList.innerHTML = '<div class="loading">Loading your links...</div>';

        try {
            const snapshot = await db.ref('users/' + this.user.uid + '/links').once('value');
            const userLinks = snapshot.val();

            if (!userLinks) {
                linksList.innerHTML = '<div class="empty-state">No links created yet</div>';
                return;
            }

            linksList.innerHTML = '';
            const linksArray = Object.entries(userLinks);

            for (const [slug, linkData] of linksArray) {
                const fullLinkData = await this.getLinkData(slug);
                if (fullLinkData) {
                    this.renderLinkItem(slug, fullLinkData);
                }
            }

        } catch (error) {
            console.error('Error loading links:', error);
            linksList.innerHTML = '<div class="error-state">Error loading links</div>';
        }
    }

    async getLinkData(slug) {
        const snapshot = await db.ref('links/' + slug).once('value');
        return snapshot.val();
    }

    renderLinkItem(slug, linkData) {
        const linksList = document.getElementById('linksList');
        const shortUrl = `${window.location.origin}/redirect.html?slug=${slug}`;
        
        let destinationUrl = 'Encrypted URL';
        try {
            const decrypted = this.encryption.decryptURL(
                linkData.encryptedData, 
                this.userKey, 
                linkData.iv, 
                linkData.salt
            );
            destinationUrl = decrypted.url;
        } catch (error) {
            destinationUrl = 'Unable to decrypt';
        }

        const linkItem = document.createElement('div');
        linkItem.className = 'table-row';
        linkItem.innerHTML = `
            <div class="table-cell">
                <div class="short-url">
                    <span>poqie.site/${slug}</span>
                    <button class="copy-btn" data-url="${shortUrl}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="table-cell destination">
                <span class="truncate">${destinationUrl}</span>
            </div>
            <div class="table-cell clicks">
                <span class="click-count">${linkData.clicks || 0}</span>
            </div>
            <div class="table-cell date">
                ${new Date(linkData.createdAt).toLocaleDateString()}
            </div>
            <div class="table-cell actions">
                <button class="btn-icon" onclick="dashboard.showLinkAnalytics('${slug}')">
                    <i class="fas fa-chart-bar"></i>
                </button>
                <button class="btn-icon" onclick="dashboard.copyLink('${shortUrl}')">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-icon danger" onclick="dashboard.deleteLink('${slug}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        linksList.appendChild(linkItem);
        this.attachCopyListeners();
    }

    attachCopyListeners() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.closest('.copy-btn').getAttribute('data-url');
                this.copyToClipboard(url);
            });
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showNotification('Copy failed', 'error');
        }
    }

    async updateStats() {
        // Update total links count
        const linksSnapshot = await db.ref('users/' + this.user.uid + '/links').once('value');
        const totalLinks = linksSnapshot.val() ? Object.keys(linksSnapshot.val()).length : 0;
        document.getElementById('totalLinks').textContent = totalLinks;

        // Update total clicks (this would require more complex aggregation)
        document.getElementById('totalClicks').textContent = '0'; // Placeholder
    }

    toggleAdvancedOptions() {
        const options = document.getElementById('advancedOptions');
        const toggleBtn = document.getElementById('advancedToggle');
        
        if (options.style.display === 'none') {
            options.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-times"></i> Close Options';
        } else {
            options.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-cog"></i> Advanced Options';
        }
    }

    showLinkAnalytics(slug) {
        // Implement analytics modal
        this.showNotification('Analytics feature coming soon!', 'info');
    }

    async deleteLink(slug) {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            await db.ref('links/' + slug).remove();
            await db.ref('users/' + this.user.uid + '/links/' + slug).remove();
            this.showNotification('Link deleted successfully', 'success');
            this.loadUserLinks();
        } catch (error) {
            console.error('Error deleting link:', error);
            this.showNotification('Error deleting link', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    resetForm() {
        document.getElementById('urlForm').reset();
        document.getElementById('advancedOptions').style.display = 'none';
        document.getElementById('advancedToggle').innerHTML = '<i class="fas fa-cog"></i> Advanced Options';
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    logout() {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }

    updateUI() {
        // Update user-specific UI elements
        document.getElementById('userName').textContent = this.user.email.split('@')[0];
        document.getElementById('userEmail').textContent = this.user.email;
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdvancedDashboard();
});
