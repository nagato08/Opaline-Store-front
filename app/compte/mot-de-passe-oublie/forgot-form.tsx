'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { forgotPassword } from '@/lib/data/account';

/**
 * Demande de réinitialisation.
 *
 * La confirmation est **la même** que le courriel existe ou non. Dire « aucun
 * compte avec cette adresse » transformerait le formulaire en outil de
 * vérification d'adresses, et l'API applique déjà cette règle de son côté.
 */
export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Erreur inattendue. Réessayez dans un instant.');
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-xl bg-clay-50 p-5 text-[15px] leading-relaxed text-ink-700"
      >
        Si un compte existe pour <span className="font-medium text-ink-900">{email}</span>, un
        message vient d’être envoyé avec un lien de réinitialisation. Il est valable une heure.
        <p className="mt-3 text-sm text-ink-500">
          Rien reçu ? Vérifiez les indésirables avant de recommencer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink-900">
          Courriel
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl bg-white px-3.5 text-base text-ink-900 ring-1 ring-ink-200 ring-inset placeholder:text-ink-400"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Recevoir un lien
      </Button>
    </form>
  );
}
