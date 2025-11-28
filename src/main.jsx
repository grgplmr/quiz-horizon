import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const CATEGORIES = [
  { slug: 'aerodynamique', label: 'Aérodynamique et mécanique du vol', icon: '✈️' },
  { slug: 'aeronefs', label: 'Connaissance des aéronefs', icon: '🛩️' },
  { slug: 'meteo', label: 'Météorologie et aérologie', icon: '🌤️' },
  { slug: 'navigation', label: 'Navigation, sécurité et réglementation', icon: '🧭' },
  { slug: 'histoire', label: "Histoire de l’aéronautique et de l’espace", icon: '📜' },
  { slug: 'anglais', label: 'Anglais aéronautique', icon: '🗣️' },
];

const API_INDEX = '/api/quizzes/index.json';

const parseHash = (hash) => {
  const clean = hash.replace(/^#\/?/, '');
  const [head, ...rest] = clean.split('/');
  if (!head) return { name: 'home' };
  if (head === 'category') return { name: 'category', slug: rest[0] };
  if (head === 'quiz') return { name: 'quiz', slug: rest[0] };
  if (head === 'result') return { name: 'result', slug: rest[0] };
  return { name: 'home' };
};

function useHashRoute() {
  const [route, setRoute] = useState(parseHash(window.location.hash));
  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hbia-theme') || 'light');
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('hbia-theme', theme);
  }, [theme]);
  return [theme, setTheme];
}

const Header = ({ onHome }) => (
  <header className="header">
    <div className="header-content">
      <div className="logo" onClick={onHome} style={{ cursor: 'pointer' }}>
        <span className="dot" />
        <div>
          <div className="logo-title">HorizonBIA Quiz</div>
          <div className="muted">Prépa BIA interactive</div>
        </div>
      </div>
      <div className="header-links">
        <a className="header-link" href="https://www.horizonbia.com">
          ← Retour sur horizonbia.com
        </a>
        <a className="header-link" href="/admin/login.php">
          Espace admin
        </a>
      </div>
    </div>
  </header>
);

const Home = () => (
  <div className="home">
    <div className="hero">
      <div className="hero-heading">
        <span className="hero-badge">Nouveau • Mis à jour décembre 2025</span>
        <div className="hero-text">
          <h1 className="hero-title">Prépare ton BIA avec des quiz interactifs</h1>
          <p className="hero-subtitle">
            6 modules officiels, questions mises à jour régulièrement, entraînement illimité et gratuit.
          </p>
        </div>
      </div>
    </div>
    <div className="pill">Catégories officielles du BIA</div>
    <h1 className="section-title">Entraîne-toi par thématique</h1>
    <p className="muted" style={{ maxWidth: 720, margin: '8px auto 0' }}>
      Accède aux six modules du BIA dans une grille claire et responsive. Sélectionne une thématique pour
      travailler les notions clés en mode quiz.
    </p>
    <div className="card-grid">
      {CATEGORIES.map((cat) => (
        <div key={cat.slug} className="card" onClick={() => (window.location.hash = `#/category/${cat.slug}`)}>
          <div className="card-title">
            <span className="icon-pill">{cat.icon}</span>
            <div className="card-label">{cat.label}</div>
          </div>
          <div className="muted">Quiz ciblés pour maîtriser les notions essentielles.</div>
        </div>
      ))}
    </div>
  </div>
);

function useQuizIndex() {
  const [data, setData] = useState({ loading: true, items: [], error: null });
  useEffect(() => {
    let mounted = true;
    fetch(API_INDEX)
      .then((r) => r.json())
      .then((json) => mounted && setData({ loading: false, items: json.quizzes || [], error: null }))
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
  const quizzes = useMemo(() => index.items.filter((q) => q.category === slug), [index.items, slug]);

  if (!category) return <p>Catégorie introuvable</p>;
  return (
    <div>
      <div className="breadcrumbs">
        <button className="btn btn-ghost" onClick={() => (window.location.hash = '#/')}>← Accueil</button>
        <span className="muted">/</span>
        <strong>{category.label}</strong>
      </div>
      <h2 className="section-title">
        {category.icon} {category.label}
      </h2>
      {index.loading ? (
        <p className="muted">Chargement...</p>
      ) : quizzes.length === 0 ? (
        <p>Aucun quiz pour le moment</p>
      ) : (
        <div className="card-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.slug} className="card quiz-card" onClick={() => (window.location.hash = `#/quiz/${quiz.slug}`)}>
              <div className="pill">{quiz.questions} questions</div>
              <h3>{quiz.title}</h3>
              <div className="muted">{quiz.description || 'Entraînement thématique'}</div>
              {quiz.estimated && <div className="muted">~{quiz.estimated} min</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const loadProgress = (slug) => {
  try {
    const raw = localStorage.getItem(`hbia-progress-${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveProgress = (slug, state) => {
  try {
    localStorage.setItem(`hbia-progress-${slug}`, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
};

const clearProgress = (slug) => {
  try {
    localStorage.removeItem(`hbia-progress-${slug}`);
  } catch (e) {
    // ignore
  }
};

function Quiz({ slug }) {
  const [status, setStatus] = useState('loading');
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
        setStatus('ready');
      })
      .catch(() => mounted && setStatus('error'));
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (status !== 'ready' || !quiz) return;
    saveProgress(slug, { queue, answers, stats, finished });
  }, [queue, answers, stats, finished, status, quiz, slug]);

  if (status === 'loading') return <p className="muted">Chargement du quiz...</p>;
  if (status === 'error' || !quiz) return <p>Quiz introuvable</p>;

  if (finished) {
    return <ResultView quiz={quiz} stats={stats} onRestart={() => {
      clearProgress(slug);
      setQueue(quiz.questions.map((_, i) => i));
      setAnswers({});
      setStats({ attempts: 0, correct: 0, total: quiz.questions.length });
      setFinished(false);
      setSelected(null);
      setFeedback(null);
    }} />;
  }

  const currentIndex = queue[0];
  const question = quiz.questions[currentIndex];
  const progress = ((quiz.questions.length - queue.length) / quiz.questions.length) * 100;

  const submit = () => {
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
  };

  const nextQuestion = () => {
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
  };

  return (
    <div className="quiz">
      <div className="breadcrumbs">
        <button className="btn btn-ghost" onClick={() => (window.location.hash = `#/category/${quiz.category}`)}>← Catégorie</button>
        <span className="muted">/</span>
        <strong>{quiz.title}</strong>
      </div>
      <div className="question-shell">
        <div className="pill">Question {quiz.questions.length - queue.length + 1}/{quiz.questions.length}</div>
        <h2>{question.text}</h2>
        <div className="choices">
          {question.choices.map((choice, idx) => (
            <label
              key={idx}
              className={`choice ${feedback ? (idx === question.answer ? 'correct' : idx === Number(selected) ? 'wrong' : '') : selected === idx ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="choice"
                checked={selected === idx}
                onChange={() => !feedback && setSelected(idx)}
                disabled={!!feedback}
              />
              <span>{choice}</span>
            </label>
          ))}
        </div>
        {feedback && (
          <div className="feedback">
            <div className={`badge ${feedback.correct ? 'success' : 'error'}`}>
              {feedback.correct ? '✅ Bonne réponse' : '❌ Mauvaise réponse'}
            </div>
            {!feedback.correct && (
              <p>
                <strong>Explication :</strong> {question.explanation || 'Relis le cours pour consolider.'}
              </p>
            )}
          </div>
        )}
        <div className="quiz-footer">
          <button className="btn btn-primary" onClick={feedback ? nextQuestion : submit}>
            {feedback ? 'Question suivante' : 'Valider'}
          </button>
          <div style={{ flex: 1 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultView({ quiz, stats, onRestart }) {
  const score = quiz.questions.length ? Math.round((stats.correct / quiz.questions.length) * 100) : 0;
  return (
    <div>
      <div className="pill">Score final</div>
      <h2 className="section-title">{quiz.title}</h2>
      <div className="score-panel">
        <div className="stat">
          <div className="muted">Score</div>
          <h3>{score}%</h3>
        </div>
        <div className="stat">
          <div className="muted">Bonnes réponses</div>
          <h3>
            {stats.correct}/{quiz.questions.length}
          </h3>
        </div>
        <div className="stat">
          <div className="muted">Tentatives</div>
          <h3>{stats.attempts}</h3>
        </div>
      </div>
      <div className="top-actions">
        <button className="btn btn-ghost" onClick={() => (window.location.hash = `#/category/${quiz.category}`)}>↩︎ Retour</button>
        <button className="btn btn-primary" onClick={onRestart}>
          Rejouer
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const route = useHashRoute();
  useTheme();

  return (
    <div className="app-shell">
      <Header onHome={() => (window.location.hash = '#/')} />
      {route.name === 'home' ? (
        <Home />
      ) : route.name === 'category' ? (
        <Category slug={route.slug} />
      ) : route.name === 'quiz' ? (
        <Quiz slug={route.slug} />
      ) : (
        <p>Bienvenue sur HorizonBIA</p>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<AppShell />);
