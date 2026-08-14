/**
 * Formatage localisé.
 *
 * L'API renvoie des montants en **centimes entiers** : la division n'a lieu
 * qu'ici, au moment de l'affichage. Manipuler des euros en flottant plus tôt
 * dans la chaîne finit toujours par produire un centime d'écart avec la
 * facture.
 */

export function money(cents: number, currency = 'EUR', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

/**
 * Prix à l'unité de mesure, obligatoire en UE sur les denrées préemballées.
 * Exemple : « 4,99 € / kg ».
 */
export function unitPrice(
  cents: number,
  quantity: number,
  unit: string,
  currency = 'EUR',
  locale = 'fr-FR',
): string {
  return `${money(Math.round(cents / quantity), currency, locale)} / ${unit}`;
}

export function number(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Remise en pourcentage, arrondie : « -25 % ». */
export function discountRate(priceCents: number, compareAtCents: number): string {
  return `-${Math.round((1 - priceCents / compareAtCents) * 100)} %`;
}
