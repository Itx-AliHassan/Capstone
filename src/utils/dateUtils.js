import { format, formatDistanceToNow, isPast, isToday, addDays, isValid } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '';
  const d = new Date(date);
  if (!isValid(d)) return '';
  return format(d, formatStr);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isDueSoon = (date) => {
  if (!date) return false;
  const d = new Date(date);
  if (!isValid(d)) return false;
  const threeDaysFromNow = addDays(new Date(), 3);
  return !isPast(d) && d <= threeDaysFromNow;
};

export const isOverdue = (date, completed = false) => {
  if (!date || completed) return false;
  const d = new Date(date);
  if (!isValid(d)) return false;
  return isPast(d) && !isToday(d);
};
