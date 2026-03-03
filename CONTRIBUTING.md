# Contributing to Authbox TS

Thank you for your interest in contributing. This document outlines how to get started.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and configure.
4. Run migrations & seed: `pnpm db:migrate` & `pnpm db:seed`
5. Start dev server: `pnpm dev`
6. (Optional) Start workers: `pnpm worker` (in a separate terminal)

## Code Standards

- **Architecture:** Follow [ARCHITECTURE.md](ARCHITECTURE.md) (PDDA).
- **Style:** ESLint + Prettier (run `pnpm lint:fix` and `pnpm format`).
- **Types:** Ensure `pnpm type-check` passes.
- **Tests:** Add tests for new features; `pnpm test` must pass.

## Pull Request Process

1. Create a branch from `main`.
2. Make your changes. Keep commits small and focused.
3. Run `pnpm type-check`, `pnpm lint`, `pnpm test`.
4. Open a PR with a clear description of the change.
5. Address review feedback.

## Reporting Issues

- Use GitHub Issues.
- Include steps to reproduce, environment details, and relevant logs.

## Questions

Open a Discussion or an Issue with the `question` label.
