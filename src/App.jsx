// src/App.jsx
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { CallProvider } from "./contexts/CallContext";
import { EventsProvider } from "./contexts/EventsContext";
import { MeetingProvider } from "./contexts/MeetingContext";
import AppContent from "./components/AppContent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const CallManager = lazy(() => import("./components/call/CallManager"));
const ClockerIA = lazy(() => import("./components/ai/ClockerIA"));
const AttendancePromptModal = lazy(
  () => import("./components/events/AttendancePromptModal")
);
const MeetingRoom = lazy(() => import("./components/events/MeetingRoom"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <CallProvider>
            <EventsProvider>
              <MeetingProvider>
                <AppContent />
                <Suspense fallback={null}>
                  <CallManager />
                  <ClockerIA />
                  <AttendancePromptModal />
                  <MeetingRoom />
                </Suspense>
              </MeetingProvider>
            </EventsProvider>
          </CallProvider>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
