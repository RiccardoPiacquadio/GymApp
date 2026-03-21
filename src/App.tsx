import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import { ActiveWorkoutPage } from "./app/routes/ActiveWorkoutPage";
import { DashboardPage } from "./app/routes/DashboardPage";
import { ExerciseLogPage } from "./app/routes/ExerciseLogPage";
import { ExerciseSearchPage } from "./app/routes/ExerciseSearchPage";
import { ProfileSelectPage } from "./app/routes/ProfileSelectPage";
import { TemplateEditPage } from "./app/routes/TemplateEditPage";
import { TemplateListPage } from "./app/routes/TemplateListPage";
import { AppShell } from "./components/common/AppShell";
import { useAppBoot } from "./features/users/hooks/useAppBoot";

// Lazy-loaded routes (contain Recharts — heavy bundle)
const WorkoutHistoryPage = lazy(() =>
  import("./app/routes/WorkoutHistoryPage").then((m) => ({ default: m.WorkoutHistoryPage }))
);
const WorkoutDetailPage = lazy(() =>
  import("./app/routes/WorkoutDetailPage").then((m) => ({ default: m.WorkoutDetailPage }))
);
const ExerciseDetailPage = lazy(() =>
  import("./app/routes/ExerciseDetailPage").then((m) => ({ default: m.ExerciseDetailPage }))
);

const LazyFallback = () => (
  <div className="app-panel p-4 text-sm text-ink/70">Caricamento...</div>
);

const ProtectedApp = () => {
  const location = useLocation();
  const { activeProfileId, isReady } = useAppBoot();

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-white">Caricamento...</div>;
  }

  if (!activeProfileId && location.pathname !== "/profiles") {
    return <Navigate to="/profiles" replace />;
  }

  return (
    <AppShell>
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profiles" element={<ProfileSelectPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workout/start" element={<Navigate to="/dashboard" replace />} />
          <Route path="/workout/active" element={<ActiveWorkoutPage />} />
          <Route path="/workout/active/exercises" element={<ExerciseSearchPage />} />
          <Route path="/workout/active/exercises/:sessionExerciseId" element={<ExerciseLogPage />} />
          <Route path="/templates" element={<TemplateListPage />} />
          <Route path="/templates/new" element={<TemplateEditPage />} />
          <Route path="/templates/:templateId" element={<TemplateEditPage />} />
          <Route path="/history" element={<WorkoutHistoryPage />} />
          <Route path="/history/:sessionId" element={<WorkoutDetailPage />} />
          <Route path="/history/:sessionId/exercises" element={<ExerciseSearchPage />} />
          <Route path="/history/:sessionId/exercises/:sessionExerciseId" element={<ExerciseLogPage />} />
          <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
        </Routes>
      </Suspense>
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
