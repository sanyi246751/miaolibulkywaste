const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbw__DGTALQtDo9H5SgahKAWV-iwQ9enXcOgH2Ns9FaW2SrVv8mkc3GVkbfEcREa_E9tRg/exec'

// 此專案的民眾端、管理端與 PySide6 必須共用同一個 GAS 部署。
// 不再採用瀏覽器內舊版 gas_web_app_url，避免切換版本後仍送到不相容的後端。
export const GAS_URL = import.meta.env.VITE_GAS_URL || DEFAULT_GAS_URL

const toMinguoDateTime = (value) => {
  const text = String(value || '').trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/) 
  if (!match) return text
  return `${Number(match[1]) - 1911}/${match[2]}/${match[3]}${match[4] ? ` ${match[4]}:${match[5]}` : ''}`
}

const readJson = async (response) => {
  if (!response.ok) throw new Error(`連線失敗（HTTP ${response.status}）`)
  const result = await response.json()
  if (!result.ok) throw new Error(result.message || '案件服務處理失敗')
  return result
}

export const adminPost = async (action, payload = {}) => readJson(await fetch(GAS_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action, apiToken: sessionStorage.getItem('admin_api_token') || '', ...payload })
}))

export const adminLogin = async (password) => readJson(await fetch(GAS_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'adminLogin', password })
}))

export const queryCase = async (caseNo, phone) => {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', 'query')
  url.searchParams.set('caseNo', caseNo)
  url.searchParams.set('phone', phone)
  return readJson(await fetch(url))
}

export const createPublicCase = (values) => new Promise((resolve, reject) => {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
  const frameName = `public-create-${requestId}`
  const iframe = document.createElement('iframe')
  const form = document.createElement('form')
  let timeoutId

  const cleanup = () => {
    clearTimeout(timeoutId)
    window.removeEventListener('message', handleMessage)
    form.remove()
    iframe.remove()
  }
  const handleMessage = (event) => {
    const result = event.data
    if (!result || result.type !== 'publicCreateResult' || result.requestId !== requestId) return
    cleanup()
    if (result.ok && result.caseNo) resolve(result.caseNo)
    else reject(new Error(result.message || '申請未完成'))
  }
  const addField = (name, value) => {
    const input = document.createElement('input')
    input.type = 'hidden'; input.name = name; input.value = value ?? ''
    form.appendChild(input)
  }

  iframe.name = frameName
  iframe.hidden = true
  form.method = 'POST'
  form.action = GAS_URL
  form.target = frameName
  form.hidden = true
  const fields = {
    action: 'publicCreate', requestId, website: '', applicant: values.applicant,
    phone: values.phone, addressDetail: values.addressDetail,
    wasteType: values.wasteType, quantity: String(values.quantity),
    preferredDate: toMinguoDateTime(values.preferredDate), preferredTimeSlot: values.preferredTimeSlot || '',
    locationNote: values.locationNote || '', email: values.email || ''
  }
  Object.entries(fields).forEach(([name, value]) => addField(name, value))
  if (values.photo) {
    addField('fileBase64', values.photo.base64)
    addField('fileName', values.photo.name)
    addField('mimeType', values.photo.mimeType)
  }

  window.addEventListener('message', handleMessage)
  document.body.append(iframe, form)
  timeoutId = setTimeout(() => {
    cleanup()
    reject(new Error('送出逾時，請確認網路後再試；若案件已建立，請勿重複送出並洽承辦人員確認。'))
  }, 120000)
  form.submit()
})
export const workerGet = async (action, parameters = {}) => {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value ?? ''))
  return readJson(await fetch(url))
}

export const workerPost = async (action, payload = {}) => readJson(await fetch(GAS_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action, ...payload })
}))

export const toCasePayload = (item) => ({
  caseNo: item.case_no, applicant: item.applicant, phone: item.phone,
  address: item.address, wasteType: item.waste_type,
  quantity: Number(item.quantity || 1), status: item.status,
  scheduledAt: toMinguoDateTime(item.scheduled_at), feeAmount: Number(item.fee_amount || 0),
  longitude: item.longitude, latitude: item.latitude,
  geocodedAddress: item.geocoded_address, photoFileId: item.photo_file_id,
  aiResult: item.ai_result, annualCount: Number(item.annual_count || 0),
  freeEligible: item.free_eligible, vehicleNo: item.vehicle_no,
  workerName: item.worker_name, dispatchStatus: item.status,
  dispatchPeriod: item.dispatch_period, dispatchTrip: Number(item.dispatch_trip || 1),
  dispatchOrigin: item.dispatch_origin, dispatchNote: item.dispatch_note,
  feeNote: item.fee_note, quantityReviewStatus: item.quantity_review_status,
  confirmedItems: item.confirmed_items, reviewNote: item.review_note,
  chargeableQuantity: Number(item.chargeable_quantity || 0),
  completionDistanceKm: item.completion_distance_km, completionCarbonKg: item.completion_carbon_kg,
  reportSource: item.report_source, caseId: item.case_id,
  version: Number(item.version || 1) + 1,
  createdAt: toMinguoDateTime(item.created_at), updatedAt: toMinguoDateTime(new Date().toISOString())
})
