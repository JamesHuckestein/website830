"use client";

import { useEffect, useState } from "react";

import { CalendarGrid } from "@/components/CalendarGrid";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DayEventPicker } from "@/components/DayEventPicker";
import { EventFormModal, type EventFormValues } from "@/components/EventFormModal";
import { SubmitModal } from "@/components/SubmitModal";
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
  type Event,
} from "@/lib/api";

type CalendarUpdatesProps = {
  token: string;
  onBack: () => void;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function CalendarUpdates({ token, onBack }: CalendarUpdatesProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState<{ action: "Edit" | "Delete" } | null>(null);
  const [formOpen, setFormOpen] = useState<{ mode: "add" | "edit"; target: Event | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  }, [year, month, refreshKey]);

  const eventsOnDay = (day: string | null): Event[] =>
    day && events ? events.filter((e) => e.day === day) : [];

  const goPrev = () => {
    setSelectedDay(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    setSelectedDay(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleAddClick = () => {
    if (!selectedDay) {
      setFeedback({ success: false, message: "Please select a day first." });
      return;
    }
    if (eventsOnDay(selectedDay).length >= 3) {
      setFeedback({ success: false, message: "This day already has the maximum of 3 events." });
      return;
    }
    setFormOpen({ mode: "add", target: null });
  };

  const handleEditClick = () => {
    if (!selectedDay) {
      setFeedback({ success: false, message: "Please select a day first." });
      return;
    }
    const dayEvents = eventsOnDay(selectedDay);
    if (dayEvents.length === 0) {
      setFeedback({ success: false, message: "No event on this day." });
      return;
    }
    if (dayEvents.length === 1) {
      setFormOpen({ mode: "edit", target: dayEvents[0] });
      return;
    }
    setPickerOpen({ action: "Edit" });
  };

  const handleDeleteClick = () => {
    if (!selectedDay) {
      setFeedback({ success: false, message: "Please select a day first." });
      return;
    }
    const dayEvents = eventsOnDay(selectedDay);
    if (dayEvents.length === 0) {
      setFeedback({ success: false, message: "No event on this day." });
      return;
    }
    if (dayEvents.length === 1) {
      setConfirmDelete(dayEvents[0]);
      return;
    }
    setPickerOpen({ action: "Delete" });
  };

  const handlePick = (ev: Event) => {
    const action = pickerOpen?.action;
    setPickerOpen(null);
    if (action === "Edit") setFormOpen({ mode: "edit", target: ev });
    else if (action === "Delete") setConfirmDelete(ev);
  };

  const handleFormSave = async (values: EventFormValues) => {
    if (!formOpen || submitting) return;
    const body = {
      day: formOpen.mode === "edit" && formOpen.target ? formOpen.target.day : (selectedDay ?? ""),
      title: values.title,
      description: values.description,
      timeOfDay: values.timeOfDay,
      location: values.location,
    };
    const isAdd = formOpen.mode === "add";
    const editTarget = formOpen.target;
    setSubmitting(true);
    try {
      const result = isAdd
        ? await createEvent(token, body)
        : editTarget
          ? await updateEvent(token, editTarget.id, body)
          : null;
      if (result) {
        setFeedback({ success: true, message: result.message });
        setFormOpen(null);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setFeedback({
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : isAdd
              ? "Failed to create event. Please try again."
              : "Failed to update event. Please try again.",
      });
      // Leave formOpen as-is so the user can correct and retry with values preserved.
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmYes = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      const result = await deleteEvent(token, target.id);
      setFeedback({ success: true, message: result.message });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFeedback({
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : "Failed to delete event. Please try again.",
      });
    }
  };

  if (events === null) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <>
      {pickerOpen && selectedDay && (
        <DayEventPicker
          day={selectedDay}
          events={eventsOnDay(selectedDay)}
          actionLabel={pickerOpen.action}
          onPick={handlePick}
          onCancel={() => setPickerOpen(null)}
        />
      )}
      {formOpen && (
        <EventFormModal
          mode={formOpen.mode}
          day={formOpen.mode === "edit" && formOpen.target ? formOpen.target.day : (selectedDay ?? "")}
          initialValues={
            formOpen.target
              ? {
                  title: formOpen.target.title,
                  description: formOpen.target.description,
                  timeOfDay: formOpen.target.timeOfDay,
                  location: formOpen.target.location,
                }
              : undefined
          }
          submitting={submitting}
          onSave={handleFormSave}
          onCancel={() => setFormOpen(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete event"
          message="Will you confirm?"
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={handleConfirmYes}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {feedback && (
        <SubmitModal
          success={feedback.success}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">Calendar Updates</h2>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
          >
            ←
          </button>
          <p className="text-lg font-semibold text-[#032147]">{monthLabel(year, month)}</p>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
          >
            →
          </button>
        </div>
        <CalendarGrid
          year={year}
          month={month}
          events={events}
          selectedDay={selectedDay}
          onDayClick={(d) => setSelectedDay(d)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddClick}
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleEditClick}
            className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991]"
          >
            Delete
          </button>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#4169E1] underline"
        >
          Back to Members Area
        </button>
      </section>
    </>
  );
}
