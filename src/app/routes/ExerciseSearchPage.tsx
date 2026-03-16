import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../../db";
import { SectionTitle } from "../../components/common/SectionTitle";
import { ExerciseList } from "../../features/exercises/components/ExerciseList";
import { ExerciseSearchInput } from "../../features/exercises/components/ExerciseSearchInput";
import { searchExercises } from "../../features/exercises/services/exerciseRepository";
import { addExerciseToSession, getActiveSessionForUser } from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import type { ExerciseCanonical } from "../../types";

export const ExerciseSearchPage = () => {
  const navigate = useNavigate();
  const { activeProfileId } = useActiveProfile();
  const [query, setQuery] = useState("");
  const activeSession = useLiveQuery(
    async () => (activeProfileId ? await getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );
  const exercises = useLiveQuery(async () => await searchExercises(query), [query], []);
  const aliases = useLiveQuery(async () => await db.exerciseAliases.toArray(), [], []);

  const aliasMap = useMemo(() => {
    return aliases.reduce<Record<string, string[]>>((accumulator, alias) => {
      accumulator[alias.canonicalExerciseId] = accumulator[alias.canonicalExerciseId] ?? [];
      accumulator[alias.canonicalExerciseId].push(alias.aliasText);
      return accumulator;
    }, {});
  }, [aliases]);

  const handleSelect = async (exercise: ExerciseCanonical) => {
    if (!activeSession) {
      return;
    }
    const sessionExercise = await addExerciseToSession(activeSession.id, exercise);
    navigate(`/workout/active/exercises/${sessionExercise.id}`);
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Cerca esercizio" subtitle="Ricerca per nome canonico o alias italiano/inglese." />
      <ExerciseSearchInput value={query} onChange={setQuery} />
      <ExerciseList exercises={exercises} aliasMap={aliasMap} onSelect={handleSelect} />
    </div>
  );
};
