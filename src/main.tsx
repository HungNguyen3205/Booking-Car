import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import OperatorEntry from "./components/operator-app/OperatorEntry";

const isOperatorApp = /^\/app(?:\/|$)/.test(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isOperatorApp ? <OperatorEntry /> : <App />}</StrictMode>,
);
