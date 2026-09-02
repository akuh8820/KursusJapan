export type StrokeData = {
  char: string;
  source: "kana" | "kanji";
  viewBox: string;
  strokes: { i: number; d: string }[];
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

function hexOf(char: string): string {
  const code = char.codePointAt(0);
  if (code === undefined) return "00000";
  return code.toString(16).padStart(5, "0");
}

export function getStrokeData(char: string): Promise<StrokeData | null> {
  const hex = hexOf(char);
  const url = `${BASE_PATH}/data/stroke/${hex}.json`;

  return fetch(url)
    .then((res) => {
      if (!res.ok) return null;
      return res.json() as Promise<StrokeData>;
    })
    .catch(() => null);
}

export function isHiragana(char: string): boolean {
  const code = char.codePointAt(0);
  if (code === undefined) return false;
  return code >= 0x3040 && code <= 0x309f;
}

export function isKatakana(char: string): boolean {
  const code = char.codePointAt(0);
  if (code === undefined) return false;
  return code >= 0x30a0 && code <= 0x30ff;
}

export { hexOf };