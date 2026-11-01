/* RANGGA PRASETIO — fitur tambahan: pencarian halaman, animasi muncul, kartu identitas miring. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Pencarian halaman (Ctrl+K atau /) ---------- */
  const PAGES = [
    ["Beranda", "index.html"], ["Tentang", "tentang.html"], ["Portofolio", "portofolio.html"],
    ["Dashboard jurnal", "jurnal.html"], ["Kalkulator posisi", "kalkulator.html"], ["Simulator risiko", "simulator.html"],
    ["Belajar forex", "belajar.html"], ["Modul 1: Apa itu forex?", "modul-1.html"],
    ["Modul 2: Pasangan, pip, dan lot", "modul-2.html"], ["Modul 3: Membaca candlestick", "modul-3.html"],
    ["Modul 4: Tren, support, dan resistance", "modul-4.html"], ["Modul 5: Indikator dasar", "modul-5.html"],
    ["Modul 6: Risiko dan psikologi", "modul-6.html"], ["Glosarium forex", "glosarium.html"],
    ["Kuis forex", "kuis.html"], ["Peringatan risiko", "risiko.html"], ["Kontak", "kontak.html"]
  ];
  const dlg = $("#palette"), input = $("#paletteInput"), list = $("#paletteList");
  if (dlg && input && list && typeof dlg.showModal === "function") {
    const render = () => {
      const q = input.value.trim().toLowerCase();
      list.textContent = "";
      const hits = PAGES.filter(([t]) => !q || t.toLowerCase().includes(q));
      hits.forEach(([t, href]) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = href;
        a.textContent = t;
        li.appendChild(a);
        list.appendChild(li);
      });
      if (!hits.length) {
        const li = document.createElement("li");
        li.className = "muted";
        li.textContent = "Tidak ada halaman yang cocok.";
        list.appendChild(li);
      }
    };
    const open = () => {
      input.value = "";
      render();
      dlg.showModal();
      input.focus();
    };
    const sb = $("#searchBtn");
    if (sb) sb.addEventListener("click", open);
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = list.querySelector("a");
        if (first) window.location.href = first.getAttribute("href");
      }
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    document.addEventListener("keydown", (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag) && !dlg.open) {
        e.preventDefault();
        open();
      }
    });
  }

  /* ---------- Elemen muncul saat digulir ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    const targets = $$(".section > *, .card, .panel, .roadmap li, .contact-row, .pill-list li, .glossary > div, .notice");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.95) {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
  }

  /* ---------- Kartu identitas mengikuti kursor ---------- */
  const hang = $(".id-hang"), card = $(".id-card");
  if (hang && card && !reduce) {
    hang.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      card.style.setProperty("--ry", ((x - 0.5) * 18).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 14).toFixed(2) + "deg");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });
    hang.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }
})();
