const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const active = html.replace(/<template\b[\s\S]*?<\/template>/gi, '');
const script = active.match(/<script id="simurgWhoopMobileV8Script">([\s\S]*?)<\/script>/);
assert.ok(script, 'canonical mobile shell script is missing');
const go = script[1].match(/function go\(id,key\)\{([\s\S]*?)\n  \}\n  function setActive/);
assert.ok(go, 'canonical go(id,key) is missing');
const body = go[1];

for (const token of ['closeMenu()', "polarDetail.classList.remove('active')", "document.querySelectorAll('.section.active')", "target.classList.add('active')", "data-simurg-active-screen", "data-simurg-active-key", 'setActive(stableKey)', 'refreshTarget(id)', 'target.scrollTop=0']) {
  assert.ok(body.includes(token), `router step missing: ${token}`);
}
assert.doesNotMatch(body, /window\.show|\bshow\s*\(|window\.scrollTo|requestAnimationFrame|setTimeout/);
assert.ok(body.indexOf('closeMenu()') < body.indexOf("polarDetail.classList.remove('active')"));
assert.ok(body.indexOf("target.classList.add('active')") < body.indexOf('refreshTarget(id)'));
assert.ok(body.indexOf('refreshTarget(id)') < body.indexOf('target.scrollTop=0'));

for (const route of [
  "simurgV8Go('home','home')",
  "simurgV8Go('gym','gym')",
  "simurgV8Go('workout','logger')",
  "simurgV8Go('polar','polar')",
  "simurgV8Go('daily','menu')"
]) assert.ok(active.includes(route), `mobile entry route missing: ${route}`);

const baseShow = active.match(/function show\(id,btn\)\{([\s\S]*?)\n\}/);
assert.ok(baseShow);
assert.match(baseShow[1], /window\.innerWidth>860/);
assert.doesNotMatch(baseShow[1], /if\(window\.innerWidth<=860\)[^\n]*window\.scrollTo/);
assert.match(script[1], /function closeMenu\(\)\{[^}]*classList\.remove\('open'\)[^}]*classList\.remove\('open'\)/);
process.stdout.write('✓ Mobile navigation has one router and section scroll reset\n');
