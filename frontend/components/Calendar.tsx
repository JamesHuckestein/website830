"use client";

import { useEffect, useState } from "react";

import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDetailModal } from "@/components/EventDetailModal";
import { getEvents, type Event } from "@/lib/api";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEvents(`${year}-${pad2(month)}`)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <>
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
          >
            ←
          </button>
          <h2 className="text-2xl font-semibold text-[#032147]">{monthLabel(year, month)}</h2>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
          >
            →
          </button>
        </div>
        {events === null ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            events={events}
            onEventClick={setSelectedEvent}
          />
        )}
      </section>
    </>
  );
}
