import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useToast } from '../components/Toast';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { formatTimeAgo as formatTimeAgoUtil } from '../utils/date';

const DAYS_OF_WEEK = [
  { value: 'Mon', label: '一' },
  { value: 'Tue', label: '二' },
  { value: 'Wed', label: '三' },
  { value: 'Thu', label: '四' },
  { value: 'Fri', label: '五' },
  { value: 'Sat', label: '六' },
  { value: 'Sun', label: '日' },
];

// 触发原生触觉反馈
const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Silent fail
    }
  }
};

export default function Feeding() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [recentFeedings, setRecentFeedings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newPlanName, setNewPlanName] = useState('早餐');
  const [newPlanTime, setNewPlanTime] = useState('08:00');
  const [newPlanAmount, setNewPlanAmount] = useState(20);
  const [newPlanDays, setNewPlanDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  const [manualAmount, setManualAmount] = useState(10);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleRefresh = async () => {
    await triggerHaptic(ImpactStyle.Light);
    await fetchPlans();
  };

  const { pullProps, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const fetchPlans = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const devRes = await fetch('/api/v1/devices/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (devRes.ok) {
        const devicesData = await devRes.json();
        setDevices(devicesData);
        if (devicesData.length > 0) {
          const id = selectedDeviceId || devicesData[0].id;
          if (!selectedDeviceId) setSelectedDeviceId(id);
          
          const res = await fetch(`/api/v1/feeding_plans/?device_id=${id}`, {
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex items-center gap-3 bg-surface-container-low px-6 py-3 rounded-full shadow-lg">
        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
        <span className="text-sm font-medium text-on-surface">思考中...</span>
      </div>
    </div>
  );

  if (!device) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-container-low flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-secondary">wifi_off</span>
        </div>
        <h2 className="font-headline text-xl font-bold mb-2">暂无绑定的设备</h2>
        <p className="text-secondary text-sm mb-8">请先在"我的"页面添加设备</p>
        <button 
          onClick={() => navigate('/profile')} 
          className="cta-gradient text-white px-8 py-3 rounded-full font-bold touch-active"
        >
          前往添加设备
        </button>
      </div>
    );
  }

  const handleManualFeed = async () => {
    if (!device) return;
    await triggerHaptic(ImpactStyle.Medium);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/devices/${device.id}/manual_feed?amount_g=${manualAmount}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('手动喂食成功！', 'success');
        fetchPlans();
      } else {
        showToast('喂食失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
    }
  };

  const togglePlan = async (plan: any) => {
    await triggerHaptic(ImpactStyle.Light);
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

  const openEditPlan = (plan: any) => {
    triggerHaptic();
    setEditingPlan(plan);
    setNewPlanName(plan.name);
    setNewPlanTime(plan.time_of_day);
    setNewPlanAmount(plan.amount_g);
    setNewPlanDays(plan.days_of_week ? plan.days_of_week.split(',') : []);
    setIsEditingPlan(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    await triggerHaptic(ImpactStyle.Light);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/feeding_plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newPlanName,
          time_of_day: newPlanTime,
          amount_g: Number(newPlanAmount),
          days_of_week: newPlanDays.join(','),
        }),
      });
      if (res.ok) {
        setIsEditingPlan(false);
        setEditingPlan(null);
        fetchPlans();
        showToast('更新成功', 'success');
      } else {
        showToast('更新计划失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
    }
  };

  const deletePlan = async (planId: number) => {
    if (!confirm('确定要删除此计划吗？')) return;
    await triggerHaptic(ImpactStyle.Heavy);
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
    await triggerHaptic(ImpactStyle.Light);
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
        showToast('添加成功', 'success');
      } else {
        showToast('添加计划失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
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
    return formatTimeAgoUtil(timestamp);
  };

  const formatDays = (daysStr: string) => {
    if (!daysStr) return '每天';
    const days = daysStr.split(',');
    if (days.length === 7) return '每天';
    if (days.length === 0) return '不重复';
    if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) return '工作日';
    if (days.length === 2 && days.includes('Sat') && days.includes('Sun')) return '周末';
    const dayLabels = days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).filter(Boolean);
    return dayLabels.map(l => `周${l}`).join('、');
  };

  const toggleDaySelection = (dayValue: string) => {
    if (newPlanDays.includes(dayValue)) {
      setNewPlanDays(newPlanDays.filter(d => d !== dayValue));
    } else {
      setNewPlanDays([...newPlanDays, dayValue].sort());
    }
  };

  return (
    <div className="py-4 space-y-6" {...pullProps}>
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}
      {/* Manual Feed Section */}
      <section className="bg-surface-container-low rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline text-lg font-bold">手动喂食</h3>
            <p className="text-secondary text-sm">立即投喂一份</p>
          </div>
          <div className={`${bowlStatus.colorClass} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
            <span className="material-symbols-outlined text-sm">{bowlStatus.icon}</span>
            {bowlStatus.text}
          </div>
        </div>

        {/* Amount Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary text-sm">投喂量</span>
            <span className="font-headline text-2xl font-bold text-primary">{manualAmount}g</span>
          </div>
            <div className="relative h-8" style={{ touchAction: 'manipulation' }}>
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-surface-container-high rounded-full" />
              <div 
                className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r from-primary to-orange-500 rounded-full"
                style={{ width: `${((manualAmount - 5) / 45) * 100}%`, transition: 'width 0ms' }}
              />
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={manualAmount}
                onChange={(e) => { setManualAmount(Number(e.target.value)); triggerHaptic(ImpactStyle.Light); }}
                className="absolute top-0 left-0 w-full h-8 appearance-none cursor-pointer z-10"
                style={{ WebkitAppearance: 'none' }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full cta-gradient shadow-lg flex items-center justify-center z-20 pointer-events-none"
                style={{ left: `calc(${((manualAmount - 5) / 45) * 100}% - 16px)` }}
              >
                <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
              </div>
            </div>
          <div className="flex justify-between text-xs text-secondary mt-1">
            <span>5g</span>
            <span>50g</span>
          </div>
        </div>

        {/* Feed Button */}
        <button 
          onClick={handleManualFeed}
          className="w-full cta-gradient text-white py-4 rounded-xl font-bold touch-active flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">restaurant</span>
          立即喂食
        </button>

        {/* Recent Feedings */}
        <div className="mt-6">
          <p className="text-xs text-secondary font-bold mb-3">最近喂食</p>
          {recentFeedings && recentFeedings.length > 0 ? (
            <div className="space-y-2">
              {recentFeedings.map((feeding: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-lg">restaurant</span>
                    <span className="text-sm">{formatTimeAgo(feeding.time)}</span>
                  </div>
                  <span className="text-sm font-bold">{feeding.amount_g}g</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-secondary text-sm py-4">暂无记录</p>
          )}
        </div>
      </section>

      {/* Feeding Plans Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold">定时计划</h3>
          <span className="text-secondary text-sm">{plans.filter(p => p.is_enabled).length} 个进行中</span>
        </div>
        
        <div className="space-y-3">
          {plans.map((plan, index) => (
            <div key={plan.id} className={`bg-surface-container-low rounded-2xl p-4 ${!plan.is_enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-primary/10 text-primary' : index === 1 ? 'bg-tertiary/10 text-tertiary' : 'bg-on-surface-variant/10'}`}>
                    <span className="material-symbols-outlined text-lg">
                      {index === 0 ? 'wb_twilight' : index === 1 ? 'wb_sunny' : 'dark_mode'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold">{plan.name}</h4>
                    <p className="text-secondary text-sm">{plan.time_of_day}</p>
                  </div>
                </div>
                <button 
                  onClick={() => togglePlan(plan)}
                  className="touch-active tap-target"
                >
                  <span className={`material-symbols-outlined text-4xl ${plan.is_enabled ? 'text-primary' : 'text-secondary/30'}`}>
                    {plan.is_enabled ? 'toggle_on' : 'toggle_off'}
                  </span>
                </button>
              </div>
              <div className="flex items-center justify-between bg-surface-container/50 rounded-xl p-3">
                <span className="text-sm text-secondary">{formatDays(plan.days_of_week)}</span>
                <span className="text-sm font-bold">{plan.amount_g}g</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => openEditPlan(plan)}
                  className="flex-1 py-2 rounded-lg bg-surface-container text-sm touch-active"
                >
                  编辑
                </button>
                <button 
                  onClick={() => deletePlan(plan.id)}
                  className="px-4 py-2 rounded-lg bg-error-container text-on-error-container text-sm touch-active"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          
          {plans.length === 0 && (
            <div className="text-center py-8 bg-surface-container-low rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">schedule</span>
              <p className="text-secondary text-sm">暂无定时计划</p>
            </div>
          )}
        </div>
      </section>

      {/* Add Plan FAB */}
      <button 
        onClick={() => { setIsAddingPlan(true); triggerHaptic(); }}
        className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-4 w-14 h-14 rounded-full cta-gradient text-white fab flex items-center justify-center touch-active z-40"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Add Plan Modal */}
      {isAddingPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg p-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-slide-up">
            <h3 className="text-xl font-bold mb-6">添加定时计划</h3>
            <form onSubmit={handleCreatePlan} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">计划名称</label>
                <input 
                  type="text" 
                  value={newPlanName} 
                  onChange={e => setNewPlanName(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">时间</label>
                <input 
                  type="time" 
                  value={newPlanTime} 
                  onChange={e => setNewPlanTime(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">份量 (克)</label>
                <input 
                  type="number" 
                  value={newPlanAmount} 
                  onChange={e => setNewPlanAmount(Number(e.target.value))} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">重复</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDaySelection(day.value)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold touch-active ${
                        newPlanDays.includes(day.value) 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingPlan(false)} 
                  className="flex-1 py-4 rounded-xl font-semibold text-secondary bg-surface-container touch-active"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 rounded-xl font-semibold bg-primary text-white touch-active"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {isEditingPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg p-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-slide-up">
            <h3 className="text-xl font-bold mb-6">编辑定时计划</h3>
            <form onSubmit={handleUpdatePlan} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">计划名称</label>
                <input 
                  type="text" 
                  value={newPlanName} 
                  onChange={e => setNewPlanName(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">时间</label>
                <input 
                  type="time" 
                  value={newPlanTime} 
                  onChange={e => setNewPlanTime(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">份量 (克)</label>
                <input 
                  type="number" 
                  value={newPlanAmount} 
                  onChange={e => setNewPlanAmount(Number(e.target.value))} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">重复</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDaySelection(day.value)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold touch-active ${
                        newPlanDays.includes(day.value) 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEditingPlan(false); setEditingPlan(null); }} 
                  className="flex-1 py-4 rounded-xl font-semibold text-secondary bg-surface-container touch-active"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 rounded-xl font-semibold bg-primary text-white touch-active"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
