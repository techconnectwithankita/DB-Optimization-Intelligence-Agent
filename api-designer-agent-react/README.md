# API Designer Agent

React + Python implementation of an API Designer Agent.

## Run

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies into the workspace package folder:

```bash
"C:\Users\AnkitaSingh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m pip install --target backend/.packages -r backend/requirements.txt
```

Optional AI configuration:

```bash
copy backend\.env.example backend\.env
```

Set `OPENAI_API_KEY` in `backend\.env` to use the model-backed agent. Without a key, the backend serves a deterministic local fallback so the app still works end to end.

Start backend:

```bash
npm run backend
```

Start frontend in another terminal:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Backend health:

```text
http://127.0.0.1:8010/health
```

## Deploy To Render

Use a Render **Web Service**. The FastAPI backend serves the built React app, so you do not need a separate Static Site.

Recommended settings:

```text
Root Directory: api-designer-agent-react
Runtime: Python 3
Build Command: pip install -r backend/requirements.txt && npm install && npm run build
Start Command: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

Environment variables:

```text
OPENAI_MODEL=gpt-5.4-mini
MOCK_AGENT=true
```

For model-backed generation, add this secret and set `MOCK_AGENT=false`:

```text
OPENAI_API_KEY=your_key_here
```

The included `render.yaml` can also be used for Blueprint deploys. Render web services must bind to `0.0.0.0` and `$PORT`; the start command above follows Render's FastAPI guidance.
