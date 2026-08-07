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
