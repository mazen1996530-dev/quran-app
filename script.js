/* =========================================================
   تطبيق المصحف الشريف - السكربت الرئيسي
   ========================================================= */

let currentPage = 1;
let surahsData = [];
let isDarkMode = false;

// عناصر الواجهة
const pageInput = document.getElementById('page-input');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const quranContent = document.getElementById('quran-content');
const headerJuz = document.getElementById('header-juz');
const headerSurah = document.getElementById('header-surah');
const headerPageNum = document.getElementById('header-page-num');
const btnTheme = document.getElementById('btn-theme');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const btnIndex = document.getElementById('btn-index');
const modalIndex = document.getElementById('modal-index');
const btnCloseModal = document.getElementById('btn-close-modal');
const surahList = document.getElementById('surah-list');
const surahSearch = document.getElementById('surah-search');

// أيقونات الوضع الليلي والنهاري
const sunIcon = `<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>`;
const moonIcon = `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>`;

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadSurahsIndex();
  loadPage(currentPage);

  // الأحداث
  btnPrev.addEventListener('click', () => changePage(currentPage - 1));
  btnNext.addEventListener('click', () => changePage(currentPage + 1));
  
  pageInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value);
    if (val >= 1 && val <= 604) {
      changePage(val);
    } else {
      pageInput.value = currentPage;
    }
  });

  btnTheme.addEventListener('click', toggleTheme);
  btnIndex.addEventListener('click', () => modalIndex.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => modalIndex.classList.add('hidden'));
  
  modalIndex.addEventListener('click', (e) => {
    if (e.target === modalIndex) modalIndex.classList.add('hidden');
  });

  surahSearch.addEventListener('input', filterSurahs);

  // التنقل بأسهم المفاتيح
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') changePage(currentPage + 1); // في اللغة العربية التالي يسار
    if (e.key === 'ArrowRight') changePage(currentPage - 1);
  });
});

// تغيير الصفحة
function changePage(page) {
  if (page < 1 || page > 604) return;
  currentPage = page;
  pageInput.value = currentPage;
  headerPageNum.textContent = currentPage;
  loadPage(currentPage);
}

// تحميل بيانات الصفحة من API
async function loadPage(pageNumber) {
  quranContent.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>جاري تحميل الصفحة ${pageNumber}...</p>
    </div>
  `;

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
    const data = await response.json();

    if (data.code === 200) {
      renderPageContent(data.data);
    } else {
      quranContent.innerHTML = `<p class="error">حدث خطأ في تحميل الصفحة.</p>`;
    }
  } catch (err) {
    quranContent.innerHTML = `<p class="error">تعذر الاتصال بالشبكة. يرجى التأكد من اتصال الإنترنت.</p>`;
  }
}

// عرض الآيات والسور داخل الصفحة
function renderPageContent(pageData) {
  const ayahs = pageData.ayahs;
  if (!ayahs || ayahs.length === 0) return;

  // تحديث معلومات الهيدر العلوي
  headerJuz.textContent = `الجزء ${ayahs[0].juz}`;
  const pageSurahNames = [...new Set(ayahs.map(a => a.surah.name))];
  headerSurah.textContent = pageSurahNames.join(' - ');

  let html = '';
  let currentSurahNumber = null;

  ayahs.forEach((ayah) => {
    // إذا كانت الآية بداية سورة جديدة في الصفحة
    if (ayah.surah.number !== currentSurahNumber) {
      currentSurahNumber = ayah.surah.number;
      
      // رأس السورة المزخرف
      html += `
        <div class="surah-header-block">
          <div class="surah-title">${ayah.surah.name}</div>
          <div class="surah-meta">آياتها ${ayah.surah.numberOfAyahs} - ${ayah.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</div>
        </div>
      `;

      // إظهار البسملة (إلا في سورة التوبة وسورة الفاتحة إذا كانت البسملة آية منها)
      if (currentSurahNumber !== 9 && currentSurahNumber !== 1) {
        html += `<div class="bismillah-block">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>`;
      }
    }

    // إزالة البسملة المدمجة بالنص إذا لم تكن الفاتحة وكانت بداية سورة
    let text = ayah.text;
    if (ayah.numberInSurah === 1 && currentSurahNumber !== 1 && currentSurahNumber !== 9) {
      text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
    }

    // إضافة نص الآية ورقمها المزخرف
    html += `<span class="ayah-text">${text}</span> <span class="verse-number">${convertToArabicNumerals(ayah.numberInSurah)}</span> `;
  });

  quranContent.innerHTML = html;
}

// تحميل فهرس السور (114 سورة)
async function loadSurahsIndex() {
  try {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    if (data.code === 200) {
      surahsData = data.data;
      renderSurahsList(surahsData);
    }
  } catch (e) {
    console.error('Failed to load surah index', e);
  }
}

// عرض قائمة السور في النافذة
function renderSurahsList(list) {
  surahList.innerHTML = list.map(surah => `
    <div class="surah-card" onclick="goToSurah(${surah.number})">
      <div class="surah-card-info">
        <span class="surah-card-name">${surah.name}</span>
        <span class="surah-card-meta">${surah.numberOfAyahs} آية - ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
      </div>
      <div class="surah-card-num">${surah.number}</div>
    </div>
  `).join('');
}

// الانقـال إلى سورة من الفهرس
async function goToSurah(surahNum) {
  modalIndex.classList.add('hidden');
  try {
    // جلب رقم الصفحة الخاصة ببدء السورة
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}`);
    const data = await res.json();
    if (data.code === 200 && data.data.ayahs.length > 0) {
      const firstAyahPage = data.data.ayahs[0].page;
      changePage(firstAyahPage);
    }
  } catch (e) {
    console.error('Error fetching surah page', e);
  }
}

// تصفية السور بالبحث
function filterSurahs() {
  const query = surahSearch.value.trim().toLowerCase();
  const filtered = surahsData.filter(s => s.name.includes(query) || s.englishName.toLowerCase().includes(query) || s.number.toString() === query);
  renderSurahsList(filtered);
}

// الأرقام العربية المزخرفة
function convertToArabicNumerals(num) {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicDigits[d]).join('');
}

// إدارة الوضع الليلي والنهاري
function initTheme() {
  const savedTheme = localStorage.getItem('quran_theme');
  if (savedTheme === 'dark') {
    setTheme(true);
  } else {
    setTheme(false);
  }
}

function toggleTheme() {
  setTheme(!isDarkMode);
}

function setTheme(dark) {
  isDarkMode = dark;
  if (dark) {
    document.body.classList.add('dark-theme');
    themeIcon.innerHTML = sunIcon;
    themeText.textContent = 'الوضع النهار';
    localStorage.setItem('quran_theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    themeIcon.innerHTML = moonIcon;
    themeText.textContent = 'الوضع الليلي';
    localStorage.setItem('quran_theme', 'light');
  }
}
