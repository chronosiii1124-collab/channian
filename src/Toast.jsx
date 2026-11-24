import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  return (
    <motion.div
      className="toast glass-strong"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <span className="toast-icon"><Check size={13} /></span>
      <span>{message}</span>
      <button onClick={onClose} aria-label="关闭提示"><X size={13} /></button>
    </motion.div>
  );
}
