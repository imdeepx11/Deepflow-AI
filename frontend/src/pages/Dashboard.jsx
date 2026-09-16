import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Sun,
  Moon,
  Plus,
  Settings,
  MoreVertical,
  BarChart3,
  Trash2,
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { api } from '../api';

export default function Dashboard({ user, onNavigateToAnalyzer, onNavigateToDocuments, onOpenUpload }) {
  const [timeframe, setTimeframe] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
      const [analyticsData, docsData] = await Promise.all([
        api.getAnalytics(days),
        api.getDocuments()
      ]);
      setAnalytics(analyticsData);
      setDocuments(docsData.slice(0, 5));
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (err) {
        alert("Failed to delete document");
      }
    }
  };

  const getGreetingData = () => {
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    let isSun = true;

    if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
      isSun = true;
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
      isSun = false;
    } else if (hour >= 21 || hour < 5) {
      timeOfDay = 'night';
      isSun = false;
    }

    const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
    return {
      text: `Good ${timeOfDay}, ${userName}!`,
      isSun
    };
  };

  const greeting = getGreetingData();

  // Dynamic Volume Chart Data according to Timeframe
  const getVolumeDataForTimeframe = () => {
    if (timeframe === '7d') {
      return [
        { date: 'Sep 10', processed: 12 },
        { date: 'Sep 11', processed: 18 },
        { date: 'Sep 12', processed: 24 },
        { date: 'Sep 13', processed: 31 },
        { date: 'Sep 14', processed: 28 },
        { date: 'Sep 15', processed: 39 },
        { date: 'Sep 16', processed: 45 }
      ];
    } else if (timeframe === '90d') {
      return [
        { date: 'Jun W1', processed: 120 },
        { date: 'Jun W3', processed: 210 },
        { date: 'Jul W1', processed: 340 },
        { date: 'Jul W3', processed: 480 },
        { date: 'Aug W1', processed: 610 },
        { date: 'Aug W3', processed: 780 },
        { date: 'Sep W1', processed: 920 },
        { date: 'Sep W3', processed: 1140 }
      ];
    }
    // Default 30d
    return analytics?.volume_trend || [
      { date: 'Aug 16', processed: 35 },
      { date: 'Aug 23', processed: 58 },
      { date: 'Aug 30', processed: 72 },
      { date: 'Sep 6', processed: 98 },
      { date: 'Sep 13', processed: 130 }
    ];
  };

  const volumeChartData = getVolumeDataForTimeframe();

  const kpiList = [
    {
      title: 'Documents Processed',
      value: timeframe === '7d' ? 45 : timeframe === '90d' ? 1140 : (analytics?.kpis?.documents_processed ?? 130),
      change: '+18.4%',
      period: `vs previous ${timeframe}`,
      isPositive: true,
      icon: FileText
    },
    {
      title: 'Pending Approval',
      value: analytics?.kpis?.pending_approval ?? 4,
      change: '-3.2%',
      period: 'active workflows',
      isPositive: true,
      icon: Clock
    },
    {
      title: 'Flagged for Risk',
      value: analytics?.kpis?.flagged_risk ?? 1,
      change: '-12.0%',
      period: 'risk score > 60',
      isPositive: true,
      icon: AlertTriangle
    },
    {
      title: 'Automation Rate',
      value: `${analytics?.kpis?.automation_rate ?? 94}%`,
      change: '+4.5%',
      period: 'straight-through',
      isPositive: true,
      icon: Zap
    },
    {
      title: 'Avg Processing SLA',
      value: analytics?.kpis?.avg_sla ?? '1.2m',
      change: '-25.0%',
      period: 'turnaround time',
      isPositive: true,
      icon: TrendingUp
    }
  ];

  const statusPieData = analytics?.status_distribution || [
    { name: 'Approved', count: 3, percentage: '27%', color: '#00A859' },
    { name: 'Pending', count: 4, percentage: '36%', color: '#4ADE80' },
    { name: 'Under Review', count: 2, percentage: '18%', color: '#FACC15' },
    { name: 'Rejected', count: 1, percentage: '9%', color: '#F87171' },
    { name: 'Processed', count: 1, percentage: '9%', color: '#94A3B8' }
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto bg-[#F8FAFC] dark:bg-[#050505] transition-colors min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] shrink-0">
            {greeting.isSun ? (
              <Sun className="w-6 h-6 text-[#00A859]" />
            ) : (
              <Moon className="w-6 h-6 text-[#6366F1]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">{greeting.text}</h1>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-medium">Here's what's happening across your document workflows.</p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiList.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-4 rounded-2xl shadow-2xs space-y-3 hover:border-[#00A859]/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859]">
                  <Icon className="w-4 h-4 text-[#00A859]" />
                </div>
                <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#A1A1AA] text-right max-w-[110px] leading-tight">
                  {kpi.title}
                </span>
              </div>

              <div>
                <div className="text-2xl font-black text-[#0F172A] dark:text-[#F5F5F5] tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <span className={`font-bold flex items-center ${kpi.isPositive ? 'text-[#00A859]' : 'text-[#DC2626]'}`}>
                    {kpi.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {kpi.change}
                  </span>
                  <span className="text-[#94A3B8] dark:text-[#64748B]">{kpi.period}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Processing Volume Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-sm">Documents Processed Over Time</h3>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Volume trends across automated document ingestion pipelines</p>
            </div>

            <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#1A1A1A] p-1 rounded-lg text-xs font-semibold">
              {['7d', '30d', '90d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-[#00A859] text-white font-bold shadow-2xs'
                      : 'text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A859" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00A859" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="processed" stroke="#00A859" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-sm">Status Breakdown</h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Current distribution across lifecycle states</p>

            <div className="h-[160px] w-full my-3 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-[#0F172A] dark:text-[#F5F5F5] leading-none">
                  {statusPieData.reduce((acc, curr) => acc + (curr.count || 0), 0)}
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-bold uppercase mt-0.5">Total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#F1F5F9] dark:border-[#242424]">
            {statusPieData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#64748B] dark:text-[#A1A1AA] truncate text-[11px] font-medium">{item.name}:</span>
                <span className="font-bold text-[#0F172A] dark:text-[#F5F5F5] text-[11px] ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents Table Stream with Delete Support */}
      <div className="bg-white dark:bg-[#0D0D0D] border border-[#E2E8F0] dark:border-[#242424] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] dark:border-[#242424] flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] dark:text-[#F5F5F5] text-sm">Recent Ingested Documents</h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">Real-time stream of documents processed by DeepFlow AI</p>
          </div>
          <button
            onClick={onNavigateToDocuments}
            className="text-[#00A859] hover:text-[#059669] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Documents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#121212] border-b border-[#E2E8F0] dark:border-[#242424] text-[#64748B] dark:text-[#A1A1AA] font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 pl-6">Document Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">AI Confidence</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ingested</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#242424]">
              {documents.map((doc) => {
                const confPercent = Math.round((doc.ai_confidence || 0.95) * 100);
                const timeText = doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigateToAnalyzer(doc.id)}
                    className="hover:bg-[#F8FAFC] dark:hover:bg-[#141414] transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 font-bold text-[#0F172A] dark:text-[#F5F5F5] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] dark:bg-[#00A859]/20 flex items-center justify-center text-[#00A859] shrink-0">
                        <FileText className="w-4 h-4 text-[#00A859]" />
                      </div>
                      <span className="truncate max-w-[200px]">{doc.original_filename || doc.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#475569] dark:text-[#A1A1AA] font-semibold text-[11px]">
                        {doc.type || doc.analysis?.document_type || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-[#0F172A] dark:text-[#F5F5F5] font-semibold">{doc.uploaded_by || 'System'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-[#0F172A] dark:text-[#F5F5F5]">
                        <span>{confPercent}%</span>
                        <div className="w-16 bg-[#E2E8F0] dark:bg-[#262626] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#00A859] h-full" style={{ width: `${confPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                        doc.priority === 'CRITICAL' || doc.priority === 'Critical' || doc.priority === 'HIGH' || doc.priority === 'High'
                          ? 'bg-[#FEE2E2] dark:bg-[#991B1B]/30 text-[#991B1B] dark:text-[#F87171]'
                          : doc.priority === 'MEDIUM' || doc.priority === 'Medium'
                          ? 'bg-[#FEF3C7] dark:bg-[#92400E]/30 text-[#92400E] dark:text-[#FBBF24]'
                          : 'bg-[#DCFCE7] dark:bg-[#166534]/30 text-[#166534] dark:text-[#4ADE80]'
                      }`}>
                        {doc.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        doc.status === 'Approved' ? 'bg-[#DCFCE7] dark:bg-[#15803D]/20 text-[#15803D] dark:text-[#4ADE80]' :
                        doc.status === 'Pending Approval' ? 'bg-[#FEF9C3] dark:bg-[#854D0E]/20 text-[#854D0E] dark:text-[#FACC15]' :
                        doc.status === 'Under Review' ? 'bg-[#E0F2FE] dark:bg-[#075985]/20 text-[#075985] dark:text-[#38BDF8]' :
                        doc.status === 'Processed' ? 'bg-[#DCFCE7] dark:bg-[#166534]/20 text-[#166534] dark:text-[#4ADE80]' :
                        'bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#475569] dark:text-[#A1A1AA]'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#64748B] dark:text-[#A1A1AA] text-[11px] font-medium">{timeText}</td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToAnalyzer(doc.id); }}
                          className="bg-white dark:bg-[#1E1E1E] hover:bg-[#F1F5F9] dark:hover:bg-[#2A2A2A] border border-[#CBD5E1] dark:border-[#333] text-[#0F172A] dark:text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Cpu className="w-3 h-3 text-[#00A859]" />
                          <span>Analyze</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteDocument(doc.id, doc.original_filename || doc.name, e)}
                          title="Delete Document"
                          className="p-1.5 text-[#64748B] hover:text-[#EF4444] dark:text-[#A1A1AA] dark:hover:text-[#EF4444] hover:bg-[#F1F5F9] dark:hover:bg-[#1F1F1F] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      {/* Small Developer Attribution Note (Main Dashboard Only) */}
      <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#242424] flex items-center justify-between text-xs text-[#94A3B8] dark:text-[#64748B]">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Designed and Developed by</span>
          <span className="font-semibold text-[#0F172A] dark:text-[#E2E8F0] bg-[#F1F5F9] dark:bg-[#1E293B] px-2 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#334155] text-[11px]">
            Deepak Gupta
          </span>
        </div>
        <span className="text-[10px] text-[#94A3B8] dark:text-[#475569]">DeepFlow AI v2.5</span>
      </div>
    </div>
  );
}
