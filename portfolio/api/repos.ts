import { requireAuth, type VercelReq, type VercelRes } from "./_lib.js";
import { GH, ghHeaders, allowedOwner } from "./_github.js";

// List repos for the authenticated PAT user (owner + collaborator + org),
// falling back to a public listing for the CONFIGURED owner when the PAT is absent.
export default async function handler(req: VercelReq, res: VercelRes) {
  if (!requireAuth(req, res)) return;

  // Owner is pinned to GITHUB_REPO's owner — the client cannot enumerate arbitrary users.
  const owner = allowedOwner() || "";

  const hasPat = !!process.env.GITHUB_PAT;
  const url = hasPat
    ? `${GH}/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100`
    : `${GH}/users/${encodeURIComponent(owner)}/repos?sort=updated&per_page=100`;

  const r = await fetch(url, { headers: ghHeaders() });
  if (!r.ok) {
    res.status(r.status).json({ error: `GitHub API ${r.status}` });
    return;
  }
  const raw = (await r.json()) as Array<{
    full_name: string;
    name: string;
    description: string | null;
    owner?: { login: string };
  }>;

  const result = raw.map((x) => ({
    full_name: x.full_name,
    name: x.name,
    description: x.description,
    type:
      x.owner && owner && x.owner.login.toLowerCase() === owner.toLowerCase()
        ? ("owner" as const)
        : hasPat
        ? ("contributed" as const)
        : ("owner" as const),
  }));
  res.status(200).json({ repos: result });
}
