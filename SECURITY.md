# Security Policy

## Supported versions

BytePet is still in early development. Security fixes are expected to target the latest `main` branch unless release branches are created later.

## Sensitive local data

BytePet is a local desktop application. User data may include:

- AI provider API keys
- local SQLite databases
- chat history
- character memory
- imported character assets
- exported logs or backups

Do not commit real local data, API keys, database files, logs, screenshots containing secrets, or generated app-data folders to the repository.

## Reporting a vulnerability

If you find a vulnerability, please open a private report or contact the maintainer directly before publishing exploit details. Include:

- affected version or commit
- reproduction steps
- expected and actual behavior
- relevant logs with secrets removed

## Development checklist

- Keep `.env`, SQLite files, AppData folders, and build artifacts ignored.
- Mask API keys in UI logs and debugging output.
- Avoid committing user-generated character resources unless they are intended sample assets.
- Review `src-tauri` commands before exposing new filesystem or network capabilities.
