import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] p-6 text-slate-100">
          <div className="max-w-md rounded-xl border border-red-900/50 bg-[#0F1729] p-6 text-center">
            <p className="mb-2 text-sm font-semibold text-red-400">Something went wrong</p>
            <p className="mb-4 text-xs text-slate-400">{String(this.state.error?.message || this.state.error)}</p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
