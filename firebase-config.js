// Firebase Web App configuration from the Firebase console.
export const firebaseConfig = {
  apiKey: 'AIzaSyDKQj4x9Q36Vh_gJsHPblZMKxW2kd7lfaA',
  authDomain: 'web-choigi.firebaseapp.com',
  databaseURL: 'https://web-choigi-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'web-choigi',
  storageBucket: 'web-choigi.firebasestorage.app',
  messagingSenderId: '363305896324',
  appId: '1:363305896324:web:c2a8906bf5a530bb3175d1',
  measurementId: 'G-69TTV85RF3'
};

export const firebaseReady = Object.values(firebaseConfig).every(value => typeof value === 'string' && value && !value.includes('YOUR_'));
