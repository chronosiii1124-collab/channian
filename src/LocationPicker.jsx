import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Search, X } from 'lucide-react';
import MapChart from './MapChart';

export default function LocationPicker({ record, cities, chinaGeo, theme, isMobile, onClose, onSave }) {
  const [province, setProvince] = useState(record.province || '');
  const [city, setCity] = useState(record.city || '');
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState(record.place || '');
  const [mode, setMode] = useState('list');
  const [mapProvince, setMapProvince] = useState(record.province || '');
  const [mapCity, setMapCity] = useState(record.city || '');

  const provinces = useMemo(
    () => [...new Set((cities || []).map((item) => item.province).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'zh')),
    [cities],
  );

  const cityOptions = useMemo(() => {
    const q = query.trim();
    return (cities || []).filter((item) => {
      if (!q && province && item.province !== province) return false;
      if (!q) return true;
      return `${item.name}${item.province}`.includes(q);
    });
  }, [cities, province, query]);

  const selected = useMemo(
    () => (cities || []).find((item) => item.name.replace(/市$/, '') === city && (!province || item.province === province)),
    [cities, city, province],
  );

  const mapRecords = useMemo(
    () => (cities || [])
      .filter((item) => !mapProvince || item.province === mapProvince)
      .map((item) => ({
        id: `picker-${item.name}`,
        city: item.name.replace(/市$/, ''),
        province: item.province,
        coord: item.center,
        title: item.name,
        cover: '',
      })),
    [cities, mapProvince],
  );

  function chooseProvince(name) {
    setProvince(name);
    setCity('');
    setMapProvince(name);
    setMapCity('');
    setQuery('');
  }

  function chooseCity(item) {
    setProvince(item.province);
    setCity(item.name.replace(/市$/, ''));
    setMapProvince(item.province);
    setMapCity(item.name.replace(/市$/, ''));
  }

  function chooseMapProvince(name) {
    setProvince(name);
    setCity('');
    setMapProvince(name);
    setMapCity('');
  }

  function chooseMapCity(name) {
    const normalized = name.replace(/市$/, '');
    const item = (cities || []).find((entry) => entry.name.replace(/市$/, '') === normalized);
    if (item) chooseCity(item);
  }

  function save() {
    if (!selected) return;
    onSave({
      city: selected.name.replace(/市$/, ''),
      province: selected.province,
      coord: selected.center,
      place: place.trim(),
      locationConfirmed: true,
    });
  }

  const isBulk = record.title?.startsWith('为 ');

  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section
        className="location-modal glass-strong"
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        <p className="eyebrow"><MapPin size={13} /> 手动确定地点</p>
        <h2>{isBulk ? '给这些念想选地点' : '这条念想在哪儿？'}</h2>
        <p className="muted location-record">{record.title}</p>

        <div className="location-mode-tabs">
          <button className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')}>滑动选择</button>
          <button className={mode === 'map' ? 'active' : ''} onClick={() => setMode('map')}>地图点选</button>
        </div>

        {mode === 'list' ? (
          <>
            <label className="location-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜城市，比如杭州、伊犁" />
            </label>

            <div className="location-columns">
              <div className="location-column">
                <span className="location-label">省份</span>
                <div className="location-list">
                  {provinces.map((name) => (
                    <button
                      key={name}
                      className={province === name ? 'active' : ''}
                      onClick={() => chooseProvince(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="location-column">
                <span className="location-label">城市 · 滑动选择</span>
                <div className="location-list">
                  {cityOptions.map((item) => {
                    const name = item.name.replace(/市$/, '');
                    return (
                      <button
                        key={`${item.province}-${item.name}`}
                        className={city === name ? 'active' : ''}
                        onClick={() => chooseCity(item)}
                      >
                        {name}
                        <small>{item.province}</small>
                      </button>
                    );
                  })}
                  {!cityOptions.length ? <p className="muted">没有匹配的城市</p> : null}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="location-map">
            {chinaGeo ? (
              <MapChart
                records={mapRecords}
                chinaGeo={chinaGeo}
                province={mapProvince}
                provinceZoomed={Boolean(mapProvince)}
                city={mapCity}
                onProvince={chooseMapProvince}
                onCity={chooseMapCity}
                isMobile={isMobile}
                theme={theme}
              />
            ) : <p className="muted">地图加载中</p>}
          </div>
        )}

        {!isBulk ? (
          <label className="location-place">
            <MapPin size={14} />
            <span>具体地址 / 门店（可选）</span>
            <input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="例如 中山北路 123 号 / 店名" />
          </label>
        ) : null}

        <div className="location-foot">
          <span>
            {selected ? <><MapPin size={13} /> {selected.province} · {selected.name.replace(/市$/, '')}</> : '先选一个城市'}
          </span>
          <div>
            <button className="ghost" onClick={onClose}>取消</button>
            <button className="primary" onClick={save} disabled={!selected}><Check size={15} /> 保存地点</button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
