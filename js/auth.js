/**
 * Firebase Authentication Module - Restored Fountain Tabernacle
 * Handles user registration, login, logout, and role-based access (user vs admin)
 */
(function () {
  'use strict';

  const USERS_COLLECTION = 'users';

  /**
   * Get the current user's role from Firestore (user | admin)
   * @returns {Promise<string>} 'admin', 'user', or null if not found
   */
  async function getUserRole(uid) {
    if (!firebase || !uid) return null;
    try {
      const doc = await firebase.firestore().collection(USERS_COLLECTION).doc(uid).get();
      if (!doc.exists) return null;
      const data = doc.data();
      const role = data && data.role;
      return role != null ? String(role).trim() : null;
    } catch (e) {
      console.error('getUserRole error:', e);
      return null;
    }
  }

  /**
   * Create or update user profile in Firestore (called on registration)
   * @param {string} uid - Firebase Auth UID
   * @param {Object} data - { email, displayName, role }
   */
  async function createUserProfile(uid, data) {
    if (!firebase || !uid) return;
    try {
      await firebase.firestore().collection(USERS_COLLECTION).doc(uid).set({
        ...data,
        role: data.role || 'user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error('createUserProfile error:', e);
      throw e;
    }
  }

  /**
   * Register a new user with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} displayName - Optional full name
   * @returns {Promise<{user: Object, role: string}>}
   */
  async function registerUser(email, password, displayName) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    const credential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = credential.user;
    if (displayName) {
      await user.updateProfile({ displayName });
    }
    await createUserProfile(user.uid, {
      email: user.email,
      displayName: displayName || user.displayName || '',
      role: 'user'
    });
    const role = await getUserRole(user.uid);
    return { user, role: role || 'user' };
  }

  /**
   * Sign in with email and password
   * @returns {Promise<{user: Object, role: string}>}
   */
  async function signIn(email, password) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    const credential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = credential.user;
    const role = await getUserRole(user.uid);
    // Normalize role: 'admin' (case-insensitive) or 'user'
    const normalizedRole = (role && String(role).toLowerCase().trim() === 'admin') ? 'admin' : (role || 'user');
    return { user, role: normalizedRole };
  }

  /**
   * Sign out the current user
   */
  function signOut() {
    if (firebase && firebase.auth) {
      firebase.auth().signOut();
    }
  }

  /**
   * Get current Firebase user (or null)
   */
  function getCurrentUser() {
    return firebase && firebase.auth ? firebase.auth().currentUser : null;
  }

  /**
   * Listen for auth state changes
   * @param {Function} callback - (user, role) => void
   * @returns {Function} Unsubscribe function
   */
  function onAuthStateChanged(callback) {
    if (!firebase || !firebase.auth) return function () {};
    return firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        callback(null, null);
        return;
      }
      const role = await getUserRole(user.uid);
      callback(user, role || 'user');
    });
  }

  /**
   * Check if current user is admin (for route protection)
   * @returns {Promise<boolean>}
   */
  async function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;
    const role = await getUserRole(user.uid);
    return role === 'admin';
  }

  // Expose to global scope
  window.Auth = {
    registerUser,
    signIn,
    signOut,
    getCurrentUser,
    onAuthStateChanged,
    getUserRole,
    isAdmin,
    createUserProfile
  };
})();
