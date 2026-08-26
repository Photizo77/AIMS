// netlify/functions/email.js
// ============================================================
// ARDHI email relay — sends mail through the organisation's SMTP
// server for @ardhi.org.ug using a dependency-free SMTP client
// (node:net + node:tls, AUTH LOGIN + STARTTLS).
//
// Required environment variables (set in Netlify):
//   SMTP_HOST   e.g. smtp.ardhi.org.ug
//   SMTP_PORT   e.g. 587
//   SMTP_USER   the @ardhi.org.ug account used to send
//   SMTP_PASS   that account's password
//   SMTP_FROM   optional display address, defaults to SMTP_USER
// ============================================================

const net = require('node:net');
const tls = require('node:tls');

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString();
      // A line like "250-..." means more lines follow; "250 ..." ends the response
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

  const responses = [];
  const read = async (label) => {
    const r = await readResponse(connected);
    responses.push(r);
    if (!/^2\d\d|^3\d\d/.test(r)) throw new Error(`SMTP ${label} failed: ${r.trim()}`);
  };

  try {
    await read('greeting');
    await sendLine(connected, `EHLO aims.ardhi.org.ug`);
    await read('ehlo');

    // STARTTLS upgrade
    await sendLine(connected, 'STARTTLS');
    await read('starttls');
    const secure = await new Promise((resolve, reject) => {
      const tlsSocket = tls.connect({ socket: connected, servername: host }, () => resolve(tlsSocket));
      tlsSocket.on('error', reject);
    });

    const tRead = async (label) => {
      const r = await readResponse(secure);
      if (!/^2\d\d|^3\d\d/.test(r)) throw new Error(`SMTP ${label} failed: ${r.trim()}`);
    };
    await sendLine(secure, `EHLO aims.ardhi.org.ug`);
    await tRead('ehlo2');

    // AUTH LOGIN
    await sendLine(secure, 'AUTH LOGIN');
    await tRead('auth');
    await sendLine(secure, Buffer.from(user).toString('base64'));
    await tRead('user');
    await sendLine(secure, Buffer.from(pass).toString('base64'));
    await tRead('pass');

    await sendLine(secure, `MAIL FROM:<${from}>`);
    await tRead('mailfrom');
    await sendLine(secure, `RCPT TO:<${to}>`);
    await tRead('rcpt');
    await sendLine(secure, 'DATA');
    await tRead('data');
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
    await tRead('send');
    await sendLine(secure, 'QUIT');
    secure.end();
    return responses.join('\n');
  } finally {
    try { connected.destroy(); } catch { /* ignore */ }
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
  }
  try {
    const { to, subject, body, replyTo } = JSON.parse(event.body || '{}');
    if (!to || !subject) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing to or subject' }) };
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    const from = process.env.SMTP_FROM || user;

    // SMTP not configured yet — report so the client can use local mode
    if (!host || !user || !pass) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, error: 'SMTP not configured', message: 'Email queued in local mode.' }),
      };
    }

    const detail = await smtpSend({ host, port, user, pass, from, to, subject, body });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: `Email sent to ${to} via ${host} (${replyTo ? 'reply-to ' + replyTo : 'no reply-to'}).` }),
    };
  } catch (err) {
    console.error('Email Function Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message || 'Internal error' }),
    };
  }
};
