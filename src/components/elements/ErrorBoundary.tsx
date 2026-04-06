import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    name?: string; //name for the error context
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback provided by parent
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Generate contextual error message
            const { name } = this.props;
            const userMessage = name
                ? `Something went wrong in ${name}. Please try again.`
                : "Something went wrong. Please try again.";

            // Clean error UI
            return (
                <div
                    style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        background: "#f8f9fa",
                        border: "1px dashed #dee2e6",
                        borderRadius: "8px",
                        margin: "20px 5px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            version="1.1"
                            width="22"
                            height="22"
                            viewBox="0 0 256 256"
                            aria-hidden="true"
                        >
                            <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                                <path
                                    d="M 45 57.469 L 45 57.469 c -1.821 0 -3.319 -1.434 -3.399 -3.252 L 38.465 23.95 c -0.285 -3.802 2.722 -7.044 6.535 -7.044 h 0 c 3.813 0 6.82 3.242 6.535 7.044 l -3.137 30.267 C 48.319 56.036 46.821 57.469 45 57.469 z"
                                    fill="rgb(229,0,0)"
                                />
                                <circle
                                    cx="45"
                                    cy="67.67"
                                    r="5.42"
                                    fill="rgb(229,0,0)"
                                />
                                <path
                                    d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z M 45 6 C 23.495 6 6 23.495 6 45 s 17.495 39 39 39 s 39 -17.495 39 -39 S 66.505 6 45 6 z"
                                    fill="rgb(229,0,0)"
                                />
                            </g>
                        </svg>
                        <p
                            style={{
                                fontWeight: 500,
                                color: "#6c757d",
                                margin: 0,
                                fontSize: "16px",
                            }}
                        >
                            {userMessage}
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: "8px 16px",
                                fontSize: "14px",
                                fontWeight: "500",
                                border: "1px solid #dee2e6",
                                borderRadius: "6px",
                                background: "white",
                                color: "#495057",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f8f9fa";
                                e.currentTarget.style.borderColor = "#adb5bd";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#dee2e6";
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
