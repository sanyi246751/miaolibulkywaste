import { useEffect, useMemo, useRef, useState } from 'react'
import { adminLogin, adminPost, toCasePayload } from '../api.js'
import { getMinguoTime } from './utils/formatters.js'

const statuses = ['全部', '待處理', '已排班', '清運完成', '已取消']
const statusPageMeta = {
  '全部': { title: '全部案件', description: '檢視所有案件與目前進度。' },
  '待處理': { title: '待處理案件', description: '完成人工逐項覆核後，才可核可排班。' },
  '已排班': { title: '已排班案件', description: '確認清運日期、時段、車號與清運人員後，可開始清運。' },
  '清運完成': { title: '清運完成案件', description: '已完成的案件紀錄，保留供查詢與列印。' },
  '已取消': { title: '已取消案件', description: '已撤案或取消的案件紀錄。' },
}
const periods = ['', '上午8點至12點', '下午1點至5點']
const categories = ['床墊', '櫃子', '桌子', '椅子', '電視', '冰箱', '其他']
const pageTabs = ['案件清單與進度', '待處理', '已排班', '清運完成', '已取消']
const tabStatus = { '案件清單與進度': '全部', '待處理': '待處理', '已排班': '已排班', '清運完成': '清運完成', '已取消': '已取消' }
const dispatchGroupKey = (item) => [String(item.scheduled_at || '').slice(0, 10), String(item.vehicle_no || '').trim(), String(item.dispatch_period || ''), Number(item.dispatch_trip || 1)].join('|')
const splitCrewMembers = (value) => String(value || '').split(/[、，,\n]+/).map((member) => member.trim()).filter(Boolean)

const dateTimeLocal = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 16).replace(' ', 'T')
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const parseMinguoDateTime = (value) => {
  const match = String(value || '').trim().match(/^(\d{2,3})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})(?:\s*(上午|下午)?\s*(\d{1,2})?(?::(\d{1,2}))?)?$/)
  if (!match) return ''
  const [, rocYear, month, day, period, hourText, minuteText] = match
  let hour = Number(hourText || 0)
  if (hour > 23 || Number(minuteText || 0) > 59) return ''
  if (period === '下午' && hour < 12) hour += 12
  if (period === '上午' && hour === 12) hour = 0
  const parsed = new Date(Number(rocYear) + 1911, Number(month) - 1, Number(day), hour, Number(minuteText || 0))
  if (parsed.getFullYear() !== Number(rocYear) + 1911 || parsed.getMonth() !== Number(month) - 1 || parsed.getDate() !== Number(day)) return ''
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}T${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
}

const parseItems = (value) => {
  try {
    const result = JSON.parse(value || '[]')
    return Array.isArray(result) ? result : []
  } catch {
    return []
  }
}

const declaredCounts = (wasteType) => Object.fromEntries(categories.map((name) => {
  const match = String(wasteType || '').match(new RegExp(`${name}\\s*(?:×|x|X)\\s*(\\d+)`))
  return [name, match ? Number(match[1]) : String(wasteType || '').includes(name) ? 1 : 0]
}))

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_api_token') || '')
  const [tokenInput, setTokenInput] = useState('')
  const [cases, setCases] = useState([])
  const [selectedNo, setSelectedNo] = useState('')
  const [filter, setFilter] = useState('全部')
  const [page, setPage] = useState('案件清單與進度')
  const [keyword, setKeyword] = useState('')
  const [useDateRange, setUseDateRange] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState(null)
  const [reviewCounts, setReviewCounts] = useState({})
  const [dispatchOptions, setDispatchOptions] = useState({ vehicles: [], workers: [] })
  const completionInput = useRef(null)

  const loadCases = async (selectStatus = '') => {
    setLoading(true); setMessage('')
    try {
      const result = await adminPost('list')
      setCases(result.cases || [])
      if (selectStatus) setSelectedNo(result.cases?.find((item) => item.status === selectStatus)?.case_no || '')
      else if (!selectedNo && result.cases?.length) setSelectedNo(result.cases[0].case_no)
    } catch (error) {
      setMessage(error.message)
      if (/Token/.test(error.message)) logout()
    } finally { setLoading(false) }
  }

  const loadDispatchOptions = async () => {
    const result = await adminPost('dispatchOptions')
    setDispatchOptions(result.dispatch || { vehicles: [], workers: [] })
  }

  useEffect(() => {
    if (!token) return
    loadCases()
    loadDispatchOptions().catch((error) => setMessage(`派車設定載入失敗：${error.message}`))
  }, [token])
  useEffect(() => {
    const item = cases.find((entry) => entry.case_no === selectedNo) || null
    setDraft(item ? { ...item } : null)
    if (item) {
      const counts = Object.fromEntries(categories.map((name) => [name, 0]))
      const confirmedItems = parseItems(item.confirmed_items)
      confirmedItems.forEach((entry) => {
        const name = categories.includes(entry.type) ? entry.type : categories.includes(entry.name) ? entry.name : '其他'
        counts[name] += Number(entry.quantity ?? entry.count ?? 0)
      })
      // 尚未有人工作業時，直接帶入民眾申報量作為覆核起始值。
      setReviewCounts(confirmedItems.length ? counts : declaredCounts(item.waste_type))
    }
  }, [cases, selectedNo])

  const visibleCases = useMemo(() => {
    const filtered = cases.filter((item) => {
    const statusMatch = filter === '全部' || item.status === filter
    const text = [item.case_no, item.applicant, item.phone, item.address, item.waste_type, item.vehicle_no].join(' ').toLowerCase()
    const created = String(item.created_at || '').slice(0, 10)
    const dateMatch = !useDateRange || ((!dateFrom || created >= dateFrom) && (!dateTo || created <= dateTo))
    return statusMatch && dateMatch && text.includes(keyword.trim().toLowerCase())
    })
    return filter === '已排班' ? filtered.sort((first, second) => dispatchGroupKey(first).localeCompare(dispatchGroupKey(second), 'zh-Hant')) : filtered
  }, [cases, filter, keyword, useDateRange, dateFrom, dateTo])

  const scheduledGroupStyles = useMemo(() => {
    // 結案案件不會再顯示於已排班頁，但仍是原班次的一員；以完整班次
    // 計數並固定由班次鍵決定顏色，避免同班案件結案後留存案件失去色框。
    const counts = cases.filter((item) => ['已排班', '清運中', '清運完成'].includes(item.status)).reduce((result, item) => {
      const key = dispatchGroupKey(item); result[key] = (result[key] || 0) + 1; return result
    }, {})
    return Object.fromEntries(Object.keys(counts).filter((key) => counts[key] > 1).map((key) => {
      const hue = Array.from(key).reduce((sum, char, index) => sum + (index + 1) * char.charCodeAt(0), 0) % 360
      return [key, { backgroundColor: `hsl(${hue} 78% 92%)`, borderColor: `hsl(${hue} 55% 48%)` }]
    }))
  }, [cases])

  const dispatchTripChoices = useMemo(() => {
    if (!draft?.vehicle_no || !draft?.scheduled_at || !draft?.dispatch_period) return [{ trip: 1, label: '建立第 1 班', mode: 'new' }]
    const date = String(draft.scheduled_at).slice(0, 10)
    const used = [...new Set(cases.filter((item) => item.case_no !== draft.case_no && item.status === '已排班' && String(item.scheduled_at || '').slice(0, 10) === date && String(item.vehicle_no || '').trim() === String(draft.vehicle_no || '').trim() && item.dispatch_period === draft.dispatch_period).map((item) => Number(item.dispatch_trip || 1)))].sort((first, second) => first - second)
    if (!used.length) return [{ trip: 1, label: '建立第 1 班', mode: 'new' }]
    const lastTrip = used[used.length - 1]
    return [{ trip: lastTrip, label: `併入第 ${lastTrip} 班`, mode: 'merge' }, { trip: lastTrip + 1, label: `新增第 ${lastTrip + 1} 班`, mode: 'new' }]
  }, [cases, draft?.case_no, draft?.scheduled_at, draft?.vehicle_no, draft?.dispatch_period])

  const selectDispatchTrip = (value) => {
    const trip = Number(value)
    const date = String(draft.scheduled_at || '').slice(0, 10)
    const mergedCase = cases.find((item) => item.case_no !== draft.case_no && item.status === '已排班' && String(item.scheduled_at || '').slice(0, 10) === date && String(item.vehicle_no || '').trim() === String(draft.vehicle_no || '').trim() && item.dispatch_period === draft.dispatch_period && Number(item.dispatch_trip || 1) === trip)
    // 併入既有班次時，清運人員必須沿用該班的同一組人員。
    setDraft({ ...draft, dispatch_trip: trip, worker_name: mergedCase?.worker_name || draft.worker_name })
  }

  const login = async (event) => {
    event.preventDefault()
    const value = tokenInput.trim()
    if (!value) return
    setLoading(true); setMessage('')
    try {
      const result = await adminLogin(value)
      sessionStorage.setItem('admin_api_token', result.token)
      setToken(result.token); setTokenInput('')
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }
  const logout = () => { sessionStorage.removeItem('admin_api_token'); setToken(''); setCases([]) }

  const save = async (changes = {}, success = '案件已更新', selectStatus = '') => {
    if (!draft) return
    const next = { ...draft, ...changes }
    setLoading(true); setMessage('')
    try {
      await adminPost('upsert', { case: toCasePayload(next) })
      setMessage(success)
      await loadCases(selectStatus)
      if (!selectStatus) setSelectedNo(next.case_no)
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  const approveReview = async () => {
    const items = categories.map((type) => ({ type, quantity: Math.max(0, Number(reviewCounts[type] || 0)) })).filter((item) => item.quantity > 0)
    const total = items.reduce((sum, item) => sum + item.quantity, 0)
    if (!total) return setMessage('請至少填寫一項人工確認品項')
    const chargeable = Number(draft.annual_count || 0) <= 3 ? Math.max(0, total - 2) : total
    // 立即反映覆核結果，避免使用者必須等候雲端寫入及完整清單重新載入。
    const previousDraft = draft
    const approvedDraft = { ...draft, quantity: total, quantity_review_status: '人工已核可', confirmed_items: JSON.stringify(items), chargeable_quantity: chargeable, fee_amount: chargeable * 200 }
    setDraft(approvedDraft)
    setCases((current) => current.map((item) => item.case_no === approvedDraft.case_no ? approvedDraft : item))
    setLoading(true); setMessage('人工已核可，正在同步…')
    try {
      await adminPost('upsert', { case: toCasePayload(approvedDraft) })
      setMessage('人工覆核已完成')
    } catch (error) {
      setDraft(previousDraft)
      setCases((current) => current.map((item) => item.case_no === previousDraft.case_no ? previousDraft : item))
      setMessage(`覆核同步失敗，已還原：${error.message}`)
    } finally { setLoading(false) }
  }

  const schedule = async () => {
    if (draft.quantity_review_status !== '人工已核可') return setMessage('核可排班前，必須先完成逐項人工確認')
    if (!draft.scheduled_at || !draft.vehicle_no || !draft.worker_name || !draft.dispatch_period) return setMessage('請填寫管理端排定的清運日期、清運時段、車號及班組')
    if (!dispatchOptions.vehicles.some((item) => item.vehicle_no === draft.vehicle_no)) return setMessage('請由派車設定選擇有效車號')
    if (!splitCrewMembers(draft.worker_name).every((member) => dispatchOptions.workers.includes(member))) return setMessage('請由清運人員設定選擇有效姓名')
    await save({ status: '已排班', dispatch_status: '已排班' }, '案件已核可排班', '待處理')
  }
  const withdrawCase = async () => {
    if (!draft) return
    const input = window.prompt(`請輸入案件「${draft.case_no}」的撤案原因（必填）：`)
    if (input === null) return
    const reason = input.trim()
    if (!reason) return setMessage('撤案原因為必填，案件尚未撤案')
    if (!window.confirm(`確定將案件「${draft.case_no}」撤案？\n\n撤案原因：${reason}`)) return
    const note = String(draft.dispatch_note || '').trim()
    await save({
      status: '已取消',
      dispatch_status: '已取消',
      dispatch_note: `${note}${note ? '\n' : ''}撤案原因：${reason}`,
    }, '案件已撤案')
  }

  const selectPage = (nextPage) => {
    setPage(nextPage)
    setFilter(tabStatus[nextPage])
  }

  const restoreCaseStatus = async () => {
    if (!draft || draft.status !== '已取消' || !window.confirm(`確定恢復案件「${draft.case_no}」為待處理嗎？`)) return
    await save({ status: '待處理', dispatch_status: '待處理' }, '案件狀態已恢復為待處理')
    selectPage('待處理')
  }

  const deleteCase = async () => {
    if (!draft || !window.confirm(`確定刪除案件「${draft.case_no}」嗎？此動作會同步刪除雲端資料，無法復原。`)) return
    setLoading(true); setMessage('')
    try {
      await adminPost('delete', { caseNo: draft.case_no })
      setSelectedNo(''); setMessage('案件已刪除'); await loadCases()
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  const completeWithPhoto = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length || !draft) return
    if (files.some((file) => !file.type.startsWith('image/'))) return setMessage('請選擇圖片檔案')
    if (files.some((file) => file.size > 8 * 1024 * 1024)) return setMessage('每張結案照片不可超過 8 MB')
    setLoading(true); setMessage(`正在上傳結案照片（0/${files.length}）…`)
    try {
      const photoIds = []
      for (const [index, file] of files.entries()) {
        setMessage(`正在上傳結案照片（${index + 1}/${files.length}）…`)
        const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file) })
        const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg'
        const upload = await adminPost('upload', { fileName: `${draft.case_no}-finish-${index + 1}.${extension}`, mimeType: file.type, base64 })
        photoIds.push(upload.fileId)
      }
      const note = String(draft.dispatch_note || '').trim()
      await save({ status: '清運完成', dispatch_status: '清運完成', dispatch_note: `${note}${note ? '\n' : ''}結案照片 Google Drive ID：${JSON.stringify(photoIds)}` }, `已上傳 ${photoIds.length} 張結案照片，案件已標記為清運完成`)
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  const reviewApproved = draft?.quantity_review_status === '人工已核可'

  if (!token) return <div className="min-h-screen bg-emerald-950 px-5 py-14"><form onSubmit={login} className="mx-auto max-w-sm rounded-3xl bg-white p-8 shadow-2xl"><p className="text-sm font-bold text-emerald-700">三義鄉巨大廢棄物</p><h1 className="mt-2 text-2xl font-black">管理端登入</h1><p className="mt-2 text-sm text-slate-500">請輸入 Apps Script 的管理密碼。登入後只保存 8 小時短效憑證，不保存密碼。</p>{message && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{message}</p>}<input autoFocus required type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="管理密碼" className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3"/><button disabled={loading} className="mt-4 w-full rounded-xl bg-emerald-700 py-3 font-black text-white disabled:opacity-60">{loading ? '登入中…' : '登入管理端'}</button></form></div>

  return <div className="min-h-screen bg-slate-100 text-slate-900">
    <header className="bg-emerald-950 px-5 py-4 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between"><div><h1 className="text-xl font-black">案件管理與排班</h1><p className="text-xs text-emerald-200">正式案件資料｜Google Sheets 雲端同步</p></div><div className="flex gap-2"><button onClick={loadCases} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">重新整理</button><button onClick={logout} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">登出</button></div></div></header>
    <main className="mx-auto max-w-7xl p-4"><nav className="mb-5 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm" aria-label="案件管理頁面">{pageTabs.map((tab) => <button key={tab} type="button" onClick={() => selectPage(tab)} className={'rounded-xl px-4 py-2.5 text-sm font-black transition-colors ' + (page === tab ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50')}>{tab}</button>)}</nav><div className="grid gap-5 lg:grid-cols-[390px_1fr]">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div><h2 className="text-lg font-black text-slate-900">{statusPageMeta[filter].title}</h2><p className="mt-1 text-xs font-bold text-slate-500">{statusPageMeta[filter].description}</p></div>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="案件編號、申請人、電話、地址或車號" className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5"/>
        {page === '案件清單與進度' && <><div className="mt-3 flex flex-wrap gap-2" aria-label="案件狀態篩選">{statuses.map((status) => <button key={status} onClick={() => { setFilter(status); setPage('案件清單與進度') }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === status ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{status}</button>)}</div><label className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={useDateRange} onChange={(e) => setUseDateRange(e.target.checked)}/> 建立時間範圍</label>{useDateRange && <div className="mt-2 grid grid-cols-2 gap-2"><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="開始日期" className="rounded-lg border border-slate-300 p-2 text-xs"/><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="結束日期" className="rounded-lg border border-slate-300 p-2 text-xs"/></div>}</>}
        <p className="mt-4 text-xs font-bold text-slate-500">共 {visibleCases.length} 件</p>
        <div className="mt-2 max-h-[68vh] space-y-2 overflow-auto">{visibleCases.map((item) => { const groupStyle = page === '已排班' ? scheduledGroupStyles[dispatchGroupKey(item)] : null; return <button key={item.case_no} onClick={() => setSelectedNo(item.case_no)} style={groupStyle || undefined} className={`w-full rounded-xl border p-3 text-left ${groupStyle ? 'border-2' : selectedNo === item.case_no ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}><div className="flex justify-between gap-2"><strong>{item.case_no}</strong>{page === '案件清單與進度' && <span className="text-xs font-bold text-emerald-700">{item.status}</span>}</div><p className="mt-1 text-sm">{item.applicant}｜{item.waste_type}</p><p className="mt-1 truncate text-xs text-slate-500">{item.address}</p>{groupStyle && <p className="mt-1 text-[10px] font-black text-slate-600">同班次｜{item.vehicle_no} 車・{item.dispatch_period}・第 {item.dispatch_trip || 1} 班</p>}</button>})}</div>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm">{message && <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</div>}{!draft ? <p className="py-20 text-center text-slate-400">請選擇案件</p> : <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700">{draft.report_source}</p><h2 className="text-2xl font-black">{draft.case_no}</h2><p className="mt-1 text-sm text-slate-500">{draft.applicant}｜{draft.phone}</p></div>{page === '案件清單與進度' && <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">{draft.status}</span>}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Info label="地址" value={draft.address}/><Info label="申報內容" value={`${draft.waste_type}，${draft.quantity} 件`}/><Info label="年度申請次數" value={`${draft.annual_count || 0} 次（${draft.free_eligible || '待確認'}）`}/><Info label="費用" value={`${Number(draft.fee_amount || 0).toLocaleString()} 元`}/><Info label="建立時間" value={getMinguoTime(draft.created_at)}/><Info label="最後更新" value={getMinguoTime(draft.updated_at)}/><Info label={draft.status === '已排班' ? '正式清運日期與時間' : '民眾希望日期（排班參考）'} value={getMinguoTime(draft.requested_scheduled_at || draft.scheduled_at)}/><Info label={draft.status === '已排班' ? '正式清運時段／第幾班' : '民眾希望時段（排班參考）'} value={`${draft.dispatch_period || '—'}／第 ${draft.dispatch_trip || 1} 班`}/><Info label="派車車號／清運人員" value={`${draft.vehicle_no || '—'}／${draft.worker_name || '—'}`}/>{draft.status === '已取消' && <Info label="撤案原因／備註" value={draft.dispatch_note}/>}</div>
        {['案件清單與進度', '待處理'].includes(page) && <div className={'rounded-2xl border p-4 ' + (reviewApproved ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50')}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">人工逐項覆核</h3><p className="text-xs text-slate-600">僅於待處理頁進行人工確認與計費。</p></div><div className={'rounded-xl px-3 py-2 text-sm font-black ' + (reviewApproved ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900')}>{reviewApproved ? '✓ 人工已核可' : '⚠ 待人工核可'}</div></div>{reviewApproved && <div className="mt-3 grid gap-2 rounded-xl border border-emerald-200 bg-white/70 p-3 text-sm font-bold text-emerald-900 sm:grid-cols-3"><span>確認總件數：{draft.quantity} 件</span><span>計費件數：{draft.chargeable_quantity || 0} 件</span><span>應收費用：NT$ {Number(draft.fee_amount || 0).toLocaleString()}</span></div>}<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{categories.map((name) => <label key={name} className="text-xs font-bold text-slate-600">{name}<input disabled={reviewApproved} type="number" min="0" value={reviewCounts[name] || 0} onChange={(e) => setReviewCounts((old) => ({ ...old, [name]: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"/></label>)}</div><label className="mt-3 block text-xs font-bold text-slate-600">人工判斷依據（選填）<textarea disabled={reviewApproved} rows="2" value={draft.review_note || ''} onChange={(e) => setDraft({ ...draft, review_note: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 disabled:bg-slate-100"/></label>{page === '待處理' && (reviewApproved ? <button disabled={loading} onClick={() => setDraft({ ...draft, quantity_review_status: '待人工核可', chargeable_quantity: 0, fee_amount: 0 })} className="mt-3 rounded-xl border border-emerald-600 bg-white px-4 py-2.5 text-sm font-black text-emerald-700">修改人工確認</button> : <button disabled={loading} onClick={approveReview} className="mt-3 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white">人工核可並試算費用</button>)}</div>}
        {['案件清單與進度', '待處理', '已排班'].includes(page) && <div className={'rounded-2xl border p-4 ' + (page === '待處理' ? 'border-amber-300 bg-amber-50' : 'border-slate-200')}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{page === '已排班' ? '已排班案件管理（唯讀）' : '待處理案件排班'}</h3>{page === '待處理' && <p className="text-xs text-slate-600">車號與姓名一律以「派車設定」為準；請先在桌面端完成設定，再由此處選擇。</p>}</div>{page === '待處理' && <div className="rounded-xl bg-amber-200 px-3 py-2 text-sm font-black text-amber-900">{reviewApproved ? '待核可排班' : '⚠ 等待人工核可'}</div>}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="管理端排定清運日期與時間（民國）"><MinguoDateTimePicker disabled={page === '已排班'} value={draft.scheduled_at} onCommit={(scheduled_at) => setDraft({ ...draft, scheduled_at })}/></Field><Field label="管理端排定清運時段"><select disabled={page === '已排班'} value={draft.dispatch_period || ''} onChange={(e) => setDraft({ ...draft, dispatch_period: e.target.value })}>{periods.map((item) => <option key={item} value={item}>{item || '請選擇'}</option>)}</select></Field><Field label="派車車號"><select disabled={page === '已排班'} value={draft.vehicle_no || ''} onChange={(e) => setDraft({ ...draft, vehicle_no: e.target.value })}><option value="">請選擇派車設定中的車號</option>{dispatchOptions.vehicles.map((item) => <option key={item.vehicle_no} value={item.vehicle_no}>{item.vehicle_no}（油耗 {item.fuel_efficiency} km/L、CO₂e {item.co2_per_liter} kg/L）</option>)}</select></Field><Field label="清運人員"><select disabled={page === '已排班'} value={draft.worker_name || ''} onChange={(e) => setDraft({ ...draft, worker_name: e.target.value })}><option value="">請選擇清運人員設定中的姓名</option>{dispatchOptions.workers.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field><Field label="派車趟次"><input disabled={page === '已排班'} type="number" min="1" value={draft.dispatch_trip || 1} onChange={(e) => setDraft({ ...draft, dispatch_trip: Number(e.target.value) })}/></Field><Field label="派車備註"><input disabled={page === '已排班'} value={draft.dispatch_note || ''} onChange={(e) => setDraft({ ...draft, dispatch_note: e.target.value })}/></Field></div></div>}
        <div className="flex flex-wrap gap-3">{page === '案件清單與進度' && <><button type="button" onClick={() => { window.location.href = './index.html' }} className="rounded-xl border border-emerald-700 px-5 py-3 font-black text-emerald-800">新增案件</button><button disabled={loading || draft.status !== '已取消'} onClick={restoreCaseStatus} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-40">恢復案件狀態</button><button disabled={loading} onClick={deleteCase} className="rounded-xl border border-rose-300 px-5 py-3 font-black text-rose-700">刪除案件</button></>}{page === '待處理' && <><button disabled={loading || !reviewApproved} onClick={schedule} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">{reviewApproved ? '核可排班' : '請先完成人工核可'}</button><button disabled={loading} onClick={withdrawCase} className="rounded-xl bg-rose-600 px-5 py-3 font-black text-white">撤案</button><button disabled={loading} onClick={() => save()} className="ml-auto rounded-xl border border-emerald-700 px-5 py-3 font-black text-emerald-800">儲存調度變更</button></>}{page === '已排班' && <><button disabled={loading} onClick={() => completionInput.current?.click()} className="rounded-xl bg-sky-700 px-5 py-3 font-black text-white">📸 拍照結案</button><button disabled={loading} onClick={() => save({ status: '待處理', dispatch_status: '待處理' }, '已取消排班，案件回到待處理')} className="rounded-xl bg-amber-600 px-5 py-3 font-black text-white">取消排班</button><button disabled={loading} onClick={withdrawCase} className="rounded-xl bg-rose-600 px-5 py-3 font-black text-white">撤案</button></>}{page === '清運完成' && <button type="button" onClick={() => window.print()} className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white">預覽列印</button>}{page === '已取消' && <><button disabled={loading} onClick={restoreCaseStatus} className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">恢復案件狀態</button><button disabled={loading} onClick={deleteCase} className="rounded-xl border border-rose-300 px-5 py-3 font-black text-rose-700">刪除案件</button></>}<input ref={completionInput} type="file" accept="image/*" multiple className="hidden" onChange={completeWithPhoto}/></div>
        {page === '待處理' && <div className="-mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-4"><Field label="合併／新增班次"><select value={dispatchTripChoices.some((choice) => choice.trip === Number(draft.dispatch_trip || 1)) ? Number(draft.dispatch_trip || 1) : dispatchTripChoices[dispatchTripChoices.length - 1].trip} onChange={(e) => selectDispatchTrip(e.target.value)}>{dispatchTripChoices.map((choice) => <option key={choice.trip} value={choice.trip}>{choice.label}</option>)}</select></Field><p className="mt-2 text-xs font-bold text-sky-700">選擇併入既有班次時，會自動帶入該班的清運人員。</p></div>}
        {page === '待處理' && draft.worker_name && <p className="-mt-5 text-xs font-black text-emerald-700">本班清運人員：{draft.worker_name}</p>}
      </div>}</section>
    </div></main>
  </div>
}

function Info({ label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 font-bold">{value || '—'}</p></div> }
function Field({ label, children }) { return <label className="text-xs font-bold text-slate-600">{label}<span className="mt-1 block [&>*]:w-full [&>*]:rounded-lg [&>*]:border [&>*]:border-slate-300 [&>*]:px-3 [&>*]:py-2.5">{children}</span></label> }
function MinguoDateTimePicker({ disabled, value, onCommit }) {
  const initial = value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : new Date()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => ({ year: initial.getFullYear(), month: initial.getMonth() }))
  useEffect(() => { if (value && !Number.isNaN(new Date(value).getTime())) { const date = new Date(value); setView({ year: date.getFullYear(), month: date.getMonth() }) } }, [value])
  const selected = value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : new Date()
  const commit = (date) => onCommit(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)
  const shiftMonth = (amount) => { const next = new Date(view.year, view.month + amount, 1); setView({ year: next.getFullYear(), month: next.getMonth() }) }
  const firstDay = new Date(view.year, view.month, 1).getDay()
  const days = new Date(view.year, view.month + 1, 0).getDate()
  return <div className="relative"><button type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left font-bold disabled:bg-slate-100"><span>{value ? getMinguoTime(value) : '請選擇日期與時間'}</span><span aria-hidden="true">📅</span></button>{open && <div className="absolute z-20 mt-1 w-80 rounded-xl border border-emerald-200 bg-white p-3 shadow-xl"><div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => shiftMonth(-1)} className="rounded px-2 py-1 hover:bg-slate-100">‹</button><div className="flex gap-1"><select value={view.year - 1911} onChange={(e) => setView({ ...view, year: Number(e.target.value) + 1911 })}>{Array.from({ length: 21 }, (_, index) => new Date().getFullYear() - 1911 - 10 + index).map((year) => <option key={year} value={year}>{year} 年</option>)}</select><select value={view.month} onChange={(e) => setView({ ...view, month: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{index + 1} 月</option>)}</select></div><button type="button" onClick={() => shiftMonth(1)} className="rounded px-2 py-1 hover:bg-slate-100">›</button></div><div className="grid grid-cols-7 text-center text-xs text-slate-500">{['日','一','二','三','四','五','六'].map((day) => <span key={day} className="py-1">{day}</span>)}{Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`}/>) }{Array.from({ length: days }, (_, index) => { const day = index + 1; const active = selected.getFullYear() === view.year && selected.getMonth() === view.month && selected.getDate() === day; return <button type="button" key={day} onClick={() => { const next = new Date(selected); next.setFullYear(view.year, view.month, day); commit(next); setOpen(false) }} className={'m-0.5 rounded-full py-1.5 font-bold ' + (active ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-50')}>{day}</button> })}</div><div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs font-bold"><span>時間</span><select value={selected.getHours()} onChange={(e) => { const next = new Date(selected); next.setHours(Number(e.target.value)); commit(next) }}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')} 時</option>)}</select><select value={selected.getMinutes()} onChange={(e) => { const next = new Date(selected); next.setMinutes(Number(e.target.value)); commit(next) }}>{[0, 10, 20, 30, 40, 50].map((minute) => <option key={minute} value={minute}>{String(minute).padStart(2, '0')} 分</option>)}</select></div></div>}</div>
}
