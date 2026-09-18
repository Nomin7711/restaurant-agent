import { PrismaClient, StockStatus } from "@prisma/client";

const prisma = new PrismaClient();

const U = "https://images.unsplash.com/photo-";
const Q = "?fm=jpg&q=70&w=900&auto=format&fit=crop";
const img = (id: string) => `${U}${id}${Q}`;

const IMG = {
  steak: img("1600891964092-4316c288032e"),
  chicken: img("1598103442097-8b74394b95c6"),
  frites: img("1615937657715-bc7b4b7962c1"),
  steak2: img("1723893905879-0e309c2a8e06"),
  steakFork: img("1565299715199-866c917206bb"),
  plate: img("1633436375795-12b3b339712f"),
  salad: img("1546069901-ba9599a7e63c"),
  pancake: img("1567620905732-2d1ec7ab7445"),
  pizza: img("1565299624946-b28f40a0ae38"),
  board: img("1476124369491-e7addf5db371"),
  bowl: img("1512621776951-a57141f2eefd"),
  fine: img("1414235077428-338989a2e8c0"),
  meat: img("1504674900247-0877df9cc836"),
  greens: img("1540189549336-e6e99c3679fe"),
  skewer: img("1555939594-58d7cb561ad1"),
  berry: img("1565958011703-44f9829ba187"),
  choc: img("1551024506-0bccd828d307"),
  dessert: img("1563805042-7684c019e1cb"),
  tiramisu: img("1571877227200-a0d98ea607e9"),
  pasta1: img("1533777324565-a040eb52facd"),
  pasta2: img("1621996346565-e3dbc646d9a9"),
  carbonara: img("1473093295043-cdd812d0e601"),
  soup: img("1547592166-23ac45744acd"),
  ribs: img("1544025162-d76694265947"),
  rawsteak: img("1558030006-450675393462"),
  steakplate: img("1546833999-b9f581a1996d"),
  dining: img("1432139555190-58524dae6a55"),
  toast: img("1481931098730-318b6f776db0"),
  burger: img("1550317138-10000687a72b"),
  fish: img("1572802419224-296b0aeee0d9"),
  table: img("1519708227418-c8fd9a32b7a2"),
  stew: img("1588013273468-315fd88ea34c"),
};

// name, allergens, caloriesPer100g, swappable
const INGREDIENTS: Array<[string, string[], number | null, boolean?]> = [
  ["sourdough", ["gluten"], 289],
  ["whipped butter", ["dairy"], 717],
  ["squid", ["shellfish"], 92],
  ["flour", ["gluten"], 364],
  ["lemon", [], 29],
  ["egg", ["egg"], 155],
  ["burrata", ["dairy"], 330],
  ["heirloom tomato", [], 18],
  ["basil", [], 23],
  ["olive oil", [], 884],
  ["beef tenderloin", [], 250],
  ["capers", [], 23],
  ["onion", [], 40],
  ["beef broth", [], 13],
  ["gruyere", ["dairy"], 413],
  ["shrimp", ["shellfish"], 99],
  ["garlic", [], 149],
  ["chili", [], 40],
  ["spaghetti", ["gluten"], 158, true],
  ["zucchini noodles", [], 17],
  ["pecorino", ["dairy"], 387],
  ["guanciale", [], 655],
  ["black pepper", [], 251],
  ["rigatoni", ["gluten"], 157],
  ["tomato", [], 18],
  ["heavy cream", ["dairy"], 340, true],
  ["greek yogurt", ["dairy"], 59],
  ["parmesan", ["dairy"], 431],
  ["tagliatelle", ["gluten", "egg"], 164],
  ["black truffle", [], 92],
  ["walnuts", ["nuts"], 654],
  ["ravioli", ["gluten", "egg"], 175],
  ["lobster", ["shellfish"], 89],
  ["orecchiette", ["gluten"], 157],
  ["nduja", [], 450],
  ["bavette steak", [], 201],
  ["duck fat", [], 900],
  ["potato", [], 77],
  ["green peppercorn butter", ["dairy"], 680],
  ["ribeye", [], 291],
  ["rosemary", [], 131],
  ["poussin chicken", [], 168],
  ["thyme", [], 101],
  ["lamb chops", [], 294],
  ["scallion", [], 32],
  ["ground beef", [], 254],
  ["brioche bun", ["gluten", "egg", "dairy"], 330, true],
  ["lettuce wrap", [], 15],
  ["cheddar", ["dairy"], 403],
  ["salmon", ["fish"], 208],
  ["brown butter", ["dairy"], 717],
  ["cod", ["fish"], 82],
  ["white miso", ["soy"], 199],
  ["arborio rice", ["gluten"], 130, true],
  ["cauliflower rice", [], 25],
  ["mushrooms", [], 22],
  ["cauliflower", [], 25],
  ["tahini", ["sesame"], 595],
  ["pomegranate", [], 83],
  ["duck breast", [], 337],
  ["cherry jus", [], 60],
  ["eggplant", [], 25],
  ["zucchini", [], 17],
  ["ladyfingers", ["gluten", "egg"], 390],
  ["mascarpone", ["dairy"], 429, true],
  ["whipped ricotta", ["dairy"], 150],
  ["espresso", [], 2],
  ["cocoa", [], 228],
  ["cream cheese", ["dairy"], 342],
  ["sugar", [], 387],
  ["dark chocolate", [], 546],
  ["almond flour", ["nuts"], 571],
];

// low-cal swap pairs: heavy → lighter
const SWAPS: Array<[string, string]> = [
  ["heavy cream", "greek yogurt"],
  ["spaghetti", "zucchini noodles"],
  ["mascarpone", "whipped ricotta"],
  ["brioche bun", "lettuce wrap"],
  ["arborio rice", "cauliflower rice"],
];

type DishSeed = {
  name: string;
  description: string;
  priceCents: number;
  calories: number;
  isSignature?: boolean;
  vibeTags: string[];
  spiceLevel?: number;
  photoUrls: string[];
  ingredients: Array<[string, boolean?]>; // [name, removable]
  stock?: [StockStatus, number | null];
  reviews?: Array<{ rating: number; text: string; photoUrls?: string[] }>;
};

const CATEGORIES: Array<{ name: string; dishes: DishSeed[] }> = [
  {
    name: "Starters",
    dishes: [
      {
        name: "Charred Sourdough, Whipped Butter",
        description: "House sourdough over the coals, smoked sea salt butter.",
        priceCents: 900, calories: 320, vibeTags: ["cozy", "comfort"],
        photoUrls: [IMG.toast],
        ingredients: [["sourdough"], ["whipped butter"]],
      },
      {
        name: "Crispy Calamari, Lemon Aioli",
        description: "Flash-fried squid, charred lemon, garlic aioli.",
        priceCents: 1600, calories: 480, vibeTags: ["adventurous", "date-night"],
        photoUrls: [IMG.board],
        ingredients: [["squid"], ["flour"], ["lemon"], ["egg"]],
      },
      {
        name: "Burrata, Heirloom Tomato",
        description: "Torn burrata, tomatoes off the vine, basil oil.",
        priceCents: 1700, calories: 380, isSignature: true,
        vibeTags: ["light", "date-night"], photoUrls: [IMG.salad],
        ingredients: [["burrata"], ["heirloom tomato"], ["basil", true], ["olive oil"]],
        reviews: [
          { rating: 5, text: "The burrata alone is worth the booth.", photoUrls: [IMG.plate] },
          { rating: 5, text: "Tomatoes tasted like August." },
        ],
      },
      {
        name: "Steak Tartare, Smoked Yolk",
        description: "Hand-cut tenderloin, cured yolk, grilled sourdough.",
        priceCents: 1900, calories: 340, vibeTags: ["adventurous", "date-night"],
        photoUrls: [IMG.fine],
        ingredients: [["beef tenderloin"], ["egg"], ["capers", true], ["sourdough"]],
        stock: ["OUT", null],
      },
      {
        name: "French Onion Soup",
        description: "Five-hour onions, beef broth, gruyère lid.",
        priceCents: 1400, calories: 450, vibeTags: ["cozy", "comfort"],
        photoUrls: [IMG.soup],
        ingredients: [["onion"], ["beef broth"], ["gruyere"], ["sourdough"]],
      },
      {
        name: "Chili-Garlic Shrimp",
        description: "Head-on shrimp, burnt chili oil, torn herbs.",
        priceCents: 1800, calories: 310, spiceLevel: 2,
        vibeTags: ["adventurous", "spicy"], photoUrls: [IMG.skewer],
        ingredients: [["shrimp"], ["garlic"], ["chili", true], ["olive oil"]],
      },
    ],
  },
  {
    name: "Modern Pasta Lovers",
    dishes: [
      {
        name: "Carbonara Classico",
        description: "Spaghetti, cured guanciale, pecorino, slow yolk.",
        priceCents: 2200, calories: 890, isSignature: true,
        vibeTags: ["comfort", "cozy"], photoUrls: [IMG.carbonara],
        ingredients: [["spaghetti"], ["egg"], ["pecorino"], ["guanciale"], ["black pepper"]],
        reviews: [
          { rating: 5, text: "Best carbonara outside Rome, not up for debate." },
          { rating: 4, text: "Rich. Split it or surrender.", photoUrls: [IMG.pasta1] },
        ],
      },
      {
        name: "Cacio e Pepe",
        description: "Three ingredients, no place to hide.",
        priceCents: 2000, calories: 760, vibeTags: ["comfort", "date-night"],
        photoUrls: [IMG.pasta2],
        ingredients: [["spaghetti"], ["pecorino"], ["black pepper"]],
      },
      {
        name: "Rigatoni alla Vodka",
        description: "Blistered tomato cream, chili warmth, parmesan snow.",
        priceCents: 2100, calories: 820, spiceLevel: 1,
        vibeTags: ["cozy", "comfort"], photoUrls: [IMG.pasta1],
        ingredients: [["rigatoni"], ["tomato"], ["heavy cream"], ["parmesan"], ["chili", true]],
      },
      {
        name: "Truffle Tagliatelle",
        description: "Fresh ribbons, black truffle shaved at the table.",
        priceCents: 2800, calories: 780, isSignature: true,
        vibeTags: ["date-night", "adventurous"], photoUrls: [IMG.pasta2],
        ingredients: [["tagliatelle"], ["whipped butter"], ["black truffle"], ["parmesan"]],
        stock: ["LOW", 3],
        reviews: [{ rating: 5, text: "They shave the truffle until you say stop. I never said stop.", photoUrls: [IMG.plate] }],
      },
      {
        name: 'Zucchini "Noodles" al Pesto',
        description: "Ribboned zucchini, basil-walnut pesto, no regrets.",
        priceCents: 1900, calories: 420, vibeTags: ["light"],
        photoUrls: [IMG.greens],
        ingredients: [["zucchini noodles"], ["basil"], ["walnuts", true], ["parmesan"], ["olive oil"]],
      },
      {
        name: "Lobster Ravioli",
        description: "Hand-folded ravioli, lobster cream, charred tomato.",
        priceCents: 3200, calories: 720, vibeTags: ["date-night", "adventurous"],
        photoUrls: [IMG.fine],
        ingredients: [["ravioli"], ["lobster"], ["heavy cream"], ["tomato"]],
        stock: ["OUT", null],
      },
      {
        name: "Spicy Nduja Orecchiette",
        description: "Calabrian nduja, tomato, pecorino — bring water.",
        priceCents: 2300, calories: 810, spiceLevel: 3,
        vibeTags: ["adventurous", "spicy"], photoUrls: [IMG.stew],
        ingredients: [["orecchiette"], ["nduja"], ["tomato"], ["pecorino"]],
      },
    ],
  },
  {
    name: "Steak & Grill",
    dishes: [
      {
        name: "Steak Frites, Green Peppercorn",
        description: "12oz bavette, duck-fat frites, green peppercorn butter.",
        priceCents: 3400, calories: 780, isSignature: true,
        vibeTags: ["date-night", "comfort"], photoUrls: [IMG.steak, IMG.steak2],
        ingredients: [["bavette steak"], ["duck fat"], ["potato"], ["green peppercorn butter", true]],
        reviews: [
          { rating: 5, text: "Ordered rare, came out perfect.", photoUrls: [IMG.steakFork] },
          { rating: 5, text: "The frites never made it home.", photoUrls: [IMG.frites] },
          { rating: 4, text: "Booth 7 sent this in tonight.", photoUrls: [IMG.plate] },
        ],
      },
      {
        name: "Dry-Aged Ribeye 16oz",
        description: "45-day dry age, garlic butter baste, flaky salt.",
        priceCents: 5400, calories: 1100, vibeTags: ["date-night", "adventurous"],
        photoUrls: [IMG.rawsteak, IMG.steakplate],
        ingredients: [["ribeye"], ["whipped butter"], ["garlic"], ["rosemary", true]],
      },
      {
        name: "Half Chicken Off the Coals",
        description: "Brined poussin, charred lemon, thyme drippings.",
        priceCents: 2900, calories: 620, vibeTags: ["comfort", "cozy"],
        photoUrls: [IMG.chicken],
        ingredients: [["poussin chicken"], ["lemon"], ["garlic"], ["thyme"]],
        stock: ["LOW", 2],
      },
      {
        name: "Lamb Chops, Charred Scallion",
        description: "Grilled over embers, scallion butter, mint gremolata.",
        priceCents: 3800, calories: 850, vibeTags: ["adventurous", "date-night"],
        photoUrls: [IMG.ribs],
        ingredients: [["lamb chops"], ["scallion"], ["garlic"], ["olive oil"]],
      },
      {
        name: "Smash Burger, Beef-Fat Onions",
        description: "Double patty, beef-fat onions, burnt-end mayo, brioche.",
        priceCents: 2100, calories: 950, vibeTags: ["comfort", "cozy"],
        photoUrls: [IMG.burger],
        ingredients: [["ground beef"], ["brioche bun"], ["cheddar", true], ["onion", true]],
      },
    ],
  },
  {
    name: "Mains",
    dishes: [
      {
        name: "Pan-Seared Salmon, Brown Butter",
        description: "Crisp skin, brown butter, capers, charred lemon.",
        priceCents: 3100, calories: 540, vibeTags: ["light", "date-night"],
        photoUrls: [IMG.fish],
        ingredients: [["salmon"], ["brown butter"], ["lemon"], ["capers", true]],
      },
      {
        name: "Miso-Glazed Cod",
        description: "48-hour miso cure, blistered scallion.",
        priceCents: 3300, calories: 460, vibeTags: ["light", "adventurous"],
        photoUrls: [IMG.meat],
        ingredients: [["cod"], ["white miso"], ["scallion", true]],
      },
      {
        name: "Mushroom Risotto",
        description: "Arborio, roasted mushrooms, parmesan, black pepper.",
        priceCents: 2400, calories: 680, vibeTags: ["cozy", "comfort"],
        photoUrls: [IMG.bowl],
        ingredients: [["arborio rice"], ["mushrooms"], ["parmesan"], ["whipped butter"]],
      },
      {
        name: "Roasted Cauliflower Steak",
        description: "Coal-roasted, tahini, pomegranate, picked herbs.",
        priceCents: 2000, calories: 380, vibeTags: ["light", "adventurous"],
        photoUrls: [IMG.greens],
        ingredients: [["cauliflower"], ["tahini"], ["pomegranate", true]],
      },
      {
        name: "Duck Breast, Cherry Jus",
        description: "Dry-brined duck, rendered crisp, sour cherry jus.",
        priceCents: 3600, calories: 720, isSignature: true,
        vibeTags: ["date-night", "adventurous"], photoUrls: [IMG.dining],
        ingredients: [["duck breast"], ["cherry jus"], ["whipped butter"]],
        stock: ["LOW", 4],
        reviews: [{ rating: 5, text: "Duck was the main character tonight." }],
      },
      {
        name: "Ratatouille, Basil Oil",
        description: "Layered summer vegetables, slow oven, basil oil.",
        priceCents: 1900, calories: 340, vibeTags: ["light", "cozy"],
        photoUrls: [IMG.table],
        ingredients: [["eggplant"], ["zucchini"], ["tomato"], ["basil"], ["olive oil"]],
      },
    ],
  },
  {
    name: "Desserts",
    dishes: [
      {
        name: "Tiramisu al Banco",
        description: "Assembled at the counter, espresso-soaked, dusted dark.",
        priceCents: 1300, calories: 560, isSignature: true,
        vibeTags: ["cozy", "date-night"], photoUrls: [IMG.tiramisu],
        ingredients: [["ladyfingers"], ["mascarpone"], ["espresso"], ["cocoa", true]],
        reviews: [{ rating: 5, text: "They build it in front of you. Theater and dessert.", photoUrls: [IMG.dessert] }],
      },
      {
        name: "Burnt Basque Cheesecake",
        description: "Caramelized top, molten center, no crust, no rules.",
        priceCents: 1400, calories: 620, vibeTags: ["comfort", "date-night"],
        photoUrls: [IMG.pancake],
        ingredients: [["cream cheese"], ["egg"], ["sugar"], ["heavy cream"]],
        stock: ["LOW", 5],
      },
      {
        name: "Dark Chocolate Torte",
        description: "70% chocolate, almond flour, barely set.",
        priceCents: 1400, calories: 580, vibeTags: ["date-night"],
        photoUrls: [IMG.choc],
        ingredients: [["dark chocolate"], ["whipped butter"], ["egg"], ["almond flour"]],
      },
      {
        name: "Lemon Sorbet, Olive Oil",
        description: "Sharp lemon, good oil, flaky salt.",
        priceCents: 900, calories: 210, vibeTags: ["light"],
        photoUrls: [IMG.berry],
        ingredients: [["lemon"], ["sugar"], ["olive oil"]],
      },
    ],
  },
];

const RESTAURANT_INFO: Array<{ key: string; value: object }> = [
  {
    key: "hours",
    value: {
      monday: "17:00–23:00", tuesday: "17:00–23:00", wednesday: "17:00–23:00",
      thursday: "17:00–23:00", friday: "17:00–01:00", saturday: "17:00–01:00",
      sunday: "17:00–22:00",
      kitchenLastCall: "30 minutes before close",
      note: "Late-night menu after 23:00 on Friday and Saturday.",
    },
  },
  {
    key: "chef_bio",
    value: {
      name: "Elena Margot",
      title: "Chef & Owner",
      years: 18,
      story:
        "Elena Margot spent eight years on the line in Lyon before running the pass at a two-star house in Copenhagen. She opened Solane to cook the food she craves at midnight: bistro classics with the volume turned up. The concierge is named after her — MARGOT never sleeps either.",
      signatureDishes: ["Steak Frites, Green Peppercorn", "Carbonara Classico", "Tiramisu al Banco"],
    },
  },
  {
    key: "address",
    value: {
      street: "44 Halsey Lane", city: "Brooklyn, NY 11211",
      phone: "+1 (718) 555-0186", email: "hello@solane.nyc",
      subway: "L to Bedford Ave, 4 min walk",
    },
  },
  {
    key: "policies",
    value: {
      reservations: "Booths held 15 minutes past reservation time.",
      walkIns: "Bar seats are always walk-in.",
      corkage: "$35 per bottle, two bottle max.",
      dietary: "Kitchen handles allergens seriously — flag anything and the expo confirms every plate.",
      largeParties: "Parties of 7+ book via phone.",
    },
  },
];

async function main() {
  await prisma.conversationTurn.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.menuItemIngredient.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.restaurantInfo.deleteMany();

  const ingredients = await prisma.ingredient.createManyAndReturn({
    data: INGREDIENTS.map(([name, allergens, caloriesPer100g, swappable]) => ({
      name, allergens, caloriesPer100g, swappable: swappable ?? false,
    })),
  });
  const ingId = new Map(ingredients.map((i) => [i.name, i.id]));

  for (const [heavy, light] of SWAPS) {
    await prisma.ingredient.update({
      where: { id: ingId.get(heavy)! },
      data: { lowCalAlternativeId: ingId.get(light)! },
    });
  }

  let dishCount = 0;
  for (const [catIndex, cat] of CATEGORIES.entries()) {
    const category = await prisma.menuCategory.create({
      data: { name: cat.name, sortOrder: catIndex },
    });
    for (const dish of cat.dishes) {
      const [status, qtyRemaining] = dish.stock ?? ["IN_STOCK", null];
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: dish.name,
          description: dish.description,
          priceCents: dish.priceCents,
          calories: dish.calories,
          isSignature: dish.isSignature ?? false,
          vibeTags: dish.vibeTags,
          spiceLevel: dish.spiceLevel ?? 0,
          photoUrls: dish.photoUrls,
          inventory: { create: { status, qtyRemaining } },
          ingredients: {
            create: dish.ingredients.map(([name, removable]) => ({
              ingredientId: ingId.get(name)!,
              removable: removable ?? false,
            })),
          },
          reviews: {
            create: (dish.reviews ?? []).map((r) => ({
              rating: r.rating, text: r.text, photoUrls: r.photoUrls ?? [],
            })),
          },
        },
      });
      dishCount++;
    }
  }

  for (const info of RESTAURANT_INFO) {
    await prisma.restaurantInfo.create({ data: info });
  }

  console.log(`Seeded ${dishCount} dishes, ${ingredients.length} ingredients, ${RESTAURANT_INFO.length} info entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
