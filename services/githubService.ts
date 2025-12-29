
export interface GitHubPushConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  message: string;
  content: string;
}

export const createRepository = async (token: string, name: string, description: string) => {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: false, // Pages usually requires public for free accounts
      auto_init: true // Create README to init branch
    }),
  });

  if (!response.ok && response.status !== 422) { // 422 implies it might already exist
    const error = await response.json();
    throw new Error(error.message || 'Error creating repository');
  }
  
  return response.status === 422 ? 'exists' : 'created';
};

export const pushToGitHub = async (config: GitHubPushConfig) => {
  const { token, owner, repo, branch, path, message, content } = config;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // 1. Get file SHA if it exists (to update)
  let sha = '';
  try {
    const getResponse = await fetch(`${baseUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (getResponse.ok) {
      const data = await getResponse.json();
      sha = data.sha;
    }
  } catch (e) {
    // File likely doesn't exist, proceed with create
    console.warn("File check failed, assuming new file", e);
  }

  // 2. Encode content to Base64 (Unicode safe)
  const base64Content = btoa(unescape(encodeURIComponent(content)));

  // 3. Create or Update file
  const body = {
    message: message,
    content: base64Content,
    branch: branch,
    ...(sha ? { sha } : {}),
  };

  const putResponse = await fetch(baseUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!putResponse.ok) {
    const error = await putResponse.json();
    throw new Error(error.message || 'Failed to push to GitHub');
  }

  return await putResponse.json();
};
