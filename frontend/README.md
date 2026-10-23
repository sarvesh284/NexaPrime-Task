# NexaPrime / RateLocal — Frontend Web Application

Modern, accessible, and responsive Store Rating & Discovery Web Application built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Leaflet Maps**.

---

## 🌟 Key Features

- **Real Maharashtra Interactive Map:** Powered by Leaflet & OpenStreetMap, centered on Maharashtra (`[19.7515, 75.7139]`, zoom 7) with custom rating markers, popups, and city filters (Mumbai, Pune, Kolhapur, Sangli, Nashik, Nagpur, etc.).
- **Light/Dark Theme System:** Default light theme for new visitors, with zero-FOUC initialization and instant toggle in the navbar.
- **Store Discovery & Multi-View:** Grid View, Split View (Map + List side-by-side), and full Map View.
- **Role-Based Portals:** Normal User rating feed & wishlist, Store Owner analytics & daily trends, and Admin moderation console.
- **Store Photo Gallery & Lightbox:** Community and official store photos with preview and modal upload.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4.2 (App Router, Turbopack)
- **UI & State:** React 19, React Hook Form, Zod
- **Styling:** Tailwind CSS v4 (with class-based light/dark theme)
- **Mapping:** Leaflet & React Leaflet (OpenStreetMap tiles)
- **Icons:** Lucide React

---

## ⚙️ Environment Variables

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_API_URL=https://ratelocal.onrender.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://ratelocal.onrender.com
```

*For local development:*
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Getting Started

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

For full project architecture, backend APIs, and security specifications, see the main [Root README](../README.md).
