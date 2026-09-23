# Contributing to JeevanCare

Thank you for your interest in contributing to JeevanCare.

---

## 1. Development Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in required development keys.
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 2. Code Quality & Standards

- **TypeScript**: All code must pass `npm run lint` (`tsc --noEmit`) without type errors.
- **Styling**: Use Tailwind CSS utility classes; avoid custom inline styles or separate CSS files.
- **Icons**: Use only `lucide-react`.
- **Accessibility**: Maintain WCAG AA contrast standards, keyboard focus traversal, and semantic HTML elements.
- **Security**: Never expose secret API keys to the client; all user data operations must enforce user scoping.

---

## 3. Pull Request Guidelines

1. Ensure the production build succeeds before submitting:
   ```bash
   npm run build
   ```
2. Include a summary of changes and the affected user roles (`patient`, `doctor`, `admin`).
