export default function AdminHeader(props) {
  const { activeTab, setActiveTab } = props;

  return (
    <>
      {/* Header */}
          <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 text-slate-800 shadow-[0_8px_30px_-24px_rgba(6,78,59,.45)] backdrop-blur-xl no-print">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex min-h-16 items-center justify-between gap-2 py-2 sm:min-h-20 sm:gap-3 sm:py-3">
                <button className="group flex min-w-0 items-center gap-3 text-left" onClick={() => window.location.href = './index.html'} aria-label="回到市民服務">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-lg text-white shadow-lg transition-transform group-hover:-translate-y-0.5 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">🚚</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-base font-black tracking-tight text-emerald-950 sm:text-xl">清潔隊管理後台</span>
                      <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 xl:inline">Google 雲端版</span>
                    </span>
                    <span className="mt-0.5 hidden text-xs font-medium text-slate-400 sm:block">案件審核、車輛調度與清運結案</span>
                  </span>
                </button>
                <nav className="flex shrink-0 items-center gap-2" aria-label="後台導覽">
                  <button type="button" onClick={() => setActiveTab('admin')} className={'hidden min-h-10 items-center rounded-xl px-4 text-sm font-black transition-colors md:flex ' + (activeTab === 'admin' ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>案件管理</button>
                  <button type="button" onClick={() => setActiveTab('dashboard')} className={'flex min-h-10 items-center rounded-xl px-3 text-sm font-black transition-colors sm:px-4 ' + (activeTab === 'dashboard' ? 'bg-sky-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>📊 Dashboard</button>
                  <span className="hidden items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 sm:flex">
                    <span>🛡️</span><span>後台管理模式</span>
                  </span>
                  <a href="./index.html" className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-white/10 hover:text-white sm:px-4">
                    <span>←</span><span className="hidden sm:inline">返回民眾服務</span>
                  </a>
                </nav>
              </div>
            </div>
          </header>
    </>
  );
}
