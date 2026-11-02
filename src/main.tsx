import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import PortalEntry from "./components/portals/PortalEntry";
import StudioEntry from "./components/studio/StudioEntry";

const isStudio = /^\/(manage|admin)(?:\/|$)/.test(window.location.pathname);
const isProfile = /^\/nha-xe\//.test(window.location.pathname);
const host = window.location.hostname;
const knownWeb = [
  "localhost",
  "127.0.0.1",
  "terminal.local",
  "danavago.com",
  "www.danavago.com",
  "danava.com",
  "www.danava.com",
];
const isOperatorApp =
  /^\/app(?:\/|$)/.test(window.location.pathname) || !knownWeb.includes(host);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isStudio ? (
      <StudioEntry />
    ) : isProfile ? (
      <PortalEntry profile />
    ) : isOperatorApp ? (
      <PortalEntry />
    ) : (
      <App />
    )}
  </StrictMode>,
);
