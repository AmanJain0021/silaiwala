import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isReloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Clear the auto-reload flag shortly after successful load
    setTimeout(() => {
        sessionStorage.removeItem('chunk_failed_reload');
    }, 2000);
  }

  checkChunkError(error) {
    const errStr = (error && (error.toString() || error.message)) || '';
    return errStr.includes('Failed to fetch dynamically imported module') || 
           errStr.includes('Importing a module script failed') ||
           errStr.includes('dynamically imported module') ||
           errStr.includes('ChunkLoadError') ||
           errStr.includes('Loading chunk') ||
           errStr.includes('Failed to load resource');
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    
    const isChunkError = this.checkChunkError(error);
                         
    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_failed_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_failed_reload', 'true');
        this.setState({ isReloading: true });
        window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        return;
      }
    }

    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload(true);
  }

  render() {
    if (this.state.isReloading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#4f46e5', marginBottom: '10px' }}>Updating Application...</h2>
                    <p style={{ color: '#6b7280' }}>Please wait while we load the latest version.</p>
                </div>
            </div>
        );
    }

    if (this.state.hasError) {
      const isChunkError = this.checkChunkError(this.state.error);
      
      return (
        <div style={{ padding: '40px 20px', backgroundColor: '#fef2f2', color: '#991b1b', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#b91c1c' }}>
                  {isChunkError ? 'Update Available' : 'Something went wrong.'}
              </h1>
              
              <p style={{ marginBottom: '24px', color: '#4b5563', lineHeight: '1.5' }}>
                  {isChunkError 
                    ? 'A new version of the application is available. Please reload the page to apply the update.' 
                    : 'An unexpected error occurred while loading this page.'}
              </p>
              
              <button 
                  onClick={this.handleReload}
                  style={{ 
                      backgroundColor: '#dc2626', 
                      color: 'white', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: '6px', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '20px',
                      width: '100%'
                  }}
              >
                  Reload Application
              </button>

              {!isChunkError && (
                  <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', fontSize: '13px', backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>View Technical Details</summary>
                    <div style={{ marginTop: '10px', color: '#ef4444', fontWeight: '500' }}>
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <div style={{ marginTop: '10px', color: '#6b7280' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
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
