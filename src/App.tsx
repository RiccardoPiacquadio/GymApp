import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import { ActiveWorkoutPage } from "./app/routes/ActiveWorkoutPage";
import { DashboardPage } from "./app/routes/DashboardPage";
import { ExerciseDetailPage } from "./app/routes/ExerciseDetailPage";
import { ExerciseLogPage } from "./app/routes/ExerciseLogPage";
import { ExerciseSearchPage } from "./app/routes/ExerciseSearchPage";
import { ProfileSelectPage } from "./app/routes/ProfileSelectPage";
import { StartWorkoutPage } from "./app/routes/StartWorkoutPage";
import { WorkoutDetailPage } from "./app/routes/WorkoutDetailPage";
import { WorkoutHistoryPage } from "./app/routes/WorkoutHistoryPage";
import { AppShell } from "./components/common/AppShell";
import { useAppBoot } from "./features/users/hooks/useAppBoot";

const ProtectedApp = () => {
  const location = useLocation();
  const { activeProfileId, isReady } = useAppBoot();

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-ink/70">Caricamento...</div>;
  }

  if (!activeProfileId && location.pathname !== "/profiles") {
    return <Navigate to="/profiles" replace />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/profiles" element={<ProfileSelectPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workout/start" element={<StartWorkoutPage />} />
        <Route path="/workout/active" element={<ActiveWorkoutPage />} />
        <Route path="/workout/active/exercises" element={<ExerciseSearchPage />} />
        <Route path="/workout/active/exercises/:sessionExerciseId" element={<ExerciseLogPage />} />
        <Route path="/history" element={<WorkoutHistoryPage />} />
        <Route path="/history/:sessionId" element={<WorkoutDetailPage />} />
        <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
      </Routes>
    </AppShell>
  );
};

export default function App() {
  return (
    <AppProviders>
      <ProtectedApp />
    </AppProviders>
  );
}


