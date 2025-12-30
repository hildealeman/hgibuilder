import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Mic, Image as ImageIcon, Code, Play, 
  Download, Loader2, Sparkles, Brain, Search, 
  Monitor, Activity, RotateCcw, Save, Pencil,
  ArrowDownToLine, MessageSquare, History, Clock,
  ShieldCheck, Palette, Github, HelpCircle, Settings,
  Undo2, Redo2, Layout, X, Paperclip, Share2, Users, Link as LinkIcon, Rocket, MoreHorizontal, Folder, ChevronDown
} from 'lucide-react';
import { generateAppCode, generateImage, validateCodeEthics } from './services/geminiService';
import { liveSessionInstance } from './services/liveApiService';
import { collaborationService, SyncPayload } from './services/collaborationService';
import { storageService } from './src/services/storageService';
import { supabase } from './src/services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import AppPreview from './components/AppPreview';
import CodeEditor from './components/CodeEditor';
import StyleGuide from './components/StyleGuide';
import SnippetLibrary from './components/SnippetLibrary';
import GitExportModal from './components/GitExportModal';
import PublishModal from './components/PublishModal';
import HelpModal from './components/HelpModal';
import SettingsModal from './components/SettingsModal';
import { Message, MessageRole, Artifact, AppMode, GenerationConfig, ImageSize } from './types';

const STORAGE_KEY = 'hgi_vibe_builder_artifact_v1';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [dbProjectId, setDbProjectId] = useState<string | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [dbProjects, setDbProjects] = useState<Array<{ id: string; title: string; updated_at: string | null }>>([]);
  const [mobileSelectedProjectId, setMobileSelectedProjectId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'gallery' | 'preview'>('gallery');
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [liveContextStale, setLiveContextStale] = useState(false);

  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.SYSTEM,
      content: "Bienvenido a HGI Vibe Builder. Soy tu arquitecto de Inteligencia Fundamentada en lo Humano. ¿Qué solución ética y robusta construiremos hoy?"
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showStyleGuide, setShowStyleGuide] = useState(false);
  const [showSnippetLibrary, setShowSnippetLibrary] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Collaboration State
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collabRole, setCollabRole] = useState<'host' | 'guest' | 'none'>('none');
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Artifact & History State
  const [currentArtifact, setCurrentArtifact] = useState<Artifact>({
    id: 'init',
    title: 'Untitled App',
    code: '',
    version: 0,
    timestamp: Date.now()
  });
  
  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<Artifact[]>([]);
  const [redoStack, setRedoStack] = useState<Artifact[]>([]);

  // Version History (Persisted Snapshots)
  const [history, setHistory] = useState<Artifact[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  const [viewMode, setViewMode] = useState<AppMode>(AppMode.PREVIEW);
  const [hasSavedState, setHasSavedState] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  
  // Config State
  const [config, setConfig] = useState<GenerationConfig>({
    useSearch: false,
    useThinking: false,
    imageSize: ImageSize.SIZE_1K,
    model: 'gemini-3-flash-preview',
    temperature: 0.7,
    dependencies: []
  });

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const titleBeforeEdit = useRef<Artifact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPersistedMessageId = useRef<string | null>(null);
  const artifactSaveTimer = useRef<number | null>(null);
  const liveContextFingerprint = useRef<string | null>(null);
  const toolbarMenuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  const resetWorkspaceForProject = (title: string) => {
    setInput('');
    setSelectedImage(null);
    setShowSnippetLibrary(false);
    setShowHistoryDropdown(false);
    setUndoStack([]);
    setRedoStack([]);
    setHistory([]);
    setDbSessionId(null);
    lastPersistedMessageId.current = null;
    setCurrentArtifact({
      id: 'init',
      title: title || 'Untitled App',
      code: '',
      version: 0,
      timestamp: Date.now(),
    });
    setMessages([
      {
        id: 'welcome',
        role: MessageRole.SYSTEM,
        content:
          "Bienvenido a HGI Vibe Builder. Soy tu arquitecto de Inteligencia Fundamentada en lo Humano. ¿Qué solución ética y robusta construiremos hoy?",
      },
    ]);
  };

  useEffect(() => {
    if (!showToolbarMenu && !showProjectMenu) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const toolbarOutside = toolbarMenuRef.current && !toolbarMenuRef.current.contains(target);
      const projectOutside = projectMenuRef.current && !projectMenuRef.current.contains(target);
      if (toolbarOutside && projectOutside) {
        setShowToolbarMenu(false);
        setShowProjectMenu(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showToolbarMenu, showProjectMenu]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setSession(data.session);
      } catch (e: any) {
        console.error('Supabase getSession failed', e);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mqlMobile = window.matchMedia('(max-width: 767px)');
    const onChange = () => {
      setIsMobile(mqlMobile.matches);
      setIsLearningMode(mqlMobile.matches);
    };

    onChange();
    mqlMobile.addEventListener('change', onChange);
    return () => mqlMobile.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (isLearningMode && viewMode !== AppMode.PREVIEW) {
      setViewMode(AppMode.PREVIEW);
    }
  }, [isLearningMode, viewMode]);

  const loadProjectIntoState = async (ownerId: string, projectId: string, projectTitle?: string) => {
    setDbLoading(true);
    try {
      setDbProjectId(projectId);

      const { data: existingSessions, error: sessionsErr } = await supabase
        .from('hgibuilder_sessions')
        .select(
          'id,started_at,ended_at,current_artifact_title,current_artifact_version,current_artifact_code'
        )
        .eq('owner_id', ownerId)
        .eq('project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessionsErr) throw sessionsErr;

      let sessionId = existingSessions?.[0]?.id as string | undefined;

      if (!sessionId) {
        const seedTitle = projectTitle || dbProjects.find((p) => p.id === projectId)?.title || 'Untitled App';
        const { data: createdSession, error: createSessionErr } = await supabase
          .from('hgibuilder_sessions')
          .insert({
            project_id: projectId,
            owner_id: ownerId,
            started_at: new Date().toISOString(),
            current_artifact_title: seedTitle,
            current_artifact_version: 0,
            current_artifact_code: '',
          })
          .select(
            'id,started_at,ended_at,current_artifact_title,current_artifact_version,current_artifact_code'
          )
          .single();

        if (createSessionErr) throw createSessionErr;
        sessionId = createdSession.id;
      }

      setDbSessionId(sessionId);

      const { data: loadedSession, error: loadedSessionErr } = await supabase
        .from('hgibuilder_sessions')
        .select('current_artifact_title,current_artifact_version,current_artifact_code')
        .eq('id', sessionId)
        .single();

      if (loadedSessionErr) throw loadedSessionErr;

      setCurrentArtifact((prev) => ({
        ...prev,
        id: sessionId,
        title: loadedSession?.current_artifact_title || prev.title,
        code:
          typeof loadedSession?.current_artifact_code === 'string'
            ? loadedSession.current_artifact_code
            : prev.code,
        version:
          typeof loadedSession?.current_artifact_version === 'number'
            ? loadedSession.current_artifact_version
            : prev.version,
        timestamp: Date.now(),
      }));

      const { data: loadedMessages, error: messagesErr } = await supabase
        .from('hgibuilder_messages')
        .select('id,role,content,image,created_at')
        .eq('owner_id', ownerId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesErr) throw messagesErr;

      if (loadedMessages && loadedMessages.length > 0) {
        setMessages(
          loadedMessages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            image: m.image || undefined,
          }))
        );
        lastPersistedMessageId.current = loadedMessages[loadedMessages.length - 1].id;
      } else {
        setMessages([
          {
            id: 'welcome',
            role: MessageRole.SYSTEM,
            content:
              "Bienvenido a HGI Vibe Builder. Soy tu arquitecto de Inteligencia Fundamentada en lo Humano. ¿Qué solución ética y robusta construiremos hoy?",
          },
        ]);
        lastPersistedMessageId.current = 'welcome';
      }
    } catch (e) {
      console.error('Failed to load project into state', e);
    } finally {
      setDbLoading(false);
    }
  };

  const handleSelectProject = async (projectId: string, projectTitleOverride?: string) => {
    if (!session) return;
    setShowProjectMenu(false);
    const nextTitle = projectTitleOverride || dbProjects.find((p) => p.id === projectId)?.title || 'Untitled App';
    resetWorkspaceForProject(nextTitle);
    setMobileSelectedProjectId(projectId);
    await loadProjectIntoState(session.user.id, projectId, nextTitle);
    if (isMobile) setMobileView('preview');
  };

  const handleCreateNewProject = async () => {
    if (!session) return;
    if (collabRole === 'guest') return;
    setShowProjectMenu(false);
    if (creatingProject) return;
    setCreatingProject(true);
    try {
      const ownerId = session.user.id;
      const { data: createdProject, error: createProjectErr } = await supabase
        .from('hgibuilder_projects')
        .insert({ owner_id: ownerId, title: currentArtifact.title || 'Untitled App' })
        .select('id,title,updated_at')
        .single();

      if (createProjectErr) throw createProjectErr;

      const nextProjects = [
        {
          id: createdProject.id,
          title: createdProject.title,
          updated_at: createdProject.updated_at || null,
        },
        ...dbProjects,
      ];
      setDbProjects(nextProjects);
      resetWorkspaceForProject(createdProject.title || 'Untitled App');
      await loadProjectIntoState(ownerId, createdProject.id, createdProject.title || 'Untitled App');
      if (isMobile) {
        setMobileSelectedProjectId(createdProject.id);
        setMobileView('preview');
      }
    } catch (e) {
      console.error('Failed to create project', e);
    } finally {
      setCreatingProject(false);
    }
  };

  useEffect(() => {
    const initPersistence = async () => {
      if (!session) {
        setDbProjectId(null);
        setDbSessionId(null);
        setDbProjects([]);
        setMobileSelectedProjectId(null);
        setMobileView('gallery');
        lastPersistedMessageId.current = null;
        setHasSavedState(false);
        setLastSavedTime(null);
        resetWorkspaceForProject('Untitled App');
        return;
      }

      setDbLoading(true);
      try {
        const ownerId = session.user.id;

        const { data: allProjects, error: projectsErr } = await supabase
          .from('hgibuilder_projects')
          .select('id,title,updated_at')
          .eq('owner_id', ownerId)
          .order('updated_at', { ascending: false })

        if (projectsErr) throw projectsErr;

        const normalizedProjects = (allProjects || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          updated_at: p.updated_at || null,
        }));

        setDbProjects(normalizedProjects);

        let projectId = normalizedProjects?.[0]?.id as string | undefined;
        let projectTitle = normalizedProjects?.[0]?.title as string | undefined;

        if (!projectId) {
          const { data: createdProject, error: createProjectErr } = await supabase
            .from('hgibuilder_projects')
            .insert({ owner_id: ownerId, title: currentArtifact.title || 'Untitled App' })
            .select('id')
            .single();

          if (createProjectErr) throw createProjectErr;
          projectId = createdProject.id;
          projectTitle = currentArtifact.title || 'Untitled App';

          const nextProjects = [
            { id: projectId, title: currentArtifact.title || 'Untitled App', updated_at: null },
            ...normalizedProjects,
          ];
          setDbProjects(nextProjects);
        }

        if (isMobile) {
          setMobileSelectedProjectId(projectId);
          setMobileView('gallery');
        }

        resetWorkspaceForProject(projectTitle || 'Untitled App');
        await loadProjectIntoState(ownerId, projectId, projectTitle);
      } catch (e) {
        console.error('Supabase persistence init failed', e);
      } finally {
        setDbLoading(false);
      }
    };

    initPersistence();
  }, [session]);

  useEffect(() => {
    const persistLatestMessage = async () => {
      if (!session || !dbSessionId) return;
      if (collabRole === 'guest') return;
      if (messages.length === 0) return;

      const last = messages[messages.length - 1];
      if (!last?.id) return;
      if (lastPersistedMessageId.current === last.id) return;
      if (last.id === 'welcome') {
        lastPersistedMessageId.current = last.id;
        return;
      }

      try {
        const ownerId = session.user.id;
        const { error } = await supabase.from('hgibuilder_messages').insert({
          session_id: dbSessionId,
          owner_id: ownerId,
          role: last.role,
          content: last.content,
          image: last.image || null,
        });

        if (error) throw error;
        lastPersistedMessageId.current = last.id;
      } catch (e) {
        console.error('Failed to persist message', e);
      }
    };

    persistLatestMessage();
  }, [messages, session, dbSessionId, collabRole]);

  useEffect(() => {
    const persistArtifact = async () => {
      if (!session || !dbSessionId || !dbProjectId) return;
      if (collabRole === 'guest') return;
      if (!currentArtifact.id || currentArtifact.id === 'init') return;

      try {
        const now = new Date().toISOString();
        const { error: sessErr } = await supabase
          .from('hgibuilder_sessions')
          .update({
            current_artifact_title: currentArtifact.title,
            current_artifact_version: currentArtifact.version,
            current_artifact_code: currentArtifact.code,
            updated_at: now,
          })
          .eq('id', dbSessionId);

        if (sessErr) throw sessErr;

        const { error: projErr } = await supabase
          .from('hgibuilder_projects')
          .update({ title: currentArtifact.title, updated_at: now })
          .eq('id', dbProjectId);

        if (projErr) throw projErr;
        setHasSavedState(true);
        setLastSavedTime(new Date().toLocaleTimeString());
      } catch (e) {
        console.error('Failed to persist artifact', e);
      }
    };

    if (artifactSaveTimer.current) {
      window.clearTimeout(artifactSaveTimer.current);
    }

    artifactSaveTimer.current = window.setTimeout(persistArtifact, 1200);

    return () => {
      if (artifactSaveTimer.current) {
        window.clearTimeout(artifactSaveTimer.current);
      }
    };
  }, [currentArtifact, session, dbSessionId, dbProjectId, collabRole]);

  useEffect(() => {
    if (!isLiveActive) return;
    const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : 'none';
    const fp = `${currentArtifact.title}|${currentArtifact.version}|${currentArtifact.code.length}|${lastMsgId}`;
    if (liveContextFingerprint.current && liveContextFingerprint.current !== fp) {
      setLiveContextStale(true);
    }
  }, [currentArtifact, messages, isLiveActive]);

  const startLiveWithCurrentContext = async () => {
    const liveApiKey = storageService.getSessionSecret('live_api_key') || undefined;
    await liveSessionInstance.start(
      {
        onOpen: () => {
          setIsLiveActive(true);
          setLiveContextStale(false);
          const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : 'none';
          liveContextFingerprint.current = `${currentArtifact.title}|${currentArtifact.version}|${currentArtifact.code.length}|${lastMsgId}`;
        },
        onClose: () => {
          setIsLiveActive(false);
          setLiveContextStale(false);
          liveContextFingerprint.current = null;
        },
        onError: () => {
          setIsLiveActive(false);
          setLiveContextStale(false);
          liveContextFingerprint.current = null;
        },
        onTranscription: (userText, modelText) => {
          setMessages((prev) => {
            const newMsgs = [...prev];
            if (userText && userText.trim().length > 0) {
              const msg = {
                id: Date.now().toString() + '_voice_user',
                role: MessageRole.USER,
                content: userText.trim(),
              };
              newMsgs.push(msg);
              if (collabRole === 'guest') {
                collaborationService.sendToHost('REMOTE_PROMPT', msg);
              }
            }
            if (modelText && modelText.trim().length > 0) {
              newMsgs.push({
                id: Date.now().toString() + '_voice_model_architect',
                role: MessageRole.MODEL,
                content: modelText.trim(),
              });
            }
            return newMsgs;
          });
        },
      },
      {
        code: `TITLE: ${currentArtifact.title}\nVERSION: ${currentArtifact.version}\n\n${currentArtifact.code}`,
        history: messages.slice(-100),
      },
      liveApiKey
    );
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setShowToolbarMenu(false);
      setShowProjectMenu(false);
      setDbProjectId(null);
      setDbSessionId(null);
      setDbProjects([]);
      setMobileSelectedProjectId(null);
      setMobileView('gallery');
      lastPersistedMessageId.current = null;
      setHasSavedState(false);
      setLastSavedTime(null);
      resetWorkspaceForProject('Untitled App');
    } catch (e: any) {
      setAuthError(e?.message || 'Sign out failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // --- COLLABORATION INIT ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionHostId = params.get('session');

    const initCollab = async () => {
        try {
            const id = await collaborationService.initialize(sessionHostId || undefined);
            setPeerId(id);
            
            if (sessionHostId) {
                setCollabRole('guest');
                setIsCollaborating(true);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            }

            collaborationService.onConnectionChange((count) => {
                setPeerCount(count);
                // If I am Host and a guest connects, sync state
                if (collaborationService.isHost && count > 0) {
                   collaborationService.broadcast('SYNC_STATE', {
                       artifact: currentArtifact,
                       messages: messages
                   });
                }
            });

            collaborationService.onData((payload, senderId) => {
                handleRemoteData(payload, senderId);
            });

        } catch (e) {
            console.error("Collab Init Error", e);
        }
    };
    
    // Only init if session ID exists or user explicitly starts session
    if (sessionHostId) {
        initCollab();
    }

    return () => {
        // Cleanup if needed? Usually persistent for app life.
    };
  }, []);

  // --- COLLABORATION HANDLERS ---
  const startCollaboration = async () => {
      if (peerId) return; // Already init
      const id = await collaborationService.initialize();
      setPeerId(id);
      setCollabRole('host');
      setIsCollaborating(true);
      setShowShareModal(true);
      
      collaborationService.onConnectionChange((count) => setPeerCount(count));
      collaborationService.onData((payload, senderId) => handleRemoteData(payload, senderId));
  };

  const handleRemoteData = (payload: SyncPayload, senderId: string) => {
      console.log("Received payload", payload.type);
      
      switch(payload.type) {
          case 'SYNC_STATE':
              if (collabRole === 'guest') {
                  setCurrentArtifact(payload.data.artifact);
                  setMessages(payload.data.messages);
              }
              break;
          case 'CODE_UPDATE':
              if (collabRole === 'guest') {
                  setCurrentArtifact(payload.data);
              }
              break;
          case 'NEW_MESSAGE':
              setMessages(prev => {
                  if (prev.find(m => m.id === payload.data.id)) return prev;
                  return [...prev, payload.data];
              });
              break;
          case 'REMOTE_PROMPT':
              if (collabRole === 'host') {
                  const guestMsg = {
                      ...payload.data,
                      content: `[GUEST] ${payload.data.content}`
                  };
                  handleSendMessage(undefined, guestMsg); 
              }
              break;
      }
  };

  // Broadcast Updates (Host Only)
  useEffect(() => {
      if (collabRole === 'host' && isCollaborating) {
          collaborationService.broadcast('CODE_UPDATE', currentArtifact);
      }
  }, [currentArtifact, collabRole, isCollaborating]);

  useEffect(() => {
     if (collabRole === 'host' && isCollaborating && messages.length > 0) {
         const lastMsg = messages[messages.length - 1];
         collaborationService.broadcast('NEW_MESSAGE', lastMsg);
     }
  }, [messages, collabRole, isCollaborating]);


  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          performRedo();
        } else {
          performUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        performRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, currentArtifact]); // Deps crucial for closure

  // Check for saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasSavedState(true);
    }
  }, []);

  // Autosave logic
  useEffect(() => {
    const saveArtifact = () => {
      if (currentArtifact.code && currentArtifact.id !== 'init') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentArtifact));
        setHasSavedState(true);
        setLastSavedTime(new Date().toLocaleTimeString());
      }
    };

    saveArtifact();
    const interval = setInterval(saveArtifact, 30000);
    return () => clearInterval(interval);
  }, [currentArtifact]);

  // Undo/Redo Logic
  const saveToUndo = (artifact: Artifact) => {
    setUndoStack(prev => [...prev, artifact]);
    setRedoStack([]); // Clear redo on new action
  };

  const performUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    
    // Save current to redo
    setRedoStack(prev => [currentArtifact, ...prev]);
    // Set previous as current
    setCurrentArtifact(previous);
    setUndoStack(newUndo);
  };

  const performRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    const newRedo = redoStack.slice(1);
    
    // Save current to undo
    setUndoStack(prev => [...prev, currentArtifact]);
    // Set next as current
    setCurrentArtifact(next);
    setRedoStack(newRedo);
  };

  const handleRestore = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        if (currentArtifact.code) saveToUndo(currentArtifact);
        
        const parsed = JSON.parse(saved);
        setCurrentArtifact(parsed);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: MessageRole.SYSTEM,
          content: `Sesión restaurada (v${parsed.version})`
        }]);
      }
    } catch (e) {
      console.error("Failed to restore", e);
    }
  };

  const handleRestoreVersion = (artifact: Artifact) => {
    // Save current state to history AND undo stack before switching
    if (currentArtifact.id !== 'init') {
       saveToUndo(currentArtifact);
       setHistory(prev => [...prev, { ...currentArtifact, timestamp: Date.now() }]);
    }
    setCurrentArtifact(artifact);
    setShowHistoryDropdown(false);
    
    setMessages(prev => [...prev, {
        id: Date.now().toString() + '_restore',
        role: MessageRole.SYSTEM,
        content: `Versión ${artifact.version} restaurada.`
    }]);
  };

  const handleEthicsAudit = async () => {
    if (!currentArtifact.code) return;

    setIsGenerating(true);
    setMessages(prev => [...prev, {
        id: Date.now().toString() + '_audit_start',
        role: MessageRole.SYSTEM,
        content: "Iniciando auditoría de ética, privacidad y accesibilidad..."
    }]);

    try {
        const report = await validateCodeEthics(currentArtifact.code);
        setMessages(prev => [...prev, {
            id: Date.now().toString() + '_audit_report',
            role: MessageRole.MODEL,
            content: report
        }]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleInsertSnippet = (code: string) => {
    const prompt = `Integra el siguiente componente en la aplicación existente, manteniendo el estilo visual y la funcionalidad:\n\n${code}`;
    setInput(prompt);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers
  const handleSendMessage = async (e?: any, remoteMsg?: Message) => {
    if (!remoteMsg && !input.trim() && !selectedImage) return;

    // Use remote message if provided (from Guest) or build local message
    const userMsg: Message = remoteMsg || {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: input,
      image: selectedImage || undefined
    };

    // If Guest, send prompt to Host and DO NOT run local generation
    if (collabRole === 'guest') {
        collaborationService.sendToHost('REMOTE_PROMPT', userMsg);
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
        return;
    }

    setMessages(prev => [...prev, userMsg]);
    
    // Store image for sending then clear state
    const imgToSend = userMsg.image;
    if (!remoteMsg) {
        setInput('');
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
    
    setIsGenerating(true);

    try {
      const promptText = userMsg.content;
      // Basic check for image generation intent in Spanish/English
      const lowerInput = promptText.toLowerCase();
      const isImageGen = lowerInput.includes("generar imagen") || lowerInput.includes("crear imagen") || lowerInput.includes("generate image");
      
      if (isImageGen) {
        const imageUrl = await generateImage(promptText, config.imageSize, imgToSend || undefined);
        if (imageUrl) {
           const aiMsg: Message = {
            id: Date.now().toString() + '_ai',
            role: MessageRole.MODEL,
            content: "Aquí está el activo generado:",
            image: imageUrl
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
           setMessages(prev => [...prev, { id: Date.now() + '_err', role: MessageRole.MODEL, content: "Error al generar la imagen." }]);
        }
      } else {
        // App Building Logic
        
        // 1. Save current state to history & undo stack before generating new version
        if (currentArtifact.id !== 'init' && currentArtifact.code) {
           saveToUndo(currentArtifact);
           setHistory(prev => [...prev, { ...currentArtifact, timestamp: Date.now() }]);
        }

        const generatedCode = await generateAppCode(promptText, config, currentArtifact.code, imgToSend || undefined);
        
        setCurrentArtifact(prev => ({
          ...prev,
          id: prev.id === 'init' ? Date.now().toString() : prev.id,
          code: generatedCode,
          version: prev.version + 1,
          timestamp: Date.now()
        }));

        const aiMsg: Message = {
          id: Date.now().toString() + '_ai',
          role: MessageRole.MODEL,
          content: "He actualizado el artefacto basándome en tus requerimientos. Revisa la vista previa."
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLiveSession = async () => {
    if (isLiveActive) {
      liveSessionInstance.stop();
      setIsLiveActive(false);
      setLiveContextStale(false);
      liveContextFingerprint.current = null;
    } else {
      try {
        await startLiveWithCurrentContext();
      } catch (e) {
        console.error("Failed to start live session", e);
        alert("Se requiere acceso al micrófono para el debate en vivo.");
      }
    }
  };

  const handleRefreshLiveContext = async () => {
    if (!isLiveActive) return;
    try {
      liveSessionInstance.stop();
      setIsLiveActive(false);
      setLiveContextStale(false);
      liveContextFingerprint.current = null;
      await startLiveWithCurrentContext();
    } catch (e) {
      console.error('Failed to refresh live context', e);
    }
  };

  const handleDownload = () => {
    if (!currentArtifact.code) return;
    const blob = new Blob([currentArtifact.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentArtifact.title.replace(/\s+/g, '-').toLowerCase() || 'hgi-app'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderMessage = (msg: Message) => {
    const isVoiceModel = msg.id.includes('_voice_model');
    const isUser = msg.role === MessageRole.USER;
    
    return (
      <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`max-w-[90%] rounded-sm p-4 text-sm leading-relaxed shadow-sm relative group ${
            isUser 
              ? 'bg-hgi-orange text-black font-medium' 
              : isVoiceModel 
                ? 'bg-[#1a2e35] text-cyan-50 border border-cyan-900/50' 
                : 'bg-hgi-card text-hgi-text border border-hgi-border'   
          }`}
        >
          {!isUser && (
             <div className={`text-[10px] font-mono uppercase mb-2 tracking-widest flex items-center space-x-2 ${
                isVoiceModel ? 'text-cyan-400' : 'text-hgi-orange'
             }`}>
                {isVoiceModel ? (
                  <>
                    <Activity className="w-3 h-3" />
                    <span>HGI Arquitecto</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-3 h-3" />
                    <span>HGI Constructor</span>
                  </>
                )}
             </div>
          )}

          {msg.content}
          
          {msg.image && (
            <img src={msg.image} alt="User Asset" className="mt-3 rounded-sm border border-hgi-border max-h-64 object-contain" />
          )}

          {!isUser && isVoiceModel && (
            <div className="mt-3 pt-3 border-t border-cyan-500/20 flex justify-end">
              <button
                onClick={() => setInput(msg.content)}
                title="Copiar la sugerencia del Arquitecto al campo de entrada"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-cyan-950/50 text-cyan-400 text-xs border border-cyan-900/50 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all font-mono uppercase tracking-wide"
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>Usar Prompt</span>
              </button>
            </div>
          )}
        </div>
        <span className="text-[10px] text-hgi-muted mt-1 px-1 font-mono uppercase tracking-wider opacity-50">
          {isUser ? 'TÚ' : isVoiceModel ? 'Planificación' : 'Construcción'}
        </span>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex h-screen bg-hgi-dark text-hgi-text font-sans overflow-hidden items-center justify-center">
        <div className="flex items-center space-x-2 text-hgi-orange animate-pulse px-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-mono uppercase">Cargando…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-hgi-dark text-hgi-text font-sans overflow-hidden items-center justify-center p-6">
        <div className="w-full max-w-md bg-hgi-card border border-hgi-border rounded-sm shadow-2xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-hgi-orange rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,79,0,0.4)]">
              <span className="font-bold text-black text-sm">HGI</span>
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight uppercase font-mono">Vibe Builder</div>
              <div className="text-xs text-hgi-muted font-mono uppercase tracking-wider">
                {authMode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
              </div>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-hgi-muted">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-4 py-3 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none placeholder-hgi-muted/50 font-mono text-sm transition-all duration-200"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-hgi-muted">Contraseña</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-hgi-dark border border-hgi-border rounded-sm px-4 py-3 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none placeholder-hgi-muted/50 font-mono text-sm transition-all duration-200"
                placeholder="••••••••"
                required
                autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 font-mono border border-red-500/30 bg-red-950/20 rounded-sm p-3">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full p-3 bg-hgi-orange text-black rounded-sm disabled:opacity-50 transition-all duration-200 font-bold hover:bg-hgi-orangeBright hover:shadow-[0_0_15px_rgba(255,79,0,0.5)] active:scale-95"
            >
              {authMode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-hgi-muted">
            <button
              onClick={() => {
                setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setAuthError(null);
              }}
              className="hover:text-hgi-orange transition-colors"
              type="button"
            >
              {authMode === 'signin' ? 'Crear cuenta' : 'Ya tengo cuenta'}
            </button>
            <button
              onClick={() => setShowHelpModal(true)}
              className="hover:text-hgi-orange transition-colors"
              type="button"
            >
              Ayuda
            </button>
          </div>

          {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-hgi-dark text-hgi-text font-sans overflow-hidden overflow-x-hidden">
      
      {/* Left Panel: Chat & Controls */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 flex-col border-r border-hgi-border bg-hgi-dark/95 backdrop-blur">
        
        {/* Header */}
        <div className="p-4 border-b border-hgi-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-hgi-orange rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,79,0,0.4)]">
                <span className="font-bold text-black text-sm">HGI</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight uppercase font-mono hidden sm:block">Vibe Builder</h1>
            
            <button onClick={() => setShowHelpModal(true)} className="p-1 text-hgi-muted hover:text-hgi-orange transition-colors"><HelpCircle className="w-4 h-4" /></button>
            <button onClick={() => setShowSettingsModal(true)} className="p-1 text-hgi-muted hover:text-hgi-orange transition-colors"><Settings className="w-4 h-4" /></button>
          </div>
          
          <div className="flex space-x-1 items-center bg-hgi-dark rounded-sm border border-hgi-border p-1">
             <button onClick={() => setShowStyleGuide(true)} className="p-1.5 text-hgi-muted hover:text-hgi-text hover:bg-hgi-card rounded-sm transition-all"><Palette className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-hgi-border"></div>
            <button onClick={() => setConfig(prev => ({...prev, useThinking: !prev.useThinking}))} className={`p-1.5 rounded-sm transition-all duration-200 border border-transparent ${config.useThinking ? 'bg-hgi-card border-hgi-orange text-hgi-orange shadow-[0_0_10px_rgba(255,79,0,0.2)]' : 'text-hgi-muted hover:text-hgi-orange hover:bg-hgi-card'}`}><Brain className="w-4 h-4" /></button>
            <button onClick={() => setConfig(prev => ({...prev, useSearch: !prev.useSearch}))} className={`p-1.5 rounded-sm transition-all duration-200 border border-transparent ${config.useSearch ? 'bg-hgi-card border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-hgi-muted hover:text-blue-400 hover:bg-hgi-card'}`}><Search className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Chat History */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map(renderMessage)}
          {isGenerating && (
            <div className="flex items-center space-x-2 text-hgi-orange animate-pulse px-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-mono uppercase">HGI Procesando...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-hgi-border bg-hgi-dark">
          {isLiveActive && (
             <div className="mb-3 flex items-center justify-between bg-cyan-950/20 border border-cyan-500/30 rounded-sm p-3">
               <div className="flex items-center space-x-3">
                 <div className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                 </div>
                 <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">HGI Arquitecto: Escuchando</span>
               </div>
               <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
             </div>
          )}
          {collabRole === 'guest' && (
              <div className="mb-3 flex items-center justify-between bg-purple-900/20 border border-purple-500/30 rounded-sm p-3">
                 <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Modo Invitado: Conectado a Host</span>
                 <Users className="w-4 h-4 text-purple-400" />
              </div>
          )}
          {selectedImage && (
            <div className="mb-3 flex items-start animate-in slide-in-from-bottom-2 fade-in">
                <div className="relative group">
                    <img src={selectedImage} alt="Input" className="h-16 w-16 object-cover rounded-sm border border-hgi-orange/50 shadow-md" />
                    <button onClick={() => { setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-1.5 -right-1.5 bg-black text-hgi-orange border border-hgi-orange rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-hgi-orange hover:text-black"><X className="w-3 h-3" /></button>
                </div>
            </div>
          )}
          <div className="flex space-x-2">
            <button onClick={toggleLiveSession} className={`p-3 rounded-sm transition-all duration-200 border ${isLiveActive ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-500' : 'bg-hgi-card border-hgi-border text-hgi-muted hover:text-cyan-400 hover:border-cyan-400/50'}`}><Mic className="w-5 h-5" /></button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-sm transition-all duration-200 border ${selectedImage ? 'bg-hgi-card border-hgi-orange text-hgi-orange' : 'bg-hgi-card border-hgi-border text-hgi-muted hover:text-hgi-text hover:border-hgi-text/50'}`}><Paperclip className="w-5 h-5" /></button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
              placeholder={collabRole === 'guest' ? "Enviar prompt al Host..." : (isLiveActive ? "Habla para planificar..." : "Describe la aplicación...")}
              rows={input.split('\n').length > 1 ? 3 : 1}
              className="flex-1 bg-hgi-card border border-hgi-border rounded-sm px-4 py-3 text-hgi-text focus:ring-1 focus:ring-hgi-orange focus:border-hgi-orange outline-none placeholder-hgi-muted/50 font-mono text-sm transition-all duration-200 resize-none overflow-hidden"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button onClick={() => handleSendMessage()} disabled={isGenerating || (!input.trim() && !selectedImage)} className="p-3 bg-hgi-orange text-black rounded-sm disabled:opacity-50 transition-all duration-200 font-bold hover:bg-hgi-orangeBright hover:shadow-[0_0_15px_rgba(255,79,0,0.5)] active:scale-95 h-fit self-end"><Send className="w-5 h-5" /></button>
          </div>
          <div className="mt-2 text-[10px] text-hgi-muted flex justify-between px-1 font-mono uppercase tracking-wider opacity-60"><span>Gemini 3 Pro + Audio Nativo</span><span>HGI v1.1</span></div>
        </div>
      </div>

      {/* Right Panel: Workspace */}
      <div className="flex-1 flex flex-col bg-hgi-dark/50 relative w-full">
        <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        
        {/* Toolbar */}
        <div className="h-12 border-b border-hgi-border bg-hgi-dark flex items-center justify-between gap-2 px-3 z-[50] min-w-0 overflow-visible">
          
          <div className="flex items-center space-x-4 min-w-0 flex-1">
             <div className="relative" ref={projectMenuRef}>
               <button
                 onClick={() => setShowProjectMenu((v) => !v)}
                 className="flex items-center space-x-2 px-2 py-1 rounded-sm transition-all duration-200 border bg-hgi-card border-hgi-border text-hgi-text hover:border-hgi-orange min-w-0"
               >
                 <Folder className="w-3.5 h-3.5 text-hgi-muted" />
                 <span className="text-xs font-mono uppercase tracking-wider truncate max-w-[140px]">
                   {dbProjects.find((p) => p.id === dbProjectId)?.title || currentArtifact.title || 'Proyecto'}
                 </span>
                 <ChevronDown className="w-3.5 h-3.5 text-hgi-muted" />
               </button>

               {showProjectMenu && (
                 <div className="absolute top-full left-0 mt-2 w-80 bg-hgi-card border border-hgi-border rounded-sm shadow-xl z-[9999] overflow-hidden">
                   <div className="p-2 border-b border-hgi-border text-[10px] text-hgi-muted font-mono uppercase">Proyecto</div>
                   <div className="max-h-64 overflow-y-auto">
                     {dbProjects.length === 0 && (
                       <div className="p-3 text-xs text-hgi-muted">Sin proyectos</div>
                     )}
                     {dbProjects.map((p) => (
                       <button
                         key={p.id}
                         onClick={() => handleSelectProject(p.id, p.title)}
                         className={`w-full text-left p-3 hover:bg-hgi-dark transition-colors border-b border-hgi-border/50 last:border-0 ${p.id === dbProjectId ? 'bg-hgi-dark' : ''}`}
                       >
                         <div className="text-xs font-bold text-hgi-text truncate">{p.title || 'Untitled App'}</div>
                         <div className="text-[10px] text-hgi-muted font-mono uppercase tracking-wider mt-1">
                           {p.updated_at ? new Date(p.updated_at).toLocaleString() : '—'}
                         </div>
                       </button>
                     ))}
                   </div>
                   <div className="p-2 border-t border-hgi-border">
                     <button
                       onClick={handleCreateNewProject}
                       disabled={creatingProject || collabRole === 'guest'}
                       className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                     >
                       <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Nuevo Proyecto</span>
                       <Sparkles className="w-4 h-4 text-hgi-muted" />
                     </button>
                   </div>
                 </div>
               )}
             </div>

             <div className="flex items-center space-x-2 group min-w-0">
                <Pencil className="w-3 h-3 text-hgi-muted group-hover:text-hgi-orange transition-colors" />
                <input type="text" value={currentArtifact.title} disabled={collabRole === 'guest' || isLearningMode} onFocus={() => { titleBeforeEdit.current = { ...currentArtifact }; }} onBlur={() => { if (titleBeforeEdit.current && titleBeforeEdit.current.title !== currentArtifact.title) { saveToUndo(titleBeforeEdit.current); titleBeforeEdit.current = null; }}} onChange={(e) => setCurrentArtifact(prev => ({ ...prev, title: e.target.value, id: prev.id === 'init' ? Date.now().toString() : prev.id }))} className="bg-transparent text-hgi-text font-bold text-sm outline-none border-b border-transparent focus:border-hgi-orange hover:border-hgi-border transition-all w-28 sm:w-40 md:w-56 placeholder-hgi-muted/30 disabled:opacity-70 disabled:cursor-not-allowed truncate min-w-0" placeholder="Nombre" />
             </div>
             
             <div className="h-4 w-px bg-hgi-border/50 hidden sm:block"></div>

             {/* View Mode */}
            <div className="flex bg-hgi-card p-1 rounded-sm border border-hgi-border">
              <button onClick={() => setViewMode(AppMode.PREVIEW)} className={`flex items-center space-x-2 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-200 ${viewMode === AppMode.PREVIEW ? 'bg-hgi-orange text-black shadow-lg shadow-hgi-orange/20' : 'text-hgi-muted hover:text-hgi-orange hover:bg-hgi-dark'}`}><Play className="w-3 h-3" /><span className="hidden lg:inline">Vista</span></button>
              {!isLearningMode && (
                <button onClick={() => setViewMode(AppMode.CODE)} className={`flex items-center space-x-2 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-200 ${viewMode === AppMode.CODE ? 'bg-hgi-orange text-black shadow-lg shadow-hgi-orange/20' : 'text-hgi-muted hover:text-hgi-orange hover:bg-hgi-dark'}`}><Code className="w-3 h-3" /><span className="hidden lg:inline">Código</span></button>
              )}
            </div>

            {/* Undo/Redo */}
            <div className={`hidden flex bg-hgi-card p-1 rounded-sm border border-hgi-border space-x-1 ${(collabRole === 'guest' || isLearningMode) ? 'opacity-50 pointer-events-none' : ''}`}>
              <button onClick={performUndo} disabled={undoStack.length === 0} className="p-1.5 text-hgi-muted hover:text-hgi-text hover:bg-hgi-dark rounded-sm disabled:opacity-30 transition-all"><Undo2 className="w-4 h-4" /></button>
              <div className="w-px h-full bg-hgi-border/50 mx-1"></div>
              <button onClick={performRedo} disabled={redoStack.length === 0} className="p-1.5 text-hgi-muted hover:text-hgi-text hover:bg-hgi-dark rounded-sm disabled:opacity-30 transition-all"><Redo2 className="w-4 h-4" /></button>
            </div>
            
            {!isLearningMode && (
              <button onClick={handleEthicsAudit} disabled={!currentArtifact.code || collabRole === 'guest'} className={`hidden p-2 rounded-sm transition-all duration-200 border border-transparent ${currentArtifact.code ? 'text-hgi-muted hover:text-green-400 hover:bg-hgi-card hover:border-green-400/30' : 'text-hgi-border cursor-not-allowed'} hidden 2xl:block`}><ShieldCheck className="w-4 h-4" /></button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 min-w-0">
             <button onClick={toggleLiveSession} className={`p-2 rounded-sm transition-all duration-200 border ${isLiveActive ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-500' : 'bg-hgi-card border-hgi-border text-hgi-muted hover:text-cyan-400 hover:border-cyan-400/50'}`}><Mic className="w-4 h-4" /></button>
             {isLiveActive && liveContextStale && (
               <button onClick={handleRefreshLiveContext} className="text-xs font-mono px-2 py-1 rounded-sm border transition-all flex items-center space-x-2 bg-cyan-950/20 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 hover:text-cyan-200">
                 <span>Refresh</span>
               </button>
             )}

             <div className="relative" ref={toolbarMenuRef}>
               <button onClick={() => setShowToolbarMenu((v) => !v)} className="p-2 rounded-sm transition-all duration-200 border bg-hgi-card border-hgi-border text-hgi-muted hover:text-hgi-text hover:border-hgi-orange">
                 <MoreHorizontal className="w-4 h-4" />
               </button>
               {showToolbarMenu && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-hgi-card border border-hgi-border rounded-sm shadow-xl z-[9999] overflow-hidden">
                  <div className="p-2 border-b border-hgi-border text-[10px] text-hgi-muted font-mono uppercase">Acciones</div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowToolbarMenu(false);
                        startCollaboration();
                      }}
                      disabled={collabRole === 'guest'}
                      className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                    >
                      <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Share</span>
                      <Share2 className="w-4 h-4 text-hgi-muted" />
                    </button>

                    <div className="px-2 py-1 text-[10px] text-hgi-muted font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>Guardado</span>
                      <span className="text-hgi-text/80">{lastSavedTime || '—'}</span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-hgi-border space-y-1">
                      <button
                        onClick={() => {
                          setShowToolbarMenu(false);
                          performUndo();
                        }}
                        disabled={undoStack.length === 0 || collabRole === 'guest' || isLearningMode}
                        className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                      >
                        <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Undo</span>
                        <Undo2 className="w-4 h-4 text-hgi-muted" />
                      </button>
                      <button
                        onClick={() => {
                          setShowToolbarMenu(false);
                          performRedo();
                        }}
                        disabled={redoStack.length === 0 || collabRole === 'guest' || isLearningMode}
                        className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                      >
                        <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Redo</span>
                        <Redo2 className="w-4 h-4 text-hgi-muted" />
                      </button>
                    </div>

                    {history.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-hgi-border">
                        <div className="px-2 pb-2 text-[10px] text-hgi-muted font-mono uppercase tracking-wider">Versiones</div>
                        <div className="max-h-56 overflow-y-auto">
                          {[...history]
                            .slice(-8)
                            .reverse()
                            .map((histItem, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setShowToolbarMenu(false);
                                  handleRestoreVersion(histItem);
                                }}
                                className="w-full text-left p-2 rounded-sm hover:bg-hgi-dark transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-mono text-hgi-orange font-bold">v{histItem.version}</span>
                                  <span className="text-[10px] text-hgi-muted flex items-center space-x-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{histItem.timestamp ? new Date(histItem.timestamp).toLocaleTimeString() : ''}</span>
                                  </span>
                                </div>
                                <div className="text-[10px] text-hgi-muted truncate">{histItem.title}</div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                     {!isLearningMode && (
                       <button
                         onClick={() => {
                           setShowToolbarMenu(false);
                           setShowSnippetLibrary(!showSnippetLibrary);
                         }}
                         className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors"
                       >
                         <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Snippets</span>
                         <Layout className="w-4 h-4 text-hgi-muted" />
                       </button>
                     )}

                     {!isLearningMode && (
                       <button
                         onClick={() => {
                           setShowToolbarMenu(false);
                           handleEthicsAudit();
                         }}
                         disabled={!currentArtifact.code || collabRole === 'guest'}
                         className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                       >
                         <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Auditoría</span>
                         <ShieldCheck className="w-4 h-4 text-hgi-muted" />
                       </button>
                     )}

                     <button
                       onClick={() => {
                         setShowToolbarMenu(false);
                         if (history.length > 0) setShowHistoryDropdown(!showHistoryDropdown);
                       }}
                       className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors"
                     >
                       <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Historial</span>
                       <History className="w-4 h-4 text-hgi-muted" />
                     </button>

                     {hasSavedState && (
                       <button
                         onClick={() => {
                           setShowToolbarMenu(false);
                           handleRestore();
                         }}
                         disabled={collabRole === 'guest'}
                         className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                       >
                         <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Restaurar</span>
                         <RotateCcw className="w-4 h-4 text-hgi-muted" />
                       </button>
                     )}

                     {!isLearningMode && (
                       <div className="pt-2 mt-2 border-t border-hgi-border space-y-1">
                         <button
                           onClick={() => {
                             setShowToolbarMenu(false);
                             setShowGitModal(true);
                           }}
                           disabled={!currentArtifact.code}
                           className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                         >
                           <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Exportar Git</span>
                           <Github className="w-4 h-4 text-hgi-muted" />
                         </button>
                         <button
                           onClick={() => {
                             setShowToolbarMenu(false);
                             setShowPublishModal(true);
                           }}
                           disabled={!currentArtifact.code}
                           className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors disabled:opacity-50"
                         >
                           <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Publicar</span>
                           <Rocket className="w-4 h-4 text-hgi-muted" />
                         </button>
                       </div>
                     )}

                     <button
                       onClick={() => {
                         setShowToolbarMenu(false);
                         handleDownload();
                       }}
                       className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-hgi-dark transition-colors"
                     >
                       <span className="text-xs font-mono uppercase tracking-wider text-hgi-text">Descargar</span>
                       <Download className="w-4 h-4 text-hgi-muted" />
                     </button>

                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={handleSignOut} className="text-xs font-mono px-2 py-1 rounded-sm border transition-all flex items-center space-x-2 bg-hgi-card text-hgi-text border-hgi-border hover:border-hgi-orange hover:text-hgi-orange max-w-[220px] min-w-0">
              <span className="truncate min-w-0 hidden xl:inline">{session.user.email}</span>
              <span className="text-hgi-muted hidden xl:inline">/</span>
              <span>Salir</span>
            </button>

            {/* Live Share */}
            <button onClick={startCollaboration} disabled={collabRole === 'guest'} className="hidden">
              {isCollaborating ? <><Users className="w-3 h-3 animate-pulse" /><span>Live ({peerCount})</span></> : <><Share2 className="w-3 h-3" /><span className="hidden sm:inline">Share</span></>}
            </button>

            {lastSavedTime && <span className="hidden text-xs text-hgi-muted font-mono hidden xl:block">Guardado: {lastSavedTime}</span>}
            {hasSavedState && <button onClick={handleRestore} disabled={collabRole === 'guest'} className="hidden"><RotateCcw className="w-3 h-3" /></button>}

            {/* History Dropdown */}
            <div className="relative hidden">
              <button onClick={() => history.length > 0 && setShowHistoryDropdown(!showHistoryDropdown)} className={`text-xs font-mono px-2 py-1 rounded-sm border transition-all flex items-center space-x-2 ${history.length > 0 ? 'bg-hgi-card text-hgi-text border-hgi-border hover:border-hgi-orange cursor-pointer' : 'bg-hgi-card/50 text-hgi-muted border-hgi-border cursor-default'}`}><History className="w-3 h-3" /><span>v{currentArtifact.version}</span></button>
              {showHistoryDropdown && history.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-hgi-card border border-hgi-border rounded-sm shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-hgi-border text-[10px] text-hgi-muted font-mono uppercase">Versiones Anteriores</div>
                  <div className="max-h-60 overflow-y-auto">
                    {[...history].reverse().map((histItem, idx) => (
                      <button key={idx} onClick={() => handleRestoreVersion(histItem)} className="w-full text-left p-3 hover:bg-hgi-dark transition-colors border-b border-hgi-border/50 last:border-0 group">
                        <div className="flex items-center justify-between mb-1"><span className="font-bold text-xs text-hgi-orange font-mono">v{histItem.version}</span><span className="text-[10px] text-hgi-muted flex items-center space-x-1"><Clock className="w-2.5 h-2.5" /><span>{histItem.timestamp ? new Date(histItem.timestamp).toLocaleTimeString() : ''}</span></span></div>
                        <div className="text-xs text-hgi-muted truncate group-hover:text-hgi-text">{histItem.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isLearningMode && (
              <button onClick={() => setShowSnippetLibrary(!showSnippetLibrary)} className="hidden"><Layout className="w-3 h-3" /></button>
            )}

            {/* Git & Publish Actions */}
            {!isLearningMode && (
              <div className="hidden">
                <button onClick={() => setShowGitModal(true)} disabled={!currentArtifact.code} className={`p-1.5 rounded-sm transition-all duration-200 ${currentArtifact.code ? 'text-hgi-text hover:bg-hgi-dark hover:text-hgi-orange' : 'text-hgi-muted opacity-50 cursor-not-allowed'}`} title="Exportar a Git"><Github className="w-4 h-4" /></button>
                <div className="w-px h-full bg-hgi-border/50"></div>
                <button onClick={() => setShowPublishModal(true)} disabled={!currentArtifact.code} className={`p-1.5 rounded-sm transition-all duration-200 ${currentArtifact.code ? 'text-hgi-text hover:bg-hgi-dark hover:text-hgi-orange' : 'text-hgi-muted opacity-50 cursor-not-allowed'}`} title="Publicar App"><Rocket className="w-4 h-4" /></button>
              </div>
            )}

            <button onClick={handleDownload} className="hidden"><Download className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative z-0 flex">
          {isMobile && (
            <div className="flex-1 h-full p-4">
              {mobileView === 'gallery' ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-hgi-muted">Proyectos</div>
                    {dbLoading && (
                      <div className="flex items-center space-x-2 text-hgi-orange animate-pulse px-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px] font-mono uppercase">Cargando…</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {dbProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={async () => {
                          if (!session) return;
                          setMobileSelectedProjectId(p.id);
                          await loadProjectIntoState(session.user.id, p.id);
                          setMobileView('preview');
                        }}
                        className={`w-full text-left p-3 rounded-sm border transition-all ${mobileSelectedProjectId === p.id ? 'bg-hgi-card border-hgi-orange' : 'bg-hgi-dark border-hgi-border hover:border-hgi-orange/50'}`}
                      >
                        <div className="text-sm font-bold text-hgi-text truncate">{p.title || 'Untitled App'}</div>
                        <div className="text-[10px] text-hgi-muted font-mono uppercase tracking-wider mt-1">
                          {p.updated_at ? new Date(p.updated_at).toLocaleString() : '—'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setMobileView('gallery')}
                      className="text-xs font-mono uppercase tracking-wider text-hgi-muted hover:text-hgi-orange transition-colors"
                    >
                      ← Proyectos
                    </button>
                    {dbLoading && (
                      <div className="flex items-center space-x-2 text-hgi-orange animate-pulse px-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px] font-mono uppercase">Cargando…</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AppPreview code={currentArtifact.code} />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isMobile &&
            (viewMode === AppMode.PREVIEW ? (
              <div className="flex-1 h-full p-8 bg-transparent">
                <AppPreview code={currentArtifact.code} />
              </div>
            ) : (
              <div className="flex-1 h-full">
                {isLearningMode ? (
                  <AppPreview code={currentArtifact.code} />
                ) : (
                  <CodeEditor code={currentArtifact.code} />
                )}
              </div>
            ))}

          {/* Snippet Library Sidebar */}
          {showSnippetLibrary && (
            <SnippetLibrary 
              onInsert={handleInsertSnippet} 
              onClose={() => setShowSnippetLibrary(false)} 
            />
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showStyleGuide && <StyleGuide onClose={() => setShowStyleGuide(false)} />}
      {showGitModal && <GitExportModal code={currentArtifact.code} onClose={() => setShowGitModal(false)} />}
      {showPublishModal && <PublishModal code={currentArtifact.code} projectTitle={currentArtifact.title} onClose={() => setShowPublishModal(false)} />}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      {showSettingsModal && <SettingsModal config={config} setConfig={setConfig} onClose={() => setShowSettingsModal(false)} />}
      
      {/* Share Modal */}
      {showShareModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-hgi-card border border-hgi-border rounded-sm shadow-2xl w-full max-w-md p-6 relative">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold font-mono uppercase text-hgi-text">Live Share Session</h3>
                      <button onClick={() => setShowShareModal(false)}><X className="w-4 h-4 text-hgi-muted hover:text-hgi-orange" /></button>
                  </div>
                  <div className="space-y-4">
                      <p className="text-xs text-hgi-muted">Comparte este enlace para colaborar en tiempo real. Los invitados verán tu código y podrán enviar prompts.</p>
                      <div className="flex items-center space-x-2 bg-hgi-dark p-2 rounded-sm border border-hgi-border">
                          <LinkIcon className="w-4 h-4 text-hgi-orange" />
                          <input readOnly value={`${window.location.origin}${window.location.pathname}?session=${peerId}`} className="bg-transparent text-xs font-mono text-hgi-text flex-1 outline-none"/>
                          <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?session=${peerId}`)} className="text-xs bg-hgi-card border border-hgi-border px-2 py-1 rounded-sm hover:text-hgi-orange">Copiar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;