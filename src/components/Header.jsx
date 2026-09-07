export default function Header(props) {
  const { activeTab, setActiveTab } = props;

  return (
    <>
      {/* Header */}
          <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 text-slate-800 shadow-[0_8px_30px_-24px_rgba(6,78,59,.45)] backdrop-blur-xl no-print">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex min-h-16 items-center justify-between gap-2 py-2 sm:min-h-20 sm:gap-3 sm:py-3">
                <button className="group flex min-w-0 items-center gap-3 text-left" onClick={() => setActiveTab('booking')} aria-label="回到線上預約首頁">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-lg text-white shadow-lg transition-transform group-hover:-translate-y-0.5 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">🚚</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-base font-black tracking-tight text-emerald-950 sm:text-xl">大型傢俱清運</span>
                      <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 xl:inline">Google 雲端版</span>
                    </span>
                    <span className="mt-0.5 hidden text-xs font-medium text-slate-400 sm:block">民眾線上申請、進度查詢與清運管理</span>
                  </span>
                </button>
                <nav className="flex shrink-0 items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1" aria-label="市民服務">
                  {[['booking','📝','線上預約'],['query','🔍','進度查詢']].map(([id, icon, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined} className={'flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-all sm:px-4 ' + (activeTab === id ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/10' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800')}>
                      <span>{icon}</span><span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </nav>
              </div>

            </div>
          </header>
    </>
  );
}
