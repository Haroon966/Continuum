# Security Policy

## Supported versions

The `main` branch (0.1.x) receives fixes.

## Reporting a vulnerability

Please open a **private** security advisory on GitHub if available, or email the maintainers listed on the repository.

Do not file public issues that include:

- Local API bearer tokens
- Paths to private projects
- Agent transcripts with secrets

Continuum’s HTTP API is intended for **localhost only**. If you find a way to expose it beyond `127.0.0.1` without user intent, that is a high-priority report.
