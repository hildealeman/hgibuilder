
import React, { useState } from 'react';
import { X, Copy, PlusCircle, Layout, Type, MousePointerClick, AlignLeft, Image as ImageIcon } from 'lucide-react';

interface Snippet {
  name: string;
  description: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  snippets: Snippet[];
}

const SNIPPETS_DATA: Category[] = [
  {
    id: 'layout',
    name: 'Estructura',
    icon: <Layout className="w-4 h-4" />,
    snippets: [
      {
        name: 'Navbar Responsivo',
        description: 'Barra de navegación con logo y enlaces.',
        code: `<nav class="bg-hgi-card border-b border-hgi-border">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center">
        <div class="flex-shrink-0 font-bold text-hgi-orange">LOGO</div>
        <div class="hidden md:block">
          <div class="ml-10 flex items-baseline space-x-4">
            <a href="#" class="text-hgi-text hover:bg-hgi-border px-3 py-2 rounded-md text-sm font-medium">Inicio</a>
            <a href="#" class="text-hgi-muted hover:text-white px-3 py-2 rounded-md text-sm font-medium">Servicios</a>
            <a href="#" class="text-hgi-muted hover:text-white px-3 py-2 rounded-md text-sm font-medium">Contacto</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>`
      },
      {
        name: 'Hero Section',
        description: 'Sección principal con título grande y CTA.',
        code: `<div class="bg-hgi-dark relative overflow-hidden">
  <div class="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
    <h1 class="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
      <span class="block">Construye el futuro</span>
      <span class="block text-hgi-orange">con Inteligencia HGI</span>
    </h1>
    <p class="mt-3 max-w-md mx-auto text-base text-hgi-muted sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
      Una plataforma ética y robusta para tus necesidades digitales.
    </p>
    <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
      <div class="rounded-md shadow">
        <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-sm text-black bg-hgi-orange hover:bg-hgi-orangeBright md:py-4 md:text-lg md:px-10">
          Comenzar
        </a>
      </div>
    </div>
  </div>
</div>`
      },
      {
        name: 'Footer Simple',
        description: 'Pie de página con copyright y enlaces.',
        code: `<footer class="bg-hgi-card border-t border-hgi-border mt-12">
  <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
    <div class="flex justify-center space-x-6 md:order-2">
      <a href="#" class="text-hgi-muted hover:text-hgi-orange">Twitter</a>
      <a href="#" class="text-hgi-muted hover:text-hgi-orange">GitHub</a>
    </div>
    <div class="mt-8 md:mt-0 md:order-1">
      <p class="text-center text-base text-hgi-muted">
        &copy; 2024 HGI Inc. Todos los derechos reservados.
      </p>
    </div>
  </div>
</footer>`
      }
    ]
  },
  {
    id: 'forms',
    name: 'Formularios',
    icon: <Type className="w-4 h-4" />,
    snippets: [
      {
        name: 'Login Card',
        description: 'Tarjeta de inicio de sesión centrada.',
        code: `<div class="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 bg-hgi-card p-8 rounded-sm border border-hgi-border">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white">Inicia Sesión</h2>
    </div>
    <form class="mt-8 space-y-6" action="#" method="POST">
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email-address" class="sr-only">Email</label>
          <input id="email-address" name="email" type="email" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-hgi-border placeholder-gray-500 text-hgi-text bg-hgi-dark rounded-t-md focus:outline-none focus:ring-hgi-orange focus:border-hgi-orange focus:z-10 sm:text-sm" placeholder="Email">
        </div>
        <div>
          <label for="password" class="sr-only">Contraseña</label>
          <input id="password" name="password" type="password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-hgi-border placeholder-gray-500 text-hgi-text bg-hgi-dark rounded-b-md focus:outline-none focus:ring-hgi-orange focus:border-hgi-orange focus:z-10 sm:text-sm" placeholder="Contraseña">
        </div>
      </div>
      <div>
        <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-sm text-black bg-hgi-orange hover:bg-hgi-orangeBright focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hgi-orange">
          Entrar
        </button>
      </div>
    </form>
  </div>
</div>`
      },
      {
        name: 'Contact Form',
        description: 'Formulario de contacto con textareas.',
        code: `<div class="bg-hgi-card p-6 rounded-sm border border-hgi-border">
  <h3 class="text-lg leading-6 font-medium text-white mb-4">Contáctanos</h3>
  <div class="grid grid-cols-1 gap-6">
    <label class="block">
      <span class="text-hgi-muted text-sm">Nombre completo</span>
      <input type="text" class="mt-1 block w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-white focus:border-hgi-orange focus:ring-0" placeholder="">
    </label>
    <label class="block">
      <span class="text-hgi-muted text-sm">Mensaje</span>
      <textarea class="mt-1 block w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-white focus:border-hgi-orange focus:ring-0" rows="3"></textarea>
    </label>
    <button class="bg-hgi-border text-white py-2 px-4 rounded-sm hover:bg-hgi-orange hover:text-black transition-colors">Enviar Mensaje</button>
  </div>
</div>`
      }
    ]
  },
  {
    id: 'components',
    name: 'Componentes',
    icon: <MousePointerClick className="w-4 h-4" />,
    snippets: [
      {
        name: 'Card Simple',
        description: 'Tarjeta con borde y sombra suave.',
        code: `<div class="bg-hgi-card overflow-hidden shadow rounded-sm border border-hgi-border">
  <div class="px-4 py-5 sm:p-6">
    <h3 class="text-lg leading-6 font-medium text-white">Título de la Tarjeta</h3>
    <div class="mt-2 max-w-xl text-sm text-hgi-muted">
      <p>Este es el contenido del cuerpo de la tarjeta. Puedes poner lo que quieras aquí.</p>
    </div>
    <div class="mt-5">
      <button type="button" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-black bg-hgi-orange hover:bg-hgi-orangeBright focus:outline-none">
        Acción
      </button>
    </div>
  </div>
</div>`
      },
      {
        name: 'Stats Grid',
        description: 'Grilla de 3 columnas para estadísticas.',
        code: `<div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
  <div class="bg-hgi-card overflow-hidden shadow rounded-sm border border-hgi-border p-5">
    <dt class="text-sm font-medium text-hgi-muted truncate">Total Usuarios</dt>
    <dd class="mt-1 text-3xl font-semibold text-white">12,500</dd>
  </div>
  <div class="bg-hgi-card overflow-hidden shadow rounded-sm border border-hgi-border p-5">
    <dt class="text-sm font-medium text-hgi-muted truncate">Conversión</dt>
    <dd class="mt-1 text-3xl font-semibold text-hgi-orange">24.57%</dd>
  </div>
  <div class="bg-hgi-card overflow-hidden shadow rounded-sm border border-hgi-border p-5">
    <dt class="text-sm font-medium text-hgi-muted truncate">Sesiones Activas</dt>
    <dd class="mt-1 text-3xl font-semibold text-white">432</dd>
  </div>
</div>`
      }
    ]
  }
];

interface SnippetLibraryProps {
  onInsert: (code: string) => void;
  onClose: () => void;
}

const SnippetLibrary: React.FC<SnippetLibraryProps> = ({ onInsert, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('layout');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(name);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="absolute top-14 right-0 bottom-0 w-80 bg-hgi-card border-l border-hgi-border flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-hgi-border flex items-center justify-between bg-hgi-card">
        <h3 className="font-bold font-mono text-sm text-hgi-text uppercase tracking-wider">Librería UI</h3>
        <button onClick={onClose} className="text-hgi-muted hover:text-hgi-orange transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hgi-border overflow-x-auto no-scrollbar">
        {SNIPPETS_DATA.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
              activeCategory === cat.id
                ? 'border-hgi-orange text-hgi-orange bg-hgi-dark/50'
                : 'border-transparent text-hgi-muted hover:text-hgi-text hover:bg-hgi-dark'
            }`}
          >
            {cat.icon}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-hgi-dark/50">
        {SNIPPETS_DATA.find(c => c.id === activeCategory)?.snippets.map((snippet) => (
          <div key={snippet.name} className="bg-hgi-card border border-hgi-border rounded-sm p-4 group hover:border-hgi-orange/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-sm text-hgi-text">{snippet.name}</h4>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                  onClick={() => handleCopy(snippet.code, snippet.name)}
                  className="p-1.5 bg-hgi-dark text-hgi-muted hover:text-hgi-text rounded-sm border border-hgi-border"
                  title="Copiar Código"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-hgi-muted mb-4 leading-relaxed">{snippet.description}</p>
            
            <button
              onClick={() => onInsert(snippet.code)}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-hgi-dark border border-hgi-border text-hgi-orange text-xs font-mono uppercase tracking-wider rounded-sm hover:bg-hgi-orange hover:text-black hover:border-hgi-orange transition-all"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Insertar</span>
            </button>
            {copiedId === snippet.name && (
                <div className="mt-2 text-[10px] text-green-400 text-center font-mono animate-pulse">¡Copiado al portapapeles!</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-hgi-border bg-hgi-card text-[10px] text-hgi-muted text-center font-mono">
         Tailwind CSS Ready
      </div>
    </div>
  );
};

export default SnippetLibrary;
