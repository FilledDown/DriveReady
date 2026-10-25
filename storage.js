let databaseName = "driveready";

function useAccount(userId) {
    databaseName = "driveready-" + userId;
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);

        request.onupgradeneeded = () => {
            request.result.createObjectStore("handbooks", { keyPath: "id" });
            request.result.createObjectStore("attempts", { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function useStore(storeName, mode, action) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const request = action(transaction.objectStore(storeName));

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
    });
}

function makeStore(storeName) {
    return {
        all: () => useStore(storeName, "readonly", (store) => store.getAll()),
        get: (id) => useStore(storeName, "readonly", (store) => store.get(id)),
        save: (item) => useStore(storeName, "readwrite", (store) => store.put(item)),
        remove: (id) => useStore(storeName, "readwrite", (store) => store.delete(id))
    };
}

const handbookStore = makeStore("handbooks");
const attemptStore = makeStore("attempts");

function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
