'use client';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-gray-500 mt-2">Please refresh the page and try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
