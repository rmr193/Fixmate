# FixMate Design System — Master Specification

> **LOGIC:** When building a specific page, first check `design-system/fixmate/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** FixMate — Smart Device & Home Appliance Repair Service Platform  
**Aesthetic Direction:** Precision Technical & Trustworthy Service Marketplace ("Industrial Cobalt & Safety Orange")  
**Theme Support:** Light Mode (Default) & Dark Mode (Full Parity)

---

## 1. Design Philosophy & Research Summary

FixMate bridges the trust gap between device/appliance owners and skilled repair technicians.
- **Customer Journey:** Discover verified service → Inspect transparent starting price, service mode (Home Visit vs. Shop Drop-off), duration & technician credentials → Submit low-friction repair request → Track live status timeline (`Requested → Accepted → In Progress → Completed`) → Pay securely via Stripe Checkout **only after completion** → Download invoice / rate technician.
- **Technician Journey:** Register as technician → List repair services with ImgBB photo upload → Manage availability & edits → Process incoming job requests through strict stage gates → Set final billing amount on completion → Track earnings.
- **Admin Journey:** Monitor platform health KPIs & revenue analytics → Moderate pending services (approve/reject) → Manage user roles safely → Audit all bookings & verified Stripe transactions.

---

## 2. Color Palette & Semantic Tokens

### Brand & Surface Tokens (Light Mode)
| Semantic Role | Hex | Tailwind / CSS Token | Contrast & Usage |
|---|---|---|---|
| **Primary Brand** | `#1E40AF` | `--primary` (`blue-800`) | 8.6:1 on white. Technical authority, main brand actions, active nav |
| **Primary Hover** | `#1E3A8A` | `--primary-hover` (`blue-900`) | Deep cobalt hover state |
| **Secondary Accent** | `#2563EB` | `--secondary` (`blue-600`) | Interactive highlights, links, secondary badges |
| **CTA / Safety Orange** | `#EA580C` | `--accent` (`orange-600`) | 4.6:1 with white text. High-conversion CTAs ("Request Repair", "Pay Now") |
| **Background Primary** | `#F8FAFC` | `--background` (`slate-50`) | Clean technical canvas |
| **Background Elevated / Tint**| `#EFF6FF` | `--surface-tint` (`blue-50`) | Hero accents, feature callouts, active row highlight |
| **Card Surface** | `#FFFFFF` | `--card` | Pure white elevated cards with crisp border |
| **Text Primary** | `#0F172A` | `--foreground` (`slate-900`) | 16.1:1 contrast. Headings and primary copy |
| **Text Secondary** | `#334155` | `--muted-foreground` (`slate-700`) | 9.3:1 contrast. Body paragraphs and descriptions |
| **Text Subtle** | `#475569` | `--subtle-foreground` (`slate-600`) | 7.0:1 contrast. Metadata, captions, timestamps |
| **Border Default** | `#E2E8F0` | `--border` (`slate-200`) | Card & table hairlines |
| **Border Accent** | `#BFDBFE` | `--border-accent` (`blue-200`) | Highlighted cards, active filter chips |
| **Focus Ring** | `#2563EB` | `--ring` | `2px solid #2563EB` with `2px` offset |

### Brand & Surface Tokens (Dark Mode)
| Semantic Role | Hex | Usage |
|---|---|---|
| **Background Primary** | `#0B1120` | Deep technical navy-slate canvas |
| **Card Surface** | `#111827` | Elevated dark card (`slate-900`) |
| **Surface Muted** | `#1E293B` | Secondary panels, table headers (`slate-800`) |
| **Text Primary** | `#F8FAFC` | Crisp white headings |
| **Text Secondary** | `#CBD5E1` | Readable body copy (>= 10:1 contrast) |
| **Primary Brand** | `#3B82F6` | Luminous cobalt for dark surfaces |
| **CTA / Accent** | `#F97316` | Vibrant orange CTA |
| **Border Default** | `#1E293B` | Subtle structural dividers |

### Unified Status & Payment Badge Tokens (Strictly Enforced Across All Dashboards)
| Status / Badge | Light BG & Text | Dark BG & Text | Border | Icon Indicator |
|---|---|---|---|---|
| **Requested** (`requested`) | `bg-blue-50 text-blue-700` | `dark:bg-blue-950/60 dark:text-blue-300` | `border-blue-200 dark:border-blue-800` | Clock / Inbox |
| **Accepted** (`accepted`) | `bg-indigo-50 text-indigo-700` | `dark:bg-indigo-950/60 dark:text-indigo-300` | `border-indigo-200 dark:border-indigo-800` | CheckCircle2 |
| **In Progress** (`in-progress`) | `bg-amber-50 text-amber-800` | `dark:bg-amber-950/60 dark:text-amber-300` | `border-amber-200 dark:border-amber-800` | Wrench / Loader |
| **Completed** (`completed`) | `bg-emerald-50 text-emerald-700` | `dark:bg-emerald-950/60 dark:text-emerald-300` | `border-emerald-200 dark:border-emerald-800` | CheckCheck |
| **Rejected** (`rejected`) | `bg-red-50 text-red-700` | `dark:bg-red-950/60 dark:text-red-300` | `border-red-200 dark:border-red-800` | XCircle |
| **Cancelled** (`cancelled`) | `bg-slate-100 text-slate-700` | `dark:bg-slate-800 dark:text-slate-300` | `border-slate-300 dark:border-slate-700` | Ban |
| **Paid** (`paid`) | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-900/70 dark:text-emerald-200` | `border-emerald-300 dark:border-emerald-700` | ShieldCheck |
| **Unpaid** (`unpaid`) | `bg-amber-100 text-amber-800` | `dark:bg-amber-900/60 dark:text-amber-200` | `border-amber-300 dark:border-amber-700` | CreditCard |
| **Pending Approval** (`pending`)| `bg-amber-50 text-amber-800` | `dark:bg-amber-950/60 dark:text-amber-300` | `border-amber-200 dark:border-amber-800` | Hourglass |
| **Approved** (`approved`) | `bg-emerald-50 text-emerald-700` | `dark:bg-emerald-950/60 dark:text-emerald-300` | `border-emerald-200 dark:border-emerald-800` | BadgeCheck |

---

## 3. Typography System

- **Heading Font:** `Plus Jakarta Sans` (Weights: `600`, `700`, `800`; tight tracking `-0.02em`)
- **Body Font:** `Inter` (Weights: `400`, `500`, `600`; comfortable reading line-height `1.6`)
- **Technical / Monospace Font:** `JetBrains Mono` (Weights: `500`, `600`; used for prices, transaction IDs, durations, booking references)

### Type Scale
| Element | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| **Display / Hero H1** | `clamp(2.25rem, 4vw, 3.5rem)` | `1.12` | `800` | Home Hero Headline |
| **Section H2** | `clamp(1.75rem, 2.5vw, 2.25rem)` | `1.2` | `700` | Page & Section Titles (Consistent across all sections) |
| **Card Title H3** | `1.125rem` (`18px`) | `1.35` | `600` | Service Card & Widget Titles (`line-clamp-1`) |
| **Body Default** | `1rem` (`16px`) | `1.6` | `400` | Descriptions, form inputs |
| **Body Compact** | `0.875rem` (`14px`) | `1.5` | `400`/`500` | Table cells, metadata, nav items |
| **Label / Badge** | `0.75rem` (`12px`) | `1.25` | `600` | Status badges, category pills, uppercase eyebrow labels |

---

## 4. Layout, Grid & Component Specifications

### Equal-Dimension Service Cards
- Every Service Card in Featured Services (`/`) and Browse Services (`/services`) MUST use `h-full flex flex-col justify-between` inside a CSS Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` or `xl:grid-cols-4`).
- **Image Container:** Fixed aspect ratio `aspect-[16/10]` (`h-48 w-full overflow-hidden bg-slate-100`) with `object-cover` and smooth `group-hover:scale-105 transition-transform duration-300`.
- **Card Body:** Fixed structural slots:
  1. Category badge + Service Mode pill (`Home Visit` / `Shop Drop-off`)
  2. Title (`font-semibold text-lg line-clamp-1`)
  3. Description (`text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]`)
  4. Technician attribution row (avatar/icon + name + service area)
  5. Footer divider with Starting Price (`$XX` in `JetBrains Mono font-bold`) and consistent `View Details` button.

### Responsive Breakpoints
- **Mobile (`320px–767px`):** Hamburger drawer navigation, collapsible dashboard sidebar sheet, single-column service cards, responsive card/table hybrid views on dashboards, zero horizontal overflow.
- **Tablet (`768px–1023px`):** 2-column service grids, collapsible sidebar, 2–3 KPI cards per row.
- **Desktop (`1024px+`):** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, sticky glass-free crisp top navbar (`h-16`), persistent 260px dashboard sidebar.

### Accessibility & Interaction Standards
- All interactive controls use `cursor-pointer`, visible `:focus-visible` ring, and `min-h-[40px]` hit areas.
- Forms display inline field errors below inputs linked via `aria-describedby` + `role="alert"`.
- Decorative icons have `aria-hidden="true"`; icon-only buttons have explicit `aria-label`.
- Footer uses the modern **X** vector logo (never the legacy Twitter bird).
