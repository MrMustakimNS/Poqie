// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiB0zy_SFSXQPKKbei_ubhlZzvrWDCNZI",
  authDomain: "milon-box.firebaseapp.com",
  databaseURL: "https://milon-box-default-rtdb.firebaseio.com",
  projectId: "milon-box",
  storageBucket: "milon-box.firebasestorage.app",
  messagingSenderId: "386706038791",
  appId: "1:386706038791:web:2859b2a56983c16b268aa2",
  measurementId: "G-QZ4Q8P0M8L"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.database();

// Encryption function using CryptoJS (you'll need to include CryptoJS library)
function encryptData(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
}

function decryptData(encryptedData, key) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Generate a unique encryption key for each user
function generateUserKey(uid) {
    return CryptoJS.SHA256(uid + "poqie_site_secret").toString();
}
