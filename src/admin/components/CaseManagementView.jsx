import { CATEGORIES } from '../../data/appData.js';

export default function CaseManagementView(props) {
  const { activeTab, formatMinguoDate, getMinguoTime, vehicleSelections, setVehicleSelections, tripSelections, setTripSelections, appointmentTimeEditor, setAppointmentTimeEditor, vehicles, showVehicleManager, setShowVehicleManager, newVehicle, setNewVehicle, caseListView, setCaseListView, caseKeyword, setCaseKeyword, bookings, setPrintableBooking, setCompletionModalBooking, setPhotoPreview, isAdminAuth, setIsAdminAuth, adminPasswordInput, setAdminPasswordInput, isCheckingPassword, loginError, quantityDrafts, setQuantityDrafts, reviewItemDrafts, setReviewItemDrafts, reviewNoteDrafts, setReviewNoteDrafts, quantitySaving, quantityEditing, setQuantityEditing, aiSaving, getDispatchDate, getDispatchPeriod, getRouteKey, getNextDispatchTrip, getDispatchChoices, getDispatchLabel, getCountyDistrict, getLocalAddress, addVehicle, removeVehicle, getPhotoPreviewUrl, handleAdminLogin, handleAdminUpdateStatus, getRouteCarbon, getCustomRouteCarbon, getSuggestedRouteUrl, openRouteEditor, saveAppointmentTime, handleScheduleBooking, handleConfirmQuantity, handleRetryAi, handleCancelSchedule, handleExportCSV, isPendingStatus, getDisplayStatus, pendingCount, visibleCaseBookings } = props;
  const getCreatedAtSortValue = (value) => {
    const raw = String(value || '').trim();
    const minguo = raw.match(/^(?:民國\s*)?(\d{2,3})[/.\-](\d{1,2})[/.\-](\d{1,2})(?:(上午|下午)?\s*(\d{1,2})[:時](\d{1,2})?)?/);
    if (minguo) {
      let hour = Number(minguo[5] || 0);
      if (minguo[4] === '下午' && hour < 12) hour += 12;
      if (minguo[4] === '上午' && hour === 12) hour = 0;
      return new Date(Number(minguo[1]) + 1911, Number(minguo[2]) - 1, Number(minguo[3]), hour, Number(minguo[6] || 0)).getTime();
    }
    const timestamp = Date.parse(raw);
    return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
  };
  const getCategoryName = (value) => {
    const name = String(value || '').trim();
    if (/床墊|彈簧床(?!框)/.test(name)) return '床墊';
    if (/櫃|斗櫃/.test(name)) return '櫃子';
    if (/桌|茶几/.test(name)) return '桌子';
    if (/椅|沙發/.test(name)) return '椅子';
    if (/電視/.test(name)) return '電視';
    if (/冰箱/.test(name)) return '冰箱';
    return '其他';
  };
  const normalizeItemEntries = (items) => (items || []).flatMap((item) => {
    const rawName = String(item.name || item.categoryName || '').trim();
    if (!/[；;,、]/.test(rawName) || !/[x×]\s*\d+/i.test(rawName)) return [{ ...item, name: rawName }];
    return rawName.split(/[；;,、]/).map((part) => {
      const match = part.trim().match(/^(.+?)\s*[x×]\s*(\d+)\s*件?(?:\s*\(.*?\))?$/i);
      return match ? { name: match[1].trim(), quantity: Number(match[2]) } : null;
    }).filter(Boolean);
  });
  const sumItemsByCategory = (items) => normalizeItemEntries(items).reduce((totals, item) => {
    const category = getCategoryName(item.name);
    totals[category] = (totals[category] || 0) + Number(item.quantity || 0);
    return totals;
  }, {});
  const getReviewItems = (booking) => {
    const declared = sumItemsByCategory(booking.items);
    const ai = sumItemsByCategory(booking.aiReview?.items);
    const confirmed = sumItemsByCategory(booking.confirmedItems);
    const draft = sumItemsByCategory(reviewItemDrafts[booking.id]);
    const hasDraft = Boolean(reviewItemDrafts[booking.id]);
    const hasConfirmed = Boolean(booking.confirmedItems?.length);
    return CATEGORIES.map((category) => ({
      name: category.name,
      description: category.desc,
      declaredQuantity: Number(declared[category.name] || 0),
      aiQuantity: Number(ai[category.name] || 0),
      quantity: hasDraft ? Number(draft[category.name] || 0) : hasConfirmed ? Number(confirmed[category.name] || 0) : Number(declared[category.name] || 0)
    }));
  };

  return (
    <>
      {/* TAB 3: Sanitation Admin Dashboard */}
            {activeTab === 'admin' && (
              <div className="max-w-7xl mx-auto space-y-6">
                {!isAdminAuth ? (
                  <div className="glass-card max-w-md mx-auto mt-20 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6">
                    <div className="text-4xl">🔒</div>
                    <h2 className="text-xl font-bold text-white">請輸入後台管理密碼</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <input 
                        type="password" 
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="請輸入密碼..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 text-center focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      {loginError && <p className="text-rose-400 text-xs">{loginError}</p>}
                      <button type="submit" disabled={isCheckingPassword} className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition-all">
                        {isCheckingPassword ? '驗證中...' : '登入後台'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-white">🚚 清潔隊廢棄傢俱車輛調度後台</h2>
                        <p className="text-xs text-slate-400">支援核可排班與現場拍照結案，照片自動上傳至 Google Drive 備查</p>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:space-x-3">
                        <button onClick={() => setShowVehicleManager((current) => !current)} className="px-4 py-2 rounded-xl bg-slate-800 text-sky-300 text-xs font-bold border border-slate-700 hover:text-white">
                          🚚 車輛管理
                        </button>
                        <button onClick={() => { setIsAdminAuth(false); localStorage.removeItem('admin_auth_until'); }} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 hover:text-white">
                          登出
                        </button>
                        <button onClick={handleExportCSV} className="col-span-2 px-4 py-2 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700 sm:col-span-1">
                          📊 匯出 Excel / CSV
                        </button>
                      </div>
                    </div>

                    {showVehicleManager && <div className="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-black text-white">車輛管理</h3><p className="mt-1 text-xs text-slate-400">新增或移除排班可選車號；已排班案件不受刪除影響。</p></div><div className="flex gap-2"><input value={newVehicle} onChange={(e) => setNewVehicle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addVehicle(); }} placeholder="輸入車號" className="w-36 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-bold text-white"/><button onClick={addVehicle} className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-black text-slate-950">新增車號</button></div></div><div className="mt-3 flex flex-wrap gap-2">{vehicles.map((vehicle) => <span key={vehicle} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-black text-slate-100">🚛 {vehicle}<button onClick={() => removeVehicle(vehicle)} className="text-rose-400 hover:text-rose-300" aria-label={'移除車號 ' + vehicle}>✕</button></span>)}</div></div>}

                    {/* Metric Summary */}
                    <div className="grid grid-cols-2 gap-3 text-center lg:grid-cols-4">
                      <button type="button" onClick={() => setCaseListView('all')} aria-pressed={caseListView === 'all'} className={'glass-card rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ' + (caseListView === 'all' ? 'border-sky-400 ring-2 ring-sky-400/50' : 'border-white/10')}>
                        <span className="text-xs text-slate-400 block">總預約案件</span>
                        <strong className="text-2xl text-slate-100">{bookings.length}</strong>
                        <span className="mt-1 block text-[10px] font-bold text-sky-300">點選查看全部</span>
                      </button>
                      <button type="button" onClick={() => setCaseListView('pending')} aria-pressed={caseListView === 'pending'} className={'glass-card rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ' + (caseListView === 'pending' ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/10')}>
                        <span className="text-xs text-slate-400 block">待處理未排班</span>
                        <strong className="text-2xl text-amber-400">{pendingCount}</strong>
                        <span className="mt-1 block text-[10px] font-bold text-amber-300">點選查看待處理</span>
                      </button>
                      <button type="button" onClick={() => setCaseListView('scheduled')} aria-pressed={caseListView === 'scheduled'} className={'glass-card rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 ' + (caseListView === 'scheduled' ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-white/10')}>
                        <span className="text-xs text-slate-400 block">已排班調度</span>
                        <strong className="text-2xl text-emerald-400">{bookings.filter(b=>b.status==='已排班').length}</strong>
                        <span className="mt-1 block text-[10px] font-bold text-emerald-300">點選查看已排班</span>
                      </button>
                      <button type="button" onClick={() => setCaseListView('completed')} aria-pressed={caseListView === 'completed'} className={'glass-card rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300 ' + (caseListView === 'completed' ? 'border-slate-300 ring-2 ring-slate-300/50' : 'border-white/10')}>
                        <span className="text-xs text-slate-400 block">已完成清運</span>
                        <strong className="text-2xl text-slate-300">{bookings.filter(b=>b.status==='清運完成').length}</strong>
                        <span className="mt-1 block text-[10px] font-bold text-slate-300">點選查看已完成</span>
                      </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-lg shadow-slate-300/20">
                      <div className="flex flex-col gap-3 border-b border-slate-200 bg-emerald-50/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-800">清運案件列表</h3>
                          <p className="mt-0.5 text-xs text-slate-500">目前顯示 {visibleCaseBookings.length} 筆／共 {bookings.length} 筆案件，依申請時間由最早至最新排列</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 gap-2">
                            <label className="relative min-w-0 flex-1 sm:w-72"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">⌕</span><input type="search" value={caseKeyword} onChange={(event) => setCaseKeyword(event.target.value)} placeholder="搜尋電話、單號、地址、申請人姓名" aria-label="搜尋清運案件" className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                            {caseKeyword && <button type="button" onClick={() => setCaseKeyword('')} className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-100">清除</button>}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-[11px] font-bold">
                            {[['active','進行中'],['pending','待處理'],['scheduled','已排班'],['completed','已完成'],['cancelled','已取消'],['all','全部']].map(([view, label]) => <button type="button" key={view} onClick={() => setCaseListView(view)} className={'rounded-lg px-3 py-1.5 transition-colors ' + (caseListView === view ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>{label}</button>)}
                          </div>
                        </div>
                      </div>

                      <div className="w-full overflow-x-auto overscroll-x-contain">
                        <table className="min-w-[1120px] table-fixed text-left text-sm">
                          <thead className="border-b border-slate-200 bg-slate-100 text-xs font-bold tracking-wide text-slate-600">
                            <tr>
                              <th className="w-[7%] px-2 py-3.5 text-center">標籤</th>
                              <th className="w-[18%] px-2 py-3.5"><span className="flex min-h-[3rem] flex-col justify-between"><span className="block text-xs font-bold text-slate-600">案件單號／申請時間</span><span className="block text-xs font-bold text-slate-600">申請人</span></span></th>
                              <th className="w-[20%] px-2 py-3.5"><span className="flex min-h-[3rem] flex-col justify-between"><span className="block text-xs font-bold text-slate-600">預約日期</span><span className="block text-xs font-bold text-slate-600">清運地址</span></span></th>
                              <th className="w-[24%] px-2 py-3.5">清運品項</th>
                              <th className="w-[16%] px-2 py-3.5">狀態／排班</th>
                              <th className="w-[15%] px-2 py-3.5 text-right">案件操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700">
                            {!visibleCaseBookings.length && <tr><td colSpan="6" className="bg-white px-4 py-12 text-center text-sm font-bold text-slate-400">{caseKeyword ? '找不到符合搜尋條件的案件' : '此分類目前沒有案件'}</td></tr>}
                            {[...visibleCaseBookings].sort((a, b) => getCreatedAtSortValue(a.createdAt) - getCreatedAtSortValue(b.createdAt) || String(a.id || '').localeCompare(String(b.id || ''), 'zh-Hant')).map((b, rowIndex, ordered) => {
                              const routeGroupKey = b.status === '已排班' ? getRouteKey(b) : '';
                              const groupBookings = routeGroupKey ? ordered.filter((item) => item.status === '已排班' && getRouteKey(item) === routeGroupKey) : [b];
                              const groupKey = '';
                              const isGroupStart = groupKey && (rowIndex === 0 || getRouteKey(ordered[rowIndex - 1]) !== groupKey || ordered[rowIndex - 1].status !== '已排班');
                              const isGroupEnd = groupKey && (rowIndex === ordered.length - 1 || getRouteKey(ordered[rowIndex + 1]) !== groupKey || ordered[rowIndex + 1].status !== '已排班');
                              return (
                              <tr key={b.id} className={(rowIndex % 2 === 0 ? 'bg-white ' : 'bg-slate-50 ') + 'align-top transition-colors hover:bg-emerald-50 ' + (groupKey ? '[&>td:first-child]:border-l-2 [&>td:first-child]:border-l-emerald-400 [&>td:last-child]:border-r-2 [&>td:last-child]:border-r-emerald-400 ' : '') + (isGroupStart ? '[&>td]:border-t-2 [&>td]:border-t-emerald-400 ' : '') + (isGroupEnd ? '[&>td]:border-b-2 [&>td]:border-b-emerald-400 ' : '')}>
                                <td className="px-2 py-4 text-center">
                                  <button onClick={() => setPrintableBooking(b)} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">🏷️ 標籤</button>
                                </td>
                                <td className="px-2 py-4">
                                  <span className="block break-all font-mono text-[13px] font-black text-emerald-700">{b.id}</span>
                                  <span className="mt-1 block text-[11px] leading-4 text-slate-500">{getMinguoTime(b.createdAt)}</span>
                                  <div className="mt-3 border-t border-slate-200 pt-2">
                                    <span className="block font-bold text-slate-800">{b.applicantName}</span>
                                    <span className="mt-0.5 block font-mono text-xs text-slate-500">{b.phone}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-4 break-words">
                                  <span className="block text-[10px] font-black text-slate-500">{b.adjustedDate || b.adjustedPeriod ? '管理端正式清運時間' : '民眾希望時間'}</span>
                                  <span className="font-bold text-slate-800">{formatMinguoDate(getDispatchDate(b))}</span>
                                  <span className="mt-1 block text-xs text-emerald-700">{getDispatchPeriod(b)}</span>
                                  {(b.adjustedDate || b.adjustedPeriod) && <span className="mt-1 block text-[10px] text-slate-400">民眾希望：{formatMinguoDate(b.preferredDate)} {b.preferredTimeSlot?.split(' ')[0]}</span>}
                                  {appointmentTimeEditor?.id === b.id ? <div className="mt-2 space-y-1 rounded-lg border border-violet-200 bg-violet-50 p-2"><input type="date" value={appointmentTimeEditor.date} onChange={(e) => setAppointmentTimeEditor((current) => ({ ...current, date: e.target.value }))} className="w-full rounded border border-violet-200 bg-white px-2 py-1 text-xs text-slate-800" /><select value={appointmentTimeEditor.period} onChange={(e) => setAppointmentTimeEditor((current) => ({ ...current, period: e.target.value }))} className="w-full rounded border border-violet-200 bg-white px-2 py-1 text-xs text-slate-800"><option value="上午">上午</option><option value="下午">下午</option></select><div className="flex gap-1"><button type="button" onClick={() => saveAppointmentTime(b)} className="flex-1 rounded bg-violet-600 px-2 py-1 text-[10px] font-black text-white">確認修改</button><button type="button" onClick={() => setAppointmentTimeEditor(null)} className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700">取消</button></div></div> : <button type="button" onClick={() => setAppointmentTimeEditor({ id: b.id, date: getDispatchDate(b), period: getDispatchPeriod(b) === '下午' ? '下午' : '上午' })} className="mt-2 rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700 hover:bg-violet-100">修改案件時間</button>}
                                  <div className="mt-3 border-t border-slate-200 pt-2 leading-5">
                                    <span className="block font-black text-slate-700">{getCountyDistrict(b)}</span>
                                    {b.mapLink ? (
                                      <a href={b.mapLink} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sky-700 underline decoration-sky-300 underline-offset-2 transition-colors hover:text-emerald-700" title="開啟 Google Maps">{getLocalAddress(b)}</a>
                                    ) : <span className="mt-1 block text-slate-700">{getLocalAddress(b)}</span>}
                                  </div>
                                </td>
                                <td className="px-2 py-4 break-words leading-6 text-slate-300">
                                  <div>{b.itemsChinese || b.items?.map(i => i.name + ' × ' + i.quantity).join('、')}</div>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {(b.photos || []).length > 0 ? (b.photos || []).map((photoUrl, photoIndex) => (
                                      <button type="button" key={photoIndex} onClick={() => setPhotoPreview({ url: getPhotoPreviewUrl(photoUrl), title: b.id + ' 申請照片 ' + (photoIndex + 1) })} className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-700 transition-colors hover:bg-sky-600 hover:text-white" title={'查看 ' + b.id + ' 第 ' + (photoIndex + 1) + ' 張申請照片'}>📷 申請照片 {photoIndex + 1}</button>
                                    )) : <span className="text-[10px] font-bold text-slate-500">尚未上傳申請照片</span>}
                                  </div>
                                  {!!(b.aiAnnotatedPhotos || b.aiReview?.annotatedPhotos || []).length && <div className="mt-2 flex flex-wrap gap-1 rounded-lg border border-rose-200 bg-rose-50 p-2">
                                    <strong className="w-full text-[10px] text-rose-800">AI 紅框標註照片（已存 Google Drive）</strong>
                                    {(b.aiAnnotatedPhotos || b.aiReview?.annotatedPhotos || []).map((photo, photoIndex) => <button type="button" key={photo.fileId || photoIndex} onClick={() => setPhotoPreview({ url: getPhotoPreviewUrl(photo.fileUrl || photo.directUrl), title: (photo.fileName || b.id + '-ai-' + (photoIndex + 1) + '.jpg') })} className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white">▣ {photo.fileName || 'AI 標註 ' + (photoIndex + 1)}</button>)}
                                  </div>}
                                  {!!b.aiReview?.annotationErrors?.length && <div className="mt-2 rounded-lg border border-rose-300 bg-rose-100 p-2 text-[10px] font-bold leading-4 text-rose-900"><strong className="block">⚠ AI 紅框照片未完成</strong>{b.aiReview.annotationErrors.map((message, index) => <span key={index} className="block">{message}</span>)}<span className="mt-1 block">請確認已部署最新 GAS，且原始照片與 Drive 資料夾可由部署帳號讀寫後再執行辨識。</span></div>}
                                  <div className={'mt-2 rounded-lg border p-2 text-[10px] leading-4 ' + ((b.quantityReviewStatus === '人工已核可' && !quantityEditing[b.id]) || String(b.quantityReviewStatus || '').startsWith('AI數量吻合') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800')}>
                                    <strong className="block">{b.quantityReviewStatus === '人工已核可' && quantityEditing[b.id] ? '⚠ 修改中，請重新確認' : b.quantityReviewStatus === '人工已核可' ? '☑ 已人工核可' : String(b.quantityReviewStatus || '').startsWith('AI數量吻合') ? '☑ Gemini 數量吻合' : '⚠ ' + (b.quantityReviewStatus || '等待 Gemini 辨識')}</strong>
                                    {b.aiReview && <span className="block">AI：{b.aiReview.error || b.aiReview.items?.map(i => i.name + ' × ' + i.quantity).join('、') || (b.aiReview.totalQuantity != null ? b.aiReview.totalQuantity + ' 件' : '尚無結果')}{b.aiReview.note ? '；' + b.aiReview.note : ''}</span>}
                                    {b.aiReview?.safetyRisk && (() => {
                                      const risk = b.aiReview.safetyRisk;
                                      const riskMeta = risk.level === 'high' ? { label: '高風險', icon: '🚨', className: 'border-rose-300 bg-rose-100 text-rose-900' } : risk.level === 'medium' ? { label: '中風險', icon: '⚠️', className: 'border-amber-300 bg-amber-100 text-amber-900' } : { label: '低風險', icon: '🛡️', className: 'border-emerald-300 bg-emerald-100 text-emerald-900' };
                                      return <div className={'mt-2 rounded-lg border p-2 ' + riskMeta.className}>
                                        <strong className="block text-[11px]">{riskMeta.icon} 現場工安：{riskMeta.label}{risk.uncertain ? '（照片有限／待現勘）' : ''}</strong>
                                        {risk.summary && <span className="mt-0.5 block">{risk.summary}</span>}
                                        {!!risk.features?.length && <ul className="mt-1 list-disc space-y-0.5 pl-4">{risk.features.map((feature, index) => <li key={index}><strong>{feature.label || '風險特徵'}</strong>{feature.evidence ? '：' + feature.evidence : ''}</li>)}</ul>}
                                        {!!risk.recommendations?.length && <span className="mt-1 block border-t border-current/20 pt-1"><strong>建議：</strong>{risk.recommendations.join('；')}</span>}
                                      </div>;
                                    })()}
                                    <div className="mt-2 rounded-lg border border-slate-300 bg-white p-2 text-slate-800">
                                      <strong className="block">人工逐項覆核 {b.quantityReviewStatus === '人工已核可' && !quantityEditing[b.id] && <span className="text-slate-500">🔒 已鎖定</span>}</strong>
                                      <span className="mt-0.5 block text-[9px] font-bold text-sky-700">人工欄位預設帶入民眾申報數量；AI 數量僅供比對，不會自動覆寫。</span>
                                      <div className="mt-1 grid gap-1 sm:grid-cols-2">{getReviewItems(b).map((item, itemIndex) => <label key={item.name + itemIndex} className="rounded border border-slate-200 p-2"><span className="flex items-center justify-between gap-2"><strong>{CATEGORIES[itemIndex]?.icon} {item.name}</strong><span className="flex items-center gap-1 text-[9px] font-black text-emerald-800">確認<input type="number" min="0" step="1" aria-label={item.name + '人工確認數量'} disabled={b.quantityReviewStatus === '人工已核可' && !quantityEditing[b.id]} value={item.quantity} onChange={(e) => { const next = getReviewItems(b).map((current, index) => index === itemIndex ? { ...current, quantity: e.target.value } : current); setReviewItemDrafts((state) => ({ ...state, [b.id]: next })); }} className="w-14 rounded border border-slate-300 px-1 py-0.5 text-center text-sm disabled:bg-slate-200" />件</span></span><span className="mt-1 block text-[9px] leading-3 text-slate-500">{item.description}</span><span className="mt-1 flex flex-wrap gap-1"><span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-800">民眾申報：{item.declaredQuantity} 件</span><span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">AI 辨識：{item.aiQuantity} 件</span></span></label>)}</div>
                                      <label className="mt-2 block font-bold">人工判斷依據（備註，選填）<textarea disabled={b.quantityReviewStatus === '人工已核可' && !quantityEditing[b.id]} value={reviewNoteDrafts[b.id] ?? b.reviewNote ?? ''} onChange={(e) => setReviewNoteDrafts((state) => ({ ...state, [b.id]: e.target.value }))} placeholder="例如：第二個櫃體為同一座組合櫃，照片覆核後計為 1 件" rows="2" className="mt-1 w-full rounded border border-slate-300 p-2 font-normal disabled:bg-slate-200" /></label>
                                      <div className="mt-2 flex items-center justify-between"><span className="font-black">人工確認合計：{getReviewItems(b).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} 件</span><button onClick={() => b.quantityReviewStatus === '人工已核可' && !quantityEditing[b.id] ? setQuantityEditing((current) => ({ ...current, [b.id]: true })) : handleConfirmQuantity(b)} disabled={quantitySaving === b.id} className="rounded bg-emerald-600 px-3 py-1.5 font-black text-white disabled:opacity-50">{quantitySaving === b.id ? '儲存中' : b.quantityReviewStatus === '人工已核可' && !quantityEditing[b.id] ? '修改覆核' : '人工確認並試算'}</button></div>
                                    </div>
                                    {(!b.quantityReviewStatus || String(b.quantityReviewStatus).includes('失敗') || String(b.quantityReviewStatus).includes('忙碌') || b.quantityReviewStatus === '待辨識' || b.aiReview?.annotationErrors?.length || b.aiReview?.annotationPending) && <button onClick={() => handleRetryAi(b)} disabled={aiSaving === b.id || !(b.photos || []).length} className="mt-1 rounded border border-amber-400 bg-white px-2 py-1 font-black text-amber-800 disabled:opacity-50">{aiSaving === b.id ? 'AI 辨識與紅框產生中…' : String(b.quantityReviewStatus || '').includes('失敗') || String(b.quantityReviewStatus || '').includes('忙碌') || b.aiReview?.annotationErrors?.length || b.aiReview?.annotationPending ? '↻ 重新執行 AI 辨識與標註' : '✨ 執行 AI 照片辨識'}</button>}
                                    {b.quantityReviewStatus === '人工已核可' ? <span className="mt-1 block">本戶本年度已核可 {Number(b.annualApprovedApplications || 0)} 次；本次計費 {Number(b.chargeableQuantity || 0)} 件 × 200 元＝<strong>{Number(b.amountDue || 0).toLocaleString()} 元</strong></span> : <span className="mt-1 block rounded bg-rose-100 px-2 py-1 font-black text-rose-800">AI 僅供輔助；尚未人工核可，不得計費或直接採用 AI 件數。</span>}
                                  </div>
                                </td>
                                {(!groupKey || isGroupStart) && <td rowSpan={groupKey ? groupBookings.length : 1} className={groupKey ? 'border-b-2 border-b-emerald-400 bg-emerald-50/50 px-2 py-4 align-top' : 'px-2 py-4 align-top'}>
                                  <span className={'inline-flex whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-black ' + (
                                    b.status === '已排班' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' :
                                    b.status === '清運完成' ? 'border-sky-400/25 bg-sky-400/10 text-sky-300' :
                                    b.status === '已取消' ? 'border-rose-400/25 bg-rose-400/10 text-rose-300' :
                                    'border-amber-400/25 bg-amber-400/10 text-amber-300'
                                  )} aria-label={b.id + ' 目前狀態：' + getDisplayStatus(b.status)}>{getDisplayStatus(b.status)}</span>
                                  {b.status === '已排班' && <><strong className="mt-2 block text-xs font-black leading-5 text-sky-700">{getDispatchLabel(b)}</strong><a href={getSuggestedRouteUrl(b)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-lg border border-amber-300 bg-amber-100 px-2 py-1.5 text-[11px] font-black text-amber-800 transition-colors hover:bg-amber-300">✨ 最佳路線（{groupBookings.length}點）</a><div className="mt-2"><span className="block text-[10px] font-bold leading-4 text-slate-500">里程／碳排量</span><span className="mt-0.5 block text-[10px] font-black leading-4 text-emerald-700">{getRouteCarbon(b)}</span></div>{groupBookings.length > 1 && <div className="mt-3 border-t border-emerald-200 pt-2"><button onClick={() => openRouteEditor(b)} className="rounded-lg border border-violet-300 bg-violet-100 px-2 py-1.5 text-[11px] font-black text-violet-800 hover:bg-violet-300">↕ 自訂路線</button><span className="mt-2 block text-[10px] font-bold leading-4 text-slate-500">里程／碳排量</span><span className="mt-0.5 block text-[10px] font-black leading-4 text-violet-700">{getCustomRouteCarbon(b)}</span></div>}</>}
                                </td>}
                                <td className="bg-white px-2 py-4 align-top">
                                  <div className="flex w-full flex-col gap-2">
                                    {isPendingStatus(b.status) && (
                                      <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                                        <span className="text-[10px] font-black text-slate-500">車輛排班</span>
                                        <select value={vehicleSelections[b.id] || (b.status === '已取消' ? '' : b.assignedVehicle) || ''} onChange={(e) => { const vehicle = e.target.value; setVehicleSelections((prev) => ({ ...prev, [b.id]: vehicle })); setTripSelections((prev) => ({ ...prev, [b.id]: vehicle ? getNextDispatchTrip(b, vehicle) : 1 })); }} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-700" aria-label={'選擇 ' + b.id + ' 的資源回收車'}>
                                          <option value="">選擇車輛</option>
                                          {!vehicles.includes(b.assignedVehicle) && b.assignedVehicle && <option value={b.assignedVehicle}>{b.assignedVehicle}（已停用）</option>}
                                          {vehicles.map((vehicle) => <option key={vehicle} value={vehicle}>{vehicle} 車</option>)}
                                        </select>
                                        {(vehicleSelections[b.id] || (b.status === '已取消' ? '' : b.assignedVehicle)) && (() => { const vehicle = vehicleSelections[b.id] || b.assignedVehicle; const choices = getDispatchChoices(b, vehicle); return choices.length > 1 ? <label className="text-[10px] font-black text-slate-500">選擇合併或新增班次<select value={tripSelections[b.id] || getNextDispatchTrip(b, vehicle)} onChange={(e) => setTripSelections((prev) => ({ ...prev, [b.id]: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-sky-200 bg-sky-50 px-2 py-2 text-[11px] font-black text-sky-700">{choices.map((choice) => <option key={choice.trip} value={choice.trip}>{getDispatchLabel(b, vehicle, choice.trip)}（{choice.mode === 'merge' ? '併入上一班' : '新增下一班'}）</option>)}</select></label> : <span className="block rounded-lg border border-sky-200 bg-sky-50 px-2 py-2 text-center text-[11px] font-black leading-4 text-sky-700">{getDispatchLabel(b, vehicle, 1)}（建立第1班）</span>; })()}
                                        <button onClick={() => handleScheduleBooking(b)} disabled={b.quantityReviewStatus !== '人工已核可' || !(vehicleSelections[b.id] || (b.status === '已取消' ? '' : b.assignedVehicle))} className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">{b.quantityReviewStatus === '人工已核可' ? '核可排班' : '請先完成人工覆核'}</button>
                                      </div>
                                    )}
                                    {b.status === '已排班' && (
                                      <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"><span className="text-center text-[10px] font-black text-slate-500">此案件</span><button onClick={() => setCompletionModalBooking(b)} className="w-full rounded-lg border border-sky-700 bg-sky-600 px-2 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-sky-700">📸 拍照結案</button><button onClick={() => { if (window.confirm('確定取消案件「' + b.id + '」目前的排班？案件將退回待處理並可重新排班。')) handleCancelSchedule(b); }} className="w-full rounded-lg border border-rose-300 bg-white px-2 py-2 text-xs font-black text-rose-600 transition-colors hover:bg-rose-500 hover:text-white">取消排班</button></div>
                                    )}
                                    {b.status === '清運完成' && (() => {
                                      const completedItem = b.statusTimeline?.slice().reverse().find(t => t.status === '清運完成' && (t.drivePhotoUrl || (t.drivePhotoUrls || []).length));
                                      const completedPhotoUrls = completedItem ? (completedItem.drivePhotoUrls?.length ? completedItem.drivePhotoUrls : [completedItem.drivePhotoUrl]).filter(Boolean) : [];
                                      return completedPhotoUrls.length ? (
                                        <span className="flex w-full flex-col gap-1">{completedPhotoUrls.map((photoUrl, photoIndex) => <button type="button" key={photoIndex} onClick={() => setPhotoPreview({ url: getPhotoPreviewUrl(photoUrl), title: b.id + ' 結案照片 ' + (photoIndex + 1) })} className="w-full rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-center text-xs font-bold text-sky-700 transition-colors hover:bg-sky-500 hover:text-white">📷 查看結案照片 {photoIndex + 1}</button>)}</span>
                                      ) : <span className="w-full rounded-lg bg-slate-100 px-2 py-2 text-center text-xs font-bold text-slate-500">已結案</span>;
                                    })()}
                                    {b.status === '清運完成' && <button type="button" onClick={() => { if (window.confirm('確定取消已完成案件「' + b.id + '」？結案照片與歷程仍會保留。')) handleAdminUpdateStatus(b.id, '已取消', '清運完成案件由後台取消'); }} className="w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition-colors hover:bg-rose-600 hover:text-white">取消案件</button>}
                                    {b.status === '已取消' && <span className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">案件已取消</span>}
                                  </div>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
    </>
  );
}
