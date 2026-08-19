import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// On GitHub Pages (static), API lives on another host (e.g. Railway)
const API_BASE = (import.meta as any).env?.VITE_API_URL || "";
if (API_BASE) {
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api")) {
      input = API_BASE.replace(/\/$/, "") + input;
    }
    return original(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
