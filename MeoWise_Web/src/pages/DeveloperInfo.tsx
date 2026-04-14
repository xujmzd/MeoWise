import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DeveloperInfo() {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const softwareTeam = [
    {
      role: '软件开发工程师',
      name: '徐建栋',
      avatar: '👨‍💻',
      responsibilities: ['前端开发', '后端开发', '系统架构'],
      description: '负责全栈开发，包括 React 前端界面、FastAPI 后端服务及系统架构设计。'
    },
    {
      role: '嵌入式软件工程师',
      name: '张行飞',
      avatar: '🔧',
      responsibilities: ['固件开发', '通信协议', '设备驱动'],
      description: '负责智能喂食器固件开发，实现 MQTT 通信协议及各类传感器驱动。'
    },
    {
      role: '嵌入式软件工程师',
      name: '刘倩楠',
      avatar: '🔧',
      responsibilities: ['固件开发', '通信协议', '设备驱动'],
      description: '负责智能喂食器固件开发，实现 MQTT 通信协议及各类传感器驱动。'
    },
    {
      role: '嵌入式硬件工程师',
      name: '齐梓凡',
      avatar: '⚡',
      responsibilities: ['PCB设计', '电路调试', '硬件测试'],
      description: '负责设备硬件设计，包括主控板、称重模块及电源管理电路。'
    }
  ];

  const softwareStack = [
    { category: '前端技术', icon: 'web', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Capacitor'] },
    { category: '后端技术', icon: 'dns', items: ['Python 3.12', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'Uvicorn'] },
    { category: '通信与协议', icon: 'swap_horiz', items: ['MQTT (EMQX)', 'WebSocket', 'REST API', 'JWT认证'] },
    { category: '部署与运维', icon: 'cloud', items: ['Docker', 'Nginx', 'GitHub Actions', 'EMQX Cloud'] }
  ];

  const hardwareStack = [
    { category: '主控芯片', icon: 'memory', items: ['ESP32-S3', '双核 240MHz', '512KB SRAM', '4MB Flash'] },
    { category: '传感器模块', icon: 'sensors', items: ['HX711 称重模块', '红外检测传感器', '温湿度传感器', 'WiFi 信号检测'] },
    { category: '执行机构', icon: 'settings', items: ['步进电机（投喂）', '舵机（搅拌）', 'LED 状态指示', '蜂鸣器提示'] },
    { category: '电源管理', icon: 'battery_charging_full', items: ['DC 5V 输入', 'Type-C 接口', '低功耗待机', '过流保护'] }
  ];

  const otherInfo = [
    { label: '项目名称', value: 'MeoWise 喵食记', icon: 'pets' },
    { label: '当前版本', value: 'v4.12.0 (Build 902)', icon: 'tag' },
    { label: '开源协议', value: 'Apache-2.0 License', icon: 'gavel' },
    { label: '联系方式', value: 'xujmzd@gmail.com', icon: 'mail' },
    { label: '更多项目', value: 'github.com/xujmzd', icon: 'code' }
  ];

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-secondary">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">开发团队</h1>
      </div>

      {/* 开发团队介绍 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">groups</span>
          开发团队
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {softwareTeam.map((member, index) => (
            <div key={index} className="bg-surface-container-low rounded-2xl p-6 hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{member.avatar}</span>
                <div>
                  <p className="font-bold text-on-surface">{member.name}</p>
                  <p className="text-xs font-semibold text-primary">{member.role}</p>
                </div>
              </div>
              <p className="text-sm text-secondary mb-4">{member.description}</p>
              <div className="flex flex-wrap gap-2">
                {member.responsibilities.map((resp, i) => (
                  <span key={i} className="text-[10px] font-bold text-on-primary bg-primary px-2 py-1 rounded-full">
                    {resp}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 软件技术栈 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">code</span>
          软件技术栈
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {softwareStack.map((stack, index) => (
            <div key={index} className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{stack.icon}</span>
                </div>
                <h3 className="font-bold text-on-surface">{stack.category}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stack.items.map((item, i) => (
                  <span key={i} className="text-xs font-medium text-on-surface bg-surface-container-highest px-3 py-1.5 rounded-lg">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 硬件技术栈 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">hardware</span>
          硬件技术栈
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hardwareStack.map((stack, index) => (
            <div key={index} className="bg-surface-container-low rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">{stack.icon}</span>
                </div>
                <h3 className="font-bold text-on-surface">{stack.category}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stack.items.map((item, i) => (
                  <span key={i} className="text-xs font-medium text-on-surface bg-surface-container-highest px-3 py-1.5 rounded-lg">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 系统架构图 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">account_tree</span>
          系统架构
        </h2>
        <div className="bg-surface-container-low rounded-2xl p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-primary-container px-6 py-3 rounded-xl">
              <p className="font-bold text-on-primary-container text-center">喵食记 APP（React + Capacitor）</p>
              <p className="text-xs text-center text-on-primary-container/70">iOS / Android / Web</p>
            </div>
            <span className="material-symbols-outlined text-secondary">arrow_downward</span>
            <div className="bg-secondary-fixed px-6 py-3 rounded-xl">
              <p className="font-bold text-on-secondary-fixed text-center">后端服务（FastAPI + Python）</p>
              <p className="text-xs text-center text-on-secondary-fixed/70">REST API / 认证 / 业务逻辑</p>
            </div>
            <span className="material-symbols-outlined text-secondary">arrow_downward</span>
            <div className="flex gap-4">
              <div className="bg-tertiary-fixed px-6 py-3 rounded-xl">
                <p className="font-bold text-on-tertiary-fixed text-center">MQTT Broker（EMQX）</p>
                <p className="text-xs text-center text-on-tertiary-fixed/70">消息路由 / 在线管理</p>
              </div>
              <div className="bg-tertiary-fixed px-6 py-3 rounded-xl">
                <p className="font-bold text-on-tertiary-fixed text-center">数据库（PostgreSQL）</p>
                <p className="text-xs text-center text-on-tertiary-fixed/70">用户 / 设备 / 记录</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary">arrow_downward</span>
            <div className="bg-error-container px-6 py-3 rounded-xl">
              <p className="font-bold text-on-error-container text-center">智能喂食器（ESP32-S3）</p>
              <p className="text-xs text-center text-on-error-container/70">称重 / 投喂 / 猫咪识别</p>
            </div>
          </div>
        </div>
      </section>

      {/* 其他信息 */}
      <section>
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">info</span>
          项目信息
        </h2>
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          {otherInfo.map((info, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm">{info.icon}</span>
                <span className="text-secondary text-sm">{info.label}</span>
              </div>
              <span className="text-on-surface font-medium text-sm">{info.value}</span>
            </div>
          ))}
        </div>
       </section>
 
       <div className="pt-8 text-center">
         <p className="text-xs text-secondary">© 2026 MeoWise Team. 用心为每一只猫咪。</p>
       </div>
     </div>
     
     {/* Back to Top Button */}
     {showBackToTop && (
       <button 
         onClick={handleBackToTop}
         className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-4 w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center shadow-lg z-50 hover:bg-primary/90 transition-all duration-200"
       >
         <span className="material-symbols-outlined">arrow_upward</span>
       </button>
     )}
   );
 }
