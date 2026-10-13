# SkillFlux – Zero-Money Skill & Product Exchange Platform

> **Connect. Learn. Exchange. Grow. — No mandatory money involved.**

SkillFlux is a full-featured, zero-money social barter platform where people exchange skills, knowledge, and physical products. It combines the professional credibility of LinkedIn with the barter philosophy of a community cooperative.

---

## 🌟 Core Exchange Types

SkillFlux supports all four barter combinations:
1. **Skill for Skill** (e.g., React mentoring in exchange for UI/UX design lessons)
2. **Skill for Product** (e.g., Python tutoring in exchange for a mechanical keyboard)
3. **Product for Skill** (e.g., Programming textbook in exchange for graphic design help)
4. **Product for Product** (e.g., Drawing tablet in exchange for photography gear)

*Users can optionally mention an estimated reference value for context, but the platform does not require or allow payment processing.*

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, React Hot Toast
- **Backend**: Node.js, Express, CORS, Dotenv
- **Database & Auth**: Firebase Firestore & Firebase Authentication (Spark Free Tier)
- **Deployment**: Vercel (Frontend), Render (Backend)

---

## 📂 Project Structure

```text
SKILLFLUX/
├── backend/
│   ├── index.js            # Express API (Matching algorithm, stats, health checks)
│   ├── package.json        # Backend dependencies & scripts
│   └── package-lock.json
├── skillflux-client/       # React (Vite) Frontend Application
│   ├── public/             # Static logos, icons, and assets
│   ├── src/
│   │   ├── components/     # UI widgets: Navbar, AIChatbot, UI.jsx (Avatar, Modal, etc.)
│   │   ├── context/        # AuthContext (Firebase Auth state, role verification)
│   │   ├── pages/          # All 12 application pages:
│   │   │   ├── Landing.jsx      # Conversion-focused landing with stats & FAQ
│   │   │   ├── Login.jsx        # Login & Password reset modal
│   │   │   ├── Register.jsx     # Registration & email validation
│   │   │   ├── Onboarding.jsx   # 4-step profile setup wizard
│   │   │   ├── Dashboard.jsx    # Real stats, quick actions, skill/product listings
│   │   │   ├── Marketplace.jsx  # Skills, Products, Members tabs & Smart Matches
│   │   │   ├── Exchanges.jsx    # State machine exchange proposals & dual confirmation
│   │   │   ├── Feed.jsx         # Social community feed with filtering & likes
│   │   │   ├── Chat.jsx         # Real-time conversations & 1-on-1 messaging
│   │   │   ├── Profile.jsx      # Public user profiles, connections & follow logic
│   │   │   ├── Notifications.jsx# Real-time notifications & mark-as-read
│   │   │   ├── Settings.jsx     # Profile preferences, avatar & password update
│   │   │   └── Admin.jsx        # Analytics, moderation, idempotent demo seeder
│   │   ├── utils/          # helpers.js (Deterministic matching algorithm, categories)
│   │   ├── firebase.js     # Client SDK initialization
│   │   ├── App.jsx         # React Router v7 routes & ProtectedRoute guards
│   │   └── index.css       # Tailwind CSS v4 custom theme & tokens
│   ├── package.json
│   └── vite.config.js
├── firestore.rules         # Security rules with least-privilege access control
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js (v18 or later)
- npm or pnpm
- Firebase Project (`skillflux-d2c81` or your own)

### 2. Frontend Setup (`skillflux-client`)
```bash
cd skillflux-client
npm install
npm run dev
```
The client starts on `http://localhost:5173`.

### 3. Backend Setup (`backend`)
```bash
cd backend
npm install
npm start
```
The server starts on `http://localhost:5000`.

---

## 🔐 Firebase Configuration & Security Rules

The frontend uses standard client-side Firebase Web SDK credentials stored in `skillflux-client/src/firebase.js`.

### Security Rules (`firestore.rules`)
Deploy rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
Key constraints enforced by `firestore.rules`:
- **Role Escalation Protection**: Users cannot modify their own `role` field. Only users matching `haripatel2225@gmail.com` or existing admins retain administrative privileges.
- **Listing Ownership**: Only listing owners can edit or delete their skills and products.
- **Private Conversations**: Only participants of a chat can read and send messages.
- **Exchange Requests**: Only participants can transition exchange status.
- **Two-Party Completion**: Both parties must independently confirm completion before status moves to `Completed`.

---

## 🎯 Demo Data Seeding

1. Log in with an admin account (e.g., `haripatel2225@gmail.com`).
2. Navigate to **Admin Panel** (`/admin`) → **Seeding** tab.
3. Click **Seed Demo Data**.
   - Seeds 10 realistic fictional skills and 8 physical products with stable IDs (`demo_skill_*`, `demo_product_*`).
   - Idempotent: Can be run multiple times without duplicating entries.
   - Isolated: Fictional content is flagged with `isDemo: true`.
4. Click **Clear Demo Data** to safely remove demo entries without touching real user accounts.

---

## 🚀 Deployment

### Frontend (Vercel)
1. Root directory: `skillflux-client`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Install command: `npm install`
5. Live URL: [https://skillflux.vercel.app/](https://skillflux.vercel.app/)

### Backend (Render / Railway)
1. Root directory: `backend`
2. Build command: `npm install`
3. Start command: `node index.js`
4. Environment variables:
   - `PORT=5000`
   - `FRONTEND_URL=https://skillflux.vercel.app`

---

## 🛡️ Limitations & Future Improvements
- **Spark Plan Constraints**: Uses client SDK transactions and deterministic matching rather than serverless background triggers or paid vector embeddings.
- **Search**: Employs client-side keyword and token overlap similarity algorithms suitable for low-to-medium volume datasets.
