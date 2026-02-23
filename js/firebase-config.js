/**
 * Firebase Configuration - Restored Fountain Tabernacle
 * Connects to the restored-church Firebase project
 */
(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyD8qSr4DQuL--m3p6tmA3UYd5AufjFamBg",
    authDomain: "restored-church.firebaseapp.com",
    projectId: "restored-church",
    storageBucket: "restored-church.firebasestorage.app",
    messagingSenderId: "793774281503",
    appId: "1:793774281503:web:d7ee14639bcbba139f562a",
    measurementId: "G-7MMEJ1YPV0"
  };

  // Initialize Firebase (only if not already initialized)
  if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
    firebase.initializeApp(firebaseConfig);
  }

  window.firebaseConfig = firebaseConfig;
})();
