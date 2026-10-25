const searchInput = document.getElementById("state-search");
const stateButtons = document.querySelectorAll(".state-btn");

searchInput.addEventListener("input", function () {
    const search = this.value.trim().toLowerCase();

    stateButtons.forEach(function (state) {
        state.style.display = state.textContent.toLowerCase().includes(search)
            ? "flex"
            : "none";
    });
});

account.then(async function () {
    let handbooks = [];

    try {
        handbooks = await handbookStore.all();
    } catch {
        return;
    }

    stateButtons.forEach(function (state) {
        const code = new URL(state.href).searchParams.get("state");
        const count = handbooks.filter((handbook) => handbook.state === code).length;
        state.querySelector(".badge").firstChild.nodeValue = count;
    });
});
