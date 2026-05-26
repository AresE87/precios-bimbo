// POST /api/refresh — dispara el workflow de scraping en GitHub.
// Requiere env vars: GITHUB_TOKEN (con scope workflow), GITHUB_REPO (formato "owner/repo").

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return res.status(500).json({ error: 'Falta configurar GITHUB_TOKEN o GITHUB_REPO en Vercel' });
  }

  try {
    const resp = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (resp.status === 204) {
      return res.status(200).json({ ok: true, message: 'Scrape disparado. Tarda ~5 minutos.' });
    }
    const body = await resp.text();
    return res.status(resp.status).json({ ok: false, error: `GitHub respondió ${resp.status}`, detail: body });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
