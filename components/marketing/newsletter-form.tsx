'use client';

import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';

/** Inscription à la lettre d'information, branchée sur `POST /content/newsletter`. */
export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  if (status === 'done') {
    return (
      <p role="status" className="mt-6 flex items-center gap-2 text-[15px] font-medium text-white">
        <Check aria-hidden className="size-5 shrink-0" />
        Merci — vous serez prévenu des nouveautés et des promotions.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('pending');
        setError('');

        try {
          await apiFetch('/content/newsletter', {
            method: 'POST',
            body: JSON.stringify({ email }),
          });
          setStatus('done');
        } catch (caught) {
          setStatus('error');
          setError(caught instanceof ApiError ? caught.message : 'Erreur inattendue. Réessayez.');
        }
      }}
      className="mt-6 flex flex-col gap-3 sm:max-w-md sm:flex-row"
    >
      <label htmlFor={id} className="sr-only">
        Adresse courriel
      </label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="vous@exemple.fr"
        className="h-12 min-w-0 flex-1 rounded-control bg-white px-4 text-[15px] text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      />
      <Button type="submit" size="lg" className="shrink-0" loading={status === 'pending'}>
        S’inscrire
      </Button>
      {status === 'error' ? (
        <p role="alert" className="text-sm text-white/80 sm:basis-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
