<div align="center">

# 🛒 M-Cart — Frontend (Next.js 16)

### Why · What · Where · When · How — the complete guide

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)

![SSR](https://img.shields.io/badge/SSR-✓-22C55E?style=flat-square)
![SEO](https://img.shields.io/badge/SEO-optimized-16A34A?style=flat-square)
![Lazy_Loading](https://img.shields.io/badge/Lazy_Loading-✓-0EA5E9?style=flat-square)
![Responsive](https://img.shields.io/badge/100%25-Responsive-8B5CF6?style=flat-square)
![Live_Tracking](https://img.shields.io/badge/Live-Tracking-EF4444?style=flat-square)

**One frontend → 🧑 Customer storefront · 🏪 Vendor panel · 🛵 Delivery panel · 🛡️ Admin panel**
Talks to the **M-Cart NestJS backend** at `/api/v1/...` with JWT + rotating refresh.

</div>

---

## 📑 Table of Contents

| # | Section | # | Section |
|---|---|---|---|
| 1 | [Quick Start](#-1-quick-start) | 9 | [Customer Journey](#-9-customer-journey) |
| 2 | [What M-Cart Is](#-2-what-m-cart-is) | 10 | [Order Lifecycle (end-to-end)](#-10-order-lifecycle-end-to-end) |
| 3 | [Architecture](#-3-architecture) | 11 | [Local vs National Delivery](#-11-local-hyperlocal-vs-national-delivery) |
| 4 | [Tech Stack — Why / What / When](#-4-tech-stack--why--what--when--use-case) | 12 | [Vendor · Delivery · Admin](#-12-vendor--delivery--admin-flows) |
| 5 | [Folder Structure](#-5-folder-structure) | 13 | [Platform Fee 💰](#-13-platform-fee--how-m-cart-earns) |
| 6 | [Redux — How State Works](#-6-redux--how-state-works) | 14 | [Data Layer & Server Integration](#-14-data-layer--server-side-integration) |
| 7 | [Auth Flow (login/logout/refresh)](#-7-auth-flow-login--logout--refresh) | 15 | [SEO · Lazy Loading · Animations](#-15-seo--lazy-loading--animations) |
| 8 | [Role-based Routing](#-8-role-based-routing) | 16 | [Page Map & Scripts](#-16-page-map--scripts) |

---

## 🚀 1. Quick Start

```bash
# 1) Install
npm install

# 2) Configure environment (copy + edit)
cp .env.example .env.local

# 3) Start the backend (NestJS) on port 4000
#    in the backend repo:  PORT=4000 npm run start:dev

# 4) Start the frontend (port 3000)
npm run dev          # → http://localhost:3000
```

**Login credentials (seeded):**

| Role | Email | Password | Lands on |
|---|---|---|---|
| 🏪 Vendor | `vendor@mcart.local` | `Vendor@123` | `/vendor/dashboard` |
| 🛡️ Admin | `admin@mcart.local` | `Admin@123` | `/admin/dashboard` |
| 🧑 Customer | register any email | — | `/` |

> `.env.local` keys: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api`), `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`. **Secrets never live in the frontend.**

---

## 🧩 2. What M-Cart Is

M-Cart is **one website that behaves like four apps**, decided by the `role` inside your JWT:

- 🧑 **Customer storefront** — browse, cart, wishlist, checkout, pay, track.
- 🏪 **Vendor panel** — list products, manage orders, view earnings.
- 🛵 **Delivery panel** — accept orders, share live GPS, deliver with OTP (Zepto/Blinkit-style).
- 🛡️ **Admin panel** — approve vendors/products/partners, refunds, coupons, fees.

---

## 🏗️ 3. Architecture

```mermaid
flowchart TD
  subgraph CLIENTS["👥 Users (role decides the panel)"]
    U["🧑 Customer"]
    VE["🏪 Vendor"]
    DE["🛵 Delivery"]
    AD["🛡️ Admin"]
  end

  subgraph FE["🖥️ M-Cart Next.js Frontend"]
    PAGES["📄 App Router pages<br/>(store) · (auth) · vendor · delivery · admin"]
    RDX["🗃️ Redux Toolkit<br/>auth · cart · wishlist · ui"]
    SVC["🔌 Services (typed)"]
    API["🚪 lib/api.ts<br/>Bearer + auto-refresh"]
  end

  BE["🟥 NestJS Backend /api/v1"]
  DB[("🍃 MongoDB")]
  RZP["💳 Razorpay"]
  WS["📍 Socket.IO live GPS"]

  U & VE & DE & AD --> PAGES
  PAGES --> RDX --> SVC
  PAGES --> SVC --> API --> BE
  BE --> DB
  BE --> RZP
  BE --> WS

  classDef u fill:#6366F1,stroke:#312E81,color:#fff,stroke-width:2px;
  classDef fe fill:#10B981,stroke:#065F46,color:#fff,stroke-width:2px;
  classDef be fill:#EF4444,stroke:#991B1B,color:#fff,stroke-width:2px;
  classDef inf fill:#F59E0B,stroke:#92400E,color:#111,stroke-width:2px;
  class U,VE,DE,AD u;
  class PAGES,RDX,SVC,API fe;
  class BE be;
  class DB,RZP,WS inf;
```

---

## 🛠️ 4. Tech Stack — Why / What / When / Use-case

| Tech | What it is | **Why** we use it | **When / Use-case in M-Cart** |
|---|---|---|---|
| **Next.js 16 (App Router)** | React framework: file routing + server components | One codebase does **SSR** (fast first paint + SEO) **and** client interactivity; route groups isolate the 4 panels | `/products`, home "Trending", product detail **server-render from the DB**; each route has a `loading.tsx` for instant lazy UI |
| **React 19** | UI component library | Components + hooks + huge ecosystem | Every screen: `ProductCard`, `PanelShell`, `Header`… |
| **TypeScript** | Typed JavaScript | Catches bugs at compile time; typed API contract end-to-end | `src/types`, all services & Redux are typed → `tsc` verifies the whole app |
| **Redux Toolkit** | Predictable state container | Cart, wishlist, auth & toasts must be **shared live across pages + header** | Add to cart → `cartSlice` → header badge updates instantly everywhere |
| **Tailwind CSS v4** | Utility-first CSS | Consistent, **fully responsive** UI fast; animations via `@keyframes`; no CSS files | Header, footer, cards, splash + skeleton + loader **animations** |
| **Zod** | Schema validation | Validate forms **before** the API → instant inline errors | Login / Register / OTP / Address (`src/lib/validation.ts`) |
| **Razorpay** | Payment gateway | Trusted Indian payments (UPI/Card/NetBanking); signature verified **server-side** | Checkout → live payment → `payments` saved in DB |
| **Swiper** | Touch slider | Smooth, accessible carousels | Home hero + **product image gallery** (lazy-loaded) |
| **`lib/api.ts`** | Custom fetch wrapper | One place for **Bearer auth + 401 auto-refresh + error shaping** | Every service call routes through it |

### 🧠 Why this combo?
- **Next.js + TypeScript** → reliable, server-rendered, SEO-friendly storefront.
- **Redux Toolkit** → cart/wishlist/auth that feel "live" across the whole app.
- **Tailwind** → one design language, responsive by default, animations with no extra library.
- **Zod** → trustworthy forms · **Razorpay** → trustworthy money.

```mermaid
flowchart LR
  C["🧩 Component"] --> RDX["🗃️ Redux Toolkit"]
  C --> SVC["🔌 Services (typed)"]
  RDX --> SVC --> API["🚪 lib/api.ts"]
  API --> BE["🟥 /api/v1"]
  C -. "styling" .-> TW["🎨 Tailwind v4"]
  C -. "validation" .-> Z["✅ Zod"]
  classDef x fill:#0EA5E9,stroke:#075985,color:#fff;
  classDef y fill:#8B5CF6,stroke:#5B21B6,color:#fff;
  class C,RDX,SVC,API,BE x;
  class TW,Z y;
```

---

## 📂 5. Folder Structure

```
nextjs-cart-fed/
├── app/
│   ├── layout.tsx               # root: fonts · SEO metadata · <Providers> · splash
│   ├── globals.css              # Tailwind v4 + animations + skeletons
│   ├── robots.ts · sitemap.ts   # SEO (server-generated, includes live products)
│   ├── (store)/                 # 🛍️ customer site (Header + Footer + MobileNav)
│   │   ├── page.tsx (home) · products/ · products/[id]/
│   │   ├── cart/ · wishlist/ · checkout/
│   │   ├── orders/ · orders/[id]/ · track/ · track/[id]/
│   │   ├── account/ · account/wallet/ · info/[slug]/
│   ├── (auth)/                  # 🔐 split-screen: login · register · otp · forgot · onboarding
│   ├── vendor/ · delivery/ · admin/   # role panels (PanelShell)
└── src/
    ├── components/  layout/ · home/ · products/ · common/ · panel/
    ├── redux/       store · hooks · Providers · slices/{auth,cart,wishlist,ui}
    ├── services/    auth · catalog · shop · money · roles  (typed API calls)
    ├── lib/         api.ts · server-api.ts · storage.ts · validation.ts · razorpay.ts
    ├── hooks/       useAuth · useToast
    ├── types/ · constants/ · utils/
```

---

## 🗃️ 6. Redux — How State Works

Redux Toolkit holds the data that must stay in sync **everywhere at once** (cart count in the header, wishlist hearts, who's logged in, toasts).

```mermaid
flowchart LR
  UI["🧩 Component<br/>(Add to Cart)"] -->|"dispatch(addToCart)"| TH["⚙️ Thunk<br/>cartSlice"]
  TH -->|"POST /cart"| API["🚪 lib/api.ts"] --> BE["🟥 Backend"]
  BE -->|"updated cart"| TH
  TH -->|"reducer sets state.cart"| STORE["🗃️ Store"]
  STORE -->|"useAppSelector"| H["🛍️ Header badge"]
  STORE -->|"useAppSelector"| CART["🛒 Cart page"]
  classDef a fill:#764ABC,stroke:#4C1D95,color:#fff;
  classDef b fill:#0EA5E9,stroke:#075985,color:#fff;
  class UI,TH,STORE a;
  class API,BE,H,CART b;
```

| Slice | Holds | Key thunks / actions |
|---|---|---|
| `auth` | `user`, status, `initialized` | `loginThunk` · `registerThunk` · `verifyOtpThunk` · `googleThunk` · `bootstrapAuth` · `logoutThunk` |
| `cart` | server cart | `fetchCart` · `addToCart` · `updateCartItem` · `removeCartItem` · `clearCart` |
| `wishlist` | saved products | `fetchWishlist` · `toggleWishlist` |
| `ui` | toasts · mobile menu · **delivery location** | `addToast` · `setLocation` · `hydrateLocation` |

Typed hooks: `useAppDispatch` / `useAppSelector`. `Providers.tsx` creates the store per request and bootstraps auth on load.

---

## 🔐 7. Auth Flow (login · logout · refresh)

Tokens live in `localStorage`. `lib/api.ts` attaches the Bearer token to every call and **transparently refreshes once** on a `401`.

```mermaid
sequenceDiagram
  autonumber
  participant U as 🧑 User
  participant R as 🗃️ authSlice (thunk)
  participant API as 🚪 lib/api.ts
  participant BE as 🟥 Backend
  U->>R: login (email + password / role)
  R->>API: POST /auth/login
  API->>BE: credentials
  BE-->>API: { accessToken, refreshToken }
  API-->>R: tokens (then GET /auth/me → user)
  R->>R: store tokens + state.user
  R-->>U: redirect by role
  Note over API,BE: later — access token expires
  API->>BE: GET /orders (Bearer) → 401
  API->>BE: POST /auth/refresh {refreshToken}
  BE-->>API: new tokens (rotated)
  API->>BE: retry GET /orders ✅
```

> **On load** `bootstrapAuth()` restores the session and verifies via `/auth/me`. **Logout** clears tokens + resets state.

---

## 🧭 8. Role-based Routing

At **registration you pick a role** → the account is created with it → you're redirected to that panel. Protected pages use `<RequireAuth roles={[...]}>`.

```mermaid
flowchart LR
  L["🔐 Login / Register"] --> J{"JWT roles"}
  J -->|customer| C["🛍️ / storefront"]
  J -->|vendor| V["🏪 /vendor/dashboard"]
  J -->|delivery| D["🛵 /delivery/dashboard"]
  J -->|admin| A["🛡️ /admin/dashboard"]
  classDef a fill:#6366F1,stroke:#312E81,color:#fff;
  class L,J,C,V,D,A a;
```

> 🛂 Cart, Checkout, Orders, Account & Wishlist require login. Adding to cart while logged out → toast + redirect to `/login?next=…`.

---

## 🛍️ 9. Customer Journey

```mermaid
flowchart LR
  A["📝 Sign up"] --> B["📍 Set location"] --> C["🔍 Browse"] --> D["🛍️ Cart"]
  D --> E["💳 Checkout<br/>address + PIN + coupon"] --> F{"Pay"}
  F -->|Razorpay| G["UPI/Card"]
  F -->|COD| H["Cash"]
  F -->|Wallet| I["Wallet"]
  G & H & I --> J["✅ Placed"] --> K["📍 Track live"] --> L["📦 OTP → received"] --> M["⭐ Review"]
  classDef c fill:#22C55E,stroke:#15803D,color:#fff;
  class A,B,C,D,E,G,H,I,J,K,L,M c;
```

> **Receiving:** the partner asks for the **POD OTP** (sent at pickup); the customer reads it out → order marked **DELIVERED**.

---

## 🗺️ 10. Order Lifecycle (end-to-end)

```mermaid
sequenceDiagram
  autonumber
  participant Ve as 🏪 Vendor
  participant Ad as 🛡️ Admin
  participant Cu as 🧑 Customer
  participant API as 🟥 Backend
  participant DB as 🍃 MongoDB
  participant De as 🛵 Delivery
  Ve->>API: add product (PENDING)
  Ad->>API: approve 🟢 → public
  Cu->>API: cart → place order (+ address + PIN)
  API->>DB: Order PLACED
  Cu->>API: pay (Razorpay verify ✅)
  API->>DB: Payment saved · CONFIRMED · commission split
  Ad->>De: assign / auto-assign nearest partner
  De->>API: accept → pickup (POD OTP)
  loop live
    De->>API: push GPS
    API-->>Cu: 📍 live on /track/[id]
  end
  De->>API: proof-of-delivery (OTP) ✅
  API->>DB: DELIVERED · vendor +90% · platform +10%
```

### 🧾 Status machine (forward-only)
```mermaid
stateDiagram-v2
  [*] --> placed
  placed --> confirmed --> packed --> shipped --> out_for_delivery --> delivered
  placed --> cancelled
  confirmed --> cancelled
  delivered --> returned
```

---

## 🛵 11. Local (hyperlocal) vs National Delivery

```mermaid
flowchart TD
  O["🧾 Paid order<br/>(customer PIN + lat/lng)"] --> Q{"Vendor near customer?"}
  Q -->|"✅ Local"| L["🛵 HYPERLOCAL (Zepto-style)<br/>nearest partner (2dsphere)<br/>live GPS · OTP · minutes"]
  Q -->|"🚚 Far"| N["📦 NATIONAL shipping<br/>packed → shipped → delivered<br/>status timeline · days"]
  L --> D["✅ Delivered (OTP + photo)"]
  N --> D
  classDef l fill:#10B981,stroke:#065F46,color:#fff;
  classDef n fill:#0EA5E9,stroke:#075985,color:#fff;
  class L,D l;
  class N n;
```

Same order schema + tracking page — only **assignment + speed** differ. The header **"Deliver to"** location feeds auto-assign.

---

## 🏪 12. Vendor · Delivery · Admin Flows

```mermaid
flowchart TD
  subgraph VEN["🏪 Vendor"]
    v1["register + KYC"] --> v2["add products (pending)"] --> v3["fulfil orders → advance status"]
  end
  subgraph DEL["🛵 Delivery"]
    d1["register + KYC"] --> d2["go online"] --> d3["accept → pickup (OTP)"] --> d4["live GPS"] --> d5["proof-of-delivery"]
  end
  subgraph ADM["🛡️ Admin"]
    a1["approve vendors/partners/products"] --> a2["orders · refunds · assign"] --> a3["users · roles · coupons · flags"]
  end
  classDef v fill:#6366F1,stroke:#312E81,color:#fff;
  classDef d fill:#10B981,stroke:#065F46,color:#fff;
  classDef a fill:#EF4444,stroke:#991B1B,color:#fff;
  class v1,v2,v3 v;
  class d1,d2,d3,d4,d5 d;
  class a1,a2,a3 a;
```

All three share the responsive **`PanelShell`** (collapsible sidebar + topbar + logout), themed by accent colour (indigo / emerald / rose).

---

## 💰 13. Platform Fee — How M-Cart Earns

```mermaid
flowchart LR
  O["🧾 Order ₹1000"] --> SP{"💰 Commission 10%"}
  SP -->|10%| PLAT["🏦 Platform ₹100"]
  SP -->|90%| VEN["🏪 Vendor ₹900"]
  VEN --> SET["📅 Settlement → payout"]
  classDef m fill:#22C55E,stroke:#15803D,color:#fff;
  classDef p fill:#0EA5E9,stroke:#075985,color:#fff;
  class O,VEN,SET m;
  class PLAT,SP p;
```

| Revenue | How |
|---|---|
| **Commission** | 10% of every sale (per-vendor configurable) |
| **Delivery fee** | on hyperlocal orders |
| **Convenience fee** | bookings / promotions |
| **Wallet float** | money parked in wallets |

---

## 🔌 14. Data Layer & Server-Side Integration

```mermaid
flowchart LR
  SRV["🖥️ Server Component<br/>(home · /products · [id] · sitemap)"] --> SAPI["lib/server-api.ts<br/>(no CORS, no token)"]
  CLI["🧩 Client Component"] --> SVC["services/*.ts"] --> CAPI["lib/api.ts<br/>(Bearer + refresh)"]
  SAPI --> BE["🟥 /api/v1"]
  CAPI --> BE
  classDef s fill:#16A34A,stroke:#14532D,color:#fff;
  classDef c fill:#0EA5E9,stroke:#075985,color:#fff;
  class SRV,SAPI s;
  class CLI,SVC,CAPI c;
  class BE c;
```

- **Server-side (SSR):** home "Trending", `/products`, `/products/[id]`, info pages and the sitemap fetch from the backend **on the server** → content is in the HTML on first paint (fast + SEO).
- **Client-side:** cart, wishlist, auth, reviews, tracking → through `services/` + `lib/api.ts` (Bearer + single auto-refresh on 401 + normalised `ApiError`).

---

## ⚡ 15. SEO · Lazy Loading · Animations

**SEO**
- Rich metadata: title template, description, **keywords**, **Open Graph**, **Twitter card**, **robots**, canonical, `metadataBase`.
- **`/robots.txt`** (allows storefront, blocks private panels) + **`/sitemap.xml`** (server-generated, includes every live product).
- Per-page `generateMetadata` (product title, info pages).

**Lazy loading**
- Each route has `loading.tsx` → **instant skeleton / branded loader** via Suspense.
- **Swiper gallery is dynamically imported** (`ssr:false` + skeleton) — heavy lib loads only on the product page.
- Product images use `loading="lazy"`.

**Animations (Tailwind + `@keyframes`, no library)**
- **Splash intro** on first visit (floating 🛒 + pulse rings + wordmark + bar).
- Skeleton **shimmer**, **staggered fade-up** product reveals, toast slide-up, card hover-lift.

---

## 🗺️ 16. Page Map & Scripts

| Area | Routes |
|---|---|
| **Customer** | `/` · `/products` · `/products/[id]` · `/cart` · `/wishlist` · `/checkout` · `/orders` · `/orders/[id]` · `/track` · `/track/[id]` · `/account` · `/account/wallet` · `/info/[slug]` |
| **Auth** | `/login` · `/register` · `/otp` · `/forgot-password` · `/onboarding` |
| **Vendor** | `/vendor` · `/vendor/register` · `/vendor/dashboard` · `/vendor/products` · `/vendor/orders` |
| **Delivery** | `/delivery` · `/delivery/register` · `/delivery/dashboard` · `/delivery/profile` |
| **Admin** | `/admin/dashboard` · `/admin/products` · `/admin/orders` · `/admin/vendors` · `/admin/delivery` · `/admin/users` · `/admin/coupons` |
| **SEO** | `/robots.txt` · `/sitemap.xml` |

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build (all routes compile)
npm run start    # serve production build
npm run lint     # eslint
```

---

<div align="center">

### 🛒 M-Cart Frontend
Next.js 16 · React 19 · Redux Toolkit · Tailwind v4 · TypeScript · Zod · Razorpay · Swiper
🔐 JWT auto-refresh · 🛂 role-gated panels · 📍 live tracking · 💳 Razorpay/COD/Wallet · ⚡ SSR + SEO + lazy loading · 📱 fully responsive

**Made with ❤️ — one backend, four apps, infinite scale.**

[![Backend Repo](https://img.shields.io/badge/🟥_Backend_(NestJS)-View_on_GitHub-181717?style=for-the-badge&logo=github)](https://github.com/1Mallesh/m-cart-nest-bed)

</div>

<br/>

---
---

<div align="center">

# 🟥 BACKEND REFERENCE — M-Cart (NestJS)

### Enterprise Multi-Vendor eCommerce + Hyperlocal Delivery Backend

[![Open the Backend Repository](https://img.shields.io/badge/👉_Open_Backend_Repo_on_GitHub-1Mallesh%2Fm--cart--nest--bed-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/1Mallesh/m-cart-nest-bed)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white)
![Endpoints](https://img.shields.io/badge/REST_APIs-80+-blue?style=flat-square)

**The frontend above talks to this backend → also serves Android · iOS · Flutter · React Native.**

</div>

> 🔗 **Backend source code & live API docs:** <https://github.com/1Mallesh/m-cart-nest-bed>

---

## 🟥 B1. Backend Quick Start

```bash
cp .env.example .env                       # fill secrets (use TEST keys in dev)
npm install
docker compose up -d mongo redis           # start MongoDB + Redis
npm run start:dev                          # 🚀 http://localhost:4000/api
```

| What | URL |
|---|---|
| 📖 **Swagger UI** (try every API live) | http://localhost:4000/api/docs |
| ❤️‍🩹 **Health probe** | http://localhost:4000/api/v1/health |

> **Base URL** `http://localhost:4000/api` · **Versioning** → every route is `/api/v1/...` · **Auth** `Authorization: Bearer <accessToken>`

---

## 🟥 B2. Backend System Architecture

```mermaid
flowchart TD
    subgraph CLIENTS["📱 Client Apps"]
        WEB["🌐 Next.js Website"]
        AND["🤖 Android App"]
        IOS["🍎 iOS App"]
        FLU["💙 Flutter App"]
        ADM["🛠️ Admin Panel"]
        VEN["🏪 Vendor Panel"]
        DEL["🛵 Delivery App"]
    end
    GW["🚪 NestJS API Gateway<br/>/api/v1 · JWT · RBAC · Rate-limit"]
    subgraph CORE["⚙️ Domain Modules"]
        AUTH["🔐 Auth"]
        VND["🏪 Vendors"]
        PRD["📦 Products"]
        ORD["🧾 Orders"]
        PAY["💳 Payments"]
        WAL["👛 Wallet"]
        TRK["📍 Tracking"]
        NOT["🔔 Notifications"]
    end
    subgraph INFRA["🗄️ Infrastructure"]
        MDB[("🍃 MongoDB")]
        RDS[("⚡ Redis Cache")]
        KAF{{"📨 Kafka Events"}}
        WS["🔌 Socket.IO"]
    end
    WEB & AND & IOS & FLU & ADM & VEN & DEL --> GW
    GW --> CORE
    CORE --> MDB
    CORE --> RDS
    CORE --> KAF
    TRK --> WS
    DEL -. "live GPS" .-> WS
    WS -. "live location" .-> WEB
    classDef client fill:#4F46E5,stroke:#312E81,color:#fff,stroke-width:2px;
    classDef gate fill:#0EA5E9,stroke:#075985,color:#fff,stroke-width:3px;
    classDef core fill:#10B981,stroke:#065F46,color:#fff,stroke-width:2px;
    classDef infra fill:#F59E0B,stroke:#92400E,color:#111,stroke-width:2px;
    class WEB,AND,IOS,FLU,ADM,VEN,DEL client;
    class GW gate;
    class AUTH,VND,PRD,ORD,PAY,WAL,TRK,NOT core;
    class MDB,RDS,KAF,WS infra;
```

---

## 🟥 B3. Database / ER Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o| VENDOR : "is (if vendor)"
    USER ||--o| DELIVERYPROFILE : "is (if delivery)"
    USER ||--o| WALLET : owns
    USER ||--o{ ADDRESS : has
    USER ||--o{ REVIEW : writes
    USER ||--o| CART : has
    VENDOR ||--o{ PRODUCT : sells
    CATEGORY ||--o{ PRODUCT : groups
    BRAND ||--o{ PRODUCT : labels
    PRODUCT ||--o| INVENTORY : stock
    PRODUCT ||--o{ REVIEW : receives
    ORDER ||--|{ ORDERITEM : contains
    ORDER ||--o| PAYMENT : "paid by"
    ORDER ||--o{ LOCATIONPING : "tracked by"
    DELIVERYPROFILE ||--o{ DELIVERYASSIGNMENT : handles
    WALLET ||--o{ WALLETTXN : ledger
    COUPON ||--o{ ORDER : discounts
    USER { ObjectId _id string email_UK string phone_UK string passwordHash string_array roles }
    VENDOR { ObjectId user_FK string shopName string gstNumber string kycStatus number commissionRate bool isApproved }
    PRODUCT { ObjectId vendor_FK string title number price ObjectId category_FK string status }
    ORDER { string orderNumber_UK ObjectId user_FK number total string status string paymentMethod }
    PAYMENT { ObjectId order_FK string provider number amount string status }
    DELIVERYPROFILE { ObjectId user_FK string kycStatus bool isApproved point location number pendingPayout }
    WALLET { ObjectId user_FK number balance }
```

---

## 🟥 B4. Tech Stack & Security

**Stack:** NestJS 10 · TypeScript · MongoDB (Mongoose) · Redis · Kafka · Socket.IO · JWT + Passport · Swagger · class-validator · Jest · Docker · Kubernetes · GitHub Actions + Gemini AI review.

- 🔑 Passwords **bcrypt**-hashed, never returned (`select:false`)
- 🔄 Short-lived **access JWT** + rotating **refresh JWT** (reuse detected)
- 🛡️ **RBAC** via `@Roles()` + `RolesGuard` — 5 roles: `customer · vendor · delivery · admin · super_admin`
- ✅ Global `ValidationPipe` (whitelist + forbidNonWhitelisted) + rate limiting
- 🧾 Audit logs + global exception filter · 🔒 secrets only via env (Razorpay HMAC constant-time compare)

---

## 🟥 B5. Razorpay Payment Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as 🛒 Customer
    participant API as 🚪 M-Cart API
    participant RZP as 💳 Razorpay
    participant WAL as 👛 Wallet/Settlement
    U->>API: POST /payments/create-order {orderId, amount}
    API->>RZP: create order (server-side, secret key)
    RZP-->>API: providerOrderId
    API-->>U: {providerOrderId, key, amount}
    U->>RZP: Checkout (UPI / Card / NetBanking)
    RZP-->>U: payment_id + signature
    U->>API: POST /payments/verify {providerOrderId, providerPaymentId, signature}
    API->>API: HMAC-SHA256 verify (timingSafeEqual)
    alt ✅ valid
        API->>WAL: split commission → vendor earning
        API-->>U: 🟢 success, order CONFIRMED
    else ❌ invalid
        API-->>U: 🔴 400 Bad signature
    end
```

---

## 🟥 B6. The Request Lifecycle (how data is saved)

```mermaid
flowchart LR
    A["📱 Client<br/>JSON + Bearer"] --> B["🚪 Controller"]
    B --> C["🛡️ Guards<br/>JWT + RBAC"]
    C -->|allowed| D["✅ ValidationPipe<br/>(DTO rules)"]
    C -->|denied| X["⛔ 401/403"]
    D -->|valid| E["⚙️ Service<br/>business logic"]
    D -->|invalid| Y["⛔ 400"]
    E --> F["🍃 Mongoose Model"] --> G[("💾 MongoDB")]
    E --> H["📨 Kafka emit (optional)"]
    E -->|response| A
    classDef cl fill:#6366F1,stroke:#312E81,color:#fff;
    classDef sec fill:#EF4444,stroke:#991B1B,color:#fff;
    classDef ok fill:#10B981,stroke:#065F46,color:#fff;
    classDef db fill:#F59E0B,stroke:#92400E,color:#111;
    class A,B cl;
    class C,X,Y sec;
    class D,E,H ok;
    class F,G db;
```

---

## 🟥 B7. How Kafka Works

```mermaid
flowchart LR
    subgraph PROD["📤 Producers"]
        ORD["🧾 order.created"]
        PAY["💳 payment.success"]
        VND["🏪 vendor.approved"]
    end
    K{{"📨 KAFKA topic log"}}
    subgraph CONS["📥 Consumers"]
        NOT["🔔 Notifications"]
        WAL["👛 Wallet credit"]
        ANL["📊 Analytics"]
        INV["📦 Inventory"]
    end
    ORD --> K
    PAY --> K
    VND --> K
    K --> NOT
    K --> WAL
    K --> ANL
    K --> INV
    classDef p fill:#6366F1,stroke:#312E81,color:#fff;
    classDef k fill:#F59E0B,stroke:#92400E,color:#111,stroke-width:3px;
    classDef c fill:#10B981,stroke:#065F46,color:#fff;
    class ORD,PAY,VND p;
    class K k;
    class NOT,WAL,ANL,INV c;
```

> Decoupled: if Notifications is down, Orders still works — events wait in Kafka. *Producer ships as a logging stub; swap in `kafkajs` for production.*

---

## 🟥 B8. Backend API Reference (by panel)

> Base path `/api/v1`. 🔓 public · 🔒 any JWT · 👑 admin · 🏪 vendor · 🛵 delivery · 🛒 customer.

**🔐 Auth** — `register · login · otp/request · otp/resend · otp/verify · google · refresh · logout · me`
**👤 Users** — `users/me (GET/PATCH) · users (👑) · users/:id · users/:id/status · users/:id/roles`
**🏪 Vendors** — `vendors/register · upload-documents · submit-kyc · profile (GET/PUT) · dashboard · earnings · :id/approve · :id/reject · :id/verify-kyc`
**📦 Catalog** — `products (POST/GET) · products/:id (GET/PUT/DELETE) · :id/approve · :id/reject · bulk-upload · categories · brands · inventory/:id · inventory/:id/adjust`
**🛒 Shopping** — `cart (GET/POST/DELETE) · cart/:itemId (PUT/DELETE) · wishlist · coupons · coupons/validate · addresses · addresses/:id/default · reviews`
**🧾 Orders** — `orders (POST/GET) · orders/:id · :id/status · :id/cancel · :id/return · vendor/list · admin/list · :id/assign-delivery`
**💳 Payments & 👛 Wallet** — `payments/create-order · verify · webhook · refund · cod-confirm · wallet/balance · add-money · withdraw · history`
**🛵 Delivery** — `delivery/register · upload-documents · submit-kyc · profile · earnings · online · offline · orders · accept · pickup · location · proof-of-delivery · :id/assign · auto-assign · :id/payout · :id/approve · :id/reject · :id/verify-kyc`
**📍 Misc** — `tracking/location · tracking/order/:id · tracking/live/:id · flights/* · bus/* · notifications · feature-flags · audit-logs · health`

> 📖 The full, always-current reference (payloads + try-it-live) is the Swagger UI at **http://localhost:4000/api/docs** and the backend repo README.

---

<div align="center">

### 🟥 Backend: M-Cart (NestJS)
**👉 Full source, Swagger, cURL examples & deployment:**
## [github.com/1Mallesh/m-cart-nest-bed](https://github.com/1Mallesh/m-cart-nest-bed)

🔐 JWT/RBAC · 💳 Razorpay · 📍 Live tracking · 💰 Commission engine · 📨 Kafka · ☸️ Kubernetes-ready

*Frontend (this repo) + Backend (linked above) = the complete M-Cart platform.*

</div>
