# Troubleshooting Guide — JeevanCare v1.0.0

This guide provides diagnostic steps for resolving common operational issues.

---

## 1. Authentication & Session Issues

### Problem: Unable to sign in or session expires immediately.
- **Possible Cause**: Supabase Auth URL/Anon key misconfiguration or expired JWT token.
- **User Action**: Clear browser cache, reload the application, and verify credentials.
- **Developer Diagnostic**: Check browser console for `401 Unauthorized` or network failures from `VITE_SUPABASE_URL`.

---

## 2. Prescription Scanner & OCR Issues

### Problem: OCR fails to read a prescription or returns low confidence.
- **Possible Cause**: Blurry photo, improper lighting, or unsupported file format.
- **User Action**: Ensure the prescription is flat, well-lit, and in focus. Crop unnecessary backgrounds.
- **Developer Diagnostic**: Verify that the uploaded image MIME type is supported (`image/jpeg`, `image/png`, `application/pdf`) and verify Gemini API key availability.

---

## 3. Medical Vault Upload Failures

### Problem: Document upload fails or preview does not render.
- **Possible Cause**: File size exceeds storage limits or Supabase storage bucket permissions.
- **User Action**: Verify file is under 15MB and is a valid image or PDF document.
- **Developer Diagnostic**: Inspect network request to Supabase Storage and verify bucket `medical-documents` exists.

---

## 4. Voice Assistant / Audio Issues

### Problem: Voice assistant button does not speak or microphone does not record.
- **Possible Cause**: Browser microphone permissions denied or SpeechSynthesis API unsupported.
- **User Action**: Allow microphone permissions in browser settings.
- **Developer Diagnostic**: Check for `SpeechRecognition` browser support in user agent.
