export type AccountAvatar = {
  id: string;
  imageUrl: string;
};

const avatarSpecs = [
  ["nova", "#ffffff", "#0b0b0b", "M36 32h24v24H36z M68 32h24v24H68z M52 68h24v24H52z"],
  ["orbit", "#f3f3f3", "#111111", "M64 24a40 40 0 1 0 0 80 40 40 0 1 0 0-80 M64 42a22 22 0 1 1 0 44 22 22 0 1 1 0-44"],
  ["pulse", "#ffffff", "#070707", "M30 72h68v12H30z M30 52h68v12H30z M30 32h68v12H30z"],
  ["axis", "#eeeeee", "#141414", "M24 28h80v14H24z M24 72h80v14H24z M57 18h14v92H57z"],
  ["mono", "#f8f8f8", "#0d0d0d", "M28 30h30v30H28z M70 30h30v30H70z M49 72h30v30H49z"],
  ["eclipse", "#ffffff", "#101010", "M66 18a46 46 0 1 0 0 92 30 46 0 1 1 0-92z"],
  ["vector", "#f0f0f0", "#080808", "M24 84 54 24l18 32 32-20-30 60-18-32z"],
  ["halo", "#ffffff", "#161616", "M64 22a42 42 0 1 0 0 84 42 42 0 1 0 0-84 M64 42a22 22 0 1 1 0 44 22 22 0 1 1 0-44"]
] as const;

export const accountAvatars: AccountAvatar[] = avatarSpecs.map(([id, foreground, background, path]) => ({
  id,
  imageUrl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="${background}"/>
      <path d="${path}" fill="${foreground}" opacity="0.94"/>
      <circle cx="96" cy="28" r="10" fill="${foreground}" opacity="0.22"/>
    </svg>
  `)
}));

export function getAccountAvatar(seed: string): AccountAvatar {
  return accountAvatars[hashSeed(seed) % accountAvatars.length];
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
