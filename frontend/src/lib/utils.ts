import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLocation(loc: any) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc.city === 'string') return loc.city;
  if (loc.city && typeof loc.city === 'object') return loc.city.name || loc.city.city || JSON.stringify(loc.city);
  return loc.name || loc.city || JSON.stringify(loc);
}


