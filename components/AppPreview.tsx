
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Smartphone, Monitor, Terminal, Code, Bug, X, Trash2, RefreshCw, ChevronRight, ChevronDown, Save, Edit3 } from 'lucide-react';

interface AppPreviewProps {
  code: string;
}

interface LogEntry {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

interface DOMNode {
  tag: string;
  id?: string;
  classes?: string;
  children?: DOMNode[];
  text?: string;
  path: string; // Unique path for highlighting: "0-1-2"
}

const AppPreview: React.FC<AppPreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showDevTools, setShowDevTools] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'elements'>('console');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [domTree, setDomTree] = useState<DOMNode | null>(null);
  const [selectedElementPath, setSelectedElementPath] = useState<string | null>(null);
  const [editHtml, setEditHtml] = useState<string>('');

  // Script and Style to inject into iframe
  const consoleInjection = `
    <style>
      .hgi-highlight-active {
        outline: 2px solid #ff4f00 !important;
        outline-offset: -2px !important;
        background-color: rgba(255, 79, 0, 0.15) !important;
        box-shadow: 0 0 15px rgba(255, 79, 0, 0.3) !important;
        transition: all 0.2s ease-in-out !important;
        cursor: default !important;
        z-index: 99999 !important;
      }
    </style>
    <script>
      (function() {
        const sendToParent = (data) => {
           window.parent.postMessage({ source: 'hgi-preview', ...data }, '*');
        };

        const sendLog = (type, args) => {
          try {
            const message = args.map(arg => {
              if (typeof arg === 'object') return JSON.stringify(arg);
              return String(arg);
            }).join(' ');
            sendToParent({ type, message });
          } catch (e) {}
        };

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => { originalLog(...args); sendLog('log', args); };
        console.warn = (...args) => { originalWarn(...args); sendLog('warn', args); };
        console.error = (...args) => { originalError(...args); sendLog('error', args); };
        
        window.onerror = (msg, url, line, col, error) => {
          sendLog('error', [msg]);
          return false;
        };

        // Helper to find element by path string "0-1-2"
        const getElementByPath = (path) => {
          if (path === "") return document.body;
          const indices = path.split('-').map(Number);
          let current = document.body;
          for (const idx of indices) {
            if (!current || !current.children[idx]) return null;
            current = current.children[idx];
          }
          return current;
        };

        // Listen for commands from Parent
        window.addEventListener('message', (event) => {
            if (event.data.action === 'get-element') {
                const el = getElementByPath(event.data.path);
                if (el) {
                    sendToParent({ type: 'element-html', html: el.outerHTML, path: event.data.path });
                }
            }
            if (event.data.action === 'update-element') {
                const el = getElementByPath(event.data.path);
                if (el) {
                    try {
                        if (event.data.path === "") {
                             // Body special case
                             el.innerHTML = event.data.html;
                        } else {
                             el.outerHTML = event.data.html;
                        }
                        sendToParent({ type: 'update-success' });
                    } catch(e) {
                        sendLog('error', ['Failed to update DOM: ' + e.message]);
                    }
                }
            }
        });

      })();
    </script>
  `;

  const fullSrcDoc = code ? `${consoleInjection}${code}` : '';

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'hgi-preview') {
        if (event.data.type === 'element-html') {
             // Received HTML for editing
             setEditHtml(event.data.html);
        } else if (event.data.type === 'update-success') {
             // Refresh tree after update
             refreshDOMTree();
             // Re-highlight if possible (path might have changed conceptually, but we try)
             if (selectedElementPath) handleElementSelect(selectedElementPath);
        } else {
            // Logs
            const newLog: LogEntry = {
              type: event.data.type,
              message: event.data.message,
              timestamp: new Date().toLocaleTimeString()
            };
            setLogs(prev => [...prev, newLog]);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedElementPath]); // Dep added to allow refresh logic usage if needed

  // Reset logs when code changes significantly
  useEffect(() => {
    // setLogs([]); 
  }, [code]);

  const refreshDOMTree = useCallback(() => {
    if (!iframeRef.current?.contentDocument?.body) return;

    const traverse = (node: Element, path: string): DOMNode => {
      const children: DOMNode[] = [];
      Array.from(node.children).forEach((child, index) => {
        const childPath = path ? `${path}-${index}` : `${index}`;
        children.push(traverse(child, childPath));
      });

      // Get direct text content
      let text = "";
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3 && n.textContent?.trim()) {
           text += n.textContent.trim().substring(0, 50) + (n.textContent.length > 50 ? '...' : '');
        }
      });

      return {
        tag: node.tagName.toLowerCase(),
        id: node.id,
        classes: node.className,
        children: children.length > 0 ? children : undefined,
        text: text || undefined,
        path: path
      };
    };

    const root = traverse(iframeRef.current.contentDocument.body, "");
    setDomTree(root);
  }, []);

  useEffect(() => {
    if (showDevTools && activeTab === 'elements') {
      refreshDOMTree();
    }
  }, [showDevTools, activeTab, refreshDOMTree, code]);

  const handleElementSelect = (path: string) => {
    if (!iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    // 1. Visual Highlight
    const existing = doc.querySelectorAll('.hgi-highlight-active');
    existing.forEach(el => el.classList.remove('hgi-highlight-active'));

    setSelectedElementPath(path);

    // Logic to find element in JS side for scrolling
    let current: Element = doc.body;
    if (path !== "") {
        const indices = path.split('-').map(Number);
        for (const idx of indices) {
            if (current && current.children[idx]) {
                current = current.children[idx];
            } else {
                break;
            }
        }
    }

    if (current) {
        current.classList.add('hgi-highlight-active');
        current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        // 2. Request HTML for editing
        iframeRef.current.contentWindow?.postMessage({ action: 'get-element', path }, '*');
    }
  };

  const handleUpdateElement = () => {
     if (selectedElementPath === null || !iframeRef.current?.contentWindow) return;
     iframeRef.current.contentWindow.postMessage({ 
         action: 'update-element', 
         path: selectedElementPath, 
         html: editHtml 
     }, '*');
  };

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-hgi-muted bg-hgi-dark">
        <div className="text-center p-8 border border-dashed border-hgi-border rounded-xl bg-hgi-card/50">
          <p className="text-lg font-mono mb-2">Sin artefacto generado.</p>
          <p className="text-sm">Solicita al HGI Builder para comenzar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Viewport Controls */}
      <div className="flex justify-between items-center p-2 mb-4 bg-transparent z-20">
         <div className="flex items-center space-x-2 bg-hgi-card/50 border border-hgi-border rounded-full p-1 backdrop-blur-sm">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-2 rounded-full transition-all ${
                deviceMode === 'desktop' 
                  ? 'bg-hgi-orange text-black shadow-lg' 
                  : 'text-hgi-muted hover:text-hgi-text hover:bg-hgi-border'
              }`}
              title="Vista de Escritorio"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-2 rounded-full transition-all ${
                deviceMode === 'mobile' 
                  ? 'bg-hgi-orange text-black shadow-lg' 
                  : 'text-hgi-muted hover:text-hgi-text hover:bg-hgi-border'
              }`}
              title="Vista Móvil"
            >
              <Smartphone className="w-4 h-4" />
            </button>
         </div>

         <button
            onClick={() => setShowDevTools(!showDevTools)}
            className={`p-2 rounded-sm border transition-all flex items-center gap-2 text-xs font-mono uppercase font-bold tracking-wider ${
               showDevTools
               ? 'bg-hgi-card border-hgi-orange text-hgi-orange'
               : 'bg-hgi-card/50 border-hgi-border text-hgi-muted hover:text-hgi-text'
            }`}
         >
            <Terminal className="w-4 h-4" />
            <span>DevTools</span>
            {logs.filter(l => l.type === 'error').length > 0 && (
               <span className="flex items-center justify-center bg-red-500 text-white text-[10px] rounded-full w-4 h-4 ml-1">
                 {logs.filter(l => l.type === 'error').length}
               </span>
            )}
         </button>
      </div>

      {/* Preview Area */}
      <div className={`flex-1 overflow-hidden relative flex items-center justify-center transition-all duration-300 ${showDevTools ? 'h-3/5' : 'h-full'}`}>
        {deviceMode === 'desktop' ? (
          <div className="w-full h-full bg-white rounded-sm overflow-hidden shadow-2xl border border-hgi-border animate-in fade-in duration-300">
            <iframe
              ref={iframeRef}
              srcDoc={fullSrcDoc}
              title="App Preview Desktop"
              className="w-full h-full"
              sandbox="allow-scripts allow-modals allow-forms"
            />
          </div>
        ) : (
          <div className="relative animate-in zoom-in-95 duration-300 scale-90 sm:scale-100">
            <div className="relative mx-auto border-gray-900 bg-gray-900 border-[14px] rounded-[2.5rem] h-[650px] w-[340px] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
              <div className="h-[32px] w-full bg-black rounded-t-[2rem] absolute top-0 left-0 z-10 flex justify-center pointer-events-none">
                 <div className="w-24 h-5 bg-[#1a1a1a] rounded-b-xl mt-0"></div>
              </div>
              <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-white relative z-0">
                <iframe
                  ref={iframeRef}
                  srcDoc={fullSrcDoc}
                  title="App Preview Mobile"
                  className="w-full h-full"
                  sandbox="allow-scripts allow-modals allow-forms"
                />
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-20 pointer-events-none"></div>
            </div>
          </div>
        )}
      </div>

      {/* DevTools Panel */}
      {showDevTools && (
         <div className="h-64 border-t border-hgi-border bg-hgi-card flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-hgi-border px-2 bg-hgi-dark">
               <div className="flex">
                  <button
                     onClick={() => setActiveTab('console')}
                     className={`px-4 py-2 text-xs font-mono uppercase flex items-center gap-2 ${activeTab === 'console' ? 'text-hgi-orange border-b border-hgi-orange bg-hgi-card' : 'text-hgi-muted hover:text-hgi-text'}`}
                  >
                     <Terminal className="w-3 h-3" />
                     Console
                  </button>
                  <button
                     onClick={() => setActiveTab('elements')}
                     className={`px-4 py-2 text-xs font-mono uppercase flex items-center gap-2 ${activeTab === 'elements' ? 'text-hgi-orange border-b border-hgi-orange bg-hgi-card' : 'text-hgi-muted hover:text-hgi-text'}`}
                  >
                     <Code className="w-3 h-3" />
                     Elements
                  </button>
               </div>
               <div className="flex items-center space-x-2">
                  <button 
                     onClick={() => { setActiveTab('elements'); refreshDOMTree(); }}
                     className="p-1 text-hgi-muted hover:text-hgi-orange" title="Refrescar DOM"
                  >
                     <RefreshCw className="w-3 h-3" />
                  </button>
                  <button 
                     onClick={() => setLogs([])}
                     className="p-1 text-hgi-muted hover:text-red-400" title="Limpiar Consola"
                  >
                     <Trash2 className="w-3 h-3" />
                  </button>
                  <button 
                     onClick={() => setShowDevTools(false)}
                     className="p-1 text-hgi-muted hover:text-hgi-text"
                  >
                     <X className="w-3 h-3" />
                  </button>
               </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
               {activeTab === 'console' ? (
                  <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                     {logs.length === 0 && <div className="text-hgi-muted/50 italic p-2">Console empty</div>}
                     {logs.map((log, idx) => (
                        <div key={idx} className={`flex gap-2 border-b border-hgi-border/20 py-1 ${
                           log.type === 'error' ? 'text-red-400 bg-red-900/10' :
                           log.type === 'warn' ? 'text-yellow-400 bg-yellow-900/10' :
                           'text-hgi-text'
                        }`}>
                           <span className="text-hgi-muted opacity-50 select-none min-w-[60px]">{log.timestamp}</span>
                           <span className="flex-1 break-all whitespace-pre-wrap">{log.message}</span>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="flex flex-1 h-full font-mono text-xs">
                     {/* DOM Tree Area */}
                     <div className="flex-1 overflow-y-auto p-2 border-r border-hgi-border bg-hgi-card/50">
                        {domTree ? (
                           <DOMTree 
                             node={domTree} 
                             onSelect={handleElementSelect} 
                             selectedPath={selectedElementPath}
                           />
                        ) : (
                           <div className="p-4 text-hgi-muted">Cargando DOM...</div>
                        )}
                     </div>

                     {/* Element Editor Area */}
                     <div className="w-1/3 flex flex-col bg-hgi-dark border-l border-hgi-border">
                        <div className="p-2 border-b border-hgi-border bg-hgi-card/30 flex justify-between items-center">
                           <span className="text-[10px] uppercase font-bold text-hgi-muted flex items-center gap-1">
                             <Edit3 className="w-3 h-3" /> Editor
                           </span>
                           {selectedElementPath && (
                              <button 
                                onClick={handleUpdateElement}
                                className="flex items-center gap-1 px-2 py-1 bg-hgi-orange text-black text-[10px] font-bold uppercase rounded-sm hover:bg-hgi-orangeBright transition-colors"
                              >
                                <Save className="w-3 h-3" /> Actualizar
                              </button>
                           )}
                        </div>
                        <div className="flex-1 relative">
                            {selectedElementPath ? (
                                <textarea 
                                    value={editHtml}
                                    onChange={(e) => setEditHtml(e.target.value)}
                                    className="w-full h-full bg-hgi-dark text-hgi-text p-2 outline-none resize-none font-mono text-xs"
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-hgi-muted text-center p-4 italic">
                                    Selecciona un elemento para editar su HTML
                                </div>
                            )}
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

interface DOMTreeProps {
  node: DOMNode;
  depth?: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
}

// Recursive Component for DOM Tree
const DOMTree: React.FC<DOMTreeProps> = ({ node, depth = 0, onSelect, selectedPath }) => {
   const [expanded, setExpanded] = useState(depth < 2);
   const hasChildren = node.children && node.children.length > 0;
   const isSelected = selectedPath === node.path;

   const handleSelect = (e: React.MouseEvent) => {
       e.stopPropagation();
       onSelect(node.path);
       // Auto expand if clicked
       if (hasChildren && !expanded) setExpanded(true);
   };

   return (
      <div className="ml-4">
         <div 
           className={`flex items-center rounded-sm cursor-pointer group py-0.5 transition-colors ${
             isSelected ? 'bg-hgi-orange/20' : 'hover:bg-hgi-border/30'
           }`} 
           onClick={handleSelect}
         >
            <div 
              className="w-4 h-4 flex items-center justify-center mr-1 text-hgi-muted hover:text-hgi-text"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
               {hasChildren && (
                  expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
               )}
            </div>
            <span className="text-purple-400">{node.tag}</span>
            {node.id && <span className="text-blue-400">#{node.id}</span>}
            {node.classes && <span className="text-yellow-600 truncate max-w-[200px]">.{node.classes.replace(/ /g, '.')}</span>}
            {node.text && !hasChildren && <span className="text-white ml-2 opacity-70">"{node.text}"</span>}
         </div>
         
         {expanded && hasChildren && (
            <div className="border-l border-hgi-border/30 ml-2">
               {node.children!.map((child, idx) => (
                  <DOMTree 
                    key={idx} 
                    node={child} 
                    depth={depth + 1} 
                    onSelect={onSelect}
                    selectedPath={selectedPath}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

export default AppPreview;
