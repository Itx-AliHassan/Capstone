export default function Modal({ open, onClose, title, children, width='max-w-2xl' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-4 grid place-items-center" onMouseDown={onClose}>
    <div className={`w-full ${width} max-h-[90vh] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl`} onMouseDown={e=>e.stopPropagation()}>
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"><h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2><button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button></div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}
