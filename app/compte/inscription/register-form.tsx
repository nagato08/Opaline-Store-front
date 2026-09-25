"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      /* Le panier constitué avant l'inscription suit le nouveau compte : c'est
         souvent au moment de payer qu'on crée le sien. */
      await apiFetch("/cart/merge", { method: "POST" }).catch(() => {});

      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Erreur inattendue. Réessayez.",
      );
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleButton label="S’inscrire avec Google" next="/compte" />
      <AuthDivider />

      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-ink-900"
            >
              Prénom
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-ink-900"
            >
              Nom
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
            />
          </div>
        </div>

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
          <label
            htmlFor="password"
            className="text-sm font-medium text-ink-900"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={10}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
          <p className="mt-1.5 text-sm text-ink-500">
            10 caractères minimum, avec une minuscule, une majuscule et un
            chiffre.
          </p>
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
          Créer mon compte
        </Button>
      </form>
    </div>
  );
}
