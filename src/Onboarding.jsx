import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Link2, ShieldCheck, X } from 'lucide-react';

const STEPS = [
  {
    key: 'map',
    icon: Compass,
    eyebrow: '第一步',
    title: '先看地图',
    text: '点一下省份会亮，点第二下才进入城市。城市里再点封面，就能看到那条念想。',
  },
  {
    key: 'link',
    icon: Link2,
    eyebrow: '第二步',
    title: '把链接变成念想',
    text: '在右上角点“加念想”，粘贴抖音分享链接，标题、城市和封面会自动识别。',
  },
  {
    key: 'local',
    icon: ShieldCheck,
    eyebrow: '第三步',
    title: '只留在本机',
    text: '现在的版本不接云端。数据存在这台设备的浏览器里，可以随时导出 JSON 备份。',
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="onboarding">
      <motion.section
        className="onboarding-card glass-strong"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      >
        <button className="onboarding-skip" onClick={onDone}>
          跳过 <X size={13} />
        </button>

        <div className="onboarding-icon"><Icon size={26} /></div>
        <p className="eyebrow">{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <p className="onboarding-text">{current.text}</p>

        <div className="onboarding-dots">
          {STEPS.map((item, index) => (
            <button
              key={item.key}
              className={index === step ? 'active' : ''}
              onClick={() => setStep(index)}
              aria-label={`第 ${index + 1} 步`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 ? <button className="ghost" onClick={() => setStep(step - 1)}>上一步</button> : <span />}
          <button className="primary" onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? '开始使用' : '下一步'} <ArrowRight size={15} />
          </button>
        </div>
      </motion.section>
    </div>
  );
}
