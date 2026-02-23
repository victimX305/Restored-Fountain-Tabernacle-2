# Firebase Setup Guide - Restored Fountain Tabernacle

This guide explains how to configure your Firebase project so authentication works correctly.

## 1. Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/) and select the **restored-church** project.
2. In the left sidebar, click **Build** → **Authentication**.
3. Click **Get started**.
4. Under **Sign-in method**, enable **Email/Password** (first option).

## 2. Create Firestore Database

1. In the left sidebar, click **Build** → **Firestore Database**.
2. Click **Create database**.
3. Choose **Start in test mode** (for development) or **Production mode** (for live site).
4. Select a location and click **Enable**.

## 3. Deploy Firestore Rules

1. Install the Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Log in and initialize:
   ```bash
   firebase login
   firebase init firestore
   ```
   When prompted, choose to use the existing `firestore.rules` file.

3. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

   Or manually copy the contents of `firestore.rules` into the Firebase Console:
   - Go to **Firestore Database** → **Rules** tab.
   - Paste the rules and click **Publish**.

## 4. Create Your First Admin User

New users register with role `user` by default. To create an admin:

### Option A: Register first, then promote in Console

1. Go to [register.html](register.html) and create an account with your admin email.
2. In Firebase Console → **Authentication**, find your user and copy their **User UID**.
3. Go to **Firestore Database** → **Start collection**.
4. Collection ID: `users`
5. Document ID: paste the **User UID** from step 2.
6. Add fields:
   - `email` (string): your email
   - `displayName` (string): your name
   - `role` (string): `admin`
   - `createdAt` (timestamp): use the timestamp option
   - `updatedAt` (timestamp): use the timestamp option
7. Click **Save**.

### Option B: Create user in Console, then add Firestore doc

1. In **Authentication** → **Users**, click **Add user** and create an account.
2. Copy the User UID.
3. In **Firestore**, create `users/{uid}` with `role: "admin"` and other fields as above.

## 5. Security Note

- **API Key**: The Firebase config in `js/firebase-config.js` is safe to expose in frontend code. Security is enforced by Firestore rules and Authentication.
- **Admin promotion**: Only promote trusted users to admin. Admins can access the admin dashboard.

## 6. Firestore Index for Blog (optional)

The blog page queries posts by `published` and `createdAt`. If you see an error in the console with a link to create an index, click it to auto-create. Or deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

## Summary Checklist

- [ ] Email/Password sign-in enabled in Authentication
- [ ] Firestore database created
- [ ] Firestore rules deployed
- [ ] First admin user created in `users` collection
- [ ] Firestore index for posts (created automatically if needed)
