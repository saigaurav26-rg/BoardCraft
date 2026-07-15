import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import LandingPage from "./pages/landing/index";
import LoginPage from "./pages/login/login";
import SignupPage from "./pages/signup/signup";
import DashboardPage from "./pages/dashboard/dashboard";
import WhiteboardPage from "./pages/whiteboard/whiteboard";
import BoardWorkspace from "./pages/board_new/board_new"; // 1. Imported the new board component
import ProfilePage from "./pages/profile/profile";
import SettingsPage from "./pages/settings/settings";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <DashboardPage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />
      
      {/* Dynamic Board Workspace Route */}
      <Route
        path="/board/:boardId"
        element={
          <>
            <SignedIn>
              <BoardWorkspace />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />
      
      <Route
        path="/whiteboard/:id"
        element={
          <>
            <SignedIn>
              <WhiteboardPage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />

      <Route
        path="/profile"
        element={
          <>
            <SignedIn>
              <ProfilePage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />

      <Route
        path="/settings"
        element={
          <>
            <SignedIn>
              <SettingsPage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;