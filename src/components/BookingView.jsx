import MinguoDatePicker from './MinguoDatePicker.jsx';

export default function BookingView(props) {
  const { activeTab, applicantName, setApplicantName, phone, setPhone, email, setEmail, county, setCounty, district, setDistrict, detailAddress, setDetailAddress, selectedItems, photos, setPhotos, preferredDate, setPreferredDate, getUnavailableBookingReason, preferredTimeSlot, setPreferredTimeSlot, locationNote, setLocationNote, setAgreedTerms, errors, setErrors, isSubmitting, submitSecondsLeft, handleItemQtyChange, getItemQty, getItemNote, handleItemNoteChange, handleFileUpload, isAllTermsAgreed, handleFormSubmit, CATEGORIES, COUNTIES, DISTRICTS_BY_COUNTY, TERMS_LIST, formatMinguoDate, formatTaiwanPhone } = props;

  return (
    <>
      {/* TAB 1: Booking Wizard Form */}
            {activeTab === 'booking' && (
              <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                
                {/* Hero Banner */}
                <div className="booking-hero relative rounded-2xl p-5 sm:rounded-[2rem] sm:p-9 border border-emerald-200 shadow-xl overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-emerald-800 border border-emerald-200 mb-3 shadow-sm">
                        ✨ 環保免費服務 ‧ Google Sheets 雲端連線
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-black text-emerald-950">大型廢棄傢俱清運預約申請</h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-xl leading-relaxed">
                        提供床墊、櫃子、桌子、椅子、電視冰箱等家電清運。請填寫下方資料與上傳照片，送出後即獲取標籤與 QR Code。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {Object.keys(errors).length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                    <strong className="text-sm block">⚠️ 請修正以下未填寫或格式不符欄位：</strong>
                    <ul className="list-disc list-inside">
                      {Object.values(errors).map((e, idx) => <li key={idx}>{e}</li>)}
                    </ul>
                  </div>
                )}

                {/* Step 1: Applicant Info */}
                <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">1</span>
                      申請人基本資料
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-10">標記 <span className="text-rose-400 font-bold">*</span> 為必填欄位</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        申請人姓名 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="請輸入姓名 (例: 王大明)"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        行動電話 / 聯絡電話 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="0912-345678 或 037-123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => setPhone(formatTaiwanPhone(phone))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        電子郵件 Email (選填)
                      </label>
                      <input
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          縣市 <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={county}
                          onChange={(e) => { const next = e.target.value; setCounty(next); setDistrict(DISTRICTS_BY_COUNTY[next][0]); }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          行政區域 <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        >{DISTRICTS_BY_COUNTY[county].map((d) => <option key={d} value={d}>{d}</option>)}</select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          詳細清運地址 <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例如: 苗栗縣三義鄉廣盛村復興路69號"
                          value={detailAddress}
                          onChange={(e) => setDetailAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Waste Items Selection */}
                <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">2</span>
                      清運項目及數量選擇
                    </h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      已選總數: {selectedItems.reduce((acc, cur) => acc + cur.quantity, 0)} 件｜每次申請前 2 件免費，超過每件 200 元；每戶每年最多 3 次免費申請
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat) => {
                      const qty = getItemQty(cat.id);
                      const isSelected = qty > 0;
                      return (
                        <div
                          key={cat.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-950 border-emerald-300 shadow-md ring-2 ring-emerald-400'
                              : 'bg-slate-900 border-slate-600 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`text-3xl p-2 rounded-xl border ${isSelected ? 'bg-white border-white/70' : 'bg-slate-900 border-slate-700'}`}>{cat.icon}</span>
                            <div>
                              <h4 className={`font-black ${isSelected ? '!text-white' : 'text-slate-100'}`}>{cat.name}</h4>
                              <p className={`text-xs ${isSelected ? '!text-emerald-100' : 'text-slate-400'}`}>{cat.desc}</p>
                            </div>
                          </div>
                          <div className={`mt-3 rounded-lg px-3 py-1.5 text-center text-xs font-black ${isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-700 text-slate-200'}`}>{isSelected ? '✓ 已選取' : '未選取'}</div>

                          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                            <span className="text-xs text-slate-400">選擇數量:</span>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(cat.id, -1)}
                                disabled={qty === 0}
                                className="w-7 h-7 rounded bg-slate-700 text-slate-200 disabled:opacity-30 font-bold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-extrabold text-emerald-400">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(cat.id, 1)}
                                className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {isSelected && cat.id === 'other' && <input type="text" value={getItemNote(cat.id)} onChange={(e) => handleItemNoteChange(cat.id, e.target.value)} placeholder="請填寫其他清運項目內容" className="mt-3 w-full rounded-lg border border-emerald-500 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Photo Upload */}
                <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">3</span>
                      上傳待清運照片數張
                    </h3>
                    <span className="text-xs text-slate-400">已上傳 <strong className="text-emerald-400">{photos.length}</strong> 張</span>
                  </div>

                  <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" id="photo-input" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {photos.map((p) => (
                        <div key={p.id} className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 group">
                          <img src={p.url} className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos(photos.filter((i) => i.id !== p.id))}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-rose-400"
                          >
                            ✕
                          </button>
                          <span className="block p-1 text-[10px] truncate text-slate-300 bg-slate-950/80">{p.name}</span>
                        </div>
                      ))}
                    <label htmlFor="photo-input" className="h-24 rounded-xl border-2 border-dashed border-emerald-500/50 bg-slate-900/40 hover:bg-emerald-500/10 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all">
                      <span className="text-xl">📷</span>
                      <span className="text-xs font-bold text-slate-200">上傳照片</span>
                      <span className="text-[10px] text-slate-400">可選多張</span>
                    </label>
                  </div>
                </div>

                {/* Step 4: Schedule & Location */}
                <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-6">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">4</span>
                    希望清運時間與放置地點說明
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">希望清運日期</label>
                      <MinguoDatePicker
                        min={new Date().toLocaleDateString('sv-SE')}
                        value={preferredDate}
                        onChange={(nextDate) => {
                          const reason = getUnavailableBookingReason(nextDate);
                          if (reason) {
                            setErrors((current) => ({ ...current, preferredDate: reason }));
                            return;
                          }
                          setPreferredDate(nextDate);
                          setErrors((current) => ({ ...current, preferredDate: '' }));
                        }}
                        className={`flex w-full items-center justify-between bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-slate-100 ${errors.preferredDate ? 'border-rose-500' : 'border-slate-700'}`}
                      />
                      <p className="mt-1 text-[11px] text-slate-400">民國日期：{formatMinguoDate(preferredDate)}；例假日及國定假日不開放預約。</p>
                      {errors.preferredDate && <p className="mt-1 text-[11px] font-bold text-rose-400">{errors.preferredDate}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">希望清運時段</label>
                      <select
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100"
                      >
                        <option value="上午8點至12點">上午8點至12點</option>
                        <option value="下午1點至5點">下午1點至5點</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">放置地點詳細說明</label>
                      <textarea
                        rows={2}
                        placeholder="例如: 放在一樓社區後門消防通道旁，避免阻礙交通"
                        value={locationNote}
                        onChange={(e) => setLocationNote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 5: Terms Consent */}
                <div className="glass-card rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">5</span>
                      申請聲明與同意事項 (必填)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-10">
                      依廢棄物清理法及清潔隊規定，請完整閱讀以下事項後勾選同意。
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead className="bg-emerald-50 text-emerald-900">
                        <tr>
                          <th className="w-14 px-4 py-3 text-center font-bold">項次</th>
                          <th className="w-44 px-4 py-3 font-bold">聲明事項</th>
                          <th className="px-4 py-3 font-bold">內容說明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {TERMS_LIST.map((t) => (
                          <tr key={t.id} className="align-top">
                            <td className="px-4 py-3 text-center font-black text-emerald-700">{t.id}</td>
                            <td className="px-4 py-3 font-bold text-slate-200">{t.title}</td>
                            <td className="px-4 py-3 leading-relaxed text-slate-300">{t.content}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isAllTermsAgreed}
                    onClick={() => setAgreedTerms(isAllTermsAgreed ? [] : TERMS_LIST.map(t => t.id))}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      isAllTermsAgreed
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800'
                        : 'border-slate-700/60 bg-white/60 text-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <span className="mt-0.5 text-lg font-bold text-emerald-600">{isAllTermsAgreed ? '☑' : '☐'}</span>
                    <span className="text-sm font-bold">我已詳讀並同意配合以上事項 (閱讀後，請勾選)</span>
                  </button>
                </div>
                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center space-x-2 disabled:cursor-wait disabled:opacity-70"
                  >
                    <span>{isSubmitting ? `⏳ 送出處理中${photos.length > 0 && submitSecondsLeft > 0 ? `，預估還有 ${submitSecondsLeft} 秒` : '…'}` : '✅ 送出大型廢棄傢俱預約清運申請'}</span>
                  </button>
                </div>

              </form>
            )}
    </>
  );
}
