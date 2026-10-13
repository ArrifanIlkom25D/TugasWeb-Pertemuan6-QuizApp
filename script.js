"use strict";

const QUESTIONS = [
  // JavaScript
  { category: "JavaScript", q: "Keyword mana yang membuat variabel yang nilainya tidak bisa di-assign ulang?", options: ["var", "let", "const", "static"], answer: 2 },
  { category: "JavaScript", q: "Apa hasil dari typeof null?", options: ["\"null\"", "\"object\"", "\"undefined\"", "\"number\""], answer: 1 },
  { category: "JavaScript", q: "Method array mana yang mengembalikan array baru hasil transformasi tiap elemen?", options: ["forEach()", "filter()", "map()", "push()"], answer: 2 },
  { category: "JavaScript", q: "Operator === membandingkan nilai dengan cara…", options: ["Nilai saja", "Nilai dan tipe data", "Tipe data saja", "Referensi memori saja"], answer: 1 },
  { category: "JavaScript", q: "Apa fungsi JSON.parse()?", options: ["Mengubah objek menjadi string JSON", "Mengubah string JSON menjadi objek", "Menghapus properti objek", "Menggabungkan dua objek"], answer: 1 },

  // DOM
  { category: "DOM", q: "Method mana yang membuat elemen HTML baru lewat JavaScript?", options: ["document.createElement()", "document.newElement()", "document.append()", "document.makeNode()"], answer: 0 },
  { category: "DOM", q: "Properti mana yang aman untuk mengisi teks tanpa memproses HTML?", options: ["innerHTML", "outerHTML", "textContent", "innerElement"], answer: 2 },
  { category: "DOM", q: "Event delegation memanfaatkan konsep…", options: ["Event capturing saja", "Event bubbling", "Event cloning", "Event throttling"], answer: 1 },
  { category: "DOM", q: "Method untuk memasang event listener adalah…", options: ["addEventListener()", "attachEvent()", "onEvent()", "listenTo()"], answer: 0 },
  { category: "DOM", q: "Properti event mana yang menunjuk elemen yang diklik?", options: ["event.target", "event.source", "event.element", "event.click"], answer: 0 },

  // HTML & CSS
  { category: "HTML & CSS", q: "Properti CSS mana yang mengubah warna teks?", options: ["font-color", "text-color", "color", "foreground"], answer: 2 },
  { category: "HTML & CSS", q: "Tag HTML5 yang tepat untuk bagian navigasi adalah…", options: ["<nav>", "<menu-bar>", "<navigate>", "<links>"], answer: 0 },
  { category: "HTML & CSS", q: "Nilai display mana yang membuat layout fleksibel satu dimensi?", options: ["block", "flex", "inline", "table"], answer: 1 },
  { category: "HTML & CSS", q: "Atribut apa yang dipakai agar gambar punya teks alternatif?", options: ["title", "alt", "caption", "label"], answer: 1 },
  { category: "HTML & CSS", q: "Satuan CSS mana yang relatif terhadap lebar viewport?", options: ["px", "em", "vw", "pt"], answer: 2 },

  // Web & Git
  { category: "Web & Git", q: "Perintah Git untuk menyimpan perubahan ke riwayat lokal adalah…", options: ["git push", "git commit", "git clone", "git pull"], answer: 1 },
  { category: "Web & Git", q: "Perintah untuk mengirim commit ke repository GitHub adalah…", options: ["git push", "git fetch", "git stage", "git merge"], answer: 0 },
  { category: "Web & Git", q: "Web storage mana yang datanya tetap ada setelah browser ditutup?", options: ["sessionStorage", "localStorage", "Variabel JS", "Cache DOM"], answer: 1 },
  { category: "Web & Git", q: "Kode status HTTP 404 berarti…", options: ["Server error", "Sukses", "Halaman tidak ditemukan", "Akses ditolak"], answer: 2 },
  { category: "Web & Git", q: "File .gitignore berfungsi untuk…", options: ["Menghapus repository", "Mengabaikan file agar tidak dilacak Git", "Menyembunyikan commit", "Mengunci branch"], answer: 1 },
];

const CATEGORIES = ["Acak", "JavaScript", "DOM", "HTML & CSS", "Web & Git"];
const QUESTIONS_PER_ROUND = 5;
const TIME_LIMIT = 15; // detik per soal
const SCORE_KEY = "quizHighScores";
const THEME_KEY = "quizTheme";

const $ = (id) => document.getElementById(id);
const screens = { start: $("screen-start"), quiz: $("screen-quiz"), result: $("screen-result") };
const el = {
  categories: $("categories"), startHigh: $("start-highscore"),
  count: $("question-count"), timer: $("timer"), liveScore: $("score-live"),
  bar: $("progress-bar"), box: $("question-box"), question: $("question-text"),
  options: $("options"), feedback: $("feedback"), next: $("next-btn"),
  finalScore: $("final-score"), message: $("result-message"), high: $("high-score"),
  restart: $("restart-btn"), menu: $("menu-btn"), theme: $("theme-toggle"),
};
const state = { list: [], index: 0, score: 0, locked: false, timerId: null, timeLeft: TIME_LIMIT, category: "" };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(name) {
  Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
}

function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORE_KEY)) || {}; }
  catch { return {}; }
}
function saveScore(category, score) {
  const scores = loadScores();
  const isNew = score > (scores[category] || 0);
  if (isNew) {
    scores[category] = score;
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  }
  return isNew;
}

function renderCategories() {
  el.categories.replaceChildren();
  const scores = loadScores();
  CATEGORIES.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category";
    btn.dataset.category = name;
    btn.textContent = scores[name] != null ? `${name} (terbaik: ${scores[name]}/${QUESTIONS_PER_ROUND})` : name;
    el.categories.appendChild(btn);
  });
  el.startHigh.textContent = "Skor tertinggi tiap kategori tersimpan di browser ini.";
}

function startQuiz(category) {
  const pool = category === "Acak" ? QUESTIONS : QUESTIONS.filter((item) => item.category === category);
  state.category = category;
  state.list = shuffle(pool).slice(0, QUESTIONS_PER_ROUND);
  state.index = 0;
  state.score = 0;
  show("quiz");
  renderQuestion();
}

function renderQuestion() {
  const item = state.list[state.index];
  state.locked = false;

  el.count.textContent = `Soal ${state.index + 1} dari ${state.list.length}`;
  el.liveScore.textContent = `Skor: ${state.score}`;
  el.bar.style.width = `${(state.index / state.list.length) * 100}%`;
  el.question.textContent = item.q;
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  el.next.hidden = true;

  el.options.replaceChildren();
  item.options.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.index = i;
    btn.textContent = text;
    el.options.appendChild(btn);
  });

  el.box.classList.remove("enter");
  void el.box.offsetWidth; 
  el.box.classList.add("enter");

  startTimer();
}

function startTimer() {
  clearInterval(state.timerId);
  state.timeLeft = TIME_LIMIT;
  updateTimer();
  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateTimer();
    if (state.timeLeft <= 0) handleAnswer(-1); // waktu habis
  }, 1000);
}
function updateTimer() {
  el.timer.textContent = `${state.timeLeft} dtk`;
  el.timer.classList.toggle("low", state.timeLeft <= 5);
}

// chosen = indeks pilihan, atau -1 jika waktu habis
function handleAnswer(chosen) {
  if (state.locked) return;
  state.locked = true;
  clearInterval(state.timerId);

  const item = state.list[state.index];
  const buttons = el.options.querySelectorAll(".option");
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === item.answer) btn.classList.add("correct");           // jawaban benar = hijau
    else if (i === chosen) btn.classList.add("wrong");             // pilihan salah = merah
  });

  if (chosen === item.answer) {
    state.score++;
    el.feedback.textContent = "Benar!";
    el.feedback.classList.add("good");
  } else {
    el.feedback.textContent = chosen === -1
      ? `Waktu habis. Jawaban benar: ${item.options[item.answer]}`
      : `Salah. Jawaban benar: ${item.options[item.answer]}`;
    el.feedback.classList.add("bad");
  }

  el.liveScore.textContent = `Skor: ${state.score}`;
  el.bar.style.width = `${((state.index + 1) / state.list.length) * 100}%`;
  el.next.textContent = state.index + 1 < state.list.length ? "Soal berikutnya" : "Lihat hasil";
  el.next.hidden = false;
  el.next.focus();
}

function nextStep() {
  state.index++;
  if (state.index < state.list.length) renderQuestion();
  else showResult();
}

function showResult() {
  const total = state.list.length;
  const isNew = saveScore(state.category, state.score);
  const best = loadScores()[state.category];
  const ratio = state.score / total;

  el.finalScore.textContent = `${state.score} / ${total}`;
  el.message.textContent =
    ratio === 1 ? "Sempurna! Semua jawaban benar."
    : ratio >= 0.6 ? "Bagus! Sedikit lagi untuk skor sempurna."
    : "Belum maksimal. Coba lagi untuk meningkatkan skor.";
  el.high.textContent = isNew
    ? `Rekor baru untuk kategori ${state.category}!`
    : `Skor tertinggi kategori ${state.category}: ${best} / ${total}`;
  show("result");
}

/* ========== Event delegation ========== */
el.options.addEventListener("click", (e) => {
  const btn = e.target.closest(".option");
  if (btn) handleAnswer(Number(btn.dataset.index));
});
el.categories.addEventListener("click", (e) => {
  const btn = e.target.closest(".category");
  if (btn) startQuiz(btn.dataset.category);
});
el.next.addEventListener("click", nextStep);
el.restart.addEventListener("click", () => startQuiz(state.category));
el.menu.addEventListener("click", () => { renderCategories(); show("start"); });

/* ========== Dark mode ========== */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  el.theme.textContent = theme === "dark" ? "Mode terang" : "Mode gelap";
}
el.theme.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

/* ========== Init ========== */
applyTheme(localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
renderCategories();
show("start");
