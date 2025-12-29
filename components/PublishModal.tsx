
import React, { useState, useEffect } from 'react';
import { X, Rocket, Loader2, CheckCircle, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import { pushToGitHub, createRepository } from '../services/githubService';

interface PublishModalProps {
  code: string;
  projectTitle: string;
  onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ code, projectTitle, onClose }) => {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('');
  
  const [step, setStep] = useState<'config' | 'deploying' | 'success' | 'error'>('config');
  const [statusMsg, setStatusMsg] = useState('');
  const [deployUrl, setDeployUrl] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('hgi_github_token');
    if (savedToken) {
      setToken(savedToken);
      // Try to extract username from a previous repo string if available, or fetch user
      fetchUser(savedToken);
    }
    
    // Suggest a repo name based on project title
    const suggestedName = projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'hgi-app-' + Math.floor(Math.random() * 1000);
    setRepoName(suggestedName);
  }, [projectTitle]);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.login);
      }
    } catch (e) {}
  };

  const handlePublish = async () => {
    if (!token || !repoName || !username) {
      setStep('error');
      setStatusMsg('Faltan datos requeridos (Token o Usuario).');
      return;
    }

    setStep('deploying');
    localStorage.setItem('hgi_github_token', token);

    try {
      // 1. Create Repo
      setStatusMsg('Verificando repositorio...');
      await createRepository(token, repoName, 'App generada con HGI Vibe Builder');

      // 2. Push index.html
      setStatusMsg('Subiendo artefacto...');
      await pushToGitHub({
        token,
        owner: username,
        repo: repoName,
        branch: 'main',
        path: 'index.html',
        message: 'Deploy from HGI Builder 🚀',
        content: code
      });

      // 3. Success
      setStep('success');
      setDeployUrl(`https://${username}.github.io/${repoName}/`);
      
    } catch (e: any) {
      console.error(e);
      setStep('error');
      setStatusMsg(e.message || 'Error durante el despliegue.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-hgi-card border border-hgi-border rounded-sm shadow-2xl w-full max-w-lg relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hgi-border bg-hgi-card">
          <div className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-hgi-orange" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-hgi-text">Publicar en Web</h2>
          </div>
          <button onClick={onClose} className="text-hgi-muted hover:text-hgi-orange transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 'config' && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <div className="p-4 bg-hgi-dark border border-hgi-border rounded-sm">
                 <p className="text-xs text-hgi-muted mb-2">
                   Esta acción creará un repositorio público en tu GitHub y subirá el código.
                 </p>
                 <div className="flex items-center gap-2 text-[10px] text-yellow-500 bg-yellow-900/10 p-2 rounded-sm border border-yellow-900/30">
                    <AlertCircle className="w-3 h-3" />
                    <span>Asegúrate de habilitar "GitHub Pages" en la configuración del repo tras publicar.</span>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-hgi-muted mb-1">GitHub Token (con permisos 'repo')</label>
                <input 
                    type="password" 
                    value={token}
                    onChange={(e) => { setToken(e.target.value); fetchUser(e.target.value); }}
                    className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:border-hgi-orange outline-none font-mono text-xs"
                    placeholder="ghp_..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-mono text-hgi-muted mb-1">Usuario</label>
                    <input 
                        type="text" 
                        value={username}
                        readOnly
                        className="w-full bg-hgi-dark/50 border border-hgi-border rounded-sm px-3 py-2 text-hgi-muted outline-none font-mono text-xs cursor-not-allowed"
                        placeholder="Detectando..."
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-mono text-hgi-muted mb-1">Nombre del Repo</label>
                    <input 
                        type="text" 
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:border-hgi-orange outline-none font-mono text-xs"
                    />
                 </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={handlePublish}
                  disabled={!token || !username || !repoName}
                  className="flex items-center gap-2 px-6 py-2 bg-hgi-orange text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-hgi-orangeBright transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,79,0,0.3)] hover:shadow-[0_0_20px_rgba(255,79,0,0.5)]"
                >
                  <Globe className="w-3 h-3" />
                  Publicar App
                </button>
              </div>
            </div>
          )}

          {step === 'deploying' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in">
              <div className="relative">
                 <div className="absolute inset-0 bg-hgi-orange blur-xl opacity-20 animate-pulse"></div>
                 <Loader2 className="w-12 h-12 text-hgi-orange animate-spin relative z-10" />
              </div>
              <div className="text-center">
                <h3 className="text-hgi-text font-bold text-sm mb-1">Desplegando...</h3>
                <p className="text-hgi-muted text-xs font-mono">{statusMsg}</p>
              </div>
            </div>
          )}

          {step === 'error' && (
             <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in-95">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50">
                   <X className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center px-4">
                   <h3 className="text-red-400 font-bold text-sm mb-1">Error en Despliegue</h3>
                   <p className="text-hgi-muted text-xs font-mono break-all">{statusMsg}</p>
                </div>
                <button 
                  onClick={() => setStep('config')}
                  className="px-4 py-2 bg-hgi-card border border-hgi-border text-hgi-text text-xs rounded-sm hover:border-hgi-orange"
                >
                   Intentar de nuevo
                </button>
             </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-6 animate-in zoom-in-95">
               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                   <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                
                <div className="text-center w-full">
                   <h3 className="text-hgi-text font-bold text-lg mb-2">¡App Publicada!</h3>
                   <p className="text-hgi-muted text-xs mb-4 max-w-xs mx-auto">
                     Tu aplicación está siendo procesada por GitHub Pages. Puede tardar 1-2 minutos en estar visible.
                   </p>
                   
                   <div className="bg-hgi-dark p-3 rounded-sm border border-hgi-border flex items-center justify-between gap-2 w-full">
                      <span className="text-xs font-mono text-blue-400 truncate flex-1 text-left">{deployUrl}</span>
                      <a 
                        href={deployUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-hgi-card border border-hgi-border rounded-sm hover:text-hgi-orange transition-colors"
                      >
                         <ExternalLink className="w-3 h-3" />
                      </a>
                   </div>
                </div>

                <div className="w-full pt-2 border-t border-hgi-border/30">
                   <p className="text-[10px] text-hgi-muted text-center mb-2">
                      Si ves un error 404, ve a: <br/> 
                      <span className="font-mono text-hgi-text">Repo Settings {'>'} Pages {'>'} Source: main</span>
                   </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
