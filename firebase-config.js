// Dán cấu hình Web App từ Firebase Console vào đây.
// Các giá trị Firebase Web config là mã nhận diện ứng dụng; không dán private key/service account.
export const firebaseConfig = {
  apiKey: 'AIzaSyDKQj4x9Q36Vh_gJsHPblZMKxW2kd7lfaA',
  authDomain: 'web-choigi.firebaseapp.com',
  databaseURL: 'https://web-choigi-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'web-choigi',
  appId: '1:363305896324:web:c2a8906bf5a530bb3175d1'
};

export const firebaseReady = Object.values(firebaseConfig).every(value =>
  typeof value === 'string' && value && !value.includes('YOUR_')
);
