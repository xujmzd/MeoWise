import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CAT_AVATARS } from '../constants/avatars';

export default function Report() {
  const [report, setReport] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [pageLoading, setPageLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const navigate = useNavigate();

  // 初始化：加载猫咪和设备列表
  useEffect(() => {
    const initFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      
      try {
        // Fetch cats
        const catsRes = await fetch('/api/v1/cats/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCats(catsData);
          if (catsData.length > 0 && selectedCatId === null) {
            setSelectedCatId(catsData[0].id);
          }
        }

        // Fetch devices
        const devRes = await fetch('/api/v1/devices/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (devRes.ok) {
          const devices = await devRes.json();
          if (devices.length > 0) {
            setDeviceId(devices[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    initFetch();
  }, [navigate]);

  // 当 period、selectedCatId 或 deviceId 变化时，重新获取报告数据
  useEffect(() => {
    if (!deviceId || selectedCatId === null) return;
    
    const loadReport = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        setReportLoading(true);
        
        const catParam = selectedCatId ? `&cat_id=${selectedCatId}` : '';
        const res = await fetch(`/api/v1/stats/report?device_id=${deviceId}&period=${period}${catParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setReport(await res.json());
        }
        
        // Fetch events
        const eventsRes = await fetch(`/api/v1/feeding_plans/activities?device_id=${deviceId}&limit=10&activity_type=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (eventsRes.ok) {
          setEvents(await eventsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setReportLoading(false);
        setPageLoading(false);
      }
    };
    loadReport();
  }, [deviceId, period, selectedCatId]);

  const selectedCat = cats.find(c => c.id === selectedCatId) || cats[0];

  if (pageLoading) return <div className="p-6">Loading...</div>;

  if (!deviceId) {
    return (
      <div className="px-6 py-8 text-center">
        <h2 className="font-headline text-2xl font-bold mb-4">暂无设备</h2>
        <p className="text-secondary mb-8">请先在"我的"页面添加设备</p>
      </div>
    );
  }

  const groupStats = report?.group_stats || [];
  const chartData = groupStats.length > 0 ? groupStats.map((stat: any) => ({
    name: stat.label,
    amount: stat.dispensed_g || 0,
    duration: stat.avg_duration_sec ? (stat.avg_duration_sec / 60).toFixed(1) : 0,
    sessions: stat.session_count || 0,
  })) : [];

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">进食报告</h2>
            {cats.length > 0 && (
              <div className="flex gap-2 items-center ml-4">
                {cats.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-all ${selectedCatId === cat.id ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    title={cat.name}
                  >
                    <img src={CAT_AVATARS[cat.avatar_id || 0]} alt={cat.name} className="w-full h-full rounded-full bg-surface-container" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-secondary mt-1">{selectedCat?.name || '宠物'} 的详细营养数据分析</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-full">
          <button 
            onClick={() => setPeriod('daily')}
            className={`px-6 py-2 rounded-full font-label text-sm font-semibold transition-colors ${period === 'daily' ? 'bg-primary-container text-white shadow-sm' : 'text-secondary hover:text-on-surface'}`}
          >
            日
          </button>
          <button 
            onClick={() => setPeriod('weekly')}
            className={`px-6 py-2 rounded-full font-label text-sm font-semibold transition-colors ${period === 'weekly' ? 'bg-primary-container text-white shadow-sm' : 'text-secondary hover:text-on-surface'}`}
          >
            周
          </button>
          <button 
            onClick={() => setPeriod('monthly')}
            className={`px-6 py-2 rounded-full font-label text-sm font-semibold transition-colors ${period === 'monthly' ? 'bg-primary-container text-white shadow-sm' : 'text-secondary hover:text-on-surface'}`}
          >
            月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col justify-between shadow-[0px_20px_40px_rgba(155,69,0,0.04)]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-primary-fixed rounded-2xl">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
            </div>
            <span className="text-xs font-bold text-tertiary">
              {period === 'daily' ? '今日' : period === 'weekly' ? '本周' : '本月'}
            </span>
          </div>
          <div className="mt-8">
            <p className="text-secondary text-sm font-medium">累计进食</p>
            <h3 className="font-headline text-4xl font-extrabold text-on-surface mt-1">{report.stats.total_eaten_g || 0}<span className="text-lg font-medium text-secondary ml-1">g</span></h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col justify-between shadow-[0px_20px_40px_rgba(155,69,0,0.04)]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-secondary-fixed rounded-2xl">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>event_repeat</span>
            </div>
            <span className="text-xs font-bold text-secondary opacity-60">
              {period === 'daily' ? '今日' : period === 'weekly' ? '本周' : '本月'}
            </span>
          </div>
          <div className="mt-8">
            <p className="text-secondary text-sm font-medium">进食次数</p>
            <h3 className="font-headline text-4xl font-extrabold text-on-surface mt-1">{report.stats.total_sessions}<span className="text-lg font-medium text-secondary ml-1">次</span></h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col justify-between shadow-[0px_20px_40px_rgba(155,69,0,0.04)]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-tertiary-fixed rounded-2xl">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
            <span className="text-xs font-bold text-tertiary">
              {period === 'daily' ? '今日' : period === 'weekly' ? '本周' : '本月'}
            </span>
          </div>
          <div className="mt-8">
            <p className="text-secondary text-sm font-medium">平均进食时长</p>
            <h3 className="font-headline text-4xl font-extrabold text-on-surface mt-1">{(report.stats.avg_session_duration_sec / 60).toFixed(1)}<span className="text-lg font-medium text-secondary ml-1">分钟</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        {reportLoading && (
          <div className="absolute inset-0 bg-surface-container/50 backdrop-blur-sm rounded-[1.5rem] z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-surface-container-low px-6 py-3 rounded-full shadow-lg">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              <span className="text-sm font-medium text-on-surface">加载中...</span>
            </div>
          </div>
        )}
        <div className="bg-surface-container-low rounded-[1.5rem] p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline text-xl font-bold text-on-surface">
              {period === 'daily' ? '时段摄入量' : period === 'weekly' ? '每日摄入量' : '每周摄入量'}
            </h4>
            <span className="text-xs font-semibold text-on-primary bg-primary px-3 py-1 rounded-full">
              {period === 'daily' ? '今日' : period === 'weekly' ? '近7天' : '近4周'}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={{ stroke: '#ddd' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  unit="g"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => [`${value}g`, '摄入量']}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#E8B89D" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartData.length === 0 && !reportLoading && (
            <div className="flex items-center justify-center h-32">
              <p className="text-secondary text-sm">暂无数据</p>
            </div>
          )}
        </div>

        <div className="bg-surface-container-low rounded-[1.5rem] p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline text-xl font-bold text-on-surface">
              {period === 'daily' ? '时段进食时长' : period === 'weekly' ? '每日进食时长' : '每周进食时长'}
            </h4>
            <span className="text-xs font-semibold text-on-tertiary-fixed-variant bg-tertiary-fixed px-3 py-1 rounded-full">分钟</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={{ stroke: '#ddd' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  unit="min"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => [`${value}分钟`, '平均时长']}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#006686" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#006686', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#006686' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h4 className="font-headline text-xl font-bold text-on-surface mb-6">最近活动</h4>
        <div className="space-y-4">
          {events && events.length > 0 ? (
            events.slice(0, 5).map((event: any, index: number) => (
              <div key={index} className="bg-surface-container rounded-2xl p-5 flex items-center justify-between hover:bg-surface-container-high transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className={`material-symbols-outlined ${event.type === 'feeding' ? 'text-tertiary' : 'text-primary'}`}>
                      {event.type === 'feeding' ? 'restaurant' : 'pets'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{event.type === 'feeding' ? '喂食已完成' : '宠物进食'}</p>
                    <p className="text-xs text-secondary">{new Date(event.time).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-on-surface">{event.amount_g}g</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider text-tertiary`}>
                    已记录
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-surface-container-low rounded-xl">
              <p className="text-secondary">暂无最近活动记录</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
