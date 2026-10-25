import { GoogleGenAI, ApiError, createPartFromUri } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pnsxdjklaqppdsznoxun.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc3hkamtsYXFwcGRzem5veHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTk4MTksImV4cCI6MjEwODQzNTgxOX0.Oyfb0SRYWf7WBLPMhl-RfzK_FDjWr-SMn8TBC8LE330";

const AI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash"];
const BUSY_RETRY_DELAYS = [2000, 5000];
const MAX_QUESTIONS = 60;

const TEST_SCHEMA = {
    type: "object",
    properties: {
        questions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    choices: { type: "array", items: { type: "string" } },
                    answer_index: { type: "integer" },
                    explanation: { type: "string" },
                    page: { type: "integer" }
                },
                required: ["question", "choices", "answer_index", "explanation", "page"],
                additionalProperties: false
            }
        }
    },
    required: ["questions"],
    additionalProperties: false
};

function fail(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function isValidQuestion(question) {
    return question.question &&
        Array.isArray(question.choices) &&
        question.choices.length >= 2 &&
        Number.isInteger(question.answer_index) &&
        question.answer_index >= 0 &&
        question.answer_index < question.choices.length;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST to make a test." });
    }

    try {
        const user = await getUser(req);
        const { path, stateName, questionCount, title, fileName } = req.body || {};

        if (typeof path !== "string" || !path.startsWith(`${user.id}/`)) {
            throw fail(400, "That handbook upload wasn't found. Try again.");
        }

        const { data: pdf, error } = await user.supabase.storage.from("handbooks").download(path);
        if (error) {
            throw fail(400, "The server couldn't read the uploaded handbook. Try again.");
        }

        const test = await generateTest(pdf, {
            stateName: String(stateName || "").slice(0, 60),
            title: String(title || "").slice(0, 200),
            fileName: String(fileName || "handbook.pdf").slice(0, 200),
            questionCount: Math.min(Math.max(parseInt(questionCount) || 25, 1), MAX_QUESTIONS)
        });

        return res.status(200).json(test);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({ error: "Something went wrong making the test. Try again." });
    }
}

async function getUser(req) {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    if (!token) {
        throw fail(401, "Please log in again to make a test.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false }
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        throw fail(401, "Please log in again to make a test.");
    }

    return { id: data.user.id, supabase };
}

async function generateTest(pdf, handbook) {
    if (!process.env.GEMINI_API_KEY) {
        throw fail(500, "The AI key hasn't been set up on the server yet.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let uploaded;
    let response;
    let model;
    try {
        uploaded = await ai.files.upload({
            file: pdf,
            config: { mimeType: "application/pdf", displayName: handbook.fileName }
        });

        while (uploaded.state === "PROCESSING") {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            uploaded = await ai.files.get({ name: uploaded.name });
        }
        if (uploaded.state === "FAILED") {
            throw fail(422, "The AI couldn't read this PDF. Try a different copy of the handbook.");
        }

        const request = {
            contents: [
                createPartFromUri(uploaded.uri, uploaded.mimeType),
                `This is the ${handbook.stateName} driver handbook ("${handbook.title}"). ` +
                    `Write a ${handbook.questionCount}-question multiple-choice practice test like the official ${handbook.stateName} permit knowledge test.\n\n` +
                    "- Cover the topics the real test covers: road signs, signals and markings, right-of-way, speed limits, " +
                    "turning and lane use, parking, sharing the road, alcohol and drug laws, and this state's licensing rules.\n" +
                    "- Prefer facts that are specific to this state (exact distances, fines, BAC limits, permit restrictions) over generic driving advice.\n" +
                    "- Give each question 4 answer choices with exactly one correct answer. Wrong choices should be plausible.\n" +
                    "- answer_index is the 0-based index of the correct choice. Vary its position across questions.\n" +
                    "- explanation is one or two sentences stating the handbook rule that makes the answer correct.\n" +
                    "- page is the PDF page number where that rule appears."
            ],
            config: {
                systemInstruction: "You write practice permit tests for student drivers. Every question must be answerable from the handbook you are given.",
                responseMimeType: "application/json",
                responseJsonSchema: TEST_SCHEMA
            }
        };

        ({ response, model } = await generateWithFallback(ai, request));
    } catch (error) {
        if (error instanceof ApiError) {
            if (error.status === 429) {
                throw fail(429, "The free AI limit was reached. Wait a minute (or until tomorrow) and try again.");
            }
            if (error.status >= 500) {
                throw fail(503, "The AI is very busy right now. Wait a few minutes and press Try again.");
            }
            if (error.status === 401 || error.status === 403 || /API key/i.test(error.message)) {
                throw fail(500, "The server's AI key was rejected. Check GEMINI_API_KEY in Vercel.");
            }
            throw fail(502, `The AI service returned an error: ${error.message}`);
        }
        throw error;
    } finally {
        if (uploaded?.name) {
            ai.files.delete({ name: uploaded.name }).catch(() => {});
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
        throw fail(502, "The test was cut off before it finished. Try again.");
    }
    if (!response.text) {
        throw fail(502, "The AI declined to write a test from this file.");
    }

    const questions = JSON.parse(response.text).questions.filter(isValidQuestion);

    if (!questions.length) {
        throw fail(502, "The AI didn't return any usable questions. Try again.");
    }

    return { questions, model };
}

async function generateWithFallback(ai, request) {
    let lastError;

    for (const model of AI_MODELS) {
        for (let attempt = 0; attempt <= BUSY_RETRY_DELAYS.length; attempt++) {
            try {
                const response = await ai.models.generateContent({ ...request, model });
                return { response, model };
            } catch (error) {
                if (!(error instanceof ApiError)) throw error;
                lastError = error;

                const busy = error.status >= 500;
                if (busy && attempt < BUSY_RETRY_DELAYS.length) {
                    await new Promise((resolve) => setTimeout(resolve, BUSY_RETRY_DELAYS[attempt]));
                    continue;
                }
                if (busy || error.status === 429 || error.status === 404) break;
                throw error;
            }
        }
    }

    throw lastError;
}
