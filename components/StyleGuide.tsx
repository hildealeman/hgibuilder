import React from 'react';
import { X } from 'lucide-react';

interface StyleGuideProps {
  onClose: () => void;
}

const StyleGuide: React.FC<StyleGuideProps> = ({ onClose }) => {
  const colors = [
    { name: 'Dark', value: '#050505', cls: 'bg-hgi-dark', text: 'text-white' },
    { name: 'Card', value: '#0f0f0f', cls: 'bg-hgi-card', text: 'text-white' },
    { name: 'Border', value: '#27272a', cls: 'bg-hgi-border', text: 'text-white' },
    { name: 'Orange', value: '#ff4f00', cls: 'bg-hgi-orange', text: 'text-black' },
    { name: 'Orange Bright', value: '#ff6622', cls: 'bg-hgi-orangeBright', text: 'text-black' },
    { name: 'Text', value: '#ededed', cls: 'bg-hgi-text', text: 'text-black' },
    { name: 'Muted', value: '#a1a1aa', cls: 'bg-hgi-muted', text: 'text-black' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-hgi-card border border-hgi-border rounded-sm shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hgi-border sticky top-0 bg-hgi-card z-10">
          <div className="flex items-center space-x-3">
             <div className="w-6 h-6 bg-hgi-orange rounded-sm flex items-center justify-center">
                <span className="font-bold text-black text-[10px]">HGI</span>
            </div>
            <h2 className="text-lg font-bold font-mono uppercase tracking-wider text-hgi-text">Design System</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-hgi-muted hover:text-hgi-orange transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 space-y-10 overflow-y-auto">
          {/* Colors */}
          <section>
            <h3 className="text-xs font-mono text-hgi-orange uppercase tracking-widest mb-6 border-b border-hgi-border/30 pb-2">
              01. Color Palette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {colors.map((c) => (
                <div key={c.name} className="group">
                  <div className={`h-24 w-full rounded-sm border border-hgi-border shadow-sm ${c.cls} flex items-end p-2 transition-transform group-hover:scale-[1.02]`}>
                      <span className={`text-[10px] font-mono opacity-0 group-hover:opacity-100 ${c.text}`}>HEX: {c.value}</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-sm font-bold text-hgi-text">{c.name}</span>
                    <span className="text-xs font-mono text-hgi-muted select-all">hgi-{c.name.toLowerCase().replace(' ', '')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section>
            <h3 className="text-xs font-mono text-hgi-orange uppercase tracking-widest mb-6 border-b border-hgi-border/30 pb-2">
              02. Typography
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-hgi-border/30 pb-1 mb-2">
                   <span className="text-sm text-hgi-muted font-mono">Primary Sans</span>
                   <span className="text-xs text-hgi-orange font-mono">Inter</span>
                </div>
                <div className="space-y-4 p-6 bg-hgi-dark border border-hgi-border rounded-sm">
                   <div>
                     <span className="text-xs text-hgi-muted mb-1 block">H1 / Bold / 36px</span>
                     <h1 className="text-4xl font-bold text-hgi-text">Human Grounded Intelligence</h1>
                   </div>
                   <div>
                     <span className="text-xs text-hgi-muted mb-1 block">H2 / Bold / 24px</span>
                     <h2 className="text-2xl font-bold text-hgi-text">Ethical App Building</h2>
                   </div>
                   <div>
                     <span className="text-xs text-hgi-muted mb-1 block">Body / Regular / 16px</span>
                     <p className="text-base text-hgi-text leading-relaxed">
                       El diseño debe priorizar la claridad, la accesibilidad y el control humano. La tecnología sirve a la humanidad, no al revés.
                     </p>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-hgi-border/30 pb-1 mb-2">
                   <span className="text-sm text-hgi-muted font-mono">Monospace</span>
                   <span className="text-xs text-hgi-orange font-mono">JetBrains Mono</span>
                </div>
                <div className="space-y-2 p-6 bg-hgi-dark border border-hgi-border rounded-sm font-mono text-sm">
                   <div className="text-purple-400">const <span className="text-blue-400">hgiConfig</span> = {'{'}</div>
                   <div className="pl-4 text-hgi-text">
                     mode: <span className="text-orange-400">'ethical_first'</span>,
                   </div>
                   <div className="pl-4 text-hgi-text">
                     user_agency: <span className="text-blue-400">true</span>,
                   </div>
                   <div className="pl-4 text-hgi-text">
                     transparency: <span className="text-blue-400">1.0</span>
                   </div>
                   <div className="text-purple-400">{'}'};</div>
                </div>
              </div>
            </div>
          </section>

          {/* UI Components */}
           <section>
            <h3 className="text-xs font-mono text-hgi-orange uppercase tracking-widest mb-6 border-b border-hgi-border/30 pb-2">
              03. Interface Elements
            </h3>
            <div className="flex flex-wrap gap-8 items-start">
               {/* Buttons */}
               <div className="space-y-4">
                  <span className="text-xs text-hgi-muted font-mono block">Buttons</span>
                  <div className="flex flex-col gap-3">
                    <button className="px-4 py-2 bg-hgi-orange text-black font-bold rounded-sm shadow-[0_0_10px_rgba(255,79,0,0.3)] hover:bg-hgi-orangeBright transition-all">
                      Primary Action
                    </button>
                    <button className="px-4 py-2 bg-hgi-card border border-hgi-border text-hgi-text rounded-sm hover:border-hgi-orange hover:text-hgi-orange transition-all uppercase text-xs font-bold tracking-wider">
                      Secondary Action
                    </button>
                    <button className="px-4 py-2 bg-transparent text-hgi-muted hover:text-hgi-text underline text-sm">
                      Text Link
                    </button>
                  </div>
               </div>

               {/* Tags & Badges */}
               <div className="space-y-4">
                  <span className="text-xs text-hgi-muted font-mono block">Badges & Status</span>
                  <div className="flex flex-col gap-3">
                     <div className="px-3 py-1 bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-xs font-mono rounded-sm w-fit flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                       ARCHITECT MODE
                     </div>
                     <div className="px-3 py-1 bg-hgi-orange/10 border border-hgi-orange/30 text-hgi-orange text-xs font-mono rounded-sm w-fit">
                       BUILDER ACTIVE
                     </div>
                      <div className="px-2 py-0.5 bg-hgi-border text-hgi-muted text-[10px] font-mono uppercase rounded-sm w-fit border border-white/5">
                       v1.0.5
                     </div>
                  </div>
               </div>
               
               {/* Inputs */}
               <div className="space-y-4 flex-1 min-w-[200px]">
                  <span className="text-xs text-hgi-muted font-mono block">Inputs</span>
                  <input 
                    type="text" 
                    placeholder="Input field..."
                    className="w-full bg-hgi-card border border-hgi-border rounded-sm px-4 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none placeholder-hgi-muted/50 font-mono text-sm"
                  />
                  <div className="mt-2 p-3 bg-hgi-dark rounded-sm border border-hgi-border text-sm text-hgi-muted">
                    Panel or code block container
                  </div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StyleGuide;