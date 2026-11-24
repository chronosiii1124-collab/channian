import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChefHat, Clock, ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import { RECIPE_STEPS } from './recipeData';

export function RecipeLoading({ record, onClose }) {
  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section
        className="analysis-modal glass-strong"
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <span className="analysis-emoji">🍳</span>
        <Loader2 size={22} className="spin" />
        <h2>正在看这条视频</h2>
        <p>拆食材、理步骤、加一点表情包，马上好…</p>
        <small>{record.title}</small>
      </motion.section>
    </motion.div>
  );
}

export default function RecipeSheet({ record, recipe: recipeProp, onClose }) {
  const recipe = recipeProp || RECIPE_STEPS[record.id];
  const [done, setDone] = useState(new Set());
  const [copied, setCopied] = useState(false);

  if (!recipe) return null;
  const progress = Math.round((done.size / recipe.steps.length) * 100);

  function toggle(index) {
    setDone((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function copyRecipe() {
    const text = [
      record.title,
      '',
      '食材：',
      recipe.ingredients.join('、'),
      '',
      ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function openVideo() {
    window.open(record.url || `https://www.douyin.com/video/${record.id}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.article
        className="recipe-sheet glass-strong"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>

        <div className="recipe-hero">
          {record.cover ? <img src={record.cover} alt="" /> : <div className="cover-fallback">🍳</div>}
          <div className="recipe-hero-shade" />
          <div className="recipe-hero-copy">
            <p className="eyebrow"><ChefHat size={13} /> 文字版菜谱</p>
            <h2>{record.title}</h2>
            <p>{record.city || '地点待定'} · {recipe.steps.length} 步 · 约 {Math.max(10, recipe.steps.length * 4)} 分钟</p>
          </div>
        </div>

        <div className="recipe-body">
          <p className="recipe-disclaimer"><Sparkles size={13} /> {recipe.note}</p>

          <section className="recipe-block">
            <h3>🥕 食材</h3>
            <div className="ingredient-chips">
              {recipe.ingredients.map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>

          <section className="recipe-block">
            <div className="recipe-progress">
              <h3>👩‍🍳 步骤 <small>{done.size}/{recipe.steps.length}</small></h3>
              <div><i style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="step-list">
              {recipe.steps.map((step, index) => (
                <button
                  key={step}
                  className={`step-row ${done.has(index) ? 'done' : ''}`}
                  onClick={() => toggle(index)}
                >
                  <span className="step-check">{done.has(index) ? <Check size={13} /> : index + 1}</span>
                  <span>{step}</span>
                </button>
              ))}
            </div>
          </section>

          {recipe.tips?.length ? (
            <section className="recipe-tips">
              <Clock size={14} /> 💡 {recipe.tips.join(' ')}
            </section>
          ) : null}

          <div className="recipe-actions">
            <button className="ghost" onClick={copyRecipe}>{copied ? '✅ 已复制' : '📋 复制菜谱'}</button>
            <button className="primary" onClick={openVideo}><ExternalLink size={15} /> 🎬 看原视频</button>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}
