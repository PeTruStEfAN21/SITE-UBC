# Security Policy — Union Business Company (UBC)

## Supported Versions

We issue security updates for the current active production release of the **UBC Web Application**.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

The security of Union Business Company (UBC) and our clients' data is of paramount importance to us. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### How to Report

Please **DO NOT** create a public GitHub issue for security vulnerabilities. Instead, report them directly to our technical team:

- **Email:** `ubcbeton@gmail.com`
- **Subject Line:** `[SECURITY VULNERABILITY] - <Short Description>`
- **Direct Phone (Dispatched):** `+40 720 006 655`

### What to Include in Your Report

To help us triage and resolve the issue quickly, please include:
1. **Description:** A detailed explanation of the vulnerability and its potential impact.
2. **Steps to Reproduce:** Clear, step-by-step instructions or proof of concept (PoC).
3. **Affected Components:** Specific URLs, endpoints, parameters, or codebase files affected.
4. **Suggested Fix:** (Optional) Any recommendations or patches to remediate the issue.

---

## Response & Disclosure Timeline

- **Initial Response:** Within 24-48 hours of receiving your report.
- **Triage & Assessment:** Within 3 business days.
- **Patch & Resolution:** Security fixes will be committed and deployed to Render production as quickly as possible based on severity.
- **Public Disclosure:** Once the vulnerability is patched, public disclosure may occur in agreement with the reporter.

---

## Security Practices & Protection Measures

The **UBC Web Application** incorporates industry-standard security controls:

- **HTTP Security Headers:** Protected via `helmet` (Content Security Policy, X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options).
- **CORS Management:** Strict Cross-Origin Resource Sharing rules.
- **Input Sanitization & XSS Protection:** Escaped templating via EJS.
- **Environment Isolation:** Sensitive variables managed via `.env` and Render Environment Secrets.
- **SSL/TLS Encryption:** Forced HTTPS encryption in production.

---

## Contact Information

For non-security support or general inquiries:
- **Company:** Union Business Company (UBC)
- **Email:** `ubcbeton@gmail.com`
- **Phone:** `0720 006 655`
- **Address:** Șoseaua Călărași nr. 4, Oltenița, Jud. Călărași, Romania
