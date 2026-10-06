const colors = ["#5A67D8", "#2E8456", "#C0612B", "#7652C2", "#1E8580", "#B93D68"];

export function avatarColor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % colors.length;
  return colors[hash] ?? colors[0];
}
