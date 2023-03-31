# dev-dns-server

## Intro

This is a small nodejs script that uses [dns-packet](https://github.com/mafintosh/dns-packet) to implement a simple stub resolver that allows you to override actual responses.

Currently any DNS request that cannot be fulfilled by the override list will be forwarded to a DNS over HTTPS resolver. Future work may make this tool work with the current system resolver to allow network resolution when offline.

## Install

```
git clone https://github.com/valenting/dev-dns-server.git
cd dev-dns-server/
npm install
sudo node index.js
```

By default the server starts on 127.0.42.42 port 52.
To make the DNS server listen on some other port run:
```
node index.js [PORT] [HOSTNAME]
```

For example: `node index.js 4242 0.0.0.0` to listen on port 4242 on all interfaces.
Note that running on a port higher than 999 does not require root permissions


## Overrides

The `overrides.json` config file looks like this:

```json
{
  "doh.test" : {"A" : [{"type": "A", "name": "doh.test", "data": "1.2.3.4"}, {"type": "CNAME", "name": "doh.test", "data": "dns.shaw.ca"}]}
}
```

The resolver will respond to a request of type `A` to `doh.test` with two records: One `A` record containing `1.2.3.4` and one `CNAME` record containing `dns.shaw.ca`.


## Inspect and override DNS requests

### Ubuntu / systemd-resolved

Edit `/etc/systemd/resolved.conf` to use the resolver as a default:
```
DNS=127.0.42.42
Domains=~.
```

Then execute:
```
sudo service systemd-resolved restart # to pickup config changes
resolvectl # to inspect active resolver
sudo node index.js # Make sure the dev-dns-server is running 🙂
```
