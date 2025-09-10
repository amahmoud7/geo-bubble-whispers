// Debug logger that captures all console logs for easy sharing
class DebugLogger {
  private logs: string[] = [];
  private isCapturing: boolean = false;
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  startCapture() {
    this.logs = [];
    this.isCapturing = true;
    
    // Override console methods to capture logs
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      this.logs.push(`[LOG] ${message}`);
      this.originalConsole.log(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      this.logs.push(`[ERROR] ${message}`);
      this.originalConsole.error(...args);
    };
    
    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      this.logs.push(`[WARN] ${message}`);
      this.originalConsole.warn(...args);
    };
  }

  stopCapture() {
    this.isCapturing = false;
    // Restore original console methods
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
  }

  getLogs(): string {
    return this.logs.join('\n');
  }

  copyToClipboard() {
    const logs = this.getLogs();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logs).then(() => {
        this.originalConsole.log('📋 Debug logs copied to clipboard!');
      }).catch(err => {
        this.originalConsole.error('Failed to copy logs:', err);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = logs;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.originalConsole.log('📋 Debug logs copied to clipboard!');
    }
  }

  downloadLogs() {
    const logs = this.getLogs();
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lo-debug-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clear() {
    this.logs = [];
  }
}

export const debugLogger = new DebugLogger();

// Auto-start capturing when the module loads
debugLogger.startCapture();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).debugLogger = debugLogger;
  (window as any).copyLogs = () => debugLogger.copyToClipboard();
  (window as any).downloadLogs = () => debugLogger.downloadLogs();
  
  console.log('🐛 Debug Logger Active! Use window.copyLogs() to copy logs to clipboard');
}