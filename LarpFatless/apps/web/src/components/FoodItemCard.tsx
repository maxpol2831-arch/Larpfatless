import { AlertTriangle, Trash2 } from "lucide-react";
import type { NutritionItem } from "../types/nutrition";

interface FoodItemCardProps {
  item: NutritionItem;
  index: number;
  editable?: boolean;
  onChange?: (item: NutritionItem) => void;
  onDelete?: () => void;
}

const numberFields = ["weight_g", "calories", "protein_g", "fat_g", "carbs_g"] as const;

export function FoodItemCard({ item, index, editable = false, onChange, onDelete }: FoodItemCardProps) {
  const update = (key: keyof NutritionItem, value: string) => {
    if (!onChange) return;
    if (key === "name") {
      onChange({ ...item, name: value });
      return;
    }
    onChange({ ...item, [key]: Number(value.replace(",", ".")) || 0 });
  };

  return (
    <article className="food-card" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="food-card__top">
        {editable ? (
          <input className="food-card__name-input" value={item.name} onChange={(event) => update("name", event.target.value)} />
        ) : (
          <h3>{item.name}</h3>
        )}
        {item.confidence === "low" && (
          <span className="confidence-badge">
            <AlertTriangle size={14} />
            проверить
          </span>
        )}
      </div>

      <div className="food-card__grid">
        {numberFields.map((field) => (
          <label key={field} className="food-card__metric">
            <span>{metricLabel[field]}</span>
            {editable ? (
              <input value={item[field]} inputMode="decimal" onChange={(event) => update(field, event.target.value)} />
            ) : (
              <strong>{Math.round(item[field])}</strong>
            )}
          </label>
        ))}
      </div>

      {onDelete && (
        <button className="icon-text-button danger" onClick={onDelete} type="button">
          <Trash2 size={16} />
          Удалить
        </button>
      )}
    </article>
  );
}

const metricLabel = {
  weight_g: "г",
  calories: "ккал",
  protein_g: "Б",
  fat_g: "Ж",
  carbs_g: "У"
};
