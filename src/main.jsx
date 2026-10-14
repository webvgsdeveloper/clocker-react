// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import IPGuard from "./utils/IPGuard.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <IPGuard>
      <App />
    </IPGuard>
  </StrictMode>,
);
