import { db, categoriesTable, productsTable } from "./index.js";

const categories = [
  {
    name: "Sirops Naturels",
    slug: "sirops-naturels",
    description: "Sirops 100 % naturels pour sublimer vos courbes et votre bien-être au quotidien.",
    imageUrl: "/images/Sirop-menthe.jpeg",
  },
  {
    name: "Compléments Alimentaires",
    slug: "complements-alimentaires",
    description: "Gélules et cures naturelles pour l'énergie, la vitalité et l'équilibre du corps.",
    imageUrl: "/images/Body-booster-prise-de-poids.jpeg",
  },
] as const;

const products = [
  {
    name: "Sirop au Miel",
    slug: "sirop-miel",
    description:
      "Sublimez vos courbes naturellement avec le Sirop au Miel Davila Rondeur. Cette formule 100 % naturelle de 250 ml est spécialement élaborée pour accompagner le galbe des fesses, des hanches et des cuisses. Enrichi au miel pur, il allie une saveur douce et gourmande à une routine bien-être simple à intégrer au quotidien.\n\nIssu de la gamme « La Santé au Naturel », ce sirop s'adresse aux femmes qui souhaitent prendre soin de leur silhouette avec des ingrédients d'origine naturelle, sans compromis sur la qualité. Flacon pratique de 250 ml, facile à conserver et à emporter.",
    price: "55.00",
    imageUrl: "/images/photo_2026-05-24%2017.46.23.jpeg",
    images: [
      "/images/photo_2026-05-24%2017.46.23.jpeg",
      "/images/Sirop-booster-cure-kayana.jpeg",
    ],
    categorySlug: "sirops-naturels",
    label: "Best-seller",
    featured: true,
    sizes: ["250 ml"],
  },
  {
    name: "Sirop à la Menthe",
    slug: "sirop-menthe",
    description:
      "Fraîcheur mentholée et action ciblée : le Sirop à la Menthe Davila Rondeur est une formule naturelle de 250 ml pensée pour sublimer les zones clés de la silhouette — fesses, hanches, cuisses et poitrine.\n\nSa composition 100 % naturelle et sa note fraîche en font un allié idéal pour celles qui recherchent une routine beauté douce, agréable à prendre et conforme à l'esprit « La Santé au Naturel » de la marque. Présenté dans un flacon élégant avec bouchon vert, il s'intègre facilement à votre rituel quotidien de bien-être.",
    price: "55.00",
    imageUrl: "/images/Sirop-menthe.jpeg",
    images: ["/images/Sirop-menthe.jpeg", "/images/Sirop-booster-cure-kayana.jpeg"],
    categorySlug: "sirops-naturels",
    label: "Nouveauté",
    featured: true,
    sizes: ["250 ml"],
  },
  {
    name: "Sirop Fraise Énergie",
    slug: "sirop-fraise-energie",
    description:
      "Boostez votre énergie tout en prenant soin de vos formes avec le Sirop Fraise Énergie Davila Rondeur. Ce sirop naturel de 250 ml associe la saveur fruitée de la fraise à une action ciblée sur les fesses, les hanches et les cuisses, pour une silhouette harmonieuse et tonique.\n\nFormulé pour apporter énergie et vitalité au quotidien, il s'inscrit dans la philosophie « La Santé au Naturel » de Davila Rondeur. Flacon rouge élégant, goût fraise gourmand — une routine bien-être aussi agréable qu'efficace.",
    price: "55.00",
    imageUrl: "/images/sirop-fraise-nergie.jpeg",
    images: ["/images/sirop-fraise-nergie.jpeg"],
    categorySlug: "sirops-naturels",
    label: "Énergie",
    featured: true,
    sizes: ["250 ml"],
  },
  {
    name: "Body Booster Cure Kayana",
    slug: "body-booster-cure-kayana",
    description:
      "La Cure Kayana en gélules : le complément alimentaire phare de Davila Rondeur pour la prise de poids, l'énergie et la vitalité. Ce Body Booster 100 % naturel contient 60 gélules, à raison de 2 gélules par jour, pour accompagner votre corps dans sa quête d'équilibre et de plénitude.\n\nEnrichi en plantes et extraits naturels soigneusement sélectionnés, il convient aux femmes qui souhaitent retrouver énergie, dynamisme et confiance en elles. Pot blanc pratique, label « 100 % Naturel » — la promesse Davila Rondeur pour une santé au naturel, sans artifice.",
    price: "65.00",
    imageUrl: "/images/Body-booster-prise-de-poids.jpeg",
    images: [
      "/images/Body-booster-prise-de-poids.jpeg",
      "/images/Body-booster-prise-de-poids2.jpeg",
      "/images/photo_2026-05-24%2017.46.20.jpeg",
      "/images/Sirop-booster-cure-kayana.jpeg",
    ],
    categorySlug: "complements-alimentaires",
    label: "Cure complète",
    featured: true,
    sizes: ["60 gélules"],
  },
] as const;

async function seed() {
  console.log("🌱 Seeding categories and products…");

  for (const category of categories) {
    await db
      .insert(categoriesTable)
      .values(category)
      .onConflictDoUpdate({
        target: categoriesTable.slug,
        set: {
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
        },
      });
  }

  const categoryRows = await db.select().from(categoriesTable);
  const categoryBySlug = Object.fromEntries(categoryRows.map((c) => [c.slug, c.id]));

  for (const product of products) {
    const { categorySlug, images, sizes, ...data } = product;
    const categoryId = categoryBySlug[categorySlug];

    if (!categoryId) {
      throw new Error(`Category not found: ${categorySlug}`);
    }

    await db
      .insert(productsTable)
      .values({
        ...data,
        images: [...images],
        sizes: [...sizes],
        categoryId,
        inStock: true,
      })
      .onConflictDoUpdate({
        target: productsTable.slug,
        set: {
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl,
          images: [...images],
          categoryId,
          label: data.label,
          inStock: true,
          featured: data.featured,
          sizes: [...sizes],
        },
      });
  }

  console.log(`✅ Seeded ${categories.length} categories and ${products.length} products.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
