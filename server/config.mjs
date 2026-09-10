import path from "node:path"

export function readConfig(env = process.env) {
  const production = env.NODE_ENV === "production"
  const value = env.CMS_ORIGIN || (production ? "" : "http://localhost:5174")
  let origin
  try {
    origin = new URL(value)
    if (
      origin.origin !== value ||
      origin.username ||
      origin.password ||
      !["http:", "https:"].includes(origin.protocol)
    )
      throw new Error("invalid")
  } catch {
    throw new Error(
      "CMS_ORIGIN must be an exact website origin, without a path or trailing slash.",
    )
  }
  if (
    production &&
    (!env.CMS_DATA_DIR ||
      !path.isAbsolute(env.CMS_DATA_DIR) ||
      !env.GITHUB_CLIENT_ID ||
      !env.GITHUB_CLIENT_SECRET ||
      !/^\d+$/.test(env.CMS_OWNER_ID || "") ||
      origin.protocol !== "https:")
  )
    throw new Error(
      "Production requires an absolute persistent CMS_DATA_DIR, HTTPS CMS_ORIGIN, GitHub OAuth credentials, and numeric CMS_OWNER_ID.",
    )
  const directory = path.resolve(env.CMS_DATA_DIR || ".cms-data")
  return {
    production,
    origin: origin.origin,
    directory,
    ownerId: env.CMS_OWNER_ID || "71292747",
    ownerLogin: env.CMS_OWNER_LOGIN || "mhadifilms",
    githubClientId: env.GITHUB_CLIENT_ID,
    githubClientSecret: env.GITHUB_CLIENT_SECRET,
    localCodeFile: path.join(directory, "local-signin-code"),
    dist: path.resolve("dist"),
    trustProxy: production && env.RENDER === "true" ? 1 : false,
  }
}
