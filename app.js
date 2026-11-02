
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
      intro: 'Learn to recognize common livestock diseases and protect your animals.',
      urdu: 'جانوروں کی بیماریوں کی ابتدائی علامات پہچاننا، بروقت تشخیص اور بچاؤ بہت ضروری ہے۔',
      topics: [
        ['Common diseases | عام بیماریاں',
          'Mastitis, foot and mouth disease, hemorrhagic septicemia, black quarter, tick-borne diseases and digestive disorders.',
          'ماسٹائٹس، منہ کھر، گل گھوٹو، کالا یرقان، چیچڑوں سے پھیلنے والی بیماریاں اور نظامِ ہاضمہ کے مسائل۔'],
        ['Warning signs | بیماری کی علامات',
          'Fever, loss of appetite, weakness, coughing, diarrhea, nasal discharge and reduced milk production.',
          'بخار، بھوک کی کمی، کمزوری، کھانسی، دست، ناک سے رطوبت اور دودھ کی پیداوار میں کمی۔'],
        ['Prevention | بچاؤ',
          'Clean housing, safe water, balanced nutrition, vaccination planning and isolation of sick animals.',
          'صاف رہائش، صاف پانی، متوازن خوراک، ویکسینیشن کا منصوبہ اور بیمار جانور کو الگ رکھنا۔'],
        ['Veterinary care | ویٹرنری علاج',
          'Diagnosis should be made by a qualified veterinarian. Treatment depends on the disease and animal condition.',
          'تشخیص مستند ویٹرنری ڈاکٹر سے کروائیں۔ علاج بیماری اور جانور کی حالت کے مطابق ہوتا ہے۔']
      ]
    },

    feed: {
      icon: '🌾',
      title: 'Feed & Nutrition | خوراک اور غذائیت',
      intro: 'Good nutrition supports animal growth, milk production and reproduction.',
      urdu: 'اچھی خوراک جانور کی نشوونما، دودھ، گوشت اور افزائشِ نسل کی صلاحیت بہتر بنانے میں مدد دیتی ہے۔',
      topics: [
        ['Green fodder | سبز چارہ',
          'Common fodders include berseem, lucerne, maize and sorghum. Choose according to season and availability.',
          'برسیم، لوسرن، مکئی اور جوار اہم چارے ہیں۔ موسم اور دستیابی کے مطابق انتخاب کریں۔'],
        ['Dry roughage | خشک چارہ',
          'Wheat straw and other suitable roughages provide fibre. They should be clean and free from mould.',
          'گندم کا بھوسہ اور دیگر مناسب خشک چارے فائبر فراہم کرتے ہیں۔ پھپھوندی والا چارہ استعمال نہ کریں۔'],
        ['Concentrate and minerals | ونڈا اور منرلز',
          'Concentrate mixtures and mineral supplements should match the animal’s age, weight and production.',
          'ونڈا اور منرلز جانور کی عمر، وزن، دودھ اور جسمانی ضرورت کے مطابق دیں۔'],
        ['Water | پانی',
          'Provide continuous access to fresh, clean drinking water.',
          'جانور کو ہر وقت تازہ اور صاف پانی دستیاب ہونا چاہیے۔']
      ]
    },

    breeds: {
      icon: '🐄',
      title: 'Livestock Breeds | جانوروں کی نسلیں',
      intro: 'Learn about livestock breeds and select animals suitable for your farm.',
      urdu: 'اپنے علاقے کے موسم، خوراک اور فارم کے مقصد کے مطابق نسل کا انتخاب کریں۔',
      topics: [
        ['Cattle | گائے کی نسلیں',
          'Important Pakistani breeds include Sahiwal, Cholistani and Red Sindhi.',
          'پاکستان کی اہم نسلوں میں ساہیوال، چولستانی اور ریڈ سندھی شامل ہیں۔'],
        ['Buffalo | بھینس کی نسلیں',
          'Nili-Ravi and Kundi are important buffalo breeds in Pakistan.',
          'نیلی راوی اور کنڈی پاکستان کی اہم بھینسوں کی نسلیں ہیں۔'],
        ['Goats | بکریوں کی نسلیں',
          'Beetal, Teddy and Kamori are among the well-known goat breeds.',
          'بیٹل، ٹیڈی اور کاموری مشہور بکریوں کی نسلوں میں شامل ہیں۔'],
        ['Selection | نسل کا انتخاب',
          'Check health, body structure, production history, parentage and local adaptability.',
          'صحت، جسمانی ساخت، پیداوار کا ریکارڈ، والدین کی نسل اور مقامی ماحول سے مطابقت دیکھیں۔']
      ]
    },

    farm: {
      icon: '🏡',
      title: 'Farm Management | فارم مینجمنٹ',
      intro: 'Effective farm management improves animal welfare and farm productivity.',
      urdu: 'بہتر فارم مینجمنٹ سے جانوروں کی صحت، صفائی اور فارم کی پیداوار میں بہتری آتی ہے۔',
      topics: [
        ['Housing | جانوروں کی رہائش',
          'Provide enough space, shade, ventilation and protection from extreme weather.',
          'مناسب جگہ، سایہ، ہوا کی آمدورفت اور سخت موسم سے حفاظت فراہم کریں۔'],
        ['Hygiene | صفائی',
          'Remove manure regularly and keep floors, feeders and water containers clean.',
          'گوبر باقاعدگی سے صاف کریں اور فرش، کھرلیوں اور پانی کے برتنوں کو صاف رکھیں۔'],
        ['Calf care | بچھڑوں کی دیکھ بھال',
          'Give newborn calves timely colostrum and maintain clean, dry housing.',
          'نوزائیدہ بچھڑے کو بروقت پہلا دودھ پلائیں اور صاف، خشک جگہ پر رکھیں۔'],
        ['Farm records | فارم کا ریکارڈ',
          'Record births, breeding, milk production, vaccination, illness and treatment.',
          'پیدائش، افزائش، دودھ، ویکسینیشن، بیماری اور علاج کا باقاعدہ ریکارڈ رکھیں۔']
      ]
    }
  };

  function showKnowledgeArticle(data) {
    document.querySelector('.knowledge-detail-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'knowledge-detail-overlay';

    const box = document.createElement('article');
    box.className = 'knowledge-detail';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'detail-close';
    close.textContent = '✕ Close';
    close.onclick = () => overlay.remove();

    const title = document.createElement('h2');
    title.textContent = data.icon + ' ' + data.title;

    const intro = document.createElement('p');
    intro.textContent = data.intro;

    const urdu = document.createElement('p');
    urdu.className = 'detail-urdu';
    urdu.dir = 'rtl';
    urdu.textContent = data.urdu;

    box.append(close, title, intro, urdu);

    data.topics.forEach(topic => {
      const heading = document.createElement('h3');
      heading.textContent = topic[0];

      const english = document.createElement('p');
      english.textContent = topic[1];

      const urduText = document.createElement('p');
      urduText.className = 'detail-urdu';
      urduText.dir = 'rtl';
      urduText.textContent = topic[2];

      box.append(heading, english, urduText);
    });

    const note = document.createElement('p');
    note.className = 'detail-warning';
    note.textContent =
      '⚕️ Important: This is educational information. Consult a qualified veterinarian for diagnosis and treatment.';

    box.appendChild(note);
    overlay.appendChild(box);

    overlay.addEventListener('click', event => {
      if (event.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    close.focus();
  }

  // Delegated click handling: works even if card classes change.
  document.addEventListener('click', event => {
    const section = document.getElementById('knowledge');
    if (!section || !section.contains(event.target)) return;

    let card = event.target.closest('.knowledge-card, .tile');

    if (!card) {
      const grid = section.querySelector('.knowledge-grid, .tiles');
      if (grid) {
        card = [...grid.children].find(item =>
          item.contains(event.target)
        );
      }
    }

    if (!card) return;

    const text = card.textContent.toLowerCase();

    let key = null;

    if (text.includes('animal health') || text.includes('disease')) {
      key = 'health';
    } else if (text.includes('feed') || text.includes('nutrition')) {
      key = 'feed';
    } else if (text.includes('breed')) {
      key = 'breeds';
    } else if (text.includes('farm management') || text.includes('management')) {
      key = 'farm';
    }

    if (key) showKnowledgeArticle(knowledgeData[key]);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelector('.knowledge-detail-overlay')?.remove();
    }
  });
})();


                             
