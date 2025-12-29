import React, { useState, useEffect } from 'react';
import { X, Github, Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { pushToGitHub } from '../services/githubService';

interface GitExportModalProps {
  code: string;
  onClose: () => void;
}

const GitExportModal: React.FC<GitExportModalProps> = ({ code, onClose }) => {
  const [token, setToken] = useState('');
  const [repoStr, setRepoStr] = useState(''); // "owner/repo"
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('index.html');
  const [message, setMessage] = useState('Initial commit from HGI Vibe Builder');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('hgi_github_token');
    const savedRepo = localStorage.getItem('hgi_github_repo');
    if (savedToken) setToken(savedToken);
    if (savedRepo) setRepoStr(savedRepo);
  }, []);

  const handlePush = async () => {
    if (!token || !repoStr || !message) {
      setStatus('error');
      setStatusMsg('Please fill in all required fields.');
      return;
    }

    const [owner, repo] = repoStr.split('/');
    if (!owner || !repo) {
      setStatus('error');
      setStatusMsg('Repository format must be owner/repo');
      return;
    }

    setStatus('loading');
    setStatusMsg('Pushing to GitHub...');

    try {
      await pushToGitHub({
        token,
        owner,
        repo,
        branch,
        path,
        message,
        content: code
      });
      
      // Save valid configs
      localStorage.setItem('hgi_github_token', token);
      localStorage.setItem('hgi_github_repo', repoStr);
      
      setStatus('success');
      setStatusMsg('Successfully pushed to repository!');
      setTimeout(() => {
         onClose();
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setStatusMsg(e.message || 'Failed to push code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-hgi-card border border-hgi-border rounded-sm shadow-2xl w-full max-w-lg relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hgi-border bg-hgi-card rounded-t-sm">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5 text-hgi-text" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-hgi-text">Git Export</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-hgi-muted hover:text-hgi-orange transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Status Banner */}
          {status !== 'idle' && (
            <div className={`p-3 rounded-sm text-xs font-mono flex items-center gap-2 ${
                status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-hgi-dark text-hgi-muted border border-hgi-border'
            }`}>
                {status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-3 h-3" />}
                {status === 'error' && <AlertCircle className="w-3 h-3" />}
                <span>{statusMsg}</span>
            </div>
          )}

          <div className="space-y-3">
             {/* Token Input */}
             <div>
                <label className="block text-xs font-mono text-hgi-muted mb-1">GitHub Personal Access Token (PAT)</label>
                <input 
                    type="password" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none font-mono text-xs"
                />
                <p className="text-[10px] text-hgi-muted mt-1">Requires 'repo' scope. Token is saved to localStorage.</p>
             </div>

             {/* Repo & Branch */}
             <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-mono text-hgi-muted mb-1">Repository (owner/repo)</label>
                    <input 
                        type="text" 
                        value={repoStr}
                        onChange={(e) => setRepoStr(e.target.value)}
                        placeholder="username/project"
                        className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none font-mono text-xs"
                    />
                </div>
                <div>
                    <label className="block text-xs font-mono text-hgi-muted mb-1">Branch</label>
                    <input 
                        type="text" 
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none font-mono text-xs"
                    />
                </div>
             </div>

             {/* File Path */}
             <div>
                <label className="block text-xs font-mono text-hgi-muted mb-1">File Path</label>
                <input 
                    type="text" 
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none font-mono text-xs"
                />
             </div>

             {/* Commit Message */}
             <div>
                <label className="block text-xs font-mono text-hgi-muted mb-1">Commit Message</label>
                <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-3 py-2 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none font-mono text-xs resize-none"
                />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hgi-border bg-hgi-card rounded-b-sm flex justify-end space-x-2">
           <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-hgi-muted hover:text-hgi-text transition-colors"
           >
              Cancel
           </button>
           <button 
              onClick={handlePush}
              disabled={status === 'loading' || status === 'success'}
              className="flex items-center gap-2 px-4 py-2 bg-hgi-orange text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-hgi-orangeBright disabled:opacity-50 disabled:cursor-not-allowed transition-all"
           >
              {status === 'loading' ? 'Pushing...' : 'Push Commit'}
              <Save className="w-3 h-3" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default GitExportModal;
