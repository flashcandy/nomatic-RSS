import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Key, 
  Cpu, 
  Check, 
  ExternalLink, 
  ShieldCheck,
  Zap,
  Info,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import { OpenRouterConfig } from '../types';

interface OpenRouterSettingsModalProps {
  config: OpenRouterConfig;
  onSaveConfig: (cfg: OpenRouterConfig) => void;
  onClose: () => void;
}

const POPULAR_MODELS = [
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Google Gemini 2.0 Flash (Free)', 
    desc: 'Ultra-fast, high-capacity multimodal intelligence & structured JSON', 
    badge: 'RECOMMENDED FREE', 
    isFree: true 
  },
  { 
    id: 'meta-llama/llama-3.3-70b-instruct:free', 
    name: 'Llama 3.3 70B Instruct (Free)', 
    desc: 'High-performance 70B flagship model for deep technical synthesis', 
    badge: '100% FREE', 
    isFree: true 
  },
  { 
    id: 'deepseek/deepseek-r1:free', 
    name: 'DeepSeek R1 Reasoning (Free)', 
    desc: 'Step-by-step logical reasoning and deep conceptual breakdown', 
    badge: 'REASONING FREE', 
    isFree: true 
  },
  { 
    id: 'mistralai/mistral-7b-instruct:free', 
    name: 'Mistral 7B Instruct (Free)', 
    desc: 'Compact European multilingual comprehension & concise summaries', 
    badge: '100% FREE', 
    isFree: true 
  },
  { 
    id: 'openai/gpt-4o-mini', 
    name: 'OpenAI GPT-4o Mini', 
    desc: 'Sub-second speed, crisp structured insights and podcasts', 
    badge: 'PAID / FAST', 
    isFree: false 
  },
  { 
    id: 'anthropic/claude-3.5-haiku', 
    name: 'Anthropic Claude 3.5 Haiku', 
    desc: 'Nuanced writing, podcast scripts, and executive summaries', 
    badge: 'PAID', 
    isFree: false 
  },
  { 
    id: 'google/gemini-2.0-flash-001', 
    name: 'Google Gemini 2.0 Flash (Pro)', 
    desc: 'Direct production tier with zero free rate-limit constraints', 
    badge: 'PRODUCTION', 
    isFree: false 
  },
];

export const OpenRouterSettingsModal: React.FC<OpenRouterSettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [model, setModel] = useState(config.model || 'google/gemini-2.0-flash-exp:free');
  const [customModel, setCustomModel] = useState(
    POPULAR_MODELS.some((m) => m.id === config.model) ? '' : config.model || ''
  );
  const [isCustomMode, setIsCustomMode] = useState(
    !!config.model && !POPULAR_MODELS.some((m) => m.id === config.model)
  );
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Testing connection state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{ message?: string; latencyMs?: number; error?: string } | null>(null);

  const selectedModelId = isCustomMode ? (customModel.trim() || model) : model;

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus('error');
      setTestResult({ error: 'Please enter your OpenRouter API Key before testing.' });
      return;
    }

    setTestStatus('testing');
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: selectedModelId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus('success');
        setTestResult({
          message: data.message || 'Connected successfully!',
          latencyMs: data.latencyMs,
        });
      } else {
        setTestStatus('error');
        setTestResult({
          error: data.error || `HTTP ${res.status}: Verification failed.`,
        });
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestResult({
        error: err.message || 'Failed to reach server backend test endpoint.',
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      apiKey: apiKey.trim(),
      model: selectedModelId,
    });
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">AI Intelligence Hub</h2>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  OpenRouter
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Custom models, smart summaries, podcasts & translations</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Guaranteed Fallback Info Box */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-indigo-950/40 p-3.5 border border-indigo-500/30 text-xs text-indigo-200">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Zero Configuration Guarantee:</span>
            <p className="mt-0.5 text-slate-300">
              nomatic RSS works fully offline with built-in instant heuristics even without an API key. Adding an OpenRouter key connects you to 300+ models on OpenRouter with free tiers.
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-purple-400" />
                <span>OpenRouter API Key</span>
              </label>
              <div className="flex items-center gap-3">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKey('');
                      setTestStatus('idle');
                      setTestResult(null);
                    }}
                    className="text-[11px] font-semibold text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:underline"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus('idle');
                  setTestResult(null);
                }}
                placeholder="sk-or-v1-..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-slate-400 hover:text-white"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Test Connection Button & Result Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                    <span>Testing OpenRouter Connection...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-purple-400" />
                    <span>Test API Key & Model</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Status Feedback */}
            {testStatus === 'success' && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-950/40 p-3 border border-emerald-500/40 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-200">Connection Verified!</span>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5">
                    {testResult?.message} • Latency: <strong className="text-white">{testResult?.latencyMs}ms</strong>
                  </p>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-950/40 p-3 border border-rose-500/40 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-200">Verification Failed</span>
                  <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                    {testResult?.error}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: Make sure your key was copied from <strong>openrouter.ai/keys</strong> and has active permissions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Model Selector Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <span>Selected Model</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-[11px] font-semibold text-indigo-400 hover:underline"
              >
                {isCustomMode ? '← Pick Curated Models' : '+ Custom Model ID'}
              </button>
            </div>

            {isCustomMode ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. qwen/qwen-2.5-coder-32b-instruct or openai/gpt-4o"
                  className="w-full rounded-2xl border border-indigo-500/50 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  You can specify any model ID listed in the OpenRouter model registry.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {POPULAR_MODELS.map((m) => {
                  const isSelected = !isCustomMode && model === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setIsCustomMode(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">{m.name}</span>
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${
                            m.isFree
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          }`}>
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{m.desc}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-purple-600/30 hover:opacity-95 transition active:scale-98"
          >
            {saved ? (
              <span className="flex items-center gap-1.5 text-white">
                <Check className="h-4 w-4" />
                Settings Saved!
              </span>
            ) : (
              <span>Save AI Preferences</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
