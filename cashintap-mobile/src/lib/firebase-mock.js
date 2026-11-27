const mockAuth = () => ({
  signInWithPhoneNumber: async (phoneNumber) => {
    console.warn("[Firebase Mock] signInWithPhoneNumber:", phoneNumber);
    return {
      confirm: async (code) => ({
        user: { getIdToken: async () => "mock-firebase-token" },
      }),
    };
  },
  signOut: async () => {
    console.warn("[Firebase Mock] signOut");
  },
  currentUser: null,
});

module.exports = mockAuth;
module.exports.default = mockAuth;
module.exports.FirebaseAuthTypes = {};
