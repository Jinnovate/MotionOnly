export const LEVELS = [
  { level: 1, name: "Starting Line", xp: 0 },
  { level: 2, name: "Foundation", xp: 150 },
  { level: 3, name: "Rhythm", xp: 350 },
  { level: 4, name: "Operator", xp: 650 },
  { level: 5, name: "Pacesetter", xp: 1050 },
  { level: 6, name: "Force", xp: 1600 },
  { level: 7, name: "Vanguard", xp: 2300 },
  { level: 8, name: "Apex", xp: 3200 }
] as const;

export const MOMENTUM_SOURCES = {
  priorityMotion: { label: "Priority move completed", momentum: 12, xp: 5, dailyCap: 3 },
  standardCheckin: { label: "Daily standard kept", momentum: 8, xp: 3, dailyCap: 3 },
  goalProgress: { label: "Meaningful goal progress", momentum: 6, xp: 5, dailyCap: 3 },
  projectContribution: { label: "Project contribution", momentum: 5, xp: 4, dailyCap: 2 },
  weeklyReview: { label: "Weekly review completed", momentum: 10, xp: 10, dailyCap: 1 }
} as const;

export function getLevel(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const level of LEVELS) if (xp >= level.xp) current = level;
  const next = LEVELS.find(level => level.xp > xp);
  const earnedWithinLevel = xp - current.xp;
  const requiredWithinLevel = next ? next.xp - current.xp : 1;
  return {
    ...current,
    next,
    progress: next ? Math.round((earnedWithinLevel / requiredWithinLevel) * 100) : 100,
    xpToNext: next ? next.xp - xp : 0
  };
}

export function getMomentumStage(points: number) {
  if (points >= 100) return { name: "Full Motion", index: 4 };
  if (points >= 75) return { name: "Driving", index: 3 };
  if (points >= 50) return { name: "Moving", index: 2 };
  if (points >= 25) return { name: "Building", index: 1 };
  return { name: "Ignition", index: 0 };
}

export function weeklyMomentumBonus(currentStreak: number) {
  return Math.min(200, 100 + currentStreak * 25);
}

export function clampMomentum(points: number) {
  return Math.max(0, Math.min(100, points));
}
