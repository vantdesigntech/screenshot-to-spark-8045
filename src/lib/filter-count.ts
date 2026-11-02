/** Number of active filters shown on the "Filtros" button: origin, each category, store and price cap each count once. */
export function countActiveFilters(f: { origin: string; categories: readonly string[]; storeFilter: string; maxPrice: number; maxPriceLimit: number }) {
  return (f.origin !== "all" ? 1 : 0) + f.categories.length + (f.storeFilter !== "all" ? 1 : 0) + (f.maxPrice < f.maxPriceLimit ? 1 : 0);
}
