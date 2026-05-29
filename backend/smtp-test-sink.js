// SMTP "sink" minimalista — solo para tests locales.
// Acepta cualquier conexión, responde 250 a todo y vuelca el contenido a stdout.
// NO usar en producción.
const net = require('net');
const PORT = Number(process.env.SINK_PORT || 2525);

let counter = 0;

const server = net.createServer((sock) => {
  let buf = '';
  let inData = false;
  let captured = '';
  sock.write('220 sink.local ESMTP\r\n');
  sock.on('data', (chunk) => {
    buf += chunk.toString('utf8');
    let i;
    while ((i = buf.indexOf('\r\n')) !== -1) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (inData) {
        if (line === '.') {
          counter++;
          console.log('\n===== correo capturado #' + counter + ' =====');
          console.log(captured.slice(0, 800) + (captured.length > 800 ? '\n…(truncado)' : ''));
          console.log('===== fin =====\n');
          captured = '';
          inData = false;
          sock.write('250 OK\r\n');
        } else {
          captured += line + '\n';
        }
        continue;
      }
      const upper = line.toUpperCase();
      if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
        sock.write('250-sink.local\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n');
      } else if (upper.startsWith('AUTH')) {
        sock.write('235 OK\r\n');
      } else if (upper.startsWith('MAIL FROM')) {
        sock.write('250 OK\r\n');
      } else if (upper.startsWith('RCPT TO')) {
        sock.write('250 OK\r\n');
      } else if (upper === 'DATA') {
        inData = true;
        sock.write('354 Send data\r\n');
      } else if (upper === 'QUIT') {
        sock.write('221 Bye\r\n');
        sock.end();
      } else if (upper === 'RSET' || upper === 'NOOP') {
        sock.write('250 OK\r\n');
      } else {
        sock.write('250 OK\r\n');
      }
    }
  });
  sock.on('error', () => {});
});

server.listen(PORT, () => {
  console.log('SMTP sink escuchando en localhost:' + PORT);
});
