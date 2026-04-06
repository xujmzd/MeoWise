import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      if (res.ok) {
        const data = await res.json();
        setResetToken(data.reset_token);
        setStep(2);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`验证失败: ${errorData.detail || '邮箱或手机号不匹配'}`);
      }
    } catch (err) {
      console.error(err);
      alert('网络错误');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      if (res.ok) {
        alert('密码重置成功，请重新登录');
        navigate('/login');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`重置失败: ${errorData.detail || '未知错误'}`);
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
          <p className="text-secondary font-medium">找回您的喵食记密码</p>
        </div>
        <div className="bg-surface-container-low p-8 md:p-10 rounded-[2rem] space-y-8 shadow-sm">
          <div className="space-y-2">
            <h2 className="font-headline font-bold text-2xl text-on-surface">
              {step === 1 ? '验证身份' : '重置密码'}
            </h2>
            <p className="text-secondary text-sm">
              {step === 1 ? '请输入您注册时使用的邮箱和手机号。' : '请输入您的新密码。'}
            </p>
          </div>
          
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleVerify}>
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
              <button
                className="w-full cta-gradient text-on-primary font-bold py-4 rounded-full shadow-[0px_10px_20px_rgba(155,69,0,0.15)] hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                type="submit"
              >
                <span>验证身份</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="newPassword">新密码</label>
                <div className="relative">
                  <input
                    className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="material-symbols-outlined text-outline text-xl">lock</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="confirmPassword">确认新密码</label>
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
                <span>重置密码</span>
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </button>
            </form>
          )}
          
          <div className="text-center pt-2">
            <p className="text-secondary text-sm">
              记起密码了？
              <Link className="text-primary font-bold ml-1 hover:underline" to="/login">返回登录</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
