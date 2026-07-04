# Security Policy

---

## Supported Versions

Security fixes are applied to actively maintained versions only.

| Version | Supported |
|---|---|
| 1.x | ✅ |
| 0.x | ❌ |

---

## Reporting a Vulnerability

If you discover a security vulnerability in Gabida, please **do not open a public issue**.

Report it privately using [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature, available under the **Security** tab of this repository.

When submitting a report, please include:

- **Description** — a clear summary of the vulnerability and its nature
- **Steps to reproduce** — the minimum sequence of operations required to trigger the issue
- **Impact** — what an attacker could achieve by exploiting it
- **Platform** — OS, Node.js version, Gabida version, and provider if relevant

The more precise the report, the faster it can be assessed.

---

## Response Process

Upon receiving a report:

1. **Acknowledgement** — we will confirm receipt of the report as promptly as possible
2. **Assessment** — we will investigate the report and determine its validity and severity
3. **Resolution** — if confirmed, we will develop and test a fix
4. **Disclosure** — we will coordinate the release of the fix and a public advisory with the reporter

We ask that you allow reasonable time for each step before disclosing the vulnerability publicly.

---

## Scope

This policy covers vulnerabilities in the Gabida engine itself:

- **Engine modules** — cognitive pipeline, memory, decision engine, prompt builder
- **SDK surface** — public API, session lifecycle
- **Storage system** — save format, adapter interface, migration logic
- **Provider integrations** — official adapter implementations bundled with Gabida

This policy does **not** cover:

- Applications built on top of Gabida
- Third-party storage adapters or provider integrations not maintained in this repository
- Infrastructure or deployment environments managed by users of Gabida

---

## Responsible Disclosure

We are grateful to security researchers and contributors who take the time to identify and responsibly disclose vulnerabilities.

Responsible disclosure helps keep Gabida and its users safe. We are committed to treating all reports with seriousness and respect, and to keeping reporters informed throughout the resolution process.
