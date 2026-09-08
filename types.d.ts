declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None';
    [property: string]: unknown;
  }

  interface CookiesStatic {
    set(name: string, value: string, options?: CookieAttributes): string | undefined;
    get(name: string): string | undefined;
    get(): { [key: string]: string };
    remove(name: string, options?: CookieAttributes): void;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
}
