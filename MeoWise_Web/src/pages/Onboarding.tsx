import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DAYS_OF_WEEK = [
  { value: 'Mon', label: '一' },
  { value: 'Tue', label: '二' },
  { value: 'Wed', label: '三' },
  { value: 'Thu', label: '四' },
  { value: 'Fri', label: '五' },
  { value: 'Sat', label: '六' },
  { value: 'Sun', label: '日' },
];

export default function Feeding() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [recentFeedings, setRecentFeedings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('早餐');
  const [newPlanTime, setNewPlanTime] = useState('08:00');
  const [newPlanAmount, setNewPlanAmount] = useState(20);
  const [newPlanDays, setNewPlanDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  const [manualAmount, setManualAmount] = useState(10);
  const navigate = useNavigate();

  const fetchPlans = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const devRes = await fetch('/api/v1/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (devRes.ok) {
        const devicesData = await devRes.json();
        setDevices(devicesData);
        if (devicesData.length > 0) {
          const id = selectedDeviceId || devicesData[0].id;
          if (!selectedDeviceId) setSelectedDeviceId(id);
          
          const res = await fetch(`/api/v1/feeding_plans?device_id=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setPlans(await res.json());
          }
          const evRes = await fetch(`/api/v1/feeding_plans/activities?device_id=${id}&limit=3&activity_type=feeding`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (evRes.ok) {
            setRecentFeedings(await evRes.json());
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [navigate, selectedDeviceId]);

  const device = devices.find(d => d.id === selectedDeviceId) || devices[0];

  if (loading) return <div className="p-6">Loading...</div>;

  if (!device) {
    return (
      <div className="px-6 py-8 text-center">
        <h2 className="font-headline text-2xl font-bold mb-4">暂无绑定的设备</h2>
        <p className="text-secondary mb-8">请先在“我的”页面添加设备</p>
        <button onClick={() => navigate('/profile')} className="cta-gradient text-white px-6 py-3 rounded-full font-bold">
          前往添加设备
        </button>
      </div>
    );
  }

  const handleManualFeed = async () => {
    if (!device) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/devices/${device.id}/manual_feed?amount_g=${manualAmount}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('手动喂食成功！');
        fetchPlans(); // Refresh events
      } else {
        alert('喂食失败');
      }
    } catch (err) {
      console.error(err);
      alert('网络错误');
    }
  };

  const togglePlan = async (plan: any) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/feeding_plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ is_enabled: !plan.is_enabled }),
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePlan = async (planId: number) => {
    if (!confirm('确定要删除此计划吗？')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/feeding_plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/feeding_plans`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          device_id: device.id,
          name: newPlanName,
          time_of_day: newPlanTime,
          amount_g: Number(newPlanAmount),
          days_of_week: newPlanDays.join(','),
          is_enabled: true
        }),
      });
      if (res.ok) {
        setIsAddingPlan(false);
        fetchPlans();
      } else {
        alert('添加计划失败');
      }
    } catch (err) {
      console.error(err);
      alert('网络错误');
    }
  };

  const getBowlStatus = (weight: number) => {
    if (weight < 5) return { text: '断粮', colorClass: 'bg-error text-on-error', icon: 'warning' };
    if (weight <= 20) return { text: '缺粮', colorClass: 'bg-orange-500 text-white', icon: 'error' };
    if (weight <= 50) return { text: '适量', colorClass: 'bg-primary text-on-primary', icon: 'check_circle' };
    return { text: '充足', colorClass: 'bg-tertiary text-on-tertiary', icon: 'check_circle' };
  };
  
  const bowlStatus = device ? getBowlStatus(device.bowl_weight_g || 0) : getBowlStatus(0);

  const formatTimeAgo = (timestamp: string) => {
    const diffMs = new Date().getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${Math.max(1, diffMins)}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  const formatDays = (daysStr: string) => {
    if (!daysStr) return '每天';
    const days = daysStr.split(',');
    if (days.length === 7) return '每天';
    if (days.length === 0) return '不重复';
    const dayLabels = days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).filter(Boolean);
    return `周${dayLabels.join(' ')}`;
  };

  const toggleDaySelection = (dayValue: string) => {
    if (newPlanDays.includes(dayValue)) {
      setNewPlanDays(newPlanDays.filter(d => d !== dayValue));
    } else {
      setNewPlanDays([...newPlanDays, dayValue].sort());
    }
  };

  return (
    <div className="px-6 py-8">
      <section className="mb-12 text-center relative">
        {devices.length > 1 && (
          <div className="absolute top-0 left-0">
            <select 
              value={selectedDeviceId || ''} 
              onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
              className="bg-surface-container border-none rounded-lg px-3 py-2 text-sm font-bold text-primary outline-none cursor-pointer shadow-sm"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        <h2 className="font-headline text-[2.5rem] font-extrabold tracking-tight text-on-surface leading-tight mb-2">喂食</h2>
        <p className="text-secondary font-medium italic">新鲜每一餐，猫咪更健康。</p>
      </section>

      <section className="mb-12">
        <div className="bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface">手动喂食</h3>
              <p className="text-secondary text-sm">立即投喂一份</p>
            </div>
            <div className={`${bowlStatus.colorClass} px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1`}>
              <span className="material-symbols-outlined text-sm">{bowlStatus.icon}</span>
              {bowlStatus.text}
            </div>
          </div>
          
          <div className="relative w-full h-16 bg-surface-container-high rounded-full flex items-center px-4 group overflow-hidden shadow-inner">
            <input 
              type="range" 
              min="5" 
              max="50" 
              step="5"
              value={manualAmount}
              onChange={(e) => setManualAmount(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-on-surface-variant/60 font-bold tracking-widest text-sm">滑动调节克重</span>
            </div>
            <div 
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container shadow-[0px_4px_10px_rgba(155,69,0,0.3)] flex items-center justify-center transition-all z-10 pointer-events-none"
              style={{ left: `calc(16px + ${((manualAmount - 5) / 45)} * (100% - 80px))` }}
            >
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            </div>
          </div>
          
          <div className="mt-8 px-4 text-center">
            <button onClick={handleManualFeed} className="cta-gradient text-white px-12 py-4 rounded-full font-headline font-bold shadow-lg hover:scale-105 transition-transform text-lg">
              立即喂食 {manualAmount}g
            </button>
          </div>
          
          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-3 text-center">上次喂食</p>
            <div className="flex flex-col gap-2">
              {recentFeedings && recentFeedings.length > 0 ? (
                recentFeedings.map((feeding: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary">restaurant</span>
                      <span className="font-bold text-sm text-on-surface">{formatTimeAgo(feeding.time)}</span>
                    </div>
                    <span className="text-sm font-bold text-secondary">{feeding.amount_g}g</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-secondary text-sm">暂无记录</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-lg font-bold text-on-surface">定时计划</h3>
          <span className="text-secondary text-xs font-semibold">{plans.filter(p => p.is_enabled).length} 个进行中</span>
        </div>
        
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div key={plan.id} className={`bg-surface-container-lowest rounded-2xl p-5 shadow-[0px_4px_12px_rgba(0,0,0,0.02)] border border-transparent hover:border-outline-variant/10 transition-all ${!plan.is_enabled ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-primary/10 text-primary' : index === 1 ? 'bg-tertiary/10 text-tertiary' : 'bg-on-surface-variant/10 text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined">
                      {index === 0 ? 'wb_twilight' : index === 1 ? 'wb_sunny' : 'dark_mode'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface">{plan.name}</h4>
                    <p className="text-secondary text-xs">{formatDays(plan.days_of_week)} • {plan.time_of_day}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePlan(plan)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
                    <span className={`material-symbols-outlined text-4xl transition-colors ${plan.is_enabled ? 'text-primary' : 'text-on-surface-variant/30'}`}>
                      {plan.is_enabled ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                  <button onClick={() => deletePlan(plan.id)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-error-container/20 transition-colors">
                    <span className="material-symbols-outlined text-error text-xl">delete</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-lg">
                <span className={`material-symbols-outlined text-base ${index === 0 ? 'text-primary' : index === 1 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                  {index === 2 ? 'restaurant_menu' : 'restaurant'}
                </span>
                <span className="text-xs font-medium text-on-surface-variant">{plan.amount_g}g</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button onClick={() => setIsAddingPlan(true)} className="fixed bottom-32 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white shadow-[0px_20px_40px_rgba(155,69,0,0.25)] flex items-center justify-center active:scale-90 transition-transform z-40">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {isAddingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">添加定时计划</h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">计划名称</label>
                <input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} required className="w-full px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-low" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">时间 (HH:MM)</label>
                <input type="time" value={newPlanTime} onChange={e => setNewPlanTime(e.target.value)} required className="w-full px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-low" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">份量 (克)</label>
                <input type="number" value={newPlanAmount} onChange={e => setNewPlanAmount(Number(e.target.value))} required className="w-full px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-low" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">重复</label>
                <div className="flex justify-between gap-1">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDaySelection(day.value)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                        newPlanDays.includes(day.value) 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingPlan(false)} className="px-4 py-2 rounded-xl font-semibold text-secondary hover:bg-surface-container">取消</button>
                <button type="submit" className="px-4 py-2 rounded-xl font-semibold bg-primary text-white hover:bg-primary-container">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
