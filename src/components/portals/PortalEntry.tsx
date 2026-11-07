import { lazy, Suspense } from "react";
// Operator apps are appgo with the operator's brand (components/appgo/appgoBrand.ts).
const OperatorApp = lazy(() => import("../appgo/OperatorBrandedApp"));
const Profile = lazy(() => import("./OperatorProfilePage"));
export default function PortalEntry({
  profile = false,
}: {
  profile?: boolean;
}) {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Đang mở ứng dụng…</div>}>
      {profile ? <Profile /> : <OperatorApp />}
    </Suspense>
  );
}
