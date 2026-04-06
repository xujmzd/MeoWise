import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useToast } from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token || data.token);
        showToast('登录成功', 'success');
        navigate('/dashboard');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.detail || '登录失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('网络错误', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 md:p-12 min-h-screen bg-background">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:flex flex-col space-y-8 pr-12">
          <div className="space-y-4">
            <Logo className="w-16 h-16" textClassName="text-5xl text-primary" />
            <p className="font-headline font-bold text-4xl text-on-surface leading-tight tracking-tight mt-4">
              智能喂养，科学<span className="text-primary-container">护宠。</span>
            </p>
            <p className="text-secondary text-lg max-w-md">
              通过精准技术和有机护理，以更科学的方式关爱您的猫咪伴侣。
            </p>
          </div>
          <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-[0px_20px_40px_rgba(155,69,0,0.06)] bg-surface-container-low">
            <img
              alt="A content cat sitting peacefully near a modern pet feeder"
              className="w-full h-full object-cover mix-blend-multiply opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgJkEtRf3VQ47e-FFF9klmKYa4vEWp7gq_j08bg22dPAFL3ck12_VrdIaN4g9Xbz4d2UIWD9qZ_0BESxvf-Gr6VERN1Nv3cARp6z9wIF2nDY9gHZeZz78BUh7heZsbDCwjVYxn5vhN2wOoPKOyhFMryJcjf3ZuZM4QnY63vzYLfg6V5AHq70tBM2H0PyCwP79wp1obxlpLOhxLlQNXZxfpGNjlgwzvEI0GSs63DxxLKwFO8MviMiDkd8BZRynwCNrwpgJET9M46cw"
            />
            <div className="absolute bottom-8 left-8 right-8 meowise-glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">pets</span>
                </div>
                <div>
                  <p className="text-on-surface font-semibold">健康定量</p>
                  <p className="text-secondary text-sm italic">“Luna 的消化状况从未如此好过。”</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Logo className="w-12 h-12 mb-2" textClassName="text-3xl text-primary" />
            <p className="text-secondary font-medium">智能喂养，科学护宠</p>
          </div>
          <div className="bg-surface-container-low p-8 md:p-10 rounded-[2rem] space-y-8">
            <div className="space-y-2">
              <h2 className="font-headline font-bold text-2xl text-on-surface">欢迎回来</h2>
              <p className="text-secondary text-sm">登录您的喵食记账户以管理喂食。</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">邮箱地址</label>
                <div className="relative">
                  <input
                    className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                    id="email"
                    name="email"
                    placeholder="hello@meowise.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="material-symbols-outlined text-outline text-xl">mail</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">密码</label>
                  <Link className="text-xs font-medium text-primary hover:text-primary-container transition-colors" to="/forgot-password">忘记密码？</Link>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-5 py-4 bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/15 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all pr-12"
                    id="password"
                    name="password"
                    placeholder="******"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <button
                className="w-full cta-gradient text-on-primary font-bold py-4 rounded-full shadow-[0px_10px_20px_rgba(155,69,0,0.15)] hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>登录</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
            <div className="text-center pt-2">
              <p className="text-secondary text-sm">
                还没有喂食器？
                <Link className="text-primary font-bold ml-1 hover:underline" to="/register">立即创建</Link>
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-center items-center gap-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">JWT 安全加密</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">隐私保护优先</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
