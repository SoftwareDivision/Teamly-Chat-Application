# Teamly - Multi-Platform Chat Application

Professional team communication platform built with React Native (Mobile) and Next.js (Web) sharing 100% business logic.

## 📁 Project Structure

```
Teamly/
├── teamly_mobile/          # React Native (Android + iOS)
├── teamly_web/             # Next.js (Web)
├── teamly_shared/          # Shared logic (Models, Services, ViewModels, Controllers)
├── teamly_backend/         # Node.js Backend
└── database/               # Database files
```

## 🎨 Architecture

**MVC Pattern with Shared Logic:**
- **Models** → Data structures (in `teamly_shared/models/`)
- **Views** → UI components (platform-specific in `teamly_mobile/views/` and `teamly_web/app/`)
- **ViewModels** → Business logic (in `teamly_shared/viewmodels/` or platform-specific)
- **Controllers** → Orchestration (in `teamly_shared/controllers/`)
- **Services** → API, Socket, Firebase (in `teamly_shared/services/`)

## 🚀 Installation

### 1. Install Shared Package Dependencies

```bash
cd teamly_shared
npm install
```

### 2. Install Mobile Dependencies

```bash
cd ../teamly_mobile
npm install
```

**For Android:**
- Make sure you have Android Studio installed
- Set up Android SDK (API 33+)
- Create an emulator or connect a physical device

**For iOS (macOS only):**
```bash
cd ios
pod install
cd ..
```

### 3. Install Web Dependencies

```bash
cd ../teamly_web
npm install
```

## 🏃 Running the Apps

### Mobile (React Native)

**Android:**
```bash
cd teamly_mobile
npm run android
```

**iOS:**
```bash
cd teamly_mobile
npm run ios
```

### Web (Next.js)

```bash
cd teamly_web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Color Theme

The app uses a consistent pink gradient theme across all platforms:

- **Primary Gradient:** `#FF4E8E` → `#B0005E`
- **Background:** `#FDEBF2` → `#FFFFFF`
- **Title Text:** `#A00059`
- **Subtitle:** `#A6A6A6`

## ✅ Current Features

- ✅ Splash Screen (Mobile + Web)
- ✅ Shared business logic
- ✅ MVC architecture
- ✅ Authentication service
- ✅ API service

## 📝 Next Steps

1. Add Email Input Screen
2. Add OTP Verification Screen
3. Add Profile Setup Screen
4. Add Chat List Screen
5. Add Chat Screen
6. Implement Socket.io real-time messaging
7. Add Firebase push notifications

## 🔧 Development Notes

- **Shared logic** is in `teamly_shared/` - any changes here affect both mobile and web
- **Mobile UI** is in `teamly_mobile/views/` and `teamly_mobile/components/`
- **Web UI** is in `teamly_web/app/` and `teamly_web/components/`
- Both platforms use the same **Colors**, **Models**, **Services**, and **Controllers**

## 📱 Platform-Specific Storage

- **Mobile:** Uses `AsyncStorage` (via `SecureStorage.ts`)
- **Web:** Uses `sessionStorage` (via `WebStorage.ts`)
- Both implement the same `IAuthStorage` interface from `teamly_shared`

---

Built with ❤️ using React Native, Next.js, and TypeScript
