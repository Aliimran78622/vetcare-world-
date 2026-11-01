// ==========================================
// VETCARE WORLD - MAIN APPLICATION
// ==========================================

// 1. SUPABASE CONNECTION
const SUPABASE_URL = 'https://vhtsqtloiyhaomigvmqu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KIlNronqSHSqk2jcHqX7uw_v82o9ae1';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  button.addEventListener('click', () => showPage(button.dataset.target));
});

// 3. AUTHENTICATION ELEMENTS
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

  if (user) {
    showAuthMessage('You are logged in. Welcome to VetCare World!');
  }
}

// 4. CREATE ACCOUNT
if (signupBtn) {
  signupBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAuthMessage('Please enter your email and password.', true);
      return;
    }

    if (password.length < 8) {
      showAuthMessage('Password must be at least 8 characters.', true);
      return;
    }

    signupBtn.disabled = true;
    showAuthMessage('Creating your account...');

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://aliimran78622.github.io/vetcare-world-/'
      }
    });

    signupBtn.disabled = false;

    if (error) {
      showAuthMessage(error.message, true);
      return;
    }

    if (data.session) {
      showAuthMessage('Account created successfully! You are now logged in.');
    } else {
      showAuthMessage('Account created! Please check your email and click the confirmation link before logging in.');
    }
  });
}

// 5. LOGIN
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAuthMessage('Please enter your email and password.', true);
      return;
    }

    loginBtn.disabled = true;
    showAuthMessage('Logging in...');

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    loginBtn.disabled = false;

    if (error) {
      showAuthMessage(error.message, true);
      return;
    }

    updateAuthDisplay(data.user);
    showAuthMessage('Login successful. Welcome!');
  });
}

// 6. LOGOUT
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      showAuthMessage(error.message, true);
      return;
    }

    updateAuthDisplay(null);
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    showAuthMessage('You have logged out successfully.');
  });
}

// 7. CHECK EXISTING LOGIN SESSION
async function checkSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    showAuthMessage(error.message, true);
    return;
  }

  updateAuthDisplay(data.session ? data.session.user : null);
}

db.auth.onAuthStateChange((_event, session) => {
  updateAuthDisplay(session ? session.user : null);
});

// 8. DISPLAY POSTS FROM DATABASE
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
  likeButton.className = 'like';
  likeButton.textContent = '♡ Like';

  const shareButton = document.createElement('button');
  shareButton.className = 'share';
  shareButton.textContent = '↗ Share';

  actions.append(likeButton, shareButton);
  article.append(head, content, actions);

  wireActions(article);

  return article;
}

async function loadPosts() {
  const feed = document.getElementById('feed');
  if (!feed) return;

  const { data, error } = await db
    .from('posts')
    .select('id, content, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Could not load posts:', error.message);
    return;
  }

  feed.querySelectorAll('.database-post').forEach(post => post.remove());

  data.forEach(post => {
    feed.appendChild(createPostElement(post));
  });
}

// 9. CREATE A DATABASE POST
const postBtn = document.getElementById('postBtn');

if (postBtn) {
  postBtn.addEventListener('click', async () => {
    if (!currentUser) {
      showAuthMessage('Please create an account or log in before posting.', true);
      document.getElementById('authBox').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      return;
    }

    const box = document.getElementById('postText');
    const value = box.value.trim();

    if (!value) {
      alert('Please write something first.');
      return;
    }

    postBtn.disabled = true;
    postBtn.textContent = 'Posting...';

    const { error } = await db
      .from('posts')
      .insert({
        user_id: currentUser.id,
        content: value
      });

    postBtn.disabled = false;
    postBtn.textContent = 'Post';

    if (error) {
      showAuthMessage('Could not publish post: ' + error.message, true);
      return;
    }

    box.value = '';
    showAuthMessage('Your post has been published!');
    await loadPosts();
  });
}

// 10. LIKE AND SHARE BUTTONS
function wireActions(root = document) {
  root.querySelectorAll('.like').forEach(button => {
    if (button.dataset.ready) return;

    button.dataset.ready = '1';

    button.addEventListener('click', () => {
      button.textContent = button.textContent.includes('Liked')
        ? '♡ Like'
        : '♥ Liked';
    });
  });

  root.querySelectorAll('.share').forEach(button => {
    if (button.dataset.ready) return;

    button.dataset.ready = '1';

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        button.textContent = '✓ Link copied';
      } catch (error) {
        button.textContent = 'Share this page';
      }
    });
  });
}

// 11. LANGUAGE SWITCH
let urdu = false;
const langBtn = document.getElementById('langBtn');

if (langBtn) {
  langBtn.addEventListener('click', () => {
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

// 12. START APPLICATION
wireActions();
checkSession();
loadPosts();

// 13. SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(error => console.error('Service Worker error:', error));
  });
  }
