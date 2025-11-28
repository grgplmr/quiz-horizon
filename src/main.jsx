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
          ← Retour à HorizonBIA.com
        </a>
        <a className="header-link" href="/admin/login.php">
          Espace admin
        </a>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-links">
        <a href="https://www.horizonbia.com/mentions-legales/">Mentions légales</a>
        <span aria-hidden>•</span>
        <a href="https://www.horizonbia.com/politique-de-confidentialite/">Politique de confidentialité</a>
        <span aria-hidden>•</span>
        <a href="https://www.horizonbia.com/contact/">Contact</a>
      </div>
      <div className="footer-note">
        Outil pédagogique gratuit développé par HorizonBIA en partenariat avec l'Aéroclub Marcillac Estuaire pour préparer le
        BIA.
      </div>
    </div>
  </footer>
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
    <div className="home-section">
      <div className="pill">Catégories officielles du BIA</div>
      <h1 className="section-title">Entraîne-toi par thématique</h1>
      <p className="section-description">
        Accède aux six modules du BIA dans une grille claire et responsive. Sélectionne une thématique pour travailler
        les notions clés en mode quiz.
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
    <section className="how-it-works">
      <h2 className="section-title">Comment ça marche ?</h2>
      <div className="how-steps" role="list">
        <div className="how-step" role="listitem">
          <div className="step-badge">1</div>
          <div className="step-text">Choisis un module</div>
        </div>
        <div className="step-separator" aria-hidden>
          →
        </div>
        <div className="how-step" role="listitem">
          <div className="step-badge">2</div>
          <div className="step-text">Réponds aux questions</div>
        </div>
        <div className="step-separator" aria-hidden>
          →
        </div>
        <div className="how-step" role="listitem">
          <div className="step-badge">3</div>
          <div className="step-text">Visualise ton score et les notions à revoir</div>
        </div>
      </div>
      <p className="how-note">Mode entraînement : corrections immédiates et répétition des erreurs.</p>
    </section>
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
    return <ResultView quiz={quiz} stats={stats} answers={answers} onRestart={() => {
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
  const totalQuestions = quiz.questions.length;
  const currentNumber = totalQuestions - queue.length + 1;
  const progress = (currentNumber / totalQuestions) * 100;
  const categoryLabel = CATEGORIES.find((c) => c.slug === quiz.category)?.label;

  const submit = () => {
    if (selected === null || feedback) return;
    const correct = Number(selected) === Number(question.answer);
    const previousAnswer = answers[currentIndex];
    const newAnswers = {
      ...answers,
      [currentIndex]: {
        choice: Number(selected),
        correct,
        everWrong: previousAnswer?.everWrong || !correct,
        attempts: (previousAnswer?.attempts || 0) + 1,
      },
    };
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
      <div className="quiz-top">
        <div className="quiz-top-titles">
          <div className="quiz-module">{categoryLabel || 'Module'}</div>
          <h2 className="quiz-name">{quiz.title}</h2>
        </div>
        <div className="quiz-progress">
          <div className="quiz-counter">Question {currentNumber} / {totalQuestions}</div>
          <div className="progress-bar compact">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="question-shell">
        <div className="question-title">
          <h2>{question.text}</h2>
        </div>
        <div className="choices">
          {question.choices.map((choice, idx) => (
            <label
              key={idx}
              className={`choice ${feedback ? (idx === question.answer ? 'correct' : idx === Number(selected) ? 'wrong' : '') : selected === idx ? 'selected' : ''}`}
            >
              <div className="choice-inner">
                <input
                  type="radio"
                  name="choice"
                  checked={selected === idx}
                  onChange={() => !feedback && setSelected(idx)}
                  disabled={!!feedback}
                />
                <span className="choice-text">{choice}</span>
              </div>
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
        </div>
      </div>
    </div>
  );
}

function ResultView({ quiz, stats, answers, onRestart }) {
  const totalQuestions = quiz.questions.length;
  const correctCount = quiz.questions.reduce((acc, _, idx) => (answers[idx]?.correct ? acc + 1 : acc), 0);
  const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const missedQuestions = quiz.questions
    .map((question, idx) => ({ question, record: answers[idx] }))
    .filter(({ record }) => record?.everWrong || record?.correct === false);

  const feedbackMessage = (() => {
    if (score >= 85) return 'Excellent, vous êtes prêt pour l\'épreuve !';
    if (score >= 60) return 'Bon résultat, quelques notions restent à consolider.';
    return 'Continuez à vous entraîner, vous allez progresser.';
  })();

  return (
    <div className="result">
      <div className="result-hero">
        <div className="result-pill">Score final</div>
        <h2 className="section-title">{quiz.title}</h2>
        <div className="result-main-score">
          <div className="result-score-numbers">
            <div className="result-score-total">
              {correctCount} / {totalQuestions}
            </div>
            <div className="result-score-percent">{score} %</div>
          </div>
          <p className="result-feedback">{feedbackMessage}</p>
        </div>
      </div>

      <div className="result-visuals">
        <div className="result-card">
          <div className="stat-line">
            <span className="muted">Tentatives totales</span>
            <strong>{stats.attempts}</strong>
          </div>
          <div className="stat-line">
            <span className="muted">Bonnes réponses</span>
            <strong>
              {correctCount} / {totalQuestions}
            </strong>
          </div>
          <div className="stat-line">
            <span className="muted">Exactitude</span>
            <strong>{score}%</strong>
          </div>
        </div>

        <div className="result-card result-graph">
          <div className="muted">Graphique de progression</div>
          <div className="graph-placeholder" aria-hidden>
            <div className="graph-bar good" style={{ width: `${score}%` }} />
            <div className="graph-bar bad" style={{ width: `${100 - score}%` }} />
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Prévu : petite visualisation bonnes/mauvaises réponses</div>
        </div>
      </div>

      {missedQuestions.length > 0 ? (
        <div className="result-card">
          <h3>Questions à revoir</h3>
          <ul className="missed-list">
            {missedQuestions.map(({ question }, idx) => (
              <li key={idx} className="missed-item">
                <div className="missed-question">{question.text}</div>
                <div className="missed-answer">
                  Bonne réponse : <strong>{question.choices[question.answer]}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="result-card">
          <h3>Bravo !</h3>
          <p className="muted">Aucune erreur sur ce quiz.</p>
        </div>
      )}

      <div className="top-actions">
        <button className="btn btn-ghost" onClick={() => (window.location.hash = '#/')}>Choisir un autre module</button>
        <button className="btn btn-primary" onClick={onRestart}>
          Recommencer ce module
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const route = useHashRoute();
  useTheme();

  return (
    <div className="page">
      <Header onHome={() => (window.location.hash = '#/')} />
      <main className="app-shell">
        {route.name === 'home' ? (
          <Home />
        ) : route.name === 'category' ? (
          <Category slug={route.slug} />
        ) : route.name === 'quiz' ? (
          <Quiz slug={route.slug} />
        ) : (
          <p>Bienvenue sur HorizonBIA</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<AppShell />);
