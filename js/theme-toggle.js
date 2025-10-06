/* ==============================
  Theme toggle behavior
  - Controls light/dark theme via data-theme on <html>
  - Syncs icon in header and injected menu item icon
  - Notifies Matrix script when theme changes
  - Switches highlight.js theme (tokyo-night-dark/light)
   ============================== */
(function () {
  function setIcons(themeIcon, menuIcon, theme) {
    var iconSrc =
      theme === "dark"
        ? (window.__siteBaseUrl || "") + "/assets/moon.svg"
        : (window.__siteBaseUrl || "") + "/assets/sun.svg";
    if (themeIcon) themeIcon.src = iconSrc;
    if (menuIcon) menuIcon.src = iconSrc;
  }

  function setHLJSTheme(theme) {
    var lightCss = document.getElementById("tokyo-night-light");
    var darkCss = document.getElementById("tokyo-night-dark");
    if (!lightCss || !darkCss) return;
    if (theme === "dark") {
      lightCss.disabled = true;
      darkCss.disabled = false;
    } else {
      lightCss.disabled = false;
      darkCss.disabled = true;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Cache DOM elements and constants
    const MOBILE_BREAKPOINT = 600;
    const THEMES = { LIGHT: "light", DARK: "dark" };

    function getNextTheme(current) {
      return current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    }

    var html = document.documentElement;
    var themeIcon = document.getElementById("theme-icon");
    // Change default theme
    var savedTheme = localStorage.getItem("theme") || "light";
    html.setAttribute("data-theme", savedTheme);
    setIcons(
      themeIcon,
      document.querySelector(".theme-toggle-link img"),
      savedTheme
    );
    setHLJSTheme(savedTheme);

    // Notify matrix system of initial theme to ensure canvas is painted correctly
    // Trying to fix the race condition where matrix paints before theme is set
    try {
      window.__matrixOnThemeChanged?.();
    } catch (e) {
      console.warn("Matrix theme change notification failed on init:", e);
    }

    function switchTheme(next) {
      html.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);

      // Cache the menu icon query
      const menuIcon = document.querySelector(".theme-toggle-link img");
      setIcons(themeIcon, menuIcon, next);
      setHLJSTheme(next);

      try {
        window.__matrixOnThemeChanged?.();
      } catch (e) {
        console.warn("Matrix theme change notification failed:", e);
      }
    }

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = html.getAttribute("data-theme");
        var next = getNextTheme(current);
        switchTheme(next);
      });
    }

    var navCheckbox = document.getElementById("nav-trigger");
    var navTriggerContainer = document.querySelector(".site-nav .trigger");

    function isMobile() {
      return (
        window.matchMedia &&
        window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      );
    }

    function createMenuToggleLink() {
      if (!navTriggerContainer || document.querySelector(".theme-toggle-link"))
        return;
      var a = document.createElement("a");
      a.href = "#";
      a.className = "page-link theme-toggle-link";
      a.setAttribute("role", "button");
      var img = document.createElement("img");
      img.alt = "Toggle Theme";
      img.width = 20;
      img.height = 20;
      setIcons(null, img, html.getAttribute("data-theme") || "dark");
      var span = document.createElement("span");
      span.textContent = " Toggle Theme";
      a.appendChild(img);
      a.appendChild(span);
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var current = html.getAttribute("data-theme");
        var next = getNextTheme(current);
        switchTheme(next);
      });
      navTriggerContainer.appendChild(a);
    }

    function removeMenuToggleLink() {
      var link = document.querySelector(".theme-toggle-link");
      if (link && link.parentElement) link.parentElement.removeChild(link);
    }

    if (navCheckbox) {
      navCheckbox.addEventListener("change", function () {
        var opened = navCheckbox.checked;
        if (opened && isMobile()) {
          createMenuToggleLink();
        } else {
          removeMenuToggleLink();
        }
      });
    }

    window.addEventListener(
      "resize",
      function () {
        if (!navCheckbox) return;
        if (navCheckbox.checked && isMobile()) {
          createMenuToggleLink();
        } else {
          removeMenuToggleLink();
        }
      },
      { passive: true }
    );
  });
})();
