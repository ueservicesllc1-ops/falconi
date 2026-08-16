import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged 
} from "./firebase/firebase.js";

let mode = "login"; // "login", "register", or "forgot"

window.switchAuthTab = function(newMode) {
  mode = newMode;
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const nameGroup = document.getElementById("nameGroup");
  const passwordGroup = document.getElementById("passwordGroup");
  const submitBtn = document.getElementById("authSubmitBtn");
  const googleBtn = document.getElementById("googleBtn");
  const googleDivider = document.getElementById("googleDivider");
  const msg = document.getElementById("authMsg");

  msg.className = "auth-msg";
  msg.style.display = "none";

  if (mode === "login") {
    tabLogin.style.display = "block";
    tabRegister.style.display = "block";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    nameGroup.style.display = "none";
    passwordGroup.style.display = "flex";
    googleBtn.style.display = "flex";
    googleDivider.style.display = "flex";
    submitBtn.innerHTML = "Sign In &#x2756;";
  } else if (mode === "register") {
    tabLogin.style.display = "block";
    tabRegister.style.display = "block";
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    nameGroup.style.display = "flex";
    passwordGroup.style.display = "flex";
    googleBtn.style.display = "flex";
    googleDivider.style.display = "flex";
    submitBtn.innerHTML = "Create Account &#x2756;";
  } else if (mode === "forgot") {
    tabLogin.classList.remove("active");
    tabRegister.classList.remove("active");
    nameGroup.style.display = "none";
    passwordGroup.style.display = "none";
    googleBtn.style.display = "none";
    googleDivider.style.display = "none";
    submitBtn.innerHTML = "Send Password Reset Email &#x2756;";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");
  const googleBtn = document.getElementById("googleBtn");

  // Monitor auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Logged in user:", user.email);
      const name = user.displayName || user.email;
      showMsg(`Welcome back, ${name}! Redirecting to Admin Dashboard...`, "success");
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 1000);
    }
  });

  // Handle Form Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword") ? document.getElementById("authPassword").value : "";
    const name = document.getElementById("authName") ? document.getElementById("authName").value.trim() : "";

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        showMsg("Authentication successful. Welcome!", "success");
      } else if (mode === "register") {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (name && userCred.user) {
          await updateProfile(userCred.user, { displayName: name });
        }
        showMsg("Account created successfully! Welcome to Falconi.", "success");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        showMsg(`Password reset link sent to ${email}. Check your inbox!`, "success");
      }
    } catch (err) {
      showMsg(formatAuthError(err.code || err.message), "error");
    }
  });

  // Handle Google Popup Login
  googleBtn.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      showMsg(`Signed in with Google as ${result.user.displayName || result.user.email}`, "success");
    } catch (err) {
      console.error("Google Auth Error:", err);
      showMsg(formatAuthError(err.code || err.message), "error");
    }
  });
});

function showMsg(text, type) {
  const msg = document.getElementById("authMsg");
  msg.textContent = text;
  msg.className = `auth-msg ${type}`;
}

function formatAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con este correo electrónico.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Por favor ingresa un correo válido.";
    case "auth/popup-closed-by-user":
      return "El inicio de sesión con Google fue cancelado.";
    default:
      return code.replace("auth/", "").replace(/-/g, " ");
  }
}
