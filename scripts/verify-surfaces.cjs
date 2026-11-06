/* Domain -> app map contract for src/utils/surface.ts (no browser needed). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { resolveSurface: s, canonicalStudioUrl } = require('../src/utils/surface.ts');

const cases = [
  // Production hostnames
  ['danavago.com', '/', 'website'],
  ['www.danavago.com', '/', 'website'],
  ['DANAVAGO.COM.', '/', 'website'],
  ['app.danavago.com', '/', 'appgo'],
  ['app.danavago.com', '/manage', 'appgo'],
  ['studio.danavago.com', '/', 'studio'],
  ['studio.danavago.com', '/manage/trips', 'studio'],
  ['admin.danavago.com', '/', 'studio'],
  ['danava.com', '/nha-xe/cua-ong-limousine', 'profile'],
  // Existing paths on the marketplace host keep working
  ['danavago.com', '/manage', 'studio'],
  ['danavago.com', '/admin', 'studio'],
  ['danavago.com', '/administrator', 'website'],
  ['danavago.com', '/nha-xe/cua-ong-limousine', 'profile'],
  ['danavago.com', '/appgo', 'appgo'],
  ['danavago.com', '/app', 'operator-app'],
  ['danavago.com', '/app/cua-ong-limousine', 'operator-app'],
  ['danavago.com', '/apple', 'website'],
  // Tenant hosts always get the tenant app, never Studio or another operator's profile
  ['cuaonglimousine.danavago.com', '/', 'operator-app'],
  ['app.nhaxe.vn', '/', 'operator-app'],
  ['app.nhaxe.vn', '/manage', 'operator-app'],
  ['app.nhaxe.vn', '/nha-xe/other-operator', 'operator-app'],
  // Local development
  ['localhost', '/', 'website'],
  ['localhost', '/appgo', 'appgo'],
  ['localhost', '/manage', 'studio'],
  ['127.0.0.1', '/app/cua-ong-limousine', 'operator-app'],
];
for (const [host, path, expected] of cases) {
  assert.equal(s(host, path), expected, `${host}${path} -> ${expected}`);
}
assert.equal(s('app.staging.example', '/', 'staging.example'), 'appgo', 'custom root via VITE_APP_ROOT');
assert.equal(s('studio.staging.example', '/', 'staging.example'), 'studio', 'custom root studio');
assert.equal(s('app.danavago.com', '/', 'staging.example'), 'operator-app', 'other root is a tenant host');
// /admin and admin.{root} are aliases of the single Studio (/manage, studio.{root}).
const loc = (href) => { const u = new URL(href); return { protocol: u.protocol, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash }; };
const redirects = [
  ['http://localhost:5173/admin', '/manage'],
  ['http://localhost:5173/admin/trips?x=1#a', '/manage/trips?x=1#a'],
  ['https://danavago.com/admin', '/manage'],
  ['https://admin.danavago.com/', 'https://studio.danavago.com/'],
  ['https://admin.danavago.com/admin/staff', 'https://studio.danavago.com/manage/staff'],
  ['https://danavago.com/manage', null],
  ['https://studio.danavago.com/', null],
  ['https://danavago.com/administrator', null],
  ['https://app.nhaxe.vn/admin', null], // tenant host: never redirected into Studio
];
for (const [href, expected] of redirects) assert.equal(canonicalStudioUrl(loc(href)), expected, `${href} -> ${expected}`);
console.log(JSON.stringify({ passed: cases.length + 3 + redirects.length }));
