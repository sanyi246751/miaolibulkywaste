export default function BookingSuccessModal(props) {
  const { setActiveTab, formatMinguoDate, setPrintableBooking, gasUrl, successBooking, setSuccessBooking } = props;

  return (
    <>
      {/* Modal 1: Booking Success */}
          {successBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-emerald-500/40 p-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl flex items-center justify-center mx-auto">
                  ✅
                </div>
                <h3 className="text-2xl font-black text-white">大型廢棄傢俱預約成功！</h3>
                <p className="text-xs text-slate-300">預約單號：<strong className="text-emerald-400 font-mono text-lg">{successBooking.id}</strong></p>

                {gasUrl && <p className="text-[11px] text-emerald-300">雲端同步狀態：已自動同步寫入至您的 Google 試算表！</p>}

                <div className="success-summary bg-slate-950 p-4 rounded-xl text-left text-xs space-y-1 text-white border border-slate-800">
                  <p><strong>希望清運日期：</strong>{formatMinguoDate(successBooking.preferredDate)} ({successBooking.preferredTimeSlot.split(' ')[0]})</p>
                  <p><strong>一樓放置地點：</strong>{successBooking.address}</p>
                  <p><strong>清運品項：</strong>{successBooking.items?.map(i=>`${i.name}x${i.quantity}`).join('、')}</p>
                </div>
                <button
                  onClick={() => { setPrintableBooking(successBooking); setSuccessBooking(null); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm"
                >
                  🖨️ 立即列印「已預約清運標籤」與 QR Code
                </button>
                <button onClick={() => { setSuccessBooking(null); setActiveTab('booking'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs font-bold text-emerald-300">回到申請頁面</button>
              </div>
            </div>
          )}
    </>
  );
}
