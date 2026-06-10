const fs = require("fs");
const css = fs.readFileSync(
  "c:/Users/juand/Desktop/Biblios Madrid/_css_css_styleX.css_v_f553d910f2f2",
  "utf8"
);

function getProps(decl) {
  const o = {};
  decl.split(";").forEach((part) => {
    const i = part.indexOf(":");
    if (i < 0) return;
    o[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  });
  return o;
}

const prefixes = [
  ".c-chip",
  ".c-search_button",
  ".c-modal--cancel",
  ".head_logOut",
  ".head_checkButton",
  ".inputPassBtn",
  ".login_lectorConnect",
  ".c-accordion_btn",
];

for (const p of prefixes) {
  let i = 0;
  const rules = [];
  while ((i = css.indexOf(p, i)) !== -1) {
    const brace = css.indexOf("{", i);
    const end = css.indexOf("}", brace);
    const sel = css.slice(i, brace).trim().replace(/\s+/g, " ");
    const decl = css.slice(brace + 1, end);
    if (sel.length < 150) rules.push({ sel, props: getProps(decl) });
    i = end + 1;
  }
  if (rules.length) {
    console.log("\n## " + p + " (" + rules.length + " rules)");
    rules.slice(0, 6).forEach((r) => {
      console.log(" ", r.sel);
      console.log(" ", JSON.stringify(r.props));
    });
  }
}
