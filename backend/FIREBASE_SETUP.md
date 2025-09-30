# 🔥 Firebase Setup Guide for Academic Portal

## Overview

Firebase provides authentication, real-time database, and file storage for your Academic Portal. This is **optional** but recommended for production features.

## 🚀 Quick Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `academic-portal-app`
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Authentication

1. In Firebase Console → Authentication
2. Click "Get started"
3. Sign-in method tab → Enable:
   - Email/Password
   - Google (optional)

### 3. Create Firestore Database

1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode"
4. Select your region

### 4. Generate Service Account Key

1. Project Settings (gear icon) → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Keep this file secure - never commit to git!**

### 5. Configure Backend

Update your `.env` file with Firebase credentials:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id-from-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=client-id-from-json
```

### 6. Configure React Native App

In your mobile app, add Firebase SDK:

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth
```

## 🎯 Current Status

### ✅ What's Ready

- Firebase service integration code in `app/services/firebase_service.py`
- Authentication endpoints that can use Firebase tokens
- Real-time chat infrastructure ready

### ⚠️ What's Missing

- Firebase project creation
- Service account credentials
- Mobile app Firebase SDK setup

## 🔧 Without Firebase (Current State)

Your backend works perfectly without Firebase using:

- **Mock Authentication**: Test endpoints work with placeholder tokens
- **PostgreSQL**: All structured data stored in database
- **Local Development**: Full API functionality for testing

## 🚀 Benefits of Adding Firebase

- **Real-time Authentication**: Secure user login/registration
- **Real-time Chat**: Instant messaging between users
- **File Storage**: Profile pictures, documents, assignments
- **Offline Support**: App works without internet connection
- **Push Notifications**: Alerts for grades, assignments, etc.

## 📱 For Mobile Development

You can start building your React Native app **right now** without Firebase:

- Use mock authentication for testing
- Connect to your FastAPI endpoints
- Add Firebase later when needed

Firebase is not required to begin development!
