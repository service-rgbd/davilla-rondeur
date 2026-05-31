/**
 * Pays autorisés pour la collecte d'adresse sur Stripe Checkout (codes ISO 3166-1 alpha-2).
 * @see https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-shipping_address_collection-allowed_countries
 */
const EUROPE = [
  "AD", // Andorre
  "AL", // Albanie
  "AT", // Autriche
  "AX", // Åland
  "BA", // Bosnie-Herzégovine
  "BE", // Belgique
  "BG", // Bulgarie
  "BY", // Biélorussie
  "CH", // Suisse
  "CY", // Chypre
  "CZ", // Tchéquie
  "DE", // Allemagne
  "DK", // Danemark
  "EE", // Estonie
  "ES", // Espagne
  "FI", // Finlande
  "FO", // Îles Féroé
  "FR", // France
  "GB", // Royaume-Uni
  "GG", // Guernesey
  "GI", // Gibraltar
  "GR", // Grèce
  "HR", // Croatie
  "HU", // Hongrie
  "IE", // Irlande
  "IM", // Île de Man
  "IS", // Islande
  "IT", // Italie
  "JE", // Jersey
  "LI", // Liechtenstein
  "LT", // Lituanie
  "LU", // Luxembourg
  "LV", // Lettonie
  "MC", // Monaco
  "MD", // Moldavie
  "ME", // Monténégro
  "MK", // Macédoine du Nord
  "MT", // Malte
  "NL", // Pays-Bas
  "NO", // Norvège
  "PL", // Pologne
  "PT", // Portugal
  "RO", // Roumanie
  "RS", // Serbie
  "SE", // Suède
  "SI", // Slovénie
  "SK", // Slovaquie
  "SM", // Saint-Marin
  "UA", // Ukraine
  "VA", // Vatican
  "XK", // Kosovo
] as const;

/** Départements et collectivités d'outre-mer (codes ISO distincts). */
const FRENCH_OVERSEAS = [
  "BL", // Saint-Barthélemy
  "GF", // Guyane
  "GP", // Guadeloupe
  "MF", // Saint-Martin
  "MQ", // Martinique
  "NC", // Nouvelle-Calédonie
  "PF", // Polynésie française
  "PM", // Saint-Pierre-et-Miquelon
  "RE", // La Réunion
  "TF", // Terres australes françaises
  "WF", // Wallis-et-Futuna
  "YT", // Mayotte
] as const;

const AFRICA = [
  "DZ", // Algérie
  "AO", // Angola
  "BJ", // Bénin
  "BW", // Botswana
  "BF", // Burkina Faso
  "BI", // Burundi
  "CV", // Cap-Vert
  "CM", // Cameroun
  "CF", // République centrafricaine
  "TD", // Tchad
  "KM", // Comores
  "CG", // Congo
  "CD", // RD Congo
  "CI", // Côte d'Ivoire
  "DJ", // Djibouti
  "EG", // Égypte
  "GQ", // Guinée équatoriale
  "ER", // Érythrée
  "SZ", // Eswatini
  "ET", // Éthiopie
  "GA", // Gabon
  "GM", // Gambie
  "GH", // Ghana
  "GN", // Guinée
  "GW", // Guinée-Bissau
  "KE", // Kenya
  "LS", // Lesotho
  "LR", // Liberia
  "LY", // Libye
  "MG", // Madagascar
  "MW", // Malawi
  "ML", // Mali
  "MR", // Mauritanie
  "MU", // Maurice
  "MA", // Maroc
  "MZ", // Mozambique
  "NA", // Namibie
  "NE", // Niger
  "NG", // Nigeria
  "RW", // Rwanda
  "ST", // São Tomé-et-Príncipe
  "SN", // Sénégal
  "SC", // Seychelles
  "SL", // Sierra Leone
  "SO", // Somalie
  "ZA", // Afrique du Sud
  "SS", // Soudan du Sud
  "SD", // Soudan
  "TZ", // Tanzanie
  "TG", // Togo
  "TN", // Tunisie
  "UG", // Ouganda
  "ZM", // Zambie
  "ZW", // Zimbabwe
] as const;

export const CHECKOUT_SHIPPING_COUNTRIES: string[] = [
  ...new Set([...EUROPE, ...FRENCH_OVERSEAS, ...AFRICA]),
];
