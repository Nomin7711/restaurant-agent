import type { UIBlock } from "@solane/shared";
import { MenuCard } from "./MenuCard";
import { PhotoGallery } from "./PhotoGallery";
import { NutritionTable } from "./NutritionTable";

export function BlockRenderer({ block }: { block: UIBlock }) {
  switch (block.type) {
    case "menu_card":
      return <MenuCard block={block} />;
    case "photo_gallery":
      return <PhotoGallery block={block} />;
    case "nutrition_table":
      return <NutritionTable block={block} />;
  }
}
