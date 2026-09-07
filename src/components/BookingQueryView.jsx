export default function BookingQueryView(props) {
  const { activeTab, formatMinguoDate, getMinguoTime, setPrintableBooking, searchQuery, setSearchQuery, searchPhone, setSearchPhone, searchResults, hasSearched, handleSearchSubmit } = props;

  return (
    <>
      {/* TAB 2: Booking Query */}
            {activeTab === 'query' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl space-y-6">
                  <h2 className="text-2xl font-black text-white">🔍 廢棄傢俱預約進度查詢</h2>
                  <form onSubmit={handleSearchSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="text"
                      placeholder="案件編號（如 1150902001）"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100"
                    />
                    <input
                      type="tel"
                      placeholder="申請時的完整聯絡電話"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100"
                    />
                    <button type="submit" className="w-full px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm sm:w-auto">
                      查詢
                    </button>
                  </form>

                  <p className="text-[11px] text-slate-400">為保護個人資料，必須同時輸入案件編號與申請時的完整聯絡電話。</p>
                </div>

                {hasSearched && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">查詢結果 ({searchResults.length} 筆)</h3>
                    {searchResults.map((b) => (
                      <div key={b.id} className="glass-card rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                          <div>
                            <span className="text-lg font-mono font-black text-emerald-400">{b.id}</span>
                            <span className="ml-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              {b.status}
                            </span>
                          </div>
                          <button
                            onClick={() => setPrintableBooking(b)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30"
                          >
                            🖨️ 列印標籤/QR Code
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                          <div><span className="text-slate-400">查詢電話：</span><strong>{b.phone}</strong></div>
                          <div><span className="text-slate-400">希望日期：</span><strong>{formatMinguoDate(b.preferredDate)} ({String(b.preferredTimeSlot || '未指定').split(' ')[0]})</strong></div>
                          <div className="col-span-2"><span className="text-slate-400">地址：</span><strong>{b.address}</strong></div>
                          <div className="col-span-2"><span className="text-slate-400">品項：</span><strong className="text-emerald-400">{b.itemsChinese || b.items?.map(i => `${i.name}x${i.quantity}`).join(', ')}</strong></div>
                        </div>

                        {/* Status Timeline & Completion Photos */}
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-slate-400">處理時間軸：</span>
                          {b.statusTimeline?.map((t, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                              <span className="text-emerald-400">•</span>
                              <div>
                                <span className="font-bold">{t.status}</span> ({getMinguoTime(t.time)})
                                {t.note && <p className="text-slate-400 text-[11px]">{t.note}</p>}
                                {t.drivePhotoUrl && (
                                  <div className="mt-1 space-y-1">
                                    <span className="text-amber-400 text-[11px] font-bold block">📷 清潔隊現場結案照：</span>
                                    <div className="flex items-center space-x-2">
                                      <img src={t.drivePhotoUrl} className="w-24 h-24 object-cover rounded border border-slate-700 shadow" />
                                      <a
                                        href={t.drivePhotoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-xs font-bold border border-teal-500/30 transition-all inline-flex items-center space-x-1"
                                      >
                                        <span>🔗 在 Google Drive 開啟照片</span>
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
    </>
  );
}
