# QVAC Personal Mission Statement Writer

Enter your core values and what you want to be known for, and an on-device AI writes a short personal mission statement grounded in those specifics. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:32013

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

A grounding check verifies the generated statement actually references a word from the values or "known for" text before showing it, falling back to a simple templated statement otherwise.

## Example

Input: `{"values":"honesty, curiosity, resilience","knownFor":"helping others grow"}`

Output (from a real run):
```json
{"statement":"I strive to be honest, stay curious, and navigate life's challenges with the same resilience I've faced. I aim to be known as a trusted guide and growth mentor, willing to listen, learn, and walk alongside others in their journeys."}
```

## License

MIT
