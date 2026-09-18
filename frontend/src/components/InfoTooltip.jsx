export default function InfoTooltip({ text }) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        tabIndex={0}
        className="ml-1 flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-600 text-[9px] leading-none text-slate-500 hover:border-blue-400 hover:text-blue-400 focus:border-blue-400 focus:text-blue-400 focus:outline-none"
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-48 -translate-x-1/2 rounded-md border border-slate-700 bg-[#0F1729] px-2.5 py-1.5 text-[11px] leading-snug text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}
