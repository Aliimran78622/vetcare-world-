
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

if (
  window.supabase &&
  typeof window.supabase.createClient === 'function'
) {
  db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
} else {
  console.error('Supabase library did not load.');
}


// 2. COMMON HTML ELEMENTS
// ------------------------------------------------------

const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');

const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');

const logoutButtons = document.querySelectorAll('#logoutBtn');

const authMessage = document.getElementById('authMessage');
const authBox = document.getElementById('authBox');

const postBtn = document.getElementById('postBtn');
const postText = document.getElementById('postText');


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

    langBtn.textContent =
      currentLanguage === 'en' ? 'اردو' : 'English';

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

    if (!message) return;

    if (!query) {

      message.textContent =
        'Search the Knowledge Centre';

    } else if (count > 0) {

      message.textContent =
        count + ' categories found / کیٹیگریز مل گئیں';

    } else {

      message.textContent =
        'No matching category found / کوئی متعلقہ موضوع نہیں ملا';

    }

  });

}

setupKnowledgeSearch();


// 12. SIGN UP
// ------------------------------------------------------

signupBtn?.addEventListener('click', async event => {

  event.preventDefault();

  if (!db) {
    showAuthMessage('Database connection unavailable.', true);
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

  if (!db) {
    showAuthMessage('Database connection unavailable.', true);
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

async function refreshAdminAccess(user) {
  createCommunityAdminPage();
  const token = ++adminCheckToken;
  isVetCareAdmin = false;
  hideAdminInterface();

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

async function loadPosts() {
  if (!feedElement || !db) return;
  const { data, error } = await db.from('posts')
    .select('id,user_id,content,created_at,is_hidden')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false }).limit(50);
  if (error) {
    console.warn('Posts could not be loaded:', error.message);
    feedElement.textContent = 'Community posts are temporarily unavailable.';
    return;
  }
  feedElement.replaceChildren();
  if (!data?.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No posts yet. Be the first to share useful knowledge!';
    feedElement.appendChild(empty);
    return;
  }
  for (const post of data) {
    const card = document.createElement('article');
    card.className = 'post post-card';
    const head = document.createElement('div');
    head.className = 'post-head';
    const avatar = document.createElement('span');
    avatar.className = 'avatar'; avatar.textContent = '👨‍🌾';
    const identity = document.createElement('div');
    const author = document.createElement('b'); author.textContent = 'VetCare World Member';
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
    card.append(head, body, actions);
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
  area.querySelectorAll('.comment-item').forEach(x => x.remove());
  (data || []).forEach(comment => {
    const item = document.createElement('p'); item.className = 'comment-item';
    item.textContent = `${comment.content} — Member`;
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
    const { error } = await db.from('posts').insert({ user_id: currentUser.id, content });
    if (error) throw error;
    if (postText) postText.value = '';
    showAuthMessage('Your post has been published.'); await loadPosts();
  } catch (error) { showAuthMessage('Post failed: ' + error.message, true); }
  finally { isPosting = false; postBtn.disabled = false; }
});

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
              <option value="videos">Videos</option><option value="charts">Charts</option><option value="columns">Columns</option>
            </select>
          </label>
          <label>Description
            <textarea id="adminDescription" rows="3" maxlength="1000" placeholder="Short description"></textarea>
          </label>
          <label>Select file
            <input id="adminFile" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm" required>
          </label>
          <label class="admin-publish-label" for="adminPublish">
            <input id="adminPublish" type="checkbox" checked>
            <span><strong>Publish now</strong> — make this resource visible to everyone</span>
          </label>
          <button type="submit" id="adminUploadSubmit" class="primary-btn">Upload Resources</button>
          <p id="adminUploadStatus" class="admin-upload-status" role="status" aria-live="polite"></p>
          <small>Maximum file size: 25 MB. Upload only files you own or are allowed to share.</small>
        </form>
        <h3>Uploaded resources</h3><div id="adminResources"></div>
      </section>
      <h2>Recent community posts</h2><div id="adminPostList"></div>
      <h2>Member accounts</h2><div id="adminMemberList"></div>`;
    // Keep the upload action at the end of the form so it cannot be displaced
    // by file-input styling or mobile flex/grid rules.
    const uploadForm = page.querySelector('#adminUploadForm');
    const uploadAction = page.querySelector('#adminUploadSubmit');
    if (uploadForm && uploadAction) {
      uploadAction.type = 'submit';
      uploadAction.textContent = 'Upload Resources';
      uploadAction.style.setProperty('display', 'flex', 'important');
      uploadAction.style.setProperty('visibility', 'visible', 'important');
      uploadAction.style.setProperty('opacity', '1', 'important');
      uploadAction.style.setProperty('width', '100%', 'important');
      uploadForm.appendChild(uploadAction);
    }
    document.querySelector('main')?.appendChild(page);
    if (Array.isArray(pages) && !pages.includes(page)) pages.push(page);
  }

  let nav = document.querySelector('[data-target="admin"]');
  if (!nav) {
    nav = document.createElement('button');
    nav.type = 'button'; nav.className = 'nav admin-nav';
    nav.dataset.target = 'admin'; nav.textContent = '🛡️ Admin Panel';
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
  const { data: posts, error: postError } = await db.from('posts').select('id,user_id,content,created_at,is_hidden').order('created_at', { ascending: false }).limit(50);
  postsBox.replaceChildren();
  if (postError) postsBox.textContent = postError.message;
  (posts || []).forEach(post => {
    const row = document.createElement('div'); row.className = 'admin-resource-row';
    const text = document.createElement('span'); text.textContent = `${post.content} — ${post.user_id}`;
    const remove = makeButton(post.is_hidden ? 'Restore' : 'Remove', '', async () => {
      const { error } = await db.from('posts').update({ is_hidden: !post.is_hidden, moderated_by: currentUser.id, moderated_at: new Date().toISOString() }).eq('id', post.id);
      if (error) showAuthMessage(error.message, true); else loadCommunityModeration();
    });
    row.append(text, remove); postsBox.appendChild(row);
  });
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
const libraryGrid = document.getElementById('publicLibraryGrid');
const libraryStatus = document.getElementById('libraryStatus');
const librarySearch = document.getElementById('librarySearch');
const libraryCategory = document.getElementById('libraryCategory');
let cachedLibraryItems = [];

function libraryCategoryLabel(category) {
  if (!category || category === 'all') return 'All learning materials';
  return ({books:'Books / Learning Library',pictures:'Pictures',articles:'Articles',mazameen:'Mazameen / Urdu Articles',videos:'Videos',charts:'Charts',columns:'Columns'})[category] || 'Learning Resource';
}
function renderPublicLibrary() {
  if (!libraryGrid) return;
  const q = (librarySearch?.value || '').trim().toLowerCase();
  const cat = libraryCategory?.value || 'all';
  const items = cachedLibraryItems.filter(item => {
    const matchesCategory = cat === 'all' || item.category === cat;
    const haystack = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.file_name || ''}`.toLowerCase();
    return matchesCategory && haystack.includes(q);
  });
  libraryGrid.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div'); empty.className='library-empty';
    empty.textContent = cachedLibraryItems.length ? 'No resources match your search.' : 'New learning resources will be added here soon.';
    libraryGrid.appendChild(empty); return;
  }
  items.forEach(item => {
    const card=document.createElement('article'); card.className='library-card';
    const icon=document.createElement('div'); icon.className='library-card-icon';
    icon.textContent=({books:'📚',pictures:'🖼️',articles:'📰',mazameen:'📝',videos:'🎬',charts:'📊',columns:'✍️'})[item.category]||'📁';
    const tag=document.createElement('span'); tag.className='library-tag'; tag.textContent=libraryCategoryLabel(item.category);
    const title=document.createElement('h3'); title.textContent=item.title || item.file_name || 'Untitled resource';
    const desc=document.createElement('p'); desc.textContent=item.description || 'Free learning resource from VetCare World.';
    const meta=document.createElement('small'); meta.textContent=item.file_size ? `${(item.file_size/1048576).toFixed(2)} MB` : 'Free resource';
    const link=document.createElement('a'); link.className='library-download'; link.href=item.public_url; link.target='_blank'; link.rel='noopener'; link.textContent='View / Download ↗';
    card.append(icon,tag,title,desc,meta,link); libraryGrid.appendChild(card);
  });
}
async function loadPublicLibrary() {
  if (!db || !libraryGrid) return;
  if (libraryStatus) libraryStatus.textContent='Loading published resources...';
  const {data,error}=await db.from('media_library').select('id,title,description,category,file_name,public_url,file_size,created_at').eq('status','published').order('created_at',{ascending:false}).limit(200);
  if(error){console.warn('Library load:',error.message); if(libraryStatus) libraryStatus.textContent='Library is being prepared. Please check again soon.'; return;}
  cachedLibraryItems=data||[]; if(libraryStatus) libraryStatus.textContent=`${cachedLibraryItems.length} free learning resource(s)`; renderPublicLibrary();
}
librarySearch?.addEventListener('input',renderPublicLibrary);
libraryCategory?.addEventListener('change', () => {
  const value = libraryCategory.value || 'all';
  document.querySelectorAll('[data-library-folder]').forEach(card => {
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
  document.querySelectorAll('[data-library-folder]').forEach(card => {
    const selected = card === selectedButton;
    card.classList.toggle('active', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  const active = document.getElementById('libraryActiveFolder');
  if (active) active.textContent = libraryCategoryLabel(value || 'all');
  renderPublicLibrary();
}
document.querySelectorAll('[data-library-folder]').forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    setActiveLibraryFolder(button.dataset.libraryFolder, button);
    document.getElementById('publicLibraryGrid')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
document.getElementById('libraryShowAll')?.addEventListener('click', () => setActiveLibraryFolder('all'));


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
    jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', mp4:'video/mp4', webm:'video/webm'
  };
  const detectedMime = mimeByExt[ext] || file.type;
  if (!Object.values(mimeByExt).includes(detectedMime)) {
    showAuthMessage('Unsupported file type. Use PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, WEBP, MP4 or WEBM.', true); return;
  }
  if (file.size > 25 * 1024 * 1024) { showAuthMessage('File is larger than 25 MB. Please choose a smaller file.', true); return; }

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
  } else {
    // Hidden until Supabase confirms the explicit admin role.
    isVetCareAdmin = false;
    hideAdminInterface();
    refreshAdminAccess(currentUser);
  }
}

logoutButtons.forEach(button => {
  button.addEventListener('click', async event => {
    event.preventDefault();
    if (!db) return;
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
  createCommunityAdminPage();
  hideAdminInterface();
  updateLanguage();

  if (!db) {
    updateAuthDisplay(null);
    if (libraryStatus) libraryStatus.textContent = 'Library connection is being configured.';
    return;
  }

  const { data, error } = await db.auth.getSession();
  if (error) console.warn('Session restore:', error.message);
  updateAuthDisplay(data?.session?.user || null);

  db.auth.onAuthStateChange((_event, session) => {
    updateAuthDisplay(session?.user || null);
  });

  await loadPosts();
  await loadPublicLibrary();
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
