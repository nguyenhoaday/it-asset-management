// Runtime environment config injection point
// In Docker, docker-entrypoint.sh overwrites this file with container environment variables.
window.__ENV__ = window.__ENV__ || {};
