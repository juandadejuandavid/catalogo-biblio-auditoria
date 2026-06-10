const fs = require("fs");
const path = require("path");

const files = [
  "_css_css_styleX.css_v_f553d910f2f2",
  "_css_css_theme.css_v_f553d910f2f2",
  "_css_css_start.css_v_f553d910f2f2",
  "_css_css_noscript.css_v_f553d910f2f2",
].map((f) => path.join(__dirname, f));

const PROP_KEYS = [
  "background",
  "background-color",
  "color",
  "border",
  "border-color",
  "border-radius",
  "padding",
  "font-size",
  "font-weight",
  "line-height",
  "text-decoration",
  "opacity",
  "box-shadow",
  "cursor",
  "transition",
  "width",
];

function getProps(decl) {
  const o = {};
  decl.split(";").forEach((part) => {
    const i = part.indexOf(":");
    if (i < 0) return;
    const k = part.slice(0, i).trim().toLowerCase();
    const v = part.slice(i + 1).trim();
    if (PROP_KEYS.includes(k)) o[k] = v;
  });
  return o;
}

function extractRules(css) {
  const rules = [];
  let i = 0;
  while ((i = css.indexOf(".c-btn", i)) !== -1) {
    const brace = css.indexOf("{", i);
    const end = css.indexOf("}", brace);
    if (brace < 0 || end < 0) break;
    const sel = css.slice(i, brace).trim().replace(/\s+/g, " ");
    const decl = css.slice(brace + 1, end);
    if (sel.length <= 220) rules.push({ sel, props: getProps(decl) });
    i = end + 1;
  }
  return rules;
}

const modifiers = [
  "c-btn--100",
  "c-btn--basic",
  "c-btn--basic--blue",
  "c-btn--basic--midGrey",
  "c-btn--basic--warn",
  "c-btn--bold",
  "c-btn--disabled",
  "c-btn--disabled--grey",
  "c-btn--flat--blue",
  "c-btn--flat--dark",
  "c-btn--flat--grey",
  "c-btn--normal--blue",
  "c-btn--normal--darkGrey",
  "c-btn--rounded",
  "c-btn--stroked--blue",
  "c-btn--stroked--disabled--grey",
  "c-btn--stroked--grey",
];

let allRules = [];
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const css = fs.readFileSync(f, "utf8");
  allRules = allRules.concat(
    extractRules(css).map((r) => ({ ...r, file: path.basename(f) }))
  );
}

const base = allRules.find((r) => r.sel === ".c-btn");
const report = { base: base?.props || {}, variants: {} };

for (const mod of modifiers) {
  const cls = "." + mod;
  const related = allRules.filter((r) => r.sel.includes(cls));
  const byState = { default: [], hover: [], focus: [], link: [], visited: [], disabled: [], other: [] };
  for (const r of related) {
    let state = "other";
    if (/:hover/.test(r.sel)) state = "hover";
    else if (/:focus/.test(r.sel)) state = "focus";
    else if (/:visited/.test(r.sel)) state = "visited";
    else if (/:link/.test(r.sel)) state = "link";
    else if (/:disabled/.test(r.sel)) state = "disabled";
    else if (r.sel === cls || r.sel.startsWith(cls + ",") || r.sel.endsWith("," + cls) || r.sel.includes(cls + " "))
      state = "default";
    byState[state].push(r);
  }
  const pickDefault =
    byState.default.find((r) => r.sel === cls) ||
    byState.default[0] ||
    related.find((r) => r.sel.includes(cls));
  report.variants[mod] = {
    default: pickDefault?.props || {},
    hover: (byState.hover[0] || byState.focus.find((r) => r.sel.includes(":hover")))?.props,
    focus: byState.focus[0]?.props,
    link: byState.link[0]?.props,
    visited: byState.visited[0]?.props,
    ruleCount: related.length,
    exampleSelector: pickDefault?.sel || related[0]?.sel,
  };
}

// c-btn--100 width rule
const width100 = allRules.find((r) => r.sel.includes("c-btn--100"));
if (width100) report.variants["c-btn--100"].default = width100.props;

// HTML button elements in fetched page
const htmlPath = path.join(__dirname, "_fetch_https___gestiona_comunidad_madrid_biblio_publicas_cgi_bin_ab.txt");
let htmlButtons = [];
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const re = /<button[^>]*class="([^"]*)"[^>]*>/gi;
  let m;
  const combos = new Map();
  while ((m = re.exec(html))) {
    const classes = m[1].split(/\s+/).filter((c) => c.includes("c-btn") || c === "c-btn");
    if (!classes.length) continue;
    const key = classes.sort().join(" ");
    combos.set(key, (combos.get(key) || 0) + 1);
  }
  htmlButtons = [...combos.entries()].sort((a, b) => b[1] - a[1]);
}

fs.writeFileSync(
  path.join(__dirname, "_btn-report.json"),
  JSON.stringify({ report, htmlButtons, totalRules: allRules.length }, null, 2)
);
console.log(JSON.stringify({ report, htmlButtons: htmlButtons.slice(0, 25), totalRules: allRules.length }, null, 2));
