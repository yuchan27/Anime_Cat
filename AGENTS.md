# Project Agent Instructions

## Safety Rules
- Do not bulk-delete files or folders.
- Never use `del /s`, `rd /s`, `rmdir /s`, `Remove-Item -Recurse`, or `rm -rf`.
- If deletion is required, delete only one explicit file path at a time, for example: `Remove-Item "C:\path\to\file.txt"`.
- If batch deletion is needed, stop and ask the user to delete files manually.

## Project Workflow
- New project work starts from a plan before implementation.
- Every project update must be tracked with Git.
- Do not commit API keys, `.env`, generated renders, dependency folders, or temporary QA artifacts.
- Keep the original course PPT files and the week 12 template untouched unless the user explicitly asks to modify them.
- If OneDrive causes Git lock or execution issues, move/copy the working project to a plain `C:\` path and continue there.
- Recommended next workspace: `C:\Code\CatFutureLab` or another explicit folder chosen by the user.
- When moving to `C:\`, preserve `.git`, `cat-future-lab/`, `AGENTS.md`, `WORKFLOW.md`, `README.md`, and `.gitignore`.
- Do not use bulk deletion during relocation. If cleanup is needed, ask the user to manually remove the old OneDrive copy after the new copy is verified.

## Current Final Project
- Main deliverable: `cat-future-lab/`
- Theme: futuristic interactive animation lab with cat elements as signals, guide marks, HUD details, and Remotion material; do not turn the whole site into a full cat-themed page.
- Course emphasis: Anime.js, Three.js, CSS animation, Intersection Observer, requestAnimationFrame, semantic HTML, SEO, accessibility.
- Code organization: program code must use a modular structure; keep animation, Three.js scene logic, API calls, accessibility behavior, and server routes separated by responsibility.
- API approach: browser calls local server routes; secrets stay in server environment variables.
- Remotion role: generate optional loop/video material; the main website must remain usable without rendered Remotion output.
- Figma design file: https://www.figma.com/design/KHTxo4D1lTXtSteplkjcCp

## C Drive Handoff
- Before starting in a new window, copy the whole repository directory to `C:\Code\CatFutureLab`.
- Open the new window with `cwd=C:\Code\CatFutureLab`.
- Run `git status --short` first. The expected committed project files should already be tracked.
- Run the app from `C:\Code\CatFutureLab\cat-future-lab` with `npm start`.
- Keep API keys in `cat-future-lab\.env`, based on `.env.example`; never paste real keys into source files or chat transcripts that will be committed.

## Quality Gates
- SEO: title, meta description, canonical, Open Graph, Twitter Card, JSON-LD, semantic headings.
- Accessibility: keyboard operation, visible focus, `aria-*` states, live regions, reduced-motion support, text alternative near the Three.js canvas.
- Frontend: verify desktop and mobile widths, no text overlap, no blank canvas, and no secret leakage in client code.
