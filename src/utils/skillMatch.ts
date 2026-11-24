// Skill Match % = Math.round((jumlahCocok / totalRequired) * 100), case-insensitive.
export function getSkillMatch(kaptenSkills: string[], requiredSkills: string[]) {
  const mine = new Set(kaptenSkills.map((s) => s.trim().toLowerCase()));
  const matched = requiredSkills.filter((s) => mine.has(s.trim().toLowerCase()));
  const missing = requiredSkills.filter((s) => !mine.has(s.trim().toLowerCase()));
  const score = requiredSkills.length === 0 ? 0 : Math.round((matched.length / requiredSkills.length) * 100);
  return { score, matched, missing };
}
