type ExerciseSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const ExerciseSearchInput = ({ value, onChange }: ExerciseSearchInputProps) => (
  <input
    className="field-input"
    placeholder="Cerca per nome o alias"
    value={value}
    onChange={(event) => onChange(event.target.value)}
  />
);
