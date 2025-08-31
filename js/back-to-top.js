/* ==============================
    Back to top button
    - Used to scroll to the top of the page when the user scrolls down
   ============================== */

(function () {
  var backToTopButton = document.getElementById("back-to-top");
  if (!backToTopButton) return;

  function onScroll() {
    if (document.documentElement.scrollTop > 100) {
      backToTopButton.classList.add("show");
    } else {
      backToTopButton.classList.remove("show");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTopButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
