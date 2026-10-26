# TodCode

Upload code files or paste a public GitHub repo link. TodCode explains what the code does in plain, simple English: every file covered, every technical term defined, no jargon left unexplained.

The explanation is written by an **open-weight model** (Qwen, served by Groq's free tier). The same server runs the same prompt against a model on your own laptop through Ollama by changing three environment variables.

## Why this is a strong open-source AI project

1. **The model is the whole product.** There are no templates or rules behind the explanation. Remove the model and the app shows nothing.
2. **Open weights, with a working local path.** Most "open source AI" demos only call a hosted API. TodCode's server talks to any OpenAI-compatible endpoint, so `LLM_BASE_URL=http://localhost:11434/v1` moves it fully offline onto Ollama. Judges can watch that switch happen.
3. **Privacy is a real reason to go open.** Source code is often private. With a local open model, a company can explain its own codebase without sending a line to a third party.
4. **No lock-in.** If a provider drops a model (Groq already retired several Llama models from its free tier), you change an environment variable, not code.
5. **Keys stay server-side.** Similar explainer projects call the model from the browser and expose the API key. Here the browser only talks to our own `/api/explain`.
6. **The app itself is MIT licensed** and small enough to read in one sitting (one server file, three frontend files).

## Cons (honest list)

- **Groq is not open source.** Only the model weights are open. The hosted path depends on a closed service; the Ollama path is the fully open one.
- **Free-tier limits.** Groq allows only a few thousand tokens per minute on the free tier, so requests are capped at roughly 9,000 characters and heavy back-to-back clicks can hit a temporary rate limit (the Retry button is for that). Large files are cut, and overviews cover at most 8 files. Big projects get a partial explanation, not a complete one.
- **A mid-sized open model is not a frontier model.** It can misread tricky code, and "simple language" sometimes costs precision. Do not use it as the only reviewer of anything important.
- **Local mode needs hardware.** A 7B model on Ollama runs on a decent laptop but is slower and less detailed than the hosted one.
- **Model availability changes.** Free model lists change often; verify the model ID before demoing (see below).
- **No streaming, accounts or history yet.** The answer appears all at once after 10 to 40 seconds.
- **Uploads are read in the browser, one file at a time.** Dropping a whole folder is not supported; select multiple files instead.
- **License:** check the license on your chosen model's card before redistributing outputs commercially. Qwen releases are generally Apache 2.0, but confirm for the exact model you use.

## Run it

Requires Node 20+.

```bash
npm install
cp .env.example .env     # then paste your Groq key into .env
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY" | grep -o '"id":"[^"]*"'
npm start                # open http://localhost:3000
```

Put an ID from that list in `GROQ_MODEL`. Never commit `.env`.

## Run it fully local (the open-source flex)

```bash
ollama pull qwen2.5-coder:7b
# add to .env:
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=qwen2.5-coder:7b
```

Restart `npm start`. The server tries this provider first.

## Deploy on DigitalOcean App Platform

1. Push this repo to GitHub.
2. App Platform: Create App, pick the repo, it detects Node.
3. Run command `npm start`. Add `GROQ_API_KEY` and `GROQ_MODEL` as encrypted environment variables.
4. Replace `YOUR-APP.ondigitalocean.app` in `public/index.html` with your real URL.

## Layout

```
server.js        Express: static files + POST /api/explain, local-model failover, input limits
public/          index.html (SEO metadata inside), styles.css, app.js (error boundaries + Retry)
.env.example     all configuration
```

Safeguards: 6 requests per minute per IP, 45 second timeout, file and size limits, GitHub-only repo links, and model output is sanitised with DOMPurify before display.

## License

MIT
