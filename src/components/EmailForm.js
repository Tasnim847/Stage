import React, { useState } from 'react';
import axios from 'axios';

function EmailForm() {
  const [form, setForm] = useState({ email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/email/send', {
        to: form.email,
        subject: form.subject,
        text: form.message,
        html: `<p>${form.message}</p>`
      });
      setResult({ success: true });
    } catch (error) {
      setResult({ error: "Erreur lors de l'envoi" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Destinataire"
        value={form.email}
        onChange={(e) => setForm({...form, email: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Sujet"
        value={form.subject}
        onChange={(e) => setForm({...form, subject: e.target.value})}
        required
      />
      <textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => setForm({...form, message: e.target.value})}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Envoyer'}
      </button>
      {result?.success && <p>✅ Email envoyé !</p>}
      {result?.error && <p>❌ {result.error}</p>}
    </form>
  );
}