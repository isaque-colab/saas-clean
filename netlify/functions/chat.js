const DEFAULT_API_KEY = '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';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const prompt = (payload.message || '').trim();

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Mensagem obrigatória.' }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    const apiKey = process.env.NVAPI_KEY || DEFAULT_API_KEY;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'Você é o assistente de IA da Fluxo, especializado em SaaS, finanças, vendas e onboarding para clientes. Responda de forma útil, curta e prática em português.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 450,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || 'Falha ao consultar a IA';
      return {
        statusCode: response.status || 500,
        body: JSON.stringify({ error: message }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    const answer = data?.choices?.[0]?.message?.content || 'Não consegui responder agora.';

    return {
      statusCode: 200,
      body: JSON.stringify({ answer }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Erro interno do servidor.' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
