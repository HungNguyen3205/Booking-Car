import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import OperatorEntry from "./components/operator-app/OperatorEntry";
import StudioEntry from "./components/studio/StudioEntry";

const isStudio = /^\/(manage|admin)(?:\/|$)/.test(window.location.pathname);
const isOperatorApp = /^\/app(?:\/|$)/.test(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isStudio ? <StudioEntry /> : isOperatorApp ? <OperatorEntry /> : <App />}</StrictMode>,
);
