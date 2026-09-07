export default function PrintableTagModal(props) {
  const { formatMinguoDate, setPrintableBooking, QRCodeBox, printableBooking } = props;

  return (
    <>
      {/* Modal 2: Printable Identification Tag */}
          {printableBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-bold">🖨️ 預約清運標籤列印預覽</h3>
                  <button onClick={() => setPrintableBooking(null)} className="text-slate-400 text-lg font-bold">✕</button>
                </div>

                {/* Printable Area */}
                <div id="printable-tag" className="bg-white text-slate-900 text-center rounded-xl p-6 border-4 border-dashed border-slate-900 space-y-4 mx-auto">
                  <div className="flex flex-col items-center border-b-2 border-slate-900 pb-3 gap-3">
                    <div className="text-center">
                      <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">家戶免費清運專案</span>
                      <h2 className="text-xl font-black mt-1">大型廢棄傢俱已預約清運標籤</h2>
                      <p className="text-xs text-slate-600 font-bold">請貼於搬出傢俱外觀明顯處 ‧ 清潔隊現場掃碼核對</p>
                    </div>
                    <QRCodeBox value={`${window.location.origin}${window.location.pathname.replace(/admin\.html$/, 'index.html')}?booking=${encodeURIComponent(printableBooking.id)}`} size={80} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs">
                    <div><span className="text-slate-500 block">預約單號</span><strong className="text-emerald-800 text-base font-mono">{printableBooking.id}</strong></div>
                    <div><span className="text-slate-500 block">希望清運日期</span><strong className="text-slate-900 text-sm">{formatMinguoDate(printableBooking.preferredDate)}</strong></div>
                    <div><span className="text-slate-500 block">申請人姓名</span><strong className="text-slate-900">{printableBooking.applicantName}</strong></div>
                    <div><span className="text-slate-500 block">聯絡電話</span><strong className="text-slate-900 font-mono">{printableBooking.phone}</strong></div>
                  </div>

                  <div className="text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block font-bold">一樓放置地點</span>
                    <strong className="text-slate-900 text-sm">{printableBooking.address}</strong>
                    {printableBooking.locationNote && <p className="text-slate-600 mt-1">備註: {printableBooking.locationNote}</p>}
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-slate-500 font-bold block">待清運品項清單</span>
                    <div className="grid grid-cols-2 gap-2">
                      {printableBooking.items?.map((i, idx) => (
                        <div key={idx} className="bg-slate-100 p-1.5 rounded border border-slate-300 font-bold flex justify-between">
                          <span>{i.name}</span>
                          <span>x {i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between">
                    <span>※ 請勿夾雜事業廢棄物或危險物品 ‧ 清潔隊電話: (037) 878457</span>
                    <span>列印日期: {formatMinguoDate(new Date())}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button onClick={() => setPrintableBooking(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">關閉</button>
                  <button onClick={() => window.print()} className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">列印標籤</button>
                </div>
              </div>
            </div>
          )}
    </>
  );
}
