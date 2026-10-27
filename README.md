# PlantLens AI 🌿

> **Identify any plant organism, diagnose its health, and receive actionable botanical triage in seconds using multimodal AI.**

PlantLens AI is a modern full-stack web application designed for mobile and desktop devices. It empowers plant lovers, gardeners, farmers, and botanical explorers to photograph plants anywhere in the world, diagnose visible symptoms with differential pathology, track personal collections, and ask context-aware questions to an AI botanist.

---

## ✨ Primary Features

1. **Universal Botanical Identification (`/`)**
   - Live device camera viewfinder (WebRTC) with camera-flip and gallery upload.
   - Intelligent organism detection: flowers, houseplants, trees, vegetables, crops, succulents, ferns, mosses, and fungi.
   - Non-plant detection: gracefully identifies when an uploaded image is non-botanical (vehicles, electronics, animals, objects) and offers photo-taking guidance.
   - Real botanical specimen tray for instant one-click testing.

2. **Plant Doctor & Health Diagnostics**
   - Multi-angle visual triage (leaf close-up, stem/node, potting soil).
   - Visible symptom chips (chlorosis, tip necrosis, powdery mildew, blight, pests).
   - Differential diagnosis: ranks multiple possible causes by **likelihood %** with supporting **Visual Evidence**.
   - Actionable recovery plans: immediate steps, watering protocols, light/humidity adjustments, organic pest hygiene, and fertilizer precautions.
   - Insufficient evidence handling: clearly recommends what additional photos or checks are needed when symptoms are ambiguous.

3. **Personal Plant Collection ("My Plants")**
   - Offline-first local persistence: plants and timeline logs survive page refreshes.
   - One-tap watering logger ("Watered & Checked") with progress timeline.
   - Location filtering (Living Room, Balcony, Garden, Farm).
   - **Full Data Ownership**: 1-click **Export Backup** to JSON and **Restore Backup** without requiring an account or cloud dependency.

4. **Botanical Encyclopedia ("Explore")**
   - Searchable catalog across 10 botanical categories.
   - Pet toxicity indicators (calcium oxalate alerts, dog/cat safety).
   - Regional climate profiles (tropical monsoon, subtropical, Mediterranean, temperate).

5. **AI Botanist Assistant Chat**
   - Pinned active plant context for personalized conversations.
   - Localized climate guidance (e.g., monsoon vs. summer care in Maharashtra / India or California).
   - Scientific verification level tags (verified botanical evidence vs. folklore).

6. **Safety & Toxicity Protection**
   - **Wild Mushroom Warning**: Never guarantees wild mushroom edibility; displays strict warnings and poison control hotlines:
     - **US Poison Control**: `1-800-222-1222`
     - **India AIIMS Poison Hotline**: `1800-116-117`
   - Toxicity profile for pets and humans.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI & Components**: React 19, Tailwind CSS v4, Lucide React, Canvas Confetti
- **AI Engine**: Google Gemini Vision (`@google/generative-ai` SDK, `gemini-1.5-flash`)
- **Server Security**: Sliding-window rate limiting, 15MB payload limiter, format validator, and 25s timeout wrapper
- **Persistence**: Browser `localStorage` with JSON export/restore capabilities

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v25)
- npm 9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/kaverimeshram/PlantLensAI.git
cd PlantLensAI
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey))*.

> **Note on Demonstration Mode**: If no API key is provided, PlantLens AI operates in **Simulated Demonstration Mode** with transparent UI notices. Users can also enter a personal key directly in the app's Settings modal.

### 3. Run Quality & Build Checks
```bash
# Run ESLint (0 errors, 0 warnings)
npm run lint

# Build the production bundle with Turbopack
npm run build
```

### 4. Start the Application
```bash
# Development server (Turbopack)
npm run dev

# Or Production server on port 3000
npm run start -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security & Privacy Architecture

- **Server-Side API Key Isolation**: Production API keys are stored strictly in server-side environment variables (`GEMINI_API_KEY`). They are never prefixed with `NEXT_PUBLIC_` and never exposed in client JS bundles.
- **Rate Limiting**: In-memory sliding window rate limiter protects server routes from spam (25 requests/minute per client IP) with HTTP 429 response headers (`Retry-After`).
- **File Upload Protection**: Max upload size capped at 15MB. Only image mime types (`image/jpeg`, `image/png`, `image/webp`, `image/heic`) are accepted; non-image files are rejected with HTTP 400/415.
- **Request Timeouts**: All external calls to Gemini are wrapped with a 25-second `withTimeout` safeguard to prevent hung serverless processes.
- **Data Privacy**: Collection data is stored locally in client storage. No telemetry or tracking cookies.

---

## 🚢 Vercel Deployment Checklist

Follow these steps to deploy PlantLens AI to production on Vercel:

1. **Push to GitHub**:
   Ensure all changes are committed and pushed to your GitHub repository:
   ```bash
   git status
   git push origin main
   ```

2. **Import Project into Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New..."** → **"Project"**.
   - Select your `PlantLensAI` repository.

3. **Configure Build Settings**:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build` (Default)
   - Output Directory: `.next` (Default)

4. **Add Environment Variables**:
   Under **"Environment Variables"**, add:
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key`
   - Environment: Select **Production**, **Preview**, and **Development**.

5. **Deploy**:
   - Click **"Deploy"**. Vercel will build the Next.js app using Turbopack.
   - Once deployed, your production URL will be live (e.g. `https://plant-lens-ai.vercel.app`).

6. **Post-Deployment Verification**:
   - Visit the production URL.
   - Test camera permissions or upload a flower/plant photo.
   - Test an unrelated object photo to verify "No Plant Detected" rejection.
   - Test the Plant Doctor triage.
   - Inspect network tab to verify headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

---

## 📄 License
MIT License. Created for botanical education, gardening assistance, and ecological appreciation.
