import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { RunContext } from "@openai/agents";
import { sseEventSchema, type SseEvent } from "@solane/shared";
import { buildTools } from "./tools.js";

const prisma = new PrismaClient();
const emitted: SseEvent[] = [];
const [getMenu, getItemDetails, getRestaurantInfo, getPhotos] = buildTools({
  prisma,
  emit: (event) => emitted.push(event),
});

const invoke = (tool: { invoke: (ctx: RunContext, input: string) => Promise<unknown> }, args: object) =>
  tool.invoke(new RunContext(), JSON.stringify(args));

beforeAll(() => {
  emitted.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("get_menu", () => {
  it("excludeAllergens filters out dishes containing the allergen", async () => {
    const result = (await invoke(getMenu!, {
      category: null,
      vibeTags: null,
      maxCalories: null,
      excludeAllergens: ["gluten"],
    })) as { items: Array<{ id: string; name: string }> };

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.map((i) => i.name)).not.toContain("Carbonara Classico");

    for (const item of result.items) {
      const withIngredients = await prisma.menuItem.findUnique({
        where: { id: item.id },
        include: { ingredients: { include: { ingredient: true } } },
      });
      const allergens = withIngredients!.ingredients.flatMap((mi) => mi.ingredient.allergens);
      expect(allergens).not.toContain("gluten");
    }
  });

  it("emits a valid menu_card ui_block", async () => {
    emitted.length = 0;
    await invoke(getMenu!, { category: "Modern Pasta Lovers", vibeTags: null, maxCalories: null, excludeAllergens: null });
    expect(emitted).toHaveLength(1);
    const parsed = sseEventSchema.parse(emitted[0]);
    expect(parsed.type).toBe("ui_block");
    if (parsed.type === "ui_block") expect(parsed.block.type).toBe("menu_card");
  });
});

describe("get_item_details", () => {
  it("rolls up allergens and emits a nutrition_table block", async () => {
    const carbonara = await prisma.menuItem.findFirstOrThrow({ where: { name: "Carbonara Classico" } });
    emitted.length = 0;
    const result = (await invoke(getItemDetails!, { itemId: carbonara.id })) as { allergens: string[] };
    expect(result.allergens).toEqual(expect.arrayContaining(["gluten", "dairy", "egg"]));
    const parsed = sseEventSchema.parse(emitted[0]);
    if (parsed.type === "ui_block") expect(parsed.block.type).toBe("nutrition_table");
  });
});

describe("get_restaurant_info", () => {
  it("maps chef topic to chef_bio and emits nothing", async () => {
    emitted.length = 0;
    const result = (await invoke(getRestaurantInfo!, { topic: "chef" })) as { name: string };
    expect(result.name).toBe("Elena Margot");
    expect(emitted).toHaveLength(0);
  });
});

describe("get_photos", () => {
  it("returns menu and review photos with a valid gallery block", async () => {
    const steak = await prisma.menuItem.findFirstOrThrow({ where: { name: { contains: "Steak Frites" } } });
    emitted.length = 0;
    const result = (await invoke(getPhotos!, { itemId: steak.id, source: "both" })) as { count: number };
    expect(result.count).toBeGreaterThan(2);
    const parsed = sseEventSchema.parse(emitted[0]);
    if (parsed.type === "ui_block") {
      expect(parsed.block.type).toBe("photo_gallery");
      if (parsed.block.type === "photo_gallery") {
        const sources = new Set(parsed.block.photos.map((p) => p.source));
        expect(sources).toEqual(new Set(["menu", "review"]));
      }
    }
  });
});
