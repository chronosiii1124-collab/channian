import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Loader2, Plus, RefreshCw, Sparkles, X } from 'lucide-react';

const URL_RE = /https?:\/\/[^\s<>"']+/i;

function extractUrl(text) {
  const match = text.match(URL_RE);
  return match ? match[0].replace(/[),.!;]+$/, '') : '';
}

function extractVideoId(url) {
  const match = url.match(/\/(?:video|note|explore)\/(\d+)/) || url.match(/[?&](?:modal_id|aweme_id)=(\d+)/);
  return match ? match[1] : '';
}

export default function AddLinkModal({ cities, existingIds, onClose, onAdd }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const parsedUrl = useMemo(() => extractUrl(text), [text]);
  const parsedId = useMemo(() => extractVideoId(parsedUrl), [parsedUrl]);

  useEffect(() => {
    if (!parsedUrl) {
      setResult(null);
      setResolving(false);
      setError('');
      return undefined;
    }
    if (!/^https:\/\/([a-z0-9-]+\.)*(douyin|xiaohongshu)\.com\//i.test(parsedUrl)) {
      setError('先粘贴一个抖音或小红书链接');
      setResult(null);
      setResolving(false);
      return undefined;
    }

    const controller = new AbortController();
    let alive = true;
    const timer = setTimeout(async () => {
      setResolving(true);
      setError('');
      setResult(null);
      try {
        const response = await fetch(`/api/resolve?url=${encodeURIComponent(parsedUrl)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!alive) return;
        if (!response.ok || !data.ok) {
          setError(data.error || '这条链接没识别出来，换一条试试');
          return;
        }
        setResult(data);
      } catch (err) {
        if (alive && err.name !== 'AbortError') setError('识别服务没有响应，确认本地服务在运行');
      } finally {
        if (alive) setResolving(false);
      }
    }, 650);

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [parsedUrl, reloadKey]);

  function submit(event) {
    event.preventDefault();
    setError('');
    if (!parsedUrl) {
      setError('先粘贴一个链接');
      return;
    }
    if (!result) {
      setError(resolving ? '还在识别，等一下' : '先识别成功再加入');
      return;
    }
    const id = parsedId || `link-${Date.now()}`;
    if (existingIds.has(id)) {
      setError('这条已经在念想里了');
      return;
    }
    onAdd({
      id,
      title: result.title || '新念想',
      author: '自动识别',
      url: result.url || parsedUrl,
      cover: result.cover || '',
      city: result.city || '',
      province: result.province || '',
      coord: result.coord || null,
      kind: 'place',
      source: '自动识别',
      place: '',
      date: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section
        className="add-modal glass-strong"
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>
        <p className="eyebrow">
          <Sparkles size={13} /> AI 自动识别
        </p>
        <h2>加入一个念想</h2>
        <p className="muted">只粘链接，标题、城市和封面自动生成，不需要手填。</p>

        <form onSubmit={submit} className="add-form">
          <label>
            分享链接
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="粘贴“复制此链接，打开抖音…”整段也可以"
              rows={3}
              autoFocus
            />
          </label>

          {parsedUrl ? (
            <p className="add-parsed">
              <Link2 size={13} /> 已识别 {parsedId ? `作品 ${parsedId}` : '短链接'}
            </p>
          ) : null}

          {resolving ? (
            <div className="add-resolving">
              <Loader2 size={18} className="spin" />
              <div>
                <strong>正在识别标题、城市和封面</strong>
                <span>第一次识别会打开一次本地浏览器，稍等几秒。</span>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="add-result">
              <div className="add-result-cover">
                {result.cover ? <img src={result.cover} alt="" /> : <span>🍜</span>}
              </div>
              <div className="add-result-body">
                <strong>{result.title}</strong>
                <p>
                  {result.city || '城市未识别'}
                  {result.province ? ` · ${result.province}` : ''}
                </p>
                <button type="button" className="add-retry" onClick={() => setReloadKey((value) => value + 1)}>
                  <RefreshCw size={12} /> 重新识别
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="add-actions">
            <button type="button" className="ghost" onClick={onClose}>取消</button>
            <button type="submit" className="primary" disabled={!result || resolving}>
              <Plus size={15} /> 加入念想
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}
