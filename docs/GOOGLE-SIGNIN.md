# Google Sign-In setup

If you see **"Access blocked: Authorization Error"** or **"Error 400: invalid_request"** when signing in with Google, use this guide.

## Why you can't add `liftlog://redirect`

**Google and Firebase only accept HTTPS (or http) redirect URIs** for the Web OAuth client. Custom schemes like `liftlog://redirect` are rejected with:

- "Invalid redirect: Must end with a public top-level domain (such as .com or .org)."
- "Invalid Redirect: must use a domain that is a valid Top private domain."

So **do not** add `liftlog://redirect` to Firebase or Google Cloud "Authorised redirect URIs". The app is set up to use the **native** iOS/Android OAuth clients instead, which don’t use that list.

## What to do instead

### 1. Use a development build (not Expo Go)

Expo Go uses a changing `exp://...` URL that Google doesn’t accept. Use a development build so the app can use the native Google clients:

```bash
npx expo run:ios
# or
npx expo run:android
```

### 2. Check OAuth clients in Google Cloud Console

Use **[Google Cloud Console](https://console.cloud.google.com/)** → your project → **APIs & Services** → **Credentials**.

- **iOS**: You should have an **iOS** OAuth 2.0 client with your app’s **Bundle ID**: `com.liftlog-app.app`. The app already uses the reversed iOS client ID as URL scheme in `app.json` (`infoPlist.CFBundleURLTypes`).
- **Android**: You should have an **Android** OAuth 2.0 client with **Package name** `com.liftlog-app.app` and your **SHA-1** fingerprint (from your keystore).
- **Web**: Keep the **Web** client for the webClientId. Its "Authorized redirect URIs" should only list **HTTPS** URLs (e.g. `https://liftlog-d77b8.firebaseapp.com/__/auth/handler` for Firebase). Do **not** add any `liftlog://` or other custom scheme there.

### 3. OAuth consent screen (if in "Testing")

If the app is in **Testing** mode:

1. **APIs & Services** → **OAuth consent screen**.
2. Add the Gmail addresses that need to sign in under **Test users**.

---

After that, run the app with a development build and try "Continue with Google" again. No custom redirect URI is required.
