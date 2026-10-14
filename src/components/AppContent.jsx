// src/components/AppContent.jsx
import React, { lazy, Suspense } from "react";
import { useAuth } from "../contexts/AuthContext";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import Badge from "./common/Badge";
import Login from "./auth/Login";

const AdminDashboard = lazy(() => import("./admin/Dashboard"));

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vgsred"></div>
      </div>
    );
  }

  return user ? (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Badge
              variant="red"
              size="lg"
              icon={faCircleNotch}
              className="relative z-10 [&>svg]:animate-spin px-5 py-2 border border-vgsdarkblue/10"
            >
              Clocker is loading
            </Badge>
          </div>
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  ) : (
    <Login />
  );
};

export default AppContent;
