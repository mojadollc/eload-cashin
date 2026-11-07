# CashIn Tap — Native Mobile App

Expo React Native app for the CashIn Tap fintech platform.

## Tech Stack

- **Expo SDK 52** (React Native)
- **Expo Router v4** — file-based navigation
- **Zustand** — auth state management
- **TanStack Query** — server state / caching
- **React Hook Form + Zod** — form validation
- **Expo SecureStore** — token storage
- **Expo LocalAuthentication** — biometrics / Face ID / fingerprint
- **Axios** — API client with auto token refresh

## Project Structure

```
app/
├── (auth)/          # Login, Register, OTP, Forgot Password
├── (tabs)/          # Home, Transactions, Notifications, Profile
├── wallet/          # Fund Wallet, QR Code
├── transfer/        # Peer-to-peer transfer
├── eload/           # Buy mobile load
├── cashout/         # Cash out + saved destinations
├── transactions/    # Transaction detail
└── profile/         # Edit profile, PIN, Change password

src/
├── api/             # Axios client + all API endpoints
├── components/      # Button, Input, Header, TransactionItem
├── store/           # Zustand auth store
└── utils/           # Theme constants, helper functions
```

## Setup

### 1. Install dependencies

```bash
cd "native mobile app"
npm install
```

### 2. Configure API URL

Edit `src/api/client.ts` and set `BASE_URL`:

```ts
// For local dev (use your machine's LAN IP, not localhost)
export const BASE_URL = "http://192.168.1.x:3000";

// For production
export const BASE_URL = "https://cashin-tap.com";
```

### 3. Run

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### 4. Build (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK / AAB
eas build --platform ios       # IPA
```

## Screens

| Screen | Route |
|--------|-------|
| Login | `/(auth)/login` |
| Register | `/(auth)/register` |
| OTP Verify | `/(auth)/verify-otp` |
| Forgot Password | `/(auth)/forgot-password` |
| Home (Dashboard) | `/(tabs)` |
| Transaction History | `/(tabs)/transactions` |
| Notifications | `/(tabs)/notifications` |
| Profile | `/(tabs)/profile` |
| Fund Wallet | `/wallet/fund` |
| QR Code | `/wallet/qr` |
| Transfer | `/transfer` |
| E-Load | `/eload` |
| Cash Out | `/cashout` |
| Saved Accounts | `/cashout/destinations` |
| Transaction Detail | `/transactions/[id]` |
| Edit Profile | `/profile/edit` |
| Set PIN | `/profile/pin` |
| Change Password | `/profile/change-password` |

## API Base

All API calls go to `https://cashin-tap.com/api/mobile/*`

Authentication uses JWT Bearer tokens stored in Expo SecureStore with automatic refresh via Axios interceptor.
