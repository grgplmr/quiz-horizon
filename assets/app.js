const MODULES = [
  {
    slug: 'aero',
    label: 'Aérodynamique et mécanique du vol',
    description: 'Découvrir les bases.',
  },
  {
    slug: 'aeronefs',
    label: 'Connaissance des aéronefs',
    description: 'Approfondir les connaissances.',
  },
  {
    slug: 'meteo',
    label: 'Météorologie et aérologie',
    description: 'Entraînement avancé.',
  },
  {
    slug: 'nav',
    label: 'Navigation, sécurité et réglementation',
    description: 'Révisions ciblées.',
  },
  {
    slug: 'histoire',
    label: 'Histoire de l’aéronautique et de l’espace',
    description: 'Questionnaires thématiques.',
  },
  {
    slug: 'anglais',
    label: 'Anglais aéronautique',
    description: 'Simulation complète.',
  },
];

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
  if (state.mode === 'training') {
    const total = state.questions.length || 1;
    const scoreOn20 = 20;
    const percent = 100;

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

function setupHome() {
  const startButtons = document.querySelectorAll('button[data-module]');
  startButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const moduleSlug = button.dataset.module;
      await prepareModuleSelection(moduleSlug);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ensureModuleView();
  ensureQuizzesLoaded();
  setupHome();
  showView('home');
});
