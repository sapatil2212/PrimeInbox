"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoSchedulerProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateError?: string;
  timeError?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Build 30-minute slots between 09:00 and 18:00 grouped by part of day
const TIME_SLOTS: { label: string; slots: string[] }[] = [
  {
    label: "Morning",
    slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  },
  {
    label: "Afternoon",
    slots: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"],
  },
  {
    label: "Evening",
    slots: ["16:00", "16:30", "17:00", "17:30", "18:00"],
  },
];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTimeLabel(t: string) {
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

export function DemoScheduler({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: DemoSchedulerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedDate = date ? new Date(date + "T00:00:00") : null;

  // The month currently displayed in the calendar
  const [viewMonth, setViewMonth] = useState(() => {
    const base = selectedDate ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid (leading blanks + days)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + 1,
      0
    ).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return cells;
  }, [viewMonth]);

  const canGoPrev =
    viewMonth.getFullYear() > today.getFullYear() ||
    (viewMonth.getFullYear() === today.getFullYear() &&
      viewMonth.getMonth() > today.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const goNext = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Calendar */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" /> Choose a date
        </label>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                canGoPrev
                  ? "text-zinc-500 hover:bg-zinc-100"
                  : "text-zinc-300 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-zinc-800">{monthLabel}</span>
            <button
              type="button"
              onClick={goNext}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-[9px] font-bold text-zinc-400 text-center py-1 uppercase"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={`b-${i}`} />;
              const iso = toISODate(cell);
              const isPast = cell < today;
              const isSelected = date === iso;
              const isToday = toISODate(today) === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => onDateChange(iso)}
                  className={cn(
                    "aspect-square rounded-lg text-[11px] font-semibold flex items-center justify-center transition-all",
                    isPast && "text-zinc-300 cursor-not-allowed",
                    !isPast && !isSelected && "text-zinc-700 hover:bg-zinc-100",
                    isSelected && "bg-zinc-900 text-white",
                    !isSelected && isToday && !isPast && "ring-1 ring-zinc-300"
                  )}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        {dateError && <p className="text-[10px] font-bold text-red-500">{dateError}</p>}
      </div>

      {/* Time slots */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" /> Choose a time
        </label>
        <div
          className={cn(
            "rounded-xl border border-zinc-200/80 bg-white p-3 flex-1",
            !date && "opacity-50 pointer-events-none"
          )}
        >
          {!date ? (
            <div className="h-full min-h-[180px] flex items-center justify-center text-center">
              <p className="text-[11px] text-zinc-400 font-semibold px-4">
                Select a date first to see available time slots
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[230px] overflow-y-auto pr-1">
              {TIME_SLOTS.map((group) => (
                <div key={group.label}>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.slots.map((slot) => {
                      const isSelected = time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => onTimeChange(slot)}
                          className={cn(
                            "h-8 rounded-lg text-[10px] font-bold border transition-all",
                            isSelected
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                          )}
                        >
                          {formatTimeLabel(slot)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {timeError && <p className="text-[10px] font-bold text-red-500">{timeError}</p>}
      </div>
    </div>
  );
}
