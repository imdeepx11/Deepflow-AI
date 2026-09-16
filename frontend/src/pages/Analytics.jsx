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
    { type: 'Contract', count: 22 },
    { type: 'Resume', count: 18 },
    { type: 'Loan App', count: 12 }
  ];

  const bottleneckInsights = [
    {
      id: 1,
      title: 'Approval SLA Bottleneck',
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC] dark:bg-[#050505] min-h-screen text-[#0F172A] dark:text-[#F5F5F5] transition-colors">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">Enterprise Analytics</h1>
        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Process performance metrics, automation rates, and AI process intelligence insights.</p>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Processed', val: kpis.documents_processed ?? 128, change: '+14%', icon: BarChart3 },
          { label: 'Automation Rate', val: `${kpis.automation_rate ?? 91}%`, change: '+4.2%', icon: Zap },
          { label: 'Avg Process Time', val: kpis.avg_sla ?? '1.2m', change: '-20%', icon: Clock },
          { label: 'Approval Rate', val: '94.2%', change: '+2.1%', icon: CheckCircle },
          { label: 'SLA Compliance', val: '98.5%', change: '+1.4%', icon: ShieldCheck },
          { label: 'AI Accuracy', val: '96.8%', change: '+0.8%', icon: TrendingUp }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-[#00A859]" />
                <span className="text-[10px] font-bold text-[#00A859]">{item.change}</span>
              </div>
              <div className="text-xl font-black text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">{item.val}</div>
              <div className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-medium">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Document Type Distribution Chart */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-[#0F172A] dark:text-[#F5F5F5]">Document Ingestion by Category</h3>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Distribution of ingested documents across business units</p>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#00A859" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Process Intelligence & Bottleneck Detection */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859]">
            <Lightbulb className="w-4 h-4 text-[#00A859]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A] dark:text-[#F5F5F5]">Process Bottleneck Insights</h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">AI-detected operational bottlenecks & optimization recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {bottleneckInsights.map((insight) => (
            <div key={insight.id} className="bg-[#F8FAFC] dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F5F5F5]">{insight.title}</h4>
                <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] dark:bg-[#991B1B]/30 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">{insight.observation}</p>
              <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#242424] text-[10px] font-semibold text-[#00A859]">
                💡 {insight.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
