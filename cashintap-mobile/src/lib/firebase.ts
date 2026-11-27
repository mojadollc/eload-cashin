/**
 * Firebase Phone Auth via REST API using the Android API key.
 * Android API keys do not require recaptchaToken — Firebase uses
 * Play Integrity / SafetyNet automatically on real Android devices.
 * Works in Expo Go without native modules.
 */

const ANDROID_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY!;

const SEND_URL = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${ANDROID_API_KEY}`;
const VERIFY_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${ANDROID_API_KEY}`;

const firebaseAuth = () => ({
  signInWithPhoneNumber: async (phoneNumber: string) => {
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber,
        // Android API key — no recaptchaToken needed
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data.error?.message || "Failed to send OTP";
      console.error("[Firebase] sendVerificationCode error:", data.error);
      throw new Error(msg);
    }

    const sessionInfo = data.sessionInfo;
    console.log("[Firebase] OTP sent, sessionInfo received");

    return {
      confirm: async (code: string) => {
        const verifyRes = await fetch(VERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionInfo, code }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || verifyData.error) {
          const msg = verifyData.error?.message || "Invalid OTP";
          throw new Error(msg === "INVALID_CODE" ? "Incorrect OTP code" : msg);
        }

        return {
          user: {
            getIdToken: async () => verifyData.idToken,
          },
        };
      },
    };
  },

  signOut: async () => {},
  currentUser: null,
});

export default firebaseAuth;
