
'use strict';

// ==========================================
// VETCARE WORLD - MAIN APPLICATION
// Public browsing + Member authentication
// ==========================================

// 1. SUPABASE CONNECTION

const SUPABASE_URL = 'https://vhtsqtloiyhaomigvmqu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KIlNronqSHSqk2jcHqX7uw_v82o9ae1';

// Use the current website address for email confirmation.
const APP_REDIRECT_URL = new URL('./', window.location.href).href;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const originalSignal = options.signal;

  const abortOriginal = () => controller.abort();

  if (originalSignal) {
    if (originalSignal.aborted) {
      controller.abort();
    } else {
      originalSignal.addEventListener('abort', abortOriginal, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);

    if (originalSignal) {
      originalSignal.removeEventListener('abort', abortOriginal);
    }
  }
}

let db = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      global: {
        fetch: fetchWithTimeout
      },
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

// 2. COMMON ELEMENTS

const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');

let currentUser = null;

function showAuthMessage(message, isError = false) {
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.style.color = isError ? '#b42318' : '#176b45';
}

function updateAuthDisplay(user) {
  currentUser = user || null;

  if (signupBtn) signupBtn.style.display = user ? 'none' : 'inline-block';
  if (loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
  if (logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';

  if (emailInput) emailInput.disabled = !!user;
  if (passwordInput) passwordInput.disabled = !!user;

  document.body.classList.toggle('logged-in', !!user);
}

// 3. PAGE NAVIGATION

const pages = [...document.querySelectorAll('.page')];

function showPage(id) {
  const targetPage = document.getElementById(id);

  if (!targetPage || !targetPage.classList.contains('page')) return;

  pages.forEach(page => {
    page.classList.toggle('hidden', page.id !== id);
  });

  document.querySelectorAll('[data-target]').forEach(button => {
    button.classList.toggle('active', button.dataset.target === id);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-target]').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    showPage(button.dataset.target);
  });
});

// 4. SIGN UP

/* ==========================================
   VETCARE WORLD - KNOWLEDGE ARTICLES
========================================== */

(() => {
  const articles = [
    {
      match: ['animal health', 'disease'],
      icon: '🩺',
      title: 'Animal Health',
      intro: 'Recognizing illness early is one of the most important parts of livestock care.',
      urdu: 'جانوروں کی صحت کی حفاظت کے لیے بیماری کی ابتدائی علامات پہچاننا بہت ضروری ہے۔',
      sections: [
        {
          heading: 'Common warning signs',
          urdu: 'بیماری کی عام علامات',
          points: [
            'Loss of appetite or reduced water intake',
            'Fever, weakness or unusual behavior',
            'Coughing, nasal discharge or breathing difficulty',
            'Diarrhea, bloating or reduced milk production'
          ]
        },
        {
          heading: 'Prevention and daily care',
          urdu: 'بچاؤ اور روزانہ کی دیکھ بھال',
          points: [
            'Provide clean drinking water and suitable feed.',
            'Keep animal housing clean and well ventilated.',
            'Follow a vaccination and parasite-control plan advised by a veterinarian.',
            'Isolate sick animals and seek veterinary examination.'
          ]
        }
      ],
      warning: 'Emergency signs such as difficulty breathing, inability to stand, severe bloat, heavy bleeding or sudden multiple deaths require urgent veterinary help.'
    },
    {
      match: ['feed', 'nutrition'],
      icon: '🌾',
      title: 'Feed & Nutrition',
      intro: 'Balanced nutrition supports growth, milk production, reproduction and animal health.',
      urdu: 'متوازن خوراک جانور کی نشوونما، دودھ کی پیداوار، افزائش اور صحت کے لیے بنیادی اہمیت رکھتی ہے۔',
      sections: [
        {
          heading: 'Main parts of a balanced ration',
          urdu: 'متوازن خوراک کے بنیادی اجزاء',
          points: [
            'Green fodder and suitable dry roughage',
            'Concentrate feed according to production needs',
            'Appropriate minerals and salt',
            'Fresh, clean drinking water at all times'
          ]
        },
        {
          heading: 'Good feeding practices',
          urdu: 'خوراک دینے کے بہتر طریقے',
          points: [
            'Adjust feed according to species, age, body weight and production.',
            'Introduce feed changes gradually.',
            'Store feed in a clean, dry and protected place.',
            'Avoid moldy, spoiled or contaminated feed.'
          ]
        }
      ],
      warning: 'There is no single ration suitable for every animal. A feeding plan should be adjusted to the animal and local feed resources.'
    },
    {
      match: ['breed', 'breeds'],
      icon: '🐄',
      title: 'Livestock Breeds',
      intro: 'Choosing suitable breeds can improve farm productivity and profitability.',
      urdu: 'مناسب نسل کا انتخاب فارم کی پیداوار، جانوروں کی کارکردگی اور منافع بہتر بنانے میں مدد دیتا ہے۔',
      sections: [
        {
          heading: 'Examples of important Pakistani breeds',
          urdu: 'پاکستان کی چند اہم نسلیں',
          points: [
            'Cattle: Sahiwal, Red Sindhi and Cholistani',
            'Buffalo: Nili-Ravi and Kundi',
            'Goats: Beetal, Teddy and Kamori',
            'Sheep: Lohi, Kajli and Thalli'
          ]
        },
        {
          heading: 'How to select breeding animals',
          urdu: 'افزائش کے لیے جانور کا انتخاب',
          points: [
            'Check health, body condition and physical structure.',
            'Review available production and breeding records.',
            'Prefer animals with known parentage where possible.',
            'Avoid breeding animals with known inherited defects.'
          ]
        }
      ],
      warning: 'Breed performance depends on climate, feed, management and individual animal genetics. Local suitability matters.'
    },
    {
      match: ['farm management', 'management'],
      icon: '🏡',
      title: 'Farm Management',
      intro: 'Good farm management improves animal welfare, hygiene and productivity.',
      urdu: 'بہتر فارم مینجمنٹ سے جانوروں کی فلاح، صفائی، پیداوار اور منافع میں بہتری آتی ہے۔',
      sections: [
        {
          heading: 'Housing and hygiene',
          urdu: 'رہائش اور صفائی',
          points: [
            'Provide enough space for animals to rest comfortably.',
            'Ensure good ventilation and protection from extreme weather.',
            'Keep floors dry and remove manure regularly.',
            'Clean feeding and watering equipment.'
          ]
        },
        {
          heading: 'Daily farm routine',
          urdu: 'فارم کا روزانہ معمول',
          points: [
            'Observe every animal for changes in appetite or behavior.',
            'Check water, feed and housing conditions.',
            'Record milk yield, births, illness and treatments.',
            'Maintain a separate clean area for sick or newly arrived animals.'
          ]
        }
      ],
      warning: 'Keep treatment, vaccination, breeding and production records. Follow local veterinary advice for herd health planning.'
    }
  ];

  function openArticle(article) {
    document.querySelector('.knowledge-detail-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'knowledge-detail-overlay';
    overlay.setAttribute('role', 'presentation');

    const detail = document.createElement('article');
    detail.className = 'knowledge-detail';
    detail.setAttribute('role', 'dialog');
    detail.setAttribute('aria-modal', 'true');
    detail.setAttribute('aria-label', article.title);

    const close = document.createElement('button');
    close.className = 'detail-close';
    close.type = 'button';
    close.textContent = '✕ Close';
    close.addEventListener('click', () => overlay.remove());

    const heading = document.createElement('h2');
    heading.textContent = article.icon + ' ' + article.title;

    const intro = document.createElement('p');
    intro.textContent = article.intro;

    const urdu = document.createElement('p');
    urdu.className = 'detail-urdu';
    urdu.textContent = article.urdu;
    urdu.dir = 'rtl';

    detail.append(close, heading, intro, urdu);

    article.sections.forEach(section => {
      const h3 = document.createElement('h3');
      h3.textContent = section.heading;

      const urduHeading = document.createElement('p');
      urduHeading.className = 'detail-urdu';
      urduHeading.textContent = section.urdu;
      urduHeading.dir = 'rtl';

      const list = document.createElement('ul');

      section.points.forEach(point => {
        const item = document.createElement('li');
        item.textContent = point;
        list.appendChild(item);
      });

      detail.append(h3, urduHeading, list);
    });

    const warning = document.createElement('p');
    warning.className = 'detail-warning';
    warning.textContent = '⚕️ Veterinary note: ' + article.warning;

    detail.appendChild(warning);
    overlay.appendChild(detail);

    overlay.addEventListener('click', event => {
      if (event.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    close.focus();
  }

  const knowledgeSection = document.getElementById('knowledge');

  if (!knowledgeSection) return;

  knowledgeSection.querySelectorAll('.knowledge-card, .tile').forEach(card => {
    const text = card.textContent.toLowerCase();

    const article = articles.find(item =>
      item.match.some(word => text.includes(word))
    );

    if (!article) return;

    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.addEventListener('click', () => openArticle(article));

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openArticle(article);
      }
    });
  });
})();


if (signupBtn) {
  signupBtn.addEventListener('click', async event => {
    event.preventDefault();

    if (!db) {
      showAuthMessage('Connection unavailable. Please refresh the page.', true);
      return;
    }

    const email = emailInput?.value.trim();
    const password = passwordInput?.value || '';

    if (!email || !password) {
      showAuthMessage('Please enter your email and password.', true);
      return;
    }

    if (password.length < 8) {
      showAuthMessage('Password must contain at least 8 characters.', true);
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
        showAuthMessage('Account created successfully. Welcome to VetCare World!');
      } else {
        showAuthMessage('Account created. Please check your email to confirm your account.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showAuthMessage('Signup failed: ' + error.message, true);
    } finally {
      signupBtn.disabled = false;
    }
  });
}

// 5. LOGIN

if (loginBtn) {
  loginBtn.addEventListener('click', async event => {
    event.preventDefault();

    if (!db) {
      showAuthMessage('Connection unavailable. Please refresh the page.', true);
      return;
    }

    const email = emailInput?.value.trim();
    const password = passwordInput?.value || '';

    if (!email || !password) {
      showAuthMessage('Please enter your email and password.', true);
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
      showAuthMessage('Login successful. Welcome!');
    } catch (error) {
      console.error('Login error:', error);
      showAuthMessage('Login failed: ' + error.message, true);
    } finally {
      loginBtn.disabled = false;
    }
  });
}

// 6. LOGOUT

if (logoutBtn) {
  logoutBtn.addEventListener('click', async event => {
    event.preventDefault();

    if (!db) return;

    logoutBtn.disabled = true;

    try {
      const { error } = await db.auth.signOut();

      if (error) throw error;

      updateAuthDisplay(null);

      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';

      showAuthMessage('You have logged out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
      showAuthMessage('Logout failed: ' + error.message, true);
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

// 7. CHECK LOGIN SESSION

async function checkSession() {
  if (!db) {
    showAuthMessage('Website database connection is unavailable.', true);
    return;
  }

  try {
    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    updateAuthDisplay(data.session ? data.session.user : null);
  } catch (error) {
    console.error('Session error:', error);
    showAuthMessage('Could not check login session: ' + error.message, true);
  }
}

if (db) {
  db.auth.onAuthStateChange((_event, session) => {
    updateAuthDisplay(session ? session.user : null);
  });
}

// 8. CREATE POST ELEMENT

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'post database-post';

  const head = document.createElement('div');
  head.className = 'post-head';

  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.textContent = '👤';

  const details = document.createElement('div');

  const author = document.createElement('b');
  author.textContent = 'VetCare World Member';

  const date = document.createElement('small');
  date.textContent = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : 'Community post';

  details.append(author, date);
  head.append(avatar, details);

  const content = document.createElement('p');
  content.textContent = post.content || '';

  const actions = document.createElement('div');
  actions.className = 'post-actions';

  const likeButton = document.createElement('button');
  likeButton.type = 'button';
  likeButton.className = 'like';
  likeButton.textContent = '♡ Like';

  const shareButton = document.createElement('button');
  shareButton.type = 'button';
  shareButton.className = 'share';
  shareButton.textContent = '↗ Share';

  actions.append(likeButton, shareButton);
  article.append(head, content, actions);

  wireActions(article);

  return article;
}

// 9. LOAD PUBLIC POSTS
// Visitors can read posts without logging in.

async function loadPosts() {
  const feed = document.getElementById('feed');

  if (!feed || !db) return false;

  try {
    const { data, error } = await db
      .from('posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    feed.querySelectorAll('.database-post').forEach(post => post.remove());

    (data || []).forEach(post => {
      feed.appendChild(createPostElement(post));
    });

    return true;
  } catch (error) {
    console.error('Could not load posts:', error);

    // Keep the public website usable even if the posts table
    // has not been configured yet.
    const oldNotice = feed.querySelector('.feed-error');
    if (oldNotice) oldNotice.remove();

    const notice = document.createElement('p');
    notice.className = 'feed-error';
    notice.textContent = 'Community posts are temporarily unavailable.';
    feed.appendChild(notice);

    return false;
  }
}

// 10. PUBLISH POST
// Only logged-in members can publish.

const postBtn = document.getElementById('postBtn');
const postText = document.getElementById('postText');

let isPosting = false;

async function publishPost(event) {
  if (event) event.preventDefault();

  if (isPosting) return;

  if (!currentUser) {
    showAuthMessage('Please log in to publish a community post.', true);

    const authBox = document.getElementById('authBox');

    if (authBox) {
      authBox.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    return;
  }

  if (!db) {
    showAuthMessage('Database connection is unavailable.', true);
    return;
  }

  if (!postText) {
    showAuthMessage('Post text box was not found.', true);
    return;
  }

  const value = postText.value.trim();

  if (!value) {
    showAuthMessage('Please write something before posting.', true);
    return;
  }

  isPosting = true;

  const originalText = postBtn ? postBtn.textContent : 'Post';

  if (postBtn) {
    postBtn.disabled = true;
    postBtn.textContent = 'Posting...';
  }

  try {
    const { error } = await db
      .from('posts')
      .insert({
        user_id: currentUser.id,
        content: value
      });

    if (error) throw error;

    postText.value = '';
    showAuthMessage('Your post has been published!');

    await loadPosts();
  } catch (error) {
    console.error('Post error:', error);

    if (error.name === 'AbortError') {
      showAuthMessage('Request timed out. Please try again.', true);
    } else {
      showAuthMessage('Could not publish post: ' + error.message, true);
    }
  } finally {
    isPosting = false;

    if (postBtn) {
      postBtn.disabled = false;
      postBtn.textContent = originalText;
    }
  }
}

if (postBtn) {
  postBtn.type = 'button';
  postBtn.addEventListener('click', publishPost);
}

const postForm = postBtn?.closest('form');

if (postForm) {
  postForm.addEventListener('submit', publishPost);
}

// 11. LIKE AND SHARE ACTIONS

function wireActions(root = document) {
  root.querySelectorAll('.like').forEach(button => {
    if (button.dataset.ready) return;

    button.dataset.ready = '1';

    button.addEventListener('click', event => {
      event.preventDefault();

      const liked = button.dataset.liked === 'true';
      button.dataset.liked = String(!liked);
      button.textContent = liked ? '♡ Like' : '♥ Liked';
    });
  });

  root.querySelectorAll('.share').forEach(button => {
    if (button.dataset.ready) return;

    button.dataset.ready = '1';

    button.addEventListener('click', async event => {
      event.preventDefault();

      const shareUrl = window.location.href;

      try {
        if (navigator.share) {
          await navigator.share({
            title: 'VetCare World',
            text: 'Visit VetCare World - Livestock Knowledge and Community',
            url: shareUrl
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          button.textContent = '✓ Link copied';
        } else {
          button.textContent = 'Copy link: ' + shareUrl;
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          button.textContent = 'Sharing unavailable';
        }
      }
    });
  });
}

// 12. LANGUAGE SWITCH

let urdu = false;

const langBtn = document.getElementById('langBtn');

if (langBtn) {
  langBtn.addEventListener('click', event => {
    event.preventDefault();

    urdu = !urdu;

    document.body.classList.toggle('urdu', urdu);
    document.documentElement.lang = urdu ? 'ur' : 'en';
    document.documentElement.dir = urdu ? 'rtl' : 'ltr';

    langBtn.textContent = urdu ? 'English' : 'اردو';

    document.querySelectorAll('[data-en][data-ur]').forEach(element => {
      element.textContent = urdu
        ? element.dataset.ur
        : element.dataset.en;
    });
  });
}

// 13. START APPLICATION

wireActions();
checkSession();
loadPosts();

// 14. REGISTER SERVICE WORKER

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(error => {
        console.error('Service Worker registration error:', error);
      });
  });
      }

/* ==========================================
   VETCARE WORLD - LOGIN PANEL INTEGRATION
========================================== */

function openVetCareLogin() {
  const authBox = document.getElementById('authBox');

  if (authBox) {
    authBox.classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('emailInput')?.focus();
    }, 100);
  }
}

function closeVetCareLogin() {
  const authBox = document.getElementById('authBox');

  if (authBox) {
    authBox.classList.add('hidden');
  }
}

// Open login from menu
document.getElementById('openLoginBtn')?.addEventListener('click', () => {
  openVetCareLogin();
});

// Close login panel
document.getElementById('closeLoginBtn')?.addEventListener('click', () => {
  closeVetCareLogin();
});

// Press Escape to close login
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeVetCareLogin();
    document.getElementById('menuPanel')?.classList.remove('menu-open');
  }
});

// If user logs in, close login panel
if (db) {
  db.auth.onAuthStateChange((_event, session) => {
    if (session) {
      closeVetCareLogin();
    }
  });
}

// Ask visitors to login before publishing
// Existing publishPost handler will be stopped for visitors.
postBtn?.addEventListener('click', event => {
  if (!currentUser) {
    event.preventDefault();
    event.stopImmediatePropagation();

    openVetCareLogin();
    showAuthMessage('Please log in to publish a community post.', true);
  }
}, true);

/* ==========================================
   VETCARE WORLD - KNOWLEDGE CARD CLICK FIX
========================================== */

(() => {
  
const knowledgeData = {
  health: {
    icon: '🩺',
    title: 'Animal Health | جانوروں کی صحت',
    intro: 'A practical guide to livestock health, disease prevention and veterinary care.',
    urdu: 'مویشیوں کی صحت، بیماریوں سے بچاؤ اور بہتر ویٹرنری دیکھ بھال کے لیے عملی رہنمائی۔',
    topics: [
      ['1. Common Diseases | عام بیماریاں',
       'Important livestock diseases include mastitis, foot and mouth disease, hemorrhagic septicemia, black quarter, enterotoxaemia, pneumonia and parasitic diseases. Early recognition and veterinary attention can reduce losses.',
       'اہم بیماریوں میں تھنوں کی سوزش، منہ کھر، گل گھوٹو، کالا یرقان، انٹروٹوکسیمیا، نمونیا اور پیٹ کے کیڑے شامل ہیں۔ بروقت علامات پہچاننا اور ڈاکٹر سے رابطہ کرنا نقصان کم کرتا ہے۔'],

      ['2. Warning Signs | بیماری کی علامات',
       'Watch for fever, loss of appetite, depression, coughing, difficult breathing, diarrhea, abnormal discharge, lameness, swelling and reduced milk production. Record when symptoms started.',
       'بخار، بھوک کی کمی، سستی، کھانسی، سانس میں دشواری، دست، غیر معمولی رطوبت، لنگڑاہٹ، سوجن اور دودھ میں کمی پر نظر رکھیں۔ علامات شروع ہونے کا وقت بھی نوٹ کریں۔'],

      ['3. Vaccination | ویکسینیشن',
       'Prepare a vaccination schedule with a qualified veterinarian according to local disease risks, animal age and previous vaccination history. Maintain vaccine cold-chain and record every dose.',
       'علاقے میں پھیلنے والی بیماریوں، جانور کی عمر اور سابقہ ویکسینیشن کے مطابق مستند ویٹرنری ڈاکٹر سے شیڈول بنوائیں۔ ویکسین کو مناسب ٹھنڈک میں رکھیں اور ہر خوراک کا ریکارڈ بنائیں۔'],

      ['4. Parasite Control | کیڑوں اور چیچڑوں کا کنٹرول',
       'Internal worms and external parasites can affect growth, milk production and health. Use veterinary guidance for testing, deworming and tick control. Avoid repeated unnecessary treatments.',
       'پیٹ کے کیڑے اور بیرونی طفیلیے نشوونما، دودھ اور صحت متاثر کرتے ہیں۔ ٹیسٹ، ڈی ورمنگ اور چیچڑوں کے کنٹرول کے لیے ڈاکٹر سے مشورہ کریں۔ بلا ضرورت بار بار دوا نہ دیں۔'],

      ['5. Biosecurity | بیماریوں سے حفاظت',
       'Isolate sick or newly purchased animals, clean equipment, control visitors, dispose of waste safely and avoid sharing needles. Keep feed and water protected from contamination.',
       'بیمار اور نئے خریدے گئے جانور الگ رکھیں، آلات صاف کریں، غیر ضروری افراد کی آمد محدود کریں، فضلہ محفوظ طریقے سے ٹھکانے لگائیں اور سرنج یا سوئی مشترکہ استعمال نہ کریں۔'],

      ['6. Emergency Care | ہنگامی دیکھ بھال',
       'Severe breathing difficulty, inability to stand, bloat, heavy bleeding, poisoning, difficult birth or sudden death require urgent veterinary attention. Do not delay treatment or give random medicines.',
       'سانس کی شدید تکلیف، کھڑا نہ ہو پانا، پیٹ کا شدید پھولنا، زیادہ خون بہنا، زہر خورانی، مشکل زچگی یا اچانک موت کی صورت میں فوری ڈاکٹر بلائیں۔ خود سے نامعلوم ادویات استعمال نہ کریں۔']
    ]
  },

  feed: {
    icon: '🌾',
    title: 'Feed & Nutrition | خوراک اور غذائیت',
    intro: 'Understand balanced feeding for healthy animals and better farm production.',
    urdu: 'صحت مند جانوروں اور بہتر پیداوار کے لیے متوازن خوراک کی مکمل رہنمائی۔',
    topics: [
      ['1. Green Fodder | سبز چارہ',
       'Berseem, lucerne, maize, sorghum and seasonal fodders can be used according to availability. Introduce new fodder gradually and avoid feeding spoiled or mouldy material.',
       'برسیم، لوسرن، مکئی، جوار اور موسمی چارے دستیابی کے مطابق استعمال کیے جا سکتے ہیں۔ نیا چارہ آہستہ آہستہ شروع کریں اور خراب یا پھپھوندی والا چارہ نہ کھلائیں۔'],

      ['2. Dry Fodder | خشک چارہ',
       'Wheat straw and other suitable roughages provide fibre. Store fodder in a dry, ventilated place and protect it from rain, moisture and mould.',
       'گندم کا بھوسہ اور دیگر خشک چارے فائبر فراہم کرتے ہیں۔ چارہ خشک اور ہوادار جگہ پر رکھیں اور بارش، نمی اور پھپھوندی سے بچائیں۔'],

      ['3. Concentrate & Ration | ونڈا اور راشن',
       'A balanced ration may include energy sources, protein sources, fibre, minerals and vitamins. The correct mix depends on body weight, age, pregnancy and milk production.',
       'متوازن راشن میں توانائی، پروٹین، فائبر، منرلز اور وٹامنز شامل ہو سکتے ہیں۔ مناسب مقدار جانور کے وزن، عمر، حمل اور دودھ کی پیداوار کے مطابق طے ہوتی ہے۔'],

      ['4. Dairy Animal Nutrition | دودھ دینے والے جانوروں کی خوراک',
       'Dairy animals need a balanced ration, clean water and gradual feed changes. Monitor body condition, appetite, milk yield and signs of digestive problems.',
       'دودھ دینے والے جانوروں کو متوازن راشن اور صاف پانی دیں۔ خوراک میں تبدیلی آہستہ کریں اور جسمانی حالت، بھوک، دودھ اور نظامِ ہاضمہ کی نگرانی کریں۔'],

      ['5. Calf Nutrition | بچھڑوں کی خوراک',
       'Newborn calves should receive good-quality colostrum as soon as possible after birth. Keep feeding equipment clean and introduce suitable starter feed and clean water as they grow.',
       'نوزائیدہ بچھڑے کو پیدائش کے فوراً بعد معیاری پہلا دودھ پلانا ضروری ہے۔ دودھ پلانے کے برتن صاف رکھیں اور عمر بڑھنے کے ساتھ مناسب اسٹارٹر خوراک اور صاف پانی فراہم کریں۔'],

      ['6. Water & Minerals | پانی اور منرلز',
       'Provide constant access to clean water. Mineral mixtures and salt may be needed depending on local deficiencies and the animal’s production stage. Seek advice before supplementation.',
       'جانور کو ہر وقت صاف پانی دستیاب ہونا چاہیے۔ مقامی غذائی کمی اور جانور کی پیداواری حالت کے مطابق منرل مکسچر اور نمک کی ضرورت ہو سکتی ہے۔ سپلیمنٹ دینے سے پہلے مشورہ کریں۔'],

      ['7. Feed Storage | چارے کی حفاظت',
       'Store feed off the ground in a dry, clean place. Check for insects, mould, unusual smell and contamination. Never feed visibly spoiled material.',
       'خوراک کو زمین سے اوپر، صاف اور خشک جگہ پر محفوظ رکھیں۔ کیڑوں، پھپھوندی، بدبو اور آلودگی کو چیک کریں۔ خراب خوراک ہرگز استعمال نہ کریں۔']
    ]
  },

  breeds: {
    icon: '🐄',
    title: 'Livestock Breeds | مویشیوں کی نسلیں',
    intro: 'Explore important cattle, buffalo, sheep and goat breeds and their characteristics.',
    urdu: 'گائے، بھینس، بھیڑ اور بکریوں کی اہم نسلوں اور خصوصیات کا تعارف۔',
    topics: [
      ['1. Cattle Breeds | گائے کی نسلیں',
       'Sahiwal, Red Sindhi and Cholistani are important indigenous cattle breeds. Holstein Friesian and Jersey are well-known dairy breeds. Selection should consider climate, feed resources and management capacity.',
       'ساہیوال، ریڈ سندھی اور چولستانی اہم مقامی نسلیں ہیں۔ ہولسٹین فریژن اور جرسی مشہور دودھ دینے والی نسلیں ہیں۔ انتخاب میں موسم، چارے اور دیکھ بھال کی صلاحیت کو مدنظر رکھیں۔'],

      ['2. Buffalo Breeds | بھینسوں کی نسلیں',
       'Nili-Ravi and Kundi are important buffalo breeds in Pakistan. Evaluate milk performance, body condition, udder health, fertility and adaptation before purchase.',
       'نیلی راوی اور کنڈی پاکستان کی اہم بھینسوں کی نسلیں ہیں۔ خریداری سے پہلے دودھ، جسمانی حالت، تھنوں کی صحت، افزائش اور ماحول سے مطابقت دیکھیں۔'],

      ['3. Goat Breeds | بکریوں کی نسلیں',
       'Beetal, Teddy, Kamori, Nachi and Barbari are among recognized goat breeds. Their suitability differs for milk, meat, breeding and local conditions.',
       'بیٹل، ٹیڈی، کاموری، ناچی اور باربری معروف بکریوں کی نسلوں میں شامل ہیں۔ دودھ، گوشت، افزائش اور مقامی حالات کے لحاظ سے ان کی افادیت مختلف ہے۔'],

      ['4. Sheep Breeds | بھیڑوں کی نسلیں',
       'Kajli, Lohi, Thalli and Damani are among Pakistani sheep breeds. Consider wool, meat, growth, flock management and adaptation to the local environment.',
       'کاجلی، لوہی، تھلی اور دامانی پاکستان کی بھیڑوں کی نسلوں میں شامل ہیں۔ اون، گوشت، نشوونما، ریوڑ کی دیکھ بھال اور مقامی ماحول سے مطابقت دیکھیں۔'],

      ['5. Breed Selection | نسل کا انتخاب',
       'Choose a breed according to your main goal: milk, meat, breeding or mixed production. Check health, age, teeth, body structure, udder, feet and reliable production records.',
       'اپنے مقصد یعنی دودھ، گوشت، افزائش یا مشترکہ پیداوار کے مطابق نسل منتخب کریں۔ صحت، عمر، دانت، جسمانی ساخت، تھن، پاؤں اور قابلِ اعتماد پیداواری ریکارڈ چیک کریں۔'],

      ['6. Breeding & Crossbreeding | افزائش اور کراس بریڈنگ',
       'Plan breeding using healthy animals with known performance and suitable genetics. Avoid close inbreeding and keep breeding records. Local climate and feed availability matter.',
       'صحت مند اور اچھی پیداواری خصوصیات والے جانوروں سے منصوبہ بندی کے تحت افزائش کریں۔ قریبی رشتہ دار جانوروں میں مسلسل کراس سے گریز کریں اور افزائش کا ریکارڈ رکھیں۔'],

      ['7. Buying Healthy Animals | صحت مند جانور کی خریداری',
       'Inspect the animal in person, check its movement, appetite, breathing, skin, udder and vaccination history. Where possible, obtain a veterinary examination before payment.',
       'جانور خود دیکھ کر خریدیں۔ چال، بھوک، سانس، جلد، تھن اور ویکسینیشن کا ریکارڈ چیک کریں۔ ممکن ہو تو ادائیگی سے پہلے ویٹرنری معائنہ کروائیں۔']
    ]
  },

  farm: {
    icon: '🏡',
    title: 'Farm Management | فارم مینجمنٹ',
    intro: 'Practical farm management methods for better animal welfare and profitability.',
    urdu: 'جانوروں کی بہتر دیکھ بھال اور فارم کی منافع بخش کارکردگی کے لیے عملی رہنمائی۔',
    topics: [
      ['1. Animal Housing | جانوروں کی رہائش',
       'Provide adequate floor space, shade, ventilation, drainage and protection from extreme weather. Avoid overcrowding and slippery floors.',
       'مناسب جگہ، سایہ، ہوا، نکاسی آب اور سخت موسم سے حفاظت فراہم کریں۔ جانوروں کو ضرورت سے زیادہ تنگ جگہ میں نہ رکھیں اور پھسلنے والے فرش سے بچائیں۔'],

      ['2. Farm Hygiene | فارم کی صفائی',
       'Remove manure regularly, clean feeding and watering equipment and maintain dry resting areas. Control flies and rodents using safe methods.',
       'گوبر باقاعدگی سے صاف کریں، خوراک اور پانی کے برتن دھوئیں اور جانوروں کے بیٹھنے کی جگہ خشک رکھیں۔ مکھیوں اور چوہوں کا محفوظ طریقوں سے کنٹرول کریں۔'],

      ['3. Calf Management | بچھڑوں کی پرورش',
       'Prepare a clean calving area, ensure timely colostrum intake, disinfect the navel as advised and monitor feeding, growth and health.',
       'زچگی کے لیے صاف جگہ تیار کریں، بچھڑے کو بروقت پہلا دودھ پلائیں، ڈاکٹر کے مشورے کے مطابق ناف کی صفائی کریں اور خوراک، نشوونما اور صحت کی نگرانی کریں۔'],

      ['4. Breeding Management | افزائشِ نسل',
       'Keep breeding and calving records. Monitor heat signs and use suitable breeding services. Seek veterinary help for repeat breeding, infertility or difficult birth.',
       'افزائش اور زچگی کا ریکارڈ رکھیں۔ ہیٹ کی علامات پر نظر رکھیں اور مناسب بریڈنگ سروس استعمال کریں۔ بار بار خالی رہنے، بانجھ پن یا مشکل زچگی میں ڈاکٹر سے رجوع کریں۔'],

      ['5. Milk Management | دودھ کا انتظام',
       'Milk animals at consistent times using clean hands and equipment. Maintain udder hygiene, cool milk promptly and monitor unusual changes in milk.',
       'دودھ مقررہ اوقات پر صاف ہاتھوں اور آلات سے نکالیں۔ تھنوں کی صفائی برقرار رکھیں، دودھ کو جلد ٹھنڈا کریں اور دودھ میں غیر معمولی تبدیلی پر توجہ دیں۔'],

      ['6. Farm Records | فارم کا ریکارڈ',
       'Record animal identification, births, purchases, sales, breeding, milk yield, feed costs, vaccination, disease and treatment expenses.',
       'ہر جانور کی شناخت، پیدائش، خرید و فروخت، افزائش، دودھ، چارے کے اخراجات، ویکسینیشن، بیماری اور علاج کے اخراجات کا ریکارڈ رکھیں۔'],

      ['7. Farm Economics | فارم کی معاشیات',
       'Calculate income and expenses regularly. Track feed cost, labour, veterinary costs, production and sale prices. Good records help identify profitable and loss-making areas.',
       'آمدنی اور اخراجات کا باقاعدہ حساب رکھیں۔ چارہ، مزدوری، ویٹرنری اخراجات، پیداوار اور فروخت کی قیمت نوٹ کریں۔ اچھا ریکارڈ منافع اور نقصان کی وجوہات سمجھنے میں مدد دیتا ہے۔'],

      ['8. Waste Management | فضلے کا انتظام',
       'Store manure safely and consider composting for crop use. Prevent waste runoff from contaminating water sources and keep the farm environment clean.',
       'گوبر کو محفوظ طریقے سے جمع کریں اور کھاد بنانے کے لیے استعمال پر غور کریں۔ فضلے کو پانی کے ذرائع میں جانے سے روکیں اور فارم کا ماحول صاف رکھیں۔']
    ]
  }
};
  
    
                        
