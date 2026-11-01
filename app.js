
// ==========================================
// VETCARE WORLD - MAIN APPLICATION
// Improved version
// ==========================================

// 1. SUPABASE CONNECTION

const SUPABASE_URL = 'https://vhtsqtloiyhaomigvmqu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KIlNronqSHSqk2jcHqX7uw_v82o9ae1';

// Stop requests that take longer than 15 seconds
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

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    global: {
      fetch: fetchWithTimeout
    }
  }
);

// 2. PAGE NAVIGATION

const pages = [...document.querySelectorAll('.page')];

function showPage(id) {
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

// 3. AUTHENTICATION

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
  currentUser = user;

  if (signupBtn) signupBtn.style.display = user ? 'none' : 'inline-block';
  if (loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
  if (logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';

  if (emailInput) emailInput.disabled = !!user;
  if (passwordInput) passwordInput.disabled = !!user;
}

// 4. SIGNUP

if (signupBtn) {
  signupBtn.addEventListener('click', async event => {
    event.preventDefault();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showAuthMessage('Please enter email and password.', true);
      return;
    }

    if (password.length < 8) {
      showAuthMessage('Password must be at least 8 characters.', true);
      return;
    }

    signupBtn.disabled = true;
    showAuthMessage('Creating account...');

    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://aliimran78622.github.io/vetcare-world-/'
        }
      });

      if (error) throw error;

      if (data.session) {
        showAuthMessage('Account created successfully!');
      } else {
        showAuthMessage('Account created! Please confirm your email.');
      }
    } catch (error) {
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

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showAuthMessage('Please enter email and password.', true);
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
    logoutBtn.disabled = true;

    try {
      const { error } = await db.auth.signOut();

      if (error) throw error;

      updateAuthDisplay(null);

      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';

      showAuthMessage('You have logged out.');
    } catch (error) {
      showAuthMessage('Logout failed: ' + error.message, true);
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

// 7. CHECK SESSION

async function checkSession() {
  try {
    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    updateAuthDisplay(data.session ? data.session.user : null);
  } catch (error) {
    showAuthMessage('Session error: ' + error.message, true);
  }
}

db.auth.onAuthStateChange((_event, session) => {
  updateAuthDisplay(session ? session.user : null);
});

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
  content.textContent = post.content;

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

// 9. LOAD POSTS

async function loadPosts() {
  const feed = document.getElementById('feed');

  if (!feed) return false;

  try {
    const { data, error } = await db
      .from('posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    feed.querySelectorAll('.database-post').forEach(post => post.remove());

    data.forEach(post => {
      feed.appendChild(createPostElement(post));
    });

    return true;
  } catch (error) {
    console.error('Could not load posts:', error);
    showAuthMessage('Could not load posts: ' + error.message, true);
    return false;
  }
}

// 10. PUBLISH POST

const postBtn = document.getElementById('postBtn');
const postText = document.getElementById('postText');

let isPosting = false;

async function publishPost(event) {
  if (event) event.preventDefault();

  if (isPosting) return;

  if (!currentUser) {
    showAuthMessage('Please log in before posting.', true);

    const authBox = document.getElementById('authBox');

    if (authBox) {
      authBox.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    return;
  }

  if (!postText) {
    showAuthMessage('Post text box was not found.', true);
    return;
  }

  const value = postText.value.trim();

  if (!value) {
    showAuthMessage('Please write something first.', true);
    return;
  }

  isPosting = true;

  const originalText = postBtn.textContent;

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

    const loaded = await loadPosts();

    if (!loaded) {
      showAuthMessage('Post saved, but Feed could not refresh.', true);
    }

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
      postBtn.textContent = originalText || 'Post';
    }
  }
}

if (postBtn) {
  postBtn.type = 'button';

  postBtn.addEventListener('click', publishPost);
}

// Prevent accidental form reload if user presses Enter
const postForm = postBtn?.closest('form');

if (postForm) {
  postForm.addEventListener('submit', publishPost);
}

// 11. LIKE AND SHARE

function wireActions(root = document) {
  root.querySelectorAll('.like').forEach(button => {
    if (button.dataset.ready) return;

    button.dataset.ready = '1';

    button.addEventListener('click', event => {
      event.preventDefault();

      button.textContent = button.textContent.includes('Liked')
        ? '♡ Like'
        : '♥ Liked';
    });
  });

  root.querySelectorAll('.share').forEach(button => {
    if (button.dataset.ready) return;

    button.dataset.ready = '1';

    button.addEventListener('click', async event => {
      event.preventDefault();

      try {
        await navigator.clipboard.writeText(location.href);
        button.textContent = '✓ Link copied';
      } catch (error) {
        button.textContent = 'Share this page';
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

    langBtn.textContent = urdu ? 'English' : 'اردو';

    document.querySelectorAll('[data-en]').forEach(element => {
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

// 14. SERVICE WORKER

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(error => console.error('Service Worker error:', error));
  });
}
