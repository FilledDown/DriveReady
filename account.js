const logoutButton = document.getElementById("logout");

async function loadAccount() {
    const { data } = await sb.auth.getSession();

    if (!data.session) {
        window.location.replace("login.html");
        return new Promise(() => {});
    }

    const user = data.session.user;
    const firstName = user.user_metadata.first_name || user.email.split("@")[0];

    const nameText = document.querySelector(".account .name");
    const letterText = document.querySelector(".account .letter");

    if (nameText) {
        nameText.textContent = firstName;
    }
    if (letterText) {
        letterText.textContent = firstName[0].toUpperCase();
    }

    useAccount(user.id);
    indexedDB.deleteDatabase("driveready");

    return { id: user.id, firstName: firstName };
}

const account = loadAccount();

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        await sb.auth.signOut();
        window.location.replace("login.html");
    });
}
