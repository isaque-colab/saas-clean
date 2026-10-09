exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const rawUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ configured: false, error: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY no Netlify.' }),
    };
  }

  let projectUrl;
  try {
    projectUrl = new URL(rawUrl.trim());
  } catch {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ configured: false, error: 'SUPABASE_URL não é uma URL válida. Copie Project URL nas configurações de API do Supabase.' }),
    };
  }

  if (projectUrl.protocol !== 'https:' || projectUrl.pathname !== '/' || projectUrl.search || projectUrl.hash) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ configured: false, error: 'SUPABASE_URL deve ser somente a Project URL, como https://<id-do-projeto>.supabase.co, sem caminho adicional.' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ configured: true, url: projectUrl.origin, anonKey }),
  };
};
