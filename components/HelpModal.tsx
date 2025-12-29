import React from 'react';
import { X, Palette, Brain, Search, Mic, Github, ShieldCheck, HelpCircle, Server, FileCode, Layers, Database } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const features = [
    {
      icon: <Palette className="w-5 h-5 text-hgi-text" />,
      title: "Sistema de Diseño (Palette)",
      desc: "Visualiza la paleta de colores HGI, tipografía y elementos base que la IA utiliza para construir la interfaz."
    },
    {
      icon: <Brain className="w-5 h-5 text-hgi-orange" />,
      title: "Modo Pensamiento (Brain)",
      desc: "Activa Gemini 3 Pro con capacidad de razonamiento extendido. Úsalo para lógica compleja, algoritmos o arquitectura de aplicaciones difícil."
    },
    {
      icon: <Search className="w-5 h-5 text-blue-400" />,
      title: "Google Search (Grounding)",
      desc: "Permite al modelo buscar en Google información en tiempo real. Actívalo si tu aplicación necesita datos actualizados."
    },
    {
        icon: <Mic className="w-5 h-5 text-cyan-400" />,
        title: "Sesión en Vivo (Architect)",
        desc: "Inicia una conversación de voz fluida con el 'Arquitecto HGI'. Ideal para planificar la estructura antes de generar código."
    },
    {
        icon: <Github className="w-5 h-5 text-white" />,
        title: "Exportar a Git",
        desc: "Envía el código generado directamente a un repositorio de GitHub mediante un commit."
    },
    {
        icon: <ShieldCheck className="w-5 h-5 text-green-400" />,
        title: "Auditoría Ética",
        desc: "Ejecuta un análisis del código para detectar problemas de accesibilidad y privacidad."
    }
  ];

  const specs = [
    {
        icon: <FileCode className="w-4 h-4 text-hgi-orange" />,
        title: "Stack & React",
        desc: "Soporte completo para React 18 (Hooks, JSX) vía CDN. Pide 'Crear app en React' para activarlo."
    },
    {
        icon: <Database className="w-4 h-4 text-hgi-orange" />,
        title: "Persistencia",
        desc: "Uso de LocalStorage para guardar datos del usuario (To-Do lists, notas, configuración) sin backend."
    },
    {
        icon: <Server className="w-4 h-4 text-hgi-orange" />,
        title: "Límites",
        desc: "Frontend Only. Sin backend nativo (Node/Python). Todo corre en el navegador del cliente."
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-hgi-card border border-hgi-border rounded-sm shadow-2xl w-full max-w-3xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hgi-border bg-hgi-card rounded-t-sm">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-hgi-orange" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-hgi-text">Manual HGI</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-hgi-muted hover:text-hgi-orange transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Features Grid */}
          <section>
             <h3 className="text-xs font-mono text-hgi-muted uppercase tracking-widest mb-4">Herramientas</h3>
             <div className="grid md:grid-cols-2 gap-4">
                {features.map((item, idx) => (
                  <div key={idx} className="p-4 border border-hgi-border rounded-sm bg-hgi-dark hover:border-hgi-orange/50 transition-colors group">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-hgi-card rounded-sm border border-hgi-border group-hover:border-hgi-orange/30 transition-colors">
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-sm text-hgi-text">{item.title}</h3>
                    </div>
                    <p className="text-xs text-hgi-muted leading-relaxed pl-[3.25rem]">
                      {item.desc}
                    </p>
                  </div>
                ))}
             </div>
          </section>

          {/* Specs Grid */}
          <section>
             <h3 className="text-xs font-mono text-hgi-muted uppercase tracking-widest mb-4">Especificaciones Técnicas</h3>
             <div className="grid md:grid-cols-3 gap-4">
                {specs.map((item, idx) => (
                   <div key={idx} className="p-3 bg-hgi-card/50 border border-hgi-border rounded-sm flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                         {item.icon}
                         <span className="font-bold text-xs text-hgi-text">{item.title}</span>
                      </div>
                      <p className="text-[10px] text-hgi-muted leading-snug">
                         {item.desc}
                      </p>
                   </div>
                ))}
             </div>
          </section>

          <div className="p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-sm">
            <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase mb-2">Consejo Pro</h4>
            <p className="text-xs text-cyan-100/70">
              Prueba pidiendo: <em>"Crea una app de notas en React que guarde todo en localStorage y tenga modo oscuro."</em> El sistema configurará automáticamente React, Babel y la persistencia de datos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;