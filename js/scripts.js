/* ==========================================================================
   nikhil-verma.me — interaction + motion layer
   Vanilla ES6+. No dependencies. Everything is null-guarded, scroll and
   pointer work is rAF-throttled, and prefers-reduced-motion is honored here
   as well as in CSS.
   ========================================================================== */

(function () {
    "use strict";

    var doc = document;
    var root = doc.documentElement;

    function $(sel, ctx) {
        return (ctx || doc).querySelector(sel);
    }
    function $$(sel, ctx) {
        return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
    }
    function mq(q) {
        return window.matchMedia ? window.matchMedia(q) : null;
    }
    function onMQ(list, fn) {
        if (!list) return;
        if (list.addEventListener) list.addEventListener("change", fn);
        else if (list.addListener) list.addListener(fn);
    }

    var reduceMQ = mq("(prefers-reduced-motion: reduce)");
    function prefersReduced() {
        return !!(reduceMQ && reduceMQ.matches);
    }

    var supportsIO = "IntersectionObserver" in window;

    /* ---------------------------------------------------------------- Theme */

    var THEME_KEY = "theme";
    var TWILIGHT = "twilight";
    var GOLDEN = "golden";

    function readStoredTheme() {
        try {
            var v = localStorage.getItem(THEME_KEY);
            return v === GOLDEN || v === TWILIGHT ? v : null;
        } catch (e) {
            return null;
        }
    }

    function currentTheme() {
        return root.dataset.theme === GOLDEN ? GOLDEN : TWILIGHT;
    }

    function applyTheme(theme, persist) {
        root.dataset.theme = theme;
        if (persist) {
            try {
                localStorage.setItem(THEME_KEY, theme);
            } catch (e) {
                /* private mode / storage disabled — the toggle still works */
            }
        }
    }

    function toggleTheme() {
        var next = currentTheme() === GOLDEN ? TWILIGHT : GOLDEN;
        applyTheme(next, true);
        return next;
    }

    // The inline <head> script already applied any stored theme pre-paint.
    // Only job left here: first visit with nothing stored follows the OS.
    (function initTheme() {
        if (readStoredTheme()) return;
        // NB: the theme names are historical. TWILIGHT is now the LIGHT
        // (paper) default and GOLDEN is the dark palette, so this keys off
        // prefers-color-scheme: dark.
        var dark = mq("(prefers-color-scheme: dark)");
        if (dark && dark.matches) applyTheme(GOLDEN, false);
        // Keep following the OS until the visitor makes an explicit choice.
        onMQ(dark, function (e) {
            if (!readStoredTheme()) applyTheme(e.matches ? GOLDEN : TWILIGHT, false);
        });
    })();

    var themeToggle = $("#themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            toggleTheme();
        });
    }

    /* ------------------------------------------------------- Sun: poke me */

    var sun = $("#sun");
    if (sun) {
        sun.addEventListener("click", function () {
            toggleTheme();
            // restart the one-shot animation even if it is mid-flight
            sun.classList.remove("pop");
            void sun.offsetWidth; // reflow so the animation can re-fire
            sun.classList.add("pop");
        });
        sun.addEventListener("animationend", function (e) {
            if (e.animationName === "pop") sun.classList.remove("pop");
        });
    }

    /* -------------------------------------------------- Footer: this year */

    var yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* ------------------------------------------------ Nav: burger + sheet */

    var nav = $("#nav");
    var navLinks = $("#navLinks");
    var burger = $("#burger");
    var wideMQ = mq("(min-width: 901px)");

    function setMenu(open) {
        if (!nav) return;
        nav.classList.toggle("open", open);
        if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function menuOpen() {
        return !!(nav && nav.classList.contains("open"));
    }

    if (burger) {
        burger.addEventListener("click", function () {
            setMenu(!menuOpen());
        });
    }

    if (navLinks) {
        navLinks.addEventListener("click", function (e) {
            if (e.target.closest && e.target.closest("a")) setMenu(false);
        });
    }

    doc.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menuOpen()) {
            setMenu(false);
            if (burger) burger.focus();
        }
    });

    // Above the mobile breakpoint the sheet is irrelevant — drop the state.
    onMQ(wideMQ, function (e) {
        if (e.matches) setMenu(false);
    });

    /* ----------------------------------------------------- Scroll-spy (IO) */

    var spyLinks = navLinks ? $$("a[href^='#']", navLinks) : [];
    var spyMap = [];
    spyLinks.forEach(function (a) {
        var id = (a.getAttribute("href") || "").slice(1);
        if (!id) return;
        var section = doc.getElementById(id);
        if (section) spyMap.push({ link: a, section: section });
    });

    function setActive(link) {
        spyMap.forEach(function (pair) {
            pair.link.classList.toggle("active", pair.link === link);
        });
    }

    if (supportsIO && spyMap.length) {
        // A thin band ~40% down the viewport acts as the "you are here" line.
        var spy = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var match = null;
                    for (var i = 0; i < spyMap.length; i++) {
                        if (spyMap[i].section === entry.target) match = spyMap[i].link;
                    }
                    setActive(match); // null target (the hero) clears everything
                });
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
        );
        spyMap.forEach(function (pair) {
            spy.observe(pair.section);
        });
        // Scrolling back up into the hero should un-highlight the nav.
        var heroForSpy = $(".hero");
        if (heroForSpy) spy.observe(heroForSpy);
    }

    /* ----------------------------------------------- Reveal on scroll (IO) */

    var reveals = $$(".reveal");

    function showAll() {
        reveals.forEach(function (el) {
            el.style.transitionDelay = "";
            el.classList.add("in");
        });
    }

    if (!reveals.length) {
        /* nothing to do */
    } else if (prefersReduced() || !supportsIO) {
        showAll();
    } else {
        // Stagger siblings so grids cascade instead of popping in as a block.
        var STEP = 70;
        var CAP = 350;
        var seen = new Map();
        reveals.forEach(function (el) {
            var parent = el.parentElement;
            var i = seen.has(parent) ? seen.get(parent) + 1 : 0;
            seen.set(parent, i);
            if (i > 0) el.style.transitionDelay = Math.min(i * STEP, CAP) + "ms";
        });

        var revealIO = new IntersectionObserver(
            function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("in");
                    obs.unobserve(entry.target);
                });
            },
            // Positive bottom margin: the root reaches past the fold so a
            // reveal fires slightly before the element actually enters view.
            { rootMargin: "0px 0px 10% 0px", threshold: 0 }
        );
        reveals.forEach(function (el) {
            revealIO.observe(el);
        });
    }

    /* -------------------------------------------------- Hero role rotator */

    var rotate = $("#rotate");

    var PHRASES = [
        "ship features on <b>AWS License Manager</b>",
        "teach <b>agents</b> to triage my tickets",
        "design <b>interfaces that don't condescend</b>",
        "delete <b>manual work</b>, permanently",
        "care too much about <b>typography</b>"
    ];

    // Phrases carry markup, so never slice the raw string — parse once into
    // segments and re-render from escaped text. A half-written <b> is then
    // structurally impossible.
    function parsePhrase(str) {
        var out = [];
        var re = /<b>([\s\S]*?)<\/b>/g;
        var last = 0;
        var m;
        while ((m = re.exec(str))) {
            if (m.index > last) out.push({ t: str.slice(last, m.index), b: false });
            out.push({ t: m[1], b: true });
            last = re.lastIndex;
        }
        if (last < str.length) out.push({ t: str.slice(last), b: false });
        return out;
    }

    function esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function segLength(segs) {
        return segs.reduce(function (n, s) {
            // Count by code point so emoji are never split in half.
            return n + Array.from(s.t).length;
        }, 0);
    }

    function renderSegs(segs, n) {
        var html = "";
        var left = n;
        for (var i = 0; i < segs.length && left > 0; i++) {
            var chars = Array.from(segs[i].t);
            var take = chars.slice(0, left).join("");
            left -= Math.min(left, chars.length);
            if (!take) continue;
            html += segs[i].b ? "<b>" + esc(take) + "</b>" : esc(take);
        }
        return html;
    }

    if (rotate) {
        var parsed = PHRASES.map(parsePhrase);

        if (prefersReduced()) {
            rotate.innerHTML = renderSegs(parsed[0], segLength(parsed[0]));
        } else {
            var TYPE = 55;
            var ERASE = 26;
            var HOLD = 1600;
            var GAP = 340;
            var pi = 0;
            var n = 0;
            var erasing = false;
            var timer = null;

            function tick() {
                if (doc.hidden) {
                    timer = setTimeout(tick, 400); // idle politely in a bg tab
                    return;
                }
                var segs = parsed[pi];
                var total = segLength(segs);

                if (!erasing) {
                    n++;
                    rotate.innerHTML = renderSegs(segs, n);
                    if (n >= total) {
                        erasing = true;
                        timer = setTimeout(tick, HOLD);
                        return;
                    }
                    timer = setTimeout(tick, TYPE);
                } else {
                    n--;
                    rotate.innerHTML = renderSegs(segs, Math.max(0, n));
                    if (n <= 0) {
                        erasing = false;
                        n = 0;
                        pi = (pi + 1) % parsed.length;
                        timer = setTimeout(tick, GAP);
                        return;
                    }
                    timer = setTimeout(tick, ERASE);
                }
            }
            timer = setTimeout(tick, 520);
        }
    }

    /* ------------------------------------------------------ Stat count-up */

    var statsBlock = $("#stats");
    var counters = statsBlock ? $$(".stat b[data-count]", statsBlock) : [];

    function finalText(el) {
        return (el.dataset.prefix || "") + (el.dataset.count || "") + (el.dataset.suffix || "");
    }

    function runCountUp() {
        var DUR = 1400;
        var items = counters.map(function (el) {
            return {
                el: el,
                to: parseFloat(el.dataset.count) || 0,
                pre: el.dataset.prefix || "",
                post: el.dataset.suffix || ""
            };
        });
        var t0 = null;
        function step(ts) {
            if (t0 === null) t0 = ts;
            var t = Math.min(1, (ts - t0) / DUR);
            var e = 1 - Math.pow(1 - t, 3); // easeOutCubic
            items.forEach(function (it) {
                it.el.textContent = it.pre + Math.round(it.to * e) + it.post;
            });
            if (t < 1) requestAnimationFrame(step);
            else
                items.forEach(function (it) {
                    it.el.textContent = it.pre + it.to + it.post; // land exactly
                });
        }
        requestAnimationFrame(step);
    }

    if (counters.length) {
        if (prefersReduced() || !supportsIO) {
            counters.forEach(function (el) {
                el.textContent = finalText(el);
            });
        } else {
            var statIO = new IntersectionObserver(
                function (entries, obs) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        obs.unobserve(entry.target);
                        runCountUp();
                    });
                },
                { rootMargin: "0px 0px -10% 0px", threshold: 0.25 }
            );
            statIO.observe(statsBlock);
        }
    }

    /* -------------------------- Scroll loop: progress, nav, toTop, parallax */

    var progress = $("#progress");
    var toTop = $("#toTop");
    var hero = $(".hero");
    var stars = $(".stars");
    var bigEnoughMQ = mq("(min-width: 640px)");

    function parallaxAllowed() {
        return !prefersReduced() && !!(bigEnoughMQ ? bigEnoughMQ.matches : true) && !!(sun || stars);
    }

    var heroH = 0;
    var lastSunY = -1;
    var lastStarY = -1;
    var sunBase = null;
    var ticking = false;

    // The sun's resting opacity is a design decision that changes across
    // breakpoints, so read it rather than hard-coding it — the fade below
    // scales that value instead of replacing it.
    function readSunBase() {
        if (!sun) return 1;
        var prev = sun.style.opacity;
        sun.style.opacity = "";
        var v = parseFloat(getComputedStyle(sun).opacity);
        if (prev !== "") sun.style.opacity = prev;
        return isNaN(v) ? 1 : v;
    }

    function clearParallax() {
        if (sun) {
            sun.style.transform = "";
            sun.style.opacity = "";
        }
        if (stars) stars.style.transform = "";
        lastSunY = lastStarY = -1;
        sunBase = null;
    }

    function frame() {
        ticking = false;
        var y = window.pageYOffset || root.scrollTop || 0;

        if (progress) {
            var max = root.scrollHeight - window.innerHeight;
            var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
            progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
        }

        if (nav) nav.classList.toggle("is-stuck", y > 40);
        if (toTop) toTop.classList.toggle("show", y > 600);

        if (parallaxAllowed() && hero) {
            if (!heroH) heroH = hero.offsetHeight || 1;
            var t = Math.min(1, Math.max(0, y / heroH));
            if (sun) {
                if (sunBase === null) sunBase = readSunBase();
                var sy = Math.round(t * 92);
                if (sy !== lastSunY) {
                    lastSunY = sy;
                    // `transform` is used (not `translate`) so any positional
                    // `translate` the stylesheet sets stays intact.
                    sun.style.transform = "translate3d(0," + sy + "px,0)";
                    sun.style.opacity = (sunBase * (1 - t * 0.6)).toFixed(3);
                }
            }
            if (stars) {
                var ty = Math.round(t * 34);
                if (ty !== lastStarY) {
                    lastStarY = ty;
                    stars.style.transform = "translate3d(0," + ty + "px,0)";
                }
            }
        } else if (lastSunY !== -1 || lastStarY !== -1) {
            clearParallax();
        }
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(frame);
        }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(
        "resize",
        function () {
            heroH = 0;
            sunBase = null;
            lastSunY = lastStarY = -1;
            onScroll();
        },
        { passive: true }
    );
    onMQ(bigEnoughMQ, function () {
        clearParallax();
        onScroll();
    });
    onMQ(reduceMQ, function () {
        clearParallax();
        onScroll();
    });
    onScroll();

    /* ------------------------------------------- Pointer tilt (mouse only) */

    var fineMQ = mq("(hover: hover) and (pointer: fine)");
    if (fineMQ && fineMQ.matches && !prefersReduced()) {
        var tiltEl = null;
        var px = 0;
        var py = 0;
        var tiltTicking = false;

        function dropTilt() {
            if (!tiltEl) return;
            tiltEl.classList.remove("is-tilt");
            tiltEl.style.removeProperty("--rx");
            tiltEl.style.removeProperty("--ry");
            tiltEl = null;
        }

        function tiltFrame() {
            tiltTicking = false;
            if (!tiltEl) return;
            var r = tiltEl.getBoundingClientRect();
            if (!r.width || !r.height) return;
            var dx = (px - r.left) / r.width - 0.5;
            var dy = (py - r.top) / r.height - 0.5;
            tiltEl.style.setProperty("--ry", (dx * 5).toFixed(2) + "deg");
            tiltEl.style.setProperty("--rx", (-dy * 4).toFixed(2) + "deg");
        }

        doc.addEventListener(
            "pointermove",
            function (e) {
                if (e.pointerType && e.pointerType !== "mouse") return;
                var card = e.target && e.target.closest ? e.target.closest(".card") : null;
                if (card !== tiltEl) {
                    dropTilt();
                    tiltEl = card;
                    if (tiltEl) tiltEl.classList.add("is-tilt");
                }
                if (!tiltEl) return;
                px = e.clientX;
                py = e.clientY;
                if (!tiltTicking) {
                    tiltTicking = true;
                    requestAnimationFrame(tiltFrame);
                }
            },
            { passive: true }
        );
        doc.addEventListener("pointerdown", dropTilt, { passive: true });
        window.addEventListener("blur", dropTilt);
    }

    /* ------------------------------------------------- Easter egg: futura */

    var flare = null;
    var toast = null;
    var toastTimer = null;

    function ensureFlare() {
        if (flare) return flare;
        flare = doc.createElement("div");
        flare.className = "flare";
        flare.setAttribute("aria-hidden", "true");
        flare.addEventListener("animationend", function (e) {
            if (e.target === flare) flare.classList.remove("go");
        });
        doc.body.appendChild(flare);
        return flare;
    }

    function ensureToast() {
        if (toast) return toast;
        toast = doc.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        doc.body.appendChild(toast);
        return toast;
    }

    function showToast(msg) {
        var el = ensureToast();
        el.textContent = msg;
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            el.classList.remove("show");
        }, 2200);
    }

    function futuraEgg() {
        var next = toggleTheme();
        if (!prefersReduced()) {
            var f = ensureFlare();
            f.classList.remove("go");
            void f.offsetWidth;
            f.classList.add("go");
        }
        showToast(next === GOLDEN ? "inverted" : "vermilion");
    }

    function isTypingTarget(el) {
        if (!el) return false;
        if (el.isContentEditable) return true;
        var tag = el.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }

    var WORD = "futura";
    var buf = "";
    doc.addEventListener("keydown", function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (isTypingTarget(e.target)) return;
        if (!e.key || e.key.length !== 1) return;
        var ch = e.key.toLowerCase();
        if (ch < "a" || ch > "z") {
            buf = "";
            return;
        }
        buf = (buf + ch).slice(-WORD.length);
        if (buf === WORD) {
            buf = "";
            futuraEgg();
        }
    });

    /* --------------------------------------------------- Easter egg: hello */

    try {
        console.log(
            "%c 🌅 nikhil-verma.me ",
            "background:linear-gradient(100deg,#ffd166,#ffb347 28%,#ff6b4a 62%,#ff3d77);" +
                "color:#2b0f1c;font-weight:700;font-size:13px;padding:6px 10px;border-radius:999px;"
        );
        console.log(
            "%cHand-rolled HTML, CSS and vanilla JS — no build step, no framework.\n" +
                "Source: https://github.com/invalidexplorer  ·  psst: type “futura”",
            "color:#c3b8dd;font-size:12px;line-height:1.6"
        );
    } catch (e) {
        /* console styling is a nice-to-have */
    }
})();
