import { 
  auth, 
  onAuthStateChanged, 
  signOut,
  db,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  uploadMediaToB2,
  listB2Media,
  deleteB2Media
} from "./firebase/firebase.js";

const BACKEND_URL = "http://localhost:4000";

// Global Modal Handlers
window.openAdminModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (modalId === "modalProducts") loadCatalog();
    if (modalId === "modalOrders") loadOrders();
    if (modalId === "modalMediaB2") loadB2Gallery();
    if (modalId === "modalAnalytics") loadAnalytics();
    if (modalId === "modalDiscounts") loadDiscountsOverview();
    if (modalId === "modalClients") loadClients();
  }
};

window.closeAdminModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const adminBadge = document.getElementById("adminUserBadge");
  const logoutBtn = document.getElementById("adminLogoutBtn");
  const productForm = document.getElementById("productForm");
  const pSingleFile = document.getElementById("pSingleFile");
  const b2UploadStatus = document.getElementById("b2UploadStatus");

  // Protect Admin Dashboard route
  onAuthStateChanged(auth, (user) => {
    const pin = sessionStorage.getItem("falconiAdminPin");
    if (!user) {
      window.location.href = "auth.html";
    } else if (user.email !== "ueservicesllc1@gmail.com") {
      alert("Acceso denegado. Solo la cuenta autorizada tiene privilegios de administración.");
      window.location.href = "index.html";
    } else if (pin !== "1619") {
      const enteredPin = prompt("Ingresa el PIN de seguridad (1619):");
      if (enteredPin === "1619") {
        sessionStorage.setItem("falconiAdminPin", "1619");
        if (adminBadge) adminBadge.textContent = user.email;
      } else {
        alert("PIN incorrecto.");
        window.location.href = "index.html";
      }
    } else {
      if (adminBadge) adminBadge.textContent = user.email;
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      sessionStorage.removeItem("falconiAdminPin");
      window.location.href = "auth.html";
    });
  }

  // Shippo Origin Address Configuration
  const shippoOriginForm = document.getElementById("shippoOriginForm");
  const originSaveStatus = document.getElementById("originSaveStatus");

  // Load saved origin address if exists
  const savedOrigin = JSON.parse(localStorage.getItem("falconiShippoOrigin") || "null");
  if (savedOrigin) {
    if (document.getElementById("origName")) document.getElementById("origName").value = savedOrigin.name || "";
    if (document.getElementById("origPhone")) document.getElementById("origPhone").value = savedOrigin.phone || "";
    if (document.getElementById("origStreet")) document.getElementById("origStreet").value = savedOrigin.street1 || "";
    if (document.getElementById("origCity")) document.getElementById("origCity").value = savedOrigin.city || "";
    if (document.getElementById("origState")) document.getElementById("origState").value = savedOrigin.state || "";
    if (document.getElementById("origZip")) document.getElementById("origZip").value = savedOrigin.zip || "";
    if (document.getElementById("origCountry")) document.getElementById("origCountry").value = savedOrigin.country || "US";
    if (document.getElementById("origEmail")) document.getElementById("origEmail").value = savedOrigin.email || "";
    if (document.getElementById("googleMapsKey")) document.getElementById("googleMapsKey").value = savedOrigin.googleMapsKey || "AIzaSyBPVJ0OhSO_ee1l_6JRaZDB0_9xuFM_FNw";
    if (document.getElementById("parcelLength")) document.getElementById("parcelLength").value = savedOrigin.parcelLength || "8";
    if (document.getElementById("parcelWidth")) document.getElementById("parcelWidth").value = savedOrigin.parcelWidth || "6";
    if (document.getElementById("parcelHeight")) document.getElementById("parcelHeight").value = savedOrigin.parcelHeight || "4";
    if (document.getElementById("parcelWeight")) document.getElementById("parcelWeight").value = savedOrigin.parcelWeight || "1.5";
  }

  if (shippoOriginForm) {
    shippoOriginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const originObj = {
        name: document.getElementById("origName").value.trim(),
        phone: document.getElementById("origPhone").value.trim(),
        street1: document.getElementById("origStreet").value.trim(),
        city: document.getElementById("origCity").value.trim(),
        state: document.getElementById("origState").value.trim(),
        zip: document.getElementById("origZip").value.trim(),
        country: document.getElementById("origCountry").value,
        email: document.getElementById("origEmail").value.trim(),
        googleMapsKey: document.getElementById("googleMapsKey") ? document.getElementById("googleMapsKey").value.trim() : "",
        parcelLength: document.getElementById("parcelLength") ? document.getElementById("parcelLength").value : "8",
        parcelWidth: document.getElementById("parcelWidth") ? document.getElementById("parcelWidth").value : "6",
        parcelHeight: document.getElementById("parcelHeight") ? document.getElementById("parcelHeight").value : "4",
        parcelWeight: document.getElementById("parcelWeight") ? document.getElementById("parcelWeight").value : "1.5"
      };

      localStorage.setItem("falconiShippoOrigin", JSON.stringify(originObj));

      if (originSaveStatus) {
        originSaveStatus.style.display = "block";
        originSaveStatus.textContent = "✓ ¡Dirección de Origen Shippo guardada exitosamente!";
        originSaveStatus.style.background = "rgba(40,167,69,0.2)";
        originSaveStatus.style.color = "#75b798";
      }
    });
  }

  // Handle 1 Photo Upload to Backblaze B2
  if (pSingleFile) {
    pSingleFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      b2UploadStatus.textContent = "Subiendo foto a Backblaze B2...";
      b2UploadStatus.style.color = "#c09b57";

      try {
        const res = await uploadMediaToB2(file, "products");
        document.getElementById("pImage").value = res.url;
        b2UploadStatus.textContent = `✓ Foto subida con éxito a B2: ${res.key}`;
        b2UploadStatus.style.color = "#75b798";
      } catch (err) {
        b2UploadStatus.textContent = `Error al subir: ${err.message}`;
        b2UploadStatus.style.color = "#ff8a8a";
      }
    });
  }

  // Product Creation with % Discount Field
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusDiv = document.getElementById("productStatus");
      statusDiv.style.display = "block";
      statusDiv.textContent = "Guardando producto en Firestore...";
      statusDiv.style.background = "rgba(192,155,87,0.2)";
      statusDiv.style.color = "#c09b57";

      try {
        const discountVal = parseFloat(document.getElementById("pDiscount").value) || 0;
        const basePrice = parseFloat(document.getElementById("pPrice").value);

        const newProduct = {
          name: document.getElementById("pName").value.trim(),
          category: document.getElementById("pCategory").value,
          price: basePrice,
          discountPercent: discountVal,
          finalPrice: discountVal > 0 ? basePrice * (1 - discountVal / 100) : basePrice,
          image: document.getElementById("pImage").value.trim(),
          notes: document.getElementById("pNotes").value.split(",").map(n => n.trim()),
          description: document.getElementById("pDesc").value.trim(),
          sizes: ["30ml", "50ml", "100ml"],
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "products"), newProduct);
        statusDiv.textContent = "✓ ¡Producto guardado exitosamente en Firestore!";
        statusDiv.style.background = "rgba(40,167,69,0.2)";
        statusDiv.style.color = "#75b798";
        productForm.reset();
        loadCatalog();
      } catch (err) {
        statusDiv.textContent = `Error: ${err.message}`;
        statusDiv.style.background = "rgba(220,53,69,0.2)";
        statusDiv.style.color = "#ff8a8a";
      }
    });
  }
});

// Load Firestore Products Catalog
async function loadCatalog() {
  const grid = document.getElementById("firestoreCatalogGrid");
  if (!grid) return;

  try {
    const snap = await getDocs(collection(db, "products"));
    if (snap.empty) {
      grid.innerHTML = `<p style="color:#8c8270; grid-column:1/-1;">No hay productos en Firestore.</p>`;
      return;
    }

    grid.innerHTML = "";
    snap.forEach(docSnap => {
      const p = docSnap.data();
      const hasDiscount = p.discountPercent && p.discountPercent > 0;

      const card = document.createElement("div");
      card.style.background = "rgba(255,255,255,0.03)";
      card.style.border = "1px solid rgba(192,155,87,0.2)";
      card.style.borderRadius = "8px";
      card.style.padding = "0.75rem";
      card.style.position = "relative";

      card.innerHTML = `
        ${hasDiscount ? `<span style="position:absolute; top:8px; right:8px; background:#dc3545; color:#fff; font-size:0.65rem; padding:2px 6px; border-radius:4px; font-weight:700;">-${p.discountPercent}% OFF</span>` : ''}
        <img src="${p.image}" alt="${p.name}" style="width:100%; height:120px; object-fit:cover; border-radius:6px;" />
        <h4 style="color:#c09b57; font-size:0.9rem; margin:0.5rem 0 0.2rem 0;">${p.name}</h4>
        <div style="font-size:0.8rem;">
          ${hasDiscount 
            ? `<span style="text-decoration:line-through; color:#8c8270;">$${p.price.toFixed(2)}</span> <strong style="color:#75b798;">$${(p.price * (1 - p.discountPercent/100)).toFixed(2)}</strong>`
            : `<strong>$${p.price.toFixed(2)}</strong>`
          }
        </div>
        <button style="margin-top:0.5rem; background:rgba(220,53,69,0.2); border:1px solid #dc3545; color:#ff8a8a; font-size:0.7rem; padding:0.3rem 0.6rem; border-radius:4px; cursor:pointer;" onclick="deleteProduct('${docSnap.id}')">Eliminar</button>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:#ff8a8a;">Error al cargar catálogo: ${err.message}</p>`;
  }
}

window.deleteProduct = async function(id) {
  if (!confirm("¿Eliminar este producto de Firestore?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    loadCatalog();
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
};

// Load Firestore Orders (Purchases made in Cart)
async function loadOrders() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  try {
    const snap = await getDocs(collection(db, "orders"));
    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:#8c8270; text-align:center; padding:2rem;">No hay compras ni pedidos registrados aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    snap.forEach(docSnap => {
      const order = docSnap.data();
      const tr = document.createElement("tr");

      const itemsText = (order.items || []).map(i => `${i.name} (x${i.qty || 1})`).join(", ");

      tr.innerHTML = `
        <td style="font-family:monospace; color:#c09b57;">#${docSnap.id.substring(0,8)}</td>
        <td><strong>${order.customerName || order.customerEmail || 'Cliente Falconi'}</strong><br/><span style="font-size:0.75rem; color:#8c8270;">${order.customerEmail || ''}</span></td>
        <td style="font-size:0.75rem;">${itemsText}</td>
        <td><strong>$${(order.totalAmount || 0).toFixed(2)}</strong></td>
        <td><span class="badge-status badge-paid">${order.paymentStatus || 'Pagado (Stripe)'}</span></td>
        <td>
          ${order.trackingNumber 
            ? `<a href="${order.trackingUrl}" target="_blank" style="color:#6ea8fe; font-size:0.75rem;">${order.trackingNumber}</a>`
            : `<button style="background:#c09b57; color:#000; border:none; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.7rem; font-weight:600; cursor:pointer;" onclick="generateShippoLabelForOrder('${docSnap.id}')">Generar Guía Shippo</button>`
          }
        </td>
        <td><button style="background:rgba(220,53,69,0.2); border:1px solid #dc3545; color:#ff8a8a; font-size:0.7rem; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;" onclick="deleteOrder('${docSnap.id}')">Borrar</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:#ff8a8a; text-align:center;">Error al cargar pedidos: ${err.message}</td></tr>`;
  }
}

window.generateShippoLabelForOrder = async function(orderId) {
  try {
    alert("Cotizando y generando guía de envío Shippo...");
    const rateRes = await fetch(`${BACKEND_URL}/api/shippo/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressTo: { name: "Cliente Falconi", street1: "742 Evergreen Terrace", city: "Springfield", state: "OR", zip: "97477", country: "US" } })
    });
    const rateData = await rateRes.json();

    if (!rateData.success || !rateData.rates.length) {
      throw new Error("No se pudieron obtener tarifas de envío de Shippo.");
    }

    const labelRes = await fetch(`${BACKEND_URL}/api/shippo/create-label`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rateId: rateData.rates[0].id })
    });
    const labelData = await labelRes.json();

    if (labelData.success) {
      alert(`✓ ¡Guía de Envío Shippo Generada Con Éxito!\nTracking #: ${labelData.trackingNumber}`);
      loadOrders();
    } else {
      alert("Error al generar etiqueta Shippo.");
    }
  } catch (err) {
    alert("Error Shippo: " + err.message);
  }
};

window.deleteOrder = async function(id) {
  if (!confirm("¿Eliminar este pedido?")) return;
  try {
    await deleteDoc(doc(db, "orders", id));
    loadOrders();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// Shippo Live Rate Calculator
window.calculateShippoRatesLive = async function() {
  const results = document.getElementById("shippoResults");
  results.innerHTML = "<p style='color:#c09b57;'>Consultando API de Shippo en vivo...</p>";

  const savedOrigin = JSON.parse(localStorage.getItem("falconiShippoOrigin") || "null");

  try {
    const res = await fetch(`${BACKEND_URL}/api/shippo/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressFrom: savedOrigin || undefined,
        addressTo: {
          name: document.getElementById("shipName").value,
          street1: document.getElementById("shipAddress").value,
          city: document.getElementById("shipCity").value,
          state: document.getElementById("shipState").value,
          zip: "33139",
          country: "US"
        }
      })
    });
    const data = await res.json();
    if (data.success && data.rates.length) {
      results.innerHTML = `
        <div style="background:rgba(40,167,69,0.15); border:1px solid #28a745; padding:0.75rem; border-radius:6px; margin-top:0.5rem;">
          <strong style="color:#75b798;">✓ Tarifa Shippo Encontrada:</strong><br/>
          Proveedor: <strong>${data.rates[0].provider}</strong> (${data.rates[0].servicelevel})<br/>
          Costo: <strong style="color:#c09b57;">$${data.rates[0].amount} ${data.rates[0].currency}</strong>
        </div>
      `;
    } else {
      results.innerHTML = `<p style="color:#ff8a8a;">API Shippo respondió con estado de prueba activo.</p>`;
    }
  } catch (err) {
    results.innerHTML = `<p style="color:#ff8a8a;">Error Shippo: ${err.message}</p>`;
  }
};

// Load B2 Media Gallery
async function loadB2Gallery() {
  const grid = document.getElementById("b2MediaGrid");
  if (!grid) return;

  try {
    const data = await listB2Media();
    if (!data.files || !data.files.length) {
      grid.innerHTML = `<p style="color:#8c8270; grid-column:1/-1;">No hay archivos en Backblaze B2.</p>`;
      return;
    }

    grid.innerHTML = data.files.map(f => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(192,155,87,0.2); border-radius:6px; padding:0.5rem; text-align:center;">
        <img src="${BACKEND_URL}${f.proxyUrl}" style="width:100%; height:100px; object-fit:cover; border-radius:4px;" />
        <span style="font-size:0.65rem; color:#8c8270; display:block; margin-top:0.3rem; word-break:break-all;">${f.key}</span>
      </div>
    `).join("");
  } catch (err) {
    grid.innerHTML = `<p style="color:#ff8a8a;">Error B2: ${err.message}</p>`;
  }
}

// Load Analytics
async function loadAnalytics() {
  try {
    const snap = await getDocs(collection(db, "orders"));
    let totalSales = 0;
    let count = 0;
    snap.forEach(docSnap => {
      const o = docSnap.data();
      totalSales += Number(o.totalAmount || 0);
      count++;
    });
    document.getElementById("totalSalesVal").textContent = `$${totalSales.toFixed(2)}`;
    document.getElementById("totalOrdersCount").textContent = count;
  } catch (err) {
    console.log("Analytics error:", err);
  }
}

// Load Discounts Overview
async function loadDiscountsOverview() {
  const div = document.getElementById("discountsOverview");
  if (!div) return;
  try {
    const snap = await getDocs(collection(db, "products"));
    let discountItems = [];
    snap.forEach(docSnap => {
      const p = docSnap.data();
      if (p.discountPercent && p.discountPercent > 0) {
        discountItems.push(p);
      }
    });

    if (!discountItems.length) {
      div.innerHTML = `<p style="color:#8c8270;">No hay productos con % de descuento configurado.</p>`;
    } else {
      div.innerHTML = discountItems.map(p => `
        <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:6px; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
          <span><strong>${p.name}</strong></span>
          <span style="color:#dc3545; font-weight:bold;">${p.discountPercent}% OFF</span>
        </div>
      `).join("");
    }
  } catch (err) {
    div.innerHTML = `<p style="color:#ff8a8a;">${err.message}</p>`;
  }
}

// Load Clients List
async function loadClients() {
  const div = document.getElementById("clientsList");
  if (!div) return;
  div.innerHTML = `
    <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:6px; margin-bottom:0.5rem;">
      <strong>ueservicesllc1@gmail.com</strong> <span style="color:#c09b57; font-size:0.75rem;">(Administrador Principal)</span>
    </div>
  `;
}
