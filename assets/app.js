document.addEventListener('DOMContentLoaded', () => {
  const homeSection = document.getElementById('view-home');
  const quizSection = document.getElementById('view-quiz');
  const resultSection = document.getElementById('view-result');
  const startButtons = document.querySelectorAll('button[data-module]');

  const quizTitle = document.getElementById('quiz-title');
  const quizProgress = document.getElementById('quiz-progress');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizChoicesContainer = document.getElementById('quiz-choices');
  const quizFeedback = document.getElementById('quiz-feedback');
  const validateButton = document.getElementById('quiz-validate');
  const nextButton = document.getElementById('quiz-next');

  const resultScore = document.getElementById('result-score');
  const resultPercent = document.getElementById('result-percent');
  const resultMessage = document.getElementById('result-message');
  const restartButton = document.getElementById('result-restart');
  const homeButton = document.getElementById('result-home');

  let currentQuiz = null;
  let currentQuestions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let hasValidatedCurrent = false;

  function showView(view) {
    homeSection.classList.toggle('hidden', view !== 'home');
    quizSection.classList.toggle('hidden', view !== 'quiz');
    resultSection.classList.toggle('hidden', view !== 'result');
  }

  function resetFeedback(message = '', type = '') {
    quizFeedback.textContent = message;
    quizFeedback.classList.remove('success', 'error');
    if (type) {
      quizFeedback.classList.add(type);
    }
  }

  function renderQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    if (!question) return;

    quizTitle.textContent = currentQuiz?.title || 'Quiz';
    quizProgress.textContent = `Question ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    quizQuestionText.textContent = question.text;

    quizChoicesContainer.innerHTML = '';
    question.choices.forEach((choice, index) => {
      const label = document.createElement('label');
      label.className = 'quiz-choice';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'quiz-choice';
      input.value = index;

      const span = document.createElement('span');
      span.textContent = choice;

      label.appendChild(input);
      label.appendChild(span);
      quizChoicesContainer.appendChild(label);
    });

    validateButton.disabled = false;
    nextButton.disabled = true;
    hasValidatedCurrent = false;
    resetFeedback();
  }

  function showResult() {
    showView('result');
    const total = currentQuestions.length;
    const percent = Math.round((score / total) * 100);

    resultScore.textContent = `Score : ${score} / ${total}`;
    resultPercent.textContent = `Soit ${percent}%`;

    let message = 'Continuez vos efforts !';
    if (score >= 17) {
      message = 'Excellent, vous maîtrisez ce thème !';
    } else if (score >= 12) {
      message = 'Bon travail, encore un petit effort !';
    }
    resultMessage.textContent = message;
  }

  function startQuiz(quizData) {
    currentQuiz = quizData;
    currentQuestions = quizData.questions || [];
    currentQuestionIndex = 0;
    score = 0;

    if (currentQuestions.length === 0) {
      resetFeedback("Aucune question disponible pour ce quiz.", 'error');
      return;
    }

    showView('quiz');
    renderQuestion();
  }

  function handleValidate() {
    if (hasValidatedCurrent) return;
    const selected = quizChoicesContainer.querySelector('input[name="quiz-choice"]:checked');
    if (!selected) {
      resetFeedback('Sélectionnez une réponse avant de valider.', 'error');
      return;
    }

    hasValidatedCurrent = true;
    validateButton.disabled = true;
    nextButton.disabled = false;

    const selectedIndex = Number(selected.value);
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      score += 1;
      resetFeedback('Bonne réponse !', 'success');
    } else {
      const correctAnswer = currentQuestion.choices[currentQuestion.correctIndex];
      resetFeedback(`Mauvaise réponse, la bonne réponse était : ${correctAnswer}`, 'error');
    }
  }

  function handleNext() {
    if (!hasValidatedCurrent) return;

    if (currentQuestionIndex + 1 >= currentQuestions.length) {
      showResult();
      return;
    }

    currentQuestionIndex += 1;
    renderQuestion();
  }

  function loadQuizForModule(module) {
    if (module !== 'histoire') {
      alert('Ce module n\'est pas encore disponible. Essayez le module Histoire.');
      return;
    }

    fetch('api/quizzes/index.json')
      .then((response) => response.json())
      .then((quizzes) => {
        const quiz = quizzes.find((item) => item.module === 'histoire');
        if (!quiz) {
          resetFeedback('Aucun quiz disponible pour ce module.', 'error');
          return null;
        }
        return fetch(`api/quizzes/${quiz.questionsFile}`).then((response) => response.json());
      })
      .then((quizData) => {
        if (quizData) {
          startQuiz(quizData);
        }
      })
      .catch(() => {
        resetFeedback('Erreur lors du chargement du quiz.', 'error');
      });
  }

  startButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const module = button.getAttribute('data-module');
      loadQuizForModule(module);
    });
  });

  validateButton.addEventListener('click', handleValidate);
  nextButton.addEventListener('click', handleNext);

  restartButton.addEventListener('click', () => {
    if (currentQuiz) {
      startQuiz(currentQuiz);
    }
  });

  homeButton.addEventListener('click', () => {
    showView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  showView('home');
});
