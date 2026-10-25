const quizParams = new URLSearchParams(window.location.search);
const handbookId = quizParams.get("id");
const quizForm = document.getElementById("quiz-form");
const resultBox = document.getElementById("result");

const generalQuestions = [
    {
        question: "What does an eight-sided (octagon) red sign mean?",
        choices: ["Yield", "Stop", "Do not enter", "Railroad crossing"],
        answer_index: 1,
        explanation: "An octagon shape is only used for stop signs. Come to a full stop."
    },
    {
        question: "What does a triangle sign pointing down mean?",
        choices: ["Stop", "Merge", "Yield", "Warning ahead"],
        answer_index: 2,
        explanation: "A downward triangle means yield. Slow down and let other traffic and people go first."
    },
    {
        question: "What do diamond-shaped signs usually mean?",
        choices: ["Warning of something ahead", "Speed limit", "School zone", "Hospital nearby"],
        answer_index: 0,
        explanation: "Diamond signs warn you about things ahead, like curves, hills, or crossings."
    },
    {
        question: "What does a five-sided (pentagon) sign mean?",
        choices: ["No passing zone", "School zone or school crossing", "Construction zone", "Railroad crossing"],
        answer_index: 1,
        explanation: "A pentagon sign marks a school zone or a school crossing."
    },
    {
        question: "What color are signs in construction and work zones?",
        choices: ["Green", "Blue", "Brown", "Orange"],
        answer_index: 3,
        explanation: "Orange signs warn you about work zones. Slow down and watch for workers."
    },
    {
        question: "What should you do at a flashing red traffic light?",
        choices: [
            "Slow down and go through",
            "Stop completely, then go when it is safe",
            "Speed up to clear the intersection",
            "Wait until the light turns green"
        ],
        answer_index: 1,
        explanation: "Treat a flashing red light just like a stop sign."
    },
    {
        question: "What should you do at a flashing yellow traffic light?",
        choices: [
            "Stop and wait for green",
            "Speed up",
            "Slow down and go carefully",
            "Turn right only"
        ],
        answer_index: 2,
        explanation: "A flashing yellow light means slow down and be careful."
    },
    {
        question: "Two cars reach a four-way stop at the same time. Who goes first?",
        choices: [
            "The car on the left",
            "The car on the right",
            "The bigger car",
            "The car going straight, no matter where it is"
        ],
        answer_index: 1,
        explanation: "When two cars arrive at the same time, the driver on the left lets the driver on the right go first."
    },
    {
        question: "You are turning left at a green light with no arrow. Who do you need to yield to?",
        choices: [
            "No one, a green light means go",
            "Only cars behind you",
            "Oncoming traffic and people crossing",
            "Only buses"
        ],
        answer_index: 2,
        explanation: "On a plain green light, left turns must yield to oncoming traffic and pedestrians."
    },
    {
        question: "An ambulance with its siren and lights on is coming toward you. What should you do?",
        choices: [
            "Keep driving at the same speed",
            "Stop right where you are, even in an intersection",
            "Pull over to the right side of the road and stop",
            "Speed up to get out of the way"
        ],
        answer_index: 2,
        explanation: "Pull over to the right edge of the road and stop until the emergency vehicle passes."
    },
    {
        question: "A school bus in front of you stops with red lights flashing and its stop arm out. What should you do?",
        choices: [
            "Pass it slowly on the left",
            "Stop and wait until the lights stop flashing",
            "Honk and go around",
            "Keep going if no kids are outside"
        ],
        answer_index: 1,
        explanation: "Stop for a school bus with flashing red lights. Do not go until the lights stop and the stop arm is pulled back."
    },
    {
        question: "What does a solid yellow line on your side of the center line mean?",
        choices: ["You may pass when it is clear", "Do not pass", "The lane is ending", "Bike lane"],
        answer_index: 1,
        explanation: "A solid yellow line on your side means you may not pass."
    },
    {
        question: "What do broken white lines between lanes mean?",
        choices: [
            "Traffic in both lanes goes the same way and you may change lanes when safe",
            "Traffic goes in opposite directions",
            "You may never change lanes",
            "The lane is only for buses"
        ],
        answer_index: 0,
        explanation: "Broken white lines separate lanes going the same way. You may change lanes when it is safe."
    },
    {
        question: "What is the best way to check your blind spot before changing lanes?",
        choices: [
            "Look in your rearview mirror only",
            "Look in your side mirror only",
            "Turn your head and look over your shoulder",
            "Turn on your signal and go"
        ],
        answer_index: 2,
        explanation: "Mirrors miss your blind spots, so turn your head and look over your shoulder."
    },
    {
        question: "Your car starts to hydroplane on a wet road. What should you do?",
        choices: [
            "Slam on the brakes",
            "Ease off the gas and steer straight",
            "Speed up",
            "Turn the wheel hard"
        ],
        answer_index: 1,
        explanation: "Take your foot off the gas and keep the wheel straight until your tires grip the road again."
    }
];

account.then(loadQuiz);

async function loadQuiz() {
    if (!handbookId) {
        startQuiz({
            name: "General rules quiz",
            label: "Works in every state",
            state: null,
            questions: generalQuestions,
            needed: 0.8,
            backLink: "permitest.html"
        });
        return;
    }

    let handbook;

    try {
        handbook = await handbookStore.get(handbookId);
    } catch {
        showMessage("Could not load your saved handbooks.");
        return;
    }

    if (!handbook || !handbook.test) {
        showMessage("This quiz could not be found. It may have been deleted.");
        return;
    }

    const state = getState(handbook.state);

    startQuiz({
        name: handbook.title,
        label: state.name,
        state: state.code,
        questions: handbook.test.questions,
        needed: state.correct / state.questions,
        backLink: `handbook.html?state=${state.code}`
    });
}

function showMessage(text) {
    document.getElementById("quiz-title").textContent = "Quiz not found";
    quizForm.innerHTML = "";

    const note = document.createElement("p");
    note.textContent = text;
    quizForm.append(note);
}

function shuffle(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function startQuiz(quiz) {
    const questions = shuffle(quiz.questions);
    const passMark = Math.round(quiz.needed * 100);

    document.title = `DriveReady | ${quiz.name}`;
    document.getElementById("quiz-label").textContent = quiz.label;
    document.getElementById("quiz-title").textContent = quiz.name;
    document.getElementById("quiz-info").textContent =
        `${questions.length} Questions | You need ${passMark}% to pass.`;

    resultBox.hidden = true;
    quizForm.innerHTML = "";

    questions.forEach((question, index) => {
        const box = document.createElement("fieldset");
        box.className = "question";

        const title = document.createElement("legend");
        title.textContent = `${index + 1}. ${question.question}`;
        box.append(title);

        question.choices.forEach((choice, choiceIndex) => {
            const label = document.createElement("label");
            label.className = "choice";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question-${index}`;
            radio.value = choiceIndex;

            label.append(radio, document.createTextNode(choice));
            box.append(label);
        });

        const explanation = document.createElement("p");
        explanation.className = "explanation";
        explanation.hidden = true;
        explanation.textContent = question.page
            ? `Handbook page ${question.page} | ${question.explanation}`
            : question.explanation;
        box.append(explanation);

        quizForm.append(box);
    });

    const checkButton = document.createElement("button");
    checkButton.type = "submit";
    checkButton.textContent = "Check Answers";
    quizForm.append(checkButton);

    quizForm.onsubmit = (event) => {
        event.preventDefault();
        checkAnswers(quiz, questions, passMark);
        checkButton.remove();
    };
}

function checkAnswers(quiz, questions, passMark) {
    const boxes = quizForm.querySelectorAll(".question");
    let correct = 0;

    questions.forEach((question, index) => {
        const box = boxes[index];
        const picked = box.querySelector("input:checked");
        const choices = box.querySelectorAll(".choice");

        choices[question.answer_index].classList.add("correct");

        if (picked && Number(picked.value) === question.answer_index) {
            correct++;
        } else {
            box.classList.add("missed");
            if (picked) {
                picked.parentElement.classList.add("wrong");
            }
        }

        box.querySelectorAll("input").forEach((input) => {
            input.disabled = true;
        });
        box.querySelector(".explanation").hidden = false;
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = correct / questions.length >= quiz.needed;

    showResult(quiz, correct, questions.length, score, passed, passMark);

    attemptStore.save({
        id: makeId(),
        name: quiz.name,
        state: quiz.state,
        correct: correct,
        total: questions.length,
        score: score,
        passMark: passMark,
        passed: passed,
        date: Date.now()
    }).catch(() => {});
}

function showResult(quiz, correct, total, score, passed, passMark) {
    resultBox.hidden = false;
    resultBox.className = passed ? "result pass" : "result fail";
    resultBox.innerHTML = `
        <div>
            <p>${passed ? "Passed" : "Not yet"}</p>
            <h2>${correct} / ${total} | ${score}%</h2>
            <p>You need ${passMark}% to pass.</p>
        </div>
        <div class="buttons">
            <a href="${quiz.backLink}">Back</a>
        </div>
    `;

    const retakeButton = document.createElement("button");
    retakeButton.type = "button";
    retakeButton.textContent = "Retake Quiz";
    retakeButton.addEventListener("click", () => {
        startQuiz(quiz);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
    resultBox.querySelector(".buttons").append(retakeButton);

    window.scrollTo({ top: 0, behavior: "smooth" });
}
