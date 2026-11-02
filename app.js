
'VetCare World',
            text: 'Visit VetCare World',
            url: shareUrl
          });
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          button.textContent = '✓ Link Copied';
        } else {
          window.prompt('Copy this link:', shareUrl);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
          window.prompt('Copy this link:', shareUrl);
        }
      }
    });
  });
}


// 12. LOGIN PANEL

function openVetCareLogin() {
  const authBox = document.getElementById('authBox');

  if (!authBox) return;

  authBox.classList.remove('hidden');

  authBox.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  emailInput?.focus();
}

function closeVetCareLogin() {
  const authBox = document.getElementById('authBox');

  if (authBox) {
    authBox.classList.add('hidden');
  }
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
    document.querySelector('.knowledge-detail-overlay')?.remove();
  }
});

if (db) {
  db.auth.onAuthStateChange((_event, session) => {
    if (session) closeVetCareLogin();
  });
}


// 13. LOGIN REQUIRED FOR MEMBER POSTING

if (postBtn) {
  postBtn.addEventListener('click', event => {
    if (!currentUser) {
      event.preventDefault();
      event.stopImmediatePropagation();

      openVetCareLogin();

      showAuthMessage(
        'Please login or create an account before publishing a post.',
        true
      );
    }
  }, true);
}


// 14. KNOWLEDGE CENTRE SEARCH

(function setupKnowledgeSearch() {

  const searchInput = document.getElementById('knowledgeSearch');
  const message = document.getElementById('knowledgeSearchMessage');
  const knowledgeSection = document.getElementById('knowledge');

  if (!searchInput || !knowledgeSection) return;

  const cards = [
    ...knowledgeSection.querySelectorAll('.knowledge-card')
  ];

  searchInput.addEventListener('input', function () {

    const query = this.value.trim().toLowerCase();

    let visibleCount = 0;

    cards.forEach(card => {

      const searchableText = card.textContent.toLowerCase();

      const matches = !query || searchableText.includes(query);

      card.style.display = matches ? '' : 'none';

      if (matches) visibleCount++;

    });

    if (!message) return;

    if (!query) {
      message.textContent = 'Search the Knowledge Centre';
    } else if (visibleCount > 0) {
      message.textContent =
        visibleCount + ' categories found / کیٹیگریز مل گئیں';
    } else {
      message.textContent =
        'No matching category found / کوئی متعلقہ موضوع نہیں ملا';
    }

  });

})();


// 15. INITIALIZE COMMUNITY ACTIONS

wireActions();


// 16. CHECK LOGIN SESSION AND LOAD PUBLIC POSTS

checkSession();

loadPosts();


// 17. SERVICE WORKER

if ('serviceWorker' in navigator) {

  window.addEventListener('load', () => {

    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log(
          'VetCare World service worker registered:',
          registration.scope
        );
      })
      .catch(error => {
        console.error(
          'Service worker registration failed:',
          error
        );
      });

  });

}


// 18. APPLICATION READY

console.log('VetCare World application initialized.');
    
