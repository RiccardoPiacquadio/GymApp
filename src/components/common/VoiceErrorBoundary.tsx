import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class VoiceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dark-panel p-4 text-sm text-white/80">
          <p className="font-semibold text-danger">Errore nel pannello vocale</p>
          <button
            type="button"
            className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => this.setState({ hasError: false })}
          >
            Riprova
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
