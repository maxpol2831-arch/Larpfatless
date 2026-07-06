export type AccountAvatar = {
  id: string;
  imageUrl: string;
  label: string;
};

const avatarSpecs = [
  ["nova", "N", "#ffffff", "#0b0b0b", "M42 18h28v28H42z M62 54h28v28H62z"],
  ["orbit", "O", "#f3f3f3", "#111111", "M36 54a34 34 0 1 0 68 0a34 34 0 1 0-68 0 M52 54a18 18 0 1 0 36 0a18 18 0 1 0-36 0"],
  ["pulse", "P", "#ffffff", "#070707", "M32 70h72v12H32z M32 46h72v12H32z M32 22h72v12H32z"],
  ["axis", "A", "#eeeeee", "#141414", "M24 24h80v16H24z M24 68h80v16H24z M48 16h16v80H48z"],
  ["mono", "M", "#f8f8f8", "#0d0d0d", "M28 28h32v32H28z M68 28h32v32H68z M48 68h32v32H48z"],
  ["eclipse", "E", "#ffffff", "#101010", "M64 18a46 46 0 1 0 0 92 30 46 0 1 1 0-92z"],
  ["vector", "V", "#f0f0f0", "#080808", "M24 84 54 24l18 32 32-20-30 60-18-32z"],
  ["halo", "H", "#ffffff", "#161616", "M64 22a42 42 0 1 0 0 84 42 42 0 1 0 0-84 M64 42a22 22 0 1 1 0 44 22 22 0 1 1 0-44"]
] as const;

export const accountAvatars: AccountAvatar[] = avatarSpecs.map(([id, label, foreground, background, path]) => ({
  id,
  label,
  imageUrl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="${background}"/>
      <path d="${path}" fill="${foreground}" opacity="0.94"/>
      <circle cx="96" cy="28" r="10" fill="${foreground}" opacity="0.22"/>
      <text x="64" y="77" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900" fill="${foreground}" opacity="0.92">${label}</text>
    </svg>
  `)
}));

export function getAccountAvatar(seed: string): AccountAvatar {
  return accountAvatars[hashSeed(seed) % accountAvatars.length];
}

export function getAccountAvatarSet(seed: string, count = 5): AccountAvatar[] {
  const start = hashSeed(seed) % accountAvatars.length;
  return Array.from({ length: Math.min(count, accountAvatars.length) }, (_, index) => accountAvatars[(start + index) % accountAvatars.length]);
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}
