try {
  if (navigator.globalPrivacyControl !== true) {
    Object.defineProperty(Navigator.prototype, "globalPrivacyControl", {
      configurable: true,
      enumerable: true,
      get() {
        return true;
      },
    });
  }
} catch (e) {
  /* ignore */
}
// Verification log if we are debugging
// console.log("Privopact: Main world signal injected.");
