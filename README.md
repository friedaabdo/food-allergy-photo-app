# Food Photo App

A cross-platform phone app (iPhone and Android) built with **React Native + Expo**.

Tap **Take Photo** and the camera opens with on-screen instructions:

1. **Front**: take the photo and it moves straight on
2. **Back**
3. The app asks: *"Is there important information on the sides?"*
   - **Yes**: take **Side 1** and **Side 2**
   - **No**: skip the sides
4. All photos upload at **full quality** to **Supabase Storage**, in a new folder for each set.

---

## What you need

- **Node.js LTS**, version **22.13 or newer**. Download the version marked **LTS** from [nodejs.org](https://nodejs.org). Odd-numbered "Current" releases may not be supported.
  Check your version with `node -v`.
- **Git**
- A code editor, e.g. [VS Code](https://code.visualstudio.com)
- The **Expo Go** app on your phone ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Supabase keys (see step 3)

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add the Supabase keys

The app needs a Supabase project to upload photos to. Create a file named **`.env`** in the project's top-level folder, next to `package.json`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-publishable-key
```


**Where to get the keys** (pick one):

- **Use the shared project:** ask the repo owner to send you the URL and publishable key privately.
- **Use your own Supabase project** (free):
  1. Create a project at [supabase.com](https://supabase.com).
  2. Go to **Storage → New bucket**, name it `photos`, and turn on **Public bucket**.
  3. Go to **Storage → Policies → New policy (for `photos`) → For full customization**:
     - Allowed operation: **INSERT**
     - Target roles: **anon**
     - Policy definition: `bucket_id = 'photos'`
  4. Copy the **Project URL** and **Publishable key** from the **Connect** button (or **Project Settings → API**) into your `.env`.

> ⚠️ Never put the Supabase **secret** / `service_role` key in this app.

### 4. Start the app

```bash
npx expo start
```

A QR code appears in the terminal.

### 5. Open it on your phone

- **iPhone:** scan the QR code with the **Camera** app, then tap **Open in Expo Go**.
- **Android:** open **Expo Go** and tap **Scan QR code**. Don't use the regular camera app.

Your phone and computer must be on the **same Wi-Fi**. When the app asks for camera access, tap **Allow**.

Edits you save in the code update on your phone automatically.

---

## Project structure

```
src/
  app/
    _layout.tsx        # Root stack: tabs + full-screen camera
    capture.tsx        # Camera flow: instructions, capture, upload
    (tabs)/
      _layout.tsx      # Bottom tab bar
      index.tsx        # Home screen with the "Take Photo" button
      explore.tsx      # Second tab
  lib/
    supabase.ts        # Supabase connection (reads the .env keys)
.env                   # Your Supabase keys (not committed)
.env.example           # Template for .env
```

To change which photos are taken, edit the `STEPS` list at the top of `src/app/capture.tsx`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| **"Node.js is outdated and unsupported"** | Install the Node **LTS** version. If `node -v` looks right but Expo still complains, run `npx -c "where node"` (Windows) or `npx -c "which node"` (Mac). If it lists a `node_modules` folder *outside* this project (e.g. in your user folder), remove the stray `node` package there. |
| **"supabaseUrl is required" / "supabaseKey is required"** | `.env` is missing, misnamed (e.g. `.env.txt`), in the wrong folder, or the variable names don't match exactly. Fix it, then restart with `npx expo start --clear`. When it works, the terminal shows `env: load .env` at startup. |
| **"You're signed in to Expo Go but not Expo CLI"** | Either sign out in Expo Go (**Profile** tab), or run `npx expo login` on your computer with the same account. |
| **The app won't load / it spins forever** | Make sure the phone and computer are on the same Wi-Fi. On school or work networks, try `npx expo start --tunnel`. |
| **Changes don't show up on the phone** | Save the file, then press `r` in the terminal (click inside the terminal first) or shake the phone and tap **Reload**. |
| **"Upload failed: new row violates row-level security policy"** | The Supabase upload policy is missing or wrong. See step 3. |
| **Something is weird / stuck** | Run `npx expo start --clear` to reset the cache. |

---

## Built with

- [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/): file-based navigation
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/): in-app camera
- [Supabase](https://supabase.com): photo storage