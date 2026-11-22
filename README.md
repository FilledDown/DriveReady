# DriveReady

DriveReady is a browser-based study app for people preparing for a U.S. learner's permit test. Users can take a general road-rules quiz or upload a state driver's handbook PDF and generate a practice test based on its contents.

## Features

- Sign up and log in with Supabase.
- Find state-specific permit-test question counts and passing marks.
- Upload and keep handbook PDFs in the browser, then generate multiple-choice questions and explanations with Google Gemini.
- Take and retake quizzes, review answers, and see handbook page references when available.
- Track quiz scores, pass rate, and recent attempts on a personal dashboard.

Handbooks, generated tests, and quiz attempts are stored in the signed-in user's browser using IndexedDB. Handbook PDFs are temporarily uploaded to Supabase Storage for test generation. An internet connection is required for authentication and AI-generated tests.

## Tech

- HTML, CSS, and browser JavaScript
- Supabase Auth and Storage
- Vercel serverless function (`api/generate-test.js`)
- Google Gemini API (`@google/genai`)

## Run locally

### Requirements

- Node.js and npm
- A Google Gemini API key
- Access to a Supabase project configured for the app
- Vercel CLI (run through `npx` below)

1. Install the project dependencies:

   ```sh
   npm install
   ```

2. Create a `.env.local` file in the project root and add your Gemini API key:

   ```text
   GEMINI_API_KEY=your_gemini_api_key
   ```

   Keep this key private. `.env.local` is ignored by Git and the key is used only by the server-side API function.

3. Start the app with Vercel's local development server:

   ```sh
   npx vercel dev
   ```

   On first run, Vercel may ask you to sign in and link or create a Vercel project. Open the local URL it prints (typically `http://localhost:3000`).

Do not open the HTML files directly from disk: the app needs a local web server for its `/api/generate-test` endpoint.

## Supabase setup

The Supabase project URL and public anon key are currently configured in `supabaseClient.js` and `ai.js`. To use a different Supabase project, update both files. Enable the authentication method you intend to use (the app currently uses email and password), and create a private Storage bucket named `handbooks`.

Configure Storage policies to allow authenticated users to upload and download only objects in their own user-ID folder. The app stores uploaded files under `<user-id>/<generated-file-name>.pdf` and the API checks that the requested file belongs to the authenticated user. Never put a Supabase service-role key in browser code.

## Deploy

The project is configured for Vercel. Deploy it as a Vercel project and set `GEMINI_API_KEY` in the project's environment variables. The Supabase project must also be configured as described above. The `api/generate-test.js` function has a 300-second maximum duration configured in `vercel.json`.

or just visit the site on `https://driveready-lac.vercel.app/`

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page |
| `signup.html`, `login.html` | Authentication pages |
| `dashboard.html` | Account dashboard and quiz history |
| `permitest.html` | State selection |
| `handbook.html` | State handbook upload and generated-test list |
| `quiz.html` | General and handbook-based quizzes |
| `api/generate-test.js` | Authenticated server-side Gemini test generation |
| `states.js`, `storage.js`, `account.js` | State data, IndexedDB helpers, and account handling |
| `*.css` | Page styles |
