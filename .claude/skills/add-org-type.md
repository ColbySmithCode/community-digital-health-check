# Adding a New Organization Type

1. Add the new type to the `<select>` in `frontend/index.html`
2. In `worker/src/index.js`, add the type to the SYSTEM_PROMPT's examples section
3. Add specific guidance in the prompt: "For [new type] organizations, prioritize..."
4. Test: run an audit with the new type, verify the advice is meaningfully different from generic small business advice
5. If the advice is still generic, add more specific context to the prompt about what makes this org type different
