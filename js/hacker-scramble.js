/* ==============================
    Hacker scramble effect
    - Scrambles the text of the site title when hovered over
    - Scrambles random words in paragraphs when the page is focused
    - Exposes __setHackerEffectEnabled for toggling from UI
   ============================== */

(function () {
  // Constants
  const VIEWPORT_MARGIN = 200;
  const MAX_ATTEMPTS = 5;
  const INITIAL_DELAY = 1500;
  const PERIODIC_INTERVAL = 8000;
  const SCRAMBLE_DURATIONS = {
    TITLE: 300,
    CLICK: 500,
    WORD: 1000,
  };

  // Cache frequently accessed selectors
  const TEXT_SELECTORS = "p, h1, h2, h3, h4, h5, h6, li, td";

  // Check if user prefers reduced motion
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let effectsEnabled = false; // Disabled by default

  function startScramble(targetEl, durationMs) {
    if (!targetEl || !effectsEnabled) return;

    const originalText =
      targetEl.getAttribute("data-original-text") || targetEl.textContent;
    targetEl.setAttribute("data-original-text", originalText);

    // Clear any existing animation
    const existingTimer = targetEl.getAttribute("data-scramble-timer");
    if (existingTimer) cancelAnimationFrame(parseInt(existingTimer, 10));

    targetEl.classList.add("hacking");
    const chars = "10HACKING!<>-_\\/[]{}—=+*^?#________:";
    const startTime = performance.now();

    function update() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Easing function for smoother animation
      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      let out = "";
      for (let i = 0; i < originalText.length; i++) {
        if (Math.random() < easeProgress) {
          out += originalText[i];
        } else {
          out += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      targetEl.textContent = out;

      if (progress < 1) {
        const timerId = requestAnimationFrame(update);
        targetEl.setAttribute("data-scramble-timer", timerId);
      } else {
        targetEl.textContent = originalText;
        targetEl.classList.remove("hacking");
        targetEl.removeAttribute("data-scramble-timer");
      }
    }

    const timerId = requestAnimationFrame(update);
    targetEl.setAttribute("data-scramble-timer", timerId);
  }

  function hasCodeAncestor(el) {
    while (el && el !== document.body) {
      if (
        el.tagName === "CODE" ||
        el.tagName === "PRE" ||
        el.tagName === "SCRIPT" ||
        el.tagName === "STYLE"
      ) {
        return true;
      }
      if (
        el.classList &&
        (el.classList.contains("highlight") ||
          el.classList.contains("hljs") ||
          el.classList.contains("no-hacker-effect"))
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function isNearViewport(el, margin = VIEWPORT_MARGIN) {
    try {
      const rect = el.getBoundingClientRect();
      return (
        rect.bottom >= -margin &&
        rect.top <=
          (window.innerHeight || document.documentElement.clientHeight) +
            margin &&
        rect.right >= -margin &&
        rect.left <=
          (window.innerWidth || document.documentElement.clientWidth) + margin
      );
    } catch (e) {
      return false;
    }
  }

  function getTextNodes(element, filter) {
    const textNodes = [];

    function getNodes(node) {
      if (hasCodeAncestor(node)) return;

      if (node.nodeType === 3) {
        // Text node
        if (!filter || filter(node)) {
          textNodes.push(node);
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          getNodes(node.childNodes[i]);
        }
      }
    }

    getNodes(element);
    return textNodes;
  }

  // Helper function to get random word span (replaces pickRandomTextWordSpan)
  function getRandomWordSpan(onlyVisible = true) {
    // Get all paragraphs that are not inside protected elements
    const paragraphs = Array.from(
      document.querySelectorAll(TEXT_SELECTORS)
    ).filter((p) => {
      if (hasCodeAncestor(p)) return false;
      if (!p.textContent || !p.textContent.trim()) return false;
      if (onlyVisible && !isNearViewport(p, VIEWPORT_MARGIN)) return false;
      return true;
    });

    if (paragraphs.length === 0) return null;

    // Try a few paragraphs to find one with a replaceable word
    for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
      const p = paragraphs[Math.floor(Math.random() * paragraphs.length)];
      const textNodes = getTextNodes(p, (node) => {
        return (
          node.nodeValue &&
          node.nodeValue.trim() &&
          !hasCodeAncestor(node.parentElement)
        );
      });

      if (textNodes.length === 0) continue;

      const textNode = textNodes[Math.floor(Math.random() * textNodes.length)];
      const text = textNode.nodeValue;

      // Find word boundaries (more robust approach)
      const wordMatch = text.match(/\b[\w']+\b/);
      if (!wordMatch) continue;

      const wordStart = wordMatch.index;
      const wordEnd = wordStart + wordMatch[0].length;

      // Create a wrapper span for the word
      const span = document.createElement("span");
      span.textContent = text.substring(wordStart, wordEnd);
      span.className = "hacker-word";

      // Replace the word in the text node with our span
      const before = text.substring(0, wordStart);
      const after = text.substring(wordEnd);

      // Create new nodes
      const beforeNode = document.createTextNode(before);
      const afterNode = document.createTextNode(after);

      // Replace the original text node
      const parent = textNode.parentNode;
      parent.replaceChild(afterNode, textNode);
      parent.insertBefore(span, afterNode);
      parent.insertBefore(beforeNode, span);

      return span;
    }
    return null;
  }

  function cleanupWordSpans() {
    document.querySelectorAll("span.hacker-word").forEach((span) => {
      const parent = span.parentNode;
      if (parent) {
        const text = document.createTextNode(span.textContent);
        parent.replaceChild(text, span);
        parent.normalize(); // Merge adjacent text nodes
      }
    });
  }

  function bindHackerEffect() {
    if (reduceMotion && effectsEnabled) {
      effectsEnabled = false;
      console.log(
        "Reduced motion preference detected, disabling hacker effects"
      );
    }

    const siteTitle = document.querySelector("header.site-header a.site-title");
    if (siteTitle) {
      siteTitle.addEventListener("mouseenter", () =>
        startScramble(siteTitle, SCRAMBLE_DURATIONS.TITLE)
      );
      siteTitle.addEventListener("focus", () =>
        startScramble(siteTitle, SCRAMBLE_DURATIONS.TITLE)
      );
      siteTitle.addEventListener("click", () =>
        startScramble(siteTitle, SCRAMBLE_DURATIONS.CLICK)
      );
      setTimeout(() => startScramble(siteTitle, SCRAMBLE_DURATIONS.TITLE), 500);
    }

    // Initial random word effect
    setTimeout(() => {
      if (!effectsEnabled) return;

      if (Math.random() > 0.5) {
        // Chance to skip
        const candidate = getRandomWordSpan(true);
        if (candidate) startScramble(candidate, SCRAMBLE_DURATIONS.WORD);
      }
    }, INITIAL_DELAY);

    // Periodic subtle effect
    let periodicInterval;
    if (effectsEnabled) {
      periodicInterval = setInterval(() => {
        if (document.hidden) return;

        const sel = window.getSelection();
        if (sel && sel.type === "Range") return;

        if (Math.random() > 0.5) {
          // Chance each interval
          const candidate = getRandomWordSpan(true);
          if (candidate) startScramble(candidate, SCRAMBLE_DURATIONS.WORD);
        }
      }, PERIODIC_INTERVAL);
    }

    // Cleanup on pagehide
    window.addEventListener("pagehide", () => {
      if (periodicInterval) clearInterval(periodicInterval);
      cleanupWordSpans();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindHackerEffect);
  } else {
    bindHackerEffect();
  }
})();
