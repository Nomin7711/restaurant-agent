import { tool } from "@openai/agents";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import {
  menuCardBlockSchema,
  photoGalleryBlockSchema,
  nutritionTableBlockSchema,
  type SseEvent,
} from "@solane/shared";

export type Emit = (event: SseEvent) => void;

const menuItemInclude = {
  category: true,
  inventory: true,
  ingredients: { include: { ingredient: { include: { lowCalAlternative: true } } } },
} as const;

// Tool order is frozen — it is part of the prompt-cache prefix.
export function buildTools({ prisma, emit }: { prisma: PrismaClient; emit: Emit }) {
  const getMenu = tool({
    name: "get_menu",
    description:
      "List menu items, optionally filtered by category name, vibe tags, max calories, or excluded allergens. Renders a menu card widget to the guest.",
    parameters: z.object({
      category: z.string().nullable().describe("Category name, e.g. 'Modern Pasta Lovers'. Null for all."),
      vibeTags: z.array(z.string()).nullable().describe("e.g. ['cozy','date-night','light','adventurous','comfort','spicy']"),
      maxCalories: z.number().int().nullable(),
      excludeAllergens: z.array(z.string()).nullable().describe("e.g. ['dairy','gluten','nuts','shellfish','fish','egg','soy','sesame']"),
    }),
    execute: async ({ category, vibeTags, maxCalories, excludeAllergens }) => {
      const items = await prisma.menuItem.findMany({
        where: {
          ...(category ? { category: { name: { contains: category, mode: "insensitive" } } } : {}),
          ...(vibeTags?.length ? { vibeTags: { hasSome: vibeTags } } : {}),
          ...(maxCalories ? { calories: { lte: maxCalories } } : {}),
          ...(excludeAllergens?.length
            ? { ingredients: { none: { ingredient: { allergens: { hasSome: excludeAllergens } } } } }
            : {}),
        },
        include: { category: true, inventory: true },
        orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      });

      emit({
        type: "ui_block",
        block: menuCardBlockSchema.parse({
          type: "menu_card",
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            priceCents: i.priceCents,
            calories: i.calories,
            isSignature: i.isSignature,
            vibeTags: i.vibeTags,
            spiceLevel: i.spiceLevel,
            photoUrl: i.photoUrls[0] ?? "",
            category: i.category.name,
            stockStatus: i.inventory?.status ?? "IN_STOCK",
            qtyRemaining: i.inventory?.qtyRemaining ?? null,
          })),
        }),
      });

      return {
        note: "Displayed to the guest as a menu card widget — do not repeat item details in prose.",
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category.name,
          priceCents: i.priceCents,
          calories: i.calories,
          isSignature: i.isSignature,
          vibeTags: i.vibeTags,
          stock: i.inventory?.status ?? "IN_STOCK",
          qtyRemaining: i.inventory?.qtyRemaining ?? null,
        })),
      };
    },
  });

  const getItemDetails = tool({
    name: "get_item_details",
    description:
      "Full ingredients, allergens, nutrition, and low-calorie swap options for one dish. Renders a nutrition panel widget to the guest.",
    parameters: z.object({
      itemId: z.string().describe("Menu item id from get_menu"),
    }),
    execute: async ({ itemId }) => {
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: menuItemInclude,
      });
      if (!item) return { error: "No menu item with that id. Call get_menu first." };

      const ingredients = item.ingredients.map((mi) => ({
        name: mi.ingredient.name,
        allergens: mi.ingredient.allergens,
        removable: mi.removable,
        swappable: mi.ingredient.swappable,
        caloriesPer100g: mi.ingredient.caloriesPer100g,
        lowCalAlternative: mi.ingredient.lowCalAlternative?.name ?? null,
      }));
      const allergens = [...new Set(ingredients.flatMap((i) => i.allergens))];

      emit({
        type: "ui_block",
        block: nutritionTableBlockSchema.parse({
          type: "nutrition_table",
          itemId: item.id,
          itemName: item.name,
          totalCalories: item.calories,
          allergens,
          ingredients,
        }),
      });

      return {
        note: "Displayed to the guest as a nutrition panel widget — do not repeat the full table in prose.",
        name: item.name,
        calories: item.calories,
        allergens,
        ingredients,
        stock: item.inventory?.status ?? "IN_STOCK",
      };
    },
  });

  const getRestaurantInfo = tool({
    name: "get_restaurant_info",
    description: "Opening hours, chef bio, address/location, or house policies.",
    parameters: z.object({
      topic: z.enum(["hours", "chef", "location", "policies"]),
    }),
    execute: async ({ topic }) => {
      const key = topic === "chef" ? "chef_bio" : topic === "location" ? "address" : topic;
      const info = await prisma.restaurantInfo.findUnique({ where: { key } });
      return info?.value ?? { error: "No info found for that topic." };
    },
  });

  const getPhotos = tool({
    name: "get_photos",
    description:
      "Photos of a dish — official menu shots and/or guest review photos. Renders a swipeable photo gallery widget to the guest.",
    parameters: z.object({
      itemId: z.string().describe("Menu item id from get_menu"),
      source: z.enum(["menu", "reviews", "both"]),
    }),
    execute: async ({ itemId, source }) => {
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { reviews: true },
      });
      if (!item) return { error: "No menu item with that id. Call get_menu first." };

      const photos = [
        ...(source !== "reviews"
          ? item.photoUrls.map((url) => ({ url, caption: item.name, source: "menu" as const }))
          : []),
        ...(source !== "menu"
          ? item.reviews.flatMap((r) =>
              r.photoUrls.map((url) => ({ url, caption: r.text ?? undefined, source: "review" as const }))
            )
          : []),
      ];

      if (photos.length > 0) {
        emit({
          type: "ui_block",
          block: photoGalleryBlockSchema.parse({
            type: "photo_gallery",
            itemId: item.id,
            itemName: item.name,
            photos,
          }),
        });
      }

      return {
        note: photos.length
          ? "Displayed to the guest as a swipeable gallery widget."
          : "No photos available for this dish.",
        count: photos.length,
        captions: photos.map((p) => p.caption).filter(Boolean),
      };
    },
  });

  return [getMenu, getItemDetails, getRestaurantInfo, getPhotos];
}
