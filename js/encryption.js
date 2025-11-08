// Advanced Encryption System for Poqie.site
class AdvancedEncryption {
    constructor() {
        this.algorithm = 'AES';
        this.keySize = 256;
        this.mode = CryptoJS.mode.CBC;
        this.padding = CryptoJS.pad.Pkcs7;
    }

    // Generate user-specific encryption key
    generateUserKey(uid, password) {
        const salt = CryptoJS.SHA256(uid + "poqie_site_salt_2024").toString();
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: this.keySize / 32,
            iterations: 10000
        });
        return key;
    }

    // Encrypt URL with additional metadata
    encryptURL(url, key, options = {}) {
        const metadata = {
            url: url,
            timestamp: new Date().toISOString(),
            passwordProtected: !!options.password,
            expires: options.expires || null,
            maxClicks: options.maxClicks || null,
            ...options.metadata
        };

        const dataString = JSON.stringify(metadata);
        const encrypted = CryptoJS.AES.encrypt(dataString, key, {
            mode: this.mode,
            padding: this.padding
        });

        return {
            encryptedData: encrypted.toString(),
            iv: encrypted.iv.toString(CryptoJS.enc.Base64),
            salt: encrypted.salt.toString(CryptoJS.enc.Base64)
        };
    }

    // Decrypt URL
    decryptURL(encryptedData, key, iv, salt) {
        try {
            const encrypted = CryptoJS.lib.CipherParams.create({
                ciphertext: CryptoJS.enc.Base64.parse(encryptedData)
            });
            
            if (iv) encrypted.iv = CryptoJS.enc.Base64.parse(iv);
            if (salt) encrypted.salt = CryptoJS.enc.Base64.parse(salt);

            const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
                mode: this.mode,
                padding: this.padding
            });

            const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) {
                throw new Error('Decryption failed - invalid key or data');
            }

            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt URL');
        }
    }

    // Generate secure random slug
    generateSecureSlug(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    }

    // Hash password for link protection
    hashPassword(password) {
        const salt = CryptoJS.lib.WordArray.random(128/8);
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256/32,
            iterations: 1000
        });
        return {
            hash: key.toString(),
            salt: salt.toString()
        };
    }

    // Verify password for protected links
    verifyPassword(password, hash, salt) {
        const saltWordArray = CryptoJS.enc.Hex.parse(salt);
        const key = CryptoJS.PBKDF2(password, saltWordArray, {
            keySize: 256/32,
            iterations: 1000
        });
        return key.toString() === hash;
    }

    // Generate QR code data (to be used with QR code library)
    generateQRCodeData(shortUrl, options = {}) {
        const qrData = {
            url: shortUrl,
            generated: new Date().toISOString(),
            ...options
        };
        return JSON.stringify(qrData);
    }
}

// Initialize encryption system
const encryptionSystem = new AdvancedEncryption();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = encryptionSystem;
}
