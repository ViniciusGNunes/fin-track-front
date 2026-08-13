export interface IEnumOptions<T = string|number> {
  label: string;
  value: T;
}

export function camelToNormalCase(str: string): string {
  if (!str) return "";

  return (
    str
      // Insert a space before capital letters preceded by lowercase letters or digits
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      // Handle acronyms or consecutive capital letters followed by lowercase (e.g., "parseHTMLString" -> "parse HTML String")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      // Capitalize the very first character and preserve the rest of each word
      .replace(/^./, (char) => char.toUpperCase())
  );
}

export function EnumToList<E extends Record<string, string | number>>(enumObj: E): IEnumOptions[]{
  const items:IEnumOptions[] = Object.keys(enumObj)
    .filter((key) => isNaN(Number(key)))
    .map((key) => ({
      label: key,
      value: enumObj[key]
    }));

  return items;
} 