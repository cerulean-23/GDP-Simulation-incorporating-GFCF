// Editorial section header shared by the Model & Metrics sections.
export default function SectionHead({ n, title, lede }) {
  return (
    <header className="mb-4 border-b border-slate-800 pb-3">
      <p className="font-mono text-[12px] tracking-[0.14em] text-blue-400">{n}</p>
      <h2 className="font-serif text-[20px] font-medium leading-snug tracking-normal text-slate-100 sm:text-[22px]">{title}</h2>
      {lede && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">{lede}</p>}
    </header>
  );
}
