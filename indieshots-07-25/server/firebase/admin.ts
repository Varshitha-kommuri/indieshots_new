import admin from 'firebase-admin';

// Initialize Firebase Admin SDK with proper error handling
let firebaseInitialized = false;

try {
  if (!admin.apps.length) {
    // Check if we have service account credentials
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'indieshots-c6bb1';
    
    if (serviceAccountKey) {
      // Production: Use service account credentials
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      console.log('🔥 Firebase Admin initialized with service account credentials');
    } else {
      // Production fallback: Try Google Application Default Credentials
      try {
        admin.initializeApp({
          projectId: projectId,
        });
        console.log('🔥 Firebase Admin initialized with Application Default Credentials');
      } catch (adcError) {
        console.error('❌ Firebase Admin initialization failed - no credentials available');
        console.error('Required: FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
        throw new Error('Firebase Admin initialization failed: Missing service account credentials');
      }
    }
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  console.error('❌ This will cause authentication failures in production');
  firebaseInitialized = false;
  
  // In production, throw the error to prevent silent failures
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

// Wrapper functions that handle both development and production scenarios
class FirebaseAuthWrapper {
  async getUserByEmail(email: string) {
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized. Please add service account credentials.');
    }
    
    try {
      return await admin.auth().getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const customError = new Error('User not found');
        (customError as any).code = 'auth/user-not-found';
        throw customError;
      }
      throw error;
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    emailVerified?: boolean;
    displayName?: string;
  }) {
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized. Please add service account credentials.');
    }
    
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      emailVerified: userData.emailVerified || false,
      displayName: userData.displayName,
    });
    
    console.log(`🔥 Firebase: Created user ${userData.email} with UID ${userRecord.uid}`);
    return userRecord;
  }

  async setCustomUserClaims(uid: string, claims: Record<string, any>) {
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized. Please add service account credentials.');
    }
    
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`🔥 Firebase: Set custom claims for ${uid}:`, claims);
  }

  async createCustomToken(uid: string) {
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized. Please add service account credentials.');
    }
    
    return await admin.auth().createCustomToken(uid);
  }

  async getUser(uid: string) {
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized. Please add service account credentials.');
    }
    
    try {
      return await admin.auth().getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const customError = new Error('User not found');
        (customError as any).code = 'auth/user-not-found';
        throw customError;
      }
      throw error;
    }
  }

  async deleteUser(uid: string) {
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized. Please add service account credentials.');
    }
    
    try {
      await admin.auth().deleteUser(uid);
      console.log(`🔥 Firebase: Deleted user with UID ${uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`🔥 Firebase: User ${uid} was already deleted or not found`);
        const customError = new Error('User not found');
        (customError as any).code = 'auth/user-not-found';
        throw customError;
      }
      console.error(`🔥 Firebase: Error deleting user ${uid}:`, error);
      throw error;
    }
  }
}

export const auth = new FirebaseAuthWrapper();
export const firestore = firebaseInitialized ? admin.firestore() : null;

// Validation function to ensure Firebase is properly initialized
export function validateFirebaseInitialization() {
  if (!firebaseInitialized) {
    console.error('❌ Firebase Admin not initialized - authentication will fail');
    console.error('❌ Check FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin not initialized in production environment');
    }
  }
  return firebaseInitialized;
}

// Run validation on module load in production
if (process.env.NODE_ENV === 'production') {
  validateFirebaseInitialization();
}

export default admin;
