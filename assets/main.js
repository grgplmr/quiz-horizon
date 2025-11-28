import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";

const h = React.createElement;

const CATEGORIES = [
  {
    slug: "aerodynamique",
    label: "Aérodynamique et mécanique du vol",
    icon: "✈️",
  },
  { slug: "aeronefs", label: "Connaissance des aéronefs", icon: "🛩️" },
  { slug: "meteo", label: "Météorologie et aérologie", icon: "🌤️" },
  {
    slug: "navigation",
    label: "Navigation, sécurité et réglementation",
    icon: "🧭",
  },
  { slug: "histoire", label: "Histoire de l’aéronautique et de l’espace", icon: "📜" },
  { slug: "anglais", label: "Anglais aéronautique", icon: "🗣️" },
];

const API_INDEX = "/api/quizzes/index.json";

function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, "");
  const [head, ...rest] = clean.split("/");
  if (!head) return { name: "home" };
  if (head === "category") return { name: "category", slug: rest[0] };
  if (head === "quiz") return { name: "quiz", slug: rest[0] };
  if (head === "result") return { name: "result", slug: rest[0] };
  return { name: "home" };
}

function useHashRoute() {
  const [route, setRoute] = useState(parseHash(window.location.hash));
  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("hbia-theme") || "light"
  );
  useEffect(() => {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("hbia-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

function Header({ onHome, theme, onToggleTheme }) {
  return h(
    "div",
    { className: "header" },
    h(
      "div",
      { className: "logo", onClick: onHome, style: { cursor: "pointer" } },
      h("span", { className: "dot" }),
      h("div", null, h("div", null, "HorizonBIA Quiz"), h("div", { className: "muted" }, "Prépa BIA interactive"))
    ),
    h(
      "div",
      { className: "top-actions" },
      h(
        "button",
        { className: "btn btn-ghost", onClick: () => onToggleTheme(theme === "light" ? "dark" : "light") },
        theme === "light" ? "🌙 Mode sombre" : "☀️ Mode clair"
      ),
      h(
        "button",
        { className: "btn btn-primary", onClick: () => (window.location = "/admin/") },
        "Espace admin"
      )
    )
  );
}

function Home() {
  return h(
    "div",
    { className: "home" },
    h("div", { className: "pill" }, "Catégories officielles du BIA"),
    h("h1", { className: "section-title" }, "Entraîne-toi par thématique"),
    h(
      "p",
      { className: "muted", style: { maxWidth: 720, margin: "8px auto 0" } },
      "Accède aux six modules du BIA dans une grille claire et responsive. Sélectionne une thématique pour travailler les notions clés en mode quiz."
    ),
    h(
      "div",
      { className: "card-grid" },
      CATEGORIES.map((cat) =>
        h(
          "div",
          {
            key: cat.slug,
            className: "card",
            onClick: () => (window.location.hash = `#/category/${cat.slug}`),
          },
          h(
            "div",
            { className: "card-title" },
            h("span", { className: "icon-pill" }, cat.icon),
            h("div", { className: "card-label" }, cat.label)
          ),
          h("div", { className: "muted" }, "Quiz ciblés pour maîtriser les notions essentielles.")
        )
      )
    )
  );
}

function useQuizIndex() {
  const [data, setData] = useState({ loading: true, items: [], error: null });
  useEffect(() => {
    let mounted = true;
    fetch(API_INDEX)
      .then((r) => r.json())
      .then((json) => mounted && setData({ loading: false, items: json.quizzes || [] }))
      .catch((err) => mounted && setData({ loading: false, items: [], error: err.message }));
    return () => {
      mounted = false;
    };
  }, []);
  return data;
}

function Category({ slug }) {
  const index = useQuizIndex();
  const category = CATEGORIES.find((c) => c.slug === slug);
  const quizzes = useMemo(
    () => index.items.filter((q) => q.category === slug),
    [index.items, slug]
  );

  if (!category) return h("div", null, "Catégorie introuvable");
  return h(
    "div",
    null,
    h(
      "div",
      { className: "breadcrumbs" },
      h(
        "button",
        { className: "btn btn-ghost", onClick: () => (window.location.hash = "#/") },
        "← Accueil"
      ),
      h("span", { className: "muted" }, "/"),
      h("strong", null, category.label)
    ),
    h("h2", { className: "section-title" }, category.icon + " " + category.label),
    index.loading
      ? h("p", { className: "muted" }, "Chargement...")
      : quizzes.length === 0
      ? h("p", null, "Aucun quiz pour le moment")
      : h(
          "div",
          { className: "card-grid" },
          quizzes.map((quiz) =>
            h(
              "div",
              {
                key: quiz.slug,
                className: "card quiz-card",
                onClick: () => (window.location.hash = `#/quiz/${quiz.slug}`),
              },
              h("div", { className: "pill" }, `${quiz.questions} questions`),
              h("h3", null, quiz.title),
              h("div", { className: "muted" }, quiz.description || "Entraînement thématique"),
              quiz.estimated && h("div", { className: "muted" }, `~${quiz.estimated} min`)
            )
          )
        )
  );
}

function loadProgress(slug) {
  try {
    const raw = localStorage.getItem(`hbia-progress-${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveProgress(slug, state) {
  try {
    localStorage.setItem(`hbia-progress-${slug}`, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

function clearProgress(slug) {
  try {
    localStorage.removeItem(`hbia-progress-${slug}`);
  } catch (e) {
    // ignore
  }
}

function Quiz({ slug }) {
  const [status, setStatus] = useState("loading");
  const [quiz, setQuiz] = useState(null);
  const [queue, setQueue] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({ attempts: 0, correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/quizzes/${slug}.json`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const saved = loadProgress(slug);
        const initialQueue = saved?.queue?.length ? saved.queue : json.questions.map((_, i) => i);
        setQuiz(json);
        setQueue(initialQueue);
        setAnswers(saved?.answers || {});
        setStats(saved?.stats || { attempts: 0, correct: 0, total: json.questions.length });
        setFinished(saved?.finished || false);
        setStatus("ready");
      })
      .catch(() => mounted && setStatus("error"));
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (status !== "ready" || !quiz) return;
    saveProgress(slug, { queue, answers, stats, finished });
  }, [queue, answers, stats, finished, status, quiz, slug]);

  if (status === "loading") return h("p", { className: "muted" }, "Chargement du quiz...");
  if (status === "error" || !quiz) return h("p", null, "Quiz introuvable");

  if (finished) {
    return h(ResultView, {
      quiz,
      stats,
      onRestart: () => {
        clearProgress(slug);
        setQueue(quiz.questions.map((_, i) => i));
        setAnswers({});
        setStats({ attempts: 0, correct: 0, total: quiz.questions.length });
        setFinished(false);
        setSelected(null);
        setFeedback(null);
      },
    });
  }

  const currentIndex = queue[0];
  const question = quiz.questions[currentIndex];
  const progress = ((quiz.questions.length - queue.length) / quiz.questions.length) * 100;

  function submit() {
    if (selected === null || feedback) return;
    const correct = Number(selected) === Number(question.answer);
    const newAnswers = { ...answers, [currentIndex]: { choice: Number(selected), correct } };
    setAnswers(newAnswers);
    setStats((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      total: quiz.questions.length,
    }));
    setFeedback({ correct });
  }

  function nextQuestion() {
    if (!feedback) return;
    const correct = feedback.correct;
    const remaining = queue.slice(1);
    if (!correct) remaining.push(currentIndex);
    if (remaining.length === 0) {
      setFinished(true);
      clearProgress(slug);
      return;
    }
    setQueue(remaining);
    setSelected(null);
    setFeedback(null);
  }

  return h(
    "div",
    { className: "quiz" },
    h(
      "div",
      { className: "breadcrumbs" },
      h("button", { className: "btn btn-ghost", onClick: () => (window.location.hash = `#/category/${quiz.category}`) }, "← Catégorie"),
      h("span", { className: "muted" }, "/"),
      h("strong", null, quiz.title)
    ),
    h(
      "div",
      { className: "question-shell" },
      h("div", { className: "pill" }, `Question ${quiz.questions.length - queue.length + 1}/${quiz.questions.length}`),
      h("h2", null, question.text),
      h(
        "div",
        { className: "choices" },
        question.choices.map((choice, idx) =>
          h(
            "label",
            {
              key: idx,
              className:
                "choice " +
                (feedback
                  ? idx === question.answer
                    ? "correct"
                    : idx === Number(selected)
                    ? "wrong"
                    : ""
                  : selected === idx
                  ? "selected"
                  : ""),
            },
            h("input", {
              type: "radio",
              name: "choice",
              checked: selected === idx,
              onChange: () => !feedback && setSelected(idx),
              disabled: !!feedback,
            }),
            h("span", null, choice)
          )
        )
      ),
      feedback &&
        h(
          "div",
          { className: "feedback" },
          h(
            "div",
            {
              className: "badge " + (feedback.correct ? "success" : "error"),
            },
            feedback.correct ? "✅ Bonne réponse" : "❌ Mauvaise réponse"
          ),
          !feedback.correct &&
            h(
              "p",
              null,
              h("strong", null, "Explication :"),
              " ",
              question.explanation || "Relis le cours pour consolider."
            )
        ),
      h(
        "div",
        { className: "quiz-footer" },
        h(
          "button",
          { className: "btn btn-primary", onClick: feedback ? nextQuestion : submit },
          feedback ? "Question suivante" : "Valider"
        ),
        h(
          "div",
          { style: { flex: 1 } },
          h("div", { className: "progress-bar" }, h("div", { className: "progress-fill", style: { width: `${progress}%` } }))
        )
      )
    )
  );
}

function ResultView({ quiz, stats, onRestart }) {
  const score = quiz.questions.length ? Math.round((stats.correct / quiz.questions.length) * 100) : 0;
  return h(
    "div",
    null,
    h("div", { className: "pill" }, "Score final"),
    h("h2", { className: "section-title" }, quiz.title),
    h(
      "div",
      { className: "score-panel" },
      h(
        "div",
        { className: "stat" },
        h("div", { className: "muted" }, "Score"),
        h("h3", null, `${score}%`)
      ),
      h(
        "div",
        { className: "stat" },
        h("div", { className: "muted" }, "Bonnes réponses"),
        h("h3", null, `${stats.correct}/${quiz.questions.length}`)
      ),
      h(
        "div",
        { className: "stat" },
        h("div", { className: "muted" }, "Tentatives"),
        h("h3", null, stats.attempts)
      )
    ),
    h(
      "div",
      { className: "top-actions" },
      h("button", { className: "btn btn-ghost", onClick: () => (window.location.hash = `#/category/${quiz.category}`) }, "↩︎ Retour"),
      h("button", { className: "btn btn-primary", onClick: onRestart }, "Rejouer")
    )
  );
}

function AppShell() {
  const route = useHashRoute();
  const [theme, setTheme] = useTheme();

  return h(
    "div",
    { className: "app-shell" },
    h("div", { className: "back-link" }, h("a", { href: "https://horizonbia.com" }, "← Retour à HorizonBIA.com")),
    h(Header, { onHome: () => (window.location.hash = "#/"), theme, onToggleTheme: setTheme }),
    route.name === "home"
      ? h(Home)
      : route.name === "category"
      ? h(Category, { slug: route.slug })
      : route.name === "quiz"
      ? h(Quiz, { slug: route.slug })
      : h("p", null, "Bienvenue sur HorizonBIA")
  );
}

const root = createRoot(document.getElementById("root"));
root.render(h(AppShell));
