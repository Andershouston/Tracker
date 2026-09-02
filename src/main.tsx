import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/app.css";

createRoot(document.getElementById("app")!).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
