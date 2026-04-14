import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_AVATARS } from '../constants/avatars';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useToast } from '../components/Toast';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

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

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Device pairing wizard states
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [deviceWizardStep, setDeviceWizardStep] = useState(1);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [pairingStatus, setPairingStatus] = useState('');
  const [pairedDevice, setPairedDevice] = useState<any>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleRefresh = async () => {
    await triggerHaptic(ImpactStyle.Light);
    await fetchUserAndDevices();
  };

  const { pullProps, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // 格式化更新时间
  const formatUpdateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 30) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const fetchUserAndDevices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setNickname(data.nickname || '');
        setPhone(data.phone || '');
        setAvatarId(data.avatar_id || 0);
      }

      const devRes = await fetch('/api/v1/devices/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (devRes.ok) {
        setDevices(await devRes.json());
      }

      const catsRes = await fetch('/api/v1/cats/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (catsRes.ok) {
        setCats(await catsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserAndDevices();
  }, [navigate]);

  const handleLogout = async () => {
    await triggerHaptic(ImpactStyle.Medium);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerHaptic(ImpactStyle.Light);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ nickname, phone, avatar_id: avatarId }),
      });
      if (res.ok) {
        showToast('个人信息更新成功', 'success');
        setIsEditingProfile(false);
        fetchUserAndDevices();
      } else {
        showToast('更新失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast('两次输入的新密码不一致', 'warning');
      return;
    }
    await triggerHaptic(ImpactStyle.Light);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/auth/me/change_password/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      if (res.ok) {
        showToast('密码修改成功，请重新登录', 'success');
        handleLogout();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`修改失败: ${errorData.detail || '未知错误'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
    }
  };

  const resetDeviceWizard = () => {
    setIsAddingDevice(false);
    setDeviceWizardStep(1);
    setNewDeviceName('');
    setWifiName('');
    setWifiPassword('');
    setPairingStatus('');
    setPairedDevice(null);
  };

  const handleNextStep = () => {
    if (deviceWizardStep === 1) {
      setDeviceWizardStep(2);
    } else if (deviceWizardStep === 2) {
      handleStartPairing();
    }
  };

  const handleStartPairing = async () => {
    setDeviceWizardStep(3);
    setPairingStatus('正在搜索设备...');
    
    setTimeout(() => setPairingStatus('正在连接设备...'), 1500);
    setTimeout(() => setPairingStatus('正在配置网络...'), 3000);
    setTimeout(() => setPairingStatus('正在验证连接...'), 4500);
    
    setTimeout(async () => {
      setPairingStatus('设备绑定中...');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/devices/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            name: newDeviceName, 
            device_sn: `SN${Date.now()}`,
            wifi_ssid: wifiName,
            wifi_password: wifiPassword
          }),
        });
        if (res.ok) {
          const device = await res.json();
          setPairedDevice(device);
          setPairingStatus('');
          setDeviceWizardStep(4);
          fetchUserAndDevices();
        } else {
          throw new Error('绑定失败');
        }
      } catch (err) {
        setPairingStatus('配网失败，请重试');
        setTimeout(() => setDeviceWizardStep(2), 2000);
      }
    }, 6000);
  };

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="py-4 space-y-6" {...pullProps}>
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}
      {/* Profile Header */}
      <section className="bg-surface-container-low rounded-2xl p-5">
        <div className="flex items-center gap-5">
           <div className="relative">
             <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-surface-container-high bg-surface-container shadow-lg">
               <img
                 alt="头像"
                 className="w-full h-full object-cover"
                 src={USER_AVATARS[user.avatar_id] || USER_AVATARS[0]}
               />
             </div>
           </div>
            <button 
              onClick={() => { setIsEditingProfile(true); triggerHaptic(); }} 
              className="absolute bottom-0 right-0 cta-gradient text-white w-7 h-7 rounded-full shadow-lg flex items-center justify-center touch-active"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-headline font-bold text-on-background">
              {user.nickname || user.email.split('@')[0]}
            </h1>
            <p className="text-secondary text-sm">
              自 {new Date(user.created_at || Date.now()).getFullYear()} 年起
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-primary/10 px-2 py-0.5 rounded-full text-[10px] font-medium text-primary">
                主要照顾者
              </span>
              <span className="bg-tertiary-fixed/50 px-2 py-0.5 rounded-full text-[10px] font-medium text-on-tertiary-fixed-variant">
                {cats.length} 只宠物
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Account Info */}
      <section className="bg-surface-container-low rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold">账户信息</h2>
          <button 
            onClick={() => { setIsChangingPassword(true); triggerHaptic(); }}
            className="text-primary text-sm font-bold touch-active tap-target"
          >
            修改密码
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary text-sm">用户名</span>
            <span className="text-on-surface font-medium text-sm">{user.nickname || '未设置'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary text-sm">邮箱</span>
            <span className="text-on-surface font-medium text-sm truncate max-w-[180px]">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary text-sm">手机号</span>
            <span className="text-on-surface font-medium text-sm">{user.phone || '未设置'}</span>
          </div>
        </div>
      </section>

      {/* My Devices */}
      <section className="bg-surface-container-low rounded-2xl p-5">
        <h2 className="font-headline text-lg font-bold mb-4">我的设备</h2>
        <div className="space-y-3">
          {devices.length === 0 ? (
            <p className="text-secondary text-sm text-center py-4">暂无绑定设备</p>
          ) : (
            devices.map(device => (
              <div 
                key={device.id} 
                onClick={() => { navigate(`/dashboard?deviceId=${device.id}`); triggerHaptic(); }}
                className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl touch-active"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">router</span>
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-on-surface">{device.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${device.is_online !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-xs text-secondary">{device.is_online !== false ? '在线' : '离线'}</span>
                    {device.updated_at && (
                      <span className="text-xs text-secondary">• {formatUpdateTime(device.updated_at)}</span>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary">chevron_right</span>
              </div>
            ))
          )}
        </div>
        <button 
          onClick={() => { setIsAddingDevice(true); triggerHaptic(); }}
          className="w-full mt-4 py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl touch-active flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          添加新设备
        </button>
      </section>

      {/* Help & Support */}
      <section className="bg-surface-container-low rounded-2xl p-5">
        <h2 className="font-headline text-lg font-bold mb-4">帮助与支持</h2>
        <div className="space-y-1">
          <div 
            onClick={() => { navigate('/developer-info'); triggerHaptic(); }}
            className="flex items-center justify-between py-3 touch-active"
          >
            <span className="text-on-surface">开发人员信息</span>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </div>
          <div 
            onClick={() => { navigate('/privacy-policy'); triggerHaptic(); }}
            className="flex items-center justify-between py-3 touch-active"
          >
            <span className="text-on-surface">隐私政策</span>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </div>
          <div 
            onClick={() => { navigate('/terms-of-service'); triggerHaptic(); }}
            className="flex items-center justify-between py-3 touch-active"
          >
            <span className="text-on-surface">服务协议</span>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </div>
        </div>
        <div className="pt-4 mt-4 border-t border-outline-variant/10 text-center">
          <p className="text-xs text-secondary">软件版本 v4.12.0</p>
        </div>
      </section>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full py-4 bg-error-container text-on-error-container font-bold rounded-2xl touch-active flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">logout</span>
        退出登录
      </button>

      {/* Add Device Modal */}
      {isAddingDevice && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg p-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">添加新设备</h3>
              <button onClick={resetDeviceWizard} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center touch-active">
                <span className="material-symbols-outlined text-secondary">close</span>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step < deviceWizardStep ? 'bg-primary text-white' : 
                    step === deviceWizardStep ? 'bg-primary-container text-white ring-2 ring-primary' : 
                    'bg-surface-container text-secondary'
                  }`}>
                    {step < deviceWizardStep ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-6 h-0.5 ${step < deviceWizardStep ? 'bg-primary' : 'bg-surface-container'}`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Name Device */}
            {deviceWizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-secondary text-sm">为设备起一个容易识别的名字</p>
                <div className="flex items-center justify-center py-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-4xl">router</span>
                  </div>
                </div>
                <input 
                  type="text" 
                  value={newDeviceName} 
                  onChange={e => setNewDeviceName(e.target.value)} 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low text-lg" 
                  placeholder="例如：客厅喂食器"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {['客厅喂食器', '卧室喂食器', '自动喂食器'].map(suggestion => (
                    <button 
                      key={suggestion}
                      onClick={() => setNewDeviceName(suggestion)}
                      className="text-sm bg-surface-container px-4 py-2 rounded-full text-secondary touch-active"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: WiFi Config */}
            {deviceWizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-secondary text-sm">配置设备的网络连接</p>
                <div className="bg-warning-container/30 p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-warning">info</span>
                  <p className="text-sm text-on-warning-container">请确保设备处于配网模式（指示灯闪烁）</p>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">wifi</span>
                  <input 
                    type="text" 
                    value={wifiName} 
                    onChange={e => setWifiName(e.target.value)} 
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                    placeholder="WiFi 名称"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">lock</span>
                  <input 
                    type="password" 
                    value={wifiPassword} 
                    onChange={e => setWifiPassword(e.target.value)} 
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                    placeholder="WiFi 密码"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Connecting */}
            {deviceWizardStep === 3 && (
              <div className="space-y-6 py-8">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <span className="material-symbols-outlined text-primary text-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      router
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg mb-2">{pairingStatus}</p>
                  <p className="text-sm text-secondary">请保持设备通电且不要关闭应用</p>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {deviceWizardStep === 4 && (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-success text-4xl">check_circle</span>
                  </div>
                  <h4 className="font-headline text-xl font-bold">添加成功！</h4>
                  <p className="text-secondary text-sm mt-2">设备已准备就绪</p>
                </div>
                {pairedDevice && (
                  <div className="bg-surface-container p-4 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">router</span>
                      </div>
                      <div>
                        <p className="font-bold">{pairedDevice.name}</p>
                        <p className="text-xs text-secondary">已连接</p>
                      </div>
                    </div>
                  </div>
                )}
                <button 
                  onClick={resetDeviceWizard}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl touch-active"
                >
                  完成
                </button>
              </div>
            )}

            {/* Bottom Buttons */}
            {deviceWizardStep <= 2 && (
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={resetDeviceWizard}
                  className="flex-1 py-4 rounded-xl font-semibold text-secondary bg-surface-container touch-active"
                >
                  取消
                </button>
                <button 
                  onClick={handleNextStep}
                  disabled={
                    (deviceWizardStep === 1 && !newDeviceName.trim()) ||
                    (deviceWizardStep === 2 && (!wifiName.trim() || !wifiPassword.trim()))
                  }
                  className="flex-1 py-4 rounded-xl font-semibold bg-primary text-white touch-active disabled:opacity-50"
                >
                  {deviceWizardStep === 2 ? '开始配网' : '下一步'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg p-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-slide-up">
            <h3 className="text-xl font-bold mb-6">修改个人信息</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">选择头像</label>
                <div className="grid grid-cols-4 gap-3">
                  {USER_AVATARS.map((avatar, index) => (
                    <div 
                      key={index} 
                      className={`cursor-pointer rounded-full overflow-hidden border-2 transition-all touch-active ${avatarId === index ? 'border-primary scale-110 shadow-md' : 'border-transparent'}`}
                      onClick={() => setAvatarId(index)}
                    >
                      <img src={avatar} alt={`头像 ${index}`} className="w-full h-full object-cover aspect-square" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">昵称</label>
                <input 
                  type="text" 
                  value={nickname} 
                  onChange={e => setNickname(e.target.value)} 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">手机号</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)} 
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

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg p-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] animate-slide-up">
            <h3 className="text-xl font-bold mb-6">修改密码</h3>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">旧密码</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">新密码</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">确认新密码</label>
                <input 
                  type="password" 
                  value={confirmNewPassword} 
                  onChange={e => setConfirmNewPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface-container-low" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsChangingPassword(false)} 
                  className="flex-1 py-4 rounded-xl font-semibold text-secondary bg-surface-container touch-active"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 rounded-xl font-semibold bg-primary text-white touch-active"
                >
                  确认修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
