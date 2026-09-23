'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { resetPassword } from '@/lib/data/account';

/**
 * Choix d'un nouveau mot de passe depuis le lien reçu par courriel.
 *
 * La règle de complexité est annoncée **avant** la saisie, pas après le refus :
 * découvrir à la validation qu'il fallait une majuscule oblige à tout
 * recommencer avec un gestionnaire de mots de passe déjà refermé.
 */
export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      await resetPassword(token, password);
      router.push('/compte/connexion?reinitialise=1');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Erreur inattendue. Demandez un nouveau lien.',
      );
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div role="alert" className="rounded-xl bg-clay-50 p-5 text-[15px] text-ink-700">
        Ce lien est incomplet. Recommencez depuis{' '}
        <Link
          href="/compte/mot-de-passe-oublie"
          className="font-medium text-cobalt-600 underline"
        >
          la demande de réinitialisation
        </Link>
        .
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink-900">
          Nouveau mot de passe
        </label>
        <p id="regle" className="mt-1 text-sm text-ink-500">
          Dix caractères au minimum, dont une minuscule, une majuscule et un chiffre.
        </p>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          aria-describedby="regle"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl bg-white px-3.5 text-base text-ink-900 ring-1 ring-ink-200 ring-inset"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Choisir ce mot de passe
      </Button>
    </form>
  );
}
