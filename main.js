// App State
let state = {
    mode: 'edit', // 'edit', 'study', or 'complete'
    flashcards: [
        { id: 1, question: 'What is a variable?', answer: 'A container that stores data values' },
        { id: 2, question: 'What does a loop do?', answer: 'Repeats a block of code multiple times' }
    ],
    editingId: null,
    currentCardIndex: 0,
    showAnswer: false,
    userAnswer: '',
    score: { correct: 0, total: 0 }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    render();
});

// Main render function
function render() {
    const app = document.getElementById('app');
    
    if (state.mode === 'edit') {
        app.innerHTML = renderEditMode();
        attachEditModeListeners();
    } else if (state.mode === 'study') {
        app.innerHTML = renderStudyMode();
        attachStudyModeListeners();
    } else if (state.mode === 'complete') {
        app.innerHTML = renderCompleteMode();
        attachCompleteModeListeners();
    }
}

// Edit Mode
function renderEditMode() {
    const cardsHTML = state.flashcards.length === 0 
        ? '<div class="empty-state"><p>No flashcards yet. Create one above!</p></div>'
        : state.flashcards.map(card => {
            if (state.editingId === card.id) {
                return renderEditCard(card);
            }
            return `
                <div class="flashcard-item">
                    <div class="card-content">
                        <div class="card-label">Q:</div>
                        <p class="card-text">${escapeHtml(card.question)}</p>
                    </div>
                    <div class="card-content">
                        <div class="card-label answer">A:</div>
                        <p class="card-text">${escapeHtml(card.answer)}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-edit" onclick="startEditing(${card.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger" onclick="deleteCard(${card.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    return `
        <div class="container">
            <div class="header">
                <div class="header-title">
                    <span class="icon">📚</span>
                    <h1>Flashcard Study App</h1>
                </div>
                ${state.flashcards.length > 0 ? '<button class="btn btn-success" onclick="startStudying()">▶️ Start Studying</button>' : ''}
            </div>
            
            <div class="add-card-section">
                <h2>Create New Flashcard</h2>
                <div class="form-group">
                    <label>Question</label>
                    <input type="text" id="newQuestion" placeholder="Enter your question...">
                </div>
                <div class="form-group">
                    <label>Answer</label>
                    <input type="text" id="newAnswer" placeholder="Enter the answer...">
                </div>
                <button class="btn btn-primary" onclick="addFlashcard()">➕ Add Flashcard</button>
            </div>
            
            <div class="flashcard-list">
                <h2>Your Flashcards <span class="flashcard-count">(${state.flashcards.length})</span></h2>
                <div class="flashcards-container">
                    ${cardsHTML}
                </div>
            </div>
        </div>
    `;
}

function renderEditCard(card) {
    return `
        <div class="flashcard-item">
            <div class="form-group">
                <label>Question</label>
                <input type="text" id="editQuestion${card.id}" value="${escapeHtml(card.question)}">
            </div>
            <div class="form-group">
                <label>Answer</label>
                <input type="text" id="editAnswer${card.id}" value="${escapeHtml(card.answer)}">
            </div>
            <div class="card-actions">
                <button class="btn btn-success" onclick="saveEdit(${card.id})">✓ Save</button>
                <button class="btn btn-secondary" onclick="cancelEdit()">✕ Cancel</button>
            </div>
        </div>
    `;
}

function attachEditModeListeners() {
    const newQuestion = document.getElementById('newQuestion');
    const newAnswer = document.getElementById('newAnswer');
    
    if (newAnswer) {
        newAnswer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addFlashcard();
        });
    }
}

// Edit Mode Functions
function addFlashcard() {
    const question = document.getElementById('newQuestion').value.trim();
    const answer = document.getElementById('newAnswer').value.trim();
    
    if (question && answer) {
        state.flashcards.push({
            id: Date.now(),
            question,
            answer
        });
        render();
    }
}

function deleteCard(id) {
    state.flashcards = state.flashcards.filter(card => card.id !== id);
    render();
}

function startEditing(id) {
    state.editingId = id;
    render();
}

function saveEdit(id) {
    const question = document.getElementById(`editQuestion${id}`).value.trim();
    const answer = document.getElementById(`editAnswer${id}`).value.trim();
    
    state.flashcards = state.flashcards.map(card => 
        card.id === id ? { ...card, question, answer } : card
    );
    state.editingId = null;
    render();
}

function cancelEdit() {
    state.editingId = null;
    render();
}

// Study Mode
function renderStudyMode() {
    const card = state.flashcards[state.currentCardIndex];
    const progress = ((state.currentCardIndex + 1) / state.flashcards.length) * 100;
    
    const answerSection = !state.showAnswer ? `
        <div class="answer-input">
            <label>Your Answer</label>
            <input type="text" id="userAnswer" placeholder="Type your answer..." value="${state.userAnswer}" autofocus>
        </div>
    ` : '';
    
    const feedback = state.showAnswer && state.feedback ? `
        <div class="feedback ${state.feedback.isCorrect ? 'correct' : 'incorrect'}">
            ${state.feedback.message}
        </div>
    ` : '';
    
    const buttons = !state.showAnswer ? `
        <button class="btn btn-primary" onclick="checkAnswer()" ${!state.userAnswer ? 'disabled' : ''}>
            ✓ Check Answer
        </button>
        <button class="btn btn-secondary" onclick="exitStudy()">✕ Exit</button>
    ` : `
        <button class="btn btn-success" onclick="nextCard()">
            ${state.currentCardIndex < state.flashcards.length - 1 ? '➡️ Next Card' : '🏁 Finish'}
        </button>
    `;
    
    return `
        <div class="container study-container">
            <div class="study-header">
                <div class="study-info">
                    <h2>Study Mode</h2>
                    <p>Card ${state.currentCardIndex + 1} of ${state.flashcards.length}</p>
                </div>
                <div class="score-display">
                    <p>Score</p>
                    <p>${state.score.correct}/${state.score.total}</p>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div class="question-card">
                <p>${escapeHtml(card.question)}</p>
            </div>
            
            ${answerSection}
            ${feedback}
            
            <div class="button-group">
                ${buttons}
            </div>
        </div>
    `;
}

function attachStudyModeListeners() {
    const input = document.getElementById('userAnswer');
    if (input) {
        input.addEventListener('input', (e) => {
            state.userAnswer = e.target.value;
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && state.userAnswer.trim()) {
                checkAnswer();
            }
        });
    }
}

function startStudying() {
    if (state.flashcards.length === 0) {
        alert('Please add some flashcards first!');
        return;
    }
    state.mode = 'study';
    state.currentCardIndex = 0;
    state.showAnswer = false;
    state.userAnswer = '';
    state.score = { correct: 0, total: 0 };
    state.feedback = null;
    render();
}

function checkAnswer() {
    const card = state.flashcards[state.currentCardIndex];
    const isCorrect = state.userAnswer.trim().toLowerCase() === card.answer.trim().toLowerCase();
    
    state.score.correct += isCorrect ? 1 : 0;
    state.score.total += 1;
    state.showAnswer = true;
    state.feedback = {
        isCorrect,
        message: isCorrect ? 'Correct! 🎉' : `Incorrect. The answer is: ${card.answer}`
    };
    
    render();
}

function nextCard() {
    if (state.currentCardIndex < state.flashcards.length - 1) {
        state.currentCardIndex++;
        state.showAnswer = false;
        state.userAnswer = '';
        state.feedback = null;
        render();
    } else {
        state.mode = 'complete';
        render();
    }
}

function exitStudy() {
    state.mode = 'edit';
    state.currentCardIndex = 0;
    state.showAnswer = false;
    state.userAnswer = '';
    state.score = { correct: 0, total: 0 };
    state.feedback = null;
    render();
}

// Complete Mode
function renderCompleteMode() {
    const percentage = Math.round((state.score.correct / state.score.total) * 100);
    const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚';
    const message = percentage >= 80 
        ? 'Excellent work! You really know your stuff!' 
        : percentage >= 60 
        ? 'Good job! Keep practicing to improve.' 
        : 'Keep studying! Practice makes perfect.';
    
    return `
        <div class="container complete-container">
            <div class="complete-emoji">${emoji}</div>
            <h1>Study Session Complete!</h1>
            
            <div class="score-card">
                <div class="percentage">${percentage}%</div>
                <div class="score-text">${state.score.correct} out of ${state.score.total} correct</div>
            </div>
            
            <p class="complete-message">${message}</p>
            
            <div class="button-group">
                <button class="btn btn-success" onclick="restartStudy()">🔄 Study Again</button>
                <button class="btn btn-primary" onclick="backToEdit()">📚 Edit Cards</button>
            </div>
        </div>
    `;
}

function attachCompleteModeListeners() {
    // No specific listeners needed for complete mode
}

function restartStudy() {
    startStudying();
}

function backToEdit() {
    exitStudy();
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
