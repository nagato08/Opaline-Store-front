@AGENTS.md

# Comptoir — boutique

Vitrine et tunnel d'achat d'un site e-commerce **mono-boutique** appartenant à
un client unique.

**Comptoir** est le nom du logiciel, pas celui de la boutique. L'enseigne du
client vient de l'API (`store.name`) : ne jamais l'écrire en dur dans une page. Ce n'est pas une place de marché : il n'y a qu'un catalogue,
qu'une configuration, qu'un propriétaire. Aucune notion de vendeur, de tenant
ou de boutique multiple ne doit apparaître dans le code.

## Les trois dépôts

| Dossier | Rôle | État |
|---|---|---|
| `../back_ecommerce` | API NestJS + Prisma + PostgreSQL | ~180 routes, opérationnel |
| `front-ecommerce` (ici) | Boutique client | scaffold Next.js |
| `../admin_ecommerce` | Back-office | système de design + tableau de bord |

**Le système de design vit dans `../admin_ecommerce/CLAUDE.md` et
`../admin_ecommerce/app/globals.css`.** Ce sont les sources de référence :
lire ces deux fichiers avant d'écrire la moindre ligne d'interface, et
recopier les jetons plutôt que d'en inventer.

Le backend est la référence : toute règle métier (prix, TVA, remises, stock,
disponibilité des modes de livraison) y est calculée. **Le front n'en
recalcule aucune** — il affiche ce que l'API renvoie. Dupliquer un calcul de
prix ou de taxe côté navigateur, c'est garantir un écart avec la facture.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4.

Consulter `node_modules/next/dist/docs/` avant d'écrire du code Next : cette
version comporte des ruptures d'API par rapport aux versions antérieures.

## Marchés

**France et Canada** au lancement, boutique **bilingue FR/EN** avec choix
laissé au visiteur, en **euros et dollars canadiens**.

Conséquence majeure sur l'affichage des prix : **la France impose le TTC, le
Canada affiche hors taxe et ajoute les taxes au paiement.** L'API renvoie
`pricesIncludeTax` dans le panier — c'est lui qui décide s'il faut afficher
« TTC » ou « taxes en sus », jamais une constante côté front.

Au Québec, la facture doit montrer **TPS et TVQ sur deux lignes distinctes** :
afficher un total de taxes agrégé ne suffit pas. Le tableau `taxLines` du
panier porte le détail, à rendre tel quel.

Les aliments de base sont **détaxés au Canada** alors qu'ils bénéficient d'un
taux réduit en France : ne jamais coder un taux en dur.

## Le produit vendu

Meubles, électronique et **produits alimentaires**. Cette diversité a des
conséquences directes sur l'interface :

- **Vente au poids** : les quantités sont décimales (`0.5` kg). Ne jamais
  supposer un entier ni afficher un sélecteur `1, 2, 3` universel. L'API
  renvoie `stepQuantity` et `minQuantity` par variante.
- **Mentions obligatoires** sur l'alimentaire : allergènes, ingrédients,
  valeurs nutritionnelles et prix à l'unité de mesure doivent être visibles
  **avant** l'achat (règlement INCO). Le champ `foodDetail` de la fiche
  produit les porte.
- **Éco-participation** (`ecoTaxCents`) à afficher séparément sur
  l'électronique et le mobilier, c'est une obligation légale française.
- **Livraison sur créneau** pour les articles hors gabarit : le mode de
  livraison renvoie `requiresSlot`.

## Design — le contrat

La boutique et le back-office sont **le même produit** : mêmes jetons, mêmes
polices, mêmes règles d'accessibilité. Ce qui change, c'est la densité.

### Jetons (à recopier depuis `../admin_ecommerce/app/globals.css`)

```
Marque      cobalt-500 = #2b4eff        actions, liens, sélection
Neutres     ink-50…900                  chauds, jamais gris-bleu
Statuts     success #0b7a44 / #e6f6ed   warning #b45309 / #fdf3e3
            danger  #c02a30 / #fdeceb   info    #0369a1 / #e6f3fb
Surfaces    canvas #fbfbf8 · surface #ffffff
Rayons      carte 12px · contrôle 8px
```

**Aucune couleur en dur dans un composant.** Les couleurs de statut gardent
leur sens strict : un badge « Expédiée » doit être identique des deux côtés.

### Typographie

Bricolage Grotesque (titres) · Public Sans (interface) · IBM Plex Mono
(chiffres, SKU, numéros de commande). **Interdits : Inter, Roboto, Arial,
polices système.**

### Ce qui diffère du back-office

| | Back-office | Boutique |
|---|---|---|
| Densité | maximale, tableaux | aérée, respiration |
| Image | vignette | sujet principal |
| Corps de texte | 14 px | **16 px minimum** (sous 16 px, iOS zoome au focus) |
| Couleur | fonctionnelle uniquement | peut porter l'ambiance |
| Rythme | vertical serré | sections amples |

La boutique vend du meuble, de l'électronique et de l'alimentaire : **la
photo porte la vente**. Une fiche produit est d'abord une image, un prix, un
bouton — le reste vient ensuite.

### Règles non négociables

- Contraste 4,5:1 minimum. Toute nouvelle couleur passe le test avant d'entrer.
- Bouton-icône ⇒ `aria-label` ; icône décorative ⇒ `aria-hidden`.
- Anneau de focus visible partout, jamais `outline-none` sans remplacement.
- Zoom mobile toujours autorisé.
- Icônes **lucide-react** uniquement, jamais d'emoji comme icône.
- Mouvement 150–300 ms, `transform` et `opacity` seulement, jamais
  `transition-all`. `prefers-reduced-motion` respecté.
- Points de suspension `…`, apostrophes courbes `’`.
- Vérifier à **390 px et 1440 px** avant de considérer un écran terminé.

### Deux pièges déjà rencontrés

1. `var(--…)` **n'est pas résolu** dans un attribut de présentation SVG : une
   courbe s'affiche dans le DOM mais reste invisible. Passer des valeurs
   littérales aux bibliothèques de graphiques.
2. Un conteneur de graphique responsive doit porter `min-w-0` et
   `overflow-hidden`, sinon il déborde sur petit écran.

### Vérifier avant de livrer

Un écran n'est pas terminé tant qu'il n'a pas été **regardé** en rendu réel —
le HTML peut être valide et la page vide.

```bash
npx tsc --noEmit && npm run build && npx next start -p 3001
google-chrome --headless --disable-gpu --no-sandbox \
  --screenshot=/tmp/v.png --window-size=1440,1100 \
  --virtual-time-budget=10000 http://localhost:3001/
```

## Contrat d'API

Base : `http://localhost:3000/api` (variable `NEXT_PUBLIC_API_URL`).

### Contexte boutique

Toutes les routes publiques acceptent trois paramètres de requête, à
transmettre systématiquement :

```
?locale=FR&currency=EUR&country=FR
```

`locale` vaut `FR` ou `EN`, `country` détermine le **taux de TVA affiché**.
À défaut, l'API retombe sur les préférences du compte connecté, puis sur
`Accept-Language`, puis sur FR/EUR/FR.

La validation est stricte : **tout paramètre non prévu provoque une 400**.
Ne pas inventer de paramètre de requête sans l'ajouter au DTO côté backend.

### Pagination

Uniforme sur toutes les listes :

```ts
{ items: T[], meta: { page, perPage, total, totalPages } }
```

Entrée : `?page=1&perPage=24` — `perPage` est plafonné à 100.

### Montants

**Toujours des entiers en centimes** (`priceCents`, `totalCents`), jamais de
nombre à virgule flottante. Le formatage se fait à l'affichage avec
`Intl.NumberFormat` et le code devise renvoyé par l'API.

### Authentification

Cookies `httpOnly` posés par le serveur : `access_token` (15 min) et
`refresh_token` (30 j, limité au chemin `/api/auth`). **Le front ne manipule
jamais les jetons.** Toutes les requêtes doivent partir avec
`credentials: 'include'`.

Sur une 401, appeler `POST /auth/refresh` puis rejouer la requête. Si le
refresh échoue, la session est morte : rediriger vers la connexion.

### Panier

Identifié par un jeton opaque, transmis au choix par le cookie `cart_token`
ou l'en-tête `X-Cart-Token`. Le serveur renvoie le jeton dans l'en-tête
`X-Cart-Token` à la création. **Fonctionne sans compte.**

Après connexion, appeler `POST /cart/merge` pour absorber le panier invité
dans celui du compte.

### Images

Hébergées chez **Cloudinary**, qui redimensionne et convertit à la volée.
L'API renvoie un objet `variants` par image :

```ts
{ placeholder, thumbnail, card, zoom }  // 24 / 160 / 600 / 1600 px
```

Utiliser `card` en grille, `zoom` en fiche produit, `placeholder` (flouté)
comme image de chargement. **Ne jamais servir `url`**, qui est l'original non
redimensionné : mesuré sur une photo de 105 Ko, la vignette `card` pèse 2,7 Ko
en WebP, soit 39 fois moins. Les listes exposent déjà `imageUrl` en taille
`card`.

Le format est négocié automatiquement (WebP ou AVIF selon le navigateur) :
ne pas forcer d'extension dans les URL.

## Routes principales

### Catalogue et recherche
```
GET  /search?q=&categoryIds=&brandIds=&minPriceCents=&maxPriceCents=&inStockOnly=&minRating=
GET  /search/suggest?q=            autocomplétion
GET  /catalog/products             listing
GET  /catalog/products/:slug       fiche
GET  /catalog/categories           arbre
GET  /catalog/categories/:slug
GET  /catalog/collections
GET  /catalog/brands
```

`/search` renvoie en plus `facets` (catégories, marques, attributs, plage de
prix, disponibilité) et `correctedTerm` — le « vouliez-vous dire » à afficher
quand la recherche a été rattrapée par la tolérance aux fautes.

### Panier et commande
```
GET    /cart
POST   /cart/items                 { variantId, quantity }
PATCH  /cart/items/:itemId         { quantity }
DELETE /cart/items/:itemId
PATCH  /cart/contact               email + adresses
GET    /cart/shipping-options      modes disponibles pour l'adresse saisie
PATCH  /cart/shipping-method       { methodId, slotId? }
POST   /cart/coupons               { code }
DELETE /cart/coupons/:code
POST   /cart/merge                 après connexion
GET    /checkout/payment-methods
POST   /checkout/orders            création de commande
```

Le panier renvoie systématiquement le détail complet : `lines` avec remise et
TVA par ligne, `discounts` appliquées, `taxLines` ventilées, `rejectedCoupons`
avec le motif, et les drapeaux `hasStockIssue` / `priceChanged` à signaler au
client **avant** qu'il paie.

`POST /checkout/orders` doit porter un en-tête **`Idempotency-Key`** (UUID
généré côté front, stable pour une tentative donnée). Sans lui, un double-clic
crée deux commandes.

### Achat sans compte

Le tunnel fonctionne sans inscription — c'est un choix assumé, l'obligation de
créer un compte est la première cause d'abandon au paiement.

La réponse du checkout contient `guestAccessToken`. Le conserver :

- suivi de commande : `GET /orders/track?token=…`
- ou `POST /orders/track` avec `{ number, email }`
- rattachement après inscription : `POST /orders/claim` avec `{ token }`

Proposer la création de compte **sur la page de confirmation**, jamais avant
le paiement.

### Fidélité

1 point par euro dépensé, 1 point = 1 centime, soit 1 % de remise différée.
Conversion à partir de 500 points, plafonnée à 30 % du panier.

⚠️ Les points s'accumulent mais **ne sont pas encore dépensables** : l'usage au
paiement n'est pas branché côté API. Afficher le solde, pas de bouton
« utiliser mes points ».

### Compte client
```
GET/PATCH /auth/me
POST      /auth/register | /auth/login | /auth/logout | /auth/refresh
GET       /auth/google                 connexion Google
POST      /auth/forgot-password | /auth/reset-password
GET/POST/PATCH/DELETE /account/addresses
GET       /orders | /orders/:number
POST      /orders/:id/cancel
GET/POST  /returns                     demandes de retour
GET       /wishlist | /loyalty
POST      /account/consents            bandeau cookies (accepte l'anonyme)
POST      /account/data-requests       export / suppression RGPD
```

### Contenu et marketing
```
GET  /content/campaigns?path=&device=&cartTotalCents=
POST /content/campaigns/:id/track      { type: IMPRESSION | CLICK | DISMISS }
GET  /content/banners/:slot
GET  /content/menus/:code
GET  /content/pages/:slug | /content/posts | /content/posts/:slug
GET  /content/redirects?path=          à consulter avant un 404
GET  /content/sitemap
POST /content/newsletter
```

**Les campagnes sont le mécanisme des popups, bandeaux et messages
programmés.** Le serveur décide *si* une campagne est éligible ; le front
décide *quand* l'afficher, en appliquant `displayRules` :

```ts
{ trigger: 'DELAY' | 'SCROLL' | 'EXIT_INTENT' | 'IMMEDIATE',
  delayMs, scrollPercent, dismissible, maxPerVisitor, cooldownHours }
```

Envoyer un identifiant de visiteur anonyme et stable dans l'en-tête
`X-Visitor-Id` : c'est lui qui plafonne les répétitions. Remonter les
impressions et fermetures via `/track`, sinon le plafonnement ne fonctionne
pas et les statistiques restent vides.

## Conventions

- **Français** pour tous les textes visibles, les commentaires et les noms de
  routes. Le code (variables, composants) reste en anglais.
- Le site est bilingue FR/EN : aucune chaîne en dur dans les composants, tout
  passe par les traductions renvoyées par l'API ou par le dictionnaire local.
- Server Components par défaut ; `'use client'` seulement quand il y a état ou
  interaction.
- Les prix, la TVA et les remises viennent de l'API. Aucune arithmétique
  monétaire côté client hors formatage.
- Accessibilité : attribut `alt` toujours renseigné depuis `media.alt`,
  navigation au clavier sur les filtres et le tunnel.

## Démarrer

```bash
# backend, depuis ../back_ecommerce
npm run db:up && npm run start:dev     # http://localhost:3000

# front, ici
npm run dev                            # http://localhost:3001
```

Documentation interactive de l'API : `http://localhost:3000/api/docs`.

Compte d'administration de développement : `admin@example.com` / `Admin123!`.

## Points ouverts côté backend

À connaître pour ne pas construire d'écran sur du vide :

- **Aucun prestataire de paiement branché** — le client n'a pas encore de
  société, donc pas de compte Stripe. Seul le mode `MANUAL` (virement,
  paiement à la livraison) existe. Le tunnel doit rester agnostique.
- **Pas de facture PDF** : le numéro de facture existe, le fichier non.
- **Cartes cadeaux et parrainage** modélisés mais non implémentés — mis de
  côté par le client.
- **Photos d'avis clients** : le champ existe mais aucune route de
  téléversement client n'est ouverte. Ne pas construire l'écran.
- **Aucun transporteur canadien pour le hors gabarit** : un meuble ne peut pas
  être livré au Canada, aucun mode de livraison ne remonte. Prévoir un message
  explicite plutôt qu'une liste vide.
- **Créneaux de livraison** : la capacité n'est pas décrémentée côté API, une
  sur-réservation est possible.
