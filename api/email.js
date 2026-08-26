// api/email.js
// ============================================================
// VERCEL FUNCTION — ARDHI email relay for @ardhi.org.ug.
// Dependency-free SMTP client (node:net + node:tls, AUTH LOGIN + STARTTLS).
// Env keys (set in Vercel): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
// SMTP_FROM (optional display address, defaults to SMTP_USER).
// ============================================================

import net from 'node:net';
import tls from 'node:tls';

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString();
      if (/\r?\n/.test(buffer) && !/^\d{3}-/m.test(buffer.split(/\r?\n/).slice(-2)[0] || '')) {
        socket.removeListener('data', onData);
        resolve(buffer);
      }
    };
    socket.on('data', onData);
    setTimeout(() => reject(new Error('SMTP read timeout')), 30000);
  });
}

function sendLine(socket, line) {
  return new Promise((resolve, reject) => {
    socket.write(line + '\r\n', (err) => (err ? reject(err) : resolve()));
  });
}

async function smtpSend({ host, port, user, pass, from, to, subject, body }) {
  const connected = await new Promise((resolve, reject) => {
    const sock = net.connect(port, host, () => resolve(sock));
    sock.on('error', reject);
  });

  const read = async (label, sock = connected) => {
    const r = await readResponse(sock);
    if (!/^2\d\d|^3\d\d/.test(r)) throw new Error(`SMTP ${label} failed: ${r.trim()}`);
  };

  try {
    await read('greeting');
    await sendLine(connected, 'EHLO aims.ardhi.org.ug');
    await read('ehlo');

    // STARTTLS upgrade
    await sendLine(connected, 'STARTTLS');
    await read('starttls');
    const secure = await new Promise((resolve, reject) => {
      const tlsSocket = tls.connect({ socket: connected, servername: host }, () => resolve(tlsSocket));
      tlsSocket.on('error', reject);
    });

    await sendLine(secure, 'EHLO aims.ardhi.org.ug');
    await read('ehlo2', secure);

    // AUTH LOGIN
    await sendLine(secure, 'AUTH LOGIN');
    await read('auth', secure);
    await sendLine(secure, Buffer.from(user).toString('base64'));
    await read('user', secure);
    await sendLine(secure, Buffer.from(pass).toString('base64'));
    await read('pass', secure);

    await sendLine(secure, `MAIL FROM:<${from}>`);
    await read('mailfrom', secure);
    await sendLine(secure, `RCPT TO:<${to}>`);
    await read('rcpt', secure);
    await sendLine(secure, 'DATA');
    await read('data', secure);
    const msg = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject.replace(/\r?\n/g, ' ')}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      body,
      '.',
    ].join('\r\n');
    await sendLine(secure, msg);
    await read('send', secure);
    await sendLine(secure, 'QUIT');
    secure.end();
  } finally {
    try { connected.destroy(); } catch { /* ignore */ }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }
  try {
    const { to, subject, body, replyTo } = req.body || {};
    if (!to || !subject) {
      res.status(400).json({ ok: false, error: 'Missing to or subject' });
      return;
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    const from = process.env.SMTP_FROM || user;

    // SMTP not configured yet — client falls back to local mode
    if (!host || !user || !pass) {
      res.status(200).json({ ok: false, error: 'SMTP not configured', message: 'Email queued in local mode.' });
      return;
    }

    await smtpSend({ host, port, user, pass, from, to, subject, body });
    res.status(200).json({ ok: true, message: `Email sent to ${to} via ${host}${replyTo ? ` (reply-to ${replyTo})` : ''}.` });
  } catch (err) {
    console.error('Email Function Error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
}
