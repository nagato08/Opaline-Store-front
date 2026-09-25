'use client';

import Link from 'next/link';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, CircleAlert, Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { money } from '@/lib/format';
import { ApiError } from '@/lib/api';
import {
  SplitShippingNotice,
  type GroupSelection,
} from '@/components/order/split-shipping-notice';
import {
  getShippingOptions,
  getShippingPlan,
  setCartShipments,
  placeOrder,
  setContact,
  setShippingMethod,
  type Address,
  type Cart,
  type PaymentMethod,
  type ShippingPlan,
  type ShippingQuote,
} from '@/lib/data/cart';

type Step = 'contact' | 'shipping' | 'payment';

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'contact', label: 'Adresse' },
  { key: 'shipping', label: 'Livraison' },
  { key: 'payment', label: 'Paiement' },
];

const CA_REGIONS = [
  'QC', 'ON', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU',
];

/**
 * Tunnel de commande en trois étapes, accumulées sur une seule page.
 *
 * Chaque étape écrit réellement sur le panier serveur avant de passer à la
 * suivante (`setContact`, `setShippingMethod`) : revenir en arrière ou
 * recharger la page ne perd donc rien, l'API fait foi.
 */
export function CheckoutWizard({ initialCart, initialPaymentMethods }: { initialCart: Cart; initialPaymentMethods: PaymentMethod[] }) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [step, setStep] = useState<Step>('contact');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState(cart.email ?? '');
  const [address, setAddress] = useState<Address>(
    cart.shippingAddress ?? {
      firstName: '',
      lastName: '',
      line1: '',
      line2: '',
      postalCode: '',
      city: '',
      region: '',
      countryCode: 'FR',
      phone: '',
    },
  );

  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  /* Renseigné seulement quand aucun mode groupé n'existe : il porte alors
     l'explication et les groupes à expédier séparément. */
  const [plan, setPlan] = useState<ShippingPlan | null>(null);
  /* Mode retenu par groupe, quand le panier part en plusieurs colis. */
  const [groupSelection, setGroupSelection] = useState<GroupSelection>({});
  const [methodId, setMethodId] = useState(cart.shippingMethodId ?? '');

  const [paymentMethods] = useState(initialPaymentMethods);
  const [paymentProvider, setPaymentProvider] = useState(paymentMethods[0]?.code ?? '');
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const stepIndex = STEPS.findIndex((candidate) => candidate.key === step);

  async function submitContact(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const updated = await setContact({
        email,
        shippingAddress: address,
        billingSameAsShipping: true,
      });
      setCart(updated);

      const options = await getShippingOptions();
      setQuotes(options);
      if (options.length > 0) setMethodId((current) => current || options[0].methodId);

      /* Le plan n'est demandé que lorsqu'aucun mode ne sort : c'est le seul
         cas où il apprend quelque chose, et l'appeler systématiquement
         doublerait le calcul des totaux pour rien. */
      const found = options.length === 0 ? await getShippingPlan() : null;
      setPlan(found);

      /* Pré-sélection de l'option la moins chère par groupe : laisser trois
         listes vides obligerait à cliquer partout avant de pouvoir avancer. */
      if (found?.splitRequired) {
        setGroupSelection(
          Object.fromEntries(
            found.groups.map((group) => [
              group.constraint,
              [...group.options].sort((a, b) => a.priceCents - b.priceCents)[0]?.methodId,
            ]),
          ),
        );
      }

      setStep('shipping');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Erreur inattendue. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  /* Chaque groupe doit avoir son mode ; à défaut, le mode unique suffit. */
  const canContinueShipping = plan?.splitRequired
    ? plan.groups.every((group) => Boolean(groupSelection[group.constraint]))
    : Boolean(methodId);

  async function submitShipping(event: React.FormEvent) {
    event.preventDefault();

    const split = plan?.splitRequired ? plan.groups : null;
    if (split && split.some((group) => !groupSelection[group.constraint])) return;
    if (!split && !methodId) return;

    setPending(true);
    setError('');

    try {
      const updated = split
        ? await setCartShipments(
            split.map((group) => ({
              constraint: group.constraint,
              methodId: groupSelection[group.constraint],
            })),
          )
        : await setShippingMethod(methodId);

      setCart(updated);
      setStep('payment');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Erreur inattendue. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!acceptsTerms || !paymentProvider) return;
    setPending(true);
    setError('');

    try {
      const result = await placeOrder(idempotencyKey, {
        email,
        shippingAddress: address,
        billingSameAsShipping: true,
        /* L'un ou l'autre, jamais les deux : l'API refuse de facturer la
           livraison en double, et envoyer un mode résiduel ferait payer un
           colis fantôme. */
        ...(plan?.splitRequired
          ? {
              shipments: plan.groups.map((group) => ({
                constraint: group.constraint,
                methodId: groupSelection[group.constraint],
              })),
            }
          : { shippingMethodId: methodId }),
        paymentProvider,
        acceptsTerms,
      });

      const params = new URLSearchParams();
      if (result.guestAccessToken) params.set('token', result.guestAccessToken);
      router.push(`/commande/confirmation/${result.order.number}?${params}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Erreur inattendue. Réessayez.');
      setPending(false);
    }
  }

  const selectedQuote = useMemo(() => quotes.find((quote) => quote.methodId === methodId), [quotes, methodId]);

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:items-start lg:gap-14">
      <div className="min-w-0 lg:col-span-2">
        {/* --- Indicateur d'étapes ---------------------------------------- */}
        <ol className="flex items-center gap-2" aria-label="Étapes de la commande">
          {STEPS.map((item, index) => (
            <li key={item.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-150',
                  index < stepIndex
                    ? 'bg-success-soft text-success'
                    : index === stepIndex
                      ? 'bg-ink-900 text-white'
                      : 'bg-ink-100 text-ink-500',
                )}
                aria-current={index === stepIndex ? 'step' : undefined}
              >
                {index < stepIndex ? <Check aria-hidden className="size-3.5" /> : null}
                {item.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span aria-hidden className="h-px w-6 bg-ink-200" />
              ) : null}
            </li>
          ))}
        </ol>

        {/* --- Étape 1 : adresse ------------------------------------------- */}
        {step === 'contact' ? (
          <form onSubmit={submitContact} className="mt-8 space-y-5">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" value={address.firstName} autoComplete="given-name" onChange={(v) => setAddress((a) => ({ ...a, firstName: v }))} />
              <Field label="Nom" value={address.lastName} autoComplete="family-name" onChange={(v) => setAddress((a) => ({ ...a, lastName: v }))} />
            </div>

            <Field label="Adresse" value={address.line1} autoComplete="address-line1" onChange={(v) => setAddress((a) => ({ ...a, line1: v }))} />
            <Field label="Complément (étage, digicode…)" required={false} value={address.line2 ?? ''} autoComplete="address-line2" onChange={(v) => setAddress((a) => ({ ...a, line2: v }))} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code postal" value={address.postalCode} autoComplete="postal-code" onChange={(v) => setAddress((a) => ({ ...a, postalCode: v }))} />
              <Field label="Ville" value={address.city} autoComplete="address-level2" onChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className="text-sm font-medium text-ink-900">
                  Pays
                </label>
                <select
                  id="country"
                  required
                  value={address.countryCode}
                  onChange={(event) =>
                    setAddress((a) => ({ ...a, countryCode: event.target.value, region: '' }))
                  }
                  className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
                >
                  <option value="FR">France</option>
                  <option value="CA">Canada</option>
                </select>
              </div>

              {address.countryCode === 'CA' ? (
                <div>
                  <label htmlFor="region" className="text-sm font-medium text-ink-900">
                    Province
                  </label>
                  <select
                    id="region"
                    required
                    value={address.region ?? ''}
                    onChange={(event) => setAddress((a) => ({ ...a, region: event.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {CA_REGIONS.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Field label="Téléphone" required={false} value={address.phone ?? ''} autoComplete="tel" onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} />
              )}
            </div>

            {address.countryCode === 'CA' ? (
              <Field label="Téléphone" required={false} value={address.phone ?? ''} autoComplete="tel" onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} />
            ) : null}

            <ErrorNotice error={error} />

            <Button type="submit" size="lg" loading={pending} disabled={pending} className="w-full sm:w-auto sm:px-10">
              Continuer vers la livraison
            </Button>
          </form>
        ) : null}

        {/* --- Étape 2 : livraison ------------------------------------------ */}
        {step === 'shipping' ? (
          <form onSubmit={submitShipping} className="mt-8 space-y-5">
            {quotes.length === 0 && plan?.splitRequired ? (
              <SplitShippingNotice
                cart={cart}
                groups={plan.groups}
                selection={groupSelection}
                onSelect={(constraint, chosen) =>
                  setGroupSelection((current) => ({ ...current, [constraint]: chosen }))
                }
              />
            ) : quotes.length === 0 ? (
              <p className="flex items-center gap-2 rounded-card bg-warning-soft px-4 py-3 text-sm text-warning">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                Aucun mode de livraison n’est disponible pour cette adresse.
              </p>
            ) : (
              <fieldset className="space-y-2.5">
                <legend className="sr-only">Mode de livraison</legend>
                {quotes.map((quote) => (
                  <label
                    key={quote.methodId}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-4 rounded-card border p-4 transition-colors duration-150',
                      methodId === quote.methodId ? 'border-ink-900 bg-clay-50' : 'border-ink-200 hover:border-ink-400',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping-method"
                        checked={methodId === quote.methodId}
                        onChange={() => setMethodId(quote.methodId)}
                        className="size-4 accent-ink-900"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 font-medium text-ink-900">
                          <Truck aria-hidden className="size-4 text-ink-500" />
                          {quote.name}
                        </span>
                        {quote.description || quote.minDeliveryDays ? (
                          <span className="mt-0.5 block text-sm text-ink-500">
                            {quote.description}
                            {quote.minDeliveryDays ? ` · ${quote.minDeliveryDays}–${quote.maxDeliveryDays} jours` : ''}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span data-price className="font-mono font-medium text-ink-900">
                      {quote.isFree ? 'Offerte' : money(quote.priceCents, quote.currencyCode)}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            <ErrorNotice error={error} />

            <div className="flex flex-wrap items-center gap-3">
              {/* Un panier scindé n'a pas de `methodId` : sans cette
                  distinction le bouton restait désactivé pour toujours, et le
                  client ne pouvait pas avancer malgré ses choix. */}
              <Button
                type="submit"
                size="lg"
                loading={pending}
                disabled={pending || !canContinueShipping}
                className="px-10"
              >
                Continuer vers le paiement
              </Button>
              <button
                type="button"
                onClick={() => setStep('contact')}
                className="inline-flex h-12 items-center gap-1.5 px-2 text-sm font-medium text-ink-600 hover:text-ink-900"
              >
                <ChevronLeft aria-hidden className="size-4" />
                Retour à l’adresse
              </button>
            </div>
          </form>
        ) : null}

        {/* --- Étape 3 : paiement --------------------------------------------- */}
        {step === 'payment' ? (
          <form onSubmit={submitOrder} className="mt-8 space-y-5">
            {paymentMethods.length === 0 ? (
              <p className="flex items-center gap-2 rounded-card bg-warning-soft px-4 py-3 text-sm text-warning">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                Aucun moyen de paiement n’est actuellement configuré.
              </p>
            ) : (
              <fieldset className="space-y-2.5">
                <legend className="sr-only">Moyen de paiement</legend>
                {paymentMethods.map((method) => (
                  <label
                    key={method.code}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors duration-150',
                      paymentProvider === method.code ? 'border-ink-900 bg-clay-50' : 'border-ink-200 hover:border-ink-400',
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentProvider === method.code}
                      onChange={() => setPaymentProvider(method.code)}
                      className="size-4 accent-ink-900"
                    />
                    <span className="font-medium text-ink-900">{paymentLabel(method.code)}</span>
                  </label>
                ))}
              </fieldset>
            )}

            <label className="flex items-start gap-2.5 text-sm text-ink-700">
              <input
                type="checkbox"
                required
                checked={acceptsTerms}
                onChange={(event) => setAcceptsTerms(event.target.checked)}
                className="mt-0.5 size-4 accent-ink-900"
              />
              J’accepte les{' '}
              <Link
                href="/conditions-generales-de-vente"
                className="underline underline-offset-2 hover:text-ink-900"
              >
                conditions générales de vente
              </Link>
              .
            </label>

            <ErrorNotice error={error} />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                size="lg"
                loading={pending}
                disabled={pending || !acceptsTerms || !paymentProvider}
                className="px-10"
              >
                {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Confirmer la commande
              </Button>
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="inline-flex h-12 items-center gap-1.5 px-2 text-sm font-medium text-ink-600 hover:text-ink-900"
              >
                <ChevronLeft aria-hidden className="size-4" />
                Retour à la livraison
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* --- Récapitulatif ---------------------------------------------- */}
      <aside className="rounded-card bg-clay-50 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold text-ink-900">Votre commande</h2>
        <ul className="mt-4 space-y-3">
          {cart.lines.map((line) => (
            <li key={line.cartItemId} className="flex justify-between gap-3 text-sm">
              <span className="text-ink-700">
                {line.name}
                <span className="text-ink-400"> × {line.quantity}</span>
              </span>
              <span data-price className="shrink-0 font-medium text-ink-900">
                {money(line.lineTotalCents, cart.currencyCode)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-ink-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Sous-total</dt>
            <dd data-price className="font-medium text-ink-900">{money(cart.subtotalCents, cart.currencyCode)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Livraison</dt>
            <dd data-price className="font-medium text-ink-900">
              {selectedQuote ? (selectedQuote.isFree ? 'Offerte' : money(selectedQuote.priceCents, cart.currencyCode)) : money(cart.shippingCents, cart.currencyCode)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-baseline justify-between border-t border-ink-200 pt-3">
          <span className="font-medium text-ink-900">Total {cart.pricesIncludeTax ? 'TTC' : 'HT'}</span>
          <span data-price className="font-mono text-xl font-semibold text-ink-900">
            {money(cart.totalCents, cart.currencyCode)}
          </span>
        </div>
      </aside>
    </div>
  );
}

function paymentLabel(code: string): string {
  return { MANUAL: 'Virement bancaire', CASH_ON_DELIVERY: 'Paiement à la livraison', BANK_TRANSFER: 'Virement bancaire' }[code] ?? code;
}

function ErrorNotice({ error }: { error: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-card bg-danger-soft px-4 py-3 text-sm text-danger">
      <CircleAlert aria-hidden className="size-4 shrink-0" />
      {error}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink-900">
        {label}
      </label>
      <input
        id={id}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
      />
    </div>
  );
}
