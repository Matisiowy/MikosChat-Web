# Security Policy

## Supported versions

MikosChat is currently in early development.
Security fixes target the latest development version.

## Reporting vulnerabilities

Please report vulnerabilities privately using GitHub
Private Vulnerability Reporting, when enabled.

Do not disclose exploitable vulnerabilities,
credentials or private user data in public issues.

Include reproduction steps, affected versions
and potential impact.

## Security considerations

- Use unique authentication secrets.
- Use HTTPS for public deployments.
- Keep dependencies updated.
- Never expose PostgreSQL or Redis publicly.
- Never commit production credentials.
- Maintain regular backups.
- Messages are not end-to-end encrypted.
- Some dependency security advisories remain unresolved.
