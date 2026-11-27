# CashIn Tap — Mobile App

A complete React Native (Expo) mobile app for the CashIn Tap fintech platform.

## Tech Stack

- **Framework**: Expo SDK 58 + Expo Router (file-based routing)
- **Language**: TypeScript
- **State**: Zustand (auth) + TanStack Query (server state)
- **HTTP**: Axios with JWT interceptor + auto-refresh
- **Storage**: expo-secure-store (tokens, user)
- **UI**: Custom dark theme with Ionicons
- **Forms**: react-hook-form + zod validation
- **Auth**: Firebase Phone Auth (OTP) + MPIN

## Screens

### Auth Flow
- **Login** — Mobile OTP → Firebase verify → MPIN unlock
- **Register** — Form → OTP verify → Set MPIN
- **Set MPIN** — 4-digit MPIN creation with confirmation
- **Forgot MPIN** — OTP reset flow

### Main Tabs
- **Home** — Wallet balance (with hide/show), quick actions, promo banner, recent transactions
- **Transactions** — Filterable list (All / Funding / E-Load / Cash Out / Transfer)
- **Notifications** — Real-time with unread badge on tab icon
- **Profile** — Avatar, biometric toggle, menu sections, logout

### Feature Screens
- **Fund Wallet** — Preset amounts + Xendit checkout redirect
- **Transfer** — Account lookup + amount entry
- **E-Load** — Network selector + product grid
- **Cash Out** — Channel selector + saved destinations
- **Transaction Detail** — Full breakdown with copy reference
- **QR Code** — Display + copy + share
- **Edit Profile** — Name + email update
- **Change Password** — Secure password change
- **Saved Accounts** — Cashout destination management

## Setup

### 1. Install dependencies

```bash
cd cashintap-mobile
npm install
```

### 2. Configure environment

Edit `.env`:
```env
EXPO_PUBLIC_API_URL=https://cashin-tap.com   # or http://localhost:3000 for dev
```

### 3. Run

```bash
# Start Expo dev server
npm start

# Android
npm run android

# iOS
npm run ios
```

### 4. Build (Android APK)

```bash
npx expo run:android --variant release
```

## Architecture

```
app/                    # Expo Router file-based routes
├── (auth)/             # Login, Register, Set MPIN, Forgot MPIN
├── (tabs)/             # Home, Transactions, Notifications, Profile
├── wallet/             # Fund, QR
├── eload/              # E-Load purchase
├── cashout/            # Cash out + saved destinations
├── transfer/           # Peer transfer
├── transactions/       # Transaction detail
└── profile/            # Edit, Change Password, PIN

src/
├── api/                # Axios client + all API endpoints
├── components/         # Button, Input, Header, TransactionItem, etc.
├── hooks/              # useWallet, useRefreshOnFocus
├── store/              # Zustand auth store
└── utils/              # theme.ts, helpers.ts
```

## Key Design Decisions

- **Dark theme** — `#0D0F1A` background with purple primary (`#6C63FF`)
- **Floating tab bar** — Rounded pill with notification badge
- **Balance visibility toggle** — Eye icon on wallet card
- **Deep link handling** — `cashintap://wallet/fund/success` auto-refreshes wallet
- **Token refresh** — Axios interceptor silently refreshes expired JWTs
- **Firebase mock** — `src/lib/firebase-mock.ts` for dev without real Firebase
