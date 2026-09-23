# Security Policy — JeevanCare

## Supported Versions

| Version | Supported |
| :--- | :--- |
| 1.0.x | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a security vulnerability in JeevanCare, please report it responsibly:

1. **Do not** disclose the vulnerability publicly in issue trackers or forums.
2. Provide a detailed summary, including:
   - Affected component or API route
   - Steps to reproduce
   - Potential security impact
3. The development team will investigate, remediate, and publish an updated patch release promptly.

---

## Security Practices

- **Zero Client Secret Exposure**: Server API keys are restricted to backend environment variables.
- **Data Scoping**: Client storage and database queries are partitioned by authenticated user IDs.
- **Signed Storage Access**: Medical documents are served via expiring signed URLs.
