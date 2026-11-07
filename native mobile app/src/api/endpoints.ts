import api from "./client";

export const authApi = {
  // Login step 1: send OTP to existing user's mobile
  sendLoginOtp: (mobile: string) =>
    api.post("/api/mobile/auth/send-otp", { mobile }),

  // Login step 2: verify OTP → get JWT + requiresMpin flag
  verifyLoginOtp: (mobile: string, code: string) =>
    api.post("/api/mobile/auth/verify-otp", { mobile, code }),

  // Login step 3: verify 4-digit MPIN to unlock session
  verifyMpin: (mpin: string, accessToken: string) =>
    api.put("/api/auth/pin", { pin: mpin }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Register: create account (no password)
  register: (data: {
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    referralCode?: string;
  }) => api.post("/api/auth/register", data),

  // Register step 2: send OTP after account created
  sendRegisterOtp: (mobile: string) =>
    api.post("/api/mobile/auth/register-otp", { mobile }),

  // Register step 3: verify OTP → activate account + get JWT
  verifyRegisterOtp: (mobile: string, code: string) =>
    api.post("/api/mobile/auth/verify-otp", { mobile, code }),

  // Set MPIN after first login / registration
  setMpin: (pin: string, accessToken: string) =>
    api.post("/api/auth/pin", { pin }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Forgot MPIN step 1: send OTP
  sendResetMpinOtp: (mobile: string) =>
    api.post("/api/mobile/auth/reset-mpin", { mobile }),

  // Forgot MPIN step 2: verify OTP + set new MPIN
  resetMpin: (mobile: string, code: string, newPin: string) =>
    api.post("/api/mobile/auth/reset-mpin", { mobile, code, newPin }),

  logout: () => api.post("/api/mobile/auth/logout"),
};

export const walletApi = {
  getWallet: () => api.get("/api/mobile/wallet"),
  getTransactions: (params?: Record<string, any>) =>
    api.get("/api/mobile/wallet/transactions", { params }),
  fund: (amount: number, successUrl?: string, failureUrl?: string) =>
    api.post("/api/mobile/wallet/fund", { amount, successUrl, failureUrl }),
  lookup: (accountNumber: string) =>
    api.get(`/api/mobile/wallet/lookup?accountNumber=${accountNumber}`),
};

export const transferApi = {
  transfer: (accountNumber: string, amount: number) =>
    api.post("/api/mobile/transfer", { accountNumber, amount }),
};

export const eloadApi = {
  getProducts: () => api.get("/api/mobile/eload/products"),
  purchase: (data: {
    mobileNumber: string;
    productCode: string;
    network: string;
    loadAmount: number;
    promoId?: number;
  }) => api.post("/api/mobile/eload/purchase", data),
};

export const cashoutApi = {
  request: (data: {
    amount: number;
    channel: string;
    accountNumber: string;
    accountName: string;
  }) => api.post("/api/mobile/cashout/request", data),
  getDestinations: () => api.get("/api/mobile/cashout/destinations"),
  saveDestination: (data: {
    channel: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
  }) => api.post("/api/mobile/cashout/destinations", data),
};

export const transactionApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/api/mobile/transactions", { params }),
  getById: (id: string) => api.get(`/api/mobile/transactions/${id}`),
};

export const profileApi = {
  get: () => api.get("/api/mobile/profile"),
  update: (data: { firstName?: string; lastName?: string; email?: string }) =>
    api.patch("/api/mobile/profile", data),
};

export const notificationApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/api/mobile/notifications", { params }),
  markRead: (ids?: string[]) =>
    api.post("/api/mobile/notifications/read", { ids }),
};

export const pinApi = {
  set: (pin: string) => api.post("/api/mobile/pin/set", { pin }),
  verify: (pin: string) => api.post("/api/mobile/pin/verify", { pin }),
};

export const qrApi = {
  generate: () => api.get("/api/mobile/qr/generate"),
  pay: (data: { qrData: string; amount?: number }) =>
    api.post("/api/mobile/qr/pay", data),
};

export const deviceApi = {
  registerToken: (token: string, platform: string) =>
    api.post("/api/mobile/device-token", { token, platform }),
};
