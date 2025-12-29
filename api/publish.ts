
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { token, owner, repo, branch, path, message, content } = await request.json();

    if (!token || !owner || !repo || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Validate token format roughly (starts with ghp_ or github_pat_)
    // This is a basic check; GitHub API will do the real check.
    
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // 1. Get file SHA
    let sha = '';
    const getResponse = await fetch(`${baseUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'HGI-Vibe-Builder'
      },
    });

    if (getResponse.ok) {
      const data = await getResponse.json();
      sha = data.sha;
    }

    // 2. Put File
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Ensure UTF-8 safety
      branch,
      ...(sha ? { sha } : {}),
    };

    const putResponse = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'HGI-Vibe-Builder'
      },
      body: JSON.stringify(body),
    });

    if (!putResponse.ok) {
      const err = await putResponse.json();
      return new Response(JSON.stringify({ error: err.message }), { status: putResponse.status });
    }

    const result = await putResponse.json();
    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
