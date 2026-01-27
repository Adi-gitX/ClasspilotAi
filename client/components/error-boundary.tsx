"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-6 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="size-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                        {this.state.error?.message || "An unexpected error occurred"}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={this.handleReset}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <RefreshCw className="size-4" />
                            Try Again
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="default"
                            size="sm"
                        >
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
