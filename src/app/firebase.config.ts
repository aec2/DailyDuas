export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseWebConfig = {
  apiKey: 'AIzaSyDCyRvc1TsEwa6_aepEzlmD0A5TI_GfrYk',
  authDomain: 'dailyduas-96016.firebaseapp.com',
  projectId: 'dailyduas-96016',
  storageBucket: 'dailyduas-96016.firebasestorage.app',
  messagingSenderId: '944206597509',
  appId: '1:944206597509:web:45ac9ed90813ff70ac48ec',
};

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(value => value.length > 0 && !value.startsWith('YOUR_'));
}
