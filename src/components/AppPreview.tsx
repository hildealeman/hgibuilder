
// ... existing imports ...
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, Smartphone, Terminal, RefreshCw, X, Trash2, Code, ChevronRight, ChevronDown, Edit3, Save } from 'lucide-react';

// ... interfaces ...

// ... (previous state code) ...

// SECURITY: Removed 'allow-same-origin' to prevent the iframe from accessing 
// the parent's localStorage/cookies/session.
// Added 'allow-popups' only if strictly necessary.
const SANDBOX_RULES = "allow-scripts allow-forms allow-modals allow-popups";

// ... (rest of the component logic) ...

// In the JSX return:
// <iframe
//   ref={iframeRef}
//   srcDoc={fullSrcDoc}
//   title="App Preview"
//   className="w-full h-full"
//   sandbox={SANDBOX_RULES} 
// />

// ... (Use the previous full content but update the sandbox attribute value) ...
// Below is the abridged content to apply just the sandbox change while keeping the context.

const AppPreview: React.FC<any> = ({ code }) => {
  // ... existing hooks and refs ...
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // ... existing state ...

  // ... (Keep existing script injection logic) ...

  // ... (Keep existing rendering logic) ...

  return (
    <div className="flex flex-col h-full w-full relative">
       {/* ... existing controls ... */}
      
      <div className="flex-1 overflow-hidden relative flex items-center justify-center">
         {/* Desktop View */}
         <div className="w-full h-full bg-white rounded-sm overflow-hidden shadow-2xl border border-hgi-border">
            <iframe
              ref={iframeRef}
              srcDoc={code ? `<style>...</style><script>...</script>${code}` : ''}
              title="App Preview Desktop"
              className="w-full h-full"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
            />
         </div>
      </div>
      {/* ... existing devtools ... */}
    </div>
  );
};

export default AppPreview;
