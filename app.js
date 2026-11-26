
'use strict';

// ======================================================
// VETCARE WORLD - COMPLETE MAIN APPLICATION
// Public Browsing + Member Accounts + Knowledge Centre
// ======================================================


// 1. SUPABASE CONNECTION
// ------------------------------------------------------

const SUPABASE_URL = 'https://vhtsqtloiyhaomigvmqu.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_KIlNronqSHSqk2jcHqX7uw_v82o9ae1';

const APP_REDIRECT_URL = new URL('./', window.location.href).href;

let db = null;
let currentUser = null;
let isPosting = false;
let supabaseLoadPromise = null;

function createVetCareDatabaseClient() {
  if (db) return db;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    return null;
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: { 'X-Client-Info': 'vetcare-world-web' }
    }
  });
  return db;
}

function loadSupabaseFrom(url, mode = 'umd') {
  if (mode === 'esm') {
    return import(url).then(module => {
      const api = module && (module.createClient ? module : module.default);
      if (!api || typeof api.createClient !== 'function') {
        throw new Error('Supabase module loaded but createClient was not found');
      }
      window.supabase = api;
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve();
      }
    };
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.supabase?.createClient) finish();
      else finish(new Error('Supabase SDK loaded without createClient'));
    };
    script.onerror = () => finish(new Error('Could not load Supabase SDK from ' + url));
    const timeoutId = window.setTimeout(
      () => finish(new Error('Supabase SDK load timed out')),
      12000
    );
    document.head.appendChild(script);
  });
}

async function ensureDatabaseConnection(forceRetry = false) {
  if (createVetCareDatabaseClient()) return true;
  if (forceRetry) supabaseLoadPromise = null;

  if (!supabaseLoadPromise) {
    supabaseLoadPromise = (async () => {
      // Try independent delivery networks. The ESM mirror is useful when UMD
      // script delivery is blocked by a carrier, DNS filter, or regional route.
      const sources = [
        { url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js', mode: 'umd' },
        { url: 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js', mode: 'umd' },
        { url: 'https://esm.sh/@supabase/supabase-js@2?bundle', mode: 'esm' }
      ];
      for (const source of sources) {
        try {
          await loadSupabaseFrom(source.url, source.mode);
          if (createVetCareDatabaseClient()) return true;
        } catch (error) {
          console.warn('Supabase SDK source unavailable:', source.url, error.message);
        }
      }
      return false;
    })();
  }

  try {
    const connected = await supabaseLoadPromise;
    if (!connected) supabaseLoadPromise = null;
    return connected;
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    supabaseLoadPromise = null;
    return false;
  }
}

function showDatabaseRetry() {
  const retryButton = document.getElementById('retryDatabaseBtn');
  if (retryButton) retryButton.hidden = false;
}

async function retryDatabaseConnection() {
  const retryButton = document.getElementById('retryDatabaseBtn');
  if (retryButton) {
    retryButton.disabled = true;
    retryButton.textContent = 'Connecting...';
  }
  showAuthMessage('Trying to connect to VetCare World...', false);
  const connected = await ensureDatabaseConnection(true);
  if (connected) {
    if (retryButton) retryButton.hidden = true;
    showAuthMessage('Database connection restored. You can now log in or create an account.');
    await initializeVetCareWorld();
  } else {
    showAuthMessage('Could not reach the database service. Check the internet connection or try another network. If this continues, the Supabase project or network route needs checking.', true);
    showDatabaseRetry();
  }
  if (retryButton) {
    retryButton.disabled = false;
    retryButton.textContent = 'Retry connection';
  }
}

// Use the page-loaded SDK first, then independent fallback sources.
createVetCareDatabaseClient();
if (!db) ensureDatabaseConnection();

window.addEventListener('online', () => {
  if (!db) retryDatabaseConnection();
});

// 2. COMMON HTML ELEMENTS
// ------------------------------------------------------

const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');

const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');

const logoutButtons = document.querySelectorAll('#logoutBtn');

const authMessage = document.getElementById('authMessage');
const authBox = document.getElementById('authBox');

document.getElementById('retryDatabaseBtn')?.addEventListener('click', retryDatabaseConnection);

const postBtn = document.getElementById('postBtn');
const postText = document.getElementById('postText');
const askVetBtn = document.getElementById('askVetBtn');
const askVetText = document.getElementById('askVetText');
const askVetList = document.getElementById('askVetList');
// Questions to the vet are community posts with this prefix, so they also appear in the feed.
const ASK_VET_PREFIX = '❓ ASK THE VET: ';


// 3. AUTHENTICATION MESSAGES
// ------------------------------------------------------

function showAuthMessage(message, isError = false) {

  if (!authMessage) return;

  authMessage.textContent = message;

  authMessage.style.color = isError
    ? '#b42318'
    : '#176b45';
}


// 4. LOGIN DISPLAY
// ------------------------------------------------------

function updateAuthDisplay(user) {

  currentUser = user || null;

  const loggedIn = !!currentUser;

  if (signupBtn) {
    signupBtn.style.display = loggedIn ? 'none' : '';
  }

  if (loginBtn) {
    loginBtn.style.display = loggedIn ? 'none' : '';
  }

  logoutButtons.forEach(button => {
    button.style.display = loggedIn ? '' : 'none';
  });

  if (emailInput) {
    emailInput.disabled = loggedIn;
  }

  if (passwordInput) {
    passwordInput.disabled = loggedIn;
  }

  document.body.classList.toggle('logged-in', loggedIn);
}


// 5. LOGIN PANEL
// ------------------------------------------------------

function openVetCareLogin() {
  if (!authBox) return;

  // Close the navigation drawer before showing the login dialog.
  const menuPanel = document.getElementById('menuPanel');
  const menuButton = document.getElementById('menuBtn');
  menuPanel?.classList.remove('menu-open');
  document.body.classList.remove('vetcare-menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');

  authBox.classList.remove('hidden');
  authBox.setAttribute('aria-hidden', 'false');

  // Do not scroll the page underneath the fixed dialog.
  window.requestAnimationFrame(() => {
    emailInput?.focus({ preventScroll: true });
  });
}

function closeVetCareLogin() {
  if (!authBox) return;
  authBox.classList.add('hidden');
  authBox.setAttribute('aria-hidden', 'true');
}

document.getElementById('openLoginBtn')?.addEventListener(
  'click',
  openVetCareLogin
);

document.getElementById('memberRegisterBtn')?.addEventListener('click', openVetCareLogin);

document.getElementById('closeLoginBtn')?.addEventListener(
  'click',
  closeVetCareLogin
);

// Close the centered sign-in dialog when tapping outside its card.
authBox?.addEventListener('click', event => {
  if (event.target === authBox) closeVetCareLogin();
});

document.addEventListener('keydown', event => {

  if (event.key === 'Escape') {

    document.getElementById('menuPanel')?.classList.remove('menu-open');
    document.body.classList.remove('vetcare-menu-open');
    document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
    closeVetCareLogin();

    document
      .querySelector('.knowledge-detail-overlay')
      ?.remove();
  }

});


// 6. PAGE NAVIGATION
// ------------------------------------------------------

const pages = [
  ...document.querySelectorAll('.page')
];

function showPage(pageId) {

  const target = document.getElementById(pageId);

  if (!target || !target.classList.contains('page')) {
    return;
  }

  pages.forEach(page => {

    page.classList.toggle(
      'hidden',
      page.id !== pageId
    );

  });

  // Homepage-only styling hook (23 Nov 2026 redesign).
  document.body.classList.toggle('vc-on-home', pageId === 'home');

  document.querySelectorAll('[data-target]').forEach(button => {

    button.classList.toggle(
      'active',
      button.dataset.target === pageId
    );

  });

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

document.querySelectorAll('[data-target]').forEach(button => {

  button.addEventListener('click', event => {

    event.preventDefault();

    showPage(button.dataset.target);

  });

});

// Smooth-scroll buttons (homepage hero "Explore Knowledge" scrolls to the
// categories section on the same page). No navigation, no new page.
document.querySelectorAll('[data-scroll-to]').forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Support direct section links and browser back/forward navigation.
function showPageFromHash() {
  const requested = (window.location.hash || '#home').slice(1);
  const page = document.getElementById(requested);
  if (page?.classList.contains('page')) showPage(requested);
}
window.addEventListener('hashchange', showPageFromHash);



// 7. LANGUAGE SWITCH
// ------------------------------------------------------

let currentLanguage = 'en';

const langBtn = document.getElementById('langBtn');

function updateLanguage() {

  document.querySelectorAll('[data-en][data-ur]').forEach(element => {

    element.textContent =
      element.getAttribute(
        currentLanguage === 'ur' ? 'data-ur' : 'data-en'
      );

  });

  if (langBtn) {

    // Mockup-style EN | اردو pill: both languages shown, current one bold.
    // (v3.2: no globe emoji — keeps the mobile header to one clean row.)
    langBtn.innerHTML =
      currentLanguage === 'en'
        ? '<span class="vc-lang-on">EN</span> | <span>اردو</span>'
        : '<span>EN</span> | <span class="vc-lang-on">اردو</span>';

  }

  document.documentElement.lang = currentLanguage;

  document.documentElement.dir =
    currentLanguage === 'ur' ? 'rtl' : 'ltr';
}

langBtn?.addEventListener('click', () => {

  currentLanguage =
    currentLanguage === 'en' ? 'ur' : 'en';

  updateLanguage();

});


// 8. KNOWLEDGE CENTRE - COMPLETE ARTICLES
// ------------------------------------------------------

const knowledgeArticles = {

  health: {
    icon: '🩺',
    title: 'Animal Health',
    urduTitle: 'جانوروں کی صحت',

    intro:
      'Recognizing illness early is one of the most important parts of livestock care.',

    urdu:
      'جانوروں کی صحت کی حفاظت کے لیے بیماری کی ابتدائی علامات پہچاننا بہت ضروری ہے۔',

    sections: [

      {
        heading: 'Common warning signs',
        urduHeading: 'بیماری کی عام علامات',

        points: [
          'Loss of appetite or reduced water intake.',
          'Fever, weakness or unusual behaviour.',
          'Coughing, nasal discharge or breathing difficulty.',
          'Diarrhoea, bloating or reduced milk production.',
          'Changes in walking, posture or normal activity.'
        ],

        urduPoints: [
          'بھوک کم ہونا یا پانی کم پینا۔',
          'بخار، کمزوری یا غیر معمولی رویہ۔',
          'کھانسی، ناک سے پانی آنا یا سانس لینے میں دشواری۔',
          'دست، پیٹ پھولنا یا دودھ میں کمی۔',
          'چلنے پھرنے یا معمول کی سرگرمیوں میں تبدیلی۔'
        ]
      },

      {
        heading: 'Prevention and daily care',
        urduHeading: 'بچاؤ اور روزانہ کی دیکھ بھال',

        points: [
          'Provide clean drinking water and suitable feed.',
          'Keep animal housing clean and well ventilated.',
          'Follow a vaccination plan advised by a veterinarian.',
          'Control parasites according to veterinary advice.',
          'Separate sick animals and seek veterinary examination.'
        ],

        urduPoints: [
          'صاف پانی اور مناسب خوراک فراہم کریں۔',
          'جانوروں کے باڑے صاف اور ہوا دار رکھیں۔',
          'ویٹرنری ڈاکٹر کے مشورے سے ویکسینیشن کروائیں۔',
          'ڈاکٹر کے مشورے کے مطابق پیٹ اور بیرونی کیڑوں کا کنٹرول کریں۔',
          'بیمار جانور کو الگ رکھیں اور ڈاکٹر سے معائنہ کروائیں۔'
        ]
      }

    ],

    warning:
      'Difficulty breathing, inability to stand, severe bloat, heavy bleeding or sudden multiple deaths require urgent veterinary help.'
  },


  feed: {
    icon: '🌾',
    title: 'Feed & Nutrition',
    urduTitle: 'خوراک اور غذائیت',

    intro:
      'Balanced nutrition supports growth, milk production, reproduction and animal health.',

    urdu:
      'متوازن خوراک جانور کی نشوونما، دودھ کی پیداوار، افزائش اور صحت کے لیے بنیادی اہمیت رکھتی ہے۔',

    sections: [

      {
        heading: 'Main parts of a balanced ration',
        urduHeading: 'متوازن خوراک کے بنیادی اجزاء',

        points: [
          'Green fodder such as berseem, lucerne and maize.',
          'Suitable dry roughage such as hay and straw.',
          'Concentrate feed according to production needs.',
          'Appropriate minerals and salt.',
          'Fresh and clean drinking water.'
        ],

        urduPoints: [
          'سبز چارہ مثلاً برسیم، لوسرن اور مکئی۔',
          'خشک چارہ مثلاً گھاس اور بھوسہ۔',
          'پیداوار کے مطابق ونڈا یا کنسنٹریٹ خوراک۔',
          'ضرورت کے مطابق منرلز اور نمک۔',
          'ہر وقت تازہ اور صاف پانی۔'
        ]
      },

      {
        heading: 'Good feeding practices',
        urduHeading: 'خوراک دینے کے بہتر طریقے',

        points: [
          'Adjust feed according to species, age and production.',
          'Introduce feed changes gradually.',
          'Store feed in a clean, dry and protected place.',
          'Avoid moldy, spoiled or contaminated feed.',
          'Observe body condition and production regularly.'
        ],

        urduPoints: [
          'خوراک جانور کی نسل، عمر اور پیداوار کے مطابق رکھیں۔',
          'خوراک میں تبدیلی آہستہ آہستہ کریں۔',
          'چارہ خشک اور صاف جگہ پر محفوظ کریں۔',
          'پھپھوندی یا خراب خوراک استعمال نہ کریں۔',
          'جانور کی جسمانی حالت اور پیداوار پر نظر رکھیں۔'
        ]
      }

    ],

    warning:
      'There is no single ration suitable for every animal. A feeding plan should be adjusted to the animal and local feed resources.'
  },


  breeds: {
    icon: '🐄',
    title: 'Livestock Breeds',
    urduTitle: 'مویشیوں کی نسلیں',

    intro:
      'Choosing suitable breeds can improve farm productivity and profitability.',

    urdu:
      'مناسب نسل کا انتخاب فارم کی پیداوار، جانوروں کی کارکردگی اور منافع بہتر بنانے میں مدد دیتا ہے۔',

    sections: [

      {
        heading: 'Important Pakistani livestock breeds',
        urduHeading: 'پاکستان کی اہم مویشی نسلیں',

        points: [
          'Cattle: Sahiwal, Red Sindhi and Cholistani.',
          'Buffalo: Nili-Ravi and Kundi.',
          'Goats: Beetal, Teddy and Kamori.',
          'Sheep: Lohi, Kajli and Thalli.'
        ],

        urduPoints: [
          'گائے: ساہیوال، ریڈ سندھی اور چولستانی۔',
          'بھینس: نیلی راوی اور کنڈی۔',
          'بکری: بیٹل، ٹیڈی اور کاموری۔',
          'بھیڑ: لوہی، کجلی اور تھلی۔'
        ]
      },

      {
        heading: 'How to select breeding animals',
        urduHeading: 'افزائش کے لیے جانور کا انتخاب',

        points: [
          'Check health, body condition and physical structure.',
          'Review available production and breeding records.',
          'Prefer animals with known parentage where possible.',
          'Check reproductive history and age.',
          'Avoid animals with known inherited defects.'
        ],

        urduPoints: [
          'صحت، جسمانی حالت اور ساخت کا جائزہ لیں۔',
          'دستیاب پیداواری اور افزائشی ریکارڈ دیکھیں۔',
          'ممکن ہو تو معلوم نسل اور والدین والا جانور منتخب کریں۔',
          'عمر اور تولیدی تاریخ چیک کریں۔',
          'موروثی نقائص والے جانوروں سے پرہیز کریں۔'
        ]
      }

    ],

    warning:
      'Breed performance depends on climate, feed, management and individual animal genetics. Local suitability matters.'
  },


  farm: {
    icon: '🏡',
    title: 'Farm Management',
    urduTitle: 'فارم مینجمنٹ',

    intro:
      'Good farm management improves animal welfare, hygiene and productivity.',

    urdu:
      'بہتر فارم مینجمنٹ سے جانوروں کی فلاح، صفائی، پیداوار اور منافع میں بہتری آتی ہے۔',

    sections: [

      {
        heading: 'Housing and hygiene',
        urduHeading: 'رہائش اور صفائی',

        points: [
          'Provide enough space for animals to rest comfortably.',
          'Ensure good ventilation and weather protection.',
          'Keep floors dry and remove manure regularly.',
          'Clean feeding and watering equipment.',
          'Provide safe flooring to reduce slipping injuries.'
        ],

        urduPoints: [
          'جانوروں کے آرام کے لیے مناسب جگہ فراہم کریں۔',
          'ہوا کی آمدورفت اور موسم سے تحفظ کا انتظام کریں۔',
          'فرش خشک رکھیں اور گوبر باقاعدگی سے صاف کریں۔',
          'خوراک اور پانی کے برتن صاف رکھیں۔',
          'پھسلنے سے بچاؤ کے لیے محفوظ فرش بنائیں۔'
        ]
      },

      {
        heading: 'Daily farm routine',
        urduHeading: 'فارم کا روزانہ معمول',

        points: [
          'Observe every animal for changes in appetite or behaviour.',
          'Check water, feed and housing conditions.',
          'Record milk yield, births, illness and treatments.',
          'Maintain a separate clean area for sick animals.',
          'Review breeding and production records regularly.'
        ],

        urduPoints: [
          'ہر جانور کی بھوک اور رویے میں تبدیلی دیکھیں۔',
          'پانی، خوراک اور رہائش کا جائزہ لیں۔',
          'دودھ، پیدائش، بیماری اور علاج کا ریکارڈ رکھیں۔',
          'بیمار جانوروں کے لیے الگ صاف جگہ رکھیں۔',
          'افزائش اور پیداوار کا ریکارڈ باقاعدگی سے دیکھیں۔'
        ]
      }

    ],

    warning:
      'Keep treatment, vaccination, breeding and production records. Follow local veterinary advice for herd health planning.'
  },

  vaccine: {
    icon: '💉',
    title: 'Vaccination & Prevention',
    urduTitle: 'ویکسینیشن اور بیماریوں سے بچاؤ',
    intro: 'A planned herd-health programme helps reduce the risk and impact of infectious diseases.',
    urdu: 'منظم ویکسینیشن اور بائیوسیکیورٹی سے متعدی بیماریوں کے خطرات کم کرنے میں مدد ملتی ہے۔',
    sections: [
      {
        heading: 'Build a farm vaccination plan',
        urduHeading: 'فارم کے لیے ویکسینیشن پلان',
        points: [
          'Choose vaccines according to local disease risks and official veterinary guidance.',
          'Record each animal’s identification, vaccine name, batch, date and next due date.',
          'Maintain the cold chain and follow the vaccine label instructions.',
          'Use the correct route, dose and age schedule stated by the manufacturer or veterinarian.',
          'Do not vaccinate severely ill animals without veterinary advice.'
        ],
        urduPoints: [
          'علاقے میں موجود بیماریوں کے خطرات اور سرکاری ویٹرنری ہدایات کے مطابق ویکسین منتخب کریں۔',
          'ہر جانور کا نمبر، ویکسین کا نام، بیچ، تاریخ اور اگلی تاریخ درج کریں۔',
          'ویکسین کو مقررہ ٹھنڈے درجہ حرارت پر محفوظ رکھیں۔',
          'لیبل یا ڈاکٹر کی ہدایت کے مطابق طریقہ، خوراک اور عمر کا شیڈول اپنائیں۔',
          'شدید بیمار جانور کو ڈاکٹر کے مشورے کے بغیر ویکسین نہ لگائیں۔'
        ]
      },
      {
        heading: 'Biosecurity essentials',
        urduHeading: 'بائیوسیکیورٹی کے بنیادی اصول',
        points: [
          'Quarantine newly purchased animals before mixing them with the herd.',
          'Isolate sick animals and clean shared equipment.',
          'Control visitors, vehicles, rodents and animal movements.',
          'Dispose of carcasses and clinical waste safely according to local rules.'
        ],
        urduPoints: [
          'نئے خریدے گئے جانوروں کو ریوڑ میں شامل کرنے سے پہلے الگ رکھیں۔',
          'بیمار جانور الگ کریں اور مشترکہ سامان صاف کریں۔',
          'مہمانوں، گاڑیوں، چوہوں اور جانوروں کی نقل و حرکت کو کنٹرول کریں۔',
          'مردہ جانور اور طبی فضلہ مقامی قوانین کے مطابق محفوظ طریقے سے تلف کریں۔'
        ]
      }
    ],
    warning: 'Vaccine schedules differ by country, disease pressure, species and product. Follow the vaccine label and a local veterinarian’s programme.'
  },

  calf: {
    icon: '🐮',
    title: 'Calf & Young Stock Care',
    urduTitle: 'بچھڑوں اور کم عمر جانوروں کی دیکھ بھال',
    intro: 'Good newborn care, colostrum management, hygiene and nutrition support healthy calf growth.',
    urdu: 'نوزائیدہ بچھڑے کی دیکھ بھال، کھِیس، صفائی اور مناسب خوراک صحت مند نشوونما کے لیے اہم ہیں۔',
    sections: [
      {
        heading: 'Care immediately after birth',
        urduHeading: 'پیدائش کے فوراً بعد دیکھ بھال',
        points: [
          'Check that the calf is breathing and dry it promptly.',
          'Ensure timely intake of clean, good-quality colostrum in an adequate amount.',
          'Disinfect the navel using a suitable product and hygienic technique.',
          'Keep the calf in a clean, dry, well-ventilated area.',
          'Record birth date, dam identity, sex and any assistance required.'
        ],
        urduPoints: [
          'دیکھیں کہ بچھڑا سانس لے رہا ہے اور اسے جلد خشک کریں۔',
          'صاف اور معیاری کھِیس مناسب مقدار میں بروقت پلائیں۔',
          'صاف طریقے سے ناف کو مناسب جراثیم کش محلول سے صاف کریں۔',
          'بچھڑے کو صاف، خشک اور ہوا دار جگہ پر رکھیں۔',
          'پیدائش کی تاریخ، ماں کا نمبر، جنس اور مدد کی تفصیل درج کریں۔'
        ]
      },
      {
        heading: 'Daily feeding and health checks',
        urduHeading: 'روزانہ خوراک اور صحت کا جائزہ',
        points: [
          'Provide milk or milk replacer according to a consistent feeding plan.',
          'Offer clean water and suitable starter feed as the calf grows.',
          'Watch for diarrhoea, dehydration, coughing, fever and reduced appetite.',
          'Clean feeding utensils after each use.',
          'Follow a veterinarian-guided vaccination and parasite-control plan.'
        ],
        urduPoints: [
          'مقررہ منصوبے کے مطابق دودھ یا ملک ریپلیسر دیں۔',
          'نشوونما کے ساتھ صاف پانی اور مناسب اسٹارٹر فیڈ دیں۔',
          'دست، پانی کی کمی، کھانسی، بخار اور بھوک میں کمی پر نظر رکھیں۔',
          'ہر استعمال کے بعد دودھ پلانے کے برتن صاف کریں۔',
          'ڈاکٹر کے مشورے سے ویکسینیشن اور کیڑوں کے کنٹرول کا منصوبہ بنائیں۔'
        ]
      }
    ],
    warning: 'A weak calf, inability to suckle, severe diarrhoea, dehydration or breathing difficulty needs prompt veterinary assessment.'
  }

};


// 9. OPEN KNOWLEDGE ARTICLE
// ------------------------------------------------------

function openKnowledgeArticle(article) {

  if (!article) return;

  document
    .querySelector('.knowledge-detail-overlay')
    ?.remove();

  const overlay = document.createElement('div');

  overlay.className = 'knowledge-detail-overlay';

  const detail = document.createElement('article');

  detail.className = 'knowledge-detail';

  detail.setAttribute('role', 'dialog');
  detail.setAttribute('aria-modal', 'true');

  const close = document.createElement('button');

  close.className = 'detail-close';
  close.type = 'button';
  close.textContent = '✕ Close';

  close.addEventListener('click', () => {
    overlay.remove();
  });

  const title = document.createElement('h2');

  title.textContent =
    article.icon + ' ' + article.title;

  const urduTitle = document.createElement('h3');

  urduTitle.textContent = article.urduTitle;
  urduTitle.dir = 'rtl';

  const intro = document.createElement('p');

  intro.textContent = article.intro;

  const urduIntro = document.createElement('p');

  urduIntro.className = 'detail-urdu';
  urduIntro.textContent = article.urdu;
  urduIntro.dir = 'rtl';

  detail.append(
    close,
    title,
    urduTitle,
    intro,
    urduIntro
  );


  article.sections.forEach(section => {

    const heading = document.createElement('h3');

    heading.textContent = section.heading;

    const urduHeading = document.createElement('p');

    urduHeading.className = 'detail-urdu';
    urduHeading.textContent = section.urduHeading;
    urduHeading.dir = 'rtl';

    const list = document.createElement('ul');

    section.points.forEach(point => {

      const item = document.createElement('li');

      item.textContent = point;

      list.appendChild(item);

    });

    const urduList = document.createElement('ul');

    urduList.dir = 'rtl';

    section.urduPoints.forEach(point => {

      const item = document.createElement('li');

      item.textContent = point;

      urduList.appendChild(item);

    });

    detail.append(
      heading,
      urduHeading,
      list,
      urduList
    );

  });


  const warning = document.createElement('p');

  warning.className = 'detail-warning';

  warning.textContent =
    '⚕️ Veterinary note: ' + article.warning;

  detail.appendChild(warning);

  overlay.appendChild(detail);

  overlay.addEventListener('click', event => {

    if (event.target === overlay) {
      overlay.remove();
    }

  });

  document.body.appendChild(overlay);

  close.focus();
}


// 10. CONNECT KNOWLEDGE CARDS TO ARTICLES
// ------------------------------------------------------

function setupKnowledgeCards() {

  const section = document.getElementById('knowledge');

  if (!section) return;

  const cards = section.querySelectorAll('.knowledge-card');

  cards.forEach(card => {

    const text = card.textContent.toLowerCase();

    let article = null;

    if (
      text.includes('vaccin') ||
      text.includes('prevention')
    ) {
      article = knowledgeArticles.vaccine;
    }

    else if (
      text.includes('calf') ||
      text.includes('young stock')
    ) {
      article = knowledgeArticles.calf;
    }

    else if (
      text.includes('animal health') ||
      text.includes('disease')
    ) {
      article = knowledgeArticles.health;
    }

    else if (
      text.includes('feed') ||
      text.includes('nutrition')
    ) {
      article = knowledgeArticles.feed;
    }

    else if (
      text.includes('breed')
    ) {
      article = knowledgeArticles.breeds;
    }

    else if (
      text.includes('farm management')
    ) {
      article = knowledgeArticles.farm;
    }

    if (!article) return;

    card.style.cursor = 'pointer';

    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.addEventListener('click', () => {
      openKnowledgeArticle(article);
    });

    card.addEventListener('keydown', event => {

      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        openKnowledgeArticle(article);
      }

    });

  });

}

setupKnowledgeCards();


// Disease search index (shared data array).
// The disease cards moved from the homepage into the 6 category
// pages, so search can no longer read them from the DOM.
// Keep this in sync with the published disease pages.
const VETCARE_DISEASE_INDEX = [
  { name: "Foot & Mouth Disease", urdu: "منہ کھر • FMD", href: "./foot-and-mouth-disease-fmd.html", kw: "FMD foot mouth" },
  { name: "Mastitis in Cattle", urdu: "تھنوں کی سوزش", href: "./mastitis-in-cattle.html", kw: "udder" },
  { name: "Artificial Insemination (AI)", urdu: "مصنوعی نسل کشی • AI", href: "./artificial-insemination-ai-cattle.html", kw: "AI artificial insemination semen breeding heat theriogenology" },
  { name: "Breeding Management & Selection", urdu: "افزائش نسل کا انتظام", href: "./breeding-management-selection-cattle.html", kw: "breeding selection bull pedigree inbreeding" },
  { name: "Genetic Improvement & Breeds", urdu: "نسل کی بہتری", href: "./genetic-improvement-livestock-breeds.html", kw: "genetics crossbreeding Sahiwal Holstein breed improvement" },
  { name: "Pregnancy Diagnosis & Ultrasound", urdu: "حمل کی تشخیص", href: "./pregnancy-diagnosis-ultrasound-cattle.html", kw: "pregnancy diagnosis ultrasound palpation fetus" },
  { name: "Reproductive Physiology & Hormones", urdu: "ہارمونل ہم آہنگی", href: "./reproductive-physiology-hormonal-synchronization.html", kw: "estrous cycle hormones synchronization FTAI ovulation" },
  { name: "Advanced Reproductive Technologies", urdu: "جدید تولیدی ٹیکنالوجی", href: "./advanced-reproductive-technologies-art.html", kw: "ART embryo transfer IVF OPU sexed semen cloning" },
  { name: "Infertility & Reproductive Disorders", urdu: "بانجھ پن اور علاج", href: "./infertility-reproductive-disorders-treatment.html", kw: "infertility anestrus repeat breeding ovarian cyst endometritis" },
  { name: "Obstetrics, Dystocia & Neonatal Care", urdu: "زچگی اور بچے کی دیکھ بھال", href: "./obstetrics-dystocia-neonatal-care.html", kw: "obstetrics dystocia calving cesarean newborn calf colostrum" },
  { name: "Genomics & Precision Breeding", urdu: "جینومکس اور درست افزائش", href: "./genomics-genetic-evaluation-precision-breeding.html", kw: "genomics DNA EBV GEBV genetic testing" },
  { name: "Sustainable Breeding for the Future", urdu: "پائیدار افزائش نسل", href: "./sustainable-livestock-breeding-future.html", kw: "sustainable breeding climate resilient feed efficiency" },
  { name: "Theriogenology Learning Series", urdu: "تھیریوجینالوجی • تولید", href: "./theriogenology.html", kw: "theriogenology reproduction breeding series" },
  { name: "Surgical Management in Cattle", urdu: "جانوروں کی سرجری", href: "./surgical-management-cattle.html", kw: "surgery surgical procedures operation" },
  { name: "Tail Docking in Cattle", urdu: "دم کاٹنا", href: "./tail-docking-cattle.html", kw: "tail docking amputation" },
  { name: "Disbudding and Dehorning", urdu: "سینگ کاٹنا", href: "./disbudding-dehorning-cattle.html", kw: "disbudding dehorning horns" },
  { name: "Hernia Surgery in Cattle", urdu: "ہرنیا کا آپریشن", href: "./hernia-surgery-cattle.html", kw: "hernia umbilical inguinal abdominal" },
  { name: "Caesarean Section in Cattle", urdu: "سی سیکشن", href: "./caesarean-section-cattle.html", kw: "cesarean c-section dystocia delivery" },
  { name: "Rumenotomy in Cattle", urdu: "رومن کا آپریشن", href: "./rumenotomy-cattle.html", kw: "rumenotomy rumen foreign body impaction" },
  { name: "Laparotomy in Cattle", urdu: "پیٹ کا آپریشن", href: "./laparotomy-cattle.html", kw: "laparotomy abdomen exploration" },
  { name: "Urethrotomy & Urolithiasis Surgery", urdu: "پیشاب کی نالی کا آپریشن", href: "./urethrotomy-urolithiasis-cattle.html", kw: "urethrotomy urolithiasis urinary obstruction stones" },
  { name: "Castration in Cattle", urdu: "خصی کرنا", href: "./castration-cattle.html", kw: "castration burdizzo elastrator steer" },
  { name: "Ovariectomy in Cattle", urdu: "بیضہ دانی کا آپریشن", href: "./ovariectomy-reproductive-surgery-cattle.html", kw: "ovariectomy ovary reproductive surgery" },
  { name: "LDA & RDA Surgery in Cattle", urdu: "معدے کا آپریشن", href: "./lda-rda-surgery-cattle.html", kw: "LDA RDA displaced abomasum omentopexy abomasopexy" },
  { name: "Digit Amputation in Cattle", urdu: "انگلی / کھر کاٹنا", href: "./digit-amputation-cattle.html", kw: "digit amputation claw hoof" },
  { name: "Teat and Udder Surgery", urdu: "تھن اور حیوانے کا آپریشن", href: "./teat-udder-surgery-cattle.html", kw: "teat udder surgery fistula" },
  { name: "Enucleation in Cattle", urdu: "آنکھ نکالنا", href: "./enucleation-cattle.html", kw: "enucleation eye removal" },
  { name: "Wound Management & Suturing", urdu: "زخم اور ٹانکے", href: "./wound-management-suturing-cattle.html", kw: "wound suturing suture laceration" },
  { name: "Rectal Prolapse in Cattle", urdu: "مقعد باہر آنا", href: "./rectal-prolapse-surgery-cattle.html", kw: "rectal prolapse" },
  { name: "Vaginal & Uterine Prolapse Repair", urdu: "بچہ دانی باہر آنا", href: "./vaginal-uterine-prolapse-repair-cattle.html", kw: "vaginal uterine prolapse repair" },
  { name: "Fracture Management in Cattle", urdu: "ہڈی ٹوٹنے کا علاج", href: "./fracture-management-cattle.html", kw: "fracture broken leg cast splint fixation" },
  { name: "Surgical Drainage of Abscesses", urdu: "پھوڑا نکالنا", href: "./abscess-drainage-cattle.html", kw: "abscess drainage lancing" },
  { name: "C-Section Complications & Uterine Repair", urdu: "سی سیکشن کی پیچیدگیاں", href: "./caesarean-complications-uterine-repair-cattle.html", kw: "cesarean complications uterine repair adhesions" },
  { name: "Penile Injury Surgery in Bulls", urdu: "سانڈھ کے عضو کا آپریشن", href: "./penile-injury-surgery-cattle.html", kw: "penile injury bull penis haematoma" },
  { name: "Silage: Formulation & Feeding", urdu: "سائیلج بنانا اور کھلانا", href: "./silage-formulation-preparation-nutrition.html", kw: "silage maize fodder fermentation TMR nutrition" },
  { name: "Nutrition & Feeding Guides", urdu: "خوراک اور تغذیہ", href: "./nutrition-feeding.html", kw: "nutrition feeding silage category" },
  { name: "TMR Formulation for Dairy Cattle", urdu: "ٹی ایم آر بنانا", href: "./tmr-formulation-dairy-cattle.html", kw: "TMR total mixed ration formulation mixing dairy" },
  { name: "Dairy Cattle Feeding & Nutrition", urdu: "ڈیری گائے کی خوراک", href: "./dairy-cattle-feeding.html", kw: "dairy feeding nutrition lactation dry cow BCS" },
  { name: "Mineral Nutrition in Cattle", urdu: "معدنی خوراک", href: "./mineral-nutrition-cattle.html", kw: "minerals calcium phosphorus salt deficiency supplement" },
  { name: "Calf Feeding & Management", urdu: "بچھڑے کی خوراک", href: "./calf-feeding-management.html", kw: "calf feeding colostrum weaning starter milk" },
  { name: "Feed Quality & Preservation", urdu: "خوراک کا معیار", href: "./feed-quality-preservation.html", kw: "feed quality storage preservation hay mould" },
  { name: "Clinical Examination of Cattle", urdu: "جانور کا طبی معائنہ", href: "./clinical-examination-cattle.html", kw: "clinical examination TPR temperature pulse respiration vet check" },
  { name: "Emergency Veterinary Care", urdu: "ہنگامی طبی دیکھ بھال", href: "./emergency-veterinary-care-cattle.html", kw: "emergency first aid bloat dystocia bleeding triage" },
  { name: "Heat Detection in Cattle", urdu: "ہیٹ کی پہچان", href: "./heat-detection-cattle.html", kw: "heat detection estrus standing heat AM PM rule AI timing" },
  { name: "Ketosis in Cattle", urdu: "کیٹوسس • Free PDF Guide", href: "./ketosis-in-cattle.html", kw: "ketone BHB acetonaemia" },
  { name: "Milk Fever", urdu: "دودھ کا بخار", href: "./milk-fever-hypocalcemia.html", kw: "hypocalcemia hypocalcaemia" },
  { name: "Black Quarter (BQ)", urdu: "کالا یرقان • BQ", href: "./black-quarter-bq-cattle.html", kw: "BQ blackleg" },
  { name: "Hemorrhagic Septicemia", urdu: "گل گھوٹو • HS", href: "./hemorrhagic-septicemia-hs.html", kw: "HS haemorrhagic septicemia" },
  { name: "Lumpy Skin Disease", urdu: "لمپی اسکن • LSD", href: "./lumpy-skin-disease-lsd-cattle.html", kw: "LSD lumpy skin" },
  { name: "Theileriosis", urdu: "تھیلیریوسس", href: "./theileriosis-cattle.html", kw: "theileria" },
  { name: "Brucellosis", urdu: "بروسیلوسس", href: "./brucellosis-cattle.html", kw: "brucella contagious abortion" },
  { name: "Ruminal Bloat", urdu: "پیٹ پھولنا • Bloat", href: "./ruminal-bloat-cattle.html", kw: "bloat tympany" },
  { name: "Bovine Anaplasmosis", urdu: "اناپلاسموسس", href: "./bovine-anaplasmosis.html", kw: "anaplasma" },
  { name: "Bovine Babesiosis", urdu: "بیبیسیوسس", href: "./bovine-babesiosis.html", kw: "babesia redwater tick fever" },
  { name: "Bovine Tuberculosis", urdu: "ٹی بی • تپ دق", href: "./bovine-tuberculosis.html", kw: "TB bTB tuberculosis" },
  { name: "Bovine Viral Diarrhea (BVD)", urdu: "بی وی ڈی", href: "./bovine-viral-diarrhea.html", kw: "BVD viral diarrhoea" },
  { name: "Calf Diarrhea (Scours)", urdu: "بچھڑوں کے دست", href: "./calf-diarrhea.html", kw: "scours calf diarrhoea" },
  { name: "Pneumonia in Calves", urdu: "بچھڑوں کا نمونیا", href: "./calf-pneumonia.html", kw: "calf pneumonia BRD" },
  { name: "Coccidiosis in Calves", urdu: "کوکسیڈیوسس", href: "./coccidiosis-calves.html", kw: "coccidia" },
  { name: "Downer Cow Syndrome", urdu: "گری ہوئی گائے", href: "./downer-cow-syndrome.html", kw: "downer recumbent" },
  { name: "Foot Rot in Cattle", urdu: "کھروں کی سوزش", href: "./foot-rot-cattle.html", kw: "footrot" },
  { name: "Gastrointestinal Worms", urdu: "پیٹ کے کیڑے", href: "./gastrointestinal-worms-cattle.html", kw: "worms helminth parasites" },
  { name: "IBR in Cattle", urdu: "آئی بی آر", href: "./infectious-bovine-rhinotracheitis.html", kw: "IBR rhinotracheitis" },
  { name: "Liver Fluke in Cattle", urdu: "جگر کا کیڑا", href: "./liver-fluke-cattle.html", kw: "fluke fasciola" },
  { name: "Subclinical Mastitis", urdu: "خفیہ تھنوں کی سوزش", href: "./mastitis-subclinical-cattle.html", kw: "subclinical mastitis udder" },
  { name: "Postpartum Metritis", urdu: "بچہ دانی کی سوزش", href: "./metritis-postpartum-cows.html", kw: "metritis uterus" },
  { name: "Pinkeye in Cattle", urdu: "آنکھ کا انفیکشن", href: "./pinkeye-cattle.html", kw: "pinkeye keratoconjunctivitis" },
  { name: "Retained Fetal Membranes", urdu: "جیر کا رکنا", href: "./retained-fetal-membranes.html", kw: "retained placenta RFM" },
  { name: "PPR in Goats", urdu: "بکریوں کا طاعون • PPR", href: "./ppr-goats.html", kw: "PPR peste petits ruminants goat plague" },
  { name: "Goat Pox", urdu: "بکریوں کی چیچک", href: "./goat-pox.html", kw: "pox" },
  { name: "CCPP in Goats", urdu: "بکریوں کا نمونیا • CCPP", href: "./ccpp-goats.html", kw: "CCPP pleuropneumonia" },
  { name: "Enterotoxaemia", urdu: "انٹروٹاکسیمیا", href: "./enterotoxaemia-goats.html", kw: "pulpy kidney" },
  { name: "Orf in Goats", urdu: "منہ کے چھالے • Orf", href: "./orf-goats.html", kw: "orf ecthyma sore mouth" },
  { name: "Caseous Lymphadenitis", urdu: "گلٹیوں کی بیماری • CL", href: "./caseous-lymphadenitis-goats.html", kw: "CL CLA abscess" },
  { name: "Haemonchosis", urdu: "پیٹ کے کیڑے", href: "./haemonchosis-goats.html", kw: "barber pole worm haemonchus" },
  { name: "Johne's Disease", urdu: "دائمی اسہال", href: "./johnes-disease-goats.html", kw: "johnes paratuberculosis" },
  { name: "Blue Tongue", urdu: "نیلی زبان", href: "./blue-tongue-goats.html", kw: "bluetongue" },
  { name: "Tetanus (Lockjaw)", urdu: "تشنج", href: "./tetanus-goats.html", kw: "tetanus lockjaw" },
  { name: "Online Veterinary Consultation", urdu: "آن لائن مشاورت", href: "./online-consultation.html", kw: "consultation online vet advice WhatsApp fee appointment" },
];


// 11. KNOWLEDGE CENTRE SEARCH
// ------------------------------------------------------

function setupKnowledgeSearch() {

  const searchInput =
    document.getElementById('knowledgeSearch');

  const message =
    document.getElementById('knowledgeSearchMessage');

  const section =
    document.getElementById('knowledge');

  if (!searchInput || !section) return;

  const cards = [
    ...section.querySelectorAll('.knowledge-card')
  ];

  const resultsBox =
    document.getElementById('knowledgeDiseaseResults');

  // Disease index comes from the shared VETCARE_DISEASE_INDEX array
  // (the disease cards moved to the category pages). Falls back to the
  // DOM only if the array is unavailable.
  function diseaseIndex() {
    if (typeof VETCARE_DISEASE_INDEX !== 'undefined' && VETCARE_DISEASE_INDEX) {
      return VETCARE_DISEASE_INDEX;
    }
    return [...document.querySelectorAll('.vc-disease-link')].map(a => ({
      name: a.querySelector('strong')?.textContent || '',
      urdu: a.querySelector('small')?.textContent || '',
      href: a.getAttribute('href') || '#',
      kw: ''
    }));
  }

  // Plural-tolerant match: "calf" also finds "calves", "cow" finds "cows".
  function norm(s) {
    return (s || '').toLowerCase().replace(/\b(\w+)ves\b/g, '$1f').replace(/\b(\w+)s\b/g, '$1');
  }

  function renderContentResults(query) {
    if (!resultsBox) return 0;
    resultsBox.replaceChildren();
    if (!query) { resultsBox.hidden = true; return 0; }
    const nq = norm(query);
    const diseases = diseaseIndex().filter(d =>
      norm(d.name + ' ' + d.urdu + ' ' + (d.kw || '')).includes(nq));
    const libraryItems = (typeof cachedLibraryItems !== 'undefined' ? cachedLibraryItems : [])
      .filter(item => norm(`${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.file_name || ''}`).includes(nq));
    const total = diseases.length + libraryItems.length;
    if (!total) { resultsBox.hidden = true; return 0; }
    const heading = document.createElement('div');
    heading.className = 'vc-search-results-title';
    heading.textContent = 'Diseases & files found';
    resultsBox.appendChild(heading);
    diseases.forEach(d => {
      const row = document.createElement('a');
      row.className = 'vc-search-result';
      row.href = d.href;
      const text = document.createElement('div');
      const name = document.createElement('b'); name.textContent = d.name;
      const ur = document.createElement('small'); ur.textContent = '\u{1FA7A} Disease' + (d.urdu ? ' \u2022 ' + d.urdu : '');
      text.append(name, ur);
      const go = document.createElement('span'); go.textContent = 'Read \u2192';
      row.append(text, go);
      resultsBox.appendChild(row);
    });
    libraryItems.forEach(item => {
      const row = document.createElement('a');
      row.className = 'vc-search-result';
      row.href = item.public_url;
      row.target = '_blank'; row.rel = 'noopener';
      const text = document.createElement('div');
      const name = document.createElement('b'); name.textContent = item.title || item.file_name || 'Library file';
      const ur = document.createElement('small'); ur.textContent = '\u{1F4DA} Library' + (item.category ? ' \u2022 ' + item.category : '');
      text.append(name, ur);
      const go = document.createElement('span'); go.textContent = 'View \u2192';
      row.append(text, go);
      resultsBox.appendChild(row);
    });
    resultsBox.hidden = false;
    return total;
  }

  searchInput.addEventListener('input', function () {

    const query = this.value.trim().toLowerCase();

    let count = 0;

    cards.forEach(card => {

      const searchableText =
        card.textContent.toLowerCase();

      const matches =
        !query || searchableText.includes(query);

      card.style.display = matches ? '' : 'none';

      if (matches) count++;

    });

    const contentCount = renderContentResults(query);

    if (!message) return;

    if (!query) {

      message.textContent =
        'Search the Knowledge Centre';

    } else if (contentCount > 0 || count > 0) {

      message.textContent =
        contentCount + ' disease(s) / file(s) found \u2022 ' + count + ' categories found';

    } else {

      message.textContent =
        'No matching disease, file or category found / کوئی متعلقہ بیماری، فائل یا موضوع نہیں ملا';

    }

  });

}

setupKnowledgeSearch();


// 12. SIGN UP
// ------------------------------------------------------

signupBtn?.addEventListener('click', async event => {

  event.preventDefault();

  if (!(await ensureDatabaseConnection())) {
    showAuthMessage('Database service is not reachable. Check your internet, then use Retry connection.', true);
    showDatabaseRetry();
    return;
  }

  const email = emailInput?.value.trim();

  const password = passwordInput?.value || '';

  if (!email || !password) {

    showAuthMessage(
      'Please enter your email and password.',
      true
    );

    return;
  }

  if (password.length < 8) {

    showAuthMessage(
      'Password must contain at least 8 characters.',
      true
    );

    return;
  }

  signupBtn.disabled = true;

  showAuthMessage('Creating your account...');

  try {

    const { data, error } = await db.auth.signUp({

      email,
      password,

      options: {
        emailRedirectTo: APP_REDIRECT_URL
      }

    });

    if (error) throw error;

    if (data.session) {

      updateAuthDisplay(data.user);

      closeVetCareLogin();

      showAuthMessage(
        'Account created successfully. Welcome to VetCare World!'
      );

    } else {

      showAuthMessage(
        'Account created. Please check your email to confirm your account.'
      );

    }

  } catch (error) {

    console.error('Signup error:', error);

    showAuthMessage(
      'Signup failed: ' + error.message,
      true
    );

  } finally {

    signupBtn.disabled = false;

  }

});


// 13. LOGIN
// ------------------------------------------------------

loginBtn?.addEventListener('click', async event => {

  event.preventDefault();

  if (!(await ensureDatabaseConnection())) {
    showAuthMessage('Database service is not reachable. Check your internet, then use Retry connection.', true);
    showDatabaseRetry();
    return;
  }

  const email = emailInput?.value.trim();

  const password = passwordInput?.value || '';

  if (!email || !password) {

    showAuthMessage(
      'Please enter your email and password.',
      true
    );

    return;
  }

  loginBtn.disabled = true;

  showAuthMessage('Logging in...');

  try {

    const { data, error } = await db.auth.signInWithPassword({

      email,
      password

    });

    if (error) throw error;

    updateAuthDisplay(data.user);

    closeVetCareLogin();

    showAuthMessage('Login successful. Welcome!');

  } catch (error) {

    console.error('Login error:', error);


    showAuthMessage('Login failed: ' + error.message, true);

  } finally {
    loginBtn.disabled = false;
  }
});


// 14. ADMIN ACCESS — VERIFIED FROM SUPABASE, NEVER FROM LOGIN ALONE
let isVetCareAdmin = false;
let adminCheckToken = 0;

function setElementHidden(element, hidden) {
  if (!element) return;
  element.hidden = hidden;
  element.style.display = hidden ? 'none' : '';
}

function getAdminNavElements() {
  return [
    ...document.querySelectorAll(
      '[data-target="admin"], #adminNav, #adminNavBtn, .admin-nav'
    )
  ];
}

function hideAdminInterface() {
  getAdminNavElements().forEach(el => setElementHidden(el, true));
}

function showAdminInterface() {
  getAdminNavElements().forEach(el => setElementHidden(el, false));
}

// Phase 4 — ADMIN-ONLY UPLOADS: only authorized administrators can
// upload resources. The Library-page upload button and form are hidden
// from everyone else (the submit handler also refuses non-admins).
function updateMemberUploadVisibility() {
  const btn = document.getElementById('memberUploadBtn');
  const row = btn ? btn.closest('.vc-lib-upload-row') : document.querySelector('.vc-lib-upload-row');
  const box = document.getElementById('memberUploadBox');
  const show = !!isVetCareAdmin;
  setElementHidden(btn, !show);
  setElementHidden(row, !show);
  if (box && !show) box.classList.add('hidden');
}

async function refreshAdminAccess(user) {
  createCommunityAdminPage();
  const token = ++adminCheckToken;
  isVetCareAdmin = false;
  hideAdminInterface();
  updateMemberUploadVisibility();

  if (!user || !db) {
    if (document.getElementById('admin') &&
        !document.getElementById('admin').classList.contains('hidden')) {
      showPage('home');
    }
    return false;
  }

  try {
    const { data, error } = await db
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // Ignore a late response belonging to an earlier login session.
    if (token !== adminCheckToken || !currentUser ||
        currentUser.id !== user.id) return false;

    if (error) {
      console.warn('Admin role check:', error.message);
      return false;
    }

    isVetCareAdmin = data?.role === 'admin';
    updateMemberUploadVisibility();

    if (isVetCareAdmin) {
      showAdminInterface();
      await loadAdminResources();
      setElementHidden(document.querySelector('[data-target="admin"]'), false);
      await loadCommunityModeration();
    } else if (document.getElementById('admin') &&
               !document.getElementById('admin').classList.contains('hidden')) {
      showPage('home');
    }
    return isVetCareAdmin;
  } catch (error) {
    console.error('Admin verification failed:', error);
    if (token === adminCheckToken) isVetCareAdmin = false;
    hideAdminInterface();
    updateMemberUploadVisibility();
    return false;
  }
}


// 15. PAGE NAVIGATION GUARD
const originalShowPage = showPage;
showPage = function(pageId) {
  if (pageId === 'admin' && (!currentUser || !isVetCareAdmin)) {
    showAuthMessage(
      currentUser
        ? 'Admin access is restricted to authorized administrators.'
        : 'Please log in to continue.',
      true
    );
    if (!currentUser) openVetCareLogin();
    return;
  }
  originalShowPage(pageId);
};


// 16. POSTS / COMMUNITY FEED — PUBLIC READ, MEMBER PARTICIPATION
const feedElement = document.getElementById('feed') ||
  document.getElementById('postsFeed') ||
  document.getElementById('communityFeed') ||
  document.getElementById('postsList');

function makeButton(label, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className || '';
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

// 16a. PHASE 3 — COMMUNITY GROUPS + PROFILES + ASK THE VET UPGRADE
// (23 Nov 2026). Everything in this section is behind VETCARE_FEATURES
// flags, detected once at startup by detectPhase3Features() against the
// Phase 3 database schema (supabase-phase3-community.sql). Until that SQL
// has been run in the Supabase dashboard, every flag stays false and the
// site behaves exactly as before: same queries, same inserts, and the new
// UI (group chips, group select, name prompt, photo input) stays hidden.
// No user content is ever rendered with innerHTML here — textContent only,
// and email addresses are never shown.
const VETCARE_FEATURES = { groups: false, profiles: false, askvetApproval: false, askvetPhoto: false, marketplace: false };
const GROUPS = {
  general: { emoji: '💬', label: 'General' },
  dairy: { emoji: '🥛', label: 'Dairy Farming' },
  'cattle-breeders': { emoji: '🐄', label: 'Cattle Breeders' },
  buffalo: { emoji: '🐃', label: 'Buffalo Farming' },
  'goat-sheep': { emoji: '🐐', label: 'Goat & Sheep' },
  poultry: { emoji: '🐓', label: 'Poultry' },
  vets: { emoji: '🩺', label: 'Veterinarians' },
  'vet-students': { emoji: '🎓', label: 'Vet Students' },
  traders: { emoji: '🤝', label: 'Livestock Traders' }
};
const GROUP_ORDER = ['general', 'dairy', 'cattle-breeders', 'buffalo', 'goat-sheep', 'poultry', 'vets', 'vet-students', 'traders'];
const HOME_GROUP_KEY = 'vc_home_group';
let activeGroupFilter = 'all';
// user_id -> display name (null = looked up, no profile row exists).
const profileNameCache = new Map();
let profilePanelEl = null;

function groupLabelFor(slug) {
  return (GROUPS[slug] || GROUPS.general).label;
}

function groupTagFor(slug) {
  const group = GROUPS[slug] || GROUPS.general;
  const tag = document.createElement('span');
  tag.className = 'vc-group-tag';
  tag.textContent = `${group.emoji} ${group.label}`;
  return tag;
}

function pendingBadge() {
  const badge = document.createElement('span');
  badge.className = 'vc-pending-badge';
  badge.textContent = '⏳ Awaiting approval';
  return badge;
}

function displayNameFor(userId) {
  if (!VETCARE_FEATURES.profiles) return 'VetCare World Member';
  return profileNameCache.get(userId) || 'VetCare World Member';
}

// One batched lookup for all author ids in a list; ids with no profile
// row are remembered as null so they are not re-queried on every render.
async function fetchProfileNames(userIds) {
  if (!VETCARE_FEATURES.profiles || !db) return;
  const missing = [...new Set(userIds || [])].filter(id => id && !profileNameCache.has(id));
  if (!missing.length) return;
  try {
    const { data, error } = await db.from('profiles').select('user_id,display_name').in('user_id', missing);
    if (error) { console.warn('Profile names could not be loaded:', error.message); return; }
    (data || []).forEach(row => { if (row.user_id) profileNameCache.set(row.user_id, row.display_name); });
    missing.forEach(id => { if (!profileNameCache.has(id)) profileNameCache.set(id, null); });
  } catch (error) {
    console.warn('Profile names could not be loaded:', error.message);
  }
}

// Probe the Phase 3 schema. Any failure (columns/table missing, or the
// database unreachable) leaves the flags false — the site keeps working
// with the pre-Phase 3 behaviour. Called once in init, before loadPosts().
async function detectPhase3Features() {
  if (!db) return;
  try {
    const { error } = await db.from('posts').select('id,group_slug,image_url,status').limit(1);
    if (!error) {
      VETCARE_FEATURES.groups = true;
      VETCARE_FEATURES.askvetApproval = true;
      VETCARE_FEATURES.askvetPhoto = true;
    }
  } catch (error) {
    console.warn('Phase 3 posts columns not available:', error.message);
  }
  try {
    const { error } = await db.from('profiles').select('user_id').limit(1);
    if (!error) VETCARE_FEATURES.profiles = true;
  } catch (error) {
    console.warn('Phase 3 profiles table not available:', error.message);
  }
  applyPhase3Visibility();
}

// Show/hide the Phase 3 UI from the detected flags. Idempotent: safe to
// run again after a reconnect.
function applyPhase3Visibility() {
  const chips = document.getElementById('groupChips');
  if (chips) chips.hidden = !VETCARE_FEATURES.groups;
  const groupRow = document.getElementById('postGroupRow');
  if (groupRow) groupRow.hidden = !VETCARE_FEATURES.groups;
  const photoRow = document.getElementById('askVetPhotoRow');
  if (photoRow) photoRow.hidden = !VETCARE_FEATURES.askvetPhoto;
  if (VETCARE_FEATURES.groups) {
    renderGroupChips();
    populatePostGroupSelect();
    updateJoinButtons();
  }
}

function renderGroupChips() {
  const box = document.getElementById('groupChips');
  if (!box) return;
  box.replaceChildren();
  const makeChip = (filter, label) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'vc-group-chip' + (activeGroupFilter === filter ? ' active' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => setGroupFilter(filter));
    return chip;
  };
  box.appendChild(makeChip('all', '🌍 All'));
  GROUP_ORDER.forEach(slug => {
    box.appendChild(makeChip(slug, `${GROUPS[slug].emoji} ${GROUPS[slug].label}`));
  });
}

function setGroupFilter(filter) {
  activeGroupFilter = (filter === 'all' || GROUPS[filter]) ? filter : 'all';
  renderGroupChips();
  loadPosts();
}

function homeGroupSlug() {
  try {
    const saved = localStorage.getItem(HOME_GROUP_KEY);
    return saved && GROUPS[saved] ? saved : null;
  } catch (e) {
    return null;
  }
}

function populatePostGroupSelect() {
  const select = document.getElementById('postGroup');
  if (!select) return;
  select.replaceChildren();
  GROUP_ORDER.forEach(slug => {
    const option = document.createElement('option');
    option.value = slug;
    option.textContent = `${GROUPS[slug].emoji} ${GROUPS[slug].label}`;
    select.appendChild(option);
  });
  select.value = homeGroupSlug() || 'general';
}

function updateJoinButtons() {
  const home = homeGroupSlug();
  document.querySelectorAll('.vc-join-btn').forEach(button => {
    const isHome = !!home && button.dataset.join === home;
    button.classList.toggle('joined', isHome);
    button.textContent = isHome ? '✓ Joined — your home group' : 'Join Community';
  });
}

// "Join Community" buttons on the Groups page. Before the Phase 3 database
// update they stay exactly as today (no handler effect). After it, joining
// saves the group as the member's home group (this browser only), filters
// the feed to it and opens the feed.
document.querySelectorAll('.vc-join-btn').forEach(button => {
  button.addEventListener('click', () => {
    if (!VETCARE_FEATURES.groups) return;
    const slug = button.dataset.join;
    if (!GROUPS[slug]) return;
    if (!currentUser) { showAuthMessage('Please log in to join a community.', true); openVetCareLogin(); return; }
    try { localStorage.setItem(HOME_GROUP_KEY, slug); } catch (e) { /* private mode: join still works for this visit */ }
    const select = document.getElementById('postGroup');
    if (select) select.value = slug;
    updateJoinButtons();
    setGroupFilter(slug);
    showPage('home');
    feedElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showAuthMessage(`You joined ${GROUPS[slug].label}. Your posts will go to this group.`);
  });
});

// "Open discussions →" buttons: the existing data-target="home" handler
// navigates home; this handler (attached after it) sets the feed filter.
document.querySelectorAll('.vc-group-open').forEach(button => {
  button.addEventListener('click', () => {
    if (!VETCARE_FEATURES.groups) return;
    const slug = button.closest('.vc-group-card')?.dataset.group;
    if (!GROUPS[slug]) return;
    setGroupFilter(slug);
    feedElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Display-name prompt (community composer) + own-profile editing share
// this save. Returns true on success.
async function saveDisplayName(name) {
  if (!currentUser || !db || !VETCARE_FEATURES.profiles) return false;
  const clean = (name || '').trim();
  if (clean.length < 1 || clean.length > 60) {
    showAuthMessage('Please enter a display name (1–60 characters).', true);
    return false;
  }
  const { error } = await db.from('profiles').upsert(
    { user_id: currentUser.id, display_name: clean },
    { onConflict: 'user_id' }
  );
  if (error) { showAuthMessage('Could not save your name: ' + error.message, true); return false; }
  profileNameCache.set(currentUser.id, clean);
  showAuthMessage('Your display name was saved.');
  return true;
}

// Show the name prompt only for a signed-in member with no profile row.
async function maybeShowNamePrompt() {
  const row = document.getElementById('namePromptRow');
  if (!row) return;
  if (!currentUser || !db || !VETCARE_FEATURES.profiles) { row.hidden = true; return; }
  try {
    const { data, error } = await db.from('profiles').select('user_id').eq('user_id', currentUser.id).maybeSingle();
    row.hidden = !!error || !!data;
  } catch (error) {
    row.hidden = true;
  }
}

document.getElementById('saveDisplayNameBtn')?.addEventListener('click', async () => {
  const input = document.getElementById('displayNameInput');
  const saved = await saveDisplayName(input?.value);
  if (!saved) return;
  const row = document.getElementById('namePromptRow');
  if (row) row.hidden = true;
  await loadPosts();
  await loadAskVetQuestions();
});

// Member profile panel: a div above the feed on the home page. Shows the
// display name (never an email address), the member's posts, and — on your
// own profile — a way to change your display name. All content is set
// with textContent only.
function getProfilePanel() {
  if (profilePanelEl) return profilePanelEl;
  const panel = document.createElement('div');
  panel.id = 'profilePanel';
  panel.className = 'vc-profile-panel';
  panel.hidden = true;
  if (feedElement?.parentNode) feedElement.parentNode.insertBefore(panel, feedElement);
  profilePanelEl = panel;
  return panel;
}

async function openProfilePanel(userId) {
  if (!VETCARE_FEATURES.profiles || !db || !userId) return;
  const homePage = document.getElementById('home');
  if (homePage?.classList.contains('hidden')) showPage('home');
  const panel = getProfilePanel();
  panel.hidden = false;
  panel.replaceChildren();
  const back = makeButton('← Back to feed', 'vc-profile-back', () => {
    panel.hidden = true;
    feedElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  await fetchProfileNames([userId]);
  const nameEl = document.createElement('h3');
  nameEl.textContent = displayNameFor(userId);
  const role = document.createElement('p');
  role.className = 'muted';
  role.textContent = 'VetCare World Member';
  panel.append(back, nameEl, role);
  if (currentUser?.id === userId) {
    const editRow = document.createElement('div');
    editRow.className = 'vc-name-prompt';
    const label = document.createElement('span');
    label.textContent = 'Your display name:';
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 60;
    input.value = profileNameCache.get(userId) || '';
    input.setAttribute('aria-label', 'Your display name');
    const save = makeButton('Save', '', async () => {
      if (await saveDisplayName(input.value)) {
        nameEl.textContent = displayNameFor(userId);
        await loadPosts();
      }
    });
    editRow.append(label, input, save);
    panel.appendChild(editRow);
  }
  const listTitle = document.createElement('h4');
  listTitle.textContent = 'Posts';
  panel.appendChild(listTitle);
  const list = document.createElement('div');
  list.className = 'vc-profile-posts';
  panel.appendChild(list);
  // Row Level Security decides what comes back: the public sees approved
  // posts only; you also see your own pending posts (shown with a badge).
  const selectCols = VETCARE_FEATURES.groups
    ? 'id,content,created_at,group_slug,status'
    : 'id,content,created_at';
  const { data, error } = await db.from('posts')
    .select(selectCols)
    .eq('user_id', userId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false }).limit(50);
  if (error) { list.textContent = 'Posts could not be loaded.'; return; }
  if (!data?.length) { list.textContent = 'No posts yet.'; return; }
  data.forEach(post => {
    const item = document.createElement('div');
    item.className = 'vc-profile-post';
    const meta = document.createElement('small');
    meta.textContent = post.created_at ? new Date(post.created_at).toLocaleString() : '';
    const text = document.createElement('p');
    text.textContent = post.content || '';
    item.append(meta, text);
    if (VETCARE_FEATURES.groups) item.appendChild(groupTagFor(post.group_slug));
    if (VETCARE_FEATURES.askvetApproval && post.status === 'pending') item.appendChild(pendingBadge());
    list.appendChild(item);
  });
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Admin queue for Ask the Vet approval. Listed by loadCommunityModeration();
// the section itself is part of the Admin Panel template below.
async function loadAskVetQueue() {
  const box = document.getElementById('adminAskVetQueue');
  if (!box || !isVetCareAdmin || !db) return;
  if (!VETCARE_FEATURES.askvetApproval) {
    box.textContent = 'Approval queue appears after the Phase 3 database update is run.';
    return;
  }
  const { data, error } = await db.from('posts')
    .select('id,user_id,content,created_at,image_url,status')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(50);
  box.replaceChildren();
  if (error) { box.textContent = 'Queue could not be loaded: ' + error.message; return; }
  const questions = (data || []).filter(post => (post.content || '').startsWith(ASK_VET_PREFIX) && post.status !== 'rejected');
  if (!questions.length) { box.textContent = 'No questions awaiting approval.'; return; }
  await fetchProfileNames(questions.map(q => q.user_id));
  questions.forEach(post => {
    const row = document.createElement('div');
    row.className = 'admin-resource-row vc-askvet-queue-row';
    const text = document.createElement('div');
    text.className = 'vc-askvet-queue-text';
    const question = document.createElement('p');
    question.textContent = (post.content || '').slice(ASK_VET_PREFIX.length);
    const meta = document.createElement('small');
    meta.textContent = `${displayNameFor(post.user_id)} — ${post.created_at ? new Date(post.created_at).toLocaleString() : ''}`;
    text.append(question, meta);
    if (post.image_url) {
      const thumb = document.createElement('img');
      thumb.className = 'vc-askvet-thumb';
      thumb.src = post.image_url;
      thumb.alt = 'Photo attached to this question';
      thumb.loading = 'lazy';
      text.appendChild(thumb);
    }
    const decide = async nextStatus => {
      const { error: updateError } = await db.from('posts').update({ status: nextStatus }).eq('id', post.id);
      if (updateError) showAuthMessage('Could not update the question: ' + updateError.message, true);
      else { await loadAskVetQueue(); await loadAskVetQuestions(); }
    };
    const approve = makeButton('Approve', '', () => decide('approved'));
    const reject = makeButton('Reject', '', () => {
      if (confirm('Reject this question? It will not be shown to anyone.')) decide('rejected');
    });
    row.append(text, approve, reject);
    box.appendChild(row);
  });
}

async function loadPosts() {
  if (!feedElement) return;
  // Final Audit M3: when the database is unreachable, say so instead of
  // leaving the community feed blank (mirrors the library fallback message).
  if (!db) {
    feedElement.textContent = 'Community posts are unavailable right now. Check your connection and retry.';
    return;
  }
  // Phase 3: group/status columns are selected only when the Phase 3
  // database update has been detected; otherwise the query is exactly
  // the pre-Phase 3 one.
  const selectCols = VETCARE_FEATURES.groups
    ? 'id,user_id,content,created_at,is_hidden,group_slug,status'
    : 'id,user_id,content,created_at,is_hidden';
  let query = db.from('posts').select(selectCols).eq('is_hidden', false);
  if (VETCARE_FEATURES.groups) {
    if (activeGroupFilter === 'general') query = query.or('group_slug.is.null,group_slug.eq.general');
    else if (activeGroupFilter !== 'all') query = query.eq('group_slug', activeGroupFilter);
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
  if (error) {
    console.warn('Posts could not be loaded:', error.message);
    feedElement.textContent = 'Community posts are temporarily unavailable.';
    return;
  }
  // Phase 3: rejected Ask the Vet questions are never shown, even to
  // their author (RLS still returns the author's own rows).
  const visiblePosts = (data || []).filter(post => post.status !== 'rejected');
  feedElement.replaceChildren();
  if (!visiblePosts.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = (VETCARE_FEATURES.groups && activeGroupFilter !== 'all')
      ? `No posts in ${groupLabelFor(activeGroupFilter)} yet. Be the first to share!`
      : 'No posts yet. Be the first to share useful knowledge!';
    feedElement.appendChild(empty);
    return;
  }
  await fetchProfileNames(visiblePosts.map(post => post.user_id));
  for (const post of visiblePosts) {
    const card = document.createElement('article');
    card.className = 'post post-card';
    const head = document.createElement('div');
    head.className = 'post-head';
    const avatar = document.createElement('span');
    avatar.className = 'avatar'; avatar.textContent = '👨‍🌾';
    const identity = document.createElement('div');
    const author = document.createElement('b');
    author.textContent = displayNameFor(post.user_id);
    if (VETCARE_FEATURES.profiles) {
      author.classList.add('vc-author-link');
      author.addEventListener('click', () => openProfilePanel(post.user_id));
    }
    const date = document.createElement('small');
    date.textContent = post.created_at ? new Date(post.created_at).toLocaleString() : '';
    identity.append(author, date); head.append(avatar, identity);
    const body = document.createElement('p'); body.textContent = post.content || '';
    const actions = document.createElement('div'); actions.className = 'post-actions';
    const likeBtn = makeButton('♡ Like', 'like', () => togglePostLike(post.id, likeBtn));
    const commentBtn = makeButton('Comment', 'comment', () => toggleCommentBox(card, post.id));
    const shareBtn = makeButton('↗ Share', 'share', () => sharePost(post));
    actions.append(likeBtn, commentBtn, shareBtn);
    if (currentUser?.id === post.user_id) {
      actions.append(makeButton('Delete my post', 'delete-post', () => deleteOwnPost(post.id)));
    }
    const parts = [];
    if (VETCARE_FEATURES.groups) parts.push(groupTagFor(post.group_slug));
    if (VETCARE_FEATURES.askvetApproval && post.status === 'pending') parts.push(pendingBadge());
    parts.push(head, body, actions);
    card.append(...parts);
    const commentArea = document.createElement('div');
    commentArea.className = 'post-comments';
    commentArea.dataset.postId = post.id;
    card.appendChild(commentArea);
    feedElement.appendChild(card);
    loadPostLikeState(post.id, likeBtn);
    loadPostComments(post.id, commentArea);
  }
}

async function togglePostLike(postId, button) {
  if (!currentUser) { showAuthMessage('Like کرنے کے لیے پہلے لاگ اِن کریں۔', true); openVetCareLogin(); return; }
  const { data: existing, error: readError } = await db.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
  if (readError) { showAuthMessage(readError.message, true); return; }
  const result = existing
    ? await db.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id)
    : await db.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
  if (result.error) showAuthMessage(result.error.message, true);
  else loadPostLikeState(postId, button);
}

async function loadPostLikeState(postId, button) {
  if (!db || !button) return;
  const { data, error } = await db.from('post_likes').select('user_id').eq('post_id', postId);
  if (error) return;
  const liked = !!currentUser && (data || []).some(x => x.user_id === currentUser.id);
  button.textContent = `${liked ? '♥' : '♡'} Like (${data?.length || 0})`;
}

function toggleCommentBox(card, postId) {
  const area = card.querySelector('.post-comments');
  if (!area) return;
  area.classList.toggle('comments-open');
  if (!area.querySelector('form') && currentUser) {
    const form = document.createElement('form');
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = 1000; input.placeholder = 'Write a comment…'; input.required = true;
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Send';
    form.append(input, submit);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const { error } = await db.from('post_comments').insert({ post_id: postId, user_id: currentUser.id, content: input.value.trim() });
      if (error) showAuthMessage(error.message, true);
      else { input.value = ''; loadPostComments(postId, area); }
    });
    area.prepend(form);
  } else if (!currentUser) {
    const msg = document.createElement('p'); msg.textContent = 'Comment کرنے کے لیے لاگ اِن کریں۔'; area.prepend(msg);
  }
}

async function loadPostComments(postId, area) {
  if (!db || !area) return;
  const { data, error } = await db.from('post_comments').select('id,user_id,content,created_at').eq('post_id', postId).order('created_at', { ascending: true }).limit(30);
  if (error) return;
  await fetchProfileNames((data || []).map(comment => comment.user_id));
  area.querySelectorAll('.comment-item').forEach(x => x.remove());
  (data || []).forEach(comment => {
    const item = document.createElement('p'); item.className = 'comment-item';
    // Pre-Phase 3 the label was the plain word "Member"; with profiles it
    // is the member's display name.
    const name = VETCARE_FEATURES.profiles ? displayNameFor(comment.user_id) : 'Member';
    item.textContent = `${comment.content} — ${name}`;
    area.appendChild(item);
  });
}

async function deleteOwnPost(postId) {
  if (!currentUser || !confirm('اپنی یہ پوسٹ حذف کرنا چاہتے ہیں؟')) return;
  const { error } = await db.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id);
  if (error) showAuthMessage(error.message, true); else { showAuthMessage('Your post was deleted.'); loadPosts(); }
}

async function sharePost(post) {
  const url = `${location.origin}${location.pathname}#post-${post.id}`;
  try {
    if (navigator.share) await navigator.share({ title: 'VetCare World', text: post.content, url });
    else if (navigator.clipboard) { await navigator.clipboard.writeText(`${post.content}\n${url}`); showAuthMessage('Post link copied.'); }
    else showAuthMessage(url);
  } catch (e) { if (e.name !== 'AbortError') showAuthMessage('Sharing was not completed.', true); }
}

postBtn?.addEventListener('click', async event => {
  event.preventDefault();
  if (!currentUser) { showAuthMessage('Please log in before publishing a post.', true); openVetCareLogin(); return; }
  if (!db || isPosting) return;
  const content = postText?.value.trim();
  if (!content) { showAuthMessage('Please write something before posting.', true); return; }
  isPosting = true; postBtn.disabled = true;
  try {
    const insertData = { user_id: currentUser.id, content };
    if (VETCARE_FEATURES.groups) {
      const selectedGroup = document.getElementById('postGroup')?.value;
      insertData.group_slug = GROUPS[selectedGroup] ? selectedGroup : 'general';
    }
    const { error } = await db.from('posts').insert(insertData);
    if (error) throw error;
    if (postText) postText.value = '';
    showAuthMessage('Your post has been published.'); await loadPosts();
  } catch (error) { showAuthMessage('Post failed: ' + error.message, true); }
  finally { isPosting = false; postBtn.disabled = false; }
});

// Ask the Vet: members-only questions, stored as community posts so the vet's
// answers (comments) are visible to everyone and help other farmers too.
async function loadAskVetQuestions() {
  if (!askVetList || !db) return;
  // Phase 3: with approval active the public sees approved questions
  // only; a signed-in member also sees their own pending questions.
  // Before the Phase 3 database update the query is exactly as before.
  const selectCols = VETCARE_FEATURES.askvetApproval
    ? 'id,user_id,content,created_at,is_hidden,image_url,status'
    : 'id,user_id,content,created_at,is_hidden';
  let query = db.from('posts').select(selectCols).eq('is_hidden', false);
  if (VETCARE_FEATURES.askvetApproval) {
    if (currentUser) query = query.or(`status.eq.approved,user_id.eq.${currentUser.id}`);
    else query = query.eq('status', 'approved');
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
  if (error) {
    console.warn('Ask the Vet could not be loaded:', error.message);
    askVetList.textContent = 'Questions are temporarily unavailable.';
    return;
  }
  const questions = (data || []).filter(post => (post.content || '').startsWith(ASK_VET_PREFIX) && post.status !== 'rejected');
  askVetList.replaceChildren();
  if (!questions.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No questions yet. Log in and ask the first one!';
    askVetList.appendChild(empty);
    return;
  }
  await fetchProfileNames(questions.map(post => post.user_id));
  for (const post of questions) {
    const card = document.createElement('article');
    card.className = 'post post-card';
    const tag = document.createElement('span');
    tag.className = 'library-tag';
    tag.textContent = '❓ Question for the Vet';
    const head = document.createElement('div');
    head.className = 'post-head';
    const avatar = document.createElement('span');
    avatar.className = 'avatar'; avatar.textContent = '👨‍🌾';
    const identity = document.createElement('div');
    const author = document.createElement('b');
    author.textContent = displayNameFor(post.user_id);
    if (VETCARE_FEATURES.profiles) {
      author.classList.add('vc-author-link');
      author.addEventListener('click', () => openProfilePanel(post.user_id));
    }
    const date = document.createElement('small');
    date.textContent = post.created_at ? new Date(post.created_at).toLocaleString() : '';
    identity.append(author, date); head.append(avatar, identity);
    const body = document.createElement('p');
    body.textContent = (post.content || '').slice(ASK_VET_PREFIX.length);
    const actions = document.createElement('div'); actions.className = 'post-actions';
    const likeBtn = makeButton('♡ Like', 'like', () => togglePostLike(post.id, likeBtn));
    const commentBtn = makeButton('Answer / Comment', 'comment', () => toggleCommentBox(card, post.id));
    actions.append(likeBtn, commentBtn);
    if (currentUser?.id === post.user_id) {
      actions.append(makeButton('Delete my question', 'delete-post', () => deleteOwnPost(post.id)));
    }
    const parts = [tag];
    if (VETCARE_FEATURES.askvetApproval && post.status === 'pending') parts.push(pendingBadge());
    parts.push(head, body);
    if (VETCARE_FEATURES.askvetPhoto && post.image_url) {
      const photo = document.createElement('img');
      photo.className = 'vc-askvet-photo-img';
      photo.src = post.image_url;
      photo.alt = 'Photo attached to this question';
      photo.loading = 'lazy';
      parts.push(photo);
    }
    parts.push(actions);
    card.append(...parts);
    const commentArea = document.createElement('div');
    commentArea.className = 'post-comments';
    commentArea.dataset.postId = post.id;
    card.appendChild(commentArea);
    askVetList.appendChild(card);
    loadPostLikeState(post.id, likeBtn);
    loadPostComments(post.id, commentArea);
  }
}

askVetBtn?.addEventListener('click', async event => {
  event.preventDefault();
  if (!currentUser) { showAuthMessage('سوال پوچھنے کے لیے پہلے لاگ اِن کریں۔', true); openVetCareLogin(); return; }
  if (!db) return;
  const question = askVetText?.value.trim();
  if (!question) { showAuthMessage('Please write your question first.', true); return; }
  // Phase 3: optional photo (only when the Phase 3 database update has
  // been detected — otherwise the input stays hidden and this is skipped).
  const photoInput = document.getElementById('askVetPhoto');
  const photo = VETCARE_FEATURES.askvetPhoto ? photoInput?.files?.[0] : null;
  if (photo) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const ext = (photo.name.split('.').pop() || '').toLowerCase();
    if (!allowedTypes.includes(photo.type) && !allowedExts.includes(ext)) {
      showAuthMessage('Please choose a JPG, PNG, WebP or GIF photo.', true); return;
    }
    if (photo.size > 5 * 1024 * 1024) {
      showAuthMessage('Photo is larger than 5 MB. Please choose a smaller photo.', true); return;
    }
  }
  askVetBtn.disabled = true;
  let uploadedPath = null;
  let imageUrl = null;
  try {
    if (photo) {
      const safeName = photo.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
      uploadedPath = `askvet/${currentUser.id}/${Date.now()}-${safeName}`;
      const uploadOptions = { upsert: false, cacheControl: '3600' };
      if (photo.type) uploadOptions.contentType = photo.type;
      const { error: uploadError } = await db.storage.from(LIBRARY_BUCKET).upload(uploadedPath, photo, uploadOptions);
      if (uploadError) throw uploadError;
      const { data: publicData } = db.storage.from(LIBRARY_BUCKET).getPublicUrl(uploadedPath);
      if (!publicData?.publicUrl) throw new Error('Supabase did not return a public file URL.');
      imageUrl = publicData.publicUrl;
    }
    const insertData = { user_id: currentUser.id, content: ASK_VET_PREFIX + question };
    if (VETCARE_FEATURES.askvetPhoto && imageUrl) insertData.image_url = imageUrl;
    if (VETCARE_FEATURES.askvetApproval) insertData.status = 'pending';
    const { error } = await db.from('posts').insert(insertData);
    if (error) throw error;
    if (askVetText) askVetText.value = '';
    if (photoInput) photoInput.value = '';
    showAuthMessage(VETCARE_FEATURES.askvetApproval
      ? 'Your question was sent and is awaiting approval.'
      : 'Your question has been sent to the vet.');
    await loadAskVetQuestions();
    await loadPosts();
  } catch (error) {
    // A failed insert must not leave an orphan photo in storage.
    if (uploadedPath) {
      const { error: cleanupError } = await db.storage.from(LIBRARY_BUCKET).remove([uploadedPath]);
      if (cleanupError) console.warn('Ask the Vet photo cleanup failed:', cleanupError.message);
    }
    showAuthMessage('Could not send your question: ' + error.message, true);
  } finally { askVetBtn.disabled = false; }
});

// 16b. PHASE 4 — REAL SUPABASE MARKETPLACE (23 Nov 2026)
// Shared listings for everyone, stored in the `marketplace_listings`
// table (supabase-phase4-marketplace.sql). GRACEFUL DEGRADATION, same
// pattern as Phase 3: detectPhase4Marketplace() probes for the table at
// startup; if the probe fails (SQL not run yet, or the database
// unreachable) VETCARE_FEATURES.marketplace stays false and the
// marketplace works EXACTLY as before Phase 4 — the 4 sample listings
// plus the visitor's own browser-saved listings, saved in localStorage.
// No blank screens, no crashes. In Supabase mode the sample listings are
// never shown; the visitor's old browser listings appear in a small
// collapsible "My old browser listings" section instead, so nothing is
// lost. No user content is ever rendered with innerHTML here —
// textContent only. No phone number is ever pre-filled; the seller
// contact is free text the seller enters.
const MARKET_CATEGORIES = {
  cattle: { emoji: '🐂', label: 'Cattle' },
  buffalo: { emoji: '🐃', label: 'Buffalo' },
  'goat-sheep': { emoji: '🐐', label: 'Goats & Sheep' },
  poultry: { emoji: '🐔', label: 'Poultry' },
  'feed-wanda': { emoji: '🌾', label: 'Feed & Wanda' },
  'vet-medicines': { emoji: '💊', label: 'Veterinary Medicines' },
  equipment: { emoji: '🚜', label: 'Farm Equipment' },
  breeding: { emoji: '🧬', label: 'Breeding Services' },
  dairy: { emoji: '🥛', label: 'Dairy Products' },
  other: { emoji: '📦', label: 'Other' }
};
const MARKET_ORDER = ['cattle', 'buffalo', 'goat-sheep', 'poultry', 'feed-wanda', 'vet-medicines', 'equipment', 'breeding', 'dairy', 'other'];
// Old browser listings (saved before Phase 4) used the 3 pre-Phase 4
// category slugs. They keep their old labels and only appear under "All"
// (they cannot be re-categorised honestly).
const MARKET_LEGACY_CATEGORIES = {
  livestock: { emoji: '🐂', label: 'Livestock & Feeds' },
  vet: { emoji: '💊', label: 'Veterinary Products' }
};
const MARKET_KEY = 'vc_market_listings_v1';
const MARKET_MAX_PHOTOS = 3;
const MARKET_MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MARKET_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MARKET_PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
// Sample listings — FALLBACK MODE ONLY. Never shown in Supabase mode,
// and never seeded into the database.
const MARKET_STARTERS = [
  { id: 'starter-0', title: 'Sahiwal Dairy Cow', category: 'cattle', price_pkr: null, location: '', description: 'Healthy Sahiwal cow, 2nd lactation, about 14 litres milk per day.', seller_name: 'VetCare World', seller_contact: '', image_urls: [], created_at: null, source: 'starter', mine: false },
  { id: 'starter-1', title: 'Wheat Straw & Green Fodder', category: 'feed-wanda', price_pkr: null, location: '', description: 'Fresh wheat straw bales and green fodder. Farm pickup available.', seller_name: 'VetCare World', seller_contact: '', image_urls: [], created_at: null, source: 'starter', mine: false },
  { id: 'starter-2', title: 'Single-Bucket Milking Machine', category: 'equipment', price_pkr: null, location: '', description: 'Electric milking machine in good working condition, with bucket and pipes.', seller_name: 'VetCare World', seller_contact: '', image_urls: [], created_at: null, source: 'starter', mine: false },
  { id: 'starter-3', title: 'Cattle First-Aid & Deworming Kit', category: 'vet-medicines', price_pkr: null, location: '', description: 'Basic deworming doses, wound spray, thermometer and bandages for cattle.', seller_name: 'VetCare World', seller_contact: '', image_urls: [], created_at: null, source: 'starter', mine: false }
];
let marketplaceInitialized = false;
let marketActiveCat = 'all';
let marketSearchQuery = '';
let marketDetailListing = null;
let marketSupabaseRows = [];
let marketFetching = false;

function marketCategoryFor(slug) {
  return MARKET_CATEGORIES[slug] || MARKET_LEGACY_CATEGORIES[slug] || MARKET_CATEGORIES.other;
}
function marketIsNewCategory(slug) {
  return Object.prototype.hasOwnProperty.call(MARKET_CATEGORIES, slug);
}
function formatMarketPrice(listing) {
  if (listing.price_text) return listing.price_text; // old browser listing (free text)
  if (listing.price_pkr === null || listing.price_pkr === undefined || listing.price_pkr === '') return 'Contact seller';
  const n = Number(listing.price_pkr);
  if (!Number.isFinite(n)) return 'Contact seller';
  return 'Rs ' + n.toLocaleString('en-US');
}
function formatMarketDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function loadLocalMarketListings() {
  try { return JSON.parse(localStorage.getItem(MARKET_KEY)) || []; } catch (e) { return []; }
}
function saveLocalMarketListings(list) {
  try { localStorage.setItem(MARKET_KEY, JSON.stringify(list)); } catch (e) {}
}
// Reads both shapes: the Phase 4 shape (category/price_pkr/description/
// seller_name/seller_contact) and the pre-Phase 4 shape
// (cat/price/contact/desc).
function normalizeLocalListing(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const old = typeof raw.category !== 'string';
  const pricePkr = old ? null : Number(raw.price_pkr);
  return {
    id: String(raw.id || ('local-' + Date.now())),
    title: String(raw.title || 'Listing'),
    category: String(old ? raw.cat : raw.category),
    price_pkr: Number.isFinite(pricePkr) ? pricePkr : null,
    price_text: old ? String(raw.price || '') : '',
    location: String(raw.location || ''),
    description: String(old ? (raw.desc || '') : (raw.description || '')),
    seller_name: String(raw.seller_name || ''),
    seller_contact: String(old ? (raw.contact || '') : (raw.seller_contact || '')),
    image_urls: [],
    created_at: raw.created_at || null,
    source: 'local',
    mine: true
  };
}
function normalizeSupabaseListing(row) {
  return {
    id: String(row.id),
    title: String(row.title || 'Listing'),
    category: String(row.category || 'other'),
    price_pkr: row.price_pkr === null || row.price_pkr === undefined ? null : Number(row.price_pkr),
    price_text: '',
    location: String(row.location || ''),
    description: String(row.description || ''),
    seller_name: String(row.seller_name || ''),
    seller_contact: String(row.seller_contact || ''),
    image_urls: Array.isArray(row.image_urls) ? row.image_urls.filter(u => typeof u === 'string') : [],
    created_at: row.created_at || null,
    seller_id: row.seller_id || null,
    is_hidden: row.is_hidden === true,
    source: 'supabase',
    mine: !!(currentUser && row.seller_id && row.seller_id === currentUser.id)
  };
}

// Probe the Phase 4 schema. Any failure (table missing, or the database
// unreachable) leaves the flag false — the site keeps working with the
// pre-Phase 4 browser-only marketplace. Called once in init, after
// detectPhase3Features().
async function detectPhase4Marketplace() {
  if (!db) return;
  try {
    const { error } = await db.from('marketplace_listings').select('id').limit(1);
    if (!error) {
      VETCARE_FEATURES.marketplace = true;
      await refreshMarketplaceListings();
    }
  } catch (error) {
    console.warn('Phase 4 marketplace table not available:', error.message);
  }
  updateMarketplaceAuthState();
}

// Fetch the shared listings (Supabase mode only). On a transient failure
// the previous cache is kept, so the grid never goes blank.
async function refreshMarketplaceListings() {
  if (!VETCARE_FEATURES.marketplace || !db || marketFetching) return;
  marketFetching = true;
  try {
    const { data, error } = await db.from('marketplace_listings')
      .select('id,seller_id,title,category,price_pkr,location,description,seller_name,seller_contact,image_urls,is_hidden,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) { console.warn('Marketplace listings could not be loaded:', error.message); return; }
    marketSupabaseRows = data || [];
    renderMarketplace();
    renderHomeMarket();
  } catch (error) {
    console.warn('Marketplace listings could not be loaded:', error.message);
  } finally { marketFetching = false; }
}

function marketVisibleListings() {
  if (VETCARE_FEATURES.marketplace) {
    // Hidden listings are visible only to their own seller (RLS returns
    // them to the owner; the public never sees them).
    return marketSupabaseRows.map(normalizeSupabaseListing).filter(l => !l.is_hidden || l.mine);
  }
  return loadLocalMarketListings().map(normalizeLocalListing).filter(Boolean).concat(MARKET_STARTERS);
}
function marketFilteredListings() {
  const q = marketSearchQuery.trim().toLowerCase();
  return marketVisibleListings().filter(l => {
    if (marketActiveCat !== 'all' && l.category !== marketActiveCat) return false;
    if (!q) return true;
    return [l.title, l.description, l.location].some(v => (v || '').toLowerCase().includes(q));
  });
}

function marketCardFor(listing, openHandler) {
  const card = document.createElement('article');
  card.className = 'vc-listing-card vc-clickable';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', 'View listing: ' + listing.title);
  const cat = marketCategoryFor(listing.category);
  if (listing.image_urls.length) {
    const img = document.createElement('img');
    img.className = 'vc-listing-photo';
    img.src = listing.image_urls[0];
    img.alt = listing.title;
    img.loading = 'lazy';
    card.appendChild(img);
  } else {
    const emoji = document.createElement('span');
    emoji.className = 'vc-listing-emoji';
    emoji.textContent = cat.emoji;
    card.appendChild(emoji);
  }
  const title = document.createElement('b');
  title.textContent = listing.title;
  const desc = document.createElement('p');
  desc.textContent = listing.description || '';
  const meta = document.createElement('div');
  meta.className = 'vc-listing-meta';
  const price = document.createElement('strong');
  price.textContent = formatMarketPrice(listing);
  meta.appendChild(price);
  meta.appendChild(document.createTextNode(' · ' + cat.label + (listing.location ? ' · ' + listing.location : '')));
  card.append(title, desc, meta);
  if (listing.mine) {
    const badge = document.createElement('span');
    badge.className = 'vc-listing-mine';
    badge.textContent = 'Your listing';
    card.appendChild(badge);
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'vc-listing-del';
    del.setAttribute('aria-label', 'Remove listing');
    del.textContent = '×';
    del.addEventListener('click', event => { event.stopPropagation(); deleteMarketplaceListing(listing); });
    card.appendChild(del);
  }
  if (listing.is_hidden) {
    const hidden = document.createElement('span');
    hidden.className = 'vc-listing-hidden-badge';
    hidden.textContent = 'Hidden by admin — only you can see this';
    card.appendChild(hidden);
  }
  const view = document.createElement('span');
  view.className = 'vc-listing-view';
  view.textContent = 'View details →';
  card.appendChild(view);
  const open = typeof openHandler === 'function' ? openHandler : openMarketDetail;
  card.addEventListener('click', () => open(listing));
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(listing); }
  });
  return card;
}

function renderMarketplace() {
  if (!marketplaceInitialized) return;
  const grid = document.getElementById('marketListings');
  if (!grid) return;
  const list = marketFilteredListings();
  grid.replaceChildren();
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'vc-listing-empty';
    empty.textContent = VETCARE_FEATURES.marketplace
      ? 'No listings here yet. Be the first to post one below!'
      : 'No listings in this category yet. Be the first to post one below!';
    grid.appendChild(empty);
  } else {
    list.forEach(l => grid.appendChild(marketCardFor(l)));
  }
  renderMarketOldListings();
  updateMarketplaceFormNote();
}

// Supabase mode only: the visitor's own old browser listings, shown in a
// collapsible section so nothing is lost when shared mode switches on.
function renderMarketOldListings() {
  const box = document.getElementById('marketOldListings');
  const listEl = document.getElementById('marketOldList');
  if (!box || !listEl) return;
  const old = VETCARE_FEATURES.marketplace
    ? loadLocalMarketListings().map(normalizeLocalListing).filter(Boolean)
    : [];
  box.hidden = old.length === 0 || !!marketDetailListing;
  if (!old.length) { listEl.replaceChildren(); return; }
  listEl.replaceChildren();
  old.forEach(l => listEl.appendChild(marketCardFor(l)));
}

function setMarketBrowseVisible(visible) {
  ['marketListings', 'marketOldListings'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
  });
  document.querySelectorAll('#market .vc-market-cats, #market .vc-market-search, #market .vc-listing-form-box').forEach(el => { el.hidden = !visible; });
  if (visible) renderMarketOldListings();
}

function openMarketDetail(listing) {
  const detail = document.getElementById('marketDetail');
  if (!detail) return;
  marketDetailListing = listing;
  detail.replaceChildren();
  const cat = marketCategoryFor(listing.category);
  detail.appendChild(makeButton('← Back to listings', 'vc-detail-back', closeMarketDetail));
  if (listing.image_urls.length) {
    const photos = document.createElement('div');
    photos.className = 'vc-detail-photos';
    listing.image_urls.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = listing.title;
      img.loading = 'lazy';
      photos.appendChild(img);
    });
    detail.appendChild(photos);
  } else {
    const emoji = document.createElement('span');
    emoji.className = 'vc-listing-emoji vc-detail-emoji';
    emoji.textContent = cat.emoji;
    detail.appendChild(emoji);
  }
  const title = document.createElement('h2');
  title.textContent = listing.title;
  detail.appendChild(title);
  const price = document.createElement('p');
  price.className = 'vc-detail-price';
  price.textContent = formatMarketPrice(listing);
  detail.appendChild(price);
  [
    ['Category', cat.emoji + ' ' + cat.label],
    ['Location', listing.location || '—'],
    ['Seller', listing.seller_name || '—'],
    ['Contact', listing.seller_contact || '—'],
    ['Posted', formatMarketDate(listing.created_at) || '—']
  ].forEach(([label, value]) => {
    const row = document.createElement('p');
    row.className = 'vc-detail-row';
    const b = document.createElement('strong');
    b.textContent = label + ': ';
    row.append(b, document.createTextNode(value));
    detail.appendChild(row);
  });
  if (listing.description) {
    const desc = document.createElement('p');
    desc.className = 'vc-detail-desc';
    desc.textContent = listing.description;
    detail.appendChild(desc);
  }
  if (listing.is_hidden) {
    const hidden = document.createElement('p');
    hidden.className = 'vc-listing-hidden-badge';
    hidden.textContent = 'Hidden by admin — only you can see this listing.';
    detail.appendChild(hidden);
  }
  if (listing.mine) {
    detail.appendChild(makeButton('Delete this listing', 'vc-detail-delete', () => deleteMarketplaceListing(listing, true)));
  }
  setMarketBrowseVisible(false);
  detail.hidden = false;
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeMarketDetail() {
  if (!marketDetailListing) return;
  marketDetailListing = null;
  const detail = document.getElementById('marketDetail');
  if (detail) { detail.hidden = true; detail.replaceChildren(); }
  setMarketBrowseVisible(true);
}

function updateMarketplaceFormNote() {
  const note = document.getElementById('marketFormNote');
  if (!note) return;
  note.textContent = VETCARE_FEATURES.marketplace
    ? 'Your listing will be visible to everyone on VetCare World. Please post only genuine listings — the admin may remove listings that break the rules.'
    : 'Listings you add are saved in this browser only, for now. The shared marketplace for all members is being connected.';
}

// Show/hide the post form, the sign-in prompt and the photo input from
// the detected mode + who is signed in. Idempotent: safe to run again
// after a reconnect or an auth change.
function updateMarketplaceAuthState() {
  if (!marketplaceInitialized) return;
  const form = document.getElementById('marketListingForm');
  const prompt = document.getElementById('marketSigninPrompt');
  const photoRow = document.getElementById('marketPhotoRow');
  const shared = VETCARE_FEATURES.marketplace;
  if (photoRow) photoRow.hidden = !shared;
  // Shared mode: posting is members-only (the database enforces it too).
  // Fallback mode: anyone can post to their own browser, exactly as
  // before Phase 4 — the database may be unreachable, so sign-in cannot
  // be required there.
  const canPost = !shared || !!currentUser;
  if (form) form.hidden = !canPost;
  if (prompt) prompt.hidden = canPost;
  updateMarketplaceFormNote();
  renderMarketplace();
}

function resetMarketFilters() {
  marketActiveCat = 'all';
  marketSearchQuery = '';
  const search = document.getElementById('marketSearch');
  if (search) search.value = '';
  document.querySelectorAll('[data-market-cat]').forEach(b => b.classList.toggle('active', b.getAttribute('data-market-cat') === 'all'));
}

// Listing photos live in the vetcare-library bucket under
// marketplace/<seller id>/ (same bucket Phase 3 uses for Ask the Vet
// photos). Only that folder is ever deleted from here.
function marketStoragePathFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const marker = '/vetcare-library/';
    const idx = path.indexOf(marker);
    if (idx === -1) return null;
    const storagePath = decodeURIComponent(path.slice(idx + marker.length));
    return storagePath.startsWith('marketplace/') ? storagePath : null;
  } catch (e) { return null; }
}
async function marketCleanupPhotos(imageUrls) {
  if (!db || !imageUrls || !imageUrls.length) return;
  const paths = imageUrls.map(marketStoragePathFromUrl).filter(Boolean);
  if (!paths.length) return;
  const { error } = await db.storage.from(LIBRARY_BUCKET).remove(paths);
  if (error) console.warn('Marketplace photo cleanup failed:', error.message);
}

async function deleteMarketplaceListing(listing, fromDetail = false) {
  if (!listing || !listing.mine) return;
  if (!confirm('Delete this listing?')) return;
  if (listing.source === 'supabase') {
    if (!db) return;
    const { error } = await db.from('marketplace_listings').delete().eq('id', listing.id);
    if (error) { showAuthMessage('Could not delete the listing: ' + error.message, true); return; }
    await marketCleanupPhotos(listing.image_urls);
    if (fromDetail) closeMarketDetail();
    await refreshMarketplaceListings();
    renderHomeMarket();
    return;
  }
  saveLocalMarketListings(loadLocalMarketListings().filter(l => String(l.id) !== String(listing.id)));
  if (fromDetail) closeMarketDetail();
  renderMarketplace();
  renderHomeMarket();
}

async function submitMarketListing(event) {
  event.preventDefault();
  const form = document.getElementById('marketListingForm');
  const msg = document.getElementById('marketFormMsg');
  const setMsg = (text, isError) => {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = isError ? '#b42318' : '#087a36';
  };
  const title = document.getElementById('mlTitle')?.value.trim();
  const sellerName = document.getElementById('mlSellerName')?.value.trim();
  const category = document.getElementById('mlCat')?.value;
  const priceRaw = document.getElementById('mlPrice')?.value.trim();
  const location = document.getElementById('mlLocation')?.value.trim();
  const description = document.getElementById('mlDesc')?.value.trim();
  const contact = document.getElementById('mlContact')?.value.trim();
  if (!title) { setMsg('Please write a title for your listing.', true); return; }
  if (!sellerName) { setMsg('Please write your name.', true); return; }
  if (!marketIsNewCategory(category)) { setMsg('Please choose a category.', true); return; }
  let pricePkr = null;
  if (priceRaw) {
    pricePkr = Number(priceRaw);
    if (!Number.isFinite(pricePkr) || pricePkr < 0 || !Number.isInteger(pricePkr)) {
      setMsg('Please enter a whole number price in PKR, or leave it empty.', true); return;
    }
  }
  const shared = VETCARE_FEATURES.marketplace;
  // Photos: shared mode only (the photo input stays hidden in fallback
  // mode — photos need the shared storage).
  const photoInput = document.getElementById('mlPhotos');
  const photos = shared && photoInput?.files ? Array.from(photoInput.files) : [];
  if (photos.length > MARKET_MAX_PHOTOS) { setMsg('Please choose up to 3 photos.', true); return; }
  for (const photo of photos) {
    const ext = (photo.name.split('.').pop() || '').toLowerCase();
    if (!MARKET_PHOTO_TYPES.includes(photo.type) && !MARKET_PHOTO_EXTS.includes(ext)) {
      setMsg('Photos must be JPG, PNG or WebP.', true); return;
    }
    if (photo.size > MARKET_MAX_PHOTO_BYTES) {
      setMsg('Each photo must be smaller than 5 MB.', true); return;
    }
  }
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  if (shared) {
    if (!currentUser || !db) {
      setMsg('Please sign in to post a listing.', true);
      openVetCareLogin();
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    const uploadedPaths = [];
    const imageUrls = [];
    try {
      // Same safe-name + cleanup-on-failure pattern as Ask the Vet photos.
      for (const photo of photos) {
        const safeName = photo.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
        const path = `marketplace/${currentUser.id}/${Date.now()}-${safeName}`;
        const uploadOptions = { upsert: false, cacheControl: '3600' };
        if (photo.type) uploadOptions.contentType = photo.type;
        const { error: uploadError } = await db.storage.from(LIBRARY_BUCKET).upload(path, photo, uploadOptions);
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { data: publicData } = db.storage.from(LIBRARY_BUCKET).getPublicUrl(path);
        if (!publicData?.publicUrl) throw new Error('Supabase did not return a public file URL.');
        imageUrls.push(publicData.publicUrl);
      }
      const { error } = await db.from('marketplace_listings').insert({
        seller_id: currentUser.id,
        title,
        category,
        price_pkr: pricePkr,
        location: location || null,
        description: description || null,
        seller_name: sellerName,
        seller_contact: contact || null,
        image_urls: imageUrls
      });
      if (error) throw error;
      form.reset();
      setMsg('Your listing is now visible to everyone.');
      resetMarketFilters();
      closeMarketDetail();
      await refreshMarketplaceListings();
      renderHomeMarket();
      document.getElementById('marketListings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      // A failed post must not leave orphan photos in storage.
      if (uploadedPaths.length) {
        const { error: cleanupError } = await db.storage.from(LIBRARY_BUCKET).remove(uploadedPaths);
        if (cleanupError) console.warn('Marketplace photo cleanup failed:', cleanupError.message);
      }
      setMsg('Could not publish your listing: ' + error.message, true);
    } finally { if (submitBtn) submitBtn.disabled = false; }
    return;
  }
  // Fallback mode: save in this browser, exactly as before Phase 4.
  const list = loadLocalMarketListings();
  list.unshift({
    id: 'user-' + Date.now(),
    title,
    category,
    price_pkr: pricePkr,
    location,
    description,
    seller_name: sellerName,
    seller_contact: contact,
    created_at: new Date().toISOString()
  });
  saveLocalMarketListings(list);
  form.reset();
  setMsg('Your listing has been published.');
  resetMarketFilters();
  closeMarketDetail();
  renderMarketplace();
  renderHomeMarket();
  document.getElementById('marketListings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (submitBtn) submitBtn.disabled = false;
}

function initMarketplace() {
  if (marketplaceInitialized) return;
  marketplaceInitialized = true;
  document.querySelectorAll('[data-market-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-market-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      marketActiveCat = btn.getAttribute('data-market-cat') || 'all';
      closeMarketDetail();
      renderMarketplace();
    });
  });
  document.getElementById('marketSearch')?.addEventListener('input', event => {
    marketSearchQuery = event.target.value || '';
    renderMarketplace();
  });
  document.getElementById('marketListingForm')?.addEventListener('submit', submitMarketListing);
  document.getElementById('marketSigninBtn')?.addEventListener('click', openVetCareLogin);
  // Escape closes the detail view (same key that closes the login dialog).
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && marketDetailListing) closeMarketDetail();
  });
  // Render the fallback marketplace immediately — before the database
  // connection is even attempted — so the page is never blank, even
  // offline. The probe later upgrades it to shared mode if possible.
  updateMarketplaceAuthState();
}

// Refresh the shared listings whenever the marketplace page is opened,
// so a member sees fresh listings without reloading the page.
const marketRefreshShowPage = showPage;
showPage = function (pageId) {
  marketRefreshShowPage(pageId);
  if (pageId === 'market' && VETCARE_FEATURES.marketplace) refreshMarketplaceListings();
};

// Admin Panel: marketplace moderation (hide/unhide + delete any listing).
// Follows the Phase 3 community-moderation pattern. Listed by
// loadCommunityModeration().
async function loadMarketplaceModeration() {
  const box = document.getElementById('adminMarketList');
  if (!box) return;
  if (!isVetCareAdmin || !db) return;
  box.replaceChildren();
  if (!VETCARE_FEATURES.marketplace) {
    box.textContent = 'The shared marketplace database has not been set up yet (supabase-phase4-marketplace.sql). Listings are still saved in each visitor’s own browser, so there is nothing to moderate here.';
    return;
  }
  const { data, error } = await db.from('marketplace_listings')
    .select('id,seller_id,title,category,price_pkr,location,seller_name,seller_contact,image_urls,is_hidden,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { box.textContent = error.message; return; }
  if (!data || !data.length) { box.textContent = 'No listings yet.'; return; }
  data.forEach(row => {
    const listing = normalizeSupabaseListing(row);
    const rowEl = document.createElement('div');
    rowEl.className = 'admin-resource-row vc-market-admin-row';
    const text = document.createElement('span');
    text.className = 'vc-market-admin-text';
    text.textContent = `${listing.title} — ${marketCategoryFor(listing.category).label} — ${formatMarketPrice(listing)} — ${listing.seller_name || ''} (${listing.seller_id || ''})${listing.is_hidden ? ' — HIDDEN' : ''}`;
    const hideBtn = makeButton(listing.is_hidden ? 'Restore' : 'Hide', '', async () => {
      const { error: updateError } = await db.from('marketplace_listings').update({ is_hidden: !listing.is_hidden }).eq('id', listing.id);
      if (updateError) showAuthMessage(updateError.message, true);
      else { await loadMarketplaceModeration(); await refreshMarketplaceListings(); }
    });
    const delBtn = makeButton('Delete', '', async () => {
      if (!confirm('Delete this listing permanently?')) return;
      const { error: deleteError } = await db.from('marketplace_listings').delete().eq('id', listing.id);
      if (deleteError) { showAuthMessage('Delete failed: ' + deleteError.message + ' (Marketplace deletion needs the Phase 4 database update.)', true); return; }
      await marketCleanupPhotos(listing.image_urls);
      await loadMarketplaceModeration();
      await refreshMarketplaceListings();
      renderHomeMarket();
    });
    rowEl.append(text, hideBtn, delBtn);
    box.appendChild(rowEl);
  });
}

// Admin-only page: created dynamically and added to the navigation list.
function createCommunityAdminPage() {
  let page = document.getElementById('admin');
  if (!page) {
    page = document.createElement('section');
    page.id = 'admin';
    page.className = 'page hidden';
    page.innerHTML = `
      <h1>VetCare World Admin Panel</h1>
      <p>Only verified administrators can manage this area.</p>
      <section class="admin-library-box">
        <h2>📚 Upload to Learning Library</h2>
        <p>Published files are free for everyone to view and download.</p>
        <form id="adminUploadForm">
          <label>Resource title
            <input id="adminTitle" type="text" required maxlength="160" placeholder="e.g. Dairy Cattle Nutrition">
          </label>
          <label>Category
            <select id="adminCategory" required>
              <option value="books">Books / Learning Library</option><option value="pictures">Pictures</option>
              <option value="articles">Articles</option><option value="mazameen">Mazameen / Urdu Articles</option>
              <option value="videos">Videos</option><option value="audio">Audio Lectures / Voice</option><option value="charts">Charts</option><option value="columns">Columns</option>
            </select>
          </label>
          <label>Description
            <textarea id="adminDescription" rows="3" maxlength="1000" placeholder="Short description"></textarea>
          </label>
          <label>Select file
            <input id="adminFile" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.m4v,.mp3,.m4a,.wav,.ogg,.oga,.aac,.flac,.weba" required>
          </label>
          <label class="admin-publish-label" for="adminPublish">
            <input id="adminPublish" type="checkbox" checked>
            <span><strong>Publish now</strong> — make this resource visible to everyone</span>
          </label>
          <button type="submit" id="adminUploadSubmit" class="primary-btn">Upload Resources</button>
          <p id="adminUploadStatus" class="admin-upload-status" role="status" aria-live="polite"></p>
          <small>Maximum file size: 100 MB. Upload only files you own or are allowed to share.</small>
        </form>
        <h3>Uploaded resources</h3><div id="adminResources"></div>
      </section>
      <h2>Recent community posts</h2><div id="adminPostList"></div>
      <h2>❓ Ask the Vet — questions awaiting approval</h2><div id="adminAskVetQueue"></div>
      <h2>🛒 Marketplace listings</h2><div id="adminMarketList"></div>
      <h2>Member accounts</h2><div id="adminMemberList"></div>`;
    document.querySelector('main')?.appendChild(page);
    if (Array.isArray(pages) && !pages.includes(page)) pages.push(page);
  }

  let nav = document.querySelector('[data-target="admin"]');
  if (!nav) {
    nav = document.createElement('button');
    nav.type = 'button'; nav.className = 'nav admin-nav';
    nav.dataset.target = 'admin';
    // Final Audit M2: same data-en/data-ur span as the other nav labels,
    // so the EN/UR toggle swaps this button too.
    nav.innerHTML = '🛡️ <span data-en="Admin Panel" data-ur="ایڈمن پینل">' +
      (currentLanguage === 'ur' ? 'ایڈمن پینل' : 'Admin Panel') + '</span>';
    document.getElementById('menuPanel')?.appendChild(nav);
    nav.addEventListener('click', () => showPage('admin'));
  }
  setElementHidden(nav, true);
  return page;
}

async function loadCommunityModeration() {
  if (!isVetCareAdmin || !db) return;
  const postsBox = document.getElementById('adminPostList');
  const membersBox = document.getElementById('adminMemberList');
  if (!postsBox || !membersBox) return;
  const postCols = VETCARE_FEATURES.groups
    ? 'id,user_id,content,created_at,is_hidden,group_slug,status'
    : 'id,user_id,content,created_at,is_hidden';
  const { data: posts, error: postError } = await db.from('posts').select(postCols).order('created_at', { ascending: false }).limit(50);
  postsBox.replaceChildren();
  if (postError) postsBox.textContent = postError.message;
  (posts || []).forEach(post => {
    const row = document.createElement('div'); row.className = 'admin-resource-row';
    const text = document.createElement('span');
    let rowText = `${post.content} — ${post.user_id}`;
    if (VETCARE_FEATURES.groups && post.group_slug) rowText += ` — ${groupLabelFor(post.group_slug)}`;
    if (VETCARE_FEATURES.askvetApproval && post.status) rowText += ` — ${post.status}`;
    text.textContent = rowText;
    const remove = makeButton(post.is_hidden ? 'Restore' : 'Remove', '', async () => {
      const { error } = await db.from('posts').update({ is_hidden: !post.is_hidden, moderated_by: currentUser.id, moderated_at: new Date().toISOString() }).eq('id', post.id);
      if (error) showAuthMessage(error.message, true); else loadCommunityModeration();
    });
    // Phase 3: permanent delete (admin only). Needs the admin DELETE
    // policy from the Phase 3 database update; without it Supabase
    // returns an error, which is shown honestly.
    const del = makeButton('Delete', '', async () => {
      if (!confirm('Delete this post permanently?')) return;
      const { error } = await db.from('posts').delete().eq('id', post.id);
      if (error) showAuthMessage('Delete failed: ' + error.message + ' (Post deletion needs the Phase 3 database update.)', true);
      else loadCommunityModeration();
    });
    row.append(text, remove, del); postsBox.appendChild(row);
  });
  await loadAskVetQueue();
  await loadMarketplaceModeration();
  const { data: users, error: usersError } = await db.from('user_roles').select('user_id,role').order('user_id').limit(100);
  membersBox.replaceChildren();
  if (usersError) { membersBox.textContent = usersError.message; return; }
  (users || []).filter(u => u.role !== 'admin').forEach(member => {
    const row = document.createElement('div'); row.className = 'admin-resource-row';
    const label = document.createElement('span'); label.textContent = `${member.user_id} — ${member.role}`;
    const action = makeButton(member.role === 'blocked' ? 'Unblock' : 'Block', '', async () => {
      const { error } = await db.from('user_roles').update({ role: member.role === 'blocked' ? 'member' : 'blocked' }).eq('user_id', member.user_id);
      if (error) showAuthMessage(error.message, true); else loadCommunityModeration();
    });
    row.append(label, action); membersBox.appendChild(row);
  });
}

// 17. PUBLIC LEARNING LIBRARY + ADMIN UPLOADS
const LIBRARY_BUCKET = 'vetcare-library';
const LIBRARY_MIME_BY_EXT = {
  pdf:'application/pdf', ppt:'application/vnd.ms-powerpoint',
  pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif',
  mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime', m4v:'video/x-m4v',
  mp3:'audio/mpeg', m4a:'audio/mp4', wav:'audio/wav', ogg:'audio/ogg', oga:'audio/ogg',
  aac:'audio/aac', flac:'audio/flac', weba:'audio/webm'
};
const libraryGrid = document.getElementById('publicLibraryGrid');
const libraryStatus = document.getElementById('libraryStatus');
const librarySearch = document.getElementById('librarySearch');
const libraryCategory = document.getElementById('libraryCategory');
let cachedLibraryItems = [];
let libraryLoadState = 'idle';

function libraryCategoryLabel(category) {
  if (!category || category === 'all') return 'All learning materials';
  return ({books:'Books / Learning Library',pictures:'Pictures',articles:'Articles',mazameen:'Mazameen / Urdu Articles',videos:'Videos',audio:'Audio Lectures / Voice',charts:'Charts',columns:'Columns'})[category] || 'Learning Resource';
}
// 17b. BOOK COVERS + TOPIC CATEGORIES — CLIENT-SIDE ONLY (23 Nov 2026 redesign).
// Covers and topics are mapped here by exact book title. Nothing in Supabase
// is changed: new uploads without a cover get default.jpg and the
// "Other Topics" topic automatically.
const BOOK_DEFAULT_COVER = 'default.jpg';
const BOOK_COVER_BY_TITLE = {
  'Disease Short Treatments — Veterinary Medicine Quick Reference': 'disease-short-treatments.jpg',
  'Wanda Formulation Guide': 'wanda.jpg',
  'Lumpy Skin Disease Complete Guide': 'lsd.jpg',
  'Complete Vaccination Calendar for Cattle & Buffalo | Pakistan | VetCare World': 'vaccination.jpg',
  'Silage Making & Feeding Guide for Cattle | VetCare World': 'silage.jpg',
  'Penile Injury Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-penile.jpg',
  'C-Section Complications & Uterine Repair in Cattle — Surgical Guide | VetCare World': 'surgery-csection-complications.jpg',
  'Abscess Drainage in Cattle — Surgical Guide | VetCare World': 'surgery-abscess.jpg',
  'Fracture Management & External Fixation in Cattle — Surgical Guide | VetCare World': 'surgery-fracture.jpg',
  'Vaginal & Uterine Prolapse Repair in Cattle — Surgical Guide | VetCare World': 'surgery-prolapse.jpg',
  'Rectal Prolapse Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-rectal-prolapse.jpg',
  'Wound Management & Suturing in Cattle — Surgical Guide | VetCare World': 'surgery-wound.jpg',
  'Enucleation in Cattle — Surgical Guide | VetCare World': 'surgery-enucleation.jpg',
  'Teat & Udder Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-teat.jpg',
  'Digit Amputation in Cattle — Surgical Guide | VetCare World': 'surgery-digit.jpg',
  'LDA & RDA Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-lda-rda.jpg',
  'Ovariectomy & Reproductive Tract Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-ovariectomy.jpg',
  'Castration in Cattle — Surgical Guide | VetCare World': 'surgery-castration.jpg',
  'Urethrotomy & Urolithiasis Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-urethrotomy.jpg',
  'Laparotomy in Cattle — Surgical Guide | VetCare World': 'surgery-laparotomy.jpg',
  'Rumenotomy in Cattle — Surgical Guide | VetCare World': 'surgery-rumenotomy.jpg',
  'Caesarean Section (C-Section) in Cattle — Surgical Guide | VetCare World': 'surgery-caesarean.jpg',
  'Hernia Surgery in Cattle — Surgical Guide | VetCare World': 'surgery-hernia.jpg',
  'Disbudding & Dehorning in Cattle — Surgical Guide | VetCare World': 'surgery-dehorning.jpg',
  'Tail Docking in Cattle — Surgical Guide | VetCare World': 'surgery-tail-docking.jpg',
  'Milk Fever in Dairy Cows (Parturient Paresis) – Symptoms, Diagnosis, Treatment & Prevention Guide': 'milk-fever-parturient.jpg',
  'PPR Disease in Goats and Sheep – Symptoms, Treatment & Prevention | VetCare World': 'ppr.jpg',
  'Ketosis in Cattle – Causes, Symptoms, Diagnosis & Treatment': 'ketosis.jpg',
  'Cholistani Cattle Crossbreeding – Gulabi Nukra Bull × Black & White Cow': 'cholistani.jpg',
  'Bovine Mastitis Guide – Causes, Symptoms, Diagnosis & Treatment | VetCare World': 'mastitis.jpg'
};
const BOOK_TOPIC_BY_TITLE = {
  'Disease Short Treatments — Veterinary Medicine Quick Reference': 'diseases',
  'Lumpy Skin Disease Complete Guide': 'diseases',
  'Milk Fever in Dairy Cows (Parturient Paresis) – Symptoms, Diagnosis, Treatment & Prevention Guide': 'diseases',
  'PPR Disease in Goats and Sheep – Symptoms, Treatment & Prevention | VetCare World': 'diseases',
  'Ketosis in Cattle – Causes, Symptoms, Diagnosis & Treatment': 'diseases',
  'Bovine Mastitis Guide – Causes, Symptoms, Diagnosis & Treatment | VetCare World': 'diseases',
  'Complete Vaccination Calendar for Cattle & Buffalo | Pakistan | VetCare World': 'vaccination',
  'Wanda Formulation Guide': 'nutrition',
  'Silage Making & Feeding Guide for Cattle | VetCare World': 'nutrition',
  'Cholistani Cattle Crossbreeding – Gulabi Nukra Bull × Black & White Cow': 'breeds',
  'Penile Injury Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'C-Section Complications & Uterine Repair in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Abscess Drainage in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Fracture Management & External Fixation in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Vaginal & Uterine Prolapse Repair in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Rectal Prolapse Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Wound Management & Suturing in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Enucleation in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Teat & Udder Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Digit Amputation in Cattle — Surgical Guide | VetCare World': 'surgery',
  'LDA & RDA Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Ovariectomy & Reproductive Tract Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Castration in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Urethrotomy & Urolithiasis Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Laparotomy in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Rumenotomy in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Caesarean Section (C-Section) in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Hernia Surgery in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Disbudding & Dehorning in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Tail Docking in Cattle — Surgical Guide | VetCare World': 'surgery',
  'Newcastle Disease (Ranikhet) in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'Gumboro Disease (IBD) in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'Avian Influenza (Bird Flu) in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'Fowl Pox in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'Coccidiosis in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'Infectious Bronchitis (IB) in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'CRD — Mycoplasma in Poultry — Pictorial Guide | VetCare World': 'poultry',
  "Marek's Disease in Poultry — Pictorial Guide | VetCare World": 'poultry',
  'Salmonellosis (Pullorum & Fowl Typhoid) in Poultry — Pictorial Guide | VetCare World': 'poultry',
  'Poultry Vaccination Schedule (Broiler + Layer) — Pictorial Guide | VetCare World': 'poultry',
  'Modern Dairy Farming — Complete Pictorial Guide | Housing, Feeding, Milking, Breeding & Records | VetCare World': 'farm',
  'Modern Fattening Farm — Complete Pictorial Guide | Calf Fattening, Feeding, Weight Gain & Marketing | VetCare World': 'farm',
  'Modern Livestock Farming — Complete Pictorial Guide | Farm Layout, Feeding, Breeding, Health & Biogas | VetCare World': 'farm'
};
// Extra search keywords per book (topic words a visitor might type).
const BOOK_KEYWORDS_BY_TITLE = {
  'Disease Short Treatments — Veterinary Medicine Quick Reference': 'medicine medicines dose doses antibiotic dewormer treatment',
  'Wanda Formulation Guide': 'wanda feed concentrate ration formulation calf starter heifer',
  'Lumpy Skin Disease Complete Guide': 'lumpy skin disease lsd virus nodules',
  'Complete Vaccination Calendar for Cattle & Buffalo | Pakistan | VetCare World': 'vaccination vaccine schedule calendar prevention',
  'Silage Making & Feeding Guide for Cattle | VetCare World': 'silage fodder maize fermentation',
  'Milk Fever in Dairy Cows (Parturient Paresis) – Symptoms, Diagnosis, Treatment & Prevention Guide': 'milk fever hypocalcaemia calcium downer cow',
  'PPR Disease in Goats and Sheep – Symptoms, Treatment & Prevention | VetCare World': 'ppr peste des petits ruminants goat sheep plague',
  'Ketosis in Cattle – Causes, Symptoms, Diagnosis & Treatment': 'ketosis metabolic energy acetonaemia',
  'Cholistani Cattle Crossbreeding – Gulabi Nukra Bull × Black & White Cow': 'cholistani breed breeding crossbreeding bull',
  'Bovine Mastitis Guide – Causes, Symptoms, Diagnosis & Treatment | VetCare World': 'mastitis udder milk',
  'Caesarean Section (C-Section) in Cattle — Surgical Guide | VetCare World': 'caesarean c-section dystocia delivery surgery',
  'C-Section Complications & Uterine Repair in Cattle — Surgical Guide | VetCare World': 'c-section complications uterus surgery',
  'Newcastle Disease (Ranikhet) in Poultry — Pictorial Guide | VetCare World': 'newcastle ranikhet poultry chicken hen murgi virus',
  'Gumboro Disease (IBD) in Poultry — Pictorial Guide | VetCare World': 'gumboro ibd poultry chicken bursa',
  'Avian Influenza (Bird Flu) in Poultry — Pictorial Guide | VetCare World': 'avian influenza bird flu h5n1 poultry chicken',
  'Fowl Pox in Poultry — Pictorial Guide | VetCare World': 'fowl pox poultry chicken comb warts',
  'Coccidiosis in Poultry — Pictorial Guide | VetCare World': 'coccidiosis poultry chicken bloody droppings eimeria',
  'Infectious Bronchitis (IB) in Poultry — Pictorial Guide | VetCare World': 'infectious bronchitis ib poultry chicken respiratory eggs',
  'CRD — Mycoplasma in Poultry — Pictorial Guide | VetCare World': 'crd mycoplasma poultry chicken respiratory',
  "Marek's Disease in Poultry — Pictorial Guide | VetCare World": 'mareks poultry chicken paralysis tumours',
  'Salmonellosis (Pullorum & Fowl Typhoid) in Poultry — Pictorial Guide | VetCare World': 'salmonellosis pullorum fowl typhoid poultry chicken salmonella',
  'Poultry Vaccination Schedule (Broiler + Layer) — Pictorial Guide | VetCare World': 'poultry vaccination schedule broiler layer chicken vaccine calendar',
  'Modern Dairy Farming — Complete Pictorial Guide | Housing, Feeding, Milking, Breeding & Records | VetCare World': 'modern dairy farming dairy farm cow milk tmr milking parlour housing breeding records',
  'Modern Fattening Farm — Complete Pictorial Guide | Calf Fattening, Feeding, Weight Gain & Marketing | VetCare World': 'fattening farm cattle buffalo calf fattening wanda weight gain adg mandi eid meat',
  'Modern Livestock Farming — Complete Pictorial Guide | Farm Layout, Feeding, Breeding, Health & Biogas | VetCare World': 'modern livestock farming farm management layout fodder silage breeding health calendar biogas records'
};
const BOOK_TOPIC_LABELS = {all:'All Books',diseases:'Diseases & Treatment',vaccination:'Vaccination & Prevention',nutrition:'Feed & Nutrition',breeds:'Breeds & Breeding',surgery:'Veterinary Surgery',theriogenology:'Theriogenology',farm:'Farm Management',poultry:'Poultry',other:'Other Topics'};
// v2 (23 Nov 2026): honest editorial badges on book covers. NEW = added in
// the last few days (23 Nov: LSD, Wanda, Disease Short Treatments; 22 Nov:
// Vaccination Calendar). POPULAR = the established most-read disease guides.
const BOOK_BADGE_BY_TITLE = {
  'Lumpy Skin Disease Complete Guide': 'new',
  'Wanda Formulation Guide': 'new',
  'Disease Short Treatments — Veterinary Medicine Quick Reference': 'new',
  'Complete Vaccination Calendar for Cattle & Buffalo | Pakistan | VetCare World': 'new',
  'Bovine Mastitis Guide – Causes, Symptoms, Diagnosis & Treatment | VetCare World': 'popular',
  'Ketosis in Cattle – Causes, Symptoms, Diagnosis & Treatment': 'popular',
  'PPR Disease in Goats and Sheep – Symptoms, Treatment & Prevention | VetCare World': 'popular',
  'Milk Fever in Dairy Cows (Parturient Paresis) – Symptoms, Diagnosis, Treatment & Prevention Guide': 'popular'
};
function bookBadgeFor(title) { return BOOK_BADGE_BY_TITLE[title] || ''; }
let activeBookTopic = 'all';
function bookCoverFor(title) { return BOOK_COVER_BY_TITLE[title] || BOOK_DEFAULT_COVER; }
function bookTopicFor(title) { return BOOK_TOPIC_BY_TITLE[title] || 'other'; }
function bookKeywordsFor(title) { return BOOK_KEYWORDS_BY_TITLE[title] || ''; }
function formatFileSizeMB(bytes) { return bytes ? `${(bytes / 1048576).toFixed(1)} MB` : ''; }

// Shared View + Download controls (free for everyone, no login needed).
function buildLibraryActions(item, withDownload) {
  const actions = document.createElement('div'); actions.className = 'vc-lib-actions';
  const view = document.createElement('a'); view.className = 'vc-lib-view'; view.href = item.public_url; view.target = '_blank'; view.rel = 'noopener'; view.textContent = '👁 View';
  actions.appendChild(view);
  if (withDownload !== false) {
    const dl = document.createElement('button'); dl.type = 'button';
    dl.className = 'library-download'; dl.textContent = '⬇ Download';
    dl.addEventListener('click', () => { window.open(item.public_url, '_blank', 'noopener'); });
    actions.appendChild(dl);
  }
  return actions;
}

// Book card (premium bookstore style): big front cover on top, then title,
// short description, file size + Free badge, Read + Download buttons.
// The FULL description stays in the DOM (visually clamped to 2 lines) for
// SEO and can be expanded with "Read more".
function buildBookCard(item) {
  const card = document.createElement('article');
  card.className = 'book-card';
  const cover = document.createElement('div'); cover.className = 'book-cover';
  const img = document.createElement('img');
  img.src = bookCoverFor(item.title); img.alt = `${item.title || item.file_name || 'Book'} cover`; img.loading = 'lazy';
  img.onerror = () => { if (!img.src.endsWith(BOOK_DEFAULT_COVER)) img.src = BOOK_DEFAULT_COVER; };
  cover.appendChild(img);
  // v2: honest NEW / POPULAR badge on the cover (editorial picks only).
  const badge = bookBadgeFor(item.title);
  if (badge) {
    const b = document.createElement('span');
    b.className = 'book-badge book-badge-' + badge;
    b.textContent = badge === 'new' ? '✦ NEW' : '★ POPULAR';
    cover.appendChild(b);
  }
  const body = document.createElement('div'); body.className = 'book-body';
  const title = document.createElement('h3');
  title.textContent = item.title || item.file_name || 'Untitled resource';
  title.title = item.title || item.file_name || '';
  const fullDesc = item.description || 'Free learning resource from VetCare World.';
  const desc = document.createElement('p'); desc.className = 'book-desc'; desc.textContent = fullDesc;
  body.append(title, desc);
  // "Read more" only when the description is long enough to be clamped.
  if (fullDesc.length > 130) {
    const more = document.createElement('button'); more.type = 'button'; more.className = 'book-read-more'; more.textContent = 'Read more ▾';
    more.setAttribute('aria-expanded', 'false');
    more.addEventListener('click', () => {
      const expanded = desc.classList.toggle('expanded');
      more.textContent = expanded ? 'Read less ▴' : 'Read more ▾';
      more.setAttribute('aria-expanded', String(expanded));
    });
    body.appendChild(more);
  }
  const meta = document.createElement('div'); meta.className = 'book-meta';
  const size = document.createElement('span'); size.className = 'book-size';
  size.textContent = item.file_size ? `📄 ${formatFileSizeMB(item.file_size)}` : '📄 Free resource';
  const free = document.createElement('span'); free.className = 'book-free'; free.textContent = 'Free ✓';
  meta.append(size, free);
  body.append(meta, buildLibraryActions(item));
  card.append(cover, body);
  return card;
}

// Classic resource card (pictures, articles, videos, audio, charts, columns).
function buildResourceCard(item) {
  const card = document.createElement('article'); card.className = 'library-card';
  const icon = document.createElement('div'); icon.className = 'library-card-icon';
  icon.textContent = ({books:'📚',pictures:'🖼️',articles:'📰',mazameen:'📝',videos:'🎬',audio:'🎧',charts:'📊',columns:'✍️'})[item.category] || '📁';
  const tag = document.createElement('span'); tag.className = 'library-tag'; tag.textContent = libraryCategoryLabel(item.category);
  const title = document.createElement('h3'); title.textContent = item.title || item.file_name || 'Untitled resource';
  const desc = document.createElement('p'); desc.textContent = item.description || 'Free learning resource from VetCare World.';
  const meta = document.createElement('small'); meta.textContent = item.file_size ? formatFileSizeMB(item.file_size) : 'Free resource';
  const actions = buildLibraryActions(item);
  if ((item.mime_type || '').startsWith('audio/')) {
    const player = document.createElement('audio'); player.controls = true; player.preload = 'none'; player.src = item.public_url; player.setAttribute('aria-label', `Play ${title.textContent}`); player.style.width = '100%';
    card.append(icon, tag, title, desc, meta, player, actions);
  } else {
    card.append(icon, tag, title, desc, meta, actions);
  }
  return card;
}

function renderPublicLibrary() {
  if (!libraryGrid) return;
  const q = (librarySearch?.value || '').trim().toLowerCase();
  const cat = libraryCategory?.value || 'all';
  const isBooksView = cat === 'books';
  // Topic pills + book gallery only apply to the Books folder.
  const topicBar = document.getElementById('bookTopicBar');
  if (topicBar) topicBar.classList.toggle('hidden', !isBooksView);
  libraryGrid.classList.toggle('book-gallery', isBooksView);
  if (librarySearch) librarySearch.placeholder = isBooksView ? 'Search books, topics, or diseases...' : 'Search books, pictures, articles, videos...';
  const searching = q.length > 0;
  const items = cachedLibraryItems.filter(item => {
    // A typed search looks through the WHOLE library: the folder and the
    // topic pill only organise browsing, they must never hide a match
    // (a new guide filed under 'other' was unfindable while any topic
    // pill was active — user report, 24 Nov 2026).
    if (!searching) {
      const matchesCategory = cat === 'all' || item.category === cat;
      if (!matchesCategory) return false;
      if (isBooksView && activeBookTopic !== 'all' && bookTopicFor(item.title) !== activeBookTopic) return false;
    }
    const haystack = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.file_name || ''} ${bookKeywordsFor(item.title)} ${BOOK_TOPIC_LABELS[bookTopicFor(item.title)] || ''}`.toLowerCase();
    return haystack.includes(q);
  });
  libraryGrid.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div'); empty.className = 'library-empty';
    if (!cachedLibraryItems.length && libraryLoadState === 'error') {
      empty.textContent = 'Library is being prepared. Please check again soon.';
    } else if (!cachedLibraryItems.length && libraryLoadState !== 'ready') {
      empty.textContent = 'Loading the library — please wait a moment…';
    } else if (!cachedLibraryItems.length) {
      empty.textContent = 'New learning resources will be added here soon.';
    } else if (isBooksView && activeBookTopic !== 'all' && !q) {
      empty.innerHTML = `No books in <strong>${BOOK_TOPIC_LABELS[activeBookTopic]}</strong> yet — coming soon.`;
    } else if (!q && cat === 'videos') {
      // Phase 3 (item 15): honest folder-specific empty state.
      empty.textContent = 'No videos in the library yet — new video lessons will appear here. ';
      const ytLink = document.createElement('a');
      ytLink.href = 'https://www.youtube.com/@VetCareWorld786';
      ytLink.target = '_blank'; ytLink.rel = 'noopener';
      ytLink.textContent = 'Watch videos on YouTube →';
      empty.appendChild(ytLink);
    } else if (!q && cat === 'audio') {
      // Phase 3 (item 15): honest folder-specific empty state.
      empty.textContent = 'No audio lectures yet — coming soon.';
    } else {
      empty.textContent = 'No resources match your search.';
    }
    libraryGrid.appendChild(empty); return;
  }
  items.forEach(item => {
    libraryGrid.appendChild(item.category === 'books' ? buildBookCard(item) : buildResourceCard(item));
  });
}
async function loadPublicLibrary() {
  if (!db || !libraryGrid) return;
  libraryLoadState = 'loading';
  if (libraryStatus) libraryStatus.textContent='Loading published resources...';
  const {data,error}=await db.from('media_library').select('id,title,description,category,file_name,public_url,file_size,mime_type,created_at').eq('status','published').order('created_at',{ascending:false}).limit(200);
  if(error){libraryLoadState = 'error'; console.warn('Library load:',error.message); if(libraryStatus) libraryStatus.textContent='Library is being prepared. Please check again soon.'; renderPublicLibrary(); return;}
  libraryLoadState = 'ready'; cachedLibraryItems=data||[]; if(libraryStatus) libraryStatus.textContent=`${cachedLibraryItems.length} free learning resource(s)`; renderPublicLibrary(); renderHomeVideos(); renderAllPdfGuides();
}

// 17a. HOMEPAGE — FEATURED LEARNING RESOURCES (v3, 23 Nov 2026; expanded
// to 6 books in v3.1, 23 Nov 2026).
// Shows exactly 6 curated published books with their real covers —
// Mastitis, Ketosis, Vaccination Calendar, PPR, Milk Fever and Lumpy
// Skin Disease — in the mockup's compact style. Any curated title that
// is missing is filled with the newest published book, so the section
// always shows real books and never gaps.
// The section starts hidden and is only revealed when data loads
// successfully — a failed or empty fetch never shows an error to visitors.
const popularResourcesSection = document.getElementById('popularResourcesSection');
const popularResourcesGrid = document.getElementById('popularResourcesGrid');
const HOME_POPULAR_BOOKS = [
  'Bovine Mastitis Guide – Causes, Symptoms, Diagnosis & Treatment | VetCare World',
  'Ketosis in Cattle – Causes, Symptoms, Diagnosis & Treatment',
  'Complete Vaccination Calendar for Cattle & Buffalo | Pakistan | VetCare World',
  'PPR Disease in Goats and Sheep – Symptoms, Treatment & Prevention | VetCare World',
  'Milk Fever in Dairy Cows (Parturient Paresis) – Symptoms, Diagnosis, Treatment & Prevention Guide',
  'Lumpy Skin Disease Complete Guide'
];
// Short display titles for the mockup (full titles stay in the library).
const FEATURED_DISPLAY_TITLES = {
  'Bovine Mastitis Guide – Causes, Symptoms, Diagnosis & Treatment | VetCare World': 'Mastitis in Cattle',
  'Ketosis in Cattle – Causes, Symptoms, Diagnosis & Treatment': 'Ketosis in Cattle',
  'Complete Vaccination Calendar for Cattle & Buffalo | Pakistan | VetCare World': 'Vaccination Calendar',
  'PPR Disease in Goats and Sheep – Symptoms, Treatment & Prevention | VetCare World': 'PPR in Goats & Sheep',
  'Milk Fever in Dairy Cows (Parturient Paresis) – Symptoms, Diagnosis, Treatment & Prevention Guide': 'Milk Fever in Cattle',
  'Lumpy Skin Disease Complete Guide': 'Lumpy Skin Disease'
};
function shortFeaturedTitle(item) {
  if (FEATURED_DISPLAY_TITLES[item.title]) return FEATURED_DISPLAY_TITLES[item.title];
  const t = (item.title || item.file_name || 'Untitled resource').split(/[–—|]/)[0].trim();
  return t.length > 42 ? t.slice(0, 40).trimEnd() + '…' : t;
}
// Full display title for the All PDF Guides section: the meaningful title
// without the "— Surgical Guide | VetCare World" style suffix, NEVER
// truncated — long titles wrap onto more lines instead of cutting off.
// The 6 featured books keep their short display titles in both sections.
function fullPdfGuideTitle(item) {
  if (FEATURED_DISPLAY_TITLES[item.title]) return FEATURED_DISPLAY_TITLES[item.title];
  const t = (item.title || item.file_name || 'Untitled resource').split(/[–—|]/)[0].trim();
  return t || 'Untitled resource';
}
// Compact featured card: cover on top (mobile) / left (desktop), short
// title + meta + green "View guide →" button (opens the real PDF).
// useFullTitle renders the full (untruncated) title — used by All PDF Guides.
function buildFeaturedResourceCard(item, useFullTitle) {
  const card = document.createElement('article');
  card.className = 'v3-feat-card';
  const img = document.createElement('img');
  img.className = 'v3-feat-cover';
  img.src = bookCoverFor(item.title);
  img.alt = `${item.title || item.file_name || 'Book'} cover`;
  img.loading = 'lazy';
  img.onerror = () => { if (!img.src.endsWith(BOOK_DEFAULT_COVER)) img.src = BOOK_DEFAULT_COVER; };
  const body = document.createElement('div'); body.className = 'v3-feat-body';
  const title = document.createElement('h3');
  title.textContent = useFullTitle ? fullPdfGuideTitle(item) : shortFeaturedTitle(item);
  title.title = item.title || item.file_name || '';
  const meta = document.createElement('small'); meta.className = 'v3-feat-meta';
  meta.textContent = (item.file_size ? formatFileSizeMB(item.file_size) + ' · ' : '') + 'Free ✓';
  const btn = document.createElement('a');
  btn.className = 'v3-feat-btn'; btn.href = item.public_url; btn.target = '_blank'; btn.rel = 'noopener';
  btn.textContent = 'View guide →';
  body.append(title, meta, btn);
  card.append(img, body);
  return card;
}
async function loadPopularResources() {
  if (!db || !popularResourcesSection || !popularResourcesGrid) return;
  try {
    const { data, error } = await db.from('media_library')
      .select('title,description,category,public_url,file_name,file_size,created_at')
      .eq('status', 'published')
      .eq('category', 'books')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error || !data || !data.length) return;
    const byTitle = new Map(data.map(item => [item.title, item]));
    const picked = [];
    HOME_POPULAR_BOOKS.forEach(title => {
      const item = byTitle.get(title);
      if (item) picked.push(item);
    });
    // Fill any gap with the newest books not already picked.
    for (const item of data) {
      if (picked.length >= 6) break;
      if (!picked.includes(item)) picked.push(item);
    }
    popularResourcesGrid.replaceChildren();
    picked.slice(0, 6).forEach(item => popularResourcesGrid.appendChild(buildFeaturedResourceCard(item)));
    popularResourcesSection.classList.remove('hidden');
  } catch (err) {
    console.warn('Popular resources:', err?.message || err);
  }
}

// 17a2. HOMEPAGE — ALL PDF GUIDES (23 Nov 2026).
// Shows EVERY published book from the library (31 at launch) in the same
// compact card style as Featured Learning Resources, so all uploaded PDFs
// are visible on the homepage. Renders from cachedLibraryItems (loaded by
// loadPublicLibrary), so future uploads appear automatically — no extra
// fetch, no hardcoded list. Newest uploads first (library order).
// The section starts hidden and is only revealed when books render —
// a failed or empty library load never shows an error to visitors.
const allPdfGuidesSection = document.getElementById('allPdfGuidesSection');
const allPdfGuidesGrid = document.getElementById('allPdfGuidesGrid');
function renderAllPdfGuides() {
  if (!allPdfGuidesSection || !allPdfGuidesGrid) return;
  const books = cachedLibraryItems.filter(item => item.category === 'books');
  if (!books.length) return;
  allPdfGuidesGrid.replaceChildren();
  books.forEach(item => allPdfGuidesGrid.appendChild(buildFeaturedResourceCard(item, true)));
  allPdfGuidesSection.classList.remove('hidden');
}

// 17c. HOMEPAGE — WATCH • LEARN • IMPROVE (videos).
// Renders real published videos from the library. The Videos folder is
// currently empty, so visitors see an honest "coming soon" state with a
// link to the YouTube channel — never invented titles or thumbnails.
function renderHomeVideos() {
  const section = document.getElementById('homeVideosSection');
  const grid = document.getElementById('homeVideosGrid');
  if (!section || !grid) return;
  const videos = cachedLibraryItems.filter(item => item.category === 'videos');
  grid.replaceChildren();
  if (!videos.length) {
    const empty = document.createElement('div');
    empty.className = 'vh-empty-state';
    empty.innerHTML = '<span class="vh-empty-ico">🎬</span><b>Videos are coming soon</b>' +
      '<p>Video lectures and practical demonstrations will appear here as they are added to the Learning Library. ' +
      'Watch our latest veterinary videos on YouTube in the meantime.</p>';
    const yt = document.createElement('a');
    yt.className = 'vh-btn vh-btn-primary'; yt.href = 'https://www.youtube.com/@VetCareWorld786';
    yt.target = '_blank'; yt.rel = 'noopener'; yt.textContent = '▶ Watch on YouTube';
    empty.appendChild(yt);
    grid.appendChild(empty);
    return;
  }
  videos.slice(0, 3).forEach(item => {
    const card = document.createElement('article');
    card.className = 'vh-video-card';
    const player = document.createElement('video');
    player.controls = true; player.preload = 'metadata'; player.src = item.public_url;
    player.setAttribute('aria-label', item.title || 'Library video');
    const title = document.createElement('h3');
    title.textContent = item.title || item.file_name || 'Video';
    const desc = document.createElement('p');
    desc.textContent = item.description || 'Free veterinary video from VetCare World.';
    card.append(player, title, desc);
    grid.appendChild(card);
  });
}

// 17d. HOMEPAGE — LIVESTOCK MARKETPLACE PREVIEW.
// PHASE 4 (23 Nov 2026): in Supabase mode this shows the newest visible
// shared listings (max 6); in fallback mode it keeps the old behaviour —
// the visitor's own browser-saved listings (max 3). With no listings,
// the static category tiles in the HTML stay visible instead. The
// marketplace page's built-in sample listings are NEVER shown here.
// NOTE: the preview containers (#homeMarketTiles / #homeMarketListings)
// are added by the Phase 4 homepage work (item 20); until they exist in
// index.html this function safely does nothing.
async function renderHomeMarket() {
  const tiles = document.getElementById('homeMarketTiles');
  const listWrap = document.getElementById('homeMarketListings');
  if (!tiles || !listWrap) return;
  let listings = [];
  if (VETCARE_FEATURES.marketplace) {
    if (!marketSupabaseRows.length && db) await refreshMarketplaceListings();
    listings = marketSupabaseRows.map(normalizeSupabaseListing).filter(l => !l.is_hidden).slice(0, 6);
  } else {
    listings = loadLocalMarketListings().map(normalizeLocalListing).filter(Boolean).slice(0, 3);
  }
  if (!listings.length) return;
  listWrap.replaceChildren();
  listings.forEach(l => {
    // A homepage card opens the marketplace page on that listing's detail.
    listWrap.appendChild(marketCardFor(l, item => { showPage('market'); openMarketDetail(item); }));
  });
  tiles.classList.add('hidden');
  listWrap.classList.remove('hidden');
}

// 17e. HOMEPAGE — COMMUNITY HIGHLIGHTS.
// PHASE 4 (23 Nov 2026, item 20): the newest approved community posts
// (max 5) as a short preview above the community section. Each card
// opens the community feed. GRACEFUL DEGRADATION, same pattern as the
// Phase 3/4 features: the section stays hidden unless the Phase 3
// approval schema was detected (status column exists), the query
// succeeds, and at least one approved post exists. No fake posts are
// ever shown. Author names reuse the Phase 3 profiles pattern
// (fetchProfileNames + displayNameFor); without profiles every author
// reads "VetCare World Member".
async function renderHomeCommunityHighlights() {
  const section = document.getElementById('communityHighlightsSection');
  const grid = document.getElementById('communityHighlightsGrid');
  if (!section || !grid || !db) return;
  if (!VETCARE_FEATURES.askvetApproval) return;
  try {
    const { data, error } = await db.from('posts')
      .select('id,user_id,content,created_at,group_slug')
      .eq('is_hidden', false)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error || !data?.length) return;
    await fetchProfileNames(data.map(post => post.user_id));
    grid.replaceChildren();
    data.forEach(post => {
      const card = document.createElement('article');
      card.className = 'p4-highlight-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Open community post by ' + displayNameFor(post.user_id));
      const head = document.createElement('div');
      head.className = 'p4-highlight-head';
      const author = document.createElement('b');
      author.textContent = displayNameFor(post.user_id);
      const date = document.createElement('small');
      date.textContent = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';
      head.append(author, date);
      const body = document.createElement('p');
      const text = (post.content || '').trim();
      body.textContent = text.length > 140 ? text.slice(0, 137).trimEnd() + '…' : text;
      card.append(head, body);
      if (VETCARE_FEATURES.groups && post.group_slug) card.appendChild(groupTagFor(post.group_slug));
      const open = () => showPage('groups');
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
      grid.appendChild(card);
    });
    section.classList.remove('hidden');
  } catch (error) {
    console.warn('Community highlights could not be loaded:', error.message);
  }
}

// 17f. HOMEPAGE — MARKETPLACE CATEGORY TILES.
// PHASE 4 (23 Nov 2026, item 20): a tile tap opens the marketplace on
// that category. The tile's own data-target="market" navigation runs
// first (attached earlier); this handler then forwards the tap to the
// matching category chip on the marketplace page, which applies the
// filter through the existing §16b handler — no marketplace code is
// touched here, and the chip highlight lands on the chip, not the tile.
document.querySelectorAll('[data-home-market-cat]').forEach(tile => {
  tile.addEventListener('click', () => {
    const cat = tile.getAttribute('data-home-market-cat');
    document.querySelector(`#market [data-market-cat="${cat}"]`)?.click();
  });
});
librarySearch?.addEventListener('input',renderPublicLibrary);
// Book topic pills (Books folder only).
function setActiveBookTopic(topic) {
  activeBookTopic = topic || 'all';
  document.querySelectorAll('[data-book-topic]').forEach(b => {
    const selected = b.dataset.bookTopic === activeBookTopic;
    b.classList.toggle('active', selected);
    b.setAttribute('aria-pressed', String(selected));
  });
  renderPublicLibrary();
}
document.querySelectorAll('[data-book-topic]').forEach(button => {
  button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
  button.addEventListener('click', () => setActiveBookTopic(button.dataset.bookTopic || 'all'));
});
// Homepage category cards that open the Library on one book topic
// (e.g. Vaccination & Prevention → the Vaccination books). The card's
// data-target="library" navigation runs first (attached earlier); this
// handler then selects the Books folder + topic and re-renders.
document.querySelectorAll('[data-book-topic-link]').forEach(button => {
  button.addEventListener('click', () => {
    setActiveLibraryFolder('books');
    setActiveBookTopic(button.dataset.bookTopicLink || 'all');
    document.getElementById('publicLibraryGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
libraryCategory?.addEventListener('change', () => {
  const value = libraryCategory.value || 'all';
  document.querySelectorAll('#libraryFolderGrid [data-library-folder]').forEach(card => {
    const selected = card.dataset.libraryFolder === value;
    card.classList.toggle('active', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  const active = document.getElementById('libraryActiveFolder');
  if (active) active.textContent = libraryCategoryLabel(value);
  renderPublicLibrary();
});
function setActiveLibraryFolder(value, selectedButton = null) {
  if (libraryCategory) libraryCategory.value = value || 'all';
  // Active state lives on the library page folder cards only (homepage
  // shortcut cards share data-library-folder but are not folder cards).
  document.querySelectorAll('#libraryFolderGrid [data-library-folder]').forEach(card => {
    const selected = card.dataset.libraryFolder === (value || 'all');
    card.classList.toggle('active', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  const active = document.getElementById('libraryActiveFolder');
  if (active) active.textContent = libraryCategoryLabel(value || 'all');
  renderPublicLibrary();
}
document.querySelectorAll('[data-library-folder]').forEach(button => {
  button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
  button.addEventListener('click', () => {
    setActiveLibraryFolder(button.dataset.libraryFolder, button);
    document.getElementById('publicLibraryGrid')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
document.getElementById('libraryShowAll')?.addEventListener('click', () => setActiveLibraryFolder('all'));

// Library uploads (Phase 4 — admin only): only authorized administrators
// can upload resources, from the Library page or the Admin Panel.
// Admin uploads publish immediately. Members can no longer submit drafts.
document.getElementById('memberUploadBtn')?.addEventListener('click', () => {
  if (!currentUser) { showAuthMessage('Upload \u06A9\u0631\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u067E\u06C1\u0644\u06D2 \u0644\u0627\u06AF \u0627\u0650\u0646 \u06A9\u0631\u06CC\u06BA\u06D4', true); openVetCareLogin(); return; }
  if (!isVetCareAdmin) { showAuthMessage('Only authorized administrators can upload resources.', true); return; }
  const box = document.getElementById('memberUploadBox');
  if (!box) return;
  box.classList.toggle('hidden');
  if (!box.classList.contains('hidden')) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.addEventListener('submit', async event => {
  if (event.target?.id !== 'memberUploadForm') return;
  event.preventDefault();
  if (!currentUser || !db) { showAuthMessage('Upload \u06A9\u0631\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u067E\u06C1\u0644\u06D2 \u0644\u0627\u06AF \u0627\u0650\u0646 \u06A9\u0631\u06CC\u06BA\u06D4', true); openVetCareLogin(); return; }
  // Admin-only uploads (Phase 4): refuse the submit for non-admins,
  // even if the hidden form is somehow submitted directly.
  if (!isVetCareAdmin) { showAuthMessage('Only authorized administrators can upload resources.', true); return; }

  const form = event.target;
  const file = document.getElementById('memberFile')?.files?.[0];
  const title = document.getElementById('memberTitle')?.value.trim();
  const category = document.getElementById('memberCategory')?.value || 'books';
  const description = document.getElementById('memberDescription')?.value.trim() || '';
  const statusBox = document.getElementById('memberUploadStatus');
  const submit = document.getElementById('memberUploadSubmit');

  if (!file || !title) { showAuthMessage('Please add a title and select a file.', true); return; }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const detectedMime = LIBRARY_MIME_BY_EXT[ext] || file.type;
  if (![...Object.values(LIBRARY_MIME_BY_EXT), 'audio/x-wav', 'audio/x-m4a', 'audio/x-aac'].includes(detectedMime)) {
    showAuthMessage('Unsupported file type. Upload documents, images, videos or audio lectures (MP3, M4A, WAV, OGG, AAC, FLAC).', true); return;
  }
  if (file.size > 100 * 1024 * 1024) { showAuthMessage('File is larger than 100 MB. Please choose a smaller file.', true); return; }

  if (submit) { submit.disabled = true; submit.textContent = 'Uploading\u2026'; }
  if (statusBox) statusBox.textContent = 'Uploading file. Please keep this page open\u2026';
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  const storagePath = `${currentUser.id}/${Date.now()}-${safeName}`;
  const publishNow = isVetCareAdmin;
  let uploaded = false;

  try {
    const { error: uploadError } = await db.storage.from(LIBRARY_BUCKET)
      .upload(storagePath, file, { upsert: false, contentType: detectedMime, cacheControl: '3600' });
    if (uploadError) throw uploadError;
    uploaded = true;

    const { data: publicData } = db.storage.from(LIBRARY_BUCKET).getPublicUrl(storagePath);
    if (!publicData?.publicUrl) throw new Error('Supabase did not return a public file URL.');

    const { error: insertError } = await db.from('media_library').insert({
      title, description, category, file_path: storagePath, storage_path: storagePath,
      file_name: file.name, public_url: publicData.publicUrl, mime_type: detectedMime,
      file_size: file.size, status: publishNow ? 'published' : 'draft',
      is_published: publishNow, created_by: currentUser.id, uploaded_by: currentUser.id
    });
    if (insertError) throw insertError;

    if (statusBox) statusBox.textContent = publishNow ? '\u2713 Uploaded and published.' : '\u2713 Uploaded! The admin will review it before publishing.';
    showAuthMessage(publishNow ? 'Resource uploaded and published for everyone.' : 'Uploaded! The admin will review it before publishing.');
    form.reset();
    if (publishNow) await loadPublicLibrary();
  } catch (error) {
    console.error('Member library upload:', error);
    if (uploaded) {
      const { error: cleanupError } = await db.storage.from(LIBRARY_BUCKET).remove([storagePath]);
      if (cleanupError) console.warn('Upload cleanup failed:', cleanupError.message);
    }
    if (statusBox) statusBox.textContent = 'Upload failed: ' + (error.message || 'Unknown error');
    showAuthMessage('Upload failed: ' + (error.message || 'Unknown error'), true);
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = 'Upload Resource'; }
  }
});


async function loadAdminResources() {
  if (!isVetCareAdmin || !db) return;
  const list = document.getElementById('adminResources');
  if (!list) return;
  const { data, error } = await db.from('media_library').select('*').order('created_at', { ascending: false }).limit(200);
  list.replaceChildren();
  if (error) { list.textContent = 'Resources could not be loaded: ' + error.message; return; }

  (data || []).forEach(item => {
    const row = document.createElement('div'); row.className = 'admin-resource-row';
    const name = document.createElement('span');
    name.textContent = `${item.title} — ${item.status === 'published' ? 'Published' : 'Draft'}`;
    row.appendChild(name);

    if (item.public_url) {
      const open = document.createElement('a'); open.href = item.public_url;
      open.target = '_blank'; open.rel = 'noopener'; open.textContent = 'Open'; row.appendChild(open);
    }

    const actions = document.createElement('div'); actions.className = 'admin-resource-actions';
    const publishButton = makeButton(item.status === 'published' ? 'Unpublish' : 'Publish now', '', async () => {
      publishButton.disabled = true;
      const nextStatus = item.status === 'published' ? 'draft' : 'published';
      const { error: updateError } = await db.from('media_library')
        .update({ status: nextStatus, is_published: nextStatus === 'published' })
        .eq('id', item.id);
      if (updateError) showAuthMessage('Publish update failed: ' + updateError.message, true);
      else { showAuthMessage(nextStatus === 'published' ? 'Resource published for everyone.' : 'Resource moved to drafts.'); await loadAdminResources(); await loadPublicLibrary(); }
      publishButton.disabled = false;
    });
    publishButton.classList.add('admin-resource-action', 'admin-unpublish-action');
    actions.appendChild(publishButton);

    const remove = makeButton('Delete', '', async () => {
      if (!confirm(`Delete "${item.title}"?`)) return;
      const path = item.storage_path || item.file_path;
      if (path) {
        const { error: storageError } = await db.storage.from(LIBRARY_BUCKET).remove([path]);
        if (storageError) { showAuthMessage('File delete failed: ' + storageError.message, true); return; }
      }
      const { error: rowError } = await db.from('media_library').delete().eq('id', item.id);
      if (rowError) { showAuthMessage('Record delete failed: ' + rowError.message, true); return; }
      showAuthMessage('Resource deleted.'); await loadAdminResources(); await loadPublicLibrary();
    });
    remove.classList.add('admin-resource-action', 'admin-delete-action');
    actions.appendChild(remove);
    row.appendChild(actions);
    list.appendChild(row);
  });
  if (!(data || []).length) list.textContent = 'No resources uploaded yet.';
}

// Form is created dynamically inside the verified Admin Panel.
document.addEventListener('submit', async event => {
  if (event.target?.id !== 'adminUploadForm') return;
  event.preventDefault();
  if (!currentUser || !isVetCareAdmin || !db) {
    showAuthMessage('Only the verified administrator can upload resources.', true); return;
  }

  const form = event.target;
  const file = document.getElementById('adminFile')?.files?.[0];
  const title = document.getElementById('adminTitle')?.value.trim();
  const category = document.getElementById('adminCategory')?.value || 'books';
  const description = document.getElementById('adminDescription')?.value.trim() || '';
  const publish = document.getElementById('adminPublish')?.checked === true;
  const statusBox = document.getElementById('adminUploadStatus');
  const submit = document.getElementById('adminUploadSubmit');

  if (!file || !title) { showAuthMessage('Please add a title and select a file.', true); return; }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const mimeByExt = {
    pdf:'application/pdf', ppt:'application/vnd.ms-powerpoint',
    pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif',
    mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime', m4v:'video/x-m4v',
    mp3:'audio/mpeg', m4a:'audio/mp4', wav:'audio/wav', ogg:'audio/ogg', oga:'audio/ogg',
    aac:'audio/aac', flac:'audio/flac', weba:'audio/webm'
  };
  const detectedMime = mimeByExt[ext] || file.type;
  if (![...Object.values(mimeByExt), 'audio/x-wav', 'audio/x-m4a', 'audio/x-aac'].includes(detectedMime)) {
    showAuthMessage('Unsupported file type. Upload documents, images, videos or audio lectures (MP3, M4A, WAV, OGG, AAC, FLAC).', true); return;
  }
  if (file.size > 100 * 1024 * 1024) { showAuthMessage('File is larger than 100 MB. Please choose a smaller file.', true); return; }

  if (submit) { submit.disabled = true; submit.textContent = 'Uploading…'; }
  if (statusBox) statusBox.textContent = 'Uploading file. Please keep this page open…';
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  const storagePath = `${currentUser.id}/${Date.now()}-${safeName}`;
  let uploaded = false;

  try {
    const { error: uploadError } = await db.storage.from(LIBRARY_BUCKET)
      .upload(storagePath, file, { upsert: false, contentType: detectedMime, cacheControl: '3600' });
    if (uploadError) throw uploadError;
    uploaded = true;

    const { data: publicData } = db.storage.from(LIBRARY_BUCKET).getPublicUrl(storagePath);
    if (!publicData?.publicUrl) throw new Error('Supabase did not return a public file URL.');

    const { error: insertError } = await db.from('media_library').insert({
      title, description, category, file_path: storagePath, storage_path: storagePath,
      file_name: file.name, public_url: publicData.publicUrl, mime_type: detectedMime,
      file_size: file.size, status: publish ? 'published' : 'draft',
      is_published: publish, created_by: currentUser.id, uploaded_by: currentUser.id
    });
    if (insertError) throw insertError;

    if (statusBox) statusBox.textContent = publish ? '✓ Uploaded and published. Visitors can now view it.' : '✓ Uploaded as draft. Use Publish now in the resource list when ready.';
    showAuthMessage(publish ? 'Resource uploaded and published for everyone.' : 'Resource uploaded as draft.');
    form.reset();
    await loadAdminResources();
    await loadPublicLibrary();
  } catch (error) {
    console.error('Library upload:', error);
    if (uploaded) {
      const { error: cleanupError } = await db.storage.from(LIBRARY_BUCKET).remove([storagePath]);
      if (cleanupError) console.warn('Upload cleanup failed:', cleanupError.message);
    }
    if (statusBox) statusBox.textContent = 'Upload failed: ' + (error.message || 'Unknown error');
    showAuthMessage('Upload failed: ' + (error.message || 'Unknown error'), true);
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = 'Upload Resource'; }
  }
});

// 18. AUTH STATE + LOGOUT
function updateAuthDisplay(user) {
  currentUser = user || null;
  const loggedIn = !!currentUser;

  if (signupBtn) signupBtn.style.display = loggedIn ? 'none' : '';
  if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : '';

  // Authentication actions live only inside the slide-out menu.
  const menuLoginButton = document.getElementById('openLoginBtn');
  if (menuLoginButton) menuLoginButton.hidden = loggedIn;
  logoutButtons.forEach(button => { button.hidden = !loggedIn; });

  // Member identity, Login/Register and Logout are all contained in the menu.
  const menuMember = document.getElementById('menuMember');
  const menuMemberEmail = document.getElementById('menuMemberEmail');
  if (menuMember) menuMember.hidden = !loggedIn;
  if (menuMemberEmail) menuMemberEmail.textContent = currentUser?.email || 'Signed in';

  if (emailInput) emailInput.disabled = loggedIn;
  if (passwordInput) passwordInput.disabled = loggedIn;
  document.body.classList.toggle('logged-in', loggedIn);

  if (!loggedIn) {
    isVetCareAdmin = false;
    adminCheckToken++;
    hideAdminInterface();
    updateMemberUploadVisibility();
  } else {
    // Hidden until Supabase confirms the explicit admin role.
    isVetCareAdmin = false;
    hideAdminInterface();
    updateMemberUploadVisibility();
    refreshAdminAccess(currentUser);
  }
  // Library cards re-render on login/logout (admin controls depend on auth state).
  if (typeof renderPublicLibrary === 'function') renderPublicLibrary();
  // Phase 3: a member who just signed in and has no display name yet gets
  // the name prompt (no-op when logged out or before the Phase 3 update).
  if (typeof maybeShowNamePrompt === 'function') maybeShowNamePrompt();
  // Phase 4: the marketplace post form, sign-in prompt and "Your listing"
  // buttons all depend on who is signed in.
  if (typeof updateMarketplaceAuthState === 'function') updateMarketplaceAuthState();
}

logoutButtons.forEach(button => {
  button.addEventListener('click', async event => {
    event.preventDefault();
    if (!(await ensureDatabaseConnection())) {
      showAuthMessage('Database service is not reachable. Check your internet, then use Retry connection.', true);
      showDatabaseRetry();
      return;
    }
    const { error } = await db.auth.signOut();
    if (error) {
      showAuthMessage('Logout failed: ' + error.message, true);
      return;
    }
    updateAuthDisplay(null);
    showPage('home');
    showAuthMessage('You have been logged out.');
  });
});


// 19. APP STARTUP
async function initializeVetCareWorld() {
  // Home is the default visible page.
  document.body.classList.add('vc-on-home');
  createCommunityAdminPage();
  hideAdminInterface();
  updateMemberUploadVisibility();
  updateLanguage();

  // Phase 4: render the marketplace immediately (fallback mode), before
  // the database connection is attempted, so the page is never blank.
  initMarketplace();

  if (!(await ensureDatabaseConnection())) {
    updateAuthDisplay(null);
    if (libraryStatus) libraryStatus.textContent = 'Database connection unavailable. Check your network and retry.';
    showDatabaseRetry();
    return;
  }

  // Phase 3: detect the groups/profiles/approval schema BEFORE the session
  // is restored, so the admin moderation load (triggered by
  // updateAuthDisplay → refreshAdminAccess) and the feed both use the
  // right queries, and the new UI is shown only when the database
  // supports it.
  await detectPhase3Features();

  // Phase 4: probe for the shared marketplace table (upgrades the
  // marketplace to shared mode when the Phase 4 SQL has been run).
  await detectPhase4Marketplace();

  const { data, error } = await db.auth.getSession();
  if (error) console.warn('Session restore:', error.message);
  updateAuthDisplay(data?.session?.user || null);

  db.auth.onAuthStateChange((_event, session) => {
    updateAuthDisplay(session?.user || null);
  });

  await maybeShowNamePrompt();

  await loadPosts();
  await loadAskVetQuestions();
  await loadPublicLibrary();
  await loadPopularResources();
  renderAllPdfGuides();
  renderHomeVideos();
  renderHomeMarket();
  await renderHomeCommunityHighlights();
}

initializeVetCareWorld();


// 20. OPTIONAL PWA SERVICE WORKER
if ('serviceWorker' in navigator &&
    /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('Service worker registration skipped:', error);
    });
  });
}

// 21. PWA INSTALL PROMPT — shows the "Install App" menu button when the
// browser offers installation, and opens the native install prompt on tap.
(() => {
  let deferredPrompt = null;
  const installBtn = document.getElementById('installAppBtn');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (installBtn) installBtn.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.hidden = true;
  });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      const menuPanel = document.getElementById('menuPanel');
      const menuButton = document.getElementById('menuBtn');
      if (menuPanel) menuPanel.classList.remove('menu-open');
      document.body.classList.remove('vetcare-menu-open');
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
      if (!deferredPrompt) {
        window.alert('App install karne ke liye browser menu (⋮) mein "Add to Home screen" ya "Install app" chunen.');
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  }
})();

// V6 responsive menu controls (kept separate from authentication logic).
(() => {
  const menuButton = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('menuPanel');
  if (!menuButton || !menuPanel) return;

  const closeMenu = () => {
    menuPanel.classList.remove('menu-open');
    document.body.classList.remove('vetcare-menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  };
  menuButton.addEventListener('click', () => {
    const isOpen = menuPanel.classList.toggle('menu-open');
    document.body.classList.toggle('vetcare-menu-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  menuPanel.querySelectorAll('button[data-target]').forEach(button => {
    button.addEventListener('click', closeMenu);
  });
  document.addEventListener('click', event => {
    if (!menuPanel.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
})();
