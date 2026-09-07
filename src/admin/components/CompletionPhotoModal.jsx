export default function CompletionPhotoModal(props) {
  const { setCompletionModalBooking, completionModalBooking, completionPhotos, setCompletionPhotos, completionNote, setCompletionNote, isUploadingDrive, completionUploadSecondsLeft, handleCompletionPhotoFileChange, handleSubmitCompletionModal } = props;

  return (
    <>
      {/* Modal: Sanitation Worker Completion Photo Upload Modal */}
          {completionModalBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <div className="w-full max-w-lg space-y-4 rounded-3xl border border-sky-300 bg-white p-6 text-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="flex items-center text-lg font-black text-black">
                    <span className="mr-2">📸</span> 清潔隊現場清運完畢拍照上傳結案
                  </h3>
                  <button onClick={() => setCompletionModalBooking(null)} className="font-bold text-slate-700 hover:text-black">✕</button>
                </div>

                <div className="space-y-1 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-black">
                  <p><strong>單號：</strong><span className="text-emerald-400 font-mono font-bold">{completionModalBooking.id}</span></p>
                  <p><strong>申請人：</strong>{completionModalBooking.applicantName} ({completionModalBooking.phone})</p>
                  <p><strong>一樓放置地點：</strong>{completionModalBooking.address}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="mb-2 block font-bold text-black">
                      上傳現場清運完畢照片 <span className="text-rose-400">*</span>
                    </label>
                    <input type="file" accept="image/*" capture="environment" multiple onChange={handleCompletionPhotoFileChange} className="hidden" id="completion-photo-file" />
                    <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
                      {completionPhotos.map((photo, index) => (
                        <div key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-300 bg-white">
                          <img src={photo.url} className="h-24 w-full object-cover" alt={'現場清運完畢照片 ' + (index + 1)} />
                          <button type="button" onClick={() => setCompletionPhotos((current) => current.filter((item) => item.id !== photo.id))} className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1 text-rose-400">✕</button>
                          <span className="block truncate bg-slate-100 p-1 text-[10px] text-black">{photo.name}</span>
                        </div>
                      ))}
                      {completionPhotos.length < 2 && <label htmlFor="completion-photo-file" className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 transition-all hover:bg-emerald-100">
                        <span className="text-xl">📷</span>
                        <span className="text-xs font-bold text-black">上傳照片</span>
                        <span className="text-[10px] text-slate-700">最多 2 張，可拍照或選擇檔案</span>
                      </label>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-black">結案備註說明</label>
                    <textarea
                      rows={2}
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-black focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setCompletionModalBooking(null)}
                    className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-black hover:bg-slate-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitCompletionModal}
                    disabled={isUploadingDrive || !completionPhotos.length}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs shadow-lg disabled:opacity-40"
                  >
                    {isUploadingDrive ? `☁️ 上傳處理中${completionUploadSecondsLeft > 0 ? `，預估還有 ${completionUploadSecondsLeft} 秒` : '…'}` : '✅ 上傳至 Google Drive 並完成結案'}
                  </button>
                </div>

              </div>
            </div>
          )}
    </>
  );
}
