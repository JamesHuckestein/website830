export function formatDay(isoDay: string): string {
  const [y, mo, d] = isoDay.split("-").map((s) => parseInt(s, 10));
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
