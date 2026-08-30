import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches any unhandled React rendering error
 * and shows a recovery UI instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5fbf2",
          fontFamily: "'Manrope', sans-serif",
          padding: "24px",
        }}>
          <div style={{
            maxWidth: 420,
            textAlign: "center",
            background: "white",
            borderRadius: 24,
            padding: "48px 32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            border: "1px solid #e4ede2",
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #006a39, #047857)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 style={{
              color: "#073b4c",
              fontSize: 22,
              fontWeight: 800,
              margin: "0 0 8px",
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: "#596b5e",
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}>
              SubhOne encountered a temporary issue. Please reload the page to continue.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                background: "linear-gradient(135deg, #006a39, #047857)",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "14px 36px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 12px rgba(0,106,57,0.3)",
              }}
            >
              Reload Page
            </button>
            {this.state.error && (
              <p style={{
                color: "#9aa89b",
                fontSize: 11,
                marginTop: 20,
                wordBreak: "break-word",
              }}>
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
