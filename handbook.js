const params = new URLSearchParams(window.location.search);
const stateCode = (params.get("state") || "CO").toUpperCase();
const state = getState(stateCode);

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("handbook-file");
const filePicker = document.getElementById("file-picker");
const fileLabel = document.getElementById("file-label");
const message = document.getElementById("upload-message");
const list = document.getElementById("handbook-list");

const generating = new Set();
let uploadAfterPicking = false;

if (!state) {
    document.querySelector(".handbook-page").innerHTML = `
        <a class="back-link" href="permitest.html">← ALL STATES</a>
        <h1>State not found</h1>
        <p>Choose a state from the state list.</p>
    `;
} else {
    showState();
    account.then(showHandbooks);
}

function showState() {
    document.title = `DriveReady | ${state.name} Handbooks`;
    document.getElementById("state-title").textContent = `${state.name} handbooks`;
    document.getElementById("official-link").href = state.searchLink;
    document.getElementById("question-count").textContent = state.questions;
    document.getElementById("pass-mark").textContent = `${state.passMark}%`;
    document.getElementById("correct-needed").textContent = state.correct;
    document.getElementById("handbook-title").value = `${state.name} Driver Handbook`;
}

function showFileName() {
    const file = fileInput.files[0];
    fileLabel.textContent = file ? file.name : "Choose or drop a file...";
}

fileInput.addEventListener("change", () => {
    showFileName();

    if (uploadAfterPicking && fileInput.files[0]) {
        uploadAfterPicking = false;
        form.requestSubmit();
    }
});

filePicker.addEventListener("dragover", (event) => {
    event.preventDefault();
    filePicker.classList.add("dragging");
});

filePicker.addEventListener("dragleave", () => {
    filePicker.classList.remove("dragging");
});

filePicker.addEventListener("drop", (event) => {
    event.preventDefault();
    filePicker.classList.remove("dragging");

    if (event.dataTransfer.files.length) {
        fileInput.files = event.dataTransfer.files;
        showFileName();
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];

    if (!file) {
        uploadAfterPicking = true;
        fileInput.click();
        return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        message.textContent = "That file is not a PDF. Please choose the handbook PDF.";
        return;
    }

    if (file.size > MAX_PDF_BYTES) {
        message.textContent = "That PDF is over 50 MB. Please try a smaller copy.";
        return;
    }

    const handbook = {
        id: makeId(),
        state: stateCode,
        title: document.getElementById("handbook-title").value.trim(),
        fileName: file.name,
        size: file.size,
        uploadedAt: Date.now(),
        file: file,
        test: null,
        error: null
    };

    try {
        await handbookStore.save(handbook);
    } catch {
        message.textContent = "Could not save the handbook in this browser.";
        return;
    }

    fileInput.value = "";
    showFileName();
    message.textContent = "Uploaded. Making your practice test...";
    await makeTest(handbook);
});

async function makeTest(handbook) {
    generating.add(handbook.id);
    handbook.error = null;
    await showHandbooks();

    try {
        handbook.test = await generateTest(handbook);
        message.textContent = `Your practice test for "${handbook.title}" is ready.`;
    } catch (error) {
        handbook.error = error.message;
        message.textContent = "";
    }

    generating.delete(handbook.id);
    await handbookStore.save(handbook);
    await showHandbooks();
}

function formatSize(bytes) {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function makeHandbook(handbook) {
    const item = document.createElement("div");
    item.className = "handbook";
    item.innerHTML = `
        <div class="info">
            <h3></h3>
            <p class="file"></p>
            <p class="status"></p>
        </div>
        <div class="buttons"></div>
    `;

    item.querySelector("h3").textContent = handbook.title;
    item.querySelector(".file").textContent =
        `${handbook.fileName} | ${formatSize(handbook.size)} | ${new Date(handbook.uploadedAt).toLocaleDateString()}`;

    const status = item.querySelector(".status");
    const buttons = item.querySelector(".buttons");

    function addButton(text, onClick, isMain) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        if (isMain) {
            button.className = "main";
        }
        button.addEventListener("click", onClick);
        buttons.append(button);
    }

    if (generating.has(handbook.id)) {
        status.textContent = "Making your practice test... this can take a minute or two.";
        status.classList.add("working");
    } else if (handbook.error) {
        status.textContent = handbook.error;
        status.classList.add("failed");
        addButton("Try Again", () => makeTest(handbook), true);
    } else if (handbook.test) {
        status.textContent = `Practice test ready | ${handbook.test.questions.length} Questions`;
        addButton("Take Test", () => {
            window.location.href = `quiz.html?id=${encodeURIComponent(handbook.id)}`;
        }, true);
        addButton("New Test", () => makeTest(handbook));
    } else {
        status.textContent = "No practice test yet.";
        addButton("Make Test", () => makeTest(handbook), true);
    }

    addButton("Open PDF", () => {
        window.open(URL.createObjectURL(handbook.file), "_blank");
    });

    addButton("Delete", async () => {
        if (!confirm(`Delete "${handbook.title}"?`)) {
            return;
        }
        await handbookStore.remove(handbook.id);
        await showHandbooks();
    });

    return item;
}

async function showHandbooks() {
    let handbooks = [];

    try {
        handbooks = (await handbookStore.all()).filter((handbook) => handbook.state === stateCode);
    } catch {
        message.textContent = "Could not load your saved handbooks.";
    }

    handbooks.sort((a, b) => b.uploadedAt - a.uploadedAt);
    document.getElementById("handbook-total").textContent = `${handbooks.length} TOTAL`;

    if (!handbooks.length) {
        list.innerHTML = `
            <h3>No handbooks yet.</h3>
            <p>Upload an official handbook to study.</p>
        `;
        return;
    }

    list.replaceChildren(...handbooks.map(makeHandbook));
}
