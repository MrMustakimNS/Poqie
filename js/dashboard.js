// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set user info
    document.getElementById('userInitial').textContent = user.email.charAt(0).toUpperCase();
    document.getElementById('userEmail').textContent = user.email;

    // Generate user encryption key
    const userKey = generateUserKey(user.uid);

    // URL shortener form handler
    const urlForm = document.getElementById('urlForm');
    urlForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const originalUrl = document.getElementById('originalUrl').value;
        const customSlug = document.getElementById('customSlug').value;
        
        // Validate URL
        if (!isValidUrl(originalUrl)) {
            alert('Please enter a valid URL');
            return;
        }
        
        // Generate slug
        const slug = customSlug || generateSlug();
        
        // Check if slug already exists
        db.ref('urls/' + slug).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                alert('This custom URL is already taken. Please choose another one.');
                return;
            }
            
            // Encrypt the original URL
            const encryptedUrl = encryptData(originalUrl, userKey);
            
            // Save to database
            const urlData = {
                originalUrl: encryptedUrl,
                userId: user.uid,
                createdAt: new Date().toISOString(),
                clicks: 0
            };
            
            db.ref('urls/' + slug).set(urlData)
                .then(() => {
                    // Add to user's URLs
                    db.ref('users/' + user.uid + '/urls/' + slug).set(true);
                    
                    // Reset form and refresh list
                    urlForm.reset();
                    loadUserUrls();
                    
                    // Show success message
                    alert('URL shortened successfully!');
                })
                .catch((error) => {
                    console.error('Error saving URL:', error);
                    alert('Error shortening URL. Please try again.');
                });
        });
    });

    // Load user's URLs
    function loadUserUrls() {
        const linksList = document.getElementById('linksList');
        linksList.innerHTML = '<p>Loading your links...</p>';
        
        db.ref('users/' + user.uid + '/urls').once('value').then((snapshot) => {
            const urls = snapshot.val();
            
            if (!urls) {
                linksList.innerHTML = '<p>You haven\'t created any shortened URLs yet.</p>';
                return;
            }
            
            linksList.innerHTML = '';
            const userKey = generateUserKey(user.uid);
            
            Object.keys(urls).forEach(slug => {
                db.ref('urls/' + slug).once('value').then((urlSnapshot) => {
                    const urlData = urlSnapshot.val();
                    
                    if (urlData && urlData.userId === user.uid) {
                        const decryptedUrl = decryptData(urlData.originalUrl, userKey);
                        
                        const linkItem = document.createElement('div');
                        linkItem.className = 'link-item';
                        linkItem.innerHTML = `
                            <div class="link-info">
                                <h3>poqie.site/${slug}</h3>
                                <p>${decryptedUrl}</p>
                                <p><small>Clicks: ${urlData.clicks || 0} | Created: ${formatDate(urlData.createdAt)}</small></p>
                            </div>
                            <div class="link-actions">
                                <button class="link-action-btn copy-btn" data-slug="${slug}">Copy</button>
                                <button class="link-action-btn delete-btn" data-slug="${slug}">Delete</button>
                            </div>
                        `;
                        
                        linksList.appendChild(linkItem);
                    }
                });
            });
            
            // Add event listeners for copy and delete buttons
            setTimeout(() => {
                document.querySelectorAll('.copy-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const slug = this.getAttribute('data-slug');
                        const shortUrl = `${window.location.origin}/redirect.html?slug=${slug}`;
                        
                        navigator.clipboard.writeText(shortUrl).then(() => {
                            alert('URL copied to clipboard!');
                        });
                    });
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const slug = this.getAttribute('data-slug');
                        
                        if (confirm('Are you sure you want to delete this URL?')) {
                            db.ref('urls/' + slug).remove();
                            db.ref('users/' + user.uid + '/urls/' + slug).remove();
                            
                            // Remove from UI
                            this.closest('.link-item').remove();
                        }
                    });
                });
            }, 100);
        });
    }
    
    // Initial load
    loadUserUrls();

    // Toggle custom URL field
    const customUrlToggle = document.getElementById('customUrlToggle');
    const customUrlContainer = document.getElementById('customUrlContainer');
    
    if (customUrlToggle) {
        customUrlToggle.addEventListener('change', function() {
            customUrlContainer.style.display = this.checked ? 'flex' : 'none';
        });
    }
});

// Utility functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function generateSlug() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
