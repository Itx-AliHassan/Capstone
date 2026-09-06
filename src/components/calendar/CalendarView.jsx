import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { Badge } from '../common/Badge';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const CalendarView = ({ onTaskClick }) => {
  const { tasks } = useSelector((state) => state.tasks);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const parseSafeDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d : null;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const priorityColors = {
    urgent: 'bg-rose-500 text-white',
    high: 'bg-amber-500 text-white',
    medium: 'bg-indigo-500 text-white',
    low: 'bg-slate-400 text-white',
  };

  const scheduledTasks = tasks.filter((t) => parseSafeDate(t.dueDate) !== null);
  const unscheduledTasks = tasks.filter((t) => parseSafeDate(t.dueDate) === null);

  return (
    <div id="calendar-view-container" className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 id="calendar-month-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>

        <div className="flex items-center gap-1.5">
          <button
            id="calendar-today-btn"
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
          <button
            id="calendar-prev-month-btn"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
          <button
            id="calendar-next-month-btn"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Container */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = scheduledTasks.filter((t) => {
              const d = parseSafeDate(t.dueDate);
              return d && isSameDay(d, day);
            });
            const inMonth = isSameMonth(day, monthStart);
            const today = isToday(day);

            return (
              <div
                key={dateKey}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  !inMonth
                    ? 'bg-slate-50/40 dark:bg-slate-950/20 text-slate-300 dark:text-slate-600'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      today
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[85px]">
                  {dayTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => onTaskClick(t)}
                      className={`p-1 px-1.5 rounded-md text-[11px] font-semibold truncate cursor-pointer shadow-2xs hover:opacity-90 transition-all ${
                        priorityColors[t.priority] || 'bg-slate-500 text-white'
                      }`}
                      title={`${t.title} (${t.priority})`}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks Section */}
      <div id="unscheduled-tasks-section" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Unscheduled Tasks ({unscheduledTasks.length})
            </h4>
            <span className="text-[11px] text-slate-400">Tasks without a due date</span>
          </div>
        </div>

        {unscheduledTasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">All tasks have due dates assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unscheduledTasks.map((t) => (
              <button
                key={t._id}
                onClick={() => onTaskClick(t)}
                className="flex items-center gap-2 p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:border-indigo-500 transition-all text-left group cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full ${
                  t.priority === 'urgent' ? 'bg-rose-500' : t.priority === 'high' ? 'bg-amber-500' : 'bg-indigo-500'
                }`} />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[180px]">
                  {t.title}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {t.status.replace('col-', '')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
