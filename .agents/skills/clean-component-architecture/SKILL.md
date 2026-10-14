---
name: clean-component-architecture
description: >-
  Enforces modern clean React architecture, atomic component design, strict code commenting patterns (English, non-redundant), corporate color palette (Tailwind v4 tokens), centralized animations, and anti-redundancy coding standards. Use this skill whenever creating, modifying, adjusting, or refactoring React components, hooks, or UI modules in Clocker React to prevent monolithic code, duplicate functions, or internal animation bloat.
---

# Clean Component Architecture & Standards (Clocker React)

This skill governs the design, implementation, and modification of React components across the **Clocker React** application. Every component must be modular, atomic, clean, and strictly aligned with the corporate design system and performance guidelines.

---

## 1. Quick Reference / Core Directives

Whenever you create, modify, or refactor a component in this repository, you **MUST** adhere to the following checklist:

| Dimension | Rule & Expectation |
| :--- | :--- |
| **Component Granularity** | Keep components lean (< 150–200 lines). Decompose complex UI into atomic sub-components or custom hooks. |
| **Atomic Hierarchy** | Reusable UI primitives go to `src/components/common/`. Domain-specific components live in `src/components/[domain]/`. |
| **Commenting Pattern** | **English ONLY**. Explain *why* and non-obvious logic. Strictly **zero noise comments** (`// set state`, `// handle click`). |
| **Color Tokens** | Use Tailwind v4 `@theme` tokens (`vgsdarkblue`, `vgsred`, `vgsgray`, `vgswhite`, `vgsblack`, `vgspurple`). **No arbitrary hex/rgb codes**. |
| **Common Design System** | Use existing atoms (`Button`, `Input`, `Card`, `StatusBadge`, `Badge`, `Toast`) instead of raw HTML elements with redundant classes. |
| **Animations** | Use pre-configured utility animations from `index.css` or Tailwind transitions. **Never inject ad-hoc `@keyframes`, `<style>` tags, or JS animation loops inside components**. |
| **Zero Redundancy (DRY)**| Reuse `utils/formatters.js`, `statusConfig.js`, and `api.js`. Never duplicate functions or maintain redundant state that can be derived. |
| **Lifecycle Cleanup** | Always return cleanup functions in `useEffect` for socket listeners, DOM events, timeouts, and intervals. |

---

## 2. Component Hierarchy & Atomic Design

```text
src/components/
├── common/             # ATOMS & GENERIC MOLECULES (Domain-Agnostic)
│   ├── Button.jsx      # Standard button with variants, icons, and micro-interactions
│   ├── Card.jsx        # Surface container with standard padding and rounded borders
│   ├── Input.jsx       # Controlled input/select with label, error state, and icon support
│   ├── StatusBadge.jsx # Dynamic user state badge mapped to statusConfig.js
│   ├── Badge.jsx       # Generic tag/indicator
│   ├── Image.jsx       # Protected image component with fallback handling
│   ├── Toast.jsx       # Notification toast item
│   └── LoadingFallback.jsx # Suspense loader
│
└── [domain]/           # ORGANISMS & FEATURE VIEWS (Domain-Specific)
    ├── admin/          # Dashboard, ChatPanel, StatusGrid, UserTable, UserForm
    ├── dashboard/      # CurrentStatus, StatusButtons, StatusManager
    ├── layout/         # Header, NotificationBell, statusConfig.js
    ├── call/           # CallManager (WebRTC floating window)
    ├── ai/             # ClockerIA (Assistant chat widget)
    └── profile/        # EditProfileModal
```

### Composition Rules:
1. **Atoms stay pure**: A component in `src/components/common/` must NEVER import from a domain folder (e.g. `src/components/admin/` or `src/contexts/CallContext`).
2. **Anti-Monolith Decomposition**: If a domain component starts handling multiple responsibilities (e.g. fetching API data + rendering a filter toolbar + rendering a table + displaying a modal dialog), split it:
   - Extract the modal into `[Domain]Modal.jsx`.
   - Extract the row into `[Domain]Row.jsx`.
   - Extract the data queries or timers into a hook in `src/hooks/`.
3. **Lazy Loading**: High-level panel components rendered conditionally in `Dashboard.jsx` or root widgets (`CallManager`, `ClockerIA`) must always be loaded via `React.lazy()` with a `<Suspense fallback={<LoadingFallback />}>` wrapper.

---

## 3. Code Commenting Standards

### Rules:
1. **Language**: Comments MUST be written in **English**.
2. **Noise Prohibition**: Do NOT write obvious comments that explain standard syntax:
   - ❌ `// Import React`
   - ❌ `// Component definition`
   - ❌ `// State for active tab`
   - ❌ `// Return JSX`
   - ❌ `// Handle button click`
3. **Purposeful Documentation**:
   - ✅ Explain **why** a workaround or specific condition is necessary.
   - ✅ Document state types or status contracts: `// Call status: "idle" | "calling" | "receiving" | "active"`.
   - ✅ Document network / WebRTC / Socket.IO synchronization nuances.
   - ✅ Document JSDoc param types for reusable helper components or custom hooks.

---

## 4. Colors & Design Tokens (Tailwind CSS v4)

Always use the designated tokens declared in `@theme` in `src/index.css`:

### Primary Palette:
- Corporate Navy: `bg-vgsdarkblue`, `text-vgsdarkblue`, `focus:ring-vgsdarkblue` (`#0c224b`)
- Brand Red: `bg-vgsred`, `text-vgsred`, `border-vgsred` (`#c30e1a`)
- Muted Gray: `bg-vgsgray`, `text-vgsgray`, `border-vgsgray/50` (`#b1b1b1`)
- Card White: `bg-vgswhite`, `text-vgswhite` (`#ffffff`)
- Deep Black: `bg-vgsblack`, `text-vgsblack` (`#000000`)
- Accent Purple: `bg-vgspurple`, `text-vgspurple` (`#9500ff`)

### Semantic State Colors:
- Online / Active: `bg-green-500`, `text-green-600`
- Warning / Break: `bg-yellow-500`, `text-yellow-600`
- Attention / Lunch: `bg-orange-500`, `text-orange-600`
- Meeting: `bg-cyan-600`, `text-cyan-700`
- Coaching / Secondary: `bg-pink-500`, `text-pink-600`

### Surface & Typography Conventions:
- Main page background: `bg-gray-50` (`#f9fafb`)
- Cards & panels: `bg-vgswhite rounded-lg shadow-sm border border-gray-100`
- Typography: Font family is `"Poppins", Inter, system-ui, sans-serif`. Use font weight `font-medium` or `font-semibold` for headers and button labels.

---

## 5. Animation Guidelines

### Permitted Animations:
1. **Centralized Utilities from `src/index.css`**:
   - `animate-toast-in`
   - `animate-toast-out`
   - `animate-toast-shake`
   - `animate-toast-flip`
   - `animate-btn-pulse`
   - `animate-btn-pop`
   - `hover-gradient`
2. **Subtle Tailwind Micro-Interactions**:
   - `transition-all duration-200 ease-in-out`
   - `hover:scale-105 active:scale-95`
   - `hover:-translate-y-0.5`
   - `focus:ring-2 focus:ring-offset-2`
3. **Framer Motion**:
   - Used for structural transitions (`AnimatePresence`, floating modals, drawer entrances).
   - Leverage `Button` entrance/action animation props (`animation="grow"` or `entranceAnimation={...}`) rather than creating ad-hoc motion wrappers.

### Strict Prohibitions:
- 🚫 **NO inline `<style>` tags** declaring `@keyframes` inside `.jsx` files.
- 🚫 **NO custom JavaScript `setInterval` or `requestAnimationFrame` animation loops** inside components to animate sizes, opacity, or positions.
- 🚫 **NO heavy or jarring animations** that exceed 400ms duration for basic UI transitions.

---

## 6. Coding Style & Anti-Redundancy (DRY)

Before creating any function or state variable:

1. **Check Existing Utilities**:
   - Duration formatting: Use `formatDuration(minutes)` from `src/utils/formatters.js`.
   - Date/Time formatting: Use `formatDateTime(dateString)` from `src/utils/formatters.js`.
   - User status config (icons, labels, classes): Use `STATUS_CONFIG` from `src/components/layout/statusConfig.js`.
   - API calls: Use singleton `api.get()`, `api.post()`, `api.put()`, `api.delete()` from `src/services/api.js`.
   - Real-time events: Access `socket.current` from `useAuth()`.
2. **Derive State, Do Not Duplicate**:
   - ❌ Do NOT store filtered lists in state if they can be calculated via `const filteredItems = useMemo(() => items.filter(...), [items, filter])`.
   - ❌ Do NOT synchronize props to state with `useEffect` unless strictly handling an uncontrolled component fallback.
3. **Strict Memory Leak Prevention**:
   - Every `socket.on("event", handler)` must have a matching `socket.off("event", handler)` in the effect cleanup.
   - Every `addEventListener`, `setTimeout`, or `setInterval` must be cleared in the cleanup function.

---

## 7. Deep-Dive References and Templates

For comprehensive implementation examples and exhaustive rules:
- Detailed Architecture & Design Token Rules: [architecture-rules.md](./references/architecture-rules.md)
- Canonical Component Template: [ComponentTemplate.jsx](./examples/ComponentTemplate.jsx)
