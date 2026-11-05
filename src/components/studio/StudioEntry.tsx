import { lazy, Suspense } from "react";
const Studio = lazy(() => import("./StudioApp"));
export default function StudioEntry() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 40,
            background: "#16242c",
            color: "#f1e9df",
            minHeight: "100vh",
          }}
        >
          Đang mở DANAVA GO Studio…
        </div>
      }
    >
      <Studio />
    </Suspense>
  );
}
