// Redirect page functionality
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        document.getElementById('redirectContent').innerHTML = `
            <div class="redirect-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2 class="redirect-title">Invalid URL</h2>
            <p class="redirect-message">This shortened URL is invalid or has expired.</p>
            <a href="index.html" class="btn btn-primary">Go to Homepage</a>
        `;
        return;
    }
    
    // Look up the slug in the database
    db.ref('urls/' + slug).once('value').then((snapshot) => {
        const urlData = snapshot.val();
        
        if (!urlData) {
            document.getElementById('redirectContent').innerHTML = `
                <div class="redirect-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 class="redirect-title">URL Not Found</h2>
                <p class="redirect-message">This shortened URL doesn't exist or has been deleted.</p>
                <a href="index.html" class="btn btn-primary">Go to Homepage</a>
            `;
            return;
        }
        
        // Get user key for decryption
        const userKey = generateUserKey(urlData.userId);
        
        // Decrypt the original URL
        const originalUrl = decryptData(urlData.originalUrl, userKey);
        
        // Display the destination URL
        document.getElementById('destinationUrl').textContent = originalUrl;
        
        // Start countdown
        let countdown = 10;
        const countdownElement = document.getElementById('countdown');
        
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                
                // Update click count
                db.ref('urls/' + slug + '/clicks').set((urlData.clicks || 0) + 1);
                
                // Redirect to the original URL
                window.location.href = originalUrl;
            }
        }, 1000);
        
        // Skip redirect button
        document.getElementById('skipRedirect').addEventListener('click', function() {
            clearInterval(countdownInterval);
            
            // Update click count
            db.ref('urls/' + slug + '/clicks').set((urlData.clicks || 0) + 1);
            
            // Redirect immediately
            window.location.href = originalUrl;
        });
        
        // Cancel redirect button
        document.getElementById('cancelRedirect').addEventListener('click', function() {
            clearInterval(countdownInterval);
            window.location.href = 'index.html';
        });
    });
});
