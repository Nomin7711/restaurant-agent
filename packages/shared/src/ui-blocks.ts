import { z } from "zod";

export const stockStatusSchema = z.enum(["IN_STOCK", "LOW", "OUT"]);
export type StockStatus = z.infer<typeof stockStatusSchema>;

export const menuCardItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  calories: z.number().int(),
  isSignature: z.boolean(),
  vibeTags: z.array(z.string()),
  spiceLevel: z.number().int(),
  photoUrl: z.url(),
  category: z.string(),
  stockStatus: stockStatusSchema,
  qtyRemaining: z.number().int().nullable(),
});
export type MenuCardItem = z.infer<typeof menuCardItemSchema>;

export const menuCardBlockSchema = z.object({
  type: z.literal("menu_card"),
  items: z.array(menuCardItemSchema),
});
export type MenuCardBlock = z.infer<typeof menuCardBlockSchema>;

export const photoGalleryBlockSchema = z.object({
  type: z.literal("photo_gallery"),
  itemId: z.string(),
  itemName: z.string(),
  photos: z.array(
    z.object({
      url: z.url(),
      caption: z.string().optional(),
      source: z.enum(["menu", "review"]),
    })
  ),
});
export type PhotoGalleryBlock = z.infer<typeof photoGalleryBlockSchema>;

export const nutritionTableBlockSchema = z.object({
  type: z.literal("nutrition_table"),
  itemId: z.string(),
  itemName: z.string(),
  totalCalories: z.number().int(),
  allergens: z.array(z.string()),
  ingredients: z.array(
    z.object({
      name: z.string(),
      allergens: z.array(z.string()),
      removable: z.boolean(),
      swappable: z.boolean(),
      caloriesPer100g: z.number().int().nullable(),
      lowCalAlternative: z.string().nullable(),
    })
  ),
});
export type NutritionTableBlock = z.infer<typeof nutritionTableBlockSchema>;

export const uiBlockSchema = z.discriminatedUnion("type", [
  menuCardBlockSchema,
  photoGalleryBlockSchema,
  nutritionTableBlockSchema,
]);
export type UIBlock = z.infer<typeof uiBlockSchema>;
