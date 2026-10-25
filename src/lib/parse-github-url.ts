const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** Top-level github.com paths that are not user profiles. */
const RESERVED = new Set([
  "about", "apps", "blog", "collections", "contact", "customer-stories", "enterprise",
  "explore", "features", "issues", "login", "logout", "marketplace", "new", "notifications",
  "orgs", "organizations", "pricing", "pulls", "search", "security", "settings", "signup",
  "site", "sponsors", "team", "topics", "trending", "users", "codespaces", "copilot",
  "dashboard", "events", "readme", "stars",
]);

export type ParseResult = { ok: true; username: string } | { ok: false; error: string };

/** `?year=` value → a year GitHub can have data for (2008 to now), else null for the trailing year. */
export function parseYear(value: string | string[] | null | undefined): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 2008 && n <= new Date().getUTCFullYear() ? n : null;
}

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value) && !RESERVED.has(value.toLowerCase());
}

/**
 * Accepts `https://github.com/user`, `github.com/user`, `www.github.com/user/`,
 * `@user` or a bare `user`, and returns the username.
 */
export function parseGitHubProfile(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Enter a GitHub profile URL." };

  const bare = raw.startsWith("@") ? raw.slice(1) : raw;
  if (!bare.includes("/") && !bare.includes(".")) {
    return isValidUsername(bare)
      ? { ok: true, username: bare }
      : { ok: false, error: "That doesn't look like a valid GitHub username." };
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, error: "That isn't a valid URL." };
  }

  const host = url.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return { ok: false, error: "Only github.com profile URLs are supported." };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { ok: false, error: "Add a username, e.g. https://github.com/username." };
  }
  if (segments.length > 1) {
    return {
      ok: false,
      error: `That looks like a repository or page URL. Try https://github.com/${segments[0]}.`,
    };
  }

  const username = decodeURIComponent(segments[0]);
  if (!isValidUsername(username)) {
    return { ok: false, error: "That doesn't look like a valid GitHub profile URL." };
  }
  return { ok: true, username };
}
