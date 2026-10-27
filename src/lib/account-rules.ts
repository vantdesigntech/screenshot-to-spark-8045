export const FREE_SEARCH_LIMIT = 5;
export type PersonalAction = "save" | "watchbox" | "alert" | "project" | "pro" | "whatsapp";
export function canUsePersonalAction(user: { id: string } | null, _action: PersonalAction) {
  return user !== null;
}
export function dailySearches(used: number, storedDay: string, today: string) {
  return storedDay === today ? used : 0;
}
export function canRunExtendedSearch(used: number, pro: boolean) {
  return pro || used < FREE_SEARCH_LIMIT;
}