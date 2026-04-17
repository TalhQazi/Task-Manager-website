import { lazy, Suspense, useMemo } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { DeveloperLayout } from "@/components/developer/layout/DeveloperLayout";
import { getAuthState } from "@/lib/auth";

const Bugs = lazy(() => import("@/pages/developer/Bugs"));
const NotFound = lazy(() => import("@/pages/manger/NotFound"));

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{
        width: 36, height: 36,
        border: "3px solid rgba(255,255,255,0.1)",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function DeveloperController() {
  const location = useLocation();
  const auth = getAuthState();

  const routes = useMemo(
    () => [
      { index: true, element: <Bugs /> },
      { path: "bugs", element: <Bugs /> },
      { path: "*", element: <NotFound /> },
    ],
    [],
  );

  const element = useRoutes(routes);

  if (!auth.isAuthenticated || auth.role !== "developer") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <DeveloperLayout>
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </DeveloperLayout>
  );
}
