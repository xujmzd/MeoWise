import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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

  return (
    <>
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-secondary">arrow_back</span>
          </button>
          <h1 className="text-2xl font-headline font-bold text-on-surface">隐私政策</h1>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 space-y-6">
          <p className="text-sm text-secondary">生效日期：2026年1月1日</p>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-on-surface">一、引言</h2>
            <p className="text-sm text-secondary">生效日期：2026年1月1日</p>
            <p className="text-secondary leading-relaxed">
              喵食记（以下简称"我们"）尊重并保护所有用户的个人隐私信息。本隐私政策适用于您通过我们的移动应用程序和网站（统称"服务"）提供的个人信息。我们承诺按照本隐私政策收集、使用、存储和分享您的信息。
            </p>
            <p className="text-secondary leading-relaxed">
              使用我们的服务即表示您同意本隐私政策中描述的数据处理方式。如果您不同意本政策，请停止使用我们的服务。
            </p>
          </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">二、我们收集的信息</h2>
          
          <h3 className="font-semibold text-on-surface">2.1 账户信息</h3>
          <p className="text-secondary leading-relaxed">
            当您注册账户时，我们会收集您的电子邮件地址、手机号码和昵称。这些信息用于账户验证、登录认证以及向您发送服务通知。
          </p>

          <h3 className="font-semibold text-on-surface">2.2 宠物信息</h3>
          <p className="text-secondary leading-relaxed">
            您在应用中添加的宠物信息，包括宠物名称、体重、头像等，用于为您提供个性化的喂养建议和健康报告。
          </p>

          <h3 className="font-semibold text-on-surface">2.3 设备数据</h3>
          <p className="text-secondary leading-relaxed">
            当您使用我们的智能喂食设备时，我们会收集以下数据以提供服务：
          </p>
          <ul className="list-disc list-inside text-secondary space-y-2 ml-4">
            <li>设备状态信息（信号强度、粮仓余量等）</li>
            <li>喂食记录（喂食时间、投喂量）</li>
            <li>进食记录（宠物进食时间、进食量、进食时长）</li>
            <li>设备设置和喂食计划</li>
          </ul>

          <h3 className="font-semibold text-on-surface">2.4 使用数据</h3>
          <p className="text-secondary leading-relaxed">
            我们可能会收集您与服务互动的信息，包括应用使用时长、功能使用频率、错误日志等，用于改善服务质量和用户体验。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">三、我们如何使用您的信息</h2>
          <p className="text-secondary leading-relaxed">我们使用收集的信息用于：</p>
          <ul className="list-disc list-inside text-secondary space-y-2 ml-4">
            <li>提供、维护和改进我们的服务</li>
            <li>管理您的账户并提供客户支持</li>
            <li>向您发送服务通知、更新和安全警报</li>
            <li>分析使用情况以优化应用功能和用户体验</li>
            <li>检测和预防欺诈或滥用行为</li>
            <li>遵守法律法规要求</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">四、数据存储与安全</h2>
          <p className="text-secondary leading-relaxed">
            我们采用行业标准的安全措施保护您的个人信息，包括加密传输、安全存储和访问控制。您的数据存储在安全的云服务器上，我们定期审查和更新安全实践。
          </p>
          <p className="text-secondary leading-relaxed">
            我们仅在实现本政策所述目的所需的时间内保留您的个人信息。当您删除账户时，我们将删除或匿名化您的个人信息，除非法律要求保留。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">五、信息共享</h2>
          <p className="text-secondary leading-relaxed">
            我们不会出售您的个人信息。我们可能在以下情况下共享您的信息：
          </p>
          <ul className="list-disc list-inside text-secondary space-y-2 ml-4">
            <li>经您同意</li>
            <li>与服务提供商共享（如云存储、支付处理），他们受保密协议约束</li>
            <li>遵守法律法规或响应法律程序</li>
            <li>保护我们的权利、财产或安全，以及用户或公众的权利</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">六、您的权利</h2>
          <p className="text-secondary leading-relaxed">您有权：</p>
          <ul className="list-disc list-inside text-secondary space-y-2 ml-4">
            <li>访问和获取您的个人信息副本</li>
            <li>更正不准确或不完整的信息</li>
            <li>删除您的个人信息</li>
            <li>限制或反对我们处理您的信息</li>
            <li>撤回您的同意</li>
            <li>导出您的数据</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">七、儿童隐私</h2>
          <p className="text-secondary leading-relaxed">
            我们的服务不面向16岁以下的儿童。我们不会故意收集16岁以下儿童的个人信息。如果我们发现收集了此类信息，将立即删除。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">八、隐私政策变更</h2>
          <p className="text-secondary leading-relaxed">
            我们可能会不时更新本隐私政策。当我们做出重大变更时，将在应用内通知您，并更新本页面顶部的"生效日期"。建议您定期查看本政策以了解最新信息。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">九、联系我们</h2>
          <p className="text-secondary leading-relaxed">
            如果您对本隐私政策有任何问题、意见或请求，请通过以下方式联系我们：
          </p>
          <p className="text-secondary">
            电子邮件：xujmzd@gmail.com<br />
          </p>
        </section>

         <div className="pt-6 border-t border-outline-variant/10">
           <p className="text-xs text-secondary text-center">
             © 2026 喵食记 MeoWise. 保留所有权利。
           </p>
         </div>
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
   </>
 );
}
