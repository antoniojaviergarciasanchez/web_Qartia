document.addEventListener("DOMContentLoaded", function () {
  const groups = document.querySelectorAll(".nav-group");

  groups.forEach((group) => {
    const toggle = group.querySelector(".nav-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      const willOpen = !group.classList.contains("open");

      groups.forEach((otherGroup) => {
        otherGroup.classList.remove("open");
        const otherToggle = otherGroup.querySelector(".nav-toggle");
        if (otherToggle) {
          otherToggle.setAttribute("aria-expanded", "false");
        }
      });

      group.classList.toggle("open", willOpen);
      toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  document.addEventListener("click", function (event) {
    groups.forEach((group) => {
      if (group.contains(event.target)) return;
      group.classList.remove("open");
      const toggle = group.querySelector(".nav-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
});
