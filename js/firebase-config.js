// Enhanced Firebase Configuration
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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.database();

// Set persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log('Firebase initialized successfully');

// Test function to check Firebase connection
function testFirebaseConnection() {
  console.log('Testing Firebase connection...');
  
  // Test Auth
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Firebase Auth: Connected, User:', user.email);
    } else {
      console.log('✅ Firebase Auth: Connected, No user signed in');
    }
  });

  // Test Database
  db.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
      console.log('✅ Firebase Database: Connected');
    } else {
      console.log('❌ Firebase Database: Disconnected');
    }
  });
}

// Call this to test connection
// testFirebaseConnection();
