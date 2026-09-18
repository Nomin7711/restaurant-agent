import type { NutritionTableBlock } from "@solane/shared";

export function NutritionTable({ block }: { block: NutritionTableBlock }) {
  return (
    <div className="swaps rise">
      <div className="swaps-head">
        <h3 className="swaps-title">{block.itemName}</h3>
        <span className="swaps-cal">{block.totalCalories} cal</span>
      </div>
      <div>
        {block.ingredients.map((ing) => (
          <div key={ing.name} className="swap-row">
            <div>
              <div className="swap-label">{ing.name}</div>
              <div className="swap-detail">
                {[
                  ing.allergens.length > 0 ? ing.allergens.join(" · ") : null,
                  ing.removable ? "removable" : null,
                  ing.swappable && ing.lowCalAlternative ? `swap: ${ing.lowCalAlternative}` : null,
                ]
                  .filter(Boolean)
                  .join("  ·  ")}
              </div>
            </div>
            {ing.caloriesPer100g != null && (
              <span className="swap-detail">{ing.caloriesPer100g} cal/100g</span>
            )}
          </div>
        ))}
      </div>
      {block.allergens.length > 0 && (
        <div className="warnrow">
          <span className="warn-dot" />
          <span className="warn-kind">Allergens</span>
          <span className="warn-text">{block.allergens.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
