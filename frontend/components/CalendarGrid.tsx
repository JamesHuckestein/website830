"use client";

import type { Event } from "@/lib/api";

type CalendarGridProps = {
  year: number;
  month: number;
  events: Event[];
  selectedDay?: string | null;
  onDayClick?: (day: string) => void;
  onEventClick?: (event: Event) => void;
};

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function CalendarGrid({
  year,
  month,
  events,
  selectedDay = null,
  onDayClick,
  onEventClick,
}: CalendarGridProps) {
  const firstDayDow = new Date(year, month - 1, 1).getDay();
  const leadingBlanks = (firstDayDow + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const eventsByDay = new Map<string, Event[]>();
  for (const ev of events) {
    const list = eventsByDay.get(ev.day) ?? [];
    list.push(ev);
    eventsByDay.set(ev.day, list);
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - leadingBlanks + 1;
    const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const key = inMonth ? dayKey(year, month, dayNumber) : `blank-${i}`;
    const dayEvents = inMonth ? eventsByDay.get(key) ?? [] : [];
    const isSelected = inMonth && selectedDay === key;

    const baseClasses = "min-h-[5rem] rounded border p-1 text-left";
    const stateClasses = !inMonth
      ? "border-[#E7E7E7] bg-[#F7F8FC]"
      : isSelected
        ? "border-[#753991] bg-[#753991]/10"
        : "border-[#E7E7E7] bg-white";
    const interactiveClasses = inMonth && onDayClick ? "hover:border-[#753991] cursor-pointer" : "";

    const dayIsInteractive = inMonth && !!onDayClick;
    const renderEvent = (ev: Event) => {
      if (!dayIsInteractive && onEventClick) {
        return (
          <button
            key={ev.id}
            type="button"
            onClick={() => onEventClick(ev)}
            className="mt-0.5 block w-full truncate text-left text-xs text-[#4169E1] underline"
            aria-label={`Event: ${ev.title}`}
          >
            {ev.title}
          </button>
        );
      }
      return (
        <p
          key={ev.id}
          className="mt-0.5 block w-full truncate text-left text-xs text-[#4169E1]"
          aria-label={`Event: ${ev.title}`}
        >
          {ev.title}
        </p>
      );
    };

    const content = (
      <>
        {inMonth && (
          <p className="text-xs font-semibold text-[#032147]">{dayNumber}</p>
        )}
        {dayEvents.slice(0, 3).map(renderEvent)}
      </>
    );

    if (inMonth && onDayClick) {
      cells.push(
        <button
          key={key}
          type="button"
          onClick={() => onDayClick(key)}
          aria-label={`Select day ${dayNumber}`}
          aria-pressed={isSelected}
          className={`${baseClasses} ${stateClasses} ${interactiveClasses}`}
        >
          {content}
        </button>,
      );
    } else {
      cells.push(
        <div key={key} className={`${baseClasses} ${stateClasses}`}>
          {content}
        </div>,
      );
    }
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS.map((wd) => (
          <p key={wd} className="text-center text-xs font-semibold text-[#888888]">
            {wd}
          </p>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
