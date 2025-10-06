/* ==============================
  Matrix background effect
  - Draws "digital rain" on a full-viewport canvas
  - Respects visibility, theme, and a user on/off preference
  - Exposes __setMatrixEnabled for toggling from UI
  - Injects a mobile menu link ("Toggle Matrix") when the hamburger is open
   ============================== */
(function () {
  // Constants
  const MOBILE_BREAKPOINT = 600;
  const MATRIX_UPDATE_INTERVAL = 35;
  const MOUSE_INFLUENCE_RADIUS = 100;
  const MATRIX_CHARACTERS = "10".split("");

  // Helper function to get matrix enabled state
  function getMatrixEnabledState() {
    try {
      const saved = localStorage.getItem("matrixEnabled");
      return saved === null ? false : saved === "true";
    } catch (e) {
      return false;
    }
  }

  // Helper function to set matrix enabled state
  function setMatrixEnabledState(enabled) {
    try {
      localStorage.setItem("matrixEnabled", String(enabled));
    } catch (e) {
      console.warn("Failed to save matrix state:", e);
    }
  }

  var c = document.getElementById("c");
  if (!c) {
    try {
      c = document.createElement("canvas");
      c.id = "c";
      c.setAttribute("aria-hidden", "true");
      document.body.appendChild(c);
    } catch (e) {
      return;
    }
  }

  // Create frosted glass overlay for readability
  var frostedGlass = document.querySelector(".frosted-glass-overlay");
  if (!frostedGlass) {
    try {
      frostedGlass = document.createElement("div");
      frostedGlass.className = "frosted-glass-overlay";
      document.body.appendChild(frostedGlass);
    } catch (e) {}
  }

  // Create matrix overlay for readability
  var overlay = document.querySelector(".matrix-overlay");
  if (!overlay) {
    try {
      overlay = document.createElement("div");
      overlay.className = "matrix-overlay";
      document.body.appendChild(overlay);
    } catch (e) {}
  }

  var ctx = c.getContext("2d");

  // Check if user prefers reduced motion
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Matrix enable/disable plumbing
  var drawInterval = null;
  var matrixEnabled = !reduceMotion;

  function getRect(el) {
    return el ? el.getBoundingClientRect() : { height: 0 };
  }

  function resize() {
    // Cover the full viewport with the canvas regardless of header/footer
    c.style.top = "0";
    c.style.bottom = "0";
    c.style.left = "0";
    c.style.right = "0";
    c.style.width = "auto";
    c.style.height = "auto";

    c.width = window.innerWidth;
    c.height = Math.max(0, window.innerHeight);
    columns = Math.floor(c.width / font_size);
    drops = [];
    for (var x = 0; x < columns; x++) drops[x] = 1;

    // Position frosted glass overlay to cover full viewport
    if (frostedGlass) {
      frostedGlass.style.top = "0";
      frostedGlass.style.bottom = "0";
      frostedGlass.style.left = "0";
      frostedGlass.style.right = "0";
      frostedGlass.style.width = "auto";
      frostedGlass.style.height = "auto";
    }

    // Position overlay to match canvas
    if (overlay) {
      overlay.style.top = "0";
      overlay.style.bottom = "0";
      overlay.style.left = "0";
      overlay.style.right = "0";
      overlay.style.width = "auto";
      overlay.style.height = "auto";
    }
  }

  var matrix = MATRIX_CHARACTERS;
  var font_size = 12;
  var columns = Math.floor(window.innerWidth / font_size);
  var drops = [];
  for (var x = 0; x < columns; x++) drops[x] = 1;

  var mouseX = -10000;
  var mouseY = -10000;
  var influenceRadius = MOUSE_INFLUENCE_RADIUS; // px

  var lastTheme = null;
  function getTheme() {
    try {
      var attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark") return "dark";
      if (attr === "light") return "light";
      var stored = null;
      try {
        stored = localStorage.getItem("theme");
      } catch (e) {}
      if (stored === "dark") return "dark";
      if (stored === "light") return "light";
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    } catch (e) {}
    return "light";
  }

  window.addEventListener(
    "mousemove",
    function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    },
    { passive: true }
  );

  window.addEventListener("mouseleave", function () {
    mouseX = -10000;
    mouseY = -10000;
  });

  window.addEventListener("resize", resize);

  function draw() {
    if (!matrixEnabled) return;
    var theme = getTheme();
    var isDark = theme === "dark";
    var trailColor = isDark
      ? "rgba(0, 0, 0, 0.05)"
      : "rgba(255, 255, 255, 0.05)";
    var bgSolid = isDark ? "#000" : "#fff";
    var charColor = isDark ? "#fff" : "#000";

    if (lastTheme !== theme) {
      ctx.fillStyle = bgSolid;
      ctx.fillRect(0, 0, c.width, c.height);
      lastTheme = theme;
    }

    ctx.fillStyle = trailColor;
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = charColor;
    ctx.font = font_size + "px monospace";
    for (var i = 0; i < drops.length; i++) {
      var text = matrix[Math.floor(Math.random() * matrix.length)];
      var baseX = i * font_size;
      var y = drops[i] * font_size;

      var dx = baseX - mouseX;
      var dy = y - mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var x = baseX;
      if (dist < influenceRadius && dist > 0.001) {
        var force = 3 - dist / influenceRadius; // 0..1
        var push = (dx / dist) * force * influenceRadius * 0.6; // scale push
        x = baseX + push;
      }

      ctx.fillText(text, x, y);
      if (drops[i] * font_size > c.height && Math.random() > 0.975)
        drops[i] = 0;
      drops[i]++;
    }
  }

  function startMatrix() {
    if (drawInterval) return;
    drawInterval = setInterval(draw, MATRIX_UPDATE_INTERVAL);
  }

  function stopMatrix() {
    if (!drawInterval) return;
    clearInterval(drawInterval);
    drawInterval = null;
    try {
      ctx.clearRect(0, 0, c.width, c.height);
    } catch (e) {}
  }

  function applyVisibilityPolicy() {
    if (!matrixEnabled) return;
    if (document.hidden) {
      stopMatrix();
    } else {
      startMatrix();
    }
  }

  // Toggle matrix on/off
  function setMatrixEnabled(enabled) {
    if (reduceMotion && enabled) {
      console.log(
        "Cannot enable matrix effect due to reduced motion preference"
      );
      return;
    }

    matrixEnabled = !!enabled;
    setMatrixEnabledState(matrixEnabled);
    if (matrixEnabled) {
      c.style.display = "block";
      if (frostedGlass) frostedGlass.style.display = "block";
      startMatrix();
    } else {
      // Keep canvas visible and paint solid background that matches theme
      c.style.display = "block";
      if (frostedGlass) frostedGlass.style.display = "none";
      stopMatrix();
      paintSolidBackground();
    }
  }

  window.__setMatrixEnabled = setMatrixEnabled;

  // Matrix toggle UI wiring (desktop + mobile)
  function setMatrixIcon(enabled, imgEl) {
    if (!imgEl) return;
    imgEl.style.opacity = enabled ? "1" : "0.4";
    try {
      imgEl.removeAttribute("title");
    } catch (e) {}
    imgEl.alt = enabled ? "Disable Matrix" : "Enable Matrix";
  }

  function wireMatrixToggleUI() {
    const matrixBtn = document.getElementById("matrix-toggle");
    const matrixIcon = document.getElementById("matrix-icon");
    const navTriggerContainer = document.querySelector(".site-nav .trigger");
    const navCheckbox = document.getElementById("nav-trigger");

    // Cache the enabled state once
    let enabled = getMatrixEnabledState();

    setMatrixIcon(enabled, matrixIcon);

    if (matrixBtn) {
      matrixBtn.addEventListener("click", function () {
        enabled = !enabled;
        setMatrixEnabled(enabled);
        setMatrixIcon(enabled, matrixIcon);

        // Update mobile menu icon if it exists
        const menuImg = document.querySelector(".matrix-toggle-link img");
        setMatrixIcon(enabled, menuImg);
      });
    }

    // Mobile hambuger menu injection
    function isMobile() {
      return (
        window.matchMedia &&
        window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      );
    }
    function createMatrixToggleLink() {
      if (!navTriggerContainer || document.querySelector(".matrix-toggle-link"))
        return;
      var a = document.createElement("a");
      a.href = "#";
      a.className = "page-link matrix-toggle-link";
      a.setAttribute("role", "button");
      var img = document.createElement("img");
      img.alt = "Toggle Matrix";
      img.width = 20;
      img.height = 20;
      img.src = (window.__siteBaseUrl || "") + "/assets/white_rabbit.svg";
      setMatrixIcon(enabled, img);
      var span = document.createElement("span");
      span.textContent = " Toggle Matrix";
      a.appendChild(img);
      a.appendChild(span);
      a.addEventListener("click", function (e) {
        e.preventDefault();
        enabled = !enabled;
        setMatrixEnabled(enabled);
        setMatrixIcon(enabled, matrixIcon);
        setMatrixIcon(enabled, img);
      });
      navTriggerContainer.appendChild(a);
    }
    function removeMatrixToggleLink() {
      var link = document.querySelector(".matrix-toggle-link");
      if (link && link.parentElement) link.parentElement.removeChild(link);
    }
    if (navCheckbox) {
      navCheckbox.addEventListener("change", function () {
        var opened = navCheckbox.checked;
        if (opened && isMobile()) createMatrixToggleLink();
        else removeMatrixToggleLink();
      });
      window.addEventListener(
        "resize",
        function () {
          if (navCheckbox.checked && isMobile()) createMatrixToggleLink();
          else removeMatrixToggleLink();
        },
        { passive: true }
      );
    }
  }

  // Paint a solid background when matrix is disabled to match current theme
  function paintSolidBackground() {
    try {
      var theme = getTheme();
      var bgSolid = theme === "dark" ? "#000" : "#fff";
      ctx.fillStyle = bgSolid;
      ctx.fillRect(0, 0, c.width, c.height);
    } catch (e) {}
  }

  // Hook for theme changes from theme toggle
  function onThemeChanged() {
    if (!matrixEnabled) paintSolidBackground();
  }
  window.__matrixOnThemeChanged = onThemeChanged;

  // Init
  resize();

  // Check reduced motion preference and log if disabled
  if (reduceMotion && matrixEnabled) {
    matrixEnabled = false;
    console.log("Reduced motion preference detected, disabling matrix effect");
  }

  var initialEnabled = getMatrixEnabledState();
  setMatrixEnabled(initialEnabled);

  document.addEventListener("visibilitychange", applyVisibilityPolicy);
  // Wire UI after DOM is ready (in case our script loads in head)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireMatrixToggleUI);
  } else {
    wireMatrixToggleUI();
  }
})();
