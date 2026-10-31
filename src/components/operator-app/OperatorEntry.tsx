import { lazy, Suspense } from "react";
const OperatorApp = lazy(() => import("./OperatorApp"));
export default function OperatorEntry() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Đang mở ứng dụng…</div>}>
      <OperatorApp />
    </Suspense>
  );
}
