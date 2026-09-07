import { useState } from 'react';
import Header from './components/Header.jsx';
import BookingView from './components/BookingView.jsx';
import BookingQueryView from './components/BookingQueryView.jsx';
import BookingSuccessModal from './components/BookingSuccessModal.jsx';
import PrintableTagModal from './components/PrintableTagModal.jsx';
import Footer from './components/Footer.jsx';
import QRCodeBox from './components/QRCodeBox.jsx';
import { CATEGORIES, COUNTIES, DISTRICTS_BY_COUNTY, TERMS_LIST, getUnavailableBookingReason } from './data/appData.js';
import { formatMinguoDate, formatTaiwanPhone, getMinguoTime } from './utils/formatters.js';
import { GAS_URL, createPublicCase, queryCase } from './api.js';

    // Main App Component
    export default function App() {
      const [activeTab, setActiveTab] = useState('booking'); // 'booking', 'query', 'admin'

      const gasUrl = GAS_URL;

      // Modal States
      const [successBooking, setSuccessBooking] = useState(null);
      const [printableBooking, setPrintableBooking] = useState(null);
      // Form State
      const [applicantName, setApplicantName] = useState('');
      const [phone, setPhone] = useState('');
      const [email, setEmail] = useState('');
      const [county, setCounty] = useState('苗栗縣');
      const [district, setDistrict] = useState('三義鄉');
      const [detailAddress, setDetailAddress] = useState('');
      const [selectedItems, setSelectedItems] = useState([]);
      const [photos, setPhotos] = useState([]);
      const toLocalDateString = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const getDefaultBookingDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 3);
        while (getUnavailableBookingReason(toLocalDateString(date))) date.setDate(date.getDate() + 1);
        return toLocalDateString(date);
      };
      const defaultDate = getDefaultBookingDate();
      const [preferredDate, setPreferredDate] = useState(defaultDate);
      const [preferredTimeSlot, setPreferredTimeSlot] = useState('上午8點至12點');
      const [locationNote, setLocationNote] = useState('');
      const [agreedTerms, setAgreedTerms] = useState([]);
      const [errors, setErrors] = useState({});
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [submitSecondsLeft, setSubmitSecondsLeft] = useState(0);

      // Query Search state
      const [searchQuery, setSearchQuery] = useState('');
      const [searchPhone, setSearchPhone] = useState('');
      const [searchResults, setSearchResults] = useState([]);
      const [hasSearched, setHasSearched] = useState(false);



      // Item quantity control
      const handleItemQtyChange = (catId, delta) => {
        setSelectedItems((prev) => {
          const found = prev.find((i) => i.categoryId === catId);
          if (found) {
            const nextQty = found.quantity + delta;
            if (nextQty <= 0) return prev.filter((i) => i.categoryId !== catId);
            return prev.map((i) => (i.categoryId === catId ? { ...i, quantity: nextQty } : i));
          } else if (delta > 0) {
            const catObj = CATEGORIES.find((c) => c.id === catId);
            return [...prev, { categoryId: catId, categoryName: catObj.name, name: catObj.name, quantity: 1, note: '' }];
          }
          return prev;
        });
      };

      const getItemQty = (catId) => {
        const found = selectedItems.find((i) => i.categoryId === catId);
        return found ? found.quantity : 0;
      };
      const getItemNote = (catId) => selectedItems.find((i) => i.categoryId === catId)?.note || '';
      const handleItemNoteChange = (catId, note) => setSelectedItems((prev) => prev.map((i) => i.categoryId === catId ? { ...i, note, name: catId === 'other' ? (note || '其他') : i.name } : i));

      // Photo Drag & Drop
      const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
          if (!file.type.startsWith('image/')) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const image = new Image();
            image.onload = () => {
              const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
              canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
              setPhotos((prev) => [...prev, { id: Date.now() + Math.random(), name: file.name.replace(/\.[^.]+$/, '') + '.jpg', url: canvas.toDataURL('image/jpeg', 0.84) }]);
            };
            image.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      };



      // Terms Agreement Toggle
      const isAllTermsAgreed = TERMS_LIST.every((t) => agreedTerms.includes(t.id));
      const handleToggleTerm = (id) => {
        if (agreedTerms.includes(id)) {
          setAgreedTerms(agreedTerms.filter((i) => i !== id));
        } else {
          setAgreedTerms([...agreedTerms, id]);
        }
      };

      // Form Validation & Submission
      const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const errs = {};
        if (!applicantName.trim()) errs.applicantName = '請輸入申請人姓名';
        if (!phone.trim()) errs.phone = '請輸入聯絡電話';
        else if (!/^09\d{2}-?\d{6}$/.test(phone.trim()) && !/^0\d{1,2}-?\d{6,8}$/.test(phone.trim())) {
          errs.phone = '請輸入正確格式電話（如 0912-345678 或 037-123456）';
        }
        if (!detailAddress.trim()) errs.detailAddress = '請填寫詳細清運地址';
        if (!preferredDate) errs.preferredDate = '請從日曆選擇希望清運日期';
        else if (preferredDate < toLocalDateString(new Date())) errs.preferredDate = '希望清運日期不可早於今天';
        else {
          const unavailableReason = getUnavailableBookingReason(preferredDate);
          if (unavailableReason) errs.preferredDate = unavailableReason;
        }
        if (selectedItems.length === 0) errs.items = '請至少選擇一項待清運傢俱項目';
        if (agreedTerms.length < TERMS_LIST.length) errs.terms = '需全數同意 5 項申請聲明與規定';

        setErrors(errs);
        if (Object.keys(errs).length > 0) {
          window.scrollTo({ top: 120, behavior: 'smooth' });
          return;
        }

        const estimatedSeconds = photos.length > 0 ? Math.min(10, 2 + photos.length * 2) : 1;
        setIsSubmitting(true);
        setSubmitSecondsLeft(estimatedSeconds);
        const countdownTimer = setInterval(() => setSubmitSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
        await new Promise((resolve) => setTimeout(resolve, 50));

        try {
          const totalQuantity = selectedItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
          const wasteType = selectedItems.map((item) => `${item.name}×${item.quantity}`).join('、');
          const firstPhoto = photos[0] ? {
            name: photos[0].name,
            mimeType: String(photos[0].url).slice(5, String(photos[0].url).indexOf(';')) || 'image/jpeg',
            base64: String(photos[0].url).split(',')[1]
          } : null;
          const bookingId = await createPublicCase({
            applicant: applicantName.trim(), phone: formatTaiwanPhone(phone),
            addressDetail: detailAddress.trim(), wasteType, quantity: totalQuantity,
            preferredDate, preferredTimeSlot, locationNote, email: email.trim(), photo: firstPhoto
          });
          const newBooking = {
            id: bookingId, applicantName, phone: formatTaiwanPhone(phone), email,
            county, district, address: detailAddress, preferredDate, preferredTimeSlot,
            locationNote, items: selectedItems, photos: photos.map((item) => item.url),
            status: '待處理', statusTimeline: [{ status: '待處理', time: new Date().toISOString() }],
            createdAt: getMinguoTime(), agreedToTerms: true
          };
          setSuccessBooking(newBooking);
          setApplicantName(''); setPhone(''); setEmail(''); setCounty('苗栗縣'); setDistrict('三義鄉');
          const nextDefaultDate = getDefaultBookingDate();
          setDetailAddress(''); setSelectedItems([]); setPhotos([]); setPreferredDate(nextDefaultDate);
          setPreferredTimeSlot('上午8點至12點'); setLocationNote(''); setAgreedTerms([]); setErrors({}); setActiveTab('booking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
          setErrors({ submit: error.message || '申請送出失敗，請稍後再試' });
          window.scrollTo({ top: 120, behavior: 'smooth' });
        } finally {
          clearInterval(countdownTimer);
          setSubmitSecondsLeft(0);
          setIsSubmitting(false);
        }
      };

      // Search Query Logic
      const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !searchPhone.trim()) return;
        setHasSearched(false);
        try {
          const result = (await queryCase(searchQuery.trim(), formatTaiwanPhone(searchPhone))).case;
          setSearchResults([{
            id: result.caseNo, phone: formatTaiwanPhone(searchPhone), status: result.status,
            preferredDate: result.scheduledAt, preferredTimeSlot: '', address: '基於個資保護不顯示地址',
            itemsChinese: result.wasteType, items: [], quantity: result.quantity,
            statusTimeline: [{ status: result.status, time: new Date().toISOString() }]
          }]);
        } catch (_error) {
          setSearchResults([]);
        } finally {
          setHasSearched(true);
        }
      };
      const viewProps = { activeTab, setActiveTab, applicantName, setApplicantName, phone, setPhone, email, setEmail, county, setCounty, district, setDistrict, detailAddress, setDetailAddress, selectedItems, photos, setPhotos, preferredDate, setPreferredDate, getUnavailableBookingReason, preferredTimeSlot, setPreferredTimeSlot, locationNote, setLocationNote, setAgreedTerms, errors, setErrors, isSubmitting, submitSecondsLeft, handleItemQtyChange, getItemQty, getItemNote, handleItemNoteChange, handleFileUpload, isAllTermsAgreed, handleFormSubmit, CATEGORIES, COUNTIES, DISTRICTS_BY_COUNTY, TERMS_LIST, formatMinguoDate, formatTaiwanPhone, getMinguoTime, setPrintableBooking, searchQuery, setSearchQuery, searchPhone, setSearchPhone, searchResults, hasSearched, handleSearchSubmit, gasUrl, successBooking, setSuccessBooking, printableBooking, QRCodeBox };

      return (
        <div className="civic-shell min-h-screen flex flex-col">

          <Header {...viewProps} />

          {/* Main Content View */}
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 no-print">

            <BookingView {...viewProps} />

          <BookingQueryView {...viewProps} />

          </main>

          <BookingSuccessModal {...viewProps} />

          <PrintableTagModal {...viewProps} />

          <Footer />
        </div>
      );
    }
