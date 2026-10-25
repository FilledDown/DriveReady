const states = {
    AL: { name: "Alabama", questions: 30, correct: 24 },
    AK: { name: "Alaska", questions: 20, correct: 16 },
    AZ: { name: "Arizona", questions: 30, correct: 24 },
    AR: { name: "Arkansas", questions: 25, correct: 20 },
    CA: { name: "California", questions: 46, correct: 38 },
    CO: { name: "Colorado", questions: 25, correct: 20 },
    CT: { name: "Connecticut", questions: 25, correct: 20 },
    DE: { name: "Delaware", questions: 30, correct: 24 },
    DC: { name: "District of Columbia", questions: 25, correct: 20 },
    FL: { name: "Florida", questions: 50, correct: 40 },
    GA: { name: "Georgia", questions: 40, correct: 30 },
    HI: { name: "Hawaii", questions: 30, correct: 24 },
    ID: { name: "Idaho", questions: 40, correct: 34 },
    IL: { name: "Illinois", questions: 35, correct: 28 },
    IN: { name: "Indiana", questions: 50, correct: 42 },
    IA: { name: "Iowa", questions: 25, correct: 20 },
    KS: { name: "Kansas", questions: 25, correct: 20 },
    KY: { name: "Kentucky", questions: 40, correct: 32 },
    LA: { name: "Louisiana", questions: 40, correct: 32 },
    ME: { name: "Maine", questions: 30, correct: 24 },
    MD: { name: "Maryland", questions: 25, correct: 22 },
    MA: { name: "Massachusetts", questions: 25, correct: 18 },
    MI: { name: "Michigan", questions: 50, correct: 40 },
    MN: { name: "Minnesota", questions: 40, correct: 32 },
    MS: { name: "Mississippi", questions: 30, correct: 24 },
    MO: { name: "Missouri", questions: 25, correct: 20 },
    MT: { name: "Montana", questions: 33, correct: 27 },
    NE: { name: "Nebraska", questions: 25, correct: 20 },
    NV: { name: "Nevada", questions: 25, correct: 20 },
    NH: { name: "New Hampshire", questions: 40, correct: 32 },
    NJ: { name: "New Jersey", questions: 50, correct: 40 },
    NM: { name: "New Mexico", questions: 25, correct: 18 },
    NY: { name: "New York", questions: 20, correct: 14 },
    NC: { name: "North Carolina", questions: 25, correct: 20 },
    ND: { name: "North Dakota", questions: 25, correct: 20 },
    OH: { name: "Ohio", questions: 40, correct: 30 },
    OK: { name: "Oklahoma", questions: 50, correct: 40 },
    OR: { name: "Oregon", questions: 35, correct: 28 },
    PA: { name: "Pennsylvania", questions: 18, correct: 15 },
    RI: { name: "Rhode Island", questions: 25, correct: 20 },
    SC: { name: "South Carolina", questions: 30, correct: 24 },
    SD: { name: "South Dakota", questions: 25, correct: 20 },
    TN: { name: "Tennessee", questions: 30, correct: 24 },
    TX: { name: "Texas", questions: 30, correct: 21 },
    UT: { name: "Utah", questions: 50, correct: 40 },
    VT: { name: "Vermont", questions: 20, correct: 16 },
    VA: { name: "Virginia", questions: 40, correct: 34 },
    WA: { name: "Washington", questions: 40, correct: 32 },
    WV: { name: "West Virginia", questions: 25, correct: 19 },
    WI: { name: "Wisconsin", questions: 50, correct: 40 },
    WY: { name: "Wyoming", questions: 25, correct: 20 }
};


function getState(code) {
    const state = states[code];

    if (!state) {
        return null;
    }

    return {
        code: code,
        name: state.name,
        questions: state.questions,
        correct: state.correct,
        passMark: Math.round((state.correct / state.questions) * 100),
        searchLink: "https://www.google.com/search?q=" + encodeURIComponent(state.name + " permit test drivers handbook")
    };
}
