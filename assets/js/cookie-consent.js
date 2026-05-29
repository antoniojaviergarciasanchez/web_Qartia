(function () {
  const STORAGE_KEY = "qartiaCookieConsent";
  const ACCEPTED = "accepted";
  const REJECTED = "rejected";

  function getPolicyHref() {
    const path = window.location.pathname || "";
    return path.includes("/sources/") ? "../politica-cookies.html" : "politica-cookies.html";
  }

  function removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }

  function unlockPage() {
    document.body.classList.remove("qartia-cookie-locked");
  }

  function acceptCookies() {
    localStorage.setItem(STORAGE_KEY, ACCEPTED);
    removeElement("qartia-cookie-banner");
    removeElement("qartia-cookie-blocker");
    unlockPage();
  }

  function showBlocker() {
    removeElement("qartia-cookie-banner");
    document.body.classList.add("qartia-cookie-locked");

    if (document.getElementById("qartia-cookie-blocker")) {
      return;
    }

    const blocker = document.createElement("section");
    blocker.id = "qartia-cookie-blocker";
    blocker.className = "qartia-cookie-blocker";
    blocker.setAttribute("role", "dialog");
    blocker.setAttribute("aria-modal", "true");
    blocker.setAttribute("aria-label", "Acceso bloqueado por rechazo de cookies");
    blocker.innerHTML = `
      <div class="qartia-cookie-blocker-card">
        <p class="qartia-cookie-kicker">Preferencia de cookies</p>
        <h2 class="qartia-cookie-title">No podemos mostrar la web sin tu aceptación</h2>
        <p>Has rechazado las cookies necesarias para navegar por esta web. Puedes revisar la política de cookies o aceptar para continuar.</p>
        <div class="qartia-cookie-actions">
          <button class="qartia-cookie-btn qartia-cookie-btn-primary" type="button" data-cookie-accept>Aceptar cookies y entrar</button>
          <a class="qartia-cookie-btn qartia-cookie-btn-secondary" href="${getPolicyHref()}">Ver política de cookies</a>
        </div>
      </div>
    `;
    document.body.appendChild(blocker);
    blocker.querySelector("[data-cookie-accept]").addEventListener("click", acceptCookies);
  }

  function rejectCookies() {
    localStorage.setItem(STORAGE_KEY, REJECTED);
    showBlocker();
  }

  function showBanner() {
    if (document.getElementById("qartia-cookie-banner")) {
      return;
    }

    const banner = document.createElement("aside");
    banner.id = "qartia-cookie-banner";
    banner.className = "qartia-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "true");
    banner.setAttribute("aria-label", "Aviso de cookies");
    banner.innerHTML = `
      <div>
        <p class="qartia-cookie-kicker">Cookies</p>
        <h2 class="qartia-cookie-title">Tu privacidad es importante</h2>
        <p class="qartia-cookie-text">
          Utilizamos cookies necesarias para que la web funcione correctamente. Al aceptar confirmas que has leído y aceptas nuestra
          <a class="qartia-cookie-link" href="${getPolicyHref()}">Política de cookies</a>.
        </p>
      </div>
      <div class="qartia-cookie-actions">
        <button class="qartia-cookie-btn qartia-cookie-btn-secondary" type="button" data-cookie-reject>Rechazar</button>
        <button class="qartia-cookie-btn qartia-cookie-btn-primary" type="button" data-cookie-accept>Aceptar cookies</button>
      </div>
    `;
    document.body.appendChild(banner);
    banner.querySelector("[data-cookie-accept]").addEventListener("click", acceptCookies);
    banner.querySelector("[data-cookie-reject]").addEventListener("click", rejectCookies);
  }

  function initCookieConsent() {
    const status = localStorage.getItem(STORAGE_KEY);

    if (status === ACCEPTED) {
      return;
    }

    if (status === REJECTED) {
      showBlocker();
      return;
    }

    showBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
