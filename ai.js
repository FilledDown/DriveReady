const MAX_PDF_BYTES = 50 * 1024 * 1024;

async function generateTest(handbook) {
    const state = getState(handbook.state);
    const user = await account;
    const { data } = await sb.auth.getSession();

    const path = `${user.id}/${makeId()}.pdf`;
    const handbooks = sb.storage.from("handbooks");

    const upload = await handbooks.upload(path, handbook.file, { contentType: "application/pdf" });
    if (upload.error) {
        throw new Error(`Couldn't send the handbook to the server: ${upload.error.message}`);
    }

    let response;
    try {
        response = await fetch("/api/generate-test", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.session?.access_token}`
            },
            body: JSON.stringify({
                path: path,
                stateName: state.name,
                questionCount: state.questions,
                title: handbook.title,
                fileName: handbook.fileName
            })
        });
    } catch {
        throw new Error("Couldn't reach the server. Check your internet connection.");
    } finally {
        handbooks.remove([path]).catch(() => {});
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (result.error) {
            throw new Error(result.error);
        }
        if (response.status === 504) {
            throw new Error("Making the test took too long. Try again.");
        }
        throw new Error("The server couldn't make the test. Try again.");
    }

    return { questions: result.questions, generatedAt: Date.now(), model: result.model };
}
