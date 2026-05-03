import { dummyMembers } from "@/data/siteData";

type BirthdayListProps = {
  onBack: () => void;
};

function getUpcomingBirthdays(today: Date) {
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + 30);

  return dummyMembers.filter((m) => {
    const bday = new Date(m.birthday);
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
    return (thisYear >= today && thisYear <= cutoff) || (nextYear >= today && nextYear <= cutoff);
  }).sort((a, b) => {
    const today2 = new Date();
    const dateA = new Date(today2.getFullYear(), new Date(a.birthday).getMonth(), new Date(a.birthday).getDate());
    const dateB = new Date(today2.getFullYear(), new Date(b.birthday).getMonth(), new Date(b.birthday).getDate());
    if (dateA < today2) dateA.setFullYear(today2.getFullYear() + 1);
    if (dateB < today2) dateB.setFullYear(today2.getFullYear() + 1);
    return dateA.getTime() - dateB.getTime();
  });
}

export function BirthdayList({ onBack }: BirthdayListProps) {
  const today = new Date();
  const upcoming = getUpcomingBirthdays(today);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Upcoming Birthdays</h2>
      <p className="text-sm text-[#888888]">Members with birthdays in the next 30 days.</p>
      {upcoming.length === 0 ? (
        <p className="text-sm text-[#888888]">No birthdays in the next 30 days.</p>
      ) : (
        <ul className="divide-y divide-[#E7E7E7]">
          {upcoming.map((m) => {
            const bday = new Date(m.birthday);
            const formatted = bday.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            return (
              <li key={m.memberNumber} className="flex justify-between py-2 text-sm">
                <span className="font-medium text-[#032147]">{m.firstName} {m.lastName}</span>
                <span className="text-[#888888]">{formatted}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
