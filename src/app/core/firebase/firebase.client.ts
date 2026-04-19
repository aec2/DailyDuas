import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig, hasFirebaseConfig } from './firebase.config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirebaseAuthInstance() {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  auth ??= getAuth(firebaseApp);
  return auth;
}

export function getFirestoreInstance() {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  db ??= initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
  return db;
}
