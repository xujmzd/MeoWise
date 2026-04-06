import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CAT_AVATARS } from '../constants/avatars';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useToast } from '../components/Toast';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

// 格式化时间差为友好的显示文本
const formatTimeAgo = (timestamp: string): string => {
  const diffMs = new Date().getTime() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return `${Math.floor(diffDays / 30)}个月前`;
};

// 触发原生触觉反馈
const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Silent fail on haptic error
    }
  }
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const initialDeviceId = searchParams.get('deviceId') ? Number(searchParams.get('deviceId')) : null;
  
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(initialDeviceId);
  const [recentEating, setRecentEating] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingBowl, setIsUpdatingBowl] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({ name: '', standard_weight_kg: 4.5, avatar_id: 0 });
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const res = await fetch('/api/v1/devices/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
        if (data.length > 0) {
          // 优先使用 URL 参数中的 deviceId，否则使用默认设备
          const targetDeviceId = initialDeviceId || (selectedDeviceId || data[0].id);
          setSelectedDeviceId(targetDeviceId);
          
          // Try to fetch recent eating and activities
          try {
            const [eatingRes, activitiesRes] = await Promise.all([
              fetch(`/api/v1/feeding_plans/activities?device_id=${targetDeviceId}&limit=1&activity_type=eating`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch(`/api/v1/feeding_plans/activities?device_id=${targetDeviceId}&limit=5&activity_type=all`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            ]);
            
            if (eatingRes.ok) {
              const eatingData = await eatingRes.json();
              if (eatingData.length > 0) {
                setRecentEating(eatingData[0]);
              }
            }
            if (activitiesRes.ok) {
              setRecentActivities(await activitiesRes.json());
            }
          } catch (e) {
            console.error("Failed to fetch activities", e);
          }
        }
      }
      
      // Fetch cats
      const catsRes = await fetch('/api/v1/cats/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (catsRes.ok) {
        setCats(await catsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  }, [navigate, selectedDeviceId, initialDeviceId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();
  }, [fetchData]);

  const handleRefresh = async () => {
    await triggerHaptic(ImpactStyle.Light);
    await fetchData();
  };

  const { pullProps, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const [isRefreshingDevice, setIsRefreshingDevice] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  const handleRefreshDevice = async () => {
    setIsRefreshingDevice(true);
    await triggerHaptic(ImpactStyle.Light);
    await fetchData();
    setTimeout(() => setIsRefreshingDevice(false), 500);
  };

  const handleDeviceSelect = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
    setShowDeviceSelector(false);
    triggerHaptic(ImpactStyle.Light);
  };

  const device = devices.find(d => d.id === selectedDeviceId) || devices[0];

  const handleManualFeed = async () => {
    if (!device) return;
    await triggerHaptic(ImpactStyle.Medium);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/devices/${device.id}/manual_feed?amount_g=10`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('放粮成功！', 'success');
        setIsUpdatingBowl(true);
        setTimeout(() => setIsUpdatingBowl(false), 5000);
      } else {
        showToast('放粮失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
    }
  };

  const handleSaveCat = async () => {
    await triggerHaptic(ImpactStyle.Light);
    const token = localStorage.getItem('token');
    try {
      const url = editingCatId ? `/api/v1/cats/${editingCatId}` : '/api/v1/cats';
      const method = editingCatId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(catForm),
      });
      if (res.ok) {
        const catsRes = await fetch('/api/v1/cats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (catsRes.ok) {
          setCats(await catsRes.json());
        }
        setIsAddingCat(false);
        setEditingCatId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm('确定要删除这只猫咪吗？')) return;
    await triggerHaptic(ImpactStyle.Heavy);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/cats/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCats(cats.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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

  return (
    <div className="py-4 space-y-6" {...pullProps}>
      {/* Pull to Refresh Indicator */}
      {(isRefreshing || pullDistance > 0) && (
        <div 
          className="flex justify-center py-2 transition-all duration-200"
          style={{ opacity: isRefreshing ? 1 : Math.min(pullDistance / 80, 1) }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}

      {/* Device Status Header */}
      <section className="bg-surface-container-low rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1 relative">
                {devices.length > 1 ? (
                  <button 
                    onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                    className="flex items-center gap-1 bg-transparent font-headline text-xl font-bold text-on-background border-none outline-none cursor-pointer hover:opacity-80"
                  >
                    {device.name}
                    <span className="material-symbols-outlined text-secondary text-lg">expand_more</span>
                  </button>
                ) : (
                  <h2 className="font-headline text-xl font-bold text-on-background">
                    {device.name}
                  </h2>
                )}
                {showDeviceSelector && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-surface-container-low rounded-xl shadow-lg z-50 overflow-hidden animate-slide-down">
                    {devices.map(d => (
                      <button
                        key={d.id}
                        onClick={() => handleDeviceSelect(d.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-surface-container transition-colors ${d.id === selectedDeviceId ? 'bg-primary-container/30' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-on-surface">{d.name}</span>
                          {d.id === selectedDeviceId && (
                            <span className="material-symbols-outlined text-primary text-lg">check</span>
                          )}
                        </div>
                        <span className="text-xs text-secondary">{d.wifi_ssid || '未知WiFi'}</span>
                      </button>
                    ))}
                  </div>
                )}
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  在线
                </span>
              </div>
</div>
            </div>
            <div className="flex items-center gap-2">
              <button
              onClick={handleRefreshDevice}
              className="tap-target w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-primary active:scale-95 transition-all"
              title="刷新设备信息"
            >
              <span className={`material-symbols-outlined ${isRefreshingDevice ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary font-bold">
                <span className="material-symbols-outlined text-lg">signal_cellular_alt</span>
                <span>{device.signal_strength} dBm</span>
              </div>
              <p className="text-secondary text-xs mt-0.5">
                {device.updated_at ? `${formatTimeAgo(device.updated_at)}更新` : '从未更新'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Feed Button */}
        <button 
          onClick={handleManualFeed}
          disabled={isUpdatingBowl}
          className="w-full cta-gradient text-white py-4 rounded-xl font-bold touch-active disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isUpdatingBowl ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              放粮中...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">restaurant</span>
              立即放粮 (10g)
            </>
          )}
        </button>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        {/* Bowl Status */}
        <div className="bg-surface-container-low rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-secondary text-xs">食盆重量</span>
            <span className="material-symbols-outlined text-primary text-lg">scale</span>
          </div>
          <div className="flex items-baseline gap-1">
            {isUpdatingBowl ? (
              <span className="text-secondary">--</span>
            ) : (
              <>
                <span className="font-headline text-3xl font-extrabold text-on-background">
                  {device.bowl_weight_g}
                </span>
                <span className="text-secondary text-sm">g</span>
              </>
            )}
          </div>
          <p className="text-secondary text-xs mt-2">
            {recentEating 
              ? `上次: ${formatTimeAgo(recentEating.time)}` 
              : '暂无进食记录'}
          </p>
        </div>

        {/* Silo Status */}
        <div className="bg-surface-container-low rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-secondary text-xs">粮桶余量</span>
            <span className="material-symbols-outlined text-tertiary text-lg">database</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-3xl font-extrabold text-on-background">
              {device.silo_remaining_pct}%
            </span>
          </div>
          <p className="text-secondary text-xs mt-2">
            预计 {Math.max(1, Math.round((device.silo_remaining_pct / 100 * 2500) / 60))} 天
          </p>
        </div>
      </section>

      {/* Add New Device CTA */}
      <section 
        onClick={() => navigate('/profile')}
        className="bg-surface-container-highest rounded-2xl p-4 flex items-center gap-4 touch-active cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">add_circle</span>
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-on-surface">添加新设备</h4>
          <p className="text-secondary text-xs">配网喂食器或饮水机</p>
        </div>
        <span className="material-symbols-outlined text-secondary">chevron_right</span>
      </section>

      {/* My Pets Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold">我的宠物</h3>
          <button 
            onClick={() => { 
              setCatForm({ name: '', standard_weight_kg: 4.5, avatar_id: 0 }); 
              setEditingCatId(null); 
              setIsAddingCat(true); 
            }} 
            className="text-primary font-bold text-sm flex items-center gap-1 touch-active tap-target"
          >
            <span className="material-symbols-outlined text-sm">add</span> 添加
          </button>
        </div>
        
        {/* Add/Edit Cat Form */}
        {isAddingCat && (
          <div className="bg-surface-container-low rounded-2xl p-5 mb-4 border border-primary/20 animate-slide-up">
            <h4 className="font-bold mb-4">{editingCatId ? '编辑宠物' : '新增宠物'}</h4>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs text-secondary mb-1">名字</label>
                <input 
                  type="text" 
                  value={catForm.name} 
                  onChange={e => setCatForm({...catForm, name: e.target.value})} 
                  className="w-full bg-surface-container p-3 rounded-xl outline-none" 
                  placeholder="例如：Luna" 
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">体重 (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={catForm.standard_weight_kg} 
                  onChange={e => setCatForm({...catForm, standard_weight_kg: Number(e.target.value)})} 
                  className="w-full bg-surface-container p-3 rounded-xl outline-none" 
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-secondary mb-2">选择头像</label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {CAT_AVATARS.map((avatar, idx) => (
                  <img 
                    key={idx} 
                    src={avatar} 
                    alt={`Avatar ${idx}`} 
                    className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all touch-active flex-shrink-0 ${catForm.avatar_id === idx ? 'border-primary scale-110' : 'border-transparent opacity-60'}`}
                    onClick={() => setCatForm({...catForm, avatar_id: idx})}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAddingCat(false)} 
                className="flex-1 py-3 rounded-xl text-secondary font-bold text-sm bg-surface-container touch-active"
              >
                取消
              </button>
              <button 
                onClick={handleSaveCat} 
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm touch-active"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* Pet List */}
        <div className="space-y-3">
          {cats.map(cat => (
            <div key={cat.id} className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4">
              <img 
                src={CAT_AVATARS[cat.avatar_id || 0]} 
                alt={cat.name} 
                className="w-14 h-14 rounded-full bg-surface-container" 
              />
              <div className="flex-grow">
                <h4 className="font-bold text-on-surface">{cat.name}</h4>
                <p className="text-secondary text-sm">{cat.standard_weight_kg} kg</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    setCatForm({ name: cat.name, standard_weight_kg: cat.standard_weight_kg, avatar_id: cat.avatar_id || 0 }); 
                    setEditingCatId(cat.id); 
                    setIsAddingCat(true); 
                  }} 
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary touch-active tap-target"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button 
                  onClick={() => handleDeleteCat(cat.id)} 
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary touch-active tap-target"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
          {cats.length === 0 && !isAddingCat && (
            <div className="text-center py-8 bg-surface-container-low rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">pets</span>
              <p className="text-secondary text-sm">暂无宠物，请添加</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold">最近活动</h3>
          <button 
            onClick={() => navigate('/report')} 
            className="text-primary font-bold text-sm touch-active tap-target"
          >
            查看全部
          </button>
        </div>
        <div className="space-y-3">
          {recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((activity: any, index: number) => (
              <div key={index} className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'feeding' ? 'bg-[#ffdbc9] text-[#9b4500]' : 'bg-primary-container text-on-primary-container'}`}>
                  <span className="material-symbols-outlined text-xl">
                    {activity.type === 'feeding' ? 'restaurant' : 'pets'}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-on-surface text-sm">
                    {activity.type === 'feeding' ? '喂食已完成' : '宠物进食'}
                  </p>
                  <p className="text-secondary text-xs">
                    {formatTimeAgo(activity.time)} • {activity.amount_g}g
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">history</span>
              <p className="text-secondary text-sm">暂无活动记录</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
