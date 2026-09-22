import React, { useState, useEffect } from 'react';
import { 
  GitMerge, 
  Plus, 
  CheckCircle, 
  Clock, 
  Zap, 
  ArrowRight, 
  Settings, 
  ShieldCheck, 
  Sliders,
  Trash2,
  SlidersHorizontal,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function Workflows() {
  const [templates, setTemplates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'builder'
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', text: '' }
  
  // Custom Workflow Builder state
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [builderSteps, setBuilderSteps] = useState([
    { step_name: 'Document Ingestion', node_type: 'Start', role: 'System' },
    { step_name: 'AI Extraction & Risk Scan', node_type: 'AI Analysis', role: 'AI Engine' },
    { step_name: 'Finance Manager Signoff', node_type: 'Approval', role: 'Finance Manager' },
    { step_name: 'ERP System Sync', node_type: 'End', role: 'System' }
  ]);

  // Condition Engine state
  const [rules, setRules] = useState([
    { field: 'Invoice Amount', operator: '>', value: '₹50,000', action: 'Require Manager Approval' },
    { field: 'Priority Level', operator: '=', value: 'HIGH', action: 'Escalate SLA to 24 Hours' },
    { field: 'Risk Score', operator: '>', value: '60', action: 'Trigger Compliance Audit' }
  ]);
  const [newRuleField, setNewRuleField] = useState('Invoice Amount');
  const [newRuleOp, setNewRuleOp] = useState('>');
  const [newRuleVal, setNewRuleVal] = useState('₹1,00,000');
  const [newRuleAct, setNewRuleAct] = useState('Require Executive VP Signoff');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const [tmplData, wfData] = await Promise.all([
        api.getWorkflowTemplates(),
        api.getWorkflows()
      ]);
      setTemplates(tmplData);
      setWorkflows(wfData);
    } catch (err) {
      console.error("Workflows load error:", err);
    }
  };

  const handleAddStep = () => {
    setBuilderSteps([
      ...builderSteps,
      { step_name: 'Validation Step', node_type: 'Approval', role: 'Manager' }
    ]);
  };

  const handleRemoveStep = (index) => {
    setBuilderSteps(builderSteps.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (index, key, val) => {
    const updated = [...builderSteps];
    updated[index][key] = val;
    setBuilderSteps(updated);
  };

  const handleAddRule = () => {
    if (!newRuleVal) return;
    setRules([...rules, { field: newRuleField, operator: newRuleOp, value: newRuleVal, action: newRuleAct }]);
    setNewRuleVal('');
  };

  const handleSaveWorkflow = async () => {
    if (!newWfName.trim()) {
      setSaveStatus({ type: 'error', text: 'Please provide a workflow name.' });
      return;
    }
    try {
      await api.createWorkflow({
        name: newWfName,
        description: newWfDesc,
        steps: builderSteps
      });
      setSaveStatus({ type: 'success', text: 'Custom workflow saved successfully!' });
      setNewWfName('');
      setNewWfDesc('');
      setTimeout(() => {
        setSaveStatus(null);
        setActiveTab('overview');
      }, 1500);
      loadWorkflows();
    } catch (err) {
      setSaveStatus({ type: 'error', text: err.message || 'Failed to save workflow.' });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC] dark:bg-[#050505] min-h-screen text-[#0F172A] dark:text-[#F5F5F5] transition-colors">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">Workflows</h1>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Intelligent process orchestration, workflow templates, and business rule engines.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'overview' ? 'builder' : 'overview')}
            className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'overview' ? '+ Create Workflow' : 'View All Workflows'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-semibold">Active Workflows</span>
                <div className="text-2xl font-black text-[#0F172A] dark:text-white mt-1">47</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#00A859] flex items-center justify-center font-bold">
                <Play className="w-4 h-4 text-[#00A859]" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-semibold">Completed Today</span>
                <div className="text-2xl font-black text-[#00A859] mt-1">216</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#00A859] flex items-center justify-center font-bold">
                <CheckCircle className="w-4 h-4 text-[#00A859]" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-semibold">Pending Signoff</span>
                <div className="text-2xl font-black text-[#D97706] dark:text-[#F59E0B] mt-1">14</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] dark:bg-[#F59E0B]/20 text-[#D97706] flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-[#D97706]" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-semibold">Rule Automation</span>
                <div className="text-2xl font-black text-[#0F172A] dark:text-white mt-1">94.8%</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 text-[#00A859] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 text-[#00A859]" />
              </div>
            </div>
          </div>

          {/* Workflow Template Cards Grid */}
          <div>
            <h2 className="text-xs font-extrabold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider mb-4">
              Enterprise Workflow Templates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl space-y-4 hover:border-[#00A859]/50 transition-all duration-200 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] dark:bg-[#00A859]/20 border border-[#86EFAC] dark:border-[#00A859]/40 flex items-center justify-center text-[#00A859]">
                        <GitMerge className="w-5 h-5 text-[#00A859]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0F172A] dark:text-white text-base group-hover:text-[#00A859] transition-colors">
                          {tmpl.name}
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-medium">{tmpl.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] rounded-xl text-xs">
                    <div>
                      <span className="text-[#64748B] dark:text-[#A1A1AA] block">Active Processes</span>
                      <span className="font-bold text-[#0F172A] dark:text-white">{tmpl.active_count} active</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] dark:text-[#A1A1AA] block">Completion Rate</span>
                      <span className="font-bold text-[#00A859]">{tmpl.completion_rate}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] dark:text-[#A1A1AA] block">Avg Processing</span>
                      <span className="font-bold text-[#0F172A] dark:text-white">{tmpl.avg_time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Process Execution Stream */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl p-6 space-y-4 shadow-2xs">
            <h2 className="text-xs font-extrabold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">
              Live Document Workflow Routing Stream
            </h2>

            <div className="space-y-3">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A] dark:text-white text-xs">{wf.name}</span>
                      <span className="text-[10px] bg-[#DCFCE7] dark:bg-[#00A859]/10 text-[#15803D] dark:text-[#00A859] border border-[#86EFAC] dark:border-[#00A859]/30 px-2 py-0.5 rounded font-mono font-bold">
                        {wf.document_name}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
                      Current Step #{wf.current_step_index + 1}: {wf.steps?.[wf.current_step_index]?.step_name || 'Processing'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#00A859] font-bold bg-[#DCFCE7] dark:bg-[#00A859]/10 border border-[#86EFAC] dark:border-[#00A859]/30 px-3 py-1 rounded-full">
                      Status: {wf.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Visual Workflow Builder & Rule Engine Tab */
        <div className="space-y-8">
          {saveStatus && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-[#DCFCE7] dark:bg-[#00A859]/15 border border-[#86EFAC] dark:border-[#00A859]/40 text-[#15803D] dark:text-[#4ADE80]'
                : 'bg-[#FEE2E2] dark:bg-[#EF4444]/15 border border-[#FCA5A5] dark:border-[#EF4444]/40 text-[#991B1B] dark:text-[#F87171]'
            }`}>
              {saveStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#00A859]" /> : <AlertCircle className="w-4 h-4 text-[#DC2626]" />}
              <span>{saveStatus.text}</span>
            </div>
          )}

          {/* Workflow Builder Editor */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl space-y-6 shadow-2xs">
            <div className="border-b border-[#E2E8F0] dark:border-[#242424] pb-4">
              <h2 className="text-base font-extrabold text-[#0F172A] dark:text-white">Visual Workflow Builder</h2>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Design custom multi-step document routing paths</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] block mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="e.g. High Value Invoice Approval Flow"
                  className="w-full bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white text-xs rounded-lg p-2.5 focus:border-[#00A859] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] block mb-1">Description</label>
                <input
                  type="text"
                  value={newWfDesc}
                  onChange={(e) => setNewWfDesc(e.target.value)}
                  placeholder="e.g. Enforces multi-tier VP signoffs for high transactions"
                  className="w-full bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white text-xs rounded-lg p-2.5 focus:border-[#00A859] outline-none"
                />
              </div>
            </div>

            {/* Draggable-looking Workflow Step Nodes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA]">
                <span>Sequential Workflow Nodes</span>
                <button
                  onClick={handleAddStep}
                  className="text-[#00A859] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Node</span>
                </button>
              </div>

              <div className="space-y-3">
                {builderSteps.map((step, idx) => (
                  <div key={idx} className="bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 border border-[#86EFAC] dark:border-[#00A859]/40 text-[#00A859] font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      <input
                        type="text"
                        value={step.step_name}
                        onChange={(e) => handleUpdateStep(idx, 'step_name', e.target.value)}
                        placeholder="Node Name"
                        className="bg-white dark:bg-[#050505] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white text-xs rounded-lg p-2 focus:border-[#00A859] outline-none"
                      />

                      <select
                        value={step.node_type}
                        onChange={(e) => handleUpdateStep(idx, 'node_type', e.target.value)}
                        className="bg-white dark:bg-[#050505] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white text-xs rounded-lg p-2 focus:border-[#00A859] outline-none"
                      >
                        <option value="Start">Start</option>
                        <option value="AI Analysis">AI Analysis</option>
                        <option value="Document Validation">Document Validation</option>
                        <option value="Approval">Approval</option>
                        <option value="Condition">Condition</option>
                        <option value="Notification">Notification</option>
                        <option value="Assignment">Assignment</option>
                        <option value="End">End</option>
                      </select>

                      <input
                        type="text"
                        value={step.role}
                        onChange={(e) => handleUpdateStep(idx, 'role', e.target.value)}
                        placeholder="Assigned Role"
                        className="bg-white dark:bg-[#050505] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white text-xs rounded-lg p-2 focus:border-[#00A859] outline-none"
                      />
                    </div>

                    {builderSteps.length > 2 && (
                      <button
                        onClick={() => handleRemoveStep(idx)}
                        className="text-[#94A3B8] hover:text-[#EF4444] p-2 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E2E8F0] dark:border-[#242424]">
              <button
                onClick={handleSaveWorkflow}
                className="bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Save Custom Workflow
              </button>
            </div>
          </div>

          {/* Condition / Business Rule Engine */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl space-y-6 shadow-2xs">
            <div className="border-b border-[#E2E8F0] dark:border-[#242424] pb-4">
              <h2 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#00A859]" />
                <span>Business Rule & Condition Engine</span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Configure automated decision thresholds and escalation triggers</p>
            </div>

            {/* Existing Rules List */}
            <div className="space-y-3">
              {rules.map((r, i) => (
                <div key={i} className="bg-[#F8FAFC] dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] p-3.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[#00A859] font-bold">IF</span>
                    <span className="text-[#0F172A] dark:text-white font-semibold">{r.field}</span>
                    <span className="text-[#D97706] font-bold">{r.operator}</span>
                    <span className="text-[#15803D] dark:text-[#86EFAC] font-semibold">{r.value}</span>
                    <span className="text-[#00A859] font-bold">THEN</span>
                    <span className="text-[#0F172A] dark:text-white font-bold bg-white dark:bg-[#050505] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#242424]">{r.action}</span>
                  </div>
                  <button
                    onClick={() => setRules(rules.filter((_, idx) => idx !== i))}
                    className="text-[#94A3B8] hover:text-[#EF4444] p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Rule Form */}
            <div className="bg-[#F8FAFC] dark:bg-[#050505] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#64748B] dark:text-[#A1A1AA]">Add New Automation Rule</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <select
                  value={newRuleField}
                  onChange={(e) => setNewRuleField(e.target.value)}
                  className="bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white rounded-lg p-2 focus:border-[#00A859] outline-none"
                >
                  <option value="Invoice Amount">Invoice Amount</option>
                  <option value="Priority Level">Priority Level</option>
                  <option value="Risk Score">Risk Score</option>
                  <option value="Document Type">Document Type</option>
                </select>

                <select
                  value={newRuleOp}
                  onChange={(e) => setNewRuleOp(e.target.value)}
                  className="bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white rounded-lg p-2 focus:border-[#00A859] outline-none"
                >
                  <option value=">">GREATER THAN (&gt;)</option>
                  <option value="=">EQUALS (=)</option>
                  <option value="<">LESS THAN (&lt;)</option>
                </select>

                <input
                  type="text"
                  value={newRuleVal}
                  onChange={(e) => setNewRuleVal(e.target.value)}
                  placeholder="Value e.g. ₹50,000"
                  className="bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white rounded-lg p-2 focus:border-[#00A859] outline-none"
                />

                <input
                  type="text"
                  value={newRuleAct}
                  onChange={(e) => setNewRuleAct(e.target.value)}
                  placeholder="Then Action"
                  className="bg-white dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#242424] text-[#0F172A] dark:text-white rounded-lg p-2 focus:border-[#00A859] outline-none"
                />
              </div>

              <button
                onClick={handleAddRule}
                className="bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer"
              >
                + Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
