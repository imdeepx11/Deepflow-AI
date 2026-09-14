import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Clock, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { api } from '../api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const analyticsRes = await api.getAnalytics(30);
      setData(analyticsRes);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {
    documents_processed: 128,
    automation_rate: '74%',
    avg_processing_time: '2.4 min',
    approval_rate: '89.5%',
    sla_compliance: '94.2%',
    ai_accuracy: '96.8%'
  };

  const typeData = data?.type_breakdown || [
    { type: 'Invoice', count: 48 },
    { type: 'Purchase Order', count: 28 },
    { type: 'Contract', count: 19 },
    { type: 'Resume', count: 15 },
    { type: 'Loan Application', count: 11 }
  ];

  const processInsights = data?.process_insights || [
    {
      id: 1,
      title: 'Finance Approval Bottleneck',
      observation: 'Finance Manager signoff step takes an average of 4.2 hours compared to target SLA of 2 hours.',
      impact: 'High (Delays 34% of high-value invoice payouts)',
      recommendation: 'Automate validation for invoices below ₹50,000 with >95% AI confidence.'
    },
    {
      id: 2,
      title: 'Manual Exception Rate',
      observation: '18% of documents require manual review due to missing tax codes.',
      impact: 'Medium (Adds ~12 mins per document review)',
      recommendation: 'Add automated pre-upload validation prompt requiring vendor GSTIN format check.'
    },
    {
      id: 3,
      title: 'SLA Compliance Alert',
      observation: 'High-priority contract reviews are taking 31% longer than target SLA.',
      impact: 'Critical (Potential legal penalty risks on vendor renewals)',
      recommendation: 'Configure direct Slack/Email alert escalations for Legal Counsel approvals.'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Analytics</h1>
        <p className="text-xs text-[#A1A1AA]">Process performance metrics, automation rates, and AI process intelligence insights.</p>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Documents', val: kpis.documents_processed, color: 'text-white' },
          { label: 'Automation Rate', val: kpis.automation_rate, color: 'text-[#00C853]' },
          { label: 'Avg Processing Time', val: kpis.avg_processing_time, color: 'text-white' },
          { label: 'Approval Rate', val: kpis.approval_rate, color: 'text-[#22C55E]' },
          { label: 'SLA Compliance', val: kpis.sla_compliance, color: 'text-[#00C853]' },
          { label: 'AI Accuracy Rate', val: kpis.ai_accuracy, color: 'text-[#86EFAC]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#0D0D0D] border border-[#242424] p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-[#A1A1AA] block">{kpi.label}</span>
            <span className={`text-xl font-black font-mono tracking-tight ${kpi.color}`}>{kpi.val}</span>
          </div>
        ))}
      </div>

      {/* Process Intelligence Box (FEATURE HIGHLIGHT) */}
      <div className="bg-gradient-to-r from-[#00C853]/10 via-[#0D0D0D] to-[#0D0D0D] border-2 border-[#00C853]/60 p-6 rounded-xl space-y-4 shadow-[0_0_25px_rgba(0,200,83,0.1)]">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#00C853] animate-bounce" />
          <h2 className="font-extrabold text-white text-sm uppercase tracking-wider">
            AI Process Intelligence & Bottleneck Detection
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {processInsights.map((insight) => (
            <div key={insight.id} className="bg-[#121212] border border-[#242424] p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-xs text-[#00C853]">{insight.title}</h3>
                <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">{insight.observation}</p>
                <div className="mt-2 text-[10px] text-[#F59E0B] font-semibold">Impact: {insight.impact}</div>
              </div>

              <div className="pt-3 border-t border-[#242424] text-[11px]">
                <span className="text-[#00C853] font-bold block mb-0.5">Recommended Improvement:</span>
                <span className="text-white leading-tight block">{insight.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents by Type Chart */}
        <div className="bg-[#0D0D0D] border border-[#242424] p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-white text-sm">Documents by Classification Type</h3>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242424" />
                <XAxis dataKey="type" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#242424', borderRadius: '8px', fontSize: '12px', color: '#FFF' }}
                />
                <Bar dataKey="count" fill="#00C853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA & Automation Rate Trend */}
        <div className="bg-[#0D0D0D] border border-[#242424] p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-white text-sm">Automation & SLA Compliance Trend</h3>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.over_time?.['30d'] || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242424" />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#242424', borderRadius: '8px', fontSize: '12px', color: '#FFF' }}
                />
                <Line type="monotone" dataKey="automated" stroke="#00C853" strokeWidth={3} dot={{ fill: '#00C853' }} />
                <Line type="monotone" dataKey="manual" stroke="#F59E0B" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
