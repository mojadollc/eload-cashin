/**
 * Firebase mock for local development.
 * In dev mode: OTP input is shown but any 6-digit code is accepted.
 * The backend accepts "mock-firebase-token" when NODE_ENV !== "production".
 */
const mockAuth = () => ({
  signInWithPhoneNumber: async (phoneNumber: string) => {
    console.log(`[DEV] Simulating OTP send to ${phoneNumber}`);
    console.log(`[DEV] Enter any 6-digit code in the app to proceed`);
    return {
      confirm: async (code: string) => {
        if (code.length !== 6) throw new Error("Enter a 6-digit code");
        console.log(`[DEV] OTP confirmed with code: ${code}`);
        return {
          user: {
            getIdToken: async () => "mock-firebase-token",
          },
        };
      },
    };
  },
  signOut: async () => {
    console.log("[DEV] Firebase signOut");
  },
  currentUser: null,
});

export default mockAuth;
