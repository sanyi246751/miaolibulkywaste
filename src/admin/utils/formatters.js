export function getMinguoTime(d) {
  if (!d) d = new Date();
  if (!(d instanceof Date)) {
    var raw = String(d).trim();
    var parts = raw.match(/\d+/g);
    if ((raw.indexOf('民國') === 0 || /^\d{2,3}\/\d{1,2}\/\d{1,2}/.test(raw)) && parts && parts.length >= 3) {
      if (/^\d{2,3}\/\d{1,2}\/\d{1,2}/.test(raw)) return raw;
      d = new Date(Number(parts[0]) + 1911, Number(parts[1]) - 1, Number(parts[2]), Number(parts[3] || 0), Number(parts[4] || 0));
    } else {
      d = new Date(raw);
    }
    if (isNaN(d.getTime())) return raw;
  }
  var year = d.getFullYear() - 1911;
  var month = d.getMonth() + 1;
  var day = d.getDate();
  var period = d.getHours() < 12 ? '上午' : '下午';
  var hours = ('0' + (d.getHours() % 12 || 12)).slice(-2);
  var minutes = ('0' + d.getMinutes()).slice(-2);
  return year + '/' + month + '/' + day + period + hours + ':' + minutes;
}

export function formatMinguoDate(value) {
  if (/^\d{2,3}\/\d{1,2}\/\d{1,2}$/.test(String(value || ''))) return value;
  return getMinguoTime(value).replace(/(上午|下午).*/, '');
}

export function formatTaiwanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (/^09\d{8}$/.test(digits)) return digits.slice(0, 4) + '-' + digits.slice(4);
  if (/^037\d{6}$/.test(digits)) return digits.slice(0, 3) + '-' + digits.slice(3);
  if (/^02\d{8}$/.test(digits)) return digits.slice(0, 2) + '-' + digits.slice(2);
  if (/^0\d{8,9}$/.test(digits)) return digits.slice(0, 3) + '-' + digits.slice(3);
  return value;
}

export function getMinguoCompactStr(d) {
  if (!d) d = new Date();
  var year = d.getFullYear() - 1911;
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return year + month + day;
}
