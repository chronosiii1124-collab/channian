import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Map as MapIcon,
  Bookmark,
  Sparkles,
  ChefHat,
  User,
  Search,
  X,
  ExternalLink,
  Smartphone,
  MapPin,
  Copy,
  Check,
  Navigation,
} from 'lucide-react';

export const TABS = [
  { id: 'map', label: '地图', icon: MapIcon },
  { id: 'saved', label: '收藏', icon: Bookmark },
  { id: 'inspiration', label: '灵感', icon: Sparkles },
  { id: 'recipe', label: '在家做', icon: ChefHat },
  { id: 'profile', label: '我的', icon: User },
];

export function TiltCard({ record, onOpen, index = 0, pending = false, selectable = false, selected = false, onSelect }) {
  const ref = useRef(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const seed = [...(record.city || record.province || record.title || '馋念')]
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const hue = seed % 360;

  function move(event) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-4px)`;
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }

  return (
    <button
      ref={ref}
      className="food-card"
      data-kind={record.kind || 'place'}
      data-cover={record.cover && !imgFailed ? 'image' : 'generated'}
      data-city={record.city ? 'yes' : 'no'}
      data-pending={pending ? 'yes' : 'no'}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms`, '--hue': hue }}
      onPointerMove={move}
      onPointerLeave={leave}
      onClick={() => (selectable ? onSelect?.(record.id) : onOpen(record))}
      aria-label={record.title}
    >
      {selectable ? (
        <span className={`card-check ${selected ? 'checked' : ''}`}>
          {selected ? <Check size={13} /> : null}
        </span>
      ) : null}
      <div className={`cover ${loaded || !record.cover || imgFailed ? 'loaded' : ''}`}>
        <span className="cover-skeleton" />
        {record.cover && !imgFailed ? (
          <img
            src={record.cover}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => { setImgFailed(true); setLoaded(true); }}
          />
        ) : (
          <div className="cover-fallback generated-cover">
            <span className="gen-kicker">{record.kind === 'recipe' ? '在家做' : record.city ? '城市线索' : '灵感'}</span>
            <strong>{record.city || '待定位'}</strong>
            <span className="gen-title">{record.title}</span>
          </div>
        )}
      </div>
      <div className="card-shade" />
      {pending ? (
        <span className="card-locate"><MapPin size={11} /> 选地点</span>
      ) : record.city ? (
        <span className="card-stamp" aria-hidden="true">{record.city.slice(0, 1)}</span>
      ) : null}
      <div className="card-top">
        <span className="chip city-chip">
          <MapPin size={11} />
          {record.city || '地点待定'}
        </span>
        <span className="chip source-chip">{record.kind === 'recipe' ? '在家做' : record.source || '收藏'}</span>
      </div>
      <div className="card-copy">
        <h3>{record.title}</h3>
        <p>{record.author || '作者待补'}</p>
      </div>
    </button>
  );
}

export function Dock({ page, onChange, badges = {} }) {
  return (
    <nav className="dock glass" aria-label="主导航">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = page === tab.id;
        return (
          <button
            key={tab.id}
            className={`dock-item ${active ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="dock-icon">
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
            </span>
            <span>{tab.label}</span>
            {badges[tab.id] ? <span className="dock-badge">{badges[tab.id]}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

export function SearchBox({ value, onChange, placeholder = '搜城市、店名或标题' }) {
  return (
    <label className="search glass">
      <Search size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="清空搜索">
          <X size={14} />
        </button>
      ) : null}
    </label>
  );
}

export function EmptyState({ icon = '🍽️', title, text }) {
  return (
    <div className="empty glass">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function DetailSheet({ record, onClose, onRelocate }) {
  const [copied, setCopied] = useState(false);
  if (!record) return null;
  const canNavigate = Boolean(record.place);

  function openDouyin() {
    const web = record.url || `https://www.douyin.com/video/${record.id}`;
    if (!/^\d+$/.test(String(record.id)) || !isMobile()) {
      window.open(web, '_blank', 'noopener,noreferrer');
      return;
    }
    const scheme = `snssdk1128://aweme/detail/${record.id}`;
    let left = false;
    const timer = setTimeout(() => {
      if (!left) window.location.href = web;
    }, 1400);
    const onHide = () => {
      left = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onHide);
    };
    document.addEventListener('visibilitychange', onHide);
    window.location.href = scheme;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(record.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function openNavigation() {
    const keyword = [record.place, record.title, record.city, record.province].filter(Boolean).join(' ');
    const city = record.city || record.province || '';
    const url = `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}&src=channian`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.article
        className="detail glass-strong"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>
        <div className="detail-cover">
          {record.cover ? <img src={record.cover} alt="" /> : <div className="cover-fallback">🍜</div>}
          <div className="detail-cover-shade" />
        </div>
        <div className="detail-body">
          <div className="detail-chips">
            <span className="chip city-chip">
              <MapPin size={12} />
              {record.city || '地点待定'}
            </span>
            <span className="chip source-chip">{record.kind === 'recipe' ? '在家做' : record.source || '收藏'}</span>
          </div>
          <h2>{record.title}</h2>
          <p className="detail-author">{record.author || '作者待补'}</p>
          {record.place ? (
            <p className="detail-address">
              <MapPin size={13} /> {record.place}
            </p>
          ) : null}
          <div className="detail-actions">
            <button className="primary" onClick={openDouyin}>
              <ExternalLink size={16} />
              在抖音打开
            </button>
            {canNavigate ? (
              <button className="ghost" onClick={openNavigation} title="在高德地图搜索这个地点">
                <Navigation size={16} />
                导航
              </button>
            ) : null}
            {onRelocate ? (
              <button className="ghost" onClick={onRelocate}>
                <MapPin size={16} />
                改地点
              </button>
            ) : null}
            <button className="ghost" onClick={copyLink}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>
          <p className="detail-hint">
            <Smartphone size={13} />
            手机端会先尝试打开抖音 App，打不开再回到网页版。
          </p>
        </div>
      </motion.article>
    </motion.div>
  );
}
