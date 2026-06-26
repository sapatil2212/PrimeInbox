"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, Clock, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoSchedulerProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateError?: string;
  timeError?: string;
}

// 30-minute slots between 09:00 and 18:00 grouped by part of day
const TIME_SLOTS: { label: string; slots: string[] }[] = [
  { label: "Morning", slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  { label: "Afternoon", slots: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"] },
  { label: "Evening", slots: ["16:00", "16:30", "17:00", "17:30", "18:00"] },
];

const DAYS_AHEAD = 60;

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(t: string) {
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

export function DemoScheduler({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: DemoSchedulerProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const dateRef = useClickOutside(() => setDateOpen(false));
  const timeRef = useClickOutside(() => setTimeOpen(false));

  // Upcoming selectable dates (today through DAYS_AHEAD)
  const dateOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list: string[] = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(toISODate(d));
    }
    return list;
  }, []);

  const todayIso = toISODate(new Date());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Date dropdown */}
      <div className="flex flex-col gap-1.5" ref={dateRef}>
        <label className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" /> Choose a date
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDateOpen((o) => !o)}
            className={cn(
              "h-10 w-full pl-3.5 pr-3 rounded-xl border bg-white text-xs font-semibold flex items-center justify-between transition-all",
              dateError ? "border-red-300" : "border-zinc-200/80",
              "focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            )}
          >
            <span className={date ? "text-zinc-800" : "text-zinc-400"}>
              {date ? formatDateLabel(date) : "Select a date"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", dateOpen && "rotate-180")} />
          </button>

          {dateOpen && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto py-1">
                {dateOptions.map((iso) => {
                  const selected = date === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        onDateChange(iso);
                        setDateOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors",
                        selected ? "bg-blue-50 text-blue-700" : "text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <span>
                        {formatDateLabel(iso)}
                        {iso === todayIso && <span className="ml-1.5 text-[9px] text-zinc-400 font-bold">Today</span>}
                      </span>
                      {selected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {dateError && <p className="text-[10px] font-bold text-red-500">{dateError}</p>}
      </div>

      {/* Time dropdown */}
      <div className="flex flex-col gap-1.5" ref={timeRef}>
        <label className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" /> Choose a time
        </label>
        <div className="relative">
          <button
            type="button"
            disabled={!date}
            onClick={() => setTimeOpen((o) => !o)}
            className={cn(
              "h-10 w-full pl-3.5 pr-3 rounded-xl border bg-white text-xs font-semibold flex items-center justify-between transition-all",
              timeError ? "border-red-300" : "border-zinc-200/80",
              "focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30",
              !date && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={time ? "text-zinc-800" : "text-zinc-400"}>
              {time ? formatTimeLabel(time) : date ? "Select a time" : "Pick a date first"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", timeOpen && "rotate-180")} />
          </button>

          {timeOpen && date && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto py-1">
                {TIME_SLOTS.map((group) => (
                  <div key={group.label}>
                    <div className="px-3.5 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/70 sticky top-0">
                      {group.label}
                    </div>
                    {group.slots.map((slot) => {
                      const selected = time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            onTimeChange(slot);
                            setTimeOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors",
                            selected ? "bg-blue-50 text-blue-700" : "text-zinc-700 hover:bg-zinc-50"
                          )}
                        >
                          <span>{formatTimeLabel(slot)}</span>
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {timeError && <p className="text-[10px] font-bold text-red-500">{timeError}</p>}
      </div>
    </div>
  );
}
