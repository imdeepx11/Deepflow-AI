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
  Plus,
  Settings,
  MoreVertical,
  BarChart3
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

export default function Dashboard({ onNavigateToAnalyzer, onNavigateToDocuments, onOpenUpload }) {
  const [timeframe, setTimeframe] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, docsData] = await Promise.all([
        api.getAnalytics(30),
        api.getDocuments()
      ]);
      setAnalytics(analyticsData);
      setDocuments(docsData.slice(0, 5)); // Recent 5 documents like mockup
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const kpiList = [
    {
      title: 'Documents Processed',
      value: analytics?.kpis?.documents_processed ?? 11,
      change: '+18.4%',
      period: 'vs last month',
      isPositive: true,
      icon: FileText
    },
    {
      title: 'Pending Approval',
      value: analytics?.kpis?.pending_approval ?? 4,
      change: '-3.2%',
      period: 'vs last month',
      isPositive: true,
      icon: Clock
    },
    {
      title: 'High Priority',
      value: analytics?.kpis?.high_priority ?? 4,
      change: '+2',
      period: 'vs last week',
      isPositive: false,
      icon: AlertTriangle
    },
    {
      title: 'Automation Rate',
      value: analytics?.kpis?.automation_rate ?? '74%',
      change: '+5.8%',
      period: 'vs last month',
      isPositive: true,
      icon: Zap
    },
    {
      title: 'Average Processing Time',
      value: analytics?.kpis?.avg_processing_time ?? '2.4 min',
      change: '-42 sec',
      period: 'vs last month',
      isPositive: true,
      icon: BarChart3
    }
  ];

  const chartData = [
    { date: 'Aug 16', processed: 35 },
    { date: 'Aug 23', processed: 58 },
    { date: 'Aug 30', processed: 72 },
    { date: 'Sep 6', processed: 98 },
    { date: 'Sep 13', processed: 130 }
  ];

  const statusPieData = analytics?.status_distribution || [
    { name: 'Approved', count: 3, percentage: '27%', color: '#00A859' },
    { name: 'Pending', count: 4, percentage: '36%', color: '#4ADE80' },
    { name: 'Under Review', count: 2, percentage: '18%', color: '#FACC15' },
    { name: 'Rejected', count: 1, percentage: '9%', color: '#F87171' },
    { name: 'Processed', count: 1, percentage: '9%', color: '#94A3B8' }
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto bg-[#F8FAFC]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#00A859] shrink-0">
            <Sun className="w-6 h-6 text-[#00A859]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Good morning, Deepak!</h1>
            <p className="text-xs text-[#64748B] font-medium">Here's what's happening across your document workflows.</p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-[#00A859] hover:bg-[#059669] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
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
              className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-3 hover:border-[#00A859]/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center text-[#00A859]">
                  <Icon className="w-4 h-4 text-[#00A859]" />
                </div>
                <span className="text-[11px] font-semibold text-[#64748B] text-right max-w-[110px] leading-tight">
                  {kpi.title}
                </span>
              </div>

              <div>
                <div className="text-2xl font-black text-[#0F172A] tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <span className={`font-bold flex items-center ${kpi.isPositive ? 'text-[#00A859]' : 'text-[#DC2626]'}`}>
                    {kpi.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {kpi.change}
                  </span>
                  <span className="text-[#94A3B8]">{kpi.period}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Processing Volume Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-sm">Documents Processed Over Time</h3>
              <p className="text-xs text-[#64748B]">Volume trends across automated document ingestion pipelines</p>
            </div>

            {/* Timeframe Filter */}
            <div className="flex bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl text-xs font-semibold">
              {['7 Days', '30 Days', '90 Days'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf.toLowerCase().replace(' ', ''))}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    (timeframe === '30d' && tf === '30 Days') || (timeframe === '7d' && tf === '7 Days') || (timeframe === '90d' && tf === '90 Days')
                      ? 'bg-[#004D25] text-white shadow-xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A859" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00A859" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="processed" stroke="#00A859" strokeWidth={3} fillOpacity={1} fill="url(#colorProcessed)" dot={{ fill: '#00A859', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Status Breakdown Donut Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-[#0F172A] text-sm">Document Status Breakdown</h3>
            <p className="text-xs text-[#64748B]">Current distribution of active document queue</p>
          </div>

          <div className="grid grid-cols-2 items-center gap-2">
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-base font-black text-[#0F172A]">11</span>
                <span className="text-[10px] font-semibold text-[#64748B]">Documents</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {statusPieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#475569] font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#0F172A] ml-1">{item.count} ({item.percentage})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] text-sm">Recent Documents</h3>
            <p className="text-xs text-[#64748B]">Latest documents and their analysis status</p>
          </div>

          <button
            onClick={onNavigateToDocuments}
            className="text-xs text-[#00A859] hover:underline font-bold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#475569]">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-extrabold text-[10px] border-b border-[#E2E8F0]">
              <tr>
                <th className="p-4">Document</th>
                <th className="p-4">Type</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">AI Confidence</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Uploaded</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {documents.map((doc, idx) => {
                const confPercent = Math.round((doc.confidence || 0.94) * 100);
                const timeText = idx === 0 ? '2 min ago' : idx === 1 ? '12 min ago' : idx === 2 ? '1 hour ago' : idx === 3 ? '2 hours ago' : '4 hours ago';
                
                return (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigateToAnalyzer(doc.id)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-bold text-[#0F172A] flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#00A859] shrink-0" />
                      <span className="group-hover:text-[#00A859] transition-colors">{doc.original_filename}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] px-2.5 py-1 rounded-md text-[11px] font-medium">
                        {doc.analysis?.document_type || 'Invoice'}
                      </span>
                    </td>
                    <td className="p-4 text-[#0F172A] font-semibold">{doc.uploaded_by}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                        <span>{confPercent}%</span>
                        <div className="w-16 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#00A859] h-full" style={{ width: `${confPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                        doc.priority === 'CRITICAL' || doc.priority === 'Critical' || doc.priority === 'HIGH' || doc.priority === 'High'
                          ? 'bg-[#FEE2E2] text-[#991B1B]'
                          : doc.priority === 'MEDIUM' || doc.priority === 'Medium'
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#DCFCE7] text-[#166534]'
                      }`}>
                        {doc.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        doc.status === 'Approved' ? 'bg-[#DCFCE7] text-[#15803D]' :
                        doc.status === 'Pending Approval' ? 'bg-[#FEF9C3] text-[#854D0E]' :
                        doc.status === 'Under Review' ? 'bg-[#E0F2FE] text-[#075985]' :
                        doc.status === 'Processed' ? 'bg-[#DCFCE7] text-[#166534]' :
                        'bg-[#F1F5F9] text-[#475569]'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#64748B] text-[11px] font-medium">{timeText}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToAnalyzer(doc.id); }}
                          className="bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Settings className="w-3 h-3 text-[#64748B]" />
                          <span>Analyze</span>
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
