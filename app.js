
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

  authBox.classList.remove('hidden');

  authBox.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  if (!currentUser && emailInput) {
    emailInput.focus();
  }
}

function closeVetCareLogin() {

  if (!authBox) return;

  authBox.classList.add('hidden');
}

document.getElementById('openLoginBtn')?.addEventListener(
  'click',
  openVetCareLogin
);

document.getElementById('closeLoginBtn')?.addEventListener(
  'click',
  closeVetCareLogin
);

document.addEventListener('keydown', event => {

  if (event.key === 'Escape') {

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


// 16. POSTS / COMMUNITY FEED
async function loadPosts() {
  const feed = document.getElementById('postsFeed') ||
               document.getElementById('communityFeed') ||
               document.getElementById('postsList');
  if (!feed || !db) return;

  const { data, error } = await db
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('Posts could not be loaded:', error.message);
    return;
  }
  if (!data || !data.length) return;

  feed.replaceChildren();
  data.forEach(post => {
    const card = document.createElement('article');
    card.className = 'post-card';

    const body = document.createElement('p');
    body.textContent = post.content || post.body || '';
    card.appendChild(body);

    const date = document.createElement('small');
    if (post.created_at) {
      date.textContent = new Date(post.created_at).toLocaleString();
      card.appendChild(date);
    }
    feed.appendChild(card);
  });
}

postBtn?.addEventListener('click', async event => {
  event.preventDefault();
  if (!currentUser) {
    showAuthMessage('Please log in before publishing a post.', true);
    openVetCareLogin();
    return;
  }
  if (!db || isPosting) return;

  const content = postText?.value.trim();
  if (!content) {
    showAuthMessage('Please write something before posting.', true);
    return;
  }

  isPosting = true;
  postBtn.disabled = true;
  try {
    const { error } = await db.from('posts').insert({
      user_id: currentUser.id,
      content
    });
    if (error) throw error;
    if (postText) postText.value = '';
    showAuthMessage('Your post has been published.');
    await loadPosts();
  } catch (error) {
    showAuthMessage('Post failed: ' + error.message, true);
  } finally {
    isPosting = false;
    postBtn.disabled = false;
  }
});


// 17. ADMIN RESOURCE LIBRARY
async function loadAdminResources() {
  if (!isVetCareAdmin || !db) return;

  const list = document.getElementById('adminResources') ||
               document.getElementById('adminMediaList') ||
               document.getElementById('resourceAdminList');
  if (!list) return;

  const { data, error } = await db
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Admin resources could not load:', error.message);
    list.textContent = 'Resources could not be loaded. Check Supabase policies.';
    return;
  }

  list.replaceChildren();
  (data || []).forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-resource-row';

    const name = document.createElement('span');
    name.textContent = item.title || item.file_name || item.path || 'Untitled resource';
    row.appendChild(name);

    const status = document.createElement('small');
    status.textContent = item.is_published ? 'Published' : 'Draft';
    row.appendChild(status);

    if (item.public_url || item.file_url) {
      const link = document.createElement('a');
      link.href = item.public_url || item.file_url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Open';
      row.appendChild(link);
    }

    list.appendChild(row);
  });
}

const adminUploadForm = document.getElementById('adminUploadForm');
adminUploadForm?.addEventListener('submit', async event => {
  event.preventDefault();

  if (!currentUser || !isVetCareAdmin || !db) {
    showAuthMessage('Only the verified administrator can upload resources.', true);
    return;
  }

  const fileInput = document.getElementById('adminFile');
  const titleInput = document.getElementById('adminTitle');
  const publishInput = document.getElementById('adminPublish');
  const file = fileInput?.files?.[0];

  if (!file) {
    showAuthMessage('Please select a file first.', true);
    return;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${currentUser.id}/${Date.now()}-${safeName}`;

  try {
    const { error: uploadError } = await db.storage
      .from('vetcare-library')
      .upload(storagePath, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicData } = db.storage
      .from('vetcare-library')
      .getPublicUrl(storagePath);

    const { error: insertError } = await db.from('media_library').insert({
      title: titleInput?.value.trim() || file.name,
      file_name: file.name,
      storage_path: storagePath,
      public_url: publicData?.publicUrl || null,
      is_published: !!publishInput?.checked,
      uploaded_by: currentUser.id
    });
    if (insertError) throw insertError;

    showAuthMessage('Resource uploaded successfully.');
    adminUploadForm.reset();
    await loadAdminResources();
  } catch (error) {
    console.error('Admin upload failed:', error);
    showAuthMessage('Upload failed: ' + error.message, true);
  }
});


// 18. AUTH STATE + LOGOUT
function updateAuthDisplay(user) {
  currentUser = user || null;
  const loggedIn = !!currentUser;

  if (signupBtn) signupBtn.style.display = loggedIn ? 'none' : '';
  if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : '';
  logoutButtons.forEach(button => {
    button.style.display = loggedIn ? '' : 'none';
  });
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
  hideAdminInterface();
  updateLanguage();

  if (!db) {
    updateAuthDisplay(null);
    return;
  }

  const { data, error } = await db.auth.getSession();
  if (error) console.warn('Session restore:', error.message);
  updateAuthDisplay(data?.session?.user || null);

  db.auth.onAuthStateChange((_event, session) => {
    updateAuthDisplay(session?.user || null);
  });

  await loadPosts();
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
