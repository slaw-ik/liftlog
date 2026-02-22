# Google Sign-In setup

If you see **"Access blocked"**, **"Error 400: invalid_request"**, **"Error 400: redirect_uri_mismatch"**, or **"Custom URI scheme is not enabled for your Android client"** when signing in with Google, use this guide.

## Web client vs Android client

**Web OAuth client** (and Firebase “Authorised redirect URIs”): only **HTTPS** (or http) is allowed. Custom schemes like `liftlog://...` are rejected with “Must end with a public top-level domain”. So do **not** add `liftlog://` to the Web client or Firebase.

**Android OAuth client**: the app uses **`com.liftlog-app.app:/oauthredirect`** (one slash after the colon, no `//`). Enable **Custom URI scheme** in Advanced settings, then add that **exact** URI to the Android client’s redirect URIs. The app registers this scheme in `app.json` so the redirect opens the app.

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
  1. **Enable Custom URI scheme:** In [Credentials](https://console.cloud.google.com/apis/credentials), open your **Android** OAuth 2.0 client → **Advanced settings** → enable **Custom URI scheme**.  
  2. **Add the redirect URI:** In the same Android client, add this URI **exactly** (copy-paste, no extra spaces):  
     **`com.liftlog-app.app:/oauthredirect`**  
     Use a **single** slash after the colon (not `://`). If you see **redirect_uri_mismatch**, the value in Google Console does not match this character-for-character—fix or add this URI on the **Android** client only (not the Web client).  
  3. Save. Rebuild the app (`npx expo run:android`) so the new intent filter is applied.
- **Web**: Keep the **Web** client for the webClientId. Its "Authorized redirect URIs" should only list **HTTPS** URLs (e.g. `https://liftlog-d77b8.firebaseapp.com/__/auth/handler` for Firebase). Do **not** add any `liftlog://` or other custom scheme there.

### 3. OAuth consent screen (if in "Testing")

If the app is in **Testing** mode:

1. **APIs & Services** → **OAuth consent screen**.
2. Add the Gmail addresses that need to sign in under **Test users**.

---

After that, run the app with a development build and try "Continue with Google" again. On Android, the redirect **`com.liftlog-app.app:/oauthredirect`** must be added to the Android OAuth client (see above), and the app must be rebuilt so the intent filter for that scheme is in the build.
