# BondhuApp Frontend

## 🚀 How to Run Locally

### 1. Install dependencies
```
npm install
```

### 2. Create your .env file
Copy `.env.example` to `.env` and fill in your keys:
```
cp .env.example .env
```

### 3. Start the app
```
npm run dev
```
Open http://localhost:5173

---

## 🌐 How to Deploy on Netlify

### Step 1: Push to GitHub
Upload this folder to a GitHub repository.

### Step 2: Connect to Netlify
- Go to netlify.com → New Site → Import from Git
- Select your GitHub repo

### Step 3: Build Settings (Netlify will auto-detect these from netlify.toml)
- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`

### Step 4: Add Environment Variables
Go to: Site Settings → Environment Variables → Add these:

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Services |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings |

### Step 5: Deploy!
Click "Deploy Site" — it should work! ✅

---

## ❓ Troubleshooting

**Blank page on Netlify?**
- Make sure all environment variables are set in Netlify
- Check that `netlify.toml` is in the root folder
- Check the Netlify build logs for errors

**Blank page in VS Code?**
- Run `npm install` first
- Then run `npm run dev`
- Open http://localhost:5173 in your browser

**"Module not found" errors?**
- Run `npm install` again
- Make sure your `.env` file exists and has the right values
