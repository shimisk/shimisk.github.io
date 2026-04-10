(function(){
  const firebaseConfig = {
    apiKey: 'AIzaSyAxpQKhHhKof30bQuAXzgkE0waR9Ff7i1w',
    authDomain: 'reservation-tracker-online.firebaseapp.com',
    projectId: 'reservation-tracker-online',
    storageBucket: 'reservation-tracker-online.firebasestorage.app',
    messagingSenderId: '23755063168',
    appId: '1:23755063168:web:4ce710b88b1e3228f04b65',
  };

  const isConfigured = Object.values(firebaseConfig).every(function(value){
    return value && value !== 'REPLACE_ME';
  });

  if (!window.firebase) {
    console.error('Firebase SDK failed to load.');
    window.reservationTrackerFirebase = { app: null, auth: null, db: null, isConfigured: false };
    return;
  }

  if (!isConfigured) {
    console.warn('Firebase config is missing. Update firebase-config.js with your project values.');
    window.reservationTrackerFirebase = { app: null, auth: null, db: null, isConfigured: false };
    return;
  }

  const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);

  window.reservationTrackerFirebase = {
    app: app,
    auth: firebase.auth(),
    db: firebase.firestore(),
    isConfigured: true,
  };
})();