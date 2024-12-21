let dnsPacket = require("moz-dns-packet");
const dgram = require('dgram')
const server = dgram.createSocket('udp4');
server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

let PORT = process.argv[2] || 53;
let HOST = process.argv[3] || "127.0.42.42";

server.bind(PORT, HOST);

const requireJSON5 = require("require-json5");
const overrides = requireJSON5("./overrides.json");

server.on('message', (msg, rinfo) => {
  let req = dnsPacket.decode(msg);
  console.log("REQUEST:", req);

  if (overrides[req.questions[0].name]) {
    let answers = [];
    try {
      answers = overrides[req.questions[0].name][req.questions[0].type]
    } catch(e) { console.log(e)};

    let response = {
      type: "response",
      id: req.id,
      questions: req.questions,
      answers: answers,
    };
    console.log(response);

    let resp = dnsPacket.encode(response);

    server.send(resp, 0, resp.length, rinfo.port, rinfo.address);
    return;
  }

  const https = require('https');
  let fwPacket = {
    type: 'query',
    id: 0,
    flags: req.flags,
    questions: req.questions
  }

  const buf = dnsPacket.encode(fwPacket)

  const options = {
    hostname: '1.1.1.1',
    port: 443,
    path: '/dns-query',
    method: 'POST',
    headers: {
      'Content-Type': 'application/dns-message',
      'Content-Length': Buffer.byteLength(buf)
    }
  }

  const request = https.request(options, (response) => {
    response.on('data', (d) => {
      let r = dnsPacket.decode(d);
      r.id = req.id;
      console.log("RESPONSE:",r);

      let resp = dnsPacket.encode(r);
      server.send(resp, 0, resp.length, rinfo.port, rinfo.address);
    })
  })

  request.on('error', (e) => {
    console.error(e)
  })
  request.write(buf)
  request.end()
});
