import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { USER_AVATARS } from '../constants/avatars';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname, phone, avatar_id: avatarId }),
      });
      if (res.ok) {
        alert('注册成功，请登录');
        navigate('/login');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`注册失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (err) {
      console.error(err);
      alert('网络错误');
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 md:p-12 min-h-screen bg-background">
      <div className="max-w-md w-full mx-auto">
        <div className="flex flex-col items-center mb-10">
          <Logo className="w-12 h-12 mb-2" textClassName="text-3xl text-primary" />
          <p className="text-secondary font-medium">创建您的喵食记账户</p>
        </div>
        <div className="bg-surface-container-low p-8 md:p-10 rounded-[2rem] space-y-8 shadow-sm">
          <div className="space-y-2">
            <h2 className="font-headline font-bold text-2xl text-on-surface">注册</h2>
            <p className="text-secondary text-sm">加入我们，开启智能养宠新体验。</p>
          </div>
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">选择头像</label>
              <div className="grid grid-cols-4 gap-3">
                {USER_AVATARS.map((avatar, index) => (
                  <div 
                    key={index} 
                    className={`cursor-pointer rounded-full overflow-hidden border-2 transition-all ${avatarId === index ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    onClick={() => setAvatarId(index)}
                  >
                    <img src={avatar} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="nickname">昵称</label>
              <div className="relative">
                <input
                  className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                  id="nickname"
                  name="nickname"
                  placeholder="您的昵称"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-outline text-xl">person</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="phone">手机号</label>
              <div className="relative">
                <input
                  className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                  id="phone"
                  name="phone"
                  placeholder="13800000000"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-outline text-xl">phone</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">邮箱地址</label>
              <div className="relative">
                <input
                  className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                  id="email"
                  name="email"
                  placeholder="hello@meowise.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-outline text-xl">mail</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="password">密码</label>
              <div className="relative">
                <input
                  className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-outline text-xl">lock</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="confirmPassword">确认密码</label>
              <div className="relative">
                <input
                  className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-outline text-xl">lock</span>
                </div>
              </div>
            </div>
            <button
              className="w-full cta-gradient text-on-primary font-bold py-4 rounded-full shadow-[0px_10px_20px_rgba(155,69,0,0.15)] hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
              type="submit"
            >
              <span>注册</span>
              <span className="material-symbols-outlined text-lg">person_add</span>
            </button>
          </form>
          <div className="text-center pt-2">
            <p className="text-secondary text-sm">
              已有账户？
              <Link className="text-primary font-bold ml-1 hover:underline" to="/login">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
