import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // PERBAIKAN: Report error to monitoring service (if available)
    if (window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // PERBAIKAN: Custom error UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-lg">
            <div className="text-red-500 text-6xl mb-4">💥</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. The error has been
              logged.
            </p>

            <div className="space-x-4 mb-6">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Login
              </button>
            </div>

            {/* PERBAIKAN: Development error details */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-left bg-gray-100 p-4 rounded border">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Mode)
                </summary>
                <div className="space-y-4">
                  {this.state.error && (
                    <div>
                      <h4 className="font-semibold text-red-600">Error:</h4>
                      <pre className="text-sm bg-red-50 p-2 rounded overflow-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                  )}
                  {this.state.error?.stack && (
                    <div>
                      <h4 className="font-semibold text-red-600">
                        Stack Trace:
                      </h4>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-semibold text-red-600">
                        Component Stack:
                      </h4>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
