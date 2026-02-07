const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.hrcopilot.fuamthz.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('DNS Error:', err);
        return;
    }
    console.log('Addresses:', addresses);
});
