import { checkPassword, signToken, getBody, rateLimit, clientIp, type VercelReq, type VercelRes } from "./_lib.js";

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    res.status(500).json({ error: "Server auth not configured (ADMIN_PASSWORD / SESSION_SECRET)" });
    return;
  }

  // Brute-force brake: 5 attempts per IP per 10 minutes.
  if (!rateLimit(`login:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts — try again later" });
    return;
  }

  const { password } = await getBody<{ password?: string }>(req);
  if (!checkPassword(password)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.status(200).json({
    token: signToken(),
    repo: process.env.GITHUB_REPO ?? null,
    hasAI: !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY),
  });
}
