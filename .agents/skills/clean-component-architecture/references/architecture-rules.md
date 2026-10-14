# Deep-Dive Architecture & Design Reference

This document provides in-depth technical specifications and comparative examples for developing in **Clocker React**.

---

## 1. Atomic Component Guidelines (`src/components/common/`)

All common components must be **strictly domain-agnostic**. They should never import domain models, contexts (except theme/UI contexts if applicable), or specific API services.

### Existing Atoms:
1. **`Button`**: Supports variants (`blue`, `green`, `yellow`, `orange`, `purple`, `pink`, `cyan`, `gray`, `black`, `white`, `red`, `transparent`, `active`), animations (`grow`, `shrink`, `pulse`, `pop`, `translate`, `gradient`), and icons via FontAwesome.
2. **`Card`**: Surface container wrapper with rounded corners, padding, and subtle shadow (`bg-vgswhite rounded-lg shadow p-6`).
3. **`Input`**: Form field supporting text, password, and `select` with label animation, icons (left/right), and inline validation error text.
4. **`StatusBadge`**: Normalized indicator mapping status string to `STATUS_CONFIG` colors and icons.
5. **`Badge`**: Generic metadata tag/pill.
6. **`Image`**: Safe image with fallback handling on network failure.
7. **`Toast`**: Global alert notification item.

### Anti-Pattern vs. Recommended:

#### ❌ Anti-Pattern (Monolithic / Ad-Hoc HTML Element)
```jsx
// Bad: Inlining generic button markup with arbitrary styles and redundant event logic
<button
  style={{ backgroundColor: "#0c224b" }}
  onClick={() => {
    // Redundant inline alert or uncleaned listener
    console.log("clicked");
    props.onClick();
  }}
  className="px-4 py-2 text-white rounded shadow"
>
  {props.label}
</button>
```

#### ✅ Recommended Pattern (Using Atomic Common Components)
```jsx
import Button from "../common/Button";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

<Button
  variant="blue"
  icon={faCheck}
  animation="grow"
  onClick={handleClick}
>
  Confirm Action
</Button>
```

---

## 2. Code Commenting Patterns (English & Purpose-Driven)

Code must be self-explanatory through semantic variable, function, and component names. Comments should only capture **non-obvious logic, business rules, synchronization protocols, or browser quirks**.

### Comparative Examples:

#### ❌ Bad Comments (Noise / Language Violations)
```javascript
// Variable para guardar el estado del usuario
const [userState, setUserState] = useState("online");

// Handle click del boton
const handleClick = () => {
  // Ponemos el loading en true
  setLoading(true);
  // Llamamos a la API
  api.get("/users");
};
```

#### ✅ Good Comments (Concise, English, Why-Focused)
```javascript
// Sync with backend every 60 seconds to avoid stale presence counters
const SYNC_INTERVAL_MS = 60000;

// Track call negotiation state: "idle" | "calling" | "receiving" | "active"
const [callStatus, setCallStatus] = useState("idle");

// Fallback to cached session if reconnecting within the 60s grace window
const savedCall = sessionStorage.getItem(SESSION_STORAGE_KEY);
```

---

## 3. Tailwind CSS v4 Theme Tokens

All styles must rely on the `@theme` tokens in `src/index.css`:

```css
@theme {
  --color-vgsred: #c30e1a;
  --color-vgsred-500: #c30e1a;
  --color-vgswhite: #ffffff;
  --color-vgsdarkblue: #0c224b;
  --color-vgsgray: #b1b1b1;
  --color-vgsblack: #000000;
  --color-vgspurple: #9500ff;

  --color-red-500: #c30e1a;
  --color-red-600: #a10b15;
}
```

### Usage:
- Backgrounds: `bg-vgsdarkblue`, `bg-vgsred`, `bg-vgsgray/20`, `bg-vgswhite`
- Texts: `text-vgsdarkblue`, `text-vgsred`, `text-vgsgray`, `text-vgsblack`
- Borders: `border-vgsgray/50`, `border-vgsred`, `border-vgsdarkblue`
- Rings / Focus: `focus:ring-vgsdarkblue`, `focus:ring-vgsred`

---

## 4. Animation Architecture

### Utility Animations (Defined in `@theme`):
- `animate-toast-in`: Toast slide & scale entry.
- `animate-toast-out`: Toast exit.
- `animate-toast-shake`: Error shake feedback.
- `animate-toast-flip`: Perspective flip entry.
- `animate-btn-pulse`: Subtle rhythmic pulse (1.5s infinite).
- `animate-btn-pop`: Quick scale pop on hover/click (0.3s).
- `hover-gradient`: Shiny gradient sweep across element on hover.

### Animation Rules:
1. **Never write internal `@keyframes` inside components**.
2. **Never create animation loops in `setInterval`**. Use CSS classes or Framer Motion transitions.
3. Micro-interactions must stay between **150ms and 300ms** to avoid sluggish UI perception.

---

## 5. Clean Code & Zero-Redundancy Guidelines

### 1. Formatting & Utilities:
- **Never rewrite duration calculations**: Always use `formatDuration(minutes)` from `src/utils/formatters.js`.
- **Never rewrite date formatters**: Always use `formatDateTime(isoString)` from `src/utils/formatters.js`.

### 2. Status Information:
- **Never hardcode status labels or colors**: Always reference `STATUS_CONFIG` from `src/components/layout/statusConfig.js` or render `<StatusBadge status={status} />`.

### 3. API & WebSockets:
- **Never use raw `fetch()` or `axios` instances**: Always use the encapsulated `api` singleton from `src/services/api.js`.
- **Never open secondary WebSocket connections**: Always use `const { socket } = useAuth()` and attach listeners with mandatory cleanup.

```javascript
useEffect(() => {
  if (!socket?.current) return;
  const currentSocket = socket.current;

  const handleUpdate = (data) => {
    // Process update
  };

  currentSocket.on("status_updated", handleUpdate);

  return () => {
    currentSocket.off("status_updated", handleUpdate);
  };
}, [socket]);
```
