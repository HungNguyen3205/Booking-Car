import { lazy, Suspense } from "react";
const Mobile = lazy(() => import("./MobilePortal"));
const Profile = lazy(() => import("./OperatorProfilePage"));
export default function PortalEntry({
  profile = false,
}: {
  profile?: boolean;
}) {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Đang mở DANAVA GO…</div>}>
      {profile ? <Profile /> : <Mobile />}
    </Suspense>
  );
}
