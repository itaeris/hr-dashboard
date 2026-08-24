export type PositionTone = {
  bg: string;
  fg: string;
};

const POSITION_TONES: PositionTone[] = [
  { bg: "#F3E0E4", fg: "#6B3340" },
  { bg: "#E3EEEB", fg: "#1F5A54" },
  { bg: "#EBE4F2", fg: "#4A3568" },
  { bg: "#F3EBD8", fg: "#6B4E24" },
  { bg: "#E3EAF3", fg: "#2F4A68" },
  { bg: "#F3E5DA", fg: "#6B3D28" },
  { bg: "#E6F0E2", fg: "#3A5A32" },
  { bg: "#F0E3EB", fg: "#5A3450" },
  { bg: "#E4E8F0", fg: "#3A4560" },
  { bg: "#F0E8D6", fg: "#5C4A28" },
  { bg: "#E2F0F0", fg: "#2A5858" },
  { bg: "#F2E2E0", fg: "#6B3834" },
];

export function positionTone(label: string): PositionTone {
  const key = label.trim().toLowerCase();
  let hash = 5381;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 33 + key.charCodeAt(index)) | 0;
  }
  return POSITION_TONES[Math.abs(hash) % POSITION_TONES.length];
}
