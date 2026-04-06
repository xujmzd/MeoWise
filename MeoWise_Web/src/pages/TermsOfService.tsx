import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-secondary">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">服务协议</h1>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 space-y-6">
        <p className="text-sm text-secondary">生效日期：2024年1月1日</p>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">一、协议的接受与修改</h2>
          <p className="text-secondary leading-relaxed">
            欢迎使用喵食记（以下简称"本服务"）。本服务由喵食记团队（以下简称"我们"）提供。请您在使用本服务前仔细阅读本协议。
          </p>
          <p className="text-secondary leading-relaxed">
            当您访问、注册或使用本服务时，即表示您已阅读、理解并同意接受本协议的全部条款。如果您不同意本协议的任何条款，请立即停止使用本服务。
          </p>
          <p className="text-secondary leading-relaxed">
            我们保留随时修改本协议的权利，修改后的协议将在应用内公布。继续使用本服务即表示您接受修改后的协议。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">二、服务说明</h2>
          
          <h3 className="font-semibold text-on-surface">2.1 服务内容</h3>
          <p className="text-secondary leading-relaxed">
            喵食记是一款智能宠物喂养管理应用，提供以下功能：
          </p>
          <ul className="list-disc list-inside text-secondary space-y-2 ml-4">
            <li>智能喂食设备的远程控制与管理</li>
            <li>定时喂食计划的创建与管理</li>
            <li>宠物喂食与进食数据的记录与分析</li>
            <li>宠物健康报告与喂养建议</li>
            <li>多宠物档案管理</li>
          </ul>

          <h3 className="font-semibold text-on-surface">2.2 账户注册</h3>
          <p className="text-secondary leading-relaxed">
            使用本服务需要注册账户。您需要提供真实、准确的注册信息，并对账户下的所有活动承担责任。如发现未经授权使用您的账户，请立即通知我们。
          </p>

          <h3 className="font-semibold text-on-surface">2.3 设备使用</h3>
          <p className="text-secondary leading-relaxed">
            智能喂食设备的使用需配合本应用。请按照设备说明正确使用，因不当使用导致的任何损失，我们不承担责任。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">三、用户行为规范</h2>
          
          <h3 className="font-semibold text-on-surface">3.1 禁止行为</h3>
          <p className="text-secondary leading-relaxed">您在使用本服务时，不得：</p>
          <ul className="list-disc list-inside text-secondary space-y-2 ml-4">
            <li>违反任何适用的法律法规</li>
            <li>侵犯他人的知识产权或其他权利</li>
            <li>上传或传播病毒、恶意软件</li>
            <li>干扰或破坏服务的正常运行</li>
            <li>未经授权访问或控制他人账户</li>
            <li>利用本服务进行任何非法活动</li>
            <li>恶意破坏设备或干扰设备正常运行</li>
          </ul>

          <h3 className="font-semibold text-on-surface">3.2 内容责任</h3>
          <p className="text-secondary leading-relaxed">
            您对您在本服务中发布的内容承担全部责任。我们保留删除违规内容和终止违规账户的权利，但无义务监控所有内容。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">四、知识产权</h2>
          <p className="text-secondary leading-relaxed">
            本服务包含的所有内容，包括但不限于文字、软件、代码、图片、标识、商标等，均受知识产权法保护，归我们或相关权利人所有。
          </p>
          <p className="text-secondary leading-relaxed">
            未经我们书面许可，您不得复制、修改、分发、传播或以任何方式使用本服务的知识产权内容。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">五、数据与隐私</h2>
          <p className="text-secondary leading-relaxed">
            关于我们如何收集、使用和保护您的个人信息，请参阅我们的《隐私政策》。使用本服务即表示您同意我们按照《隐私政策》处理您的数据。
          </p>
          <p className="text-secondary leading-relaxed">
            您应妥善保管账户信息和密码，因您个人原因导致的信息泄露或损失，我们不承担责任。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">六、服务变更与终止</h2>
          
          <h3 className="font-semibold text-on-surface">6.1 服务变更</h3>
          <p className="text-secondary leading-relaxed">
            我们保留随时修改、暂停或终止部分或全部服务的权利，恕不另行通知。对于服务的修改、暂停或终止造成的任何损失，我们不承担责任。
          </p>

          <h3 className="font-semibold text-on-surface">6.2 账户终止</h3>
          <p className="text-secondary leading-relaxed">
            如您违反本协议，我们有权在不经通知的情况下暂停或终止您的账户。账户终止后，您将无法访问您的数据和服务。
          </p>

          <h3 className="font-semibold text-on-surface">6.3 数据保留</h3>
          <p className="text-secondary leading-relaxed">
            账户终止后，我们将在法律规定的时间内保留您的数据。您可以通过联系客服请求导出或删除您的数据。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">七、免责声明</h2>
          
          <h3 className="font-semibold text-on-surface">7.1 服务中断</h3>
          <p className="text-secondary leading-relaxed">
            我们不对因网络、设备故障、维护等原因造成的服务中断承担责任。我们将尽力减少服务中断的时间和影响。
          </p>

          <h3 className="font-semibold text-on-surface">7.2 数据安全</h3>
          <p className="text-secondary leading-relaxed">
            我们采取合理的安全措施保护您的数据，但无法保证数据的绝对安全。您理解并同意，任何数据传输都存在安全风险。
          </p>

          <h3 className="font-semibold text-on-surface">7.3 健康与安全</h3>
          <p className="text-secondary leading-relaxed">
            本服务提供的喂养建议仅供参考，不构成专业兽医建议。您的宠物如有健康问题，请咨询专业兽医。因依赖本服务建议导致的宠物健康问题，我们不承担责任。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">八、责任限制</h2>
          <p className="text-secondary leading-relaxed">
            在法律允许的最大范围内，我们对因使用或无法使用本服务而产生的任何直接、间接、附带、特殊、惩罚性或后果性损害不承担责任。
          </p>
          <p className="text-secondary leading-relaxed">
            无论我们是否事先被告知损害的可能性，我们的总责任不超过您在过去12个月内向我们支付的服务费用，或100元人民币（以较高者为准）。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">九、争议解决</h2>
          <p className="text-secondary leading-relaxed">
            本协议的解释和执行适用中华人民共和国法律。如因本协议产生任何争议，双方应首先友好协商解决；协商不成的，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">十、联系我们</h2>
          <p className="text-secondary leading-relaxed">
            如您对本服务协议有任何问题或意见，请通过以下方式联系我们：
          </p>
          <p className="text-secondary">
            电子邮件：support@meowise.com<br />
            客服热线：400-XXX-XXXX<br />
            地址：北京市朝阳区科技园区喵食记大厦
          </p>
        </section>

        <div className="pt-6 border-t border-outline-variant/10">
          <p className="text-xs text-secondary text-center">
            © 2024 喵食记 MeoWise. 保留所有权利。
          </p>
        </div>
      </div>
    </div>
  );
}
