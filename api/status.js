// GET /api/status — devuelve el estado del último workflow run de scraping.

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return res.status(500).json({ error: 'Falta GITHUB_TOKEN o GITHUB_REPO' });
  }

  try {
    const resp = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/runs?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!resp.ok) {
      const body = await resp.text();
      return res.status(resp.status).json({ error: `GitHub respondió ${resp.status}`, detail: body });
    }
    const data = await resp.json();
    const run = data.workflow_runs?.[0];
    if (!run) return res.status(200).json({ status: 'idle', message: 'Aún no se corrió ningún scrape' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      status: run.status,                 // queued | in_progress | completed
      conclusion: run.conclusion,         // success | failure | cancelled | null mientras corre
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
