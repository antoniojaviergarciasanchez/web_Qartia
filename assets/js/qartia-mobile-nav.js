(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  ready(function () {
    const header = document.querySelector(".header");
    const nav = header ? header.querySelector(".nav") : null;

    if (!header || !nav) return;

    let toggle = header.querySelector(".mobile-nav-toggle");
    const skipExistingInlineToggle = toggle && document.getElementById("products-nav-clone-js");

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "mobile-nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Abrir menu principal");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<span class="mobile-nav-toggle-lines" aria-hidden="true"></span><span class="mobile-nav-label">Menu</span>';

      if (!nav.id) {
        nav.id = "main-nav";
      }

      toggle.setAttribute("aria-controls", nav.id);
      const logo = header.querySelector(".logo");
      (logo && logo.parentElement ? logo.parentElement : header).insertBefore(toggle, logo ? logo.nextSibling : nav);
    }

    function setOpen(isOpen) {
      header.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.setAttribute("aria-label", isOpen ? "Cerrar menu principal" : "Abrir menu principal");

      if (!isOpen) {
        header.querySelectorAll(".nav-group.open").forEach(function (group) {
          group.classList.remove("open");
          const groupToggle = group.querySelector(".nav-toggle");
          if (groupToggle) {
            groupToggle.setAttribute("aria-expanded", "false");
          }
        });
      }
    }

    if (!skipExistingInlineToggle) {
      toggle.addEventListener("click", function () {
        setOpen(!header.classList.contains("nav-open"));
      });
    }

    nav.addEventListener("click", function (event) {
      if (!event.target.closest("a")) return;
      setOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (header.contains(event.target)) return;
      setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth <= 767) return;
      setOpen(false);
    });
  });
})();
