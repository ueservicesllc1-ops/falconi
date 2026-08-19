/* =========================================================
   FALCONI PARFUMS — JavaScript Engine (English Version)
   ========================================================= */

// ===== PRODUCTS DATA =====
const PRODUCTS = [
  {
    id: 1,
    name: "Oud Noir",
    tagline: "The essence of Arabia",
    category: "unisex",
    badge: "Bestseller",
    price: 189,
    image: "assets/oud-noir.png",
    sizes: ["50ml", "100ml"],
    notes: ["Arabian Oud", "Turkish Rose", "Amber", "Patchouli"],
    description: "An ode to the mystery of the Arabian night. Oud Noir captures the essence of the rarest oud, intertwined with Turkish roses and warm amber accords that evolve on the skin for hours. A fragrance that does not go unnoticed."
  },
  {
    id: 2,
    name: "Rose d'Orient",
    tagline: "The queen of the Persian garden",
    category: "mujer",
    badge: "New",
    price: 165,
    image: "assets/rose-orient.png",
    sizes: ["30ml", "50ml", "100ml"],
    notes: ["Damask Rose", "Peony", "Sandalwood", "Musk"],
    description: "A romantic tribute to the Damascus rose in full bloom. Each floral note is interwoven with soft sandalwood and a musky base that leaves a sensual and irresistible trail."
  },
  {
    id: 3,
    name: "Amber Gold",
    tagline: "Golden warmth of the Orient",
    category: "hombre",
    badge: "Exclusive",
    price: 210,
    image: "assets/amber-gold.png",
    sizes: ["50ml", "100ml"],
    notes: ["Ambergris", "Benzoin", "Vanilla", "Vetiver"],
    description: "A masterpiece of amber perfumery. Amber Gold combines the richness of marine ambergris with the sweetness of benzoin and the depth of vetiver in a truly regal composition."
  },
  {
    id: 4,
    name: "Musk Blanc",
    tagline: "Purity in its purest state",
    category: "mujer",
    badge: "",
    price: 145,
    image: "assets/musk-blanc.png",
    sizes: ["30ml", "50ml"],
    notes: ["White Musk", "Lily", "Cedarwood", "Bergamot"],
    description: "The purity of a winter dawn captured in a bottle. Musk Blanc is an ethereal and clean fragrance that envelops you like a second skin, leaving a heavenly trail of musk and white flowers."
  },
  {
    id: 5,
    name: "Saffron Royal",
    tagline: "The red gold of Persia",
    category: "coleccion",
    badge: "Limited Edition",
    price: 295,
    image: "assets/saffron-royal.png",
    sizes: ["50ml", "100ml"],
    notes: ["Saffron", "Rose", "Oud", "Leather"],
    description: "Inspired by Persian palaces, Saffron Royal is a statement of power and elegance. Saffron from Isfahan blends with premium oud and touches of leather to create a truly royal fragrance."
  },
  {
    id: 6,
    name: "Jasmine Nuit",
    tagline: "The magic of the night",
    category: "mujer",
    badge: "",
    price: 155,
    image: "assets/jasmine-nuit.png",
    sizes: ["30ml", "50ml", "100ml"],
    notes: ["Jasmine Sambac", "Ylang-Ylang", "Bergamot", "Musk"],
    description: "As the sun sets, jasmine comes alive in an intoxicating floral crescendo. Jasmine Nuit is seductive and nocturnal, a fragrance for the nights you never want to end."
  }
];

// ===== STATE =====
let cart = JSON.parse(localStorage.getItem('falconiCart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('falconiWishlist') || '[]');
let currentQV = null;
let qvQty = 1;
let testimonialIdx = 0;
let testimonialTimer;
let visibleProducts = 6;

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();
  initSmoke();
  initCart();
  renderProducts();
  initFilters();
  initScrollReveal();
  initTestimonials();
  initSearch();
  updateCartBadge();
  loadFirestoreProductsToStore();
  initAuthBtn();
});

function initAuthBtn() {
  const userBtn = document.getElementById('userAuthBtn');
  const shieldBtn = document.getElementById('adminShieldBtn');
  
  // Client Auth Modal Elements
  const authModal = document.getElementById('clientAuthModal');
  const authClose = document.getElementById('clientAuthClose');
  const tabLogin = document.getElementById('modalTabLogin');
  const tabRegister = document.getElementById('modalTabRegister');
  const nameGroup = document.getElementById('modalNameGroup');
  const passwordGroup = document.getElementById('modalPasswordGroup');
  const forgotLink = document.getElementById('modalForgotLink');
  const authForm = document.getElementById('modalAuthForm');
  const submitBtn = document.getElementById('modalAuthSubmitBtn');
  const googleBtn = document.getElementById('modalGoogleBtn');
  const authMsg = document.getElementById('modalAuthMsg');

  // Admin PIN Modal Elements
  const pinModal = document.getElementById('adminPinModal');
  const pinClose = document.getElementById('adminPinClose');
  const pinForm = document.getElementById('adminPinForm');
  const pinInput = document.getElementById('adminPinInput');
  const pinError = document.getElementById('pinError');

  let mode = 'login'; // 'login', 'register', 'forgot'

  function switchTab(newMode) {
    mode = newMode;
    if (authMsg) { authMsg.style.display = 'none'; authMsg.className = ''; }
    
    if (mode === 'login') {
      tabLogin.style.color = '#c09b57'; tabLogin.style.borderBottom = '2px solid #c09b57';
      tabRegister.style.color = '#8c8270'; tabRegister.style.borderBottom = 'none';
      nameGroup.style.display = 'none';
      passwordGroup.style.display = 'flex';
      submitBtn.innerHTML = 'Iniciar Sesión &#x2756;';
    } else if (mode === 'register') {
      tabRegister.style.color = '#c09b57'; tabRegister.style.borderBottom = '2px solid #c09b57';
      tabLogin.style.color = '#8c8270'; tabLogin.style.borderBottom = 'none';
      nameGroup.style.display = 'flex';
      passwordGroup.style.display = 'flex';
      submitBtn.innerHTML = 'Crear Cuenta &#x2756;';
    } else if (mode === 'forgot') {
      tabLogin.style.color = '#8c8270'; tabLogin.style.borderBottom = 'none';
      tabRegister.style.color = '#8c8270'; tabRegister.style.borderBottom = 'none';
      nameGroup.style.display = 'none';
      passwordGroup.style.display = 'none';
      submitBtn.innerHTML = 'Restablecer Contraseña &#x2756;';
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchTab('register'));
  if (forgotLink) forgotLink.addEventListener('click', () => switchTab('forgot'));

  // Open Client Auth Modal on User Button Click
  if (userBtn && authModal) {
    userBtn.addEventListener('click', () => {
      authModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (authClose && authModal) {
    authClose.addEventListener('click', () => {
      authModal.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Firebase Auth Integration
  import('./firebase/firebase.js').then(({ 
    auth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updateProfile, 
    GoogleAuthProvider, 
    signInWithPopup 
  }) => {
    
    // Auth Listener: show shield for ueservicesllc1@gmail.com
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (userBtn) userBtn.title = `Cuenta: ${user.email}`;
        if (user.email === 'ueservicesllc1@gmail.com') {
          if (shieldBtn) shieldBtn.style.display = 'inline-flex';
        } else {
          if (shieldBtn) shieldBtn.style.display = 'none';
        }
      } else {
        if (shieldBtn) shieldBtn.style.display = 'none';
      }
    });

    // Form Submit
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('modalAuthEmail').value.trim();
        const password = document.getElementById('modalAuthPassword') ? document.getElementById('modalAuthPassword').value : '';
        const name = document.getElementById('modalAuthName') ? document.getElementById('modalAuthName').value.trim() : '';

        showAuthMsg('Procesando...', 'info');

        try {
          if (mode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
            showAuthMsg('¡Inicio de sesión exitoso!', 'success');
            setTimeout(() => {
              authModal.classList.remove('open');
              document.body.style.overflow = '';
            }, 1000);
          } else if (mode === 'register') {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            if (name && userCred.user) {
              await updateProfile(userCred.user, { displayName: name });
            }
            showAuthMsg('¡Cuenta creada con éxito! Bienvenido a Falconi.', 'success');
            setTimeout(() => {
              authModal.classList.remove('open');
              document.body.style.overflow = '';
            }, 1000);
          } else if (mode === 'forgot') {
            await sendPasswordResetEmail(auth, email);
            showAuthMsg(`Enlace enviado a ${email}. Revisa tu bandeja de entrada.`, 'success');
          }
        } catch (err) {
          showAuthMsg(formatAuthError(err.code || err.message), 'error');
        }
      });
    }

    // Google Sign In
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        try {
          showAuthMsg('Conectando con Google...', 'info');
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          showAuthMsg(`Sesión iniciada como ${result.user.displayName || result.user.email}`, 'success');
          setTimeout(() => {
            authModal.classList.remove('open');
            document.body.style.overflow = '';
          }, 1000);
        } catch (err) {
          showAuthMsg(formatAuthError(err.code || err.message), 'error');
        }
      });
    }
  }).catch(err => console.log('Auth module load error:', err));

  // Shield Click -> Open PIN Modal
  if (shieldBtn && pinModal) {
    shieldBtn.addEventListener('click', () => {
      pinModal.classList.add('open');
      pinInput.value = '';
      if (pinError) pinError.style.display = 'none';
      setTimeout(() => pinInput.focus(), 100);
    });
  }

  if (pinClose && pinModal) {
    pinClose.addEventListener('click', () => {
      pinModal.classList.remove('open');
    });
  }

  // PIN Form Submission
  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = pinInput.value.trim();
      if (enteredPin === '1619') {
        sessionStorage.setItem('falconiAdminPin', '1619');
        window.location.href = 'admin.html';
      } else {
        if (pinError) pinError.style.display = 'block';
        pinInput.value = '';
      }
    });
  }

  function showAuthMsg(msg, type) {
    if (!authMsg) return;
    authMsg.textContent = msg;
    authMsg.style.display = 'block';
    if (type === 'error') {
      authMsg.style.background = 'rgba(220,53,69,0.2)';
      authMsg.style.color = '#ff8a8a';
      authMsg.style.border = '1px solid rgba(220,53,69,0.4)';
    } else if (type === 'success') {
      authMsg.style.background = 'rgba(40,167,69,0.2)';
      authMsg.style.color = '#75b798';
      authMsg.style.border = '1px solid rgba(40,167,69,0.4)';
    } else {
      authMsg.style.background = 'rgba(192,155,87,0.15)';
      authMsg.style.color = '#c09b57';
      authMsg.style.border = '1px solid rgba(192,155,87,0.3)';
    }
  }

  function formatAuthError(code) {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta registrada con este correo.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'Por favor ingresa un correo electrónico válido.';
      case 'auth/popup-closed-by-user':
        return 'Inicio de sesión con Google cancelado.';
      default:
        return code.replace('auth/', '').replace(/-/g, ' ');
    }
  }
}

// ===== FIRESTORE DYNAMIC PRODUCTS INTEGRATION =====
async function loadFirestoreProductsToStore() {
  try {
    const { db, collection, getDocs } = await import('./firebase/firebase.js');
    const querySnapshot = await getDocs(collection(db, "products"));
    let addedCount = 0;
    
    querySnapshot.forEach(docSnap => {
      const p = docSnap.data();
      const existingIdx = PRODUCTS.findIndex(item => item.id === docSnap.id || item.name === p.name);
      
      const productObj = {
        id: docSnap.id,
        name: p.name,
        tagline: p.tagline || "",
        category: p.category || "unisex",
        badge: p.badge || "",
        price: Number(p.price) || 0,
        image: p.image || "assets/oud-noir.png",
        sizes: p.sizes || ["50ml", "100ml"],
        stock: p.stock !== undefined ? Number(p.stock) : 15,
        notes: p.notes || [],
        description: p.description || ""
      };

      if (existingIdx >= 0) {
        PRODUCTS[existingIdx] = productObj;
      } else {
        PRODUCTS.unshift(productObj); // Add new Firestore/B2 products to top
        addedCount++;
      }
    });

    if (addedCount > 0) {
      renderProducts();
      console.log(`✦ Loaded ${addedCount} dynamic products from Firestore/B2`);
    }
  } catch (err) {
    console.log("Firestore store sync status:", err.message);
  }
}

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    // Active link highlighting
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 200) current = s.getAttribute('id');
    });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.remove('active');
      if (l.getAttribute('href') === '#' + current) l.classList.add('active');
    });
  });

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    navLinks.classList.contains('open')
      ? (spans[0].style.transform = 'translateY(6px) rotate(45deg)', spans[1].style.opacity = '0', spans[2].style.transform = 'translateY(-6px) rotate(-45deg)')
      : (spans[0].style.transform = '', spans[1].style.opacity = '', spans[2].style.transform = '');
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      const spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
}

// ===== PARTICLES =====
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 8 + 5) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
    container.appendChild(p);
  }
}

// ===== ORGANIC SMOKE =====
function initSmoke() {
  const canvas = document.getElementById('smokeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);
  
  window.addEventListener('resize', () => {
    width = (canvas.width = canvas.offsetWidth);
    height = (canvas.height = canvas.offsetHeight);
  });
  
  const particles = [];
  const maxParticles = 55; // Densidad balanceada para realismo y rendimiento
  
  class SmokeParticle {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // Distribucion inicial vertical
    }
    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 60; // Nace abajo
      this.vx = (Math.random() - 0.5) * 1.2; // Dispersion horizontal
      this.vy = -(Math.random() * 0.4 + 0.3); // Flotado lento hacia arriba
      this.size = Math.random() * 80 + 120; // Tamanio inicial aumentado para difuminado absoluto
      this.maxLife = Math.random() * 250 + 150; // Tiempo de vida
      this.life = 0;
      this.rotation = Math.random() * Math.PI * 2;
      this.vr = (Math.random() - 0.5) * 0.006; // Rotacion lenta
      this.opacity = Math.random() * 0.14 + 0.06; // Translucidez para evitar parches
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.size += 0.25; // Expansion del humo
      this.rotation += this.vr;
      this.life++;
      if (this.life >= this.maxLife) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
      
      let currentOpacity = this.opacity;
      // Fade-in inicial y fade-out final suaves
      if (this.life < 40) {
        currentOpacity = (this.life / 40) * this.opacity;
      } else if (this.life > this.maxLife - 80) {
        currentOpacity = ((this.maxLife - this.life) / 80) * this.opacity;
      }
      
      // Color humo blanquecino con ligera calidez dorada/incienso
      grad.addColorStop(0, `rgba(245, 245, 245, ${currentOpacity})`);
      grad.addColorStop(0.3, `rgba(212, 175, 111, ${currentOpacity * 0.35})`);
      grad.addColorStop(1, 'rgba(8, 7, 10, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new SmokeParticle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ===== PRODUCTS =====
function renderProducts(filter = 'all') {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  const toShow = filtered.slice(0, visibleProducts);

  grid.innerHTML = '';
  toShow.forEach((p, i) => {
    const isWished = wishlist.includes(p.id);
    const card = document.createElement('div');
    card.className = 'product-card reveal';
    card.style.transitionDelay = (i * 0.08) + 's';
    
    // Display category elegantly in English
    let displayCat = p.category;
    if (p.category === 'mujer') displayCat = 'women';
    if (p.category === 'hombre') displayCat = 'men';
    if (p.category === 'coleccion') displayCat = 'collection';

    card.innerHTML = `
      <div class="product-card-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
        <div class="product-actions-overlay">
          <button class="product-action-btn btn-add-product">
            + Cart
          </button>
          <button class="product-action-btn btn-view-product">
            View
          </button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${displayCat}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-tagline">${p.tagline}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">$${p.price.toFixed(2)}</div>
            <div class="product-size">${p.sizes.join(' · ')}</div>
          </div>
          <button class="wishlist-btn ${isWished ? 'active' : ''}" title="Favorite">
            ${isWished ? '♥' : '♡'}
          </button>
        </div>
      </div>
    `;

    // Bind event listeners using JS to prevent quotation/syntax issues with names like "Rose d'Orient"
    const addBtn = card.querySelector('.btn-add-product');
    const viewBtn = card.querySelector('.btn-view-product');
    const wishlistBtn = card.querySelector('.wishlist-btn');

    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const defaultSize = p.sizes && p.sizes.length > 0 ? p.sizes[p.sizes.length - 1] : "100ml";
        addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, size: defaultSize });
      });
    }

    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openQuickView(p.id);
      });
    }

    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(p.id);
      });
    }

    card.addEventListener('click', () => openQuickView(p.id));
    grid.appendChild(card);
  });

  // Update load more button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = filtered.length > toShow.length ? 'inline-flex' : 'none';
  }

  // Re-init scroll reveal
  initScrollReveal();
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      visibleProducts = 6;
      renderProducts(btn.dataset.filter);
    });
  });

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleProducts += 3;
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      renderProducts(activeFilter);
    });
  }
}

// ===== QUICK VIEW =====
function openQuickView(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  currentQV = p;
  qvQty = 1;

  document.getElementById('qvImage').src = p.image;
  document.getElementById('qvImage').alt = p.name;
  
  let displayCat = p.category;
  if (p.category === 'mujer') displayCat = 'women';
  if (p.category === 'hombre') displayCat = 'men';
  if (p.category === 'coleccion') displayCat = 'collection';

  document.getElementById('qvBadge').textContent = p.badge || displayCat.toUpperCase();
  document.getElementById('qvName').textContent = p.name;
  document.getElementById('qvTagline').textContent = p.tagline;
  document.getElementById('qvDescription').textContent = p.description;
  document.getElementById('qvPrice').textContent = '$' + p.price.toFixed(2);
  document.getElementById('qvQty').textContent = '1';

  const notesGrid = document.getElementById('qvNotes');
  notesGrid.innerHTML = p.notes.map(n => `<span class="note-tag">${n}</span>`).join('');

  const sizesDiv = document.getElementById('qvSizes');
  const validSizes = p.sizes && p.sizes.length > 0 ? p.sizes : ["100ml"];
  sizesDiv.innerHTML = validSizes.map((s, i) =>
    `<button class="size-btn ${i === validSizes.length - 1 ? 'active' : ''}" onclick="selectSize(this)">${s}</button>`
  ).join('');

  // Render stock status (Cantidad en existencia)
  const stock = p.stock !== undefined ? p.stock : 15;
  const stockEl = document.getElementById('qvStock');
  const addBtn = document.getElementById('qvAddBtn');
  if (stockEl) {
    if (stock > 0) {
      stockEl.innerHTML = `<span style="color:#75b798; font-weight:600;">✓ Cantidad en existencia: <strong style="color:#e6d5b8;">${stock} unidades</strong></span>`;
      if (addBtn) { addBtn.disabled = false; addBtn.style.opacity = '1'; addBtn.style.cursor = 'pointer'; }
    } else {
      stockEl.innerHTML = `<span style="color:#ff8a8a; font-weight:600;">⚠️ Agotado (Sin existencia en inventario)</span>`;
      if (addBtn) { addBtn.disabled = true; addBtn.style.opacity = '0.5'; addBtn.style.cursor = 'not-allowed'; }
    }
  }

  document.getElementById('qvAddBtn').onclick = () => {
    if (stock <= 0) return;
    const size = document.querySelector('.size-btn.active')?.textContent || validSizes[0];
    for (let i = 0; i < qvQty; i++) {
      addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, size });
    }
    closeQuickView();
  };

  document.getElementById('quickViewModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Keyboard / window click closing helpers
function closeQuickView() {
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    modal.classList.remove('open');
  }
  document.body.style.overflow = '';
}

// Register close events for Quick View Modal
const qvCloseBtn = document.getElementById('quickViewClose');
const qvModalOverlay = document.getElementById('quickViewModal');
if (qvCloseBtn) {
  qvCloseBtn.addEventListener('click', closeQuickView);
}
if (qvModalOverlay) {
  qvModalOverlay.addEventListener('click', (e) => {
    if (e.target === qvModalOverlay) {
      closeQuickView();
    }
  });
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function changeQty(delta) {
  qvQty = Math.max(1, qvQty + delta);
  document.getElementById('qvQty').textContent = qvQty;
}

// ===== CART =====
function initCart() {
  updateCartBadge();
}

function addToCart(item) {
  const existing = cart.find(c => c.id === item.id && c.size === item.size);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  showCartAddedPopup(item);
}

function saveCart() {
  localStorage.setItem('falconiCart', JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  badge.textContent = total;
  if (total > 0) {
    badge.classList.add('visible');
    badge.classList.remove('badge-bounce');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('badge-bounce');
  } else {
    badge.classList.remove('visible');
  }
}

function showCartAddedPopup(item) {
  const existingPopup = document.getElementById('cartAddedPopup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'cartAddedPopup';
  popup.className = 'cart-popup';

  popup.innerHTML = `
    <div class="cart-popup-header">
      <span class="cart-popup-title">✦ Añadido al Carrito</span>
      <span class="cart-popup-close" onclick="document.getElementById('cartAddedPopup').classList.remove('show')">&#x2715;</span>
    </div>
    <div class="cart-popup-body">
      <img class="cart-popup-img" src="${item.image}" alt="${item.name}" />
      <div class="cart-popup-details">
        <div class="cart-popup-name">${item.name}</div>
        <div class="cart-popup-meta">Tamaño: ${item.size || '100ml'}</div>
        <div class="cart-popup-price">$${(item.price || 0).toFixed(2)}</div>
      </div>
    </div>
    <div class="cart-popup-actions">
      <a href="cart.html" class="cart-popup-btn cart-popup-btn-go">Ir al Carrito</a>
      <button class="cart-popup-btn cart-popup-btn-keep" onclick="document.getElementById('cartAddedPopup').classList.remove('show')">Seguir Comprando</button>
    </div>
  `;

  document.body.appendChild(popup);
  void popup.offsetWidth; // trigger reflow
  popup.classList.add('show');

  setTimeout(() => {
    if (popup && popup.parentElement) {
      popup.classList.remove('show');
      setTimeout(() => {
        if (popup.parentElement) popup.remove();
      }, 400);
    }
  }, 5000);
}

// ===== WISHLIST =====
function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    showToast('Added to favorites');
  } else {
    wishlist.splice(idx, 1);
    showToast('Removed from favorites');
  }
  localStorage.setItem('falconiWishlist', JSON.stringify(wishlist));
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  renderProducts(activeFilter);
}



// ===== CARD FORMATTING =====
function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
  input.value = v;
}

// ===== TESTIMONIALS =====
function initTestimonials() {
  testimonialTimer = setInterval(() => {
    const count = document.querySelectorAll('.testimonial').length;
    goToTestimonial((testimonialIdx + 1) % count);
  }, 5000);
}

function goToTestimonial(idx) {
  testimonialIdx = idx;
  document.querySelectorAll('.testimonial').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.dot').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  clearInterval(testimonialTimer);
  testimonialTimer = setInterval(() => {
    const count = document.querySelectorAll('.testimonial').length;
    goToTestimonial((testimonialIdx + 1) % count);
  }, 5000);
}

// ===== SEARCH =====
function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchBar = document.getElementById('searchBar');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');

  searchBtn?.addEventListener('click', () => {
    searchBar.classList.toggle('open');
    if (searchBar.classList.contains('open')) searchInput.focus();
  });

  searchClose?.addEventListener('click', () => {
    searchBar.classList.remove('open');
    searchInput.value = '';
    renderProducts('all');
  });

  searchInput?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    if (!q) { renderProducts('all'); return; }
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const filtered = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.notes.some(n => n.toLowerCase().includes(q))
    );
    grid.innerHTML = '';
    filtered.forEach((p, i) => {
      const isWished = wishlist.includes(p.id);
      const card = document.createElement('div');
      card.className = 'product-card reveal';
      card.style.transitionDelay = (i * 0.08) + 's';
      
      let displayCat = p.category;
      if (p.category === 'mujer') displayCat = 'women';
      if (p.category === 'hombre') displayCat = 'men';
      if (p.category === 'coleccion') displayCat = 'collection';

      card.innerHTML = `
        <div class="product-card-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
          <div class="product-actions-overlay">
            <button class="product-action-btn btn-add-product" onclick="addToCart({id:${p.id},name:'${p.name}',price:${p.price},image:'${p.image}',size:'${p.sizes[p.sizes.length-1]}'}); event.stopPropagation()">+ Cart</button>
            <button class="product-action-btn btn-view-product" onclick="openQuickView(${p.id}); event.stopPropagation()">View</button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-category">${displayCat}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-tagline">${p.tagline}</div>
          <div class="product-footer">
            <div><div class="product-price">$${p.price.toFixed(2)}</div><div class="product-size">${p.sizes.join(' · ')}</div></div>
            <button class="wishlist-btn ${isWished ? 'active' : ''}" onclick="toggleWishlist(${p.id}); event.stopPropagation()">${isWished ? '♥' : '♡'}</button>
          </div>
        </div>
      `;
      card.addEventListener('click', () => openQuickView(p.id));
      grid.appendChild(card);
    });
    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted);font-family:var(--font-serif);font-style:italic;font-size:1.2rem;">No fragrances found for "${q}"</div>`;
    }
    initScrollReveal();
  });
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });

  // Add reveal classes to sections
  document.querySelectorAll('.section-header').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.pillar').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.ingredient-card').forEach(el => el.classList.add('reveal'));
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== NEWSLETTER =====
function submitNewsletter(e) {
  e.preventDefault();
  showToast('Subscription successful. Welcome to Falconi!');
  e.target.reset();
}

// ===== CONTACT FORM =====
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[placeholder="Your name"]').value.trim();
  const email = form.querySelector('input[placeholder="email@example.com"]').value.trim();
  const subjectSelect = form.querySelector('select');
  const subject = subjectSelect ? subjectSelect.value : 'Inquiry';
  const message = form.querySelector('textarea').value.trim();

  try {
    const { db, collection, addDoc, serverTimestamp } = await import('./firebase/firebase.js');
    await addDoc(collection(db, 'contacts'), {
      name,
      email,
      subject,
      message,
      createdAt: serverTimestamp(),
      read: false
    });
    showToast('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.');
    form.reset();
  } catch (err) {
    console.error('Error submitting contact: ', err);
    showToast('Message sent. We will respond soon.');
    form.reset();
  }
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      const navH = document.querySelector('.navbar').offsetHeight;
      const y = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});

// ===== SHIPPING CHANGE =====
document.addEventListener('change', e => {
  if (e.target.name === 'shipping') {
    updateCheckoutSummary();
  }
});

// ===== KEYBOARD ESCAPE =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (typeof closeCart === 'function') closeCart();
    if (typeof closeModal === 'function') closeModal();
    closeQuickView();
    document.getElementById('clientAuthModal')?.classList.remove('open');
    document.getElementById('adminPinModal')?.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ===== LIVE CUSTOMER CHAT FLOATING WIDGET =====
function initCustomerLiveChat() {
  if (document.getElementById('falconiLiveChatWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'falconiLiveChatWidget';
  widget.style.cssText = 'position:fixed; bottom:25px; right:25px; z-index:9990; font-family:Montserrat,sans-serif;';

  widget.innerHTML = `
    <button id="falconiChatToggleBtn" onclick="toggleLiveChatWidget()" style="background:linear-gradient(135deg, #c09b57 0%, #997836 100%); color:#0c0b0e; border:none; border-radius:50%; width:58px; height:58px; font-size:1.6rem; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; position:relative; transition:transform 0.2s;">
      💬
      <span id="customerChatBadge" style="position:absolute; top:-4px; right:-4px; background:#e74c3c; color:#fff; font-size:0.68rem; font-weight:bold; width:20px; height:20px; border-radius:50%; display:none; align-items:center; justify-content:center; border:2px solid #0c0b0e;">1</span>
    </button>

    <div id="falconiChatModal" style="display:none; position:absolute; bottom:70px; right:0; width:340px; height:460px; background:rgba(18,16,22,0.95); border:1px solid #c09b57; border-radius:12px; backdrop-filter:blur(15px); box-shadow:0 15px 40px rgba(0,0,0,0.8); flex-direction:column; overflow:hidden;">
      <div style="padding:0.9rem 1.2rem; background:rgba(25,22,30,0.8); border-bottom:1px solid rgba(192,155,87,0.2); display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:1.1rem;">💬</span>
          <div>
            <strong style="color:#c09b57; font-size:0.9rem; display:block;">Falconi Live Concierge</strong>
            <span style="font-size:0.68rem; color:#8c8270;">● Advisor Online</span>
          </div>
        </div>
        <button onclick="toggleLiveChatWidget()" style="background:none; border:none; color:#c09b57; font-size:1.4rem; cursor:pointer;">&times;</button>
      </div>

      <div id="customerChatMessages" style="flex:1; padding:1rem; overflow-y:auto; display:flex; flex-direction:column; gap:0.6rem; font-size:0.83rem;">
        <div style="align-self:flex-start; background:rgba(35,30,42,0.9); color:#e6d5b8; border:1px solid rgba(192,155,87,0.2); padding:0.65rem 0.9rem; border-radius:10px; border-bottom-left-radius:2px; max-width:85%;">
          Welcome to Falconi Parfums. How may our fragrance advisor assist you today?
        </div>
      </div>

      <div id="falconiChatFooter" style="padding:0.75rem; border-top:1px solid rgba(192,155,87,0.2); display:flex; gap:0.5rem; background:rgba(25,22,30,0.8);">
        <input type="text" id="customerMsgInput" placeholder="Type your message..." style="flex:1; background:rgba(12,11,14,0.9); border:1px solid rgba(192,155,87,0.3); padding:0.6rem 0.8rem; border-radius:6px; color:#e6d5b8; font-size:0.82rem; outline:none;" onkeypress="if(event.key==='Enter') sendCustomerMessage()" />
        <button onclick="sendCustomerMessage()" style="background:linear-gradient(135deg, #c09b57 0%, #997836 100%); color:#0c0b0e; border:none; padding:0.6rem 0.9rem; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">Send</button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);
  initCustomerChatFirebase();
}

let customerChatId = localStorage.getItem('falconiChatId');
if (!customerChatId) {
  customerChatId = 'chat_' + Date.now();
  localStorage.setItem('falconiChatId', customerChatId);
}

const CHAT_INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

window.startNewCustomerChat = function() {
  customerChatId = 'chat_' + Date.now();
  localStorage.setItem('falconiChatId', customerChatId);
  localStorage.removeItem('falconiPendingNameStep');
  localStorage.removeItem('falconiClientName');
  localStorage.setItem('falconiLastChatActivity', String(Date.now()));

  const footer = document.getElementById('falconiChatFooter');
  if (footer) {
    footer.innerHTML = `
      <input type="text" id="customerMsgInput" placeholder="Type your message..." style="flex:1; background:rgba(12,11,14,0.9); border:1px solid rgba(192,155,87,0.3); padding:0.6rem 0.8rem; border-radius:6px; color:#e6d5b8; font-size:0.82rem; outline:none;" onkeypress="if(event.key==='Enter') sendCustomerMessage()" />
      <button onclick="sendCustomerMessage()" style="background:linear-gradient(135deg, #c09b57 0%, #997836 100%); color:#0c0b0e; border:none; padding:0.6rem 0.9rem; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">Send</button>
    `;
  }

  const msgContainer = document.getElementById('customerChatMessages');
  if (msgContainer) {
    msgContainer.innerHTML = `<div style="align-self:flex-start; background:rgba(35,30,42,0.9); color:#e6d5b8; border:1px solid rgba(192,155,87,0.2); padding:0.65rem 0.9rem; border-radius:10px; border-bottom-left-radius:2px; max-width:85%;">Welcome to Falconi Parfums. How may our fragrance advisor assist you today?</div>`;
  }

  prevCustomerMsgCount = 0;
  initCustomerChatFirebase();
};

function checkChatInactivity() {
  const lastActivity = parseInt(localStorage.getItem('falconiLastChatActivity') || '0', 10);
  if (lastActivity > 0 && (Date.now() - lastActivity > CHAT_INACTIVITY_LIMIT)) {
    // Disable active input and show closed chat notice
    const footer = document.getElementById('falconiChatFooter');
    if (footer) {
      footer.innerHTML = `
        <div style="width:100%; text-align:center; padding:0.4rem;">
          <p style="font-size:0.78rem; color:#e6d5b8; margin:0 0 0.5rem;">⏳ Chat session closed due to 30 minutes of inactivity.</p>
          <button onclick="startNewCustomerChat()" style="background:linear-gradient(135deg, #c09b57 0%, #997836 100%); color:#0c0b0e; border:none; padding:0.5rem 1.1rem; border-radius:6px; font-weight:bold; font-size:0.8rem; cursor:pointer; width:100%;">💬 Start a New Chat</button>
        </div>
      `;
    }
  }
}

window.toggleLiveChatWidget = function() {
  const modal = document.getElementById('falconiChatModal');
  const badge = document.getElementById('customerChatBadge');
  if (!modal) return;

  if (modal.style.display === 'none' || modal.style.display === '') {
    modal.style.display = 'flex';
    if (badge) badge.style.display = 'none';
    checkChatInactivity();
  } else {
    modal.style.display = 'none';
  }
};

function playLuxuryChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

let prevCustomerMsgCount = 0;

async function initCustomerChatFirebase() {
  try {
    const { db, collection, doc, onSnapshot, query, orderBy } = await import('./firebase/firebase.js');
    const msgContainer = document.getElementById('customerChatMessages');
    if (!msgContainer) return;

    const q = query(collection(db, 'chats', customerChatId, 'messages'), orderBy('timestamp', 'asc'));

    onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;

      if (snapshot.docs.length > prevCustomerMsgCount) {
        if (prevCustomerMsgCount > 0) {
          playLuxuryChime();
        }
        prevCustomerMsgCount = snapshot.docs.length;
      }

      let html = `<div style="align-self:flex-start; background:rgba(35,30,42,0.9); color:#e6d5b8; border:1px solid rgba(192,155,87,0.2); padding:0.65rem 0.9rem; border-radius:10px; border-bottom-left-radius:2px; max-width:85%;">Welcome to Falconi Parfums. How may our fragrance advisor assist you today?</div>`;

      snapshot.forEach(docSnap => {
        const m = docSnap.data();
        const isCustomer = m.sender === 'customer';
        html += `
          <div style="align-self:${isCustomer ? 'flex-end' : 'flex-start'}; background:${isCustomer ? 'linear-gradient(135deg, #c09b57 0%, #997836 100%)' : 'rgba(35,30,42,0.9)'}; color:${isCustomer ? '#0c0b0e' : '#e6d5b8'}; ${isCustomer ? 'font-weight:500;' : 'border:1px solid rgba(192,155,87,0.2);'} padding:0.65rem 0.9rem; border-radius:10px; ${isCustomer ? 'border-bottom-right-radius:2px;' : 'border-bottom-left-radius:2px;'} max-width:85%; word-break:break-word;">
            ${m.text}
          </div>
        `;
      });

      msgContainer.innerHTML = html;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    });
  } catch (err) {
    console.log('Customer Chat Init notice:', err.message);
  }
}

window.sendCustomerMessage = async function() {
  const input = document.getElementById('customerMsgInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  localStorage.setItem('falconiLastChatActivity', String(Date.now()));

  try {
    const { db, collection, doc, setDoc, addDoc, serverTimestamp, auth } = await import('./firebase/firebase.js');
    const user = auth.currentUser;

    let pendingStep = localStorage.getItem('falconiPendingNameStep') || 'start';
    let storedName = localStorage.getItem('falconiClientName') || '';
    
    let clientName = user ? (user.displayName || user.email.split('@')[0]) : (storedName || 'Client');
    let clientEmail = user ? user.email : 'guest@falconiparfums.com';

    // Handle guest name capture flow
    if (!user && !storedName) {
      if (pendingStep === 'start') {
        // Step 1: Send user's initial message (e.g. "hola")
        localStorage.setItem('falconiPendingNameStep', 'awaiting_name');

        await setDoc(doc(db, 'chats', customerChatId), {
          customerName: 'Guest Customer',
          customerEmail: clientEmail,
          lastMessage: text,
          updatedAt: serverTimestamp(),
          unreadAdvisor: true
        }, { merge: true });

        await addDoc(collection(db, 'chats', customerChatId, 'messages'), {
          sender: 'customer',
          text: text,
          timestamp: serverTimestamp()
        });

        // Bot asks for customer's name
        setTimeout(async () => {
          await addDoc(collection(db, 'chats', customerChatId, 'messages'), {
            sender: 'advisor',
            text: '👋 Welcome to Falconi Parfums! May we please know your name so our fragrance advisor can assist you better?',
            timestamp: serverTimestamp()
          });
        }, 600);

        return;
      } else if (pendingStep === 'awaiting_name') {
        // Step 2: Customer typed their name
        localStorage.setItem('falconiClientName', text);
        localStorage.setItem('falconiPendingNameStep', 'completed');
        clientName = text;

        await setDoc(doc(db, 'chats', customerChatId), {
          customerName: clientName,
          customerEmail: clientEmail,
          lastMessage: `Name registered: ${clientName}`,
          updatedAt: serverTimestamp(),
          unreadAdvisor: true
        }, { merge: true });

        await addDoc(collection(db, 'chats', customerChatId, 'messages'), {
          sender: 'customer',
          text: text,
          timestamp: serverTimestamp()
        });

        // Bot confirmation message
        setTimeout(async () => {
          await addDoc(collection(db, 'chats', customerChatId, 'messages'), {
            sender: 'advisor',
            text: `Thank you, ${clientName}! An advisor will be with you shortly. How can we help you today?`,
            timestamp: serverTimestamp()
          });
        }, 600);

        return;
      }
    }

    // Standard message flow for logged-in or named users
    await setDoc(doc(db, 'chats', customerChatId), {
      customerName: clientName,
      customerEmail: clientEmail,
      lastMessage: text,
      updatedAt: serverTimestamp(),
      unreadAdvisor: true
    }, { merge: true });

    await addDoc(collection(db, 'chats', customerChatId, 'messages'), {
      sender: 'customer',
      text: text,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Customer Send Message Error:', err);
    // Local fallback display
    const msgContainer = document.getElementById('customerChatMessages');
    if (msgContainer) {
      const localDiv = document.createElement('div');
      localDiv.style.cssText = "align-self:flex-end; background:linear-gradient(135deg, #c09b57 0%, #997836 100%); color:#0c0b0e; font-weight:500; padding:0.65rem 0.9rem; border-radius:10px; border-bottom-right-radius:2px; max-width:85%; word-break:break-word;";
      localDiv.textContent = text;
      msgContainer.appendChild(localDiv);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  }
};

// ===== VIDEOS SECTION LOGIC =====
function toggleFeaturedVideo() {
  const video = document.getElementById('featuredVideo');
  const overlay = document.getElementById('videoOverlay');
  if (!video || !overlay) return;

  if (video.paused) {
    video.play().then(() => {
      overlay.classList.add('playing');
    }).catch(err => console.log('Playback error: ', err));
  } else {
    video.pause();
    overlay.classList.remove('playing');
  }
}

function changeFeaturedVideo(src, element) {
  const video = document.getElementById('featuredVideo');
  const overlay = document.getElementById('videoOverlay');
  if (!video || !overlay) return;

  // Pause current
  video.pause();
  
  // Change source
  video.src = src;
  video.load();

  // Play new video
  video.play().then(() => {
    overlay.classList.add('playing');
  }).catch(err => {
    console.log('Playback error on change: ', err);
    overlay.classList.remove('playing');
  });

  // Update active class in playlist
  const items = document.querySelectorAll('.playlist-item');
  items.forEach(item => item.classList.remove('active'));
  element.classList.add('active');
}

// Add automatic listeners to video state to update overlay play button
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('featuredVideo');
  const overlay = document.getElementById('videoOverlay');
  if (video && overlay) {
    video.addEventListener('play', () => {
      overlay.classList.add('playing');
    });
    video.addEventListener('pause', () => {
      overlay.classList.remove('playing');
    });
    video.addEventListener('ended', () => {
      overlay.classList.remove('playing');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initCustomerLiveChat();
});

console.log('%c✦ Falconi Parfums ✦', 'color:#c09b57;font-size:20px;font-family:serif;');
console.log('%cInspired by Oriental Perfumery', 'color:#d4af6f;font-size:12px;');

