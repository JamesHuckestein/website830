import { dummyMeetingMinutes } from "@/data/siteData";

type MeetingMinutesProps = {
  detailId: string | null;
  onSelectMinute: (id: string) => void;
  onBackToList: () => void;
  onBackToMembersArea: () => void;
};

export function MeetingMinutes({ detailId, onSelectMinute, onBackToList, onBackToMembersArea }: MeetingMinutesProps) {
  if (detailId) {
    const entry = dummyMeetingMinutes.find((m) => m.id === detailId);
    if (!entry) return null;
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">{entry.title}</h2>
        <p className="text-sm text-[#888888]">
          {new Date(entry.meetingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        <div className="rounded-md border border-[#E7E7E7] bg-[#F5F5F5] p-4 text-sm text-[#888888]">
          PDF viewer will be available when minutes are uploaded to S3. File: {entry.pdfPath}
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={onBackToList} className="text-sm text-[#4169E1] underline">
            Back to Meeting Minutes
          </button>
          <button type="button" onClick={onBackToMembersArea} className="text-sm text-[#4169E1] underline">
            Back to Members Area
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Council Meeting Minutes</h2>
      <ul className="divide-y divide-[#E7E7E7]">
        {dummyMeetingMinutes.map((entry) => (
          <li key={entry.id} className="py-3">
            <button
              type="button"
              onClick={() => onSelectMinute(entry.id)}
              className="text-left text-sm font-medium text-[#4169E1] underline hover:text-[#032147]"
            >
              {entry.title}
            </button>
            <p className="text-xs text-[#888888]">
              {new Date(entry.meetingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onBackToMembersArea} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
