'use strict';

/* =========================================================
   VETCARE WORLD — STABLE FRONT-END APPLICATION
   Public browsing | member-only posting | bilingual UI
   ========================================================= */

const SUPABASE_URL = 'https://vhtsqtloiyhaomigvmqu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KIlNronqSHSqk2jcHqX7uw_v82o9ae1';
const APP_REDIRECT_URL = new URL('./', window.location.href).href;

let db = null;
let currentUser = null;
let isPosting = false;
let currentLanguage = 'en';

if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} else {
  console.error('Supabase library did not load.');
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const emailInput = $('#emailInput');
const passwordInput = $('#passwordInput');
const signupBtn = $('#signupBtn');
const loginBtn = $('#loginBtn');
const authMessage = $('#authMessage');
const authBox = $('#authBox');
const postBtn = $('#postBtn');
const postText = $('#postText');
const feed = $('#feed');
const menuBtn = $('#menuBtn');
const menuPanel = $('#menuPanel');

function showAuthMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.style.color = isError ? '#b42318' : '#176b45';
}

function updateAuthDisplay(user) {
  currentUser = user || null;
  const loggedIn = Boolean(currentUser);
  if (signupBtn) signupBtn.hidden = loggedIn;
  if (loginBtn) loginBtn.hidden = loggedIn;
  $$('#logoutBtn').forEach(button => { button.hidden = !loggedIn; });
  if (postBtn) postBtn.textContent = loggedIn ? 'Post' : 'Login to post';
  document.body.classList.toggle('logged-in', loggedIn);
  if (!loggedIn) { const adminNav = $('#adminNavBtn'); if (adminNav) adminNav.hidden = true; }
}

/* Login dialog: one handler only; never scrolls the page or shifts the box. */
function openVetCareLogin() {
  if (!authBox) return;
  authBox.classList.remove('hidden');
  authBox.setAttribute('aria-hidden', 'false');
  menuPanel?.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => emailInput?.focus(), 60);
}
function closeVetCareLogin() {
  if (!authBox) return;
  authBox.classList.add('hidden');
  authBox.setAttribute('aria-hidden', 'true');
}
$('#openLoginBtn')?.addEventListener('click', openVetCareLogin);
$('#closeLoginBtn')?.addEventListener('click', closeVetCareLogin);
authBox?.addEventListener('click', event => {
  if (event.target === authBox) closeVetCareLogin();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeVetCareLogin();
    $('.knowledge-detail-overlay')?.remove();
    menuPanel?.classList.remove('menu-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }
});

/* Five navigation destinations work on desktop menu and mobile bar. */
const pageIds = ['home', 'knowledge', 'market', 'groups', 'earning', 'admin'];
function showPage(pageId) {
  if (!pageIds.includes(pageId)) return;
  const target = document.getElementById(pageId);
  if (!target || !target.classList.contains('page')) return;
  $$('.page').forEach(page => page.classList.toggle('hidden', page !== target));
  $$('[data-target]').forEach(button => {
    const active = button.dataset.target === pageId;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  menuPanel?.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'auto' });
}
$$('[data-target]').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    showPage(button.dataset.target);
  });
});
menuBtn?.addEventListener('click', () => {
  const open = menuPanel?.classList.toggle('menu-open') || false;
  menuBtn.setAttribute('aria-expanded', String(open));
});

/* Language switch */
function updateLanguage() {
  $$('[data-en][data-ur]').forEach(element => {
    const value = element.getAttribute(currentLanguage === 'ur' ? 'data-ur' : 'data-en');
    if (value !== null) element.textContent = value;
  });
  const langBtn = $('#langBtn');
  if (langBtn) langBtn.textContent = currentLanguage === 'en' ? 'اردو' : 'English';
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ur' ? 'rtl' : 'ltr';
  document.body.classList.toggle('urdu', currentLanguage === 'ur');
}
$('#langBtn')?.addEventListener('click', () => {
  currentLanguage = currentLanguage === 'en' ? 'ur' : 'en';
  updateLanguage();
});

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



/* Authentication */
signupBtn?.addEventListener('click', async event => {
  event.preventDefault();
  if (!db) return showAuthMessage('Database connection unavailable. Please try again later.', true);
  const email = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';
  if (!email || !password) return showAuthMessage('Please enter your email and password.', true);
  if (password.length < 8) return showAuthMessage('Password must contain at least 8 characters.', true);
  signupBtn.disabled = true;
  showAuthMessage('Creating your account...');
  try {
    const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: APP_REDIRECT_URL } });
    if (error) throw error;
    if (data.session && data.user) {
      updateAuthDisplay(data.user);
      closeVetCareLogin();
      showAuthMessage('Account created successfully. Welcome to VetCare World!');
    } else {
      showAuthMessage('Account created. Please check your email to confirm your account.');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showAuthMessage('Signup failed: ' + (error.message || 'Please try again.'), true);
  } finally {
    signupBtn.disabled = false;
  }
});

loginBtn?.addEventListener('click', async event => {
  event.preventDefault();
  if (!db) return showAuthMessage('Database connection unavailable. Please try again later.', true);
  const email = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';
  if (!email || !password) return showAuthMessage('Please enter your email and password.', true);
  loginBtn.disabled = true;
  showAuthMessage('Logging in...');
  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    updateAuthDisplay(data.user);
    closeVetCareLogin();
  } catch (error) {
    console.error('Login error:', error);
    showAuthMessage('Login failed: ' + (error.message || 'Please check your details.'), true);
  } finally {
    loginBtn.disabled = false;
  }
});

$$('#logoutBtn').forEach(button => button.addEventListener('click', async () => {
  if (!db) return;
  button.disabled = true;
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;
    updateAuthDisplay(null);
    showPage('home');
    showAuthMessage('You have logged out.');
  } catch (error) {
    console.error('Logout error:', error);
    showAuthMessage('Logout failed: ' + (error.message || 'Please try again.'), true);
  } finally {
    button.disabled = false;
  }
}));

/* Public feed: reading is public; posting requires login. */
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}
function renderPost(post) {
  const article = document.createElement('article');
  article.className = 'post';
  const author = post.author_name || post.email || 'VetCare Member';
  const content = post.content || post.body || post.text || '';
  const date = post.created_at ? new Date(post.created_at).toLocaleString() : 'Community post';
  article.innerHTML = `<div class="post-head"><span class="avatar">👨‍🌾</span><div><b>${escapeHTML(author)}</b><small>${escapeHTML(date)}</small></div></div><p>${escapeHTML(content).replace(/\n/g, '<br>')}</p><div class="post-actions"><button class="like" type="button">♡ Like</button><button class="share" type="button">↗ Share</button></div>`;
  return article;
}
async function loadPosts() {
  if (!db || !feed) return;
  try {
    const { data, error } = await db.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      feed.replaceChildren(...data.map(renderPost));
    }
  } catch (error) {
    // Keep the sample posts visible when the optional public posts table is not configured.
    console.warn('Community feed could not be refreshed:', error.message || error);
  }
}
postBtn?.addEventListener('click', async () => {
  if (!currentUser) {
    openVetCareLogin();
    showAuthMessage('Please log in to publish a community post.');
    return;
  }
  if (!db || isPosting) return;
  const content = postText?.value.trim() || '';
  if (!content) {
    postText?.focus();
    return;
  }
  isPosting = true;
  postBtn.disabled = true;
  postBtn.textContent = 'Publishing...';
  try {
    const { data, error } = await db.from('posts').insert({
      user_id: currentUser.id,
      content
    }).select().single();
    if (error) throw error;
    if (data && feed) feed.prepend(renderPost(data));
    if (postText) postText.value = '';
  } catch (error) {
    console.error('Post error:', error);
    showAuthMessage('Post could not be published. Check that the Supabase posts table and access policies are configured.', true);
  } finally {
    isPosting = false;
    postBtn.disabled = false;
    postBtn.textContent = 'Post';
  }
});

/* Like is a local visual reaction; share uses the device share sheet when available. */
document.addEventListener('click', async event => {
  const like = event.target.closest('.like');
  if (like) {
    const active = like.classList.toggle('liked');
    like.textContent = active ? '♥ Liked' : '♡ Like';
    return;
  }
  const share = event.target.closest('.share');
  if (share) {
    const post = share.closest('.post');
    const text = post?.querySelector('p')?.textContent || 'VetCare World';
    try {
      if (navigator.share) await navigator.share({ title: 'VetCare World', text, url: window.location.href });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text + '\n' + window.location.href);
        share.textContent = '✓ Copied';
      } else {
        showAuthMessage('Sharing is not supported by this browser.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.warn('Share failed:', error);
    }
  }
});

/* Secure admin tools: database and Storage policies remain the authority. */
async function loadPublicResources() {
  const list = $('#publicResourceList');
  if (!list || !db) return;
  const { data, error } = await db.from('media_library').select('id,title,description,category,file_path,mime_type,file_size,created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(50);
  if (error) { console.warn('Public library is not ready:', error.message); return; }
  list.replaceChildren();
  if (!data?.length) { list.textContent = 'No published resources yet.'; return; }
  data.forEach(item => {
    const card = document.createElement('article'); card.className = 'admin-resource';
    const title = document.createElement('strong'); title.textContent = item.title;
    const desc = document.createElement('p'); desc.textContent = item.description || '';
    const link = document.createElement('a'); link.href = db.storage.from('vetcare-library').getPublicUrl(item.file_path).data.publicUrl; link.target = '_blank'; link.rel = 'noopener'; link.textContent = item.category === 'videos' ? 'Watch / Open video' : 'Open / View resource';
    card.append(title, desc, link); list.append(card);
  });
}

const ADMIN_BUCKET = 'vetcare-library';
let isVetCareAdmin = false;
const adminMessage = $('#adminMessage');
function setAdminMessage(message, isError = false) {
  if (!adminMessage) return;
  adminMessage.textContent = message;
  adminMessage.style.color = isError ? '#b42318' : '#176b45';
}
async function refreshAdminAccess(user) {
  isVetCareAdmin = false;
  const nav = $('#adminNavBtn');
  if (nav) nav.hidden = true;
  if (!db || !user) return;
  try {
    const { data, error } = await db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    isVetCareAdmin = data?.role === 'admin';
    if (nav) nav.hidden = !isVetCareAdmin;
    if (isVetCareAdmin) await loadAdminResources();
  } catch (error) {
    console.warn('Admin role check failed:', error.message || error);
    setAdminMessage('Admin access could not be verified. Please refresh after setup.', true);
  }
}
function safeFileName(name) {
  return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-100) || 'resource';
}
function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
async function loadAdminResources() {
  const list = $('#adminResourceList');
  if (!list || !db || !isVetCareAdmin) return;
  list.textContent = 'Loading…';
  const { data, error } = await db.from('media_library').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) { list.textContent = 'Could not load resources: ' + error.message; return; }
  list.replaceChildren();
  if (!data?.length) { list.textContent = 'No resources uploaded yet.'; return; }
  data.forEach(item => {
    const card = document.createElement('article'); card.className = 'admin-resource';
    const title = document.createElement('strong'); title.textContent = item.title;
    const desc = document.createElement('p'); desc.textContent = item.description || '';
    const meta = document.createElement('p'); meta.className = 'resource-meta'; meta.textContent = `${item.category} • ${item.status} • ${formatBytes(item.file_size || 0)}`;
    const link = document.createElement('a'); link.href = db.storage.from(ADMIN_BUCKET).getPublicUrl(item.file_path).data.publicUrl; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open file';
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.textContent = item.status === 'published' ? 'Move to Draft' : 'Publish';
    toggle.addEventListener('click', async () => {
      const next = item.status === 'published' ? 'draft' : 'published';
      const { error: updateError } = await db.from('media_library').update({ status: next }).eq('id', item.id);
      if (updateError) { setAdminMessage(updateError.message, true); return; }
      await loadAdminResources();
    });
    const del = document.createElement('button'); del.type = 'button'; del.className = 'danger'; del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      if (!window.confirm(`Delete “${item.title}”?`)) return;
      const { error: storageError } = await db.storage.from(ADMIN_BUCKET).remove([item.file_path]);
      if (storageError) { setAdminMessage(storageError.message, true); return; }
      const { error: rowError } = await db.from('media_library').delete().eq('id', item.id);
      if (rowError) { setAdminMessage(rowError.message, true); return; }
      await loadAdminResources(); setAdminMessage('Resource deleted.');
    });
    card.append(title, desc, meta, link, document.createElement('br'), toggle, del); list.append(card);
  });
}
$('#refreshResourcesBtn')?.addEventListener('click', loadAdminResources);
$('#adminUploadForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!db || !currentUser || !isVetCareAdmin) { setAdminMessage('Admin login required.', true); return; }
  const file = $('#resourceFile')?.files?.[0];
  const title = $('#resourceTitle')?.value.trim();
  if (!file || !title) { setAdminMessage('Please enter a title and choose a file.', true); return; }
  if (file.size > 25 * 1024 * 1024) { setAdminMessage('File is larger than 25 MB.', true); return; }
  const button = $('#resourceUploadBtn'); button.disabled = true; setAdminMessage('Uploading…');
  const path = `${currentUser.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  try {
    const { error: uploadError } = await db.storage.from(ADMIN_BUCKET).upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    if (uploadError) throw uploadError;
    const record = {
      title, description: $('#resourceDescription')?.value.trim() || '',
      category: $('#resourceCategory')?.value || 'notes', file_path: path,
      mime_type: file.type || 'application/octet-stream', file_size: file.size,
      status: $('#resourceStatus')?.value || 'draft', created_by: currentUser.id
    };
    const { error: insertError } = await db.from('media_library').insert(record);
    if (insertError) {
      await db.storage.from(ADMIN_BUCKET).remove([path]);
      throw insertError;
    }
    $('#adminUploadForm').reset(); setAdminMessage('Upload complete.'); await loadAdminResources();
  } catch (error) {
    console.error('Resource upload failed:', error);
    setAdminMessage('Upload failed: ' + (error.message || 'Please check Supabase setup.'), true);
  } finally { button.disabled = false; }
});

/* Restore the existing session and load the public feed. */
async function initializeApp() {
  if (db) {
    try {
      const { data, error } = await db.auth.getSession();
      if (error) throw error;
      updateAuthDisplay(data.session?.user || null);
      await refreshAdminAccess(data.session?.user || null);
      db.auth.onAuthStateChange((_event, session) => {
        updateAuthDisplay(session?.user || null);
        refreshAdminAccess(session?.user || null);
      });
    } catch (error) {
      console.warn('Session could not be restored:', error.message || error);
      updateAuthDisplay(null);
    }
  } else {
    updateAuthDisplay(null);
  }
  loadPosts();
  loadPublicResources();
}
initializeApp();

/* Optional PWA service worker. The website still works without sw.js. */
if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('Service worker registration skipped:', error);
    });
  });
}

