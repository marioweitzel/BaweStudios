const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 80;
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000';

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

let createProxyMiddleware = null;
try {
  createProxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;
} catch {
  createProxyMiddleware = null;
}

function nativeApiProxy(req, res) {
  const target = new URL(req.originalUrl, BACKEND_URL);
  const client = target.protocol === 'https:' ? https : http;
  const proxyReq = client.request(target, {
    method: req.method,
    headers: { ...req.headers, host: target.host }
  }, proxyRes => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', err => {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });
  req.pipe(proxyReq);
}

if (createProxyMiddleware) {
  app.use('/api', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, pathRewrite: { '^/api': '/api' } }));
  app.use('/socket.io', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, ws: true }));
} else {
  app.use('/api', nativeApiProxy);
}

app.use(express.static(__dirname));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log('Frontend server listening on', PORT, 'proxying to', BACKEND_URL));
