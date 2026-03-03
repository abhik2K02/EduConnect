import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-4xl w-full shadow-2xl">
                        <h1 className="text-3xl font-bold text-red-600 mb-4 flex items-center">
                            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            React Rendering Crash
                        </h1>
                        <p className="text-slate-800 text-lg mb-6">The application encountered a fatal JavaScript error and could not render the page.</p>

                        <div className="bg-white rounded-xl shadow-inner border border-red-100 p-4 overflow-x-auto mb-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Error Message</h2>
                            <pre className="text-red-600 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                                {this.state.error && this.state.error.toString()}
                            </pre>
                        </div>

                        <div className="bg-slate-800 rounded-xl shadow-inner border border-slate-700 p-4 overflow-x-auto">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Component Stack Trace</h2>
                            <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={() => window.location.href = '/student'}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-colors"
                            >
                                Return to Student Archive
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
