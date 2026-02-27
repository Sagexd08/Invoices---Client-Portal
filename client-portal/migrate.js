const dns = require('dns');
const https = require('https');
const fs = require('fs');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

const NEON_HOST = 'ep-ancient-term-a1bim1wf-pooler.ap-southeast-1.aws.neon.tech';
const CONN_STRING = 'postgresql://neondb_owner:npg_iJ1Pyrg4tVRs@ep-ancient-term-a1bim1wf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

function resolveHost(hostname) {
    return new Promise((resolve, reject) => {
        resolver.resolve4(hostname, (err, addresses) => {
            if (err) {
                resolver.resolve4(hostname.split('.').slice(1).join('.'), (e2, a) => e2 ? reject(e2) : resolve(a[0]));
            } else resolve(addresses[0]);
        });
    });
}

function queryNeon(ip, sqlText) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ query: sqlText, params: [] });
        const req = https.request({
            method: 'POST', hostname: ip, port: 443, path: '/sql',
            servername: NEON_HOST,
            headers: {
                'Host': NEON_HOST,
                'Content-Type': 'application/json',
                'Neon-Connection-String': CONN_STRING,
                'Content-Length': Buffer.byteLength(payload),
            },
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
                else { try { resolve(JSON.parse(data)); } catch { resolve(data); } }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function run() {
    const file = process.argv[2];
    if (!file) { console.error('Usage: node migrate.js <sql-file>'); process.exit(1); }

    console.log(`Migrating: ${file}`);
    const ip = await resolveHost(NEON_HOST);
    console.log(`Resolved: ${ip}\n`);

    let sql = fs.readFileSync(file, 'utf8');
    if (sql.charCodeAt(0) === 0xFEFF) sql = sql.substring(1);

    const stmts = sql
        .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
        .split(';').map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Executing ${stmts.length} statements...\n`);
    let ok = 0, failed = 0;
    for (let i = 0; i < stmts.length; i++) {
        try {
            await queryNeon(ip, stmts[i]);
            console.log(`  ✅ ${i + 1}/${stmts.length}`);
            ok++;
        } catch (err) {
            if (err.message.includes('already exists')) { console.log(`  ⏭  ${i + 1}/${stmts.length} (already exists)`); ok++; }
            else { console.error(`  ❌ ${i + 1}/${stmts.length}: ${err.message.substring(0, 120)}`); failed++; }
        }
    }
    console.log(`\n─── Done: ${ok} OK, ${failed} failed ───`);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
