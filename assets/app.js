const state = {
  currentQuiz: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  selectedIndex: null,
  questionValidated: false,
  queue: [],
  masteredIndices: new Set(),
  totalAttempts: 0,
};

function showView(name) {
  const homeSection = document.getElementById('view-home');
  const quizSection = document.getElementById('view-quiz');
  const resultSection = document.getElementById('view-result');

  homeSection.classList.toggle('hidden', name !== 'home');
  quizSection.classList.toggle('hidden', name !== 'quiz');
  resultSection.classList.toggle('hidden', name !== 'result');
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
        <p class="quiz-counter"><strong>Questions maîtrisées :</strong> <span id="mastered-count">${state.masteredIndices.size}</span> / ${state.questions.length}</p>
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

  if (state.masteredIndices.size === state.questions.length) {
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

  const restartButton = document.getElementById('result-restart');
  const homeButton = document.getElementById('result-home');

  restartButton.addEventListener('click', () => {
    resetQuizProgress();
    renderCurrentQuestion();
  });

  homeButton.addEventListener('click', () => {
    showView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  showView('result');
}

function resetQuizProgress() {
  state.queue = state.questions.map((_, index) => index);
  state.masteredIndices = new Set();
  state.totalAttempts = 0;
  state.score = 0;
  state.selectedIndex = null;
  state.questionValidated = false;
  state.currentIndex = state.queue.shift() ?? 0;
}

async function loadQuiz(quizId) {
  try {
    const indexResponse = await fetch('api/quizzes/index.json');
    const quizzes = await indexResponse.json();
    const quizMeta = quizzes.find((entry) => entry.id === quizId);

    if (!quizMeta) {
      alert('Quiz introuvable.');
      return;
    }

    const questionsResponse = await fetch(`api/quizzes/${quizMeta.questionsFile}`);
    const quizData = await questionsResponse.json();

    state.currentQuiz = quizMeta;
    state.questions = quizData.questions || [];
    resetQuizProgress();

    renderCurrentQuestion();
  } catch (error) {
    alert('Erreur lors du chargement du quiz.');
  }
}

function setupHome() {
  const startButtons = document.querySelectorAll('button[data-module]');
  startButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const module = button.dataset.module;
      if (module === 'histoire') {
        loadQuiz('histoire-1');
      } else {
        alert('Quiz en cours de préparation');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupHome();
  showView('home');
});
