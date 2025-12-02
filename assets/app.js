const MODULES = [
  {
    slug: 'histoire',
    label: 'Histoire de l’aéronautique et de l’espace',
    description: 'Questionnaires thématiques.',
  },
  {
    slug: 'meteo',
    label: 'Météorologie et aérologie',
    description: 'Entraînement avancé.',
  },
  {
    slug: 'aero',
    label: 'Aérodynamique et mécanique du vol',
    description: 'Découvrir les bases.',
  },
  {
    slug: 'navigation',
    label: 'Navigation, sécurité et réglementation',
    description: 'Révisions ciblées.',
  },
  {
    slug: 'aeronefs',
    label: 'Connaissance des aéronefs',
    description: 'Approfondir les connaissances.',
  },
  {
    slug: 'anglais',
    label: 'Anglais aéronautique',
    description: 'Simulation complète.',
  },
];

const MODULE_ICONS = {
  histoire: '📚',
  meteo: '☁️',
  aero: '✈️',
  navigation: '🧭',
  nav: '🧭',
  aeronefs: '🛩️',
  anglais: '🇬🇧',
};

const STORAGE_KEYS = {
  email: 'hbia_quiz_email',
  results: 'hbia_quiz_results',
};

function loadEmailFromStorage() {
  try {
    return localStorage.getItem(STORAGE_KEYS.email) || '';
  } catch (error) {
    return '';
  }
}

function saveEmailToStorage(email) {
  try {
    if (email) {
      localStorage.setItem(STORAGE_KEYS.email, email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.email);
    }
  } catch (error) {
    // ignore storage errors
  }
}

function loadAllResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.results);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function loadResultsForEmail(email) {
  if (!email) return [];
  const allResults = loadAllResults();
  return allResults[email] || [];
}

function saveResultForEmail(email, result) {
  if (!email || !result) return [];
  const allResults = loadAllResults();
  const existing = allResults[email] || [];
  existing.push(result);
  allResults[email] = existing;
  try {
    localStorage.setItem(STORAGE_KEYS.results, JSON.stringify(allResults));
  } catch (error) {
    // ignore storage errors
  }
  return existing;
}

function formatResultDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getModuleIcon(slug) {
  return MODULE_ICONS[slug] || '✨';
}

const state = {
  view: 'home',
  currentQuiz: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  selectedIndex: null,
  questionValidated: false,
  queue: [],
  masteredIndices: new Set(),
  totalAttempts: 0,
  mode: 'training',
  answers: [],
  allQuizzes: [],
  selectedModule: null,
  moduleQuizzes: [],
  userEmail: '',
  savedResults: [],
};

function showView(name) {
  const homeSection = document.getElementById('view-home');
  const moduleSection = document.getElementById('view-module');
  const quizSection = document.getElementById('view-quiz');
  const resultSection = document.getElementById('view-result');

  state.view = name;

  homeSection.classList.toggle('hidden', name !== 'home');
  moduleSection?.classList.toggle('hidden', name !== 'module');
  quizSection.classList.toggle('hidden', name !== 'quiz');
  resultSection.classList.toggle('hidden', name !== 'result');
}

function ensureModuleView() {
  let moduleSection = document.getElementById('view-module');
  if (!moduleSection) {
    moduleSection = document.createElement('section');
    moduleSection.id = 'view-module';
    moduleSection.classList.add('hidden');

    const main = document.querySelector('main.content');
    const quizSection = document.getElementById('view-quiz');
    main.insertBefore(moduleSection, quizSection);
  }

  return moduleSection;
}

function resetModuleSelection() {
  state.selectedModule = null;
  state.moduleQuizzes = [];
}

async function ensureQuizzesLoaded() {
  if (state.allQuizzes.length) return state.allQuizzes;

  try {
    const response = await fetch('api/quizzes/index.json');
    const quizzes = await response.json();
    state.allQuizzes = quizzes;
    return quizzes;
  } catch (error) {
    alert('Erreur lors du chargement de la liste des quiz.');
    return [];
  }
}

async function loadQuizFromMeta(quizMeta) {
  if (!quizMeta) return;

  const questionsFile = quizMeta.questionsFile || quizMeta.file;

  if (!questionsFile) {
    alert('Le fichier du quiz est introuvable.');
    return;
  }

  try {
    const questionsResponse = await fetch(`api/quizzes/${questionsFile}`);
    const quizData = await questionsResponse.json();

    state.currentQuiz = quizMeta;
    state.questions = quizData.questions || [];
    resetQuizProgress();

    renderCurrentQuestion();
  } catch (error) {
    alert('Erreur lors du chargement du quiz.');
  }
}

async function startQuizFromMeta(quizMeta) {
  if (!quizMeta) return;

  const isTraining = window.confirm(
    "Choisis ton mode :\n\nOK = Mode entraînement (répétition des erreurs jusqu'à 20/20)\nAnnuler = Mode examen blanc (correction à la fin seulement)"
  );

  if (isTraining === null) return;

  if (!isTraining) {
    const confirmExam = window.confirm('Lancer en mode examen blanc ?');
    if (!confirmExam) return;
  }

  state.mode = isTraining ? 'training' : 'exam';
  await loadQuizFromMeta(quizMeta);
}

function goHome() {
  renderHome();
  resetModuleSelection();
  showView('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderModuleView() {
  const moduleSection = ensureModuleView();

  if (!state.selectedModule) {
    goHome();
    return;
  }

  const quizzes = state.moduleQuizzes;
  const cards = quizzes
    .map(
      (quiz, index) => `
        <div class="quiz-card">
          <div class="quiz-card-header">
            <h3>#${index + 1} – ${quiz.title}</h3>
            <p class="quiz-card-desc">${quiz.description || ''}</p>
          </div>
          <button class="primary" data-quiz-id="${quiz.id}">Commencer</button>
        </div>
      `
    )
    .join('');

  moduleSection.innerHTML = `
    <div class="breadcrumb-back">
      <button id="back-to-modules" class="secondary">← Retour aux modules</button>
    </div>
    <div class="module-header">
      <h2>${state.selectedModule.label}</h2>
      <p class="module-subtitle">Choisissez un quiz pour ce module.</p>
    </div>
    ${
      quizzes.length
        ? `<div class="quiz-list-grid">${cards}</div>`
        : '<p class="empty-state">Aucun quiz disponible pour ce module pour le moment.</p>'
    }
  `;

  const backButton = document.getElementById('back-to-modules');
  backButton.addEventListener('click', () => {
    goHome();
  });

  const startButtons = moduleSection.querySelectorAll('[data-quiz-id]');
  startButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const quizId = button.dataset.quizId;
      const quizMeta = quizzes.find((quiz) => quiz.id === quizId);
      startQuizFromMeta(quizMeta);
    });
  });

  showView('module');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentQuestion() {
  const viewQuiz = document.getElementById('view-quiz');
  const question = state.questions[state.currentIndex];

  if (!question) {
    alert('Aucune question à afficher.');
    return;
  }

  state.selectedIndex = null;
  state.questionValidated = false;

  const total = state.questions.length;
  const masteryInfo =
    state.mode === 'training'
      ? `<p class="quiz-counter"><strong>Questions maîtrisées :</strong> <span id="mastered-count">${state.masteredIndices.size}</span> / ${state.questions.length}</p>`
      : `<p class="quiz-counter"><strong>Réponses enregistrées :</strong> ${state.totalAttempts} / ${state.questions.length}</p>`;
  const choicesHtml = question.choices
    .map(
      (choice, index) =>
        `<button class="choice-button" data-index="${index}">${choice}</button>`
    )
    .join('');

  viewQuiz.innerHTML = `
    <div class="quiz-panel">
      <div class="quiz-header">
        <h2 class="quiz-title">${state.currentQuiz?.title || 'Quiz'}</h2>
        <p class="quiz-progress">Question ${state.currentIndex + 1} / ${total}</p>
      </div>
      <div class="quiz-progress-band">
        <p class="quiz-counter"><strong>Tentatives :</strong> <span id="attempt-count">${state.totalAttempts}</span></p>
        ${masteryInfo}
      </div>
      <p class="quiz-question">${question.text}</p>
      <div class="quiz-choices">${choicesHtml}</div>
      <div id="quiz-feedback" class="quiz-feedback"></div>
      <div class="quiz-actions">
        <button id="quiz-validate" class="primary">Valider</button>
        <button id="quiz-next" class="secondary" disabled>Question suivante</button>
      </div>
    </div>
  `;

  const feedback = document.getElementById('quiz-feedback');
  const validateButton = document.getElementById('quiz-validate');
  const nextButton = document.getElementById('quiz-next');
  const choiceButtons = viewQuiz.querySelectorAll('.choice-button');

  choiceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedIndex = Number(button.dataset.index);
      choiceButtons.forEach((btn) => btn.classList.remove('selected'));
      button.classList.add('selected');
      feedback.textContent = '';
    });
  });

  validateButton.addEventListener('click', () => handleValidate(feedback, nextButton, validateButton));
  nextButton.addEventListener('click', handleNextQuestion);

  showView('quiz');
}

function handleValidate(feedbackEl, nextButton, validateButton) {
  if (state.questionValidated) return;
  if (state.selectedIndex === null) return;

  state.questionValidated = true;
  state.totalAttempts += 1;
  const currentQuestion = state.questions[state.currentIndex];
  const isCorrect = state.selectedIndex === currentQuestion.correctIndex;

  if (state.mode === 'training') {
    if (isCorrect) {
      if (!state.masteredIndices.has(state.currentIndex)) {
        state.masteredIndices.add(state.currentIndex);
        state.score = state.masteredIndices.size;
      }
      feedbackEl.innerHTML = `Bonne réponse !${
        currentQuestion.explanation ? `<br>${currentQuestion.explanation}` : ''
      }`;
      feedbackEl.classList.remove('error');
      feedbackEl.classList.add('success');
    } else {
      const correctAnswer = currentQuestion.choices[currentQuestion.correctIndex];
      feedbackEl.innerHTML = `Mauvaise réponse, la bonne réponse était : ${correctAnswer}${
        currentQuestion.explanation ? `<br>${currentQuestion.explanation}` : ''
      }`;
      state.queue.push(state.currentIndex);
      feedbackEl.classList.remove('success');
      feedbackEl.classList.add('error');
    }
  } else {
    state.answers.push({
      questionIndex: state.currentIndex,
      selectedIndex: state.selectedIndex,
      correctIndex: currentQuestion.correctIndex,
      isCorrect,
    });
    feedbackEl.textContent = 'Réponse enregistrée.';
    feedbackEl.classList.remove('success', 'error');
  }

  validateButton.disabled = true;
  nextButton.disabled = false;

  const attemptCountEl = document.getElementById('attempt-count');
  const masteredCountEl = document.getElementById('mastered-count');
  if (attemptCountEl) {
    attemptCountEl.textContent = state.totalAttempts;
  }
  if (masteredCountEl) {
    masteredCountEl.textContent = state.masteredIndices.size;
  }
}

function handleNextQuestion() {
  if (!state.questionValidated) return;

  if (state.mode === 'training' && state.masteredIndices.size === state.questions.length) {
    showResults();
    return;
  }

  state.currentIndex = state.queue.shift();

  if (state.currentIndex === undefined) {
    showResults();
    return;
  }

  renderCurrentQuestion();
}

function showResults() {
  const viewResult = document.getElementById('view-result');
  const moduleSlug = state.currentQuiz?.module || state.selectedModule?.slug || '';
  const moduleInfo = MODULES.find((entry) => entry.slug === moduleSlug) || state.selectedModule;
  const moduleTitle = moduleInfo?.label || '';

  function persistResult(scoreValue, totalQuestions) {
    if (!state.userEmail) return;

    const modeValue = state.mode === 'training' ? 'entrainement' : 'examen';

    const result = {
      quizId: state.currentQuiz?.id || state.currentQuiz?.questionsFile || 'quiz',
      quizTitle: state.currentQuiz?.title || 'Quiz',
      module: moduleSlug,
      moduleTitle,
      score: scoreValue,
      total: totalQuestions,
      mode: modeValue,
      date: new Date().toISOString(),
    };

    state.savedResults = saveResultForEmail(state.userEmail, result);
  }

  if (state.mode === 'training') {
    const total = state.questions.length || 1;
    const scoreOn20 = 20;
    const percent = 100;

    persistResult(total, total);

    viewResult.innerHTML = `
      <div class="result-panel">
        <h2>${state.currentQuiz?.title || 'Quiz'}</h2>
        <p class="result-score">Bravo, tu as maîtrisé les ${total} questions !</p>
        <p class="result-percent">Score : ${scoreOn20} / 20 (${percent}% de réussite)</p>
        <p class="result-message">Nombre total de tentatives : ${state.totalAttempts}</p>
        <p class="result-message">Moyenne : 20/20 après ${state.totalAttempts} questions répondues.</p>
        <div class="result-actions">
          <button id="result-restart" class="primary">Recommencer ce quiz</button>
          <button id="result-home" class="secondary">Retour à l’accueil</button>
        </div>
      </div>
    `;
  } else {
    const totalQuestions = state.questions.length || 1;
    const correctCount = state.answers.filter((answer) => answer.isCorrect).length;
    const percent = Math.round((correctCount / totalQuestions) * 100);
    persistResult(correctCount, totalQuestions);
    const incorrectAnswers = state.answers.filter((answer) => !answer.isCorrect);
    const incorrectList = incorrectAnswers
      .map((answer) => {
        const question = state.questions[answer.questionIndex];
        const correctChoice = question?.choices?.[answer.correctIndex];
        const explanation = question?.explanation
          ? `<br><em>${question.explanation}</em>`
          : '';
        return `
          <li>
            <strong>${question?.text || 'Question'}</strong><br>
            Bonne réponse : ${correctChoice || 'N/A'}${explanation}
          </li>`;
      })
      .join('');

    viewResult.innerHTML = `
      <div class="result-panel">
        <h2>${state.currentQuiz?.title || 'Quiz'}</h2>
        <p class="result-score">Score : ${correctCount} / ${totalQuestions}</p>
        <p class="result-percent">Soit ${percent}% de bonnes réponses.</p>
        ${
          incorrectAnswers.length
            ? `<div class="result-incorrect"><p>Questions ratées :</p><ul>${incorrectList}</ul></div>`
            : '<p class="result-score">Bravo, aucune erreur !</p>'
        }
        <div class="result-actions">
          <button id="result-restart" class="primary">Recommencer ce quiz</button>
          <button id="result-home" class="secondary">Retour à l’accueil</button>
        </div>
      </div>
    `;
  }

  const restartButton = document.getElementById('result-restart');
  const homeButton = document.getElementById('result-home');

  restartButton.addEventListener('click', () => {
    if (!state.currentQuiz) return;
    startQuizFromMeta(state.currentQuiz);
  });

  homeButton.addEventListener('click', () => {
    goHome();
  });

  showView('result');
}

function resetQuizProgress() {
  state.answers = [];
  state.masteredIndices = new Set();
  state.totalAttempts = 0;
  state.score = 0;
  state.selectedIndex = null;
  state.questionValidated = false;

  state.queue = state.questions.map((_, index) => index);

  state.currentIndex = state.queue.shift() ?? 0;
}

async function prepareModuleSelection(moduleSlug) {
  const quizzes = await ensureQuizzesLoaded();
  const moduleInfo = MODULES.find((entry) => entry.slug === moduleSlug);

  if (!moduleInfo) {
    alert('Module introuvable.');
    return;
  }

  state.selectedModule = moduleInfo;
  state.moduleQuizzes = quizzes.filter((quiz) => quiz.module === moduleSlug);

  renderModuleView();
}

function renderSavedResults() {
  const resultsContainer = document.getElementById('saved-results');
  if (!resultsContainer) return;

  const hasResults = Boolean(state.userEmail && state.savedResults.length);
  resultsContainer.classList.toggle('hidden', !hasResults);

  if (!hasResults) {
    resultsContainer.innerHTML = '';
    return;
  }

  const limitedResults = [...state.savedResults]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const listItems = limitedResults
    .map(
      (item) => `
        <li>
          <div class="result-row">
            <span class="result-date">${formatResultDate(item.date)}</span>
            <span class="result-module">${item.moduleTitle || item.module || ''}</span>
          </div>
          <div class="result-details">
            <span class="result-title">${item.quizTitle}</span>
            <span class="result-score">${item.score} / ${item.total} · ${
              item.mode === 'training' || item.mode === 'entrainement'
                ? 'Entraînement'
                : 'Examen blanc'
            }</span>
          </div>
        </li>
      `
    )
    .join('');

  resultsContainer.innerHTML = `
    <div class="saved-results-header">
      <p>Vos derniers résultats pour : <strong>${state.userEmail}</strong></p>
    </div>
    <ul class="saved-results-list">${listItems}</ul>
  `;
}

function renderHome() {
  const homeSection = document.getElementById('view-home');
  if (!homeSection) return;

  homeSection.innerHTML = `
    <div class="modules" id="modules-grid"></div>
    <div class="info-section">
      <div class="info-card">
        <h3>Comment fonctionnent les quiz ?</h3>
        <p>À chaque quiz, vous choisissez un mode :</p>
        <ul class="info-list">
          <li><strong>Mode entraînement :</strong> les questions reviennent en boucle jusqu’à trouver la bonne réponse. Idéal pour mémoriser.</li>
          <li><strong>Mode examen blanc :</strong> répondez à tout puis découvrez votre score et la correction à la fin, comme le jour J.</li>
          <li>Si vous saisissez un email, vos résultats sont enregistrés localement pour les retrouver plus tard.</li>
        </ul>
      </div>
      <div class="info-card">
        <h3>Retrouvez vos résultats</h3>
        <form id="email-form" class="email-form">
          <label for="user-email">Votre email (optionnel)</label>
          <div class="email-input-row">
            <input type="email" id="user-email" name="user-email" placeholder="nom.prenom@example.com" value="${
              state.userEmail || ''
            }" />
            <button type="submit" class="secondary">${state.userEmail ? 'Mettre à jour' : 'Enregistrer'}</button>
          </div>
          <p class="help-text">L'email n'est utilisé que pour retrouver vos résultats sur cet appareil. Il n'est pas envoyé au serveur.</p>
        </form>
        <div id="saved-results" class="saved-results hidden"></div>
      </div>
    </div>
  `;

  const modulesContainer = document.getElementById('modules-grid');
  if (modulesContainer) {
    modulesContainer.innerHTML = MODULES.map(
      (module) => `
        <div class="module-card">
          <div class="module-card-header">
            <span class="module-icon" aria-hidden="true">${getModuleIcon(module.slug)}</span>
            <div class="module-card-text">
              <h2>${module.label}</h2>
              <p>${module.description}</p>
            </div>
          </div>
          <button data-module="${module.slug}">Commencer</button>
        </div>
      `
    ).join('');
  }

  const startButtons = document.querySelectorAll('button[data-module]');
  startButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const moduleSlug = button.dataset.module;
      await prepareModuleSelection(moduleSlug);
    });
  });

  const emailForm = document.getElementById('email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('user-email');
      const newEmail = input?.value.trim() || '';
      state.userEmail = newEmail;
      state.savedResults = loadResultsForEmail(newEmail);
      saveEmailToStorage(newEmail);
      renderHome();
      renderSavedResults();
    });
  }

  renderSavedResults();
}

function setupHeader() {
  const header = document.querySelector('header.site-header');
  if (!header) return;

  header.classList.add('app-header');

  let backLink = header.querySelector('.back-site-link');
  if (!backLink) {
    backLink = document.createElement('a');
    header.appendChild(backLink);
  }
  backLink.href = 'https://www.horizonbia.com/';
  backLink.className = 'back-site-link';
  backLink.textContent = '← Retour au site HorizonBIA';

  let title = header.querySelector('h1');
  if (!title) {
    title = document.createElement('h1');
    header.appendChild(title);
  }
  title.className = 'app-title';
  title.textContent = 'HorizonBIA Quiz';

  let adminLink = header.querySelector('.admin-link');
  if (!adminLink) {
    adminLink = document.createElement('a');
    header.appendChild(adminLink);
  }
  adminLink.href = '/admin/login.php';
  adminLink.className = 'admin-link';
  adminLink.textContent = 'Admin';
}

document.addEventListener('DOMContentLoaded', () => {
  state.userEmail = loadEmailFromStorage();
  state.savedResults = loadResultsForEmail(state.userEmail);
  ensureModuleView();
  ensureQuizzesLoaded();
  renderHome();
  setupHeader();
  showView('home');
});
