// Enhanced Firebase Configuration with Error Handling
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

// Initialize Firebase with error handling
try {
  // Check if Firebase is already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    firebase.app(); // if already initialized, use that one
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.database();

// Firebase Auth state persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error('Auth persistence error:', error);
  });

// Enhanced error handling for Firebase operations
const firebaseService = {
  // Safe database write operation
  async writeData(path, data) {
    try {
      await db.ref(path).set(data);
      return { success: true };
    } catch (error) {
      console.error('Firebase write error:', error);
      return { success: false, error: error.message };
    }
  },

  // Safe database read operation
  async readData(path) {
    try {
      const snapshot = await db.ref(path).once('value');
      return { success: true, data: snapshot.val() };
    } catch (error) {
      console.error('Firebase read error:', error);
      return { success: false, error: error.message };
    }
  },

  // Safe database update operation
  async updateData(path, updates) {
    try {
      await db.ref(path).update(updates);
      return { success: true };
    } catch (error) {
      console.error('Firebase update error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, auth, db, firebaseService };
}
