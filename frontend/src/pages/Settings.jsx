import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cpu, Key, Sliders, Shield, Bell, CheckCircle2, Save } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [provider, setProvider] = useState('demo');
  const [temperature, setTemperature] = useState(0.1);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [defaultSla, setDefaultSla] = useState(24);
  const [approvalThreshold, setApprovalThreshold] = useState(50000);
  const [autoRouting, setAutoRouting] = useState(true);

  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  
  const [keyStatus, setKeyStatus] = useState({ openai_key_set: false, gemini_key_set: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const cfg = await api.getSettings();
      setProvider(cfg.provider || 'demo');
      setTemperature(cfg.temperature || 0.1);
      setConfidenceThreshold(cfg.confidence_threshold || 80);
      setDefaultSla(cfg.default_sla_hours || 24);
      setApprovalThreshold(cfg.approval_threshold_amount || 50000);
      setAutoRouting(cfg.auto_routing_enabled ?? true);
      setKeyStatus({
        openai_key_set: cfg.openai_key_set,
        gemini_key_set: cfg.gemini_key_set
      });
    } catch (err) {
      console.error("Settings load error:", err);
    }
  };

  const handleSave = async () => {
    try {
      await api.updateSettings({
        provider: provider,
        temperature: parseFloat(temperature),
        confidence_threshold: parseInt(confidenceThreshold),
        default_sla_hours: parseInt(defaultSla),
        approval_threshold_amount: parseInt(approvalThreshold),
        auto_routing_enabled: autoRouting,
        openai_api_key: openaiKey || undefined,
        gemini_api_key: geminiKey || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadSettings();
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
          <p className="text-xs text-[#A1A1AA]">Configure AI provider abstractions, model parameters, and workflow automation policies.</p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#00C853] hover:bg-[#22C55E] text-black font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,200,83,0.3)]"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-[#00C853]/15 border border-[#00C853]/40 rounded-lg text-xs text-[#00C853] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform configurations saved and activated.</span>
        </div>
      )}

      {/* AI Configuration Card */}
      <div className="bg-[#0D0D0D] border border-[#242424] p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-4">
          <Cpu className="w-5 h-5 text-[#00C853]" />
          <h2 className="font-bold text-white text-sm">AI Engine Configuration</h2>
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#A1A1AA]">AI Intelligence Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'demo', name: 'Demo AI Mode (Default)', desc: 'Zero API keys required. Uses smart local extraction logic.' },
              { id: 'openai', name: 'OpenAI GPT-4o', desc: 'Uses OpenAI API key for live inference.' },
              { id: 'gemini', name: 'Google Gemini 2.5', desc: 'Uses Gemini API key for structured document extraction.' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  provider === p.id
                    ? 'bg-[#00C853]/15 border-[#00C853] text-white shadow-[0_0_15px_rgba(0,200,83,0.1)]'
                    : 'bg-[#121212] border-[#242424] text-[#A1A1AA] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">{p.name}</span>
                  {provider === p.id && <CheckCircle2 className="w-4 h-4 text-[#00C853]" />}
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* API Keys Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
              OpenAI API Key {keyStatus.openai_key_set && <span className="text-[#00C853] text-[10px] ml-1">(Active)</span>}
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={keyStatus.openai_key_set ? "••••••••••••••••" : "sk-..."}
              className="w-full bg-[#121212] border border-[#242424] text-white text-xs rounded-lg p-2.5 focus:border-[#00C853] outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
              Gemini API Key {keyStatus.gemini_key_set && <span className="text-[#00C853] text-[10px] ml-1">(Active)</span>}
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={keyStatus.gemini_key_set ? "••••••••••••••••" : "AIzaSy..."}
              className="w-full bg-[#121212] border border-[#242424] text-white text-xs rounded-lg p-2.5 focus:border-[#00C853] outline-none font-mono"
            />
          </div>
        </div>

        {/* Temperature & Confidence Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#242424]">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#A1A1AA]">Model Temperature</span>
              <span className="text-white font-mono">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full accent-[#00C853]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#A1A1AA]">Default Confidence Threshold</span>
              <span className="text-[#00C853] font-mono">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(e.target.value)}
              className="w-full accent-[#00C853]"
            />
          </div>
        </div>
      </div>

      {/* Workflow Configuration Card */}
      <div className="bg-[#0D0D0D] border border-[#242424] p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-4">
          <Sliders className="w-5 h-5 text-[#00C853]" />
          <h2 className="font-bold text-white text-sm">Workflow & SLA Policy Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[#A1A1AA] block mb-1 font-semibold">Default SLA Window (Hours)</label>
            <input
              type="number"
              value={defaultSla}
              onChange={(e) => setDefaultSla(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white rounded-lg p-2.5 focus:border-[#00C853] outline-none"
            />
          </div>

          <div>
            <label className="text-[#A1A1AA] block mb-1 font-semibold">Manager Approval Threshold</label>
            <input
              type="number"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white rounded-lg p-2.5 focus:border-[#00C853] outline-none"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-3 bg-[#121212] border border-[#242424] p-2.5 rounded-lg cursor-pointer text-white font-semibold">
              <input
                type="checkbox"
                checked={autoRouting}
                onChange={(e) => setAutoRouting(e.target.checked)}
                className="rounded border-[#242424] bg-[#050505] text-[#00C853] focus:ring-0"
              />
              <span>Enable Auto AI Routing</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
