// Vercel Web Analytics custom event para trackear clicks en el credito
// "Designed by Logika Digital" del footer en todas las paginas.
(function () {
  function bind() {
    var link = document.querySelector(".footer-credit");
    if (!link) return;
    link.addEventListener("click", function () {
      if (typeof window.va === "function") {
        try { window.va("event", { name: "logika_credit_click" }); } catch (_) {}
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
