import { lazy, Suspense } from "react";
const OperatorApp = lazy(() => import("../operator-app/OperatorApp"));
const Profile = lazy(() => import("./OperatorProfilePage"));
export default function PortalEntry({
  profile = false,
}: {
  profile?: boolean;
}) {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Đang mở DANAVA GO…</div>}>
      {profile ? <Profile /> : <OperatorApp />}
    </Suspense>
  );
}
