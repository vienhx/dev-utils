# Proposal

## Why

Everyday text transforms (format JSON, decode Base64, then format again) are spread across many websites. Those sites can't be chained, often send the pasted data to a server, and usually include tracking. We want one fast, private, client-only tool where any number of transform steps can be chained between an input box and an output box.

## What Changes

- New static web app, **dev-utils** (Svelte 5 + Vite + TypeScript), deployed to Vercel, with no backend and no analytics.
- App shell with a collapsible sidebar that lists tools, with each tool's saved templates nested under it. On mobile the sidebar becomes a drawer. Each tool has its own URL (hash route), so reload and back/forward work.
- First tool, **Chain**: a workspace with an input text box, an ordered chain of steps, and an output text box. Output recomputes live as the input or the chain changes.
- Steps can be added, removed, reordered, enabled or disabled, and configured. Each step shows its status and can show its intermediate output ("peek").
- Values passed between steps are typed (text or bytes), so binary results display safely and future byte-oriented steps fit without redesign.
- Initial step catalog: JSON validate, JSON compact, JSON format, Base64 encode, Base64 decode.
- The current chain and input are restored after a reload.
- Templates: save the current chain under a name, and overwrite it later by saving again with the same name. Templates appear in the sidebar under Chain, where they can be renamed or deleted. Clicking one opens Chain with it loaded, and an undo is offered. Templates are stored only in the browser's local storage.
- A strict Content Security Policy makes the browser block all runtime data requests, so pasted data cannot leave the page.

## Capabilities

### New Capabilities

- `app-navigation`: the app shell and collapsible sidebar listing tools and their nested templates, the mobile drawer, hash routes per tool, and opening a template from the sidebar.
- `pipeline-workspace`: the Chain tool's input and output boxes, building and editing the step chain, live evaluation, typed values between steps, error propagation, per-step peek, session restore, and responsive layout.
- `text-converters`: the behavior of each built-in step (JSON validate, compact, format; Base64 encode, decode), including its options and error conditions.
- `pipeline-templates`: saving, overwriting, renaming, deleting, and loading (with undo) named chains in local storage, each tied to the Chain tool.
- `client-privacy`: the guarantee that the app runs entirely in the browser, sends no user data anywhere, and includes no tracking.

### Modified Capabilities

None. This is a new project.

## Impact

- New codebase: Vite + Svelte 5 + TypeScript project, unit tests with Vitest, and deploy config in `vercel.json` (CSP and security headers).
- Dependencies: Svelte, Vite, TypeScript, Vitest, and a self-hosted font package. No runtime third-party services.
- Hosting: Vercel static deployment only, with no serverless functions.
