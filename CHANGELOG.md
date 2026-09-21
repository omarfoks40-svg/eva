
# Changelog

All notable changes to the `Messenger-NexaloSIM-Bot` project will be documented in this file.


## [Unreleased]
### Added
- Initial project setup with `ws3-fca` for Facebook Messenger integration.
- Command system with over 30 commands (e.g., `sing`, `copilot`, `fbcover`, `palestine`).
- Event handling for group events (join, leave, social media downloader).
- Multi-language support with configurable language files.
- Auto-update check from GitHub repository.

## [1.1.0] - 2025-04-10
### Added
- **Web Dashboard**: Added a web dashboard to monitor the bot’s status, uptime, and console logs in real-time using Express.js and WebSocket (`ws`).
  - Accessible at `http://<your-server-ip>:28140`.
  - Displays bot status (`running` or `stopped`), uptime, and color-coded console logs.
- **Port Configuration**: Configured the web server to run on port `28140` by default, with fallback to alternative ports if `28140` is in use.
- **PM2 Integration**: Added PM2 to check the bot’s status (`pm2.describe`) for the web dashboard.
- **Command Example**: Added a `hello` command example in the `README.md` under the "Creating a New Command" section.
  - The `hello` command responds with a greeting when a user types `.hello`.

### Fixed
- **PM2 Status Error**: Fixed the `[PM2] Failed to get bot status: No process found` error by:
  - Adding a retry mechanism for `pm2.describe` with a fallback to assume the bot is running.
  - Improved logging for PM2 connection issues.
- **Port Conflict**: Added port conflict handling in `index.js` to try alternative ports if the default port (`28140`) is in use.

### Changed
- Updated `README.md` to include:
  - A new "Creating a New Command" section with a step-by-step guide to add a `hello` command.
  - Detailed instructions for accessing the web dashboard.
- Updated `package.json` to include new dependencies (`express`, `ws`, `pm2`).

## [1.0.0] - 2025-03-01
### Added
- Initial release of `Messenger-NexaloSIM-Bot`.
- Core functionality for a Facebook Messenger bot using `ws3-fca`.
- Command system with prefix support (configurable via `config.json`).
- Event handling for group join/leave events.
- Social media downloader event handler.
- Multi-language support with `en.lang` as the default language.
- Auto-update check from GitHub repository.
- Admin-only command restrictions.

### Notes
- This is the first stable release of the bot, intended for use in Facebook Messenger group chats.
- Future updates will focus on adding more commands, improving performance, and enhancing the user experience.

---

