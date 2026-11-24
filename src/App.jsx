import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Compass,
  Database,
  Download,
  MapPin,
  Sparkles,
  Plus,
  LogOut,
  UserRound,
  Search,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import MapChart from './MapChart';
import { DetailSheet, Dock, EmptyState, SearchBox, TiltCard } from './components';
import AuthPage from './AuthPage';
import AddLinkModal from './AddLinkModal';
import LocationPicker from './LocationPicker';
import Onboarding from './Onboarding';
import Toast from './Toast';
import RecipeSheet, { RecipeLoading } from './RecipeSheet';
import { RECIPE_STEPS } from './recipeData';
import { THEMES } from './themes';

const AUTH_KEY = 'channian-auth-v1';
const EXTRA_KEY = 'channian-extra-records-v1';
const LOCATION_KEY = 'channian-location-overrides-v1';
const TRASH_KEY = 'channian-trash-v1';
const TOMBSTONE_KEY = 'channian-tombstones-v1';
const DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1'
  || String(import.meta.env.VITE_DATA_FILE || '').includes('data.sample.json');
const DATA_FILE = DEMO_MODE ? 'data.sample.json' : 'data.json';
const ASSET_BASE = import.meta.env.BASE_URL || '/';
const asset = (name) => `${ASSET_BASE}${String(name).replace(/^\/+/, '')}`;

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const SHORT_PROVINCE = (name = '') =>
  name
    .replace('维吾尔自治区', '')
    .replace('壮族自治区', '')
    .replace('回族自治区', '')
    .replace('特别行政区', '')
    .replace('自治区', '')
    .replace(/省|市$/, '');

const PAGE_META = {
  saved: { title: '收藏', subtitle: '所有留下来的念想' },
  inspiration: { title: '灵感', subtitle: '还没有具体门店，但值得记住' },
  recipe: { title: '在家做', subtitle: '能自己复刻的那一口' },
};

function Splash() {
  return (
    <div className="splash">
      <div className="splash-mark">馋念</div>
      <div className="splash-line" />
      <p>正在摊开地图…</p>
    </div>
  );
}

function CardGrid({ records, onOpen, selectable = false, selectedIds, onSelect }) {
  return (
    <div className="card-grid">
      {records.map((record, index) => (
        <TiltCard
          key={record.id}
          record={record}
          onOpen={onOpen}
          index={index}
          selectable={selectable}
          selected={Boolean(selectedIds?.has(record.id))}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TrashPage({ trash, onBack, onRestore, onPurge, onEmpty }) {
  return (
    <main className="collection-page trash-page">
      <header className="page-head">
        <div>
          <button className="back-line" onClick={onBack}>
            <ArrowLeft size={13} /> 返回我的
          </button>
          <p className="eyebrow"><Trash2 size={13} /> 已删除</p>
          <h1>回收站</h1>
          <p className="muted">{trash.length} 条 · 恢复后会回到原来的城市/地图</p>
        </div>
        {trash.length ? (
          <button
            className="danger"
            onClick={() => { if (window.confirm('彻底删除回收站里的全部念想？')) onEmpty(); }}
          >
            <Trash2 size={15} /> 清空回收站
          </button>
        ) : null}
      </header>

      {trash.length ? (
        <div className="trash-grid">
          {trash.map(({ record, deletedAt }) => (
            <article className="trash-card glass" key={record.id}>
              <div className="trash-cover">
                {record.cover ? <img src={record.cover} alt="" loading="lazy" /> : <span>🍜</span>}
              </div>
              <div className="trash-body">
                <strong>{record.title}</strong>
                <p>{record.city || '地点待定'} · {deletedAt ? new Date(deletedAt).toLocaleDateString('zh-CN') : ''}</p>
                <div className="trash-actions">
                  <button className="ghost small" onClick={() => onRestore(record.id)}>
                    <RotateCcw size={13} /> 恢复
                  </button>
                  <button
                    className="danger small"
                    onClick={() => { if (window.confirm('彻底删除这条念想？')) onPurge(record.id); }}
                  >
                    <Trash2 size={13} /> 彻底删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="🧺" title="回收站是空的" text="在收藏或灵感页点“批量清除”，删除的念想会先来这里。" />
      )}
    </main>
  );
}

function SearchPage({ query, setQuery, records, recent = [], onRemember, onOpen, onBack }) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return records.filter((record) => (
      [record.title, record.author, record.city, record.place, record.province]
        .join(' ')
        .toLowerCase()
        .includes(q)
    ));
  }, [records, query]);

  const popular = useMemo(() => {
    const map = new Map();
    for (const record of records) {
      if (!record.city) continue;
      map.set(record.city, (map.get(record.city) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [records]);

  function open(record) {
    onRemember(query);
    onOpen(record);
  }

  return (
    <main className="collection-page search-page">
      <header className="page-head">
        <div>
          <button className="back-line" onClick={onBack}>
            <ArrowLeft size={13} /> 返回地图
          </button>
          <p className="eyebrow">
            <Search size={13} /> 全局搜索
          </p>
          <h1>找一条念想</h1>
          <p className="muted">
            {query.trim() ? `${results.length} 条结果` : '搜城市、店名、作者或标题'}
          </p>
        </div>
        <div className="page-actions">
          <SearchBox value={query} onChange={setQuery} placeholder="搜城市、店名或标题" />
        </div>
      </header>

      {!query.trim() ? (
        <div className="search-empty">
          {recent.length ? (
            <section>
              <h3>最近搜索</h3>
              <div className="search-chips">
                {recent.map((item) => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}
              </div>
            </section>
          ) : null}
          <section>
            <h3>从城市开始</h3>
            <div className="search-chips">
              {popular.map(([name, count]) => (
                <button key={name} onClick={() => setQuery(name)}>
                  {name} <b>{count}</b>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : results.length ? (
        <CardGrid records={results} onOpen={open} />
      ) : (
        <EmptyState icon="🔍" title="没有找到" text="换个城市、店名或作者试试。" />
      )}
    </main>
  );
}

function CollectionPage({ page, records, query, setQuery, onOpen, filterLabel, onClearFilter, onAdd, pendingRecords = [], onLocate, onBulkLocate, onBulkDelete }) {
  const meta = PAGE_META[page];
  const [filter, setFilter] = useState('all');
  const [bulk, setBulk] = useState(false);
  const [picked, setPicked] = useState(new Set());
  const [manage, setManage] = useState(false);
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    setFilter('all');
    setBulk(false);
    setPicked(new Set());
    setManage(false);
    setChecked(new Set());
  }, [page]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => [r.title, r.author, r.city, r.place].join(' ').toLowerCase().includes(q));
  }, [records, query]);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'city', label: '有城市' },
    { key: 'pending', label: '地点待定' },
    { key: 'cover', label: '有封面' },
    { key: 'nocover', label: '缺封面' },
    ...(page === 'saved' ? [{ key: 'recipe', label: '菜谱' }] : []),
  ];

  function matches(record, key) {
    if (key === 'city') return Boolean(record.city);
    if (key === 'pending') return !record.city;
    if (key === 'cover') return Boolean(record.cover);
    if (key === 'nocover') return !record.cover;
    if (key === 'recipe') return record.kind === 'recipe';
    return true;
  }

  const filtered = useMemo(
    () => searched.filter((record) => matches(record, filter)),
    [searched, filter],
  );

  const pendingIds = new Set(pendingRecords.map((record) => record.id));
  const showPending = page === 'inspiration' && !query.trim() && pendingRecords.length > 0 && (filter === 'all' || filter === 'pending');
  const otherRecords = showPending ? filtered.filter((record) => !pendingIds.has(record.id)) : filtered;

  function togglePicked(id) {
    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function locateBulk() {
    const chosen = pendingRecords.filter((record) => picked.has(record.id));
    if (!chosen.length) return;
    onBulkLocate?.(chosen);
    setBulk(false);
    setPicked(new Set());
  }

  function toggleChecked(id) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkDelete() {
    const chosen = filtered.filter((record) => checked.has(record.id));
    if (!chosen.length) return;
    onBulkDelete?.(chosen);
    setManage(false);
    setChecked(new Set());
  }

  return (
    <main className="collection-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            <Sparkles size={13} /> {meta.subtitle}
          </p>
          <h1>{meta.title}</h1>
          {filterLabel ? (
            <button className="filter-chip" onClick={onClearFilter}>
              {filterLabel} <span>×</span>
            </button>
          ) : null}
          <p className="muted">{filtered.length} 个念想</p>
        </div>
        <div className="page-actions">
          <SearchBox value={query} onChange={setQuery} />
          <button className="ghost small" onClick={() => { setManage((value) => !value); setChecked(new Set()); }}>
            {manage ? '完成' : '批量清除'}
          </button>
          {onAdd ? (
            <button className="primary small" onClick={onAdd}>
              <Plus size={15} /> 加念想
            </button>
          ) : null}
        </div>
      </header>
      <div className="filter-bar">
        {filters.map((item) => (
          <button
            key={item.key}
            className={filter === item.key ? 'active' : ''}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
            <b>{searched.filter((record) => matches(record, item.key)).length}</b>
          </button>
        ))}
      </div>
      {manage ? (
        <div className="bulk-bar manage-bar glass">
          <span>已选 {checked.size} 条</span>
          <button className="ghost small" onClick={() => setChecked(new Set(filtered.map((record) => record.id)))}>全选</button>
          <button className="ghost small" onClick={() => setChecked(new Set())}>清空</button>
          <button className="danger small" disabled={!checked.size} onClick={bulkDelete}>移入回收站</button>
        </div>
      ) : null}
      {filtered.length ? (
        <>
          {showPending ? (
            <section className="pending-group">
              <div className="pending-head">
                <span className="pending-dot" />
                <div>
                  <h2>地点待定 <b>{pendingRecords.length}</b></h2>
                  <p>这些念想还没落到城市，点封面手动选一个地点。</p>
                </div>
                {!manage ? (
                  <button className="ghost small pending-bulk-toggle" onClick={() => { setBulk((value) => !value); setPicked(new Set()); }}>
                    {bulk ? '完成' : '批量选'}
                  </button>
                ) : null}
              </div>
              {bulk && !manage ? (
                <div className="bulk-bar glass">
                  <span>已选 {picked.size} 条</span>
                  <button className="ghost small" onClick={() => setPicked(new Set(pendingRecords.map((record) => record.id)))}>全选</button>
                  <button className="ghost small" onClick={() => setPicked(new Set())}>清空</button>
                  <button className="primary small" disabled={!picked.size} onClick={locateBulk}>批量定地点</button>
                </div>
              ) : null}
              <div className="card-grid pending-grid">
                {pendingRecords.map((record, index) => (
                  <TiltCard
                    key={record.id}
                    record={record}
                    onOpen={onLocate}
                    onSelect={manage ? toggleChecked : togglePicked}
                    selectable={manage || bulk}
                    selected={manage ? checked.has(record.id) : picked.has(record.id)}
                    index={index}
                    pending
                  />
                ))}
              </div>
            </section>
          ) : null}
          {otherRecords.length ? (
            <CardGrid
              records={otherRecords}
              onOpen={onOpen}
              selectable={manage}
              selectedIds={checked}
              onSelect={toggleChecked}
            />
          ) : null}
        </>
      ) : (
        <EmptyState icon="🫧" title="这里还是空的" text="去地图上点一个省份，或者换个关键词试试。" />
      )}
    </main>
  );
}

function ProfilePage({ records, onOpen, user, onLogout, theme, onTheme, online, onInstall, trashCount = 0, onOpenTrash }) {
  const stats = useMemo(() => {
    const cities = new Set(records.map((r) => r.city).filter(Boolean));
    const provinces = new Set(records.map((r) => r.province).filter(Boolean));
    const covers = records.filter((r) => r.cover).length;
    const recipes = records.filter((r) => r.kind === 'recipe').length;
    return { cities: cities.size, provinces: provinces.size, covers, recipes };
  }, [records]);

  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 1, records }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `馋念备份-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  return (
    <main className="collection-page profile-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            <Compass size={13} /> 我的地图
          </p>
          <h1>我的</h1>
          <p className="muted">数据只留在本机浏览器</p>
        </div>
      </header>

      <section className="account glass">
        <div className="account-avatar">{(user?.name || '游').slice(0, 1)}</div>
        <div className="account-info">
          <h3>{user?.name || '游客'}</h3>
          <p>
            {user?.guest
              ? '未登录 · 数据只在本机'
              : `${user?.method === 'phone' ? '手机号' : '邮箱'} · ${user?.identifier || ''}`}
          </p>
        </div>
        {user?.guest ? (
          <button className="primary small" onClick={onLogout}>登录 / 注册</button>
        ) : (
          <button className="ghost small" onClick={onLogout}><LogOut size={15} /> 退出</button>
        )}
      </section>

      <section className="stat-grid">
        <div className="stat glass">
          <strong>{records.length}</strong>
          <span>个念想</span>
        </div>
        <div className="stat glass">
          <strong>{stats.cities}</strong>
          <span>个城市</span>
        </div>
        <div className="stat glass">
          <strong>{stats.provinces}</strong>
          <span>个省份</span>
        </div>
        <div className="stat glass">
          <strong>{stats.covers}</strong>
          <span>张封面</span>
        </div>
      </section>

      <section className="theme-box glass">
        <div className="theme-head">
          <div>
            <h3>主题</h3>
            <p>换材质与纹理，文字始终可读</p>
          </div>
          <span className="theme-current">{THEMES.find((item) => item.key === theme)?.name || '夜食绿'}</span>
        </div>
        <div className="theme-grid">
          {THEMES.map((item) => (
            <button
              key={item.key}
              className={`theme-card ${theme === item.key ? 'active' : ''}`}
              onClick={() => onTheme(item.key)}
              data-theme-preview={item.key}
            >
              <span className="theme-dots">
                {item.swatches.map((color) => <i key={color} style={{ background: color }} />)}
              </span>
              <strong>{item.name}</strong>
              <span>{item.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings glass">
        <div className="settings-row install-row">
          <div>
            <h3>安装到主屏幕</h3>
            <p>手机浏览器菜单里选“添加到主屏幕”，用起来更像 App。</p>
          </div>
          <button className="ghost" onClick={onInstall}>
            <Download size={16} /> 安装
          </button>
        </div>
        <div className="settings-row">
          <div>
            <h3>本机状态</h3>
            <p>
              <span className={`status-pill ${online ? '' : 'offline'}`}>{online ? '在线' : '离线'}</span>
              {' '}数据只在本机 · 云同步未开启
            </p>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <h3>回收站</h3>
            <p>{trashCount ? `${trashCount} 条已删除，可恢复或彻底删除` : '暂无删除的念想'}</p>
          </div>
          <button className="ghost" onClick={onOpenTrash}>
            <Trash2 size={16} /> 打开
          </button>
        </div>
        <div className="settings-row">
          <div>
            <h3>导出完整备份</h3>
            <p>换浏览器或换设备前，先把这一份存好。</p>
          </div>
          <button className="primary" onClick={exportData}>
            <Download size={16} /> 导出 JSON
          </button>
        </div>
        <div className="settings-row">
          <div>
            <h3>数据说明</h3>
            <p>封面、标题和链接来自本机采集；城市为文字线索，未核实门店坐标。</p>
          </div>
          <Database size={20} className="muted-icon" />
        </div>
        <div className="settings-row">
          <div>
            <h3>关于收藏的 {records.length} 条</h3>
            <p>
              {DEMO_MODE
                ? '公开样例：30 条，覆盖 20 个城市、地点待定和在家做；自动识别需本地版。'
                : '100 条收藏 + 183 条聊天分享，按视频去重后 261 条。'}
            </p>
          </div>
          <button className="ghost" onClick={() => onOpen(records[0])}>
            看一条 <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
    </main>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const onChange = (event) => setMobile(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

export default function App() {
  const [data, setData] = useState(null);
  const [chinaGeo, setChinaGeo] = useState(null);
  const [page, setPage] = useState('map');
  const [province, setProvince] = useState(null);
  const [provinceZoomed, setProvinceZoomed] = useState(false);
  const [city, setCity] = useState(null);
  const [pageFilter, setPageFilter] = useState(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => readStored('channian-recent-searches', []));
  const [installEvent, setInstallEvent] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [selected, setSelected] = useState(null);
  const [recipeCache, setRecipeCache] = useState(() => readStored('channian-recipe-cache-v1', {}));
  const [analyzing, setAnalyzing] = useState(null);
  const [recipeView, setRecipeView] = useState(null);
  const [user, setUser] = useState(() => readStored(AUTH_KEY, null));
  const [showAuth, setShowAuth] = useState(() => !readStored(AUTH_KEY, null));
  const [showOnboarding, setShowOnboarding] = useState(() => (
    Boolean(readStored(AUTH_KEY, null)) && localStorage.getItem('channian-onboarded-v1') !== '1'
  ));
  const [extraRecords, setExtraRecords] = useState(() => readStored(EXTRA_KEY, []));
  const [locationOverrides, setLocationOverrides] = useState(() => readStored(LOCATION_KEY, {}));
  const [locating, setLocating] = useState(null);
  const [bulkTargets, setBulkTargets] = useState([]);
  const [trash, setTrash] = useState(() => readStored(TRASH_KEY, []));
  const [tombstones, setTombstones] = useState(() => readStored(TOMBSTONE_KEY, []));
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('channian-theme');
    const alias = { ember: 'grain', tide: 'matte', dusk: 'matte' };
    if (['night', 'grain', 'matte', 'paper'].includes(stored)) return stored;
    return alias[stored] || 'night';
  });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const shelfRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('channian-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handlePrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(asset(DATA_FILE))
        .then((res) => {
          if (!res.ok) throw new Error('primary data missing');
          return res.json();
        })
        .catch(() => fetch(asset('data.sample.json')).then((res) => res.json())),
      fetch(asset('china.json')).then((res) => res.json()),
      fetch(asset('cities.json')).then((res) => res.json()),
    ])
      .then(([dataJson, geo, cityJson]) => {
        if (!alive) return;
        setData(dataJson.records || []);
        setChinaGeo(geo);
        setCities(cityJson || []);
      })
      .catch(() => {
        if (alive) setData([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const seedRecords = data || [];
  const records = useMemo(() => {
    if (DEMO_MODE) return seedRecords;
    const seen = new Set(seedRecords.map((record) => record.id));
    const merged = [...extraRecords.filter((record) => !seen.has(record.id)), ...seedRecords];
    const trashIds = new Set(trash.map((entry) => entry.record.id));
    const hiddenIds = new Set(tombstones);
    return merged
      .map((record) => (
        locationOverrides[record.id] ? { ...record, ...locationOverrides[record.id] } : record
      ))
      .filter((record) => !trashIds.has(record.id) && !hiddenIds.has(record.id));
  }, [seedRecords, extraRecords, locationOverrides, trash, tombstones]);

  const pendingRecords = useMemo(
    () => records.filter((record) => !record.city && !record.place && record.kind !== 'recipe'),
    [records],
  );

  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams(window.location.search);
    const wantedProvince = params.get('province');
    const wantedCity = params.get('city');
    const wantedPage = params.get('page');
    if (wantedProvince) setProvince(wantedProvince);
    if (wantedCity) {
      setCity(wantedCity);
      setProvinceZoomed(true);
    } else if (wantedProvince) {
      setProvinceZoomed(!isMobile);
    }
    if (['map', 'saved', 'inspiration', 'recipe', 'profile'].includes(wantedPage)) setPage(wantedPage);
  }, [data]);

  const provinceCounts = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      if (!r.province) continue;
      map.set(r.province, (map.get(r.province) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [records]);

  const provinceRecords = useMemo(
    () => (province ? records.filter((r) => r.province === province) : []),
    [records, province],
  );

  const cityGroups = useMemo(() => {
    const map = new Map();
    for (const r of provinceRecords) {
      if (!r.city) continue;
      const item = map.get(r.city) || { name: r.city, count: 0, coord: r.coord };
      item.count += 1;
      if (!item.coord && r.coord) item.coord = r.coord;
      map.set(r.city, item);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [provinceRecords]);

  const cityRecords = useMemo(
    () => (city ? records.filter((r) => r.city === city) : []),
    [records, city],
  );

  const shelfRecords = city ? cityRecords : province ? provinceRecords : [];
  const shelfTitle = city ? city : province ? SHORT_PROVINCE(province) : '';

  const savedRecords = useMemo(() => {
    if (!pageFilter) return records;
    return records.filter((record) =>
      pageFilter.type === 'city' ? record.city === pageFilter.value : record.province === pageFilter.value,
    );
  }, [records, pageFilter]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return records.filter((r) => [r.title, r.author, r.city, r.place].join(' ').toLowerCase().includes(q));
  }, [records, query]);

  if (showAuth) return <AuthPage onAuth={handleAuth} />;
  if (showOnboarding) return <Onboarding onDone={completeOnboarding} />;
  if (!data || !chinaGeo) return <Splash />;

  function chooseProvince(name) {
    setQuery('');
    if (!isMobile) {
      setProvince(name);
      setCity(null);
      setProvinceZoomed(true);
      return;
    }
    if (province === name && !provinceZoomed) {
      setProvinceZoomed(true);
      return;
    }
    setProvince(name);
    setCity(null);
    setProvinceZoomed(false);
  }

  function chooseCity(name) {
    setCity(name);
    setProvinceZoomed(true);
  }

  function resetMap() {
    setProvince(null);
    setProvinceZoomed(false);
    setCity(null);
    setPageFilter(null);
  }

  function scrollShelf(direction) {
    if (!shelfRef.current) return;
    shelfRef.current.scrollBy({ left: direction * 340, behavior: 'smooth' });
  }

  function openShelfAll() {
    if (!city && !province) return;
    setPageFilter({
      type: city ? 'city' : 'province',
      value: city || province,
      label: city || SHORT_PROVINCE(province),
    });
    setPage('saved');
    setSelected(null);
  }

  function changePage(next) {
    setPage(next);
    setPageFilter(null);
    if (next !== 'map') {
      setSelected(null);
    }
  }

  function notify(message) {
    setToast({ message, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function rememberSearch(value) {
    const term = value.trim();
    if (!term) return;
    setRecentSearches((previous) => {
      const next = [term, ...previous.filter((item) => item !== term)].slice(0, 8);
      localStorage.setItem('channian-recent-searches', JSON.stringify(next));
      return next;
    });
  }

  function openSearchPage() {
    if (query.trim()) rememberSearch(query);
    setPage('search');
    setSelected(null);
  }

  async function installApp() {
    if (!installEvent) {
      notify('在浏览器菜单里选“添加到主屏幕”');
      return;
    }
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    const item = THEMES.find((entry) => entry.key === nextTheme);
    notify(`主题已切换：${item?.name || nextTheme}`);
  }

  function handleAuth(nextUser) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setShowAuth(false);
    if (localStorage.getItem('channian-onboarded-v1') !== '1') setShowOnboarding(true);
    notify(nextUser.guest ? '先逛逛，数据只留本机' : `欢迎，${nextUser.name}`);
  }

  function completeOnboarding() {
    localStorage.setItem('channian-onboarded-v1', '1');
    setShowOnboarding(false);
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setShowAuth(true);
    notify('已退出登录');
  }

  function addRecord(record) {
    setExtraRecords((previous) => {
      const next = [record, ...previous.filter((item) => item.id !== record.id)];
      try {
        localStorage.setItem(EXTRA_KEY, JSON.stringify(next));
      } catch {
        // 封面是 base64，localStorage 满时先保留在内存里
      }
      return next;
    });
    setAddOpen(false);
    setPage('saved');
    setPageFilter(null);
    notify('已加入念想');
  }

  function saveLocation(id, location) {
    setLocationOverrides((previous) => {
      const next = { ...previous, [id]: location };
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
      return next;
    });
    setLocating(null);
    notify('地点已保存');
  }

  function saveLocations(ids, location) {
    setLocationOverrides((previous) => {
      const next = { ...previous };
      for (const id of ids) next[id] = location;
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
      return next;
    });
    setBulkTargets([]);
    notify(`已给 ${ids.length} 条念想选好地点`);
  }

  function moveToTrash(items) {
    if (!items.length) return;
    setTrash((previous) => {
      const existing = new Set(previous.map((entry) => entry.record.id));
      const additions = items
        .filter((record) => !existing.has(record.id))
        .map((record) => ({ record, deletedAt: new Date().toISOString() }));
      const next = [...additions, ...previous];
      localStorage.setItem(TRASH_KEY, JSON.stringify(next));
      return next;
    });
    notify(`${items.length} 条已移入回收站`);
  }

  function restoreFromTrash(id) {
    setTrash((previous) => {
      const next = previous.filter((entry) => entry.record.id !== id);
      localStorage.setItem(TRASH_KEY, JSON.stringify(next));
      return next;
    });
    notify('已恢复');
  }

  function purgeFromTrash(id) {
    setTrash((previous) => {
      const next = previous.filter((entry) => entry.record.id !== id);
      localStorage.setItem(TRASH_KEY, JSON.stringify(next));
      return next;
    });
    setTombstones((previous) => {
      const next = [...new Set([...previous, id])];
      localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(next));
      return next;
    });
    setExtraRecords((previous) => {
      const next = previous.filter((record) => record.id !== id);
      localStorage.setItem(EXTRA_KEY, JSON.stringify(next));
      return next;
    });
    notify('已彻底删除');
  }

  function emptyTrash() {
    if (!trash.length) return;
    const ids = trash.map((entry) => entry.record.id);
    setTrash([]);
    localStorage.setItem(TRASH_KEY, '[]');
    setTombstones((previous) => {
      const next = [...new Set([...previous, ...ids])];
      localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(next));
      return next;
    });
    setExtraRecords((previous) => {
      const next = previous.filter((record) => !ids.includes(record.id));
      localStorage.setItem(EXTRA_KEY, JSON.stringify(next));
      return next;
    });
    notify('回收站已清空');
  }

  async function analyzeRecipe(record) {
    setSelected(null);
    setAnalyzing(record);
    setRecipeView(null);
    let generated = null;
    try {
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, title: record.title, url: record.url }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.ok && Array.isArray(data.steps) && data.steps.length) {
          generated = {
            ingredients: data.ingredients || [],
            steps: data.steps,
            tips: data.tips || [],
            note: data.note || 'AI 从视频整理，请按原视频核对用量和火候',
          };
        }
      }
    } catch {
      // 本地静态版没有模型接口，使用已缓存的演示结果
    }
    if (!generated) generated = recipeCache[record.id] || RECIPE_STEPS[record.id] || null;
    if (!generated) {
      setAnalyzing(null);
      notify('这条还没有文字版，需要接入视频分析模型');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRecipeCache((previous) => {
      const next = { ...previous, [record.id]: generated };
      localStorage.setItem('channian-recipe-cache-v1', JSON.stringify(next));
      return next;
    });
    setRecipeView({ record, recipe: generated });
    setAnalyzing(null);
  }

  return (
    <div className="app">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-a" />
        <span className="aurora-b" />
        <span className="aurora-c" />
      </div>

      <>
        {page === 'map' ? (
          <main className="map-page">
            <div className="map-stage">
              <MapChart
                records={records}
                chinaGeo={chinaGeo}
                province={province}
                provinceZoomed={provinceZoomed}
                city={city}
                onProvince={chooseProvince}
                onCity={chooseCity}
                isMobile={isMobile}
                theme={theme}
              />
            </div>

            <header className="topbar">
              <button className="brand glass" onClick={resetMap}>
                <span className="brand-dot" />
                <span>
                  馋念
                  <small>{DEMO_MODE ? '30 条公开样例' : '城市觅食地图'}</small>
                </span>
              </button>

              <div className="breadcrumb glass">
                <button onClick={resetMap} className={!province ? 'current' : ''}>
                  全国
                </button>
                {province ? (
                  <>
                    <ChevronRight size={13} />
                    <button onClick={() => setCity(null)} className={!city ? 'current' : ''}>
                      {SHORT_PROVINCE(province)}
                    </button>
                  </>
                ) : null}
                {city ? (
                  <>
                    <ChevronRight size={13} />
                    <span className="current">{city}</span>
                  </>
                ) : null}
              </div>

              <div className="topbar-actions">
                <div className="topbar-search">
                  <SearchBox value={query} onChange={setQuery} placeholder="搜一条念想" />
                </div>
                {!DEMO_MODE ? (
                  <button className="add-button glass" onClick={() => setAddOpen(true)}>
                    <Plus size={16} />
                    <span>加念想</span>
                  </button>
                ) : null}
              </div>
            </header>

            {query ? (
              <section className="search-panel glass">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">搜索</p>
                    <h3>{searchResults.length} 条结果</h3>
                  </div>
                  <button className="icon-button" onClick={() => setQuery('')} aria-label="清空">
                    ×
                  </button>
                </div>
                <div className="search-list">
                  {searchResults.slice(0, 8).map((record) => (
                    <button key={record.id} className="search-row" onClick={() => { rememberSearch(query); setSelected(record); }}>
                      <span className="search-thumb">
                        {record.cover ? <img src={record.cover} alt="" loading="lazy" /> : '🍜'}
                      </span>
                      <span>
                        <strong>{record.title}</strong>
                        <small>
                          {record.city || '地点待定'} · {record.author || '作者待补'}
                        </small>
                      </span>
                    </button>
                  ))}
                  {!searchResults.length ? <p className="muted">没有找到，换个词试试。</p> : null}
                </div>
                {searchResults.length ? (
                  <button className="search-more ghost small" onClick={openSearchPage}>
                    查看全部 {searchResults.length} 条 <ArrowUpRight size={13} />
                  </button>
                ) : null}
              </section>
            ) : null}

            {!isMobile && province ? (
              <aside className="side-panel glass">
                <button className="back-line" onClick={resetMap}>
                  <ArrowLeft size={13} /> 全国
                </button>
                <p className="eyebrow">
                  <MapPin size={13} /> 省份
                </p>
                <h2>{SHORT_PROVINCE(province)}</h2>
                <p className="muted">
                  {provinceRecords.length} 个念想 · {cityGroups.length} 个城市
                </p>
                <div className="city-list">
                  {cityGroups.map((item) => (
                    <button
                      key={item.name}
                      className={`city-pill ${city === item.name ? 'active' : ''}`}
                      onClick={() => chooseCity(item.name)}
                    >
                      <span>{item.name}</span>
                      <b>{item.count}</b>
                    </button>
                  ))}
                </div>
                {!cityGroups.length ? <p className="muted">这个省还没有城市线索，直接看下方封面。</p> : null}
              </aside>
            ) : null}

            {isMobile && province && provinceZoomed && !city ? (
              <section className="mobile-city-sheet glass">
                <p className="eyebrow">
                  <MapPin size={13} /> {SHORT_PROVINCE(province)} · 选城市
                </p>
                <div className="city-list">
                  {cityGroups.map((item) => (
                    <button
                      key={item.name}
                      className={`city-pill ${city === item.name ? 'active' : ''}`}
                      onClick={() => chooseCity(item.name)}
                    >
                      <span>{item.name}</span>
                      <b>{item.count}</b>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {shelfRecords.length && (!isMobile || city) ? (
              <section className="shelf glass">
                <div className="shelf-head">
                  <div>
                    <p className="eyebrow">{city ? '城市' : '省份'} · {shelfTitle}</p>
                    <h3>
                      {shelfRecords.length} 个念想 <small>左右滑动看全部</small>
                    </h3>
                  </div>
                  <div className="shelf-actions">
                    {!isMobile ? (
                      <>
                        <button className="arrow" onClick={() => scrollShelf(-1)} aria-label="向左">
                          ‹
                        </button>
                        <button className="arrow" onClick={() => scrollShelf(1)} aria-label="向右">
                          ›
                        </button>
                      </>
                    ) : null}
                    <button className="ghost small" onClick={openShelfAll}>
                      看全部 <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="shelf-row" ref={shelfRef}>
                  {shelfRecords.map((record, index) => (
                    <TiltCard key={record.id} record={record} onOpen={setSelected} index={index} />
                  ))}
                </div>
              </section>
            ) : null}

            <p className="map-hint glass">
              <Compass size={13} /> 可拖动 · 滚轮/双指缩放 · 点省份 → 点城市 · 城市颜色越深收藏越多
            </p>
          </main>
        ) : page === 'search' ? (
          <div key="search" className="page-enter">
            <SearchPage
              query={query}
              setQuery={setQuery}
              records={records}
              recent={recentSearches}
              onRemember={rememberSearch}
              onOpen={setSelected}
              onBack={() => setPage('map')}
            />
          </div>
        ) : page === 'trash' ? (
          <div key="trash" className="page-enter">
            <TrashPage
              trash={trash}
              onBack={() => setPage('profile')}
              onRestore={restoreFromTrash}
              onPurge={purgeFromTrash}
              onEmpty={emptyTrash}
            />
          </div>
        ) : page === 'profile' ? (
          <div key="profile" className="page-enter">
            <ProfilePage records={records} onOpen={setSelected} user={user} onLogout={logout} theme={theme} onTheme={changeTheme} online={online} onInstall={installApp} trashCount={trash.length} onOpenTrash={() => setPage('trash')} />
          </div>
        ) : (
          <div key={page} className="page-enter">
            <CollectionPage
              page={page}
              records={
                page === 'recipe'
                  ? records.filter((r) => r.kind === 'recipe')
                  : page === 'inspiration'
                    ? records.filter((r) => r.kind !== 'recipe' && !r.place)
                    : savedRecords
              }
              query={query}
              setQuery={setQuery}
              onOpen={setSelected}
              filterLabel={page === 'saved' ? pageFilter?.label : null}
              onClearFilter={() => setPageFilter(null)}
              onAdd={DEMO_MODE ? null : () => setAddOpen(true)}
              pendingRecords={page === 'inspiration' ? pendingRecords : []}
              onLocate={setLocating}
              onBulkLocate={setBulkTargets}
              onBulkDelete={moveToTrash}
            />
          </div>
        )}
      </>

      <Dock page={page} onChange={changePage} badges={{ inspiration: pendingRecords.length }} />

      <AnimatePresence>
        {selected ? (
          <DetailSheet
            record={selected}
            onClose={() => setSelected(null)}
            onRelocate={() => { setLocating(selected); setSelected(null); }}
            onAnalyzeRecipe={analyzeRecipe}
            recipeCached={Boolean(recipeCache[selected.id])}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {addOpen ? (
          <AddLinkModal
            cities={cities}
            existingIds={new Set(records.map((record) => record.id))}
            onClose={() => setAddOpen(false)}
            onAdd={addRecord}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {locating ? (
          <LocationPicker
            record={locating}
            cities={cities}
            chinaGeo={chinaGeo}
            theme={theme}
            isMobile={isMobile}
            onClose={() => setLocating(null)}
            onSave={(location) => saveLocation(locating.id, location)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {bulkTargets.length ? (
          <LocationPicker
            record={{ title: `为 ${bulkTargets.length} 条念想选地点` }}
            cities={cities}
            chinaGeo={chinaGeo}
            theme={theme}
            isMobile={isMobile}
            onClose={() => setBulkTargets([])}
            onSave={(location) => saveLocations(bulkTargets.map((record) => record.id), location)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {analyzing ? <RecipeLoading record={analyzing} onClose={() => setAnalyzing(null)} /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {recipeView ? (
          <RecipeSheet
            record={recipeView.record}
            recipe={recipeView.recipe}
            onClose={() => setRecipeView(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {toast ? <Toast key={toast.id} message={toast.message} onClose={() => setToast(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}
