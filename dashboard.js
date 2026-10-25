const recentAttempts = document.getElementById("recent-attempts");

account.then(async function (user) {
    document.getElementById("greeting").textContent = `Hey, ${user.firstName}.`;

    let attempts = [];

    try {
        attempts = await attemptStore.all();
    } catch {
        attempts = [];
    }

    attempts.sort((a, b) => b.date - a.date);

    showState(attempts);
    showStats(attempts);
    showReadiness(attempts);
    showRecentAttempts(attempts);
});

function showState(attempts) {
    const lastStateAttempt = attempts.find((attempt) => attempt.state);

    if (lastStateAttempt) {
        document.getElementById("state").textContent = getState(lastStateAttempt.state).name;
    }
}

function average(numbers) {
    if (!numbers.length) {
        return 0;
    }
    return Math.round(numbers.reduce((total, number) => total + number, 0) / numbers.length);
}

function showStats(attempts) {
    const scores = attempts.map((attempt) => attempt.score);
    const passed = attempts.filter((attempt) => attempt.passed).length;

    document.getElementById("quizzes-taken").textContent = attempts.length;
    document.getElementById("best-score").textContent = `${scores.length ? Math.max(...scores) : 0}%`;
    document.getElementById("average-score").textContent = `${average(scores)}%`;
    document.getElementById("pass-rate").textContent =
        `${attempts.length ? Math.round((passed / attempts.length) * 100) : 0}%`;
}

function showReadiness(attempts) {
    const lastAttempts = attempts.slice(0, 3);
    const passMark = lastAttempts.length ? lastAttempts[0].passMark : 80;
    const averageScore = average(lastAttempts.map((attempt) => attempt.score));
    const progressFill = document.getElementById("progress-fill");

    progressFill.style.width = `${averageScore}%`;
    document.getElementById("pass-marker").style.left = `${passMark}%`;
    document.getElementById("average-label").textContent = `${averageScore}%`;
    document.getElementById("pass-label").textContent = `Pass mark ${passMark}%`;

    if (!lastAttempts.length) {
        return;
    }

    const title = document.getElementById("readiness-title");
    const quizWord = lastAttempts.length === 1 ? "quiz" : "quizzes";

    document.getElementById("readiness-description").textContent =
        `Average of your last ${lastAttempts.length} permit ${quizWord}.`;

    if (averageScore >= passMark) {
        title.textContent = "You're passing consistently.";
        progressFill.classList.add("passing");
    } else {
        title.textContent = "Not consistently passing yet.";
    }
}

function addCell(text, className) {
    const cell = document.createElement("div");
    const value = document.createElement("h3");

    value.textContent = text;
    if (className) {
        value.className = className;
    }

    cell.append(value);
    recentAttempts.append(cell);
}

function showRecentAttempts(attempts) {
    if (!attempts.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "No quizzes yet. Take one to see it here.";
        recentAttempts.append(empty);
        return;
    }

    attempts.slice(0, 5).forEach((attempt) => {
        addCell(attempt.name);
        addCell(attempt.state ? getState(attempt.state).name : "All states");
        addCell(`${attempt.score}%`);
        addCell(attempt.passed ? "Pass" : "Fail", attempt.passed ? "pass" : "fail");
        addCell(new Date(attempt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    });
}
