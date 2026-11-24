import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Apple, Mail, MessageCircle, Phone, Sparkles } from 'lucide-react';

export default function AuthPage({ onAuth }) {
  const [method, setMethod] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');

  const isPhone = method === 'phone';
  const valid = isPhone ? /^1\d{10}$/.test(identifier.trim()) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());

  function sendCode() {
    setError('');
    if (!valid) {
      setError(isPhone ? '请输入 11 位手机号' : '请输入有效邮箱');
      return;
    }
    setSent(true);
    setHint('演示环境：验证码是 123456（不会真的发送）');
  }

  function submit(event) {
    event.preventDefault();
    setError('');
    if (!sent) {
      setError('先点“发送验证码”');
      return;
    }
    if (code.trim() !== '123456') {
      setError('演示验证码是 123456');
      return;
    }
    const name = isPhone ? `用户${identifier.slice(-4)}` : identifier.split('@')[0];
    onAuth({ name, method, identifier, guest: false });
  }

  return (
    <div className="auth-page">
      <div className="auth-aurora" aria-hidden="true">
        <span />
        <span />
      </div>

      <motion.section
        className="auth-brand"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="eyebrow">
          <Sparkles size={13} /> 个人美食记忆
        </p>
        <h1>
          把想吃的，
          <br />
          留在这张地图上。
        </h1>
        <p className="auth-sub">
          收藏过的城市、店、菜和那一口，重新按地方找回来。登录只用来跨设备保留你的念想。
        </p>
      </motion.section>

      <motion.section
        className="auth-card glass-strong"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.08 }}
      >
        <div className="auth-card-head">
          <h2>登录馋念</h2>
          <p>演示环境，登录状态只保存在本机浏览器。</p>
        </div>

        <div className="auth-stepper" aria-label="登录步骤">
          <button type="button" className={!sent ? 'active' : 'done'} onClick={() => setSent(false)}>
            <b>1</b> 验证方式
          </button>
          <i />
          <button type="button" className={sent ? 'active' : ''} onClick={() => { if (sent) document.querySelector('.auth-form input[inputmode="numeric"]')?.focus(); }}>
            <b>2</b> 验证码
          </button>
        </div>

        <div className="auth-tabs" role="tablist">
          <button className={method === 'phone' ? 'active' : ''} onClick={() => { setMethod('phone'); setSent(false); setHint(''); }}>
            <Phone size={15} /> 手机号
          </button>
          <button className={method === 'email' ? 'active' : ''} onClick={() => { setMethod('email'); setSent(false); setHint(''); }}>
            <Mail size={15} /> 邮箱
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            {isPhone ? '手机号' : '邮箱'}
            <input
              type={isPhone ? 'tel' : 'email'}
              value={identifier}
              onChange={(event) => { setIdentifier(event.target.value); setSent(false); setHint(''); }}
              placeholder={isPhone ? '输入 11 位手机号' : 'name@example.com'}
              autoComplete={isPhone ? 'tel' : 'email'}
            />
          </label>

          <div className="auth-code-row">
            <label>
              验证码
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 位验证码"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
            <button type="button" className="ghost auth-send" onClick={sendCode} disabled={!valid}>
              发送验证码
            </button>
          </div>

          {hint ? <p className="auth-hint">{hint}</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="primary auth-submit">
            登录 <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-divider"><span>或</span></div>

        <div className="auth-social">
          <button type="button" onClick={() => setHint('微信登录待接入，先用手机或邮箱')}>
            <MessageCircle size={17} /> 微信
          </button>
          <button type="button" onClick={() => setHint('Apple 登录待接入，先用手机或邮箱')}>
            <Apple size={17} /> Apple
          </button>
        </div>

        <button type="button" className="auth-guest" onClick={() => onAuth({ name: '游客', method: 'guest', identifier: '', guest: true })}>
          先逛逛，不登录 <ArrowRight size={14} />
        </button>
        <p className="auth-fine">非抖音官方产品。演示登录不会发送短信或邮件。</p>
      </motion.section>
    </div>
  );
}
