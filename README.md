# 🚀 Project: Virtual Wardrobe

An AI-powered closet management PWA built with Next.js and Supabase. Upload your clothes, let AI detect and tag them, build outfits, track what you wear, and get smart suggestions.

## 👥 Participants

| Role   | Name         |
| ------ | ------------ |
| Mentor | Vanness Yang |
| Leader | Chloe Lee    |
| Member | Stuti        |
| Member | Karthik      |
| Member | Kestrel      |
| Member | Eugene       |

## Features

- **Closet Management** — Upload garment photos with automatic background removal
- **AI Detection** — Scan an outfit photo to detect and separate individual garments (Google Gemini)
- **AI Tagging** — Auto-detect category, colours, fabric, vibe, and warmth level
- **Outfit Builder** — Drag-and-drop garments into layered outfits
- **Daily Wear Log** — Track what you wear each day
- **Analytics** — Cost-per-wear tracking, sleeping items, wardrobe insights
- **Virtual Try-On** — AI-powered outfit visualization
- **Weather-Aware Suggestions** — Outfit recommendations based on local weather

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **AI:** Google Gemini 2.5 Flash (vision) for garment detection and tagging
- **Styling:** Tailwind CSS 4
- **State:** Zustand + React Query
- **Animations:** Framer Motion
- **Charts:** Recharts

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI API key](https://aistudio.google.com/apikey) (free tier available)

## Setup

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd virtual-wardrobe
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase and Google AI credentials in `.env.local`.

4. **Set up the database**

   Run the SQL migrations in order against your Supabase project. You can either:
   - Use the Supabase CLI (if linked): `supabase db push`
   - Or paste each file from `supabase/migrations/` into the Supabase Dashboard SQL Editor, in order (001 through 008)

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── (main)/       # Authenticated pages (closet, outfits, analytics, etc.)
│   └── api/          # API routes (garments, analytics, outfits)
├── components/       # Shared UI components (Button, Modal, BottomSheet, etc.)
├── features/         # Feature-specific components
│   ├── closet/       # Garment cards, upload, detail sheet
│   ├── outfits/      # Outfit builder, lookbook
│   ├── analytics/    # CPW table, charts, sleeping items
│   ├── log/          # Daily wear logging, calendar view
│   ├── suggestions/  # Weather-aware outfit suggestions
│   └── tryon/        # Virtual try-on
├── hooks/            # Custom React hooks
├── lib/              # Utilities, Supabase clients, AI integration, validators
└── stores/           # Zustand stores

supabase/
├── migrations/       # SQL migration files (run in order)
└── functions/        # Supabase Edge Functions (remove-bg)
```

## Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |
