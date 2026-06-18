# Improving the Audit Quality

The system prompt is the SYSTEM_PROMPT constant in `worker/src/index.js`.

To improve it safely:
1. Edit SYSTEM_PROMPT
2. Test locally: `wrangler dev`
3. Run a test: `curl -X POST http://localhost:8787/audit -H "Content-Type: application/json" -d '{"name":"Test Cafe","city":"Portland, OR","type":"restaurant"}'`
4. Verify the response:
   - Is valid JSON (no markdown fences in output)
   - Contains all required fields (check the schema in CLAUDE.md)
   - Advice is specific to the org type and city, not generic
5. If the output has markdown fences, add more emphasis to "Return only the JSON object" in the prompt.
6. Deploy: `wrangler deploy`
7. Update frontend WORKER_URL if this is a new deployment.
