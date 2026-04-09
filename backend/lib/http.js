export function setCorsHeaders(response) {
  const origin = process.env.CLIENT_ORIGIN || '*';

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-KEY'
  );
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
}

export function handleCors(request, response) {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return true;
  }

  return false;
}

export function sendJson(response, statusCode, payload) {
  setCorsHeaders(response);
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

export function sendPdf(response, statusCode, buffer, fileName) {
  setCorsHeaders(response);
  response.writeHead(statusCode, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Length': buffer.length,
  });
  response.end(buffer);
}

export function sendError(response, statusCode, message, details = null) {
  sendJson(response, statusCode, {
    error: message,
    details,
  });
}

export async function readJsonBody(request) {
  const chunks = [];
  let totalLength = 0;
  const maxBytes = 1024 * 1024;

  for await (const chunk of request) {
    totalLength += chunk.length;

    if (totalLength > maxBytes) {
      throw new Error('Request body is too large');
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8');

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function getBearerToken(request) {
  const authHeader = request.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
