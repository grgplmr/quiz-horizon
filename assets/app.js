const state = {
  currentQuiz: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  selectedIndex: null,
  questionValidated: false,
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
  const currentQuestion = state.questions[state.currentIndex];
  const isCorrect = state.selectedIndex === currentQuestion.correctIndex;

  if (isCorrect) {
    state.score += 1;
    feedbackEl.textContent = 'Bonne réponse !';
    feedbackEl.classList.remove('error');
    feedbackEl.classList.add('success');
  } else {
    const correctAnswer = currentQuestion.choices[currentQuestion.correctIndex];
    feedbackEl.textContent = `Mauvaise réponse, la bonne réponse était : ${correctAnswer}`;
    feedbackEl.classList.remove('success');
    feedbackEl.classList.add('error');
  }

  validateButton.disabled = true;
  nextButton.disabled = false;
}

function handleNextQuestion() {
  if (!state.questionValidated) return;

  state.currentIndex += 1;
  if (state.currentIndex < state.questions.length) {
    renderCurrentQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  const viewResult = document.getElementById('view-result');
  const total = state.questions.length || 1;
  const scoreOn20 = Math.round((state.score / total) * 20);
  const percent = Math.round((state.score / total) * 100);

  let message = 'Continue à t’entraîner, tu vas progresser.';
  if (scoreOn20 >= 17) {
    message = 'Excellent, tu es prêt pour le BIA !';
  } else if (scoreOn20 >= 12) {
    message = 'Bon résultat, encore quelques notions à consolider.';
  }

  viewResult.innerHTML = `
    <div class="result-panel">
      <h2>${state.currentQuiz?.title || 'Quiz'}</h2>
      <p class="result-score">Score : ${scoreOn20} / 20</p>
      <p class="result-percent">${percent}% de bonnes réponses</p>
      <p class="result-message">${message}</p>
      <div class="result-actions">
        <button id="result-restart" class="primary">Recommencer ce quiz</button>
        <button id="result-home" class="secondary">Retour à l’accueil</button>
      </div>
    </div>
  `;

  const restartButton = document.getElementById('result-restart');
  const homeButton = document.getElementById('result-home');

  restartButton.addEventListener('click', () => {
    state.currentIndex = 0;
    state.score = 0;
    renderCurrentQuestion();
  });

  homeButton.addEventListener('click', () => {
    showView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  showView('result');
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
    state.currentIndex = 0;
    state.score = 0;

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
