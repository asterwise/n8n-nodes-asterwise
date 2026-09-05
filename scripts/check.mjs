// Structural check of the compiled node and credential: loads them the way n8n does and
// verifies every operation routes to a real endpoint and every body field has a route.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const { Asterwise } = require('../' + pkg.n8n.nodes[0]);
const { AsterwiseApi } = require('../' + pkg.n8n.credentials[0]);

const node = new Asterwise().description;
const cred = new AsterwiseApi();
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };

if (node.name !== 'asterwise' || !node.usableAsTool) fail('node identity');
if (node.credentials[0].name !== cred.name) fail('credential name mismatch');
if (!cred.authenticate.properties.headers.Authorization.includes('Bearer')) fail('bearer auth');
if (cred.test.request.url !== '/v1/numerology/life-path') fail('credential test endpoint');

const opProps = node.properties.filter((p) => p.name === 'operation');
const opProp = { options: opProps.flatMap((p) => p.options) };
const ops = opProp.options.map((o) => o.value);
const resources = node.properties.find((p) => p.name === 'resource').options.map((o) => o.value);
if (opProps.length !== resources.length) fail('one operation list per resource');
const expected = ['natalChart', 'westernNatalChart', 'matchmaking', 'panchanga', 'numerologyProfile', 'raw'];
if (ops.length !== expected.length || expected.some((e) => !ops.includes(e))) fail('operations ' + ops);
for (const o of opProp.options) {
  if (!o.routing?.request?.url) fail('no route for ' + o.value);
  if (o.value !== 'raw' && !o.routing.request.url.startsWith('/v1/')) fail('bad url ' + o.routing.request.url);
}
const bodyProps = node.properties.filter((p) => p.routing?.send?.type === 'body');
const byOp = {};
for (const p of bodyProps) for (const op of p.displayOptions.show.operation) (byOp[op] ??= []).push(p.routing.send.property);
const need = {
  natalChart: ['date', 'time', 'location', 'name', 'ayanamsa', 'include_interpretation'],
  westernNatalChart: ['date', 'time', 'location', 'name', 'house_system'],
  matchmaking: ['person1.date', 'person1.time', 'person1.location', 'person1.name', 'person2.date', 'person2.time', 'person2.location', 'person2.name'],
  panchanga: ['date', 'location', 'ayanamsa'],
  numerologyProfile: ['name', 'date'],
};
for (const [op, fields] of Object.entries(need)) for (const f of fields) if (!byOp[op]?.includes(f)) fail(`${op} missing body field ${f}`);
const names = node.properties.map((p) => p.name);
const dupes = names.filter((n, i) => names.indexOf(n) !== i && n !== 'operation');
if (dupes.length) fail('duplicate property names: ' + dupes);
console.log(`ok: ${ops.length} operations, ${bodyProps.length} routed body fields, credential test on ${cred.test.request.url}`);
