"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      /* Le panier rempli avant la connexion doit suivre : sans cette fusion,
         le client retrouve le panier de son compte — souvent vide — et croit
         avoir tout perdu. Son échec ne remet pas la connexion en cause. */
      await apiFetch("/cart/merge", { method: "POST" }).catch(() => {});

      router.push(searchParams.get("suite") || "/");
      router.refresh();
    } catch (caught) {
      // Même message qu'un courriel inconnu ou un mot de passe faux : ne pas
      // laisser deviner quels comptes existent.
      setError(
        caught instanceof ApiError && caught.status === 401
          ? "Identifiants incorrects."
          : "Erreur inattendue. Réessayez.",
      );
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleButton
        label="Continuer avec Google"
        next={searchParams.get("suite")}
      />
      <AuthDivider />

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
            className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-ink-900"
            >
              Mot de passe
            </label>
            <Link
              href="/compte/mot-de-passe-oublie"
              className="text-sm text-cobalt-600 hover:underline"
            >
              Oublié ?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={pending}
          className="w-full"
        >
          Se connecter
        </Button>
      </form>
    </div>
  );
}
