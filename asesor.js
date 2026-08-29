// Falconi Parfums — Advisor & Inventory Panel

// ===== IMAGE URL HELPER =====
function fixImageUrl(url) {
  if (!url) return 'assets/oud-noir.png';
  if (url.includes('/api/media/file/')) {
    const key = url.substring(url.indexOf('/api/media/file/') + '/api/media/file/'.length);
    return `/api/media/file/${key}`;
  }
  return url;
}

import { 
  db, 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "./firebase/firebase.js";

const PIN_CODE = "2014";
let selectedChatId = null;
let unsubscribeMessages = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  const storedPin = sessionStorage.getItem("falconiAsesorPin");
  if (storedPin === PIN_CODE) {
    showAdvisorLayout();
  } else {
    document.getElementById("asesorPinModal").style.display = "flex";
  }

  // Handle Enter key on PIN input
  const pinInput = document.getElementById("asesorPinInput");
  if (pinInput) {
    pinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") verifyAsesorPin();
    });
  }
});

// Verify PIN Security
window.verifyAsesorPin = function() {
  const input = document.getElementById("asesorPinInput").value.trim();
  const errorMsg = document.getElementById("pinErrorMsg");

  if (input === PIN_CODE) {
    sessionStorage.setItem("falconiAsesorPin", PIN_CODE);
    errorMsg.style.display = "none";
    showAdvisorLayout();
  } else {
    errorMsg.style.display = "block";
    document.getElementById("asesorPinInput").value = "";
  }
};

window.logoutAsesor = function() {
  sessionStorage.removeItem("falconiAsesorPin");
  window.location.reload();
};

function showAdvisorLayout() {
  document.getElementById("asesorPinModal").style.display = "none";
  document.getElementById("asesorLayout").style.display = "flex";
  initRealtimeListeners();
}

// Tab Switching
window.switchTab = function(tabName) {
  document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));

  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.classList.add("active");

  const titles = {
    chat: "💬 Chat en Vivo con Clientes",
    productos: "📦 Catálogo de Productos",
    inventario: "📋 Control de Inventario & Precios",
    pedidos: "🛒 Gestión de Pedidos & Envíos",
    usuarios: "👥 Clientes Registrados"
  };

  document.getElementById("tabTitle").textContent = titles[tabName] || "Portal del Asesor";

  // Highlight active menu item
  const menuItems = document.querySelectorAll(".sidebar-item");
  menuItems.forEach(item => {
    if (item.getAttribute("onclick").includes(tabName)) {
      item.classList.add("active");
    }
  });
};

// Initialize Real-time Firestore Listeners
function initRealtimeListeners() {
  listenToChats();
  listenToProducts();
  listenToOrders();
  listenToUsers();
}

// 1. LISTEN TO LIVE CHATS
function listenToChats() {
  const container = document.getElementById("chatsListContainer");
  const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = `<p style="padding:1.5rem; color:#8c8270; text-align:center; font-size:0.85rem;">No hay conversaciones activas.</p>`;
      return;
    }

    let html = "";
    let unreadCount = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const chatId = docSnap.id;
      const isSelected = chatId === selectedChatId;
      if (data.unreadAdvisor) unreadCount++;

      const timeStr = data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      html += `
        <div class="chat-card ${isSelected ? 'active' : ''}" onclick="selectAdvisorChat('${chatId}', '${data.customerName || 'Cliente'}', '${data.customerEmail || ''}')">
          <div class="chat-card-header">
            <span class="chat-card-name">${data.customerName || 'Cliente Anonimo'}</span>
            <span class="chat-card-time">${timeStr}</span>
          </div>
          <div class="chat-card-msg">${data.lastMessage || 'Nueva conversación iniciada'}</div>
        </div>
      `;
    });

    container.innerHTML = html;

    const badge = document.getElementById("unreadBadge");
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }
  });
}

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
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

let prevAdvisorMsgCount = 0;

// SELECT AN ACTIVE CHAT
window.selectAdvisorChat = function(chatId, name, email) {
  selectedChatId = chatId;
  document.getElementById("activeChatClientName").textContent = name;
  document.getElementById("activeChatClientEmail").textContent = email || "Sin correo especificado";

  // Highlight active chat card in list
  document.querySelectorAll(".chat-card").forEach(el => el.classList.remove("active"));

  // Reset unread flag in Firestore
  updateDoc(doc(db, "chats", chatId), { unreadAdvisor: false }).catch(() => {});

  // Unsubscribe previous messages listener
  if (unsubscribeMessages) unsubscribeMessages();

  // Reset count tracker
  prevAdvisorMsgCount = 0;

  // Listen to messages subcollection for selected chat
  const msgContainer = document.getElementById("activeChatMessages");
  const qMsg = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));

  unsubscribeMessages = onSnapshot(qMsg, (snapshot) => {
    if (snapshot.docs.length > prevAdvisorMsgCount) {
      if (prevAdvisorMsgCount > 0) {
        playNotificationSound();
      }
      prevAdvisorMsgCount = snapshot.docs.length;
    }

    let msgHtml = "";
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      const isAdvisor = m.sender === 'advisor';
      msgHtml += `
        <div class="msg-bubble ${isAdvisor ? 'advisor' : 'customer'}">
          ${m.text}
        </div>
      `;
    });

    msgContainer.innerHTML = msgHtml || `<p style="text-align:center; color:#8c8270; font-size:0.85rem;">Escriba un mensaje para iniciar la asistencia.</p>`;
    msgContainer.scrollTop = msgContainer.scrollHeight;
  });
};

// SEND ADVISOR MESSAGE
window.sendAdvisorMessage = async function() {
  const input = document.getElementById("advisorMsgInput");
  const text = input.value.trim();
  if (!text || !selectedChatId) return;

  input.value = "";

  try {
    // Add message to subcollection
    await addDoc(collection(db, "chats", selectedChatId, "messages"), {
      sender: "advisor",
      text: text,
      timestamp: serverTimestamp()
    });

    // Update parent chat document
    await updateDoc(doc(db, "chats", selectedChatId), {
      lastMessage: `Asesor: ${text}`,
      updatedAt: serverTimestamp(),
      unreadCustomer: true
    });
  } catch (err) {
    console.error("Advisor chat error:", err);
  }
};

// 2. LISTEN TO PRODUCTS & INVENTORY
function listenToProducts() {
  const grid = document.getElementById("productsGrid");
  const tableBody = document.getElementById("inventoryTableBody");

  onSnapshot(collection(db, "products"), (snapshot) => {
    if (snapshot.empty) {
      grid.innerHTML = `<p style="color:#8c8270;">No hay productos en la base de datos.</p>`;
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#8c8270;">Sin productos registrados.</td></tr>`;
      return;
    }

    let gridHtml = "";
    let tableHtml = "";

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const originalPrice = parseFloat(p.price || 0);
      const discount = parseFloat(p.discount || 0);
      const finalPrice = discount > 0 ? (originalPrice * (1 - discount / 100)).toFixed(2) : originalPrice.toFixed(2);

      gridHtml += `
        <div class="data-card">
          <div style="height:140px; overflow:hidden; border-radius:6px; margin-bottom:0.75rem; background:#000;">
            <img src="${fixImageUrl(p.image) || 'assets/oud-noir.png'}" style="width:100%; height:100%; object-fit:cover;" alt="${p.name}" />
          </div>
          <h3 style="font-family:'Cormorant Garamond',serif; color:#c09b57; font-size:1.2rem; margin:0 0 0.3rem;">${p.name}</h3>
          <p style="font-size:0.78rem; color:#8c8270; margin-bottom:0.5rem;">${p.description ? p.description.substring(0, 70) + '...' : 'Perfume de lujo'}</p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#f3e5ca; font-size:1.1rem;">$${finalPrice} USD</strong>
            ${discount > 0 ? `<span style="background:#c09b57; color:#000; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:bold;">-${discount}% OFF</span>` : ''}
          </div>
        </div>
      `;

      tableHtml += `
        <tr>
          <td><strong style="color:#f3e5ca;">${p.name}</strong></td>
          <td>${p.category || 'Eau de Parfum'}</td>
          <td>$${originalPrice.toFixed(2)}</td>
          <td>${discount > 0 ? `<span style="color:#c09b57;">-${discount}%</span>` : '0%'}</td>
          <td><strong style="color:#c09b57;">$${finalPrice}</strong></td>
          <td><span style="color:#2ecc71;">● En Stock</span></td>
        </tr>
      `;
    });

    grid.innerHTML = gridHtml;
    tableBody.innerHTML = tableHtml;
  });
}

// 3. LISTEN TO ORDERS
function listenToOrders() {
  const tableBody = document.getElementById("ordersTableBody");
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#8c8270;">No se han registrado pedidos aún.</td></tr>`;
      return;
    }

    let html = "";
    snapshot.forEach(docSnap => {
      const o = docSnap.data();
      const orderId = docSnap.id.substring(0, 8).toUpperCase();
      const dateStr = o.createdAt ? new Date(o.createdAt.toDate()).toLocaleDateString() : 'Reciente';

      const itemCount = (o.items || []).reduce((sum, i) => sum + (i.qty || 1), 0);

      html += `
        <tr>
          <td><strong style="color:#c09b57;">#${orderId}</strong></td>
          <td>${o.customerName || 'Cliente'}<br><small style="color:#8c8270;">${o.customerEmail || ''}</small></td>
          <td>${itemCount} perfumes</td>
          <td><strong style="color:#f3e5ca;">$${parseFloat(o.totalAmount || 0).toFixed(2)} USD</strong></td>
          <td><span style="background:rgba(46,204,113,0.15); color:#2ecc71; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem;">${o.paymentStatus || 'Pagado'}</span></td>
          <td><span style="background:rgba(192,155,87,0.15); color:#c09b57; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem;">${o.shippingStatus || 'En proceso'}</span></td>
          <td>${dateStr}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  });
}

// 4. LISTEN TO USERS
function listenToUsers() {
  const tableBody = document.getElementById("usersTableBody");

  onSnapshot(collection(db, "users"), (snapshot) => {
    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#8c8270;">No hay usuarios registrados.</td></tr>`;
      return;
    }

    let html = "";
    snapshot.forEach(docSnap => {
      const u = docSnap.data();
      html += `
        <tr>
          <td><strong style="color:#f3e5ca;">${u.displayName || u.email.split('@')[0]}</strong></td>
          <td>${u.email}</td>
          <td><span style="color:#c09b57;">${u.role || 'Cliente'}</span></td>
          <td><button class="btn-primary" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="switchTab('chat')">💬 Atender</button></td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  });
}
