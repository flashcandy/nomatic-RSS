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
  Trash2,
  Layers,
  Globe
} from 'lucide-react';
import { OpenRouterConfig, AIProvider } from '../types';
import { getApiUrl } from '../utils/apiUrl';

interface OpenRouterSettingsModalProps {
  config: OpenRouterConfig;
  onSaveConfig: (cfg: OpenRouterConfig) => void;
  onClose: () => void;
}

const GOOGLE_MODELS = [
  { 
    id: 'gemini-2.5-flash', 
    name: 'Google Gemini 2.5 Flash', 
    desc: 'Ultra-fast multimodal intelligence with generous 100% free tier quota', 
    badge: '100% FREE TIER', 
    isFree: true 
  },
  { 
    id: 'gemini-3.1-flash-lite', 
    name: 'Google Gemini 3.1 Flash-Lite', 
    desc: 'Instant throughput and ultra-low latency for speed-reading summaries', 
    badge: '100% FREE TIER', 
    isFree: true 
  },
  { 
    id: 'gemini-3.1-pro-preview', 
    name: 'Google Gemini 3.1 Pro (Billing Required)', 
    desc: 'Deep reasoning and complex synthesis (Requires paid Google AI Studio billing)', 
    badge: 'PAID BILLING PLAN', 
    isFree: false 
  },
];

const OPENROUTER_MODELS = [
  { 
    id: 'meta-llama/llama-3.2-3b-instruct', 
    name: 'Llama 3.2 3B Instruct', 
    desc: 'Ultra-fast, lightweight Meta open weights model (recommended slug)', 
    badge: 'FAST & EFFICIENT', 
    isFree: true 
  },
  { 
    id: 'meta-llama/llama-3.3-70b-instruct', 
    name: 'Llama 3.3 70B Instruct', 
    desc: 'High-performance 70B flagship model for deep technical synthesis', 
    badge: 'FLAGSHIP 70B', 
    isFree: true 
  },
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Google Gemini 2.0 Flash (Free)', 
    desc: 'Fast multimodal intelligence on OpenRouter free tier', 
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
];

export const OpenRouterSettingsModal: React.FC<OpenRouterSettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose,
}) => {
  // Provider detection initialization
  const initialProvider: AIProvider = config.provider || (
    config.apiKey?.startsWith('AIza') || config.googleApiKey ? 'google' : 'openrouter'
  );

  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [googleKey, setGoogleKey] = useState(config.googleApiKey || (config.apiKey?.startsWith('AIza') ? config.apiKey : ''));
  const [openRouterKey, setOpenRouterKey] = useState(config.apiKey?.startsWith('sk-') ? config.apiKey : '');

  const [googleModel, setGoogleModel] = useState(
    GOOGLE_MODELS.some((m) => m.id === config.model) ? config.model : 'gemini-2.5-flash'
  );
  const [openRouterModel, setOpenRouterModel] = useState(
    OPENROUTER_MODELS.some((m) => m.id === config.model) ? config.model : 'google/gemini-2.0-flash-exp:free'
  );

  const [customModel, setCustomModel] = useState(
    ![...GOOGLE_MODELS, ...OPENROUTER_MODELS].some((m) => m.id === config.model) ? config.model || '' : ''
  );
  const [isCustomMode, setIsCustomMode] = useState(
    !!config.model && ![...GOOGLE_MODELS, ...OPENROUTER_MODELS].some((m) => m.id === config.model)
  );

  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Testing connection state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{ 
    message?: string; 
    latencyMs?: number; 
    modelUsed?: string; 
    provider?: string; 
    error?: string 
  } | null>(null);

  const activeKey = provider === 'google' ? googleKey : openRouterKey;
  const activeModel = provider === 'google' ? googleModel : openRouterModel;
  const selectedModelId = isCustomMode ? (customModel.trim() || activeModel) : activeModel;

  const handleKeyChange = (val: string) => {
    const trimmed = val.trim();
    if (provider === 'google') {
      setGoogleKey(val);
      // Auto-detect if user pastes an OpenRouter key into Google tab
      if (trimmed.startsWith('sk-or-') || trimmed.startsWith('sk-')) {
        setProvider('openrouter');
        setOpenRouterKey(val);
      }
    } else {
      setOpenRouterKey(val);
      // Auto-detect if user pastes a Google key into OpenRouter tab
      if (trimmed.startsWith('AIza')) {
        setProvider('google');
        setGoogleKey(val);
      }
    }
    setTestStatus('idle');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!activeKey.trim()) {
      setTestStatus('error');
      setTestResult({
        error: provider === 'google'
          ? 'Please enter your Google Gemini API Key (starts with AIza...) before testing.'
          : 'Please enter your OpenRouter API Key (starts with sk-or-v1-...) before testing.'
      });
      return;
    }

    setTestStatus('testing');
    setTestResult(null);

    try {
      const res = await fetch(getApiUrl('/api/ai/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: activeKey.trim(),
          provider: provider,
          model: selectedModelId,
        }),
      });

      const rawText = await res.text();
      let data: any = null;

      if (rawText.trim().startsWith('{')) {
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          // fallback
        }
      }

      if (res.ok && data && data.success) {
        setTestStatus('success');
        setTestResult({
          message: data.message || 'Connected successfully!',
          latencyMs: data.latencyMs,
          modelUsed: data.modelUsed || selectedModelId,
          provider: data.provider || provider,
        });
      } else {
        setTestStatus('error');
        setTestResult({
          error: data?.error || (rawText.length > 0 && !rawText.startsWith('<') ? rawText : `HTTP ${res.status}: Verification failed.`),
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
      provider: provider,
      apiKey: activeKey.trim(),
      googleApiKey: googleKey.trim() || undefined,
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">AI Intelligence Hub</h2>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  {provider === 'google' ? 'Google Gemini' : 'OpenRouter'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Custom AI models, executive summaries, podcasts & translations</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-950/60 p-1.5 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setProvider('google');
              setTestStatus('idle');
              setTestResult(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
              provider === 'google'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Google Gemini API</span>
            <span className="rounded bg-white/20 px-1.5 py-0.2 text-[9px] uppercase tracking-wider font-semibold">Recommended</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProvider('openrouter');
              setTestStatus('idle');
              setTestResult(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
              provider === 'openrouter'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>OpenRouter</span>
          </button>
        </div>

        {/* Guaranteed Offline Heuristics Info Box */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-indigo-950/30 p-3.5 border border-indigo-500/30 text-xs text-indigo-200">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Universal Reliability:</span>
            <p className="mt-0.5 text-slate-300">
              nomatic RSS works fully offline with instant heuristics even without an API key. Adding your {provider === 'google' ? 'Google Gemini' : 'OpenRouter'} key unlocks direct cloud LLM intelligence.
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className={`h-3.5 w-3.5 ${provider === 'google' ? 'text-indigo-400' : 'text-purple-400'}`} />
                <span>{provider === 'google' ? 'Google Gemini API Key' : 'OpenRouter API Key'}</span>
              </label>
              <div className="flex items-center gap-3">
                {activeKey && (
                  <button
                    type="button"
                    onClick={() => {
                      if (provider === 'google') setGoogleKey('');
                      else setOpenRouterKey('');
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
                  href={provider === 'google' ? 'https://aistudio.google.com/app/apikey' : 'https://openrouter.ai/keys'}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 text-[11px] font-semibold ${provider === 'google' ? 'text-indigo-400' : 'text-purple-400'} hover:underline`}
                >
                  <span>{provider === 'google' ? 'Get Google Key' : 'Get OpenRouter Key'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={activeKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={provider === 'google' ? 'AIzaSy...' : 'sk-or-v1-...'}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
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
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold active:scale-95 transition disabled:opacity-50 ${
                  provider === 'google'
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                    : 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                }`}
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span>Verifying {provider === 'google' ? 'Google Gemini' : 'OpenRouter'}...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
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
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-200">Connection Verified!</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono text-emerald-300">
                      {testResult?.provider?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5">
                    {testResult?.message} • Model: <strong className="text-white">{testResult?.modelUsed}</strong> • Latency: <strong className="text-white">{testResult?.latencyMs}ms</strong>
                  </p>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-950/40 p-3 border border-rose-500/40 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-rose-200">Verification Notice</span>
                  <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                    {testResult?.error}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {provider === 'google' 
                      ? 'Tip: Generate a free key at aistudio.google.com/app/apikey (starts with AIza...)' 
                      : 'Tip: Verify your key at openrouter.ai/keys (starts with sk-or-...)'}
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
                <span>Selected {provider === 'google' ? 'Google' : 'OpenRouter'} Model</span>
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
                  placeholder={provider === 'google' ? 'e.g. gemini-2.5-flash or gemini-3.1-pro-preview' : 'e.g. qwen/qwen-2.5-coder-32b-instruct'}
                  className="w-full rounded-2xl border border-indigo-500/50 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {(provider === 'google' ? GOOGLE_MODELS : OPENROUTER_MODELS).map((m) => {
                  const isSelected = !isCustomMode && (provider === 'google' ? googleModel === m.id : openRouterModel === m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        if (provider === 'google') setGoogleModel(m.id);
                        else setOpenRouterModel(m.id);
                        setIsCustomMode(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? provider === 'google'
                            ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                            : 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
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
                      {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:opacity-95 transition active:scale-98"
          >
            {saved ? (
              <span className="flex items-center gap-1.5 text-white">
                <Check className="h-4 w-4" />
                Preferences Saved!
              </span>
            ) : (
              <span>Save AI Engine Preferences</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
