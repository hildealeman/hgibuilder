
import React, { useState } from 'react';
import { X, Settings, Thermometer, Cpu, Zap, Package, Plus } from 'lucide-react';
import { GenerationConfig } from '../types';

interface SettingsModalProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  onClose: () => void;
}

const PRESET_LIBRARIES = [
  { name: 'Chart.js', url: 'https://cdn.jsdelivr.net/npm/chart.js' },
  { name: 'Three.js', url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' },
  { name: 'GSAP', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js' },
  { name: 'FontAwesome', url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' },
  { name: 'Framer Motion', url: 'https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js' },
  { name: 'Confetti', url: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js' }
];

const SettingsModal: React.FC<SettingsModalProps> = ({ config, setConfig, onClose }) => {
  const [customDep, setCustomDep] = useState('');

  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash', desc: 'Rápido, eficiente y baja latencia. Ideal para prototipado rápido.' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', desc: 'Mayor capacidad de razonamiento. Ideal para lógica compleja.' },
    { id: 'gemini-2.5-flash-latest', name: 'Gemini 2.5 Flash', desc: 'Versión estable anterior, muy rápida.' },
  ];

  const handleModelChange = (modelId: string) => {
    setConfig(prev => ({ ...prev, model: modelId }));
  };

  const handleTempChange = (val: string) => {
    setConfig(prev => ({ ...prev, temperature: parseFloat(val) }));
  };

  const toggleDependency = (url: string) => {
    setConfig(prev => {
      const exists = prev.dependencies.includes(url);
      return {
        ...prev,
        dependencies: exists 
          ? prev.dependencies.filter(d => d !== url) 
          : [...prev.dependencies, url]
      };
    });
  };

  const addCustomDependency = () => {
    if (customDep.trim()) {
      setConfig(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, customDep.trim()]
      }));
      setCustomDep('');
    }
  };

  const removeDependency = (url: string) => {
     setConfig(prev => ({
       ...prev,
       dependencies: prev.dependencies.filter(d => d !== url)
     }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-hgi-card border border-hgi-border rounded-sm shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hgi-border bg-hgi-card rounded-t-sm sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-hgi-text" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-hgi-text">Configuración de Generación</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-hgi-muted hover:text-hgi-orange transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Model Selector */}
          <div className="space-y-3">
             <div className="flex items-center space-x-2 text-hgi-orange">
                <Cpu className="w-4 h-4" />
                <label className="text-xs font-bold font-mono uppercase tracking-widest">Modelo Base</label>
             </div>
             
             <div className="grid gap-2">
               {models.map((m) => (
                 <button
                    key={m.id}
                    onClick={() => handleModelChange(m.id)}
                    className={`text-left p-3 rounded-sm border transition-all ${
                        config.model === m.id 
                        ? 'bg-hgi-orange/10 border-hgi-orange text-hgi-text' 
                        : 'bg-hgi-dark border-hgi-border text-hgi-muted hover:border-hgi-text/50'
                    }`}
                 >
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${config.model === m.id ? 'text-hgi-orange' : ''}`}>{m.name}</span>
                        {config.model === m.id && <Zap className="w-3 h-3 text-hgi-orange" />}
                    </div>
                    <p className="text-[10px] opacity-70 mt-1 font-mono">{m.desc}</p>
                 </button>
               ))}
             </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-4">
             <div className="flex items-center justify-between text-hgi-orange">
                <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4" />
                    <label className="text-xs font-bold font-mono uppercase tracking-widest">Temperatura (Creatividad)</label>
                </div>
                <span className="text-xs font-mono bg-hgi-dark px-2 py-1 rounded border border-hgi-border">{config.temperature.toFixed(1)}</span>
             </div>
             
             <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleTempChange(e.target.value)}
                className="w-full h-1.5 bg-hgi-dark rounded-lg appearance-none cursor-pointer accent-hgi-orange"
             />
             
             <div className="flex justify-between text-[10px] font-mono text-hgi-muted uppercase">
                <span>Determinista (0.0)</span>
                <span>Balanceado (1.0)</span>
                <span>Creativo (2.0)</span>
             </div>
             <p className="text-[10px] text-hgi-muted">
                Valores bajos producen código más predecible y estricto. Valores altos fomentan soluciones más creativas pero pueden introducir errores de sintaxis.
             </p>
          </div>

          {/* Dependencies */}
          <div className="space-y-4 pt-4 border-t border-hgi-border/30">
            <div className="flex items-center space-x-2 text-hgi-orange">
                <Package className="w-4 h-4" />
                <label className="text-xs font-bold font-mono uppercase tracking-widest">Librerías Externas (CDN)</label>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                {PRESET_LIBRARIES.map(lib => {
                  const isActive = config.dependencies.includes(lib.url);
                  return (
                    <button
                      key={lib.name}
                      onClick={() => toggleDependency(lib.url)}
                      className={`px-3 py-2 text-xs font-mono border rounded-sm transition-all text-left truncate ${
                         isActive 
                         ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                         : 'bg-hgi-dark border-hgi-border text-hgi-muted hover:text-hgi-text'
                      }`}
                    >
                      {isActive ? '[x]' : '[ ]'} {lib.name}
                    </button>
                  );
                })}
             </div>

             <div className="space-y-2">
               <label className="text-[10px] text-hgi-muted font-mono uppercase">URL CDN Personalizada</label>
               <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={customDep}
                    onChange={(e) => setCustomDep(e.target.value)}
                    placeholder="https://cdn.example.com/lib.js"
                    className="flex-1 bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange outline-none font-mono text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomDependency()}
                 />
                 <button 
                   onClick={addCustomDependency}
                   className="px-3 py-2 bg-hgi-card border border-hgi-border hover:bg-hgi-dark hover:text-hgi-orange transition-colors rounded-sm"
                 >
                   <Plus className="w-4 h-4" />
                 </button>
               </div>
             </div>

             {/* Active List */}
             {config.dependencies.length > 0 && (
               <div className="space-y-1">
                 <label className="text-[10px] text-hgi-muted font-mono uppercase">Activas:</label>
                 <ul className="space-y-1 max-h-32 overflow-y-auto">
                   {config.dependencies.map((dep, idx) => (
                     <li key={idx} className="flex justify-between items-center bg-hgi-dark border border-hgi-border/50 p-2 rounded-sm text-[10px] font-mono text-hgi-muted">
                        <span className="truncate flex-1 mr-2">{dep}</span>
                        <button onClick={() => removeDependency(dep)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                     </li>
                   ))}
                 </ul>
               </div>
             )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hgi-border bg-hgi-card rounded-b-sm flex justify-end sticky bottom-0 z-10">
           <button 
              onClick={onClose}
              className="px-6 py-2 bg-hgi-text text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-white transition-all"
           >
              Listo
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
