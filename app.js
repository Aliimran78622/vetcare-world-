
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

                             
