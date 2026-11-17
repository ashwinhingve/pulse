# PULSE Platform - Responsive Layout & Viewport Specification

This document defines the mandatory layout architecture standards for the PULSE platform and all future app rebuilds. Every page in the application MUST comply with these responsive grid, viewport fitting, and spacing guidelines.

---

## 1. Core Layout Principles

### A. Landscape Desktop View (16:9 / 16:10 Wide Displays)
- **Container Max-Width**: Use `max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10`. NEVER restrict main layout content on wide displays to narrow containers (e.g., `max-w-md` or `max-w-4xl`) which squishes content into a center column.
- **12-Column Grid Allocation**: Split wide pages using Tailwind's 12-column grid (`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6`).
  - Main tools / primary workspaces: `lg:col-span-8` or `lg:col-span-7`.
  - Side panels / activity streams / action shortcuts: `lg:col-span-4` or `lg:col-span-5`.
- **Card Distribution**: Grid items MUST use responsive grid distributions:
  - 4-card metric rows: `grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4`.
  - Feature & tool cards: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3`.
  - List cards (e.g. Patients, Cases, Reports): `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
- **Zero Horizontal Overflow**: All flex wrappers and grid items MUST include `min-w-0` to prevent long text strings or tables from leaking outside the container.

---

### B. 4:3 Tablet View (Portrait & Landscape: 768x1024 / 1024x768 / 810x1080)
- **Fluid Column Collapse**: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-12` so 4:3 screens render a balanced 2-column or adaptive grid layout.
- **Adaptive Padding**: Reduce card padding from `p-6` to `p-4 md:p-5` and gap spacing to `gap-3.5 md:gap-4.5`.
- **No Overflow / No Button Clipping**: Action buttons in table headers or card footers MUST flex-wrap or use icon-only fallbacks (`hidden sm:inline` text labels) on mid-size tablet viewports.

---

### C. Vertical Phone View (Mobile Displays: 375px – 430px)
- **Single-Column Stack**: Default to `grid-cols-1 gap-3 sm:gap-4`.
- **Bottom Tab Clearance**: Main content containers MUST include `pb-20 lg:pb-6` so floating bottom navigation bars do not obscure form submit buttons or list footers.
- **Touch Targets**: All interactive elements must adhere to a minimum size of 44x44px (`touch-target` / `min-h-[44px]`).

---

## 2. Single-Display Canvas (Minimum Scroll Rule)

To prevent users from having to scroll up and down endlessly to view elements belonging to the same tool or section:

1. **Header & Banner Compactness**: Page headers (`PageHeader.tsx`) and hero banners MUST maintain tight vertical padding (`py-3 sm:py-4`).
2. **Chart Container Heights**: Scalable charts and graphs MUST use responsive canvas heights (`h-36 sm:h-44 md:h-48 lg:h-52`) rather than fixed tall heights.
3. **Inner Scrollable Sub-Panels**: For long activity streams, patient queues, or message logs, embed vertical scrolling inside the component (`max-h-[280px]` or `max-h-[380px] overflow-y-auto scrollbar-thin`) so the overall page fits in a single viewport height.
4. **Full-Viewport Application Views (Chat & AI Assistant)**: Interactive communication pages MUST use `h-[calc(100vh-4.5rem)] overflow-hidden` inside `AppShell` to fit 100% of the display canvas without double window scrolling.

---

## 3. Checklist for All Page Rebuilds

- [ ] Does the page stretch nicely on 1920x1080 landscape without being squished into the middle?
- [ ] Is there zero horizontal scrollbar appearing anywhere on the page?
- [ ] Are elements of the same section visible in one display canvas with minimal scrolling?
- [ ] Does the layout adapt cleanly to 4:3 ratio tablets (768x1024 / 1024x768)?
- [ ] Are all bottom items on mobile accessible above the floating tab bar?
