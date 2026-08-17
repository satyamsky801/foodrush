<div align="center">

# 🍕 FoodRush

**A full-stack food delivery platform — React + Express + MongoDB**

Order biryani, pizza, dosas and more from your favourite restaurants with live order tracking, coupons, and a complete admin & restaurant workflow.

</div>

---

## ✨ Highlights

| | |
|---|---|
| **Customer app** | 11 pages: home, search & filters, restaurant menu, food customisation, cart, checkout, live order tracking, profile, orders, login |
| **Admin dashboard** | `/admin` — live stats & charts, users (role management), restaurants, foods, categories, coupons, order pipeline, reviews |
| **Fully API-connected** | Restaurants, menus, auth, addresses, coupons, orders, tracking & reviews all read/write MongoDB through the Express API — no mock data in the UI |
| **Dark mode** | Class-based Tailwind theme with a pre-paint script (no flash), follows your system preference |
| **Coupons** | `WELCOME50` (50% off up to ₹100), `FOOD20` (20% off up to ₹150), `FREEDEL` (free delivery) — validated by the backend |
| **JWT auth** | Register / login / logout with bcrypt password hashing, session restore on refresh, role-based access |
| **Server-authoritative pricing** | The backend recomputes every order total (items + add-ons + customisations + GST + coupon); the client never supplies a price |
| **Reviews** | Rate restaurants after delivery — ratings aggregate server-side into the restaurant's score |
| **Mobile-first** | Sticky navbar, bottom navigation, no horizontal overflow at 390px, tested in headless Chrome |
| **Polished UX** | Loading skeletons, empty & error states, toasts, micro-animations, veg/non-veg indicators |

## 🖼️ Screenshots

<p float="left">
  <img src="screenshots/home.png" width="49%" alt="Home page" />
  <img src="screenshots/restaurants.png" width="49%" alt="Restaurant listing" />
</p>
<p float="left">
  <img src="screenshots/restaurant.png" width="49%" alt="Restaurant details" />
  <img src="screenshots/cart.png" width="49%" alt="Cart with coupon" />
</p>
<p float="left">
  <img src="screenshots/tracking.png" width="49%" alt="Live order tracking" />
  <img src="screenshots/home-dark.png" width="49%" alt="Dark mode home" />
</p>
<p float="left">
  <img src="screenshots/login.png" width="49%" alt="Login page" />
</p>

## 🛠️ Tech Stack

**Frontend** — React 18 · React Router 6 · Tailwind CSS 3 · Vite 5 · lucide-react
**Backend** — Node.js · Express · Mongoose · JSON Web Tokens · bcryptjs · MongoDB
**Tooling** — Vite build · E2E verified with Puppeteer + headless Chrome

## 📁 Project Structure

```
.
├── src/                  # React frontend
│   ├── api/              #   API client + typed endpoint modules (auth, restaurants, orders…)
│   ├── components/       #   reusable UI (navbar, cards, modals, skeletons…)
│   ├── context/          #   cart, auth, favourites, orders, addresses, settings, toasts
│   ├── data/             #   UI metadata (categories, coupons) + seed source for the DB
│   ├── hooks/            #   useFetch, localStorage
│   ├── pages/            #   11 pages
│   └── utils/            #   pricing, formatting, image helpers
├── backend/              # Express REST API
│   ├── src/
│   │   ├── config/       #   DB connection (env-configurable)
│   │   ├── controllers/  #   request handlers
│   │   ├── middleware/   #   JWT auth, error handling
│   │   ├── models/       #   Mongoose schemas
│   │   ├── routes/       #   API routes
│   │   ├── utils/        #   helpers
│   │   └── scripts/      #   database seeding
│   └── server.js         #   Express entry point
├── scripts/              # E2E + API test suites
├── screenshots/          # README images
└── index.html
```

## 🚀 Getting Started

### 1. Start the backend (Express + MongoDB)

```bash
cd backend
npm install
npm run dev        # http://localhost:5000 (auto-seeds an empty database)
```

> **No MongoDB installed?** The backend auto-starts an in-memory MongoDB
> (`mongodb-memory-server`) when `MONGO_URI` is not set, so it runs immediately.
> For a real database, create a free [MongoDB Atlas](https://www.mongodb.com/atlas)
> cluster and set `MONGO_URI` in `backend/.env` (see `.env.example`).
> `npm run seed` re-seeds restaurants, foods, coupons and demo users.

### 2. Start the frontend (React)

```bash
npm install
npm run dev        # http://localhost:5173
```

The frontend calls the API through a Vite dev proxy (`/api` → `http://localhost:5000`),
so no configuration is needed. If the backend runs elsewhere, set `VITE_API_URL`
in a frontend `.env` file (see `.env.example`). The app shows friendly error
states with retry when the API is unreachable.

### Demo accounts (created by the seed script)

| Role | Email | Password |
|---|---|---|
| Customer | `demo@foodrush.app` | `demo123` |
| Admin | `admin@foodrush.app` | `admin123` |
| Restaurant owner | `owner@foodrush.app` | `owner123` |
| Delivery partner | `delivery@foodrush.app` | `delivery123` |

## 🔌 REST API

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | — |
| POST | `/api/auth/login` | Login → JWT | — |
| GET | `/api/auth/me` | Current user | ✅ |
| PATCH | `/api/auth/me` | Update name / phone | ✅ |
| POST | `/api/auth/forgot-password` | Request reset link | — |
| POST | `/api/auth/reset-password/:token` | Set new password | — |
| GET | `/api/categories` | All categories | — |
| GET | `/api/restaurants` | List + search/filter/sort (`category`, `cuisine`, `rating`, `pureVeg`, `sort`) | — |
| GET | `/api/restaurants/:slug` | Restaurant + menu grouped by section | — |
| GET | `/api/foods?search=` | Search dishes across restaurants | — |
| GET | `/api/coupons` | Available coupons | — |
| POST | `/api/coupons/validate` | Preview a coupon's discount | — |
| GET/POST | `/api/addresses` | List / create addresses | ✅ |
| PATCH/DELETE | `/api/addresses/:id` | Update / delete address | ✅ |
| GET/POST | `/api/orders` | List my orders / place an order (prices recomputed server-side) | ✅ |
| GET | `/api/orders/:id` | Order details (owner / admin / restaurant / assigned delivery) | ✅ |
| PATCH | `/api/orders/:id/status` | Advance status (role-gated) or cancel | ✅ |
| POST | `/api/orders/:id/reorder` | Rebuild cart from a past order | ✅ |
| GET | `/api/orders/admin/dashboard` | Users / restaurants / orders / revenue stats | admin |
| GET | `/api/orders/restaurant/mine` | A restaurant owner's incoming orders | restaurant |
| GET | `/api/orders/delivery/available` | Orders awaiting a delivery partner | delivery |
| POST | `/api/orders/delivery/accept/:id` | Accept a delivery | delivery |
| GET/POST | `/api/reviews` | List reviews / write one (after delivery) | ✅ |
| GET | `/api/reviews/admin/all` | All reviews with context | admin |
| GET | `/api/users/admin/all` | All users with order counts | admin |
| PATCH/DELETE | `/api/users/:id` | Change role / delete user | admin |
| GET | `/api/orders/admin/all` | All orders (+ pending/completed/revenue stats) | admin |
| GET | `/api/orders/admin/charts` | Daily orders/revenue + popular foods & restaurants | admin |
| POST | `/api/restaurants` · `/api/foods` | Admin CRUD for restaurants & foods | admin |
| PATCH/DELETE | `/api/categories/:id` | Admin CRUD for categories | admin |
| POST/PATCH/DELETE | `/api/coupons` | Admin CRUD for coupons | admin |

## 🧭 Roadmap

- [x] **Phase 1** — Stable, tested frontend on GitHub
- [x] **Phase 2–3** — Express API + MongoDB with seeded data
- [x] **Phase 2–3** — Express API + MongoDB with seeded data
- [x] **Phase 4** — Real auth: register / login / JWT / protected routes / forgot & reset password
- [x] **Phase 5 (API)** — Orders, addresses, reorder, favourites & role-gated status pipeline
- [x] **Phase 12 (API)** — Reviews with rating aggregation & delivered-order gate
- [x] **Phase 13 (API)** — Automated endpoint test suite (`npm run test:api`, 65 checks)
- [x] **Phase 4–5 (UI)** — Full API connection: real auth (JWT + refresh restore), restaurants, menus, addresses, coupons, orders, tracking & reviews
- [x] **Phase 6** — Admin dashboard at `/admin` (stats & charts, users, restaurants, foods, categories, coupons, order pipeline, reviews)
- [ ] **Phase 7** — Restaurant owner dashboard
- [ ] **Phase 8** — Payment gateway (UPI / cards / net-banking, keep COD)
- [ ] **Phase 9** — Real-time tracking with Socket.IO
- [ ] **Phase 10** — Delivery partner dashboard
- [ ] **Phase 11** — Maps & location services
- [ ] **Phase 13** — Frontend unit & component tests
- [ ] **Phase 14** — Deploy (Vercel + Render/Railway + MongoDB Atlas)

## ✅ Testing

**API** (`cd backend && npm run test:api`) — 65 checks across every endpoint:
auth (register/login/phone login/forgot+reset), role permissions, coupon
validation, order placement with server-side price recomputation (unit price +
add-ons + customisations + GST + coupon), the full restaurant → delivery status
pipeline, admin CRUD, and reviews.

**Customer journey** — verified end-to-end in headless Chrome against the real
API: signup → search → restaurant → customised dish → cart → backend-validated
coupon → checkout with a MongoDB-persisted address → real order placement → live
tracking → reorder → profile → logout → login again → refresh persistence, plus
dark mode, reviews after delivery, and mobile layout (390px, no horizontal
overflow, no console errors). 10/10 checks pass.

**Admin dashboard** — verified end-to-end in headless Chrome as `admin@foodrush.app`:
dashboard stat cards & charts, users list, add-restaurant, foods & categories
lists, add-category, coupons, orders, reviews, mobile layout (390px, no
overflow), dark-mode toggle, and that non-admin users are redirected away from
`/admin`. 19/19 checks pass with zero console errors.

> Note: `npm run test:api` asserts on exact database state (e.g. "reviews empty",
> "1 seeded address"), so restart the backend (fresh in-memory DB) before running
> it if the app has been used.

## 📝 Notes

- The UI never trusts client-side prices: order totals (unit price + add-ons +
  customisations + 5% GST + coupon discount) are recomputed by the backend, and
  the cart is only cleared after the order exists in MongoDB.
- The cart, favourites and UI settings stay in `localStorage`; auth, addresses,
  orders and reviews are the source of truth in MongoDB. Passwords are never
  stored client-side.
- The tracking page polls `GET /api/orders/:id` every 5s — status changes made
  by the kitchen/rider appear without a manual refresh (WebSockets are a later
  phase).
- "Continue with Google" is a demo social login: it provisions a demo account
  via the API on first use (no real OAuth provider is wired up yet).
- Payments are simulated (UPI / card / COD) — no real money moves, and card
  details are never stored.

