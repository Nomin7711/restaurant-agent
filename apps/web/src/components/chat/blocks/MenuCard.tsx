import type { MenuCardBlock } from "@solane/shared";

function price(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function MenuCard({ block }: { block: MenuCardBlock }) {
  return (
    <div className={block.items.length === 1 ? "flex flex-col" : "dish-carousel"}>
      {block.items.map((item) => (
        <article key={item.id} className="dish">
          <div className="dish-img-wrap">
            <div className="dish-img" style={{ backgroundImage: `url(${item.photoUrl})` }} />
            <div className="dish-fade" />
            {item.isSignature && <span className="sigbadge">Signature</span>}
            {item.stockStatus === "LOW" && (
              <span className="stockbadge">
                {item.qtyRemaining != null ? `${item.qtyRemaining} left` : "Low tonight"}
              </span>
            )}
            {item.stockStatus === "OUT" && <span className="stockbadge">86 tonight</span>}
          </div>
          <div className="dish-body">
            <div className="dish-toprow">
              <h3 className="dish-name">{item.name}</h3>
              <span className="dish-price">{price(item.priceCents)}</span>
            </div>
            <p className="dish-note">{item.description}</p>
            <div className="dish-meta-row">
              <span className="dish-meta">
                {item.calories} cal · {item.category}
                {item.spiceLevel > 0 ? ` · ${"🌶".repeat(item.spiceLevel)}` : ""}
              </span>
              <span className="dish-meta">{item.vibeTags.join(" · ")}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
