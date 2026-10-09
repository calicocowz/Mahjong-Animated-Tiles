/*! lines-tiles.js 1.5.0 -- animated mahjong tiles in the style of Lines. No dependencies.
 *
 *   <script src="lines-tiles.js"></script>
 *   <lines-tile set="flair" tile="5p"></lines-tile>                    one tile
 *   <lines-hand set="sheet" tiles="123m 406p 789s 11z"></lines-hand>   a hand
 *   el.innerHTML = LinesTiles.svg("flair", "7z", { size: 48 });        markup string
 *
 * set:    the tile sets in this file (LinesTiles.sets lists them):
 *           road   -- soft white roads on a dark tile, with room to breathe; every coin is the car
 *           sheet  -- the Lines editor in ink; the lines boil like hand-drawn animation
 *           garden -- a flower bed for every number, jointed bamboo, a house sparrow
 *           flair  -- neon on a dark tile: crisp marks, a soft glow, a slow sheen
 *           block  -- the 3D view: every mark a softly extruded block, with room to breathe
 * tile:   1m-9m 1p-9p 1s-9s, 0m 0p 0s (red fives), 1z-7z (East South West North
 *         White Green Red), or "back"
 * tiles:  (lines-hand) the usual notation, e.g. "123m456p789s1122z"; a space
 *         leaves a gap, as before a drawn tile
 * size:   tile width in px (default 48); the height follows (86/60)
 * motion: "on" (default) | "hover" (moves only under the pointer) | "off";
 *         a visitor who asks their system for reduced motion always gets still tiles
 *
 * Every drawing here is original vector code. The tile system itself (suits,
 * honours and the traditional arrangement of dots and sticks) is centuries old
 * and in the public domain; nothing is traced or copied from any commercial tile
 * art. Fonts are loaded from Google Fonts, all under the SIL Open Font License
 * 1.1, and only the families the sets in this file use:
 *           Dela Gothic One
 *           Zen Kurenaido
 *           DotGothic16
 *           M PLUS 1p
 * Set window.LinesTilesNoFonts = true before loading to host the fonts yourself.
 */
(function (root) {
  "use strict";

  var VERSION = "1.5.0";
  var KANJI = ["\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b", "\u4e5d"];
  var HON = ["\u6771", "\u5357", "\u897f", "\u5317", "\u767d", "\u767c", "\u4e2d"];
  var MAN = "\u842c";
  var HON_WORDS = ["East", "South", "West", "North", "White dragon", "Green dragon", "Red dragon"];
  var SUIT_WORDS = { m: "man", p: "pin", s: "sou" };
  var FONT = {
    dela: "'Dela Gothic One','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif",
    zen: "'Zen Kurenaido','Hiragino Maru Gothic ProN','Yu Gothic',sans-serif",
    dot: "'DotGothic16','MS Gothic','Osaka-Mono',monospace",
    mplus: "'M PLUS 1p','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif",
  };
  var FAMILY = {                    // the Google Fonts query for each font above
    dela: "Dela+Gothic+One",
    zen: "Zen+Kurenaido",
    dot: "DotGothic16",
    mplus: "M+PLUS+1p:wght@800",
  };

  // The traditional arrangements: [x, y, radius, colour role] on a 60 x 80 face.
  var PIN = {
    2: [[30, 22, 10, "G"], [30, 58, 10, "B"]],
    3: [[15, 17, 9, "B"], [30, 40, 9, "R"], [45, 63, 9, "G"]],
    4: [[18, 23, 9, "B"], [42, 23, 9, "G"], [18, 57, 9, "G"], [42, 57, 9, "B"]],
    5: [[17, 18, 8.4, "B"], [43, 18, 8.4, "G"], [30, 40, 8.4, "R"], [17, 62, 8.4, "G"], [43, 62, 8.4, "B"]],
    6: [[19, 15, 8, "G"], [41, 15, 8, "G"], [19, 43, 8, "R"], [41, 43, 8, "R"], [19, 65, 8, "R"], [41, 65, 8, "R"]],
    7: [[13, 12, 7, "G"], [30, 20, 7, "G"], [47, 28, 7, "G"], [19, 48, 7.5, "R"], [41, 48, 7.5, "R"], [19, 67, 7.5, "R"], [41, 67, 7.5, "R"]],
    8: [13, 31, 49, 67].reduce(function (a, y) { return a.concat([[19, y, 7.6, "B"], [41, y, 7.6, "B"]]); }, []),
    9: [[16, "B"], [40, "R"], [64, "G"]].reduce(function (a, r) {
      return a.concat([[13, r[0], 7.4, r[1]], [30, r[0], 7.4, r[1]], [47, r[0], 7.4, r[1]]]);
    }, [])
  };
  // Sticks: [x, y, length, colour role, rotation].
  var SOU = {
    2: [[30, 22, 24, "B", 0], [30, 58, 24, "G", 0]],
    3: [[30, 22, 24, "G", 0], [19, 58, 24, "B", 0], [41, 58, 24, "B", 0]],
    4: [[19, 22, 24, "G", 0], [41, 22, 24, "B", 0], [19, 58, 24, "B", 0], [41, 58, 24, "G", 0]],
    5: [[15, 22, 24, "G", 0], [45, 22, 24, "B", 0], [30, 40, 24, "R", 0], [15, 58, 24, "B", 0], [45, 58, 24, "G", 0]],
    6: [16, 30, 44].reduce(function (a, x) { return a.concat([[x, 22, 24, "G", 0], [x, 58, 24, "B", 0]]); }, []),
    7: [[30, 13, 18, "R", 0]].concat([16, 30, 44].reduce(function (a, x) {
      return a.concat([[x, 40, 18, "G", 0], [x, 66, 18, "B", 0]]);
    }, [])),
    // 8 sou as on the real tile: straight outer sticks; the inner pair leans into a peak above and a V
    // below, so together they make a diamond; all one colour
    8: [[11, 22, 24, "G", 0], [22.5, 22, 24, "G", 20], [37.5, 22, 24, "G", -20], [49, 22, 24, "G", 0],
        [11, 58, 24, "G", 0], [22.5, 58, 24, "G", -20], [37.5, 58, 24, "G", 20], [49, 58, 24, "G", 0]],
    9: [14, 40, 66].reduce(function (a, y) {
      return a.concat([[15, y, 20, "G", 0], [30, y, 20, "R", 0], [45, y, 20, "B", 0]]);
    }, [])
  };

  // ---- tiny SVG writer -------------------------------------------------------
  var uid = 0;
  function n2(v) { return typeof v === "number" ? Math.round(v * 100) / 100 : v; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function at(o) {
    var s = "";
    for (var k in o) {
      var v = o[k];
      if (v === undefined || v === null || v === false || v === "") continue;
      s += " " + k + '="' + esc(n2(v)) + '"';
    }
    return s;
  }
  function common(o) {
    return {
      fill: o.fill || "none", stroke: o.stroke, "stroke-width": o.sw, "stroke-dasharray": o.dash,
      "stroke-linecap": o.lc, "stroke-linejoin": o.lj, opacity: o.op, transform: o.tf,
      "class": o.cls, style: o.st, pathLength: o.pl
    };
  }
  function merge(a, b) { for (var k in b) a[k] = b[k]; return a; }
  function R(x, y, w, h, o) { o = o || {}; return "<rect" + at(merge({ x: x, y: y, width: w, height: h, rx: o.rx }, common(o))) + "/>"; }
  function C(cx, cy, r, o) { o = o || {}; return "<circle" + at(merge({ cx: cx, cy: cy, r: r }, common(o))) + "/>"; }
  function P(d, o) { o = o || {}; return "<path" + at(merge({ d: d }, common(o))) + "/>"; }
  function T(x, y, s, o) {
    o = o || {};
    return "<text" + at(merge({ x: x, y: y, "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": o.font, "font-size": o.size, "font-weight": o.weight }, common(o))) + ">" + esc(s) + "</text>";
  }
  function G(inner, o) {
    o = o || {};
    return "<g" + at({ "class": o.cls, style: o.st, transform: o.tf, "clip-path": o.clip, opacity: o.op }) + ">" + inner + "</g>";
  }
  function delay(i, period) { return "animation-delay:-" + n2((i * 0.37) % (period || 2)) + "s"; }
  function roleColour(c, role, red) { return red ? c.red : c.roles[role]; }
  function E(cx, cy, rx, ry, o) { o = o || {}; return "<ellipse" + at(merge({ cx: cx, cy: cy, rx: rx, ry: ry }, common(o))) + "/>"; }

  // ---- the sparrow: every set's 1 sou, one simple drawing that each set dresses ----------
  var SPARROW = {
    tail: "M 21 51 L 8 62 L 12 64.5 L 25 56 Z",
    body: "M 31 31 C 24 33 18 40 18 48 C 18 56 26 61 34 60 C 42 59 47 51 46 43 C 45 37 42 33 38 32 Z",
    wing: "M 38 39 C 31 36 22 41 18 50 C 25 51.5 33 50 38.5 45 Z",
    streaks: "M 34 41 L 25 47 M 36.5 44 L 28 49",
    cap: "M 30.54 28.55 A 7.6 7.6 0 0 1 45.48 28.68 C 41 25.8 35 25.8 30.54 28.55 Z",
    bib: "M 44 33.5 C 43.5 37 41 39.5 38 39.5 C 39.5 37.5 41.5 35 42.5 33 Z",
    beak: "M 45 29.5 L 50.5 31.2 L 45 33 Z",
    legs: "M 30 59.5 L 29 64.8 M 35 59.5 L 35 64.8 M 26.5 64.8 L 31 64.8 M 33 64.8 L 37.5 64.8"
  };
  // p: colours for tail, body, wing, streak, head, cap, cheek, bib, beak, eye, glint, legs (leave any out);
  // o.line + o.lw: an outline round the big shapes; o.glow: a soft halo behind them
  function sparrow(p, o) {
    o = o || {};
    var shape = { stroke: o.line, sw: o.lw, lj: "round", lc: "round" }, s = "";
    if (o.glow) {
      var halo = { stroke: o.glow, sw: 4.6, op: 0.16, lj: "round" };
      s += P(SPARROW.tail, halo) + P(SPARROW.body, halo) + C(38, 30, 7.6, halo);
    }
    s += P(SPARROW.tail, merge({ fill: p.tail }, shape)) + P(SPARROW.body, merge({ fill: p.body }, shape)) +
      P(SPARROW.wing, merge({ fill: p.wing }, shape));
    if (p.streak) s += P(SPARROW.streaks, { stroke: p.streak, sw: 0.9, lc: "round" });
    s += C(38, 30, 7.6, merge({ fill: p.head }, shape));
    if (p.cap) s += P(SPARROW.cap, { fill: p.cap });
    if (p.cheek) s += E(38.6, 33.2, 3.9, 2.3, { fill: p.cheek });
    if (p.bib) s += P(SPARROW.bib, { fill: p.bib });
    s += P(SPARROW.beak, { fill: p.beak, stroke: o.line, sw: o.lw ? n2(o.lw * 0.6) : undefined, lj: "round" });
    s += C(40.2, 29.2, 1.35, { fill: p.eye });
    if (p.glint) s += C(40.6, 28.8, 0.42, { fill: p.glint });
    if (p.legs) s += P(SPARROW.legs, { stroke: p.legs, sw: 1.1, lc: "round" });
    return s;
  }
  function skew(x, y, deg) { return "translate(" + x + " " + y + ") skewX(" + deg + ") translate(" + (-x) + " " + (-y) + ")"; }
  // A rounded rectangle as a path, so pathLength (and so a travelling dash) behaves the same in every browser.
  function roundRectD(x, y, w, h, r) {
    return "M " + n2(x + r) + " " + n2(y) + " H " + n2(x + w - r) + " A " + r + " " + r + " 0 0 1 " + n2(x + w) + " " + n2(y + r) +
      " V " + n2(y + h - r) + " A " + r + " " + r + " 0 0 1 " + n2(x + w - r) + " " + n2(y + h) +
      " H " + n2(x + r) + " A " + r + " " + r + " 0 0 1 " + n2(x) + " " + n2(y + h - r) +
      " V " + n2(y + r) + " A " + r + " " + r + " 0 0 1 " + n2(x + r) + " " + n2(y) + " Z";
  }

  // ---- the sets -------------------------------------------------------------
  var S = {};

  // ROAD -- soft white roads on a dark tile; the coin is the car. Calm by design: the marks sit
  // inside a margin (inset), nothing on them moves, and the only motion on a numbered tile is one
  // dim light lapping the tile's rim, like a car on a track, each tile at its own moment.
  S.road = {
    fonts: ["dela"],
    inset: 0.88,                      // the marks are drawn at 88% around the centre: room to breathe
    rim: 0.4,                         // opacity of the light that laps the rim
    c: { face: "#16181b", edge: "#2b2e33", border: "#3a3d42", bw: 1, backFace: "#16181b",
         roles: { B: "#e6e6e6", G: "#5aa7f0", R: "#ef6560" }, red: "#ef6560", ink: "#e6e6e6", shrub: "#4f9a5a" },
    p: function (t, c) {
      if (t.n === 1) {
        var col = t.red ? c.red : c.ink, dx = n2(Math.sqrt(21.5 * 21.5 - 12 * 12));
        return P("M " + n2(30 - dx) + " 52 A 21.5 21.5 0 0 0 " + n2(30 + dx) + " 52", { stroke: "#4a4e55", sw: 2.4, lc: "round" }) +
          C(30, 40, 16.5, { fill: col }) + R(23, 33, 14, 14, { fill: c.face });
      }
      return PIN[t.n].map(function (p) {
        var col = roleColour(c, p[3], t.red), r = p[2] * 0.86, q = r * 0.92;
        return C(p[0], p[1], r, { fill: col }) + R(p[0] - q / 2, p[1] - q / 2, q, q, { fill: c.face });
      }).join("");
    },
    s: function (t, c) {
      if (t.n === 1) {                  // a white sparrow on a stretch of road, hopping now and then
        return R(8, 64.8, 44, 5.4, { fill: c.ink }) + P("M 11 67.5 H 49", { stroke: c.face, sw: 0.8, op: 0.6 }) +
          G(sparrow({ tail: "#b9b9b9", body: c.ink, wing: "#b9b9b9", streak: c.face, head: c.ink, cap: "#8c8c8c",
            bib: c.face, beak: c.face, eye: c.face, legs: c.ink }), { cls: "lt-hop" });
      }
      return SOU[t.n].map(function (b) {
        var col = roleColour(c, b[3], t.red), x = b[0], y = b[1], h = b[2];
        var bar = R(x - 3, y - h / 2, 6, h, { fill: col }) +
          P("M " + x + " " + n2(y - h / 2 + 2.5) + " V " + n2(y + h / 2 - 2.5), { stroke: c.face, sw: 0.8, op: 0.6 });
        return b[4] ? G(bar, { tf: "rotate(" + b[4] + " " + x + " " + y + ")" }) : bar;
      }).join("");
    },
    m: function (t, c) {
      return T(30, 26, KANJI[t.n - 1], { font: FONT.dela, size: 22, fill: t.red ? c.red : c.ink }) +
        P("M 17 43 H 43", { stroke: "#3a3e44", sw: 1.2 }) +
        T(30, 60, MAN, { font: FONT.dela, size: 23, fill: c.red });
    },
    z: function (t, c) {
      var n = t.n;
      if (n <= 4) {
        var d = ["M 55 10 V 70", "M 10 75 H 50", "M 5 10 V 70", "M 10 5 H 50"][n - 1];
        return P(d, { stroke: c.ink, sw: 2.6, op: 0.85 }) + T(30, 40, HON[n - 1], { font: FONT.dela, size: 29, fill: c.ink });
      }
      if (n === 5) {                    // the original bold frame in pure white, undoing the inset so it keeps its old size
        var k = (1 / S.road.inset).toFixed(4);
        return G(R(16, 26, 28, 28, { stroke: "#f4f4f4", sw: 5.5 }) + R(25, 35, 10, 10, { fill: "#f4f4f4", cls: "lt-pulse" }),
          { tf: "translate(30 40) scale(" + k + ") translate(-30 -40)" });
      }
      var col = n === 6 ? "#5bc874" : c.red;
      return T(30, 38, HON[n - 1], { font: FONT.dela, size: 29, fill: col }) + P("M 19 66 H 41", { stroke: col, sw: 1.4, op: 0.6 });
    },
    back: function (c) {
      var d = "M 12 13 H 48 V 29 H 20 V 45 H 40 V 61 H 12 V 68";
      return P(d, { stroke: "#3a3e44", sw: 3, lc: "square" }) +
        P(d, { stroke: c.ink, sw: 3, pl: 100, dash: "3 97", cls: "lt-lap", st: "animation-duration:9s" });
    }
  };

  // SHEET -- the editor, in ink: hand-drawn lines that boil.
  S.sheet = {
    fonts: ["zen"],
    c: { face: "#ffffff", edge: "#c9c9c9", border: "#16181b", bw: 1.4,
         roles: { B: "#16181b", G: "#2f7fd6", R: "#e0403a" }, red: "#e0403a" },
    p: function (t, c) {
      if (t.n === 1) {
        return G(C(30, 40, 18, { stroke: "#16181b", sw: 2.4 }) + C(30, 40, 11, { stroke: "#2f7fd6", sw: 1.8 }) +
          C(30, 40, 4, { fill: c.red }), { cls: "lt-boil" });
      }
      return PIN[t.n].map(function (p, i) {
        var col = roleColour(c, p[3], t.red);
        return G(C(p[0], p[1], p[2] - 0.6, { stroke: col, sw: 2 }) + C(p[0], p[1], p[2] * 0.28, { fill: col }),
          { cls: "lt-boil", st: delay(i, 0.66) });
      }).join("");
    },
    s: function (t, c) {
      if (t.n === 1) {                  // the sparrow drawn in ink, grey and tan pencil on the cap and wing; it boils
        var ink = "#16181b";
        return G(P("M 9 65.6 C 20 64 34 67 52 64.8", { stroke: ink, sw: 1.3, lc: "round" }) +
          sparrow({ tail: "#ffffff", body: "#ffffff", wing: "#ead6b8", streak: ink, head: "#ffffff", cap: "#8c8c8c",
            bib: ink, beak: ink, eye: ink, legs: ink }, { line: ink, lw: 1.2 }), { cls: "lt-boil" });
      }
      return SOU[t.n].map(function (b, i) {
        var col = roleColour(c, b[3], t.red), x = b[0], y = b[1], h = b[2];
        var inner = R(x - 3.6, y - h / 2, 7.2, h, { rx: 1.6, stroke: col, sw: 1.4 });
        for (var k = -1; k <= 1; k++) inner += R(x - 2.2, y + k * h / 4 - 0.4, 4.4, 0.8, { fill: col });
        inner = G(inner, { cls: "lt-boil", st: delay(i, 0.66) });
        return b[4] ? G(inner, { tf: "rotate(" + b[4] + " " + x + " " + y + ")" }) : inner;
      }).join("");
    },
    m: function (t, c) {
      return G(T(30, 27, KANJI[t.n - 1], { font: FONT.zen, size: 28, fill: t.red ? c.red : "#16181b" }), { cls: "lt-boil" }) +
        G(T(30, 61, MAN, { font: FONT.zen, size: 26, fill: c.red }), { cls: "lt-boil", st: "animation-delay:-.3s" });
    },
    z: function (t, c) {
      if (t.n === 5) return R(13, 23, 34, 34, { rx: 2, stroke: "#ff5fd2", sw: 1.8, dash: "4 3", cls: "lt-ants" });
      var col = t.n === 6 ? "#2e9b55" : t.n === 7 ? c.red : "#16181b";
      return G(T(30, 41, HON[t.n - 1], { font: FONT.zen, size: 38, fill: col }), { cls: "lt-boil" });
    },
    back: function () {
      var s = "";
      for (var x = 7.5; x < 60; x += 7.5) s += P("M " + x + " 2 V 79", { stroke: "#e4e4e4", sw: 0.6 });
      for (var y = 7.5; y < 80; y += 7.5) s += P("M 2 " + y + " H 58", { stroke: "#e4e4e4", sw: 0.6 });
      return s + R(6, 6, 48, 68, { rx: 3, stroke: "#8c8c8c", sw: 1, dash: "4 3", cls: "lt-ants" });
    }
  };

  // GARDEN -- a flower bed per number. Each pin tile is its own kind of flower, and where nature
  // allows, the petals count the tile: trillium 3, poppy 4, cherry blossom 5, lily 6, starflower 7,
  // cosmos 8. Flat, simple shapes; the traditional blue/green/red places become colour variants
  // of the flower. The bamboo are jointed stalks with leaves that flutter. (Every set's 1 sou is the sparrow.)
  // (The numbers, winds and dragons keep their pixel lettering.)
  function polar(x, y, d, deg) {
    var a = deg * Math.PI / 180;
    return [x + Math.cos(a) * d, y + Math.sin(a) * d];
  }
  function shade(hex, k) {
    var v = parseInt(hex.slice(1), 16);
    var r = Math.round(((v >> 16) & 255) * k), g = Math.round(((v >> 8) & 255) * k), b = Math.round((v & 255) * k);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // n petals around (x, y): ellipses d out from the centre, the long side pointing outwards
  function petals(x, y, n, d, w, l, col, turn) {
    var s = "";
    for (var k = 0; k < n; k++) {
      var a = (turn === undefined ? -90 : turn) + k * 360 / n, q = polar(x, y, d, a);
      s += E(q[0], q[1], w, l, { fill: col, tf: "rotate(" + n2(a + 90) + " " + n2(q[0]) + " " + n2(q[1]) + ")" });
    }
    return s;
  }
  function points(x, y, n, len, wid, col) {   // n pointed petals from the centre
    var s = "";
    for (var k = 0; k < n; k++) s += P(leafD(x, y, len, wid, -90 + k * 360 / n), { fill: col });
    return s;
  }
  var GOLD = "#efc84a", BLOOMS = {
    sunflower: function (x, y, r, col) {
      return petals(x, y, 14, r * 0.66, r * 0.2, r * 0.34, col) + C(x, y, r * 0.42, { fill: "#6b4426" }) +
        C(x, y, r * 0.27, { fill: "#4b2f1d" });
    },
    rose: function (x, y, r, col) {   // seen from above: five outer petals, then the spiral of the bud
      var a = r * 0.1, d = "M " + n2(x) + " " + n2(y);
      [[1, 2], [2, -2], [3, 4], [4, -4], [5, 6]].forEach(function (s) {
        d += " A " + n2(a * s[0]) + " " + n2(a * s[0]) + " 0 0 1 " + n2(x + a * s[1]) + " " + n2(y);
      });
      return petals(x, y, 5, r * 0.56, r * 0.36, r * 0.36, shade(col, 0.82)) + C(x, y, r * 0.64, { fill: col }) +
        P(d, { stroke: shade(col, 0.66), sw: n2(r * 0.085), lc: "round" });
    },
    trillium: function (x, y, r, col) {
      return petals(x, y, 3, r * 0.5, r * 0.11, r * 0.42, "#5f9e4f", -30) +    // sepals between the petals
        petals(x, y, 3, r * 0.42, r * 0.36, r * 0.52, col) + C(x, y, r * 0.15, { fill: GOLD });
    },
    poppy: function (x, y, r, col) {
      return petals(x, y, 4, r * 0.4, r * 0.46, r * 0.46, col, -45) + C(x, y, r * 0.24, { fill: "#2a2226" });
    },
    cherry: function (x, y, r, col) {  // five petals, each with the notch at its tip
      var s = petals(x, y, 5, r * 0.5, r * 0.31, r * 0.42, col);
      for (var k = 0; k < 5; k++) { var q = polar(x, y, r * 0.9, -90 + k * 72); s += C(q[0], q[1], r * 0.1, { fill: "#0c0c0c" }); }
      return s + C(x, y, r * 0.16, { fill: shade(col, 0.72) });
    },
    lily: function (x, y, r, col) {
      return points(x, y, 6, r * 0.96, 52, col) + C(x, y, r * 0.15, { fill: "#d98a2b" });
    },
    starflower: function (x, y, r, col) {
      return points(x, y, 7, r * 0.92, 54, col) + C(x, y, r * 0.17, { fill: GOLD });
    },
    cosmos: function (x, y, r, col) {
      return petals(x, y, 8, r * 0.53, r * 0.26, r * 0.4, col) + C(x, y, r * 0.2, { fill: GOLD });
    },
    aster: function (x, y, r, col) {
      return petals(x, y, 9, r * 0.56, r * 0.2, r * 0.38, col) + C(x, y, r * 0.22, { fill: GOLD });
    }
  };
  function leafD(x, y, len, wid, deg) {   // a pointed leaf from (x, y), turned by deg
    var tip = polar(x, y, len, deg), mid1 = polar(x, y, len * 0.5, deg - wid), mid2 = polar(x, y, len * 0.5, deg + wid);
    return "M " + n2(x) + " " + n2(y) + " Q " + n2(mid1[0]) + " " + n2(mid1[1]) + " " + n2(tip[0]) + " " + n2(tip[1]) +
      " Q " + n2(mid2[0]) + " " + n2(mid2[1]) + " " + n2(x) + " " + n2(y) + " Z";
  }
  S.garden = {
    fonts: ["dot"],
    c: { face: "#0c0c0c", edge: "#31353a", border: "#2b2e33", bw: 1, backFace: "#101a14",
         roles: { B: "#7b84d6", G: "#4fae86", R: "#d0628f" }, red: "#e04848", centre: "#f0d27a",
         // pin n -> [flower, colour for each traditional place B / G / R]; flat colours, no shine
         bed: {
           1: ["sunflower", { B: "#f1b52e", G: "#f1b52e", R: "#f1b52e" }],
           2: ["rose", { B: "#cf4560", G: "#ee9cb7", R: "#cf4560" }],
           3: ["trillium", { B: "#ece7f3", G: "#cfe6a6", R: "#b33d56" }],
           4: ["poppy", { B: "#ee7a3a", G: "#d84444", R: "#d84444" }],
           5: ["cherry", { B: "#f0a6c3", G: "#f5e6ee", R: "#e0577b" }],
           6: ["lily", { B: "#f3efe4", G: "#f3efe4", R: "#ef8a3b" }],
           7: ["starflower", { B: "#edf2f7", G: "#edf2f7", R: "#b59ae1" }],
           8: ["cosmos", { B: "#e078b0", G: "#e078b0", R: "#e078b0" }],
           9: ["aster", { B: "#988be6", G: "#f1eee3", R: "#e06079" }]
         },
         stem: {                        // bamboo: [stalk, joint, light side, leaf]
           G: ["#46ad4f", "#2c7a33", "#a4dca6", "#9ccc3e"], B: ["#2f8fd6", "#1f5f96", "#a3cdf0", "#55c08a"],
           R: ["#e45a3e", "#a83a27", "#f6b1a2", "#9ccc3e"], red: ["#e04848", "#a52f2f", "#f4a9a9", "#9ccc3e"]
         },
         leaf: "#7cbf45" },
    p: function (t, c) {
      var bed = c.bed[t.n], draw = BLOOMS[bed[0]];
      if (t.n === 1) return G(draw(30, 40, 19, bed[1].B), { cls: "lt-spin" });   // the sunflower turns slowly
      return PIN[t.n].map(function (p, i) {          // every flower nods in the breeze, out of step
        return G(draw(p[0], p[1], p[2], t.red ? c.red : bed[1][p[3]]), { cls: "lt-nod", st: delay(i, 3.4) });
      }).join("");
    },
    s: function (t, c) {
      if (t.n === 1) {                  // a house sparrow on a twig, hopping now and then
        return P("M 8 66 C 20 64.6 36 66.4 53 65", { stroke: "#6e4c35", sw: 2.4, lc: "round" }) +
          G(P(leafD(46, 65.5, 7, 34, -40), { fill: c.leaf }), { cls: "lt-flutter", st: "transform-origin:0% 100%" }) +
          G(sparrow({ tail: "#7a5434", body: "#c4a37a", wing: "#8b5e36", streak: "#4d321c", head: "#b08a62", cap: "#7b7570",
            cheek: "#efe6d4", bib: "#2e2724", beak: "#2e2724", eye: "#15110f", glint: "#ffffff", legs: "#a77d5c" }), { cls: "lt-hop" });
      }
      return SOU[t.n].map(function (b, i) {
        var col = t.red ? c.stem.red : c.stem[b[3]], x = b[0], y = b[1], h = b[2], top = y - h / 2;
        var s = R(x - 2.7, top, 5.4, h, { rx: 1.8, fill: col[0] }) +
          R(x - 1.6, top + 1.4, 1.1, h - 2.8, { rx: 0.55, fill: col[2], op: 0.15 });  // a faint light down one side
        var joints = h >= 22 ? 2 : 1;
        for (var k = 1; k <= joints; k++) {
          var jy = top + h * k / (joints + 1);
          s += R(x - 3.2, jy - 0.75, 6.4, 1.5, { rx: 0.75, fill: col[1] });
        }
        if (i % 2 === 0) {               // a leaf at the upper joint, fluttering from its base
          s += G(P(leafD(x + 2.4, top + h / (joints + 1), 8.5, 36, i % 4 ? -30 : -14), { fill: col[3] }),
            { cls: "lt-flutter", st: "transform-origin:0% 100%;" + delay(i, 2.6) });
        }
        s = G(s, { cls: "lt-sway", st: delay(i, 3.6) });
        return b[4] ? G(s, { tf: "rotate(" + b[4] + " " + x + " " + y + ")" }) : s;
      }).join("");
    },
    m: function (t, c) {
      return T(30, 26, KANJI[t.n - 1], { font: FONT.dot, size: 24, fill: t.red ? c.red : "#e8e8e8" }) +
        T(30, 60, MAN, { font: FONT.dot, size: 24, fill: c.roles.R }) +
        R(48, 7, 2.4, 2.4, { fill: c.centre, cls: "lt-twinkle" });
    },
    z: function (t, c) {
      if (t.n === 5) {
        var s = "", q = 4.4, x0 = 12.4, y0 = 22.4;
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 8; j++) {
            if (i > 0 && i < 7 && j > 0 && j < 7) continue;
            // position around the ring, clockwise from the top-left: 0..27
            var k = j === 0 ? i : i === 7 ? 7 + j : j === 7 ? 21 - i : 28 - j;
            s += R(x0 + i * q, y0 + j * q, q - 0.5, q - 0.5, { fill: "#f4f4f4", cls: "lt-chase",
              st: "animation-delay:-" + n2((28 - k) / 28 * 2.2) + "s" });
          }
        }
        return s;
      }
      var col = t.n === 6 ? "#6fd07f" : t.n === 7 ? c.red : "#e8e8e8";
      return T(30, 41, HON[t.n - 1], { font: FONT.dot, size: 32, fill: col }) + R(48, 7, 2.4, 2.4, { fill: c.centre, cls: "lt-twinkle" });
    },
    back: function () {               // bamboo leaves on dark green
      var s = "";
      [[9, 16, -32, "#2f5a3b"], [31, 10, 18, "#3b6b47"], [16, 34, 12, "#3b6b47"], [37, 30, -26, "#2f5a3b"],
       [10, 54, -18, "#3b6b47"], [33, 50, 24, "#2f5a3b"], [18, 70, -30, "#2f5a3b"], [40, 69, 8, "#3b6b47"]
      ].forEach(function (l) {
        var tip = polar(l[0], l[1], 17, l[2]);
        s += P(leafD(l[0], l[1], 17, 18, l[2]), { fill: l[3] }) +
          P("M " + l[0] + " " + l[1] + " L " + n2(tip[0]) + " " + n2(tip[1]), { stroke: "#5b8f66", sw: 0.5, op: 0.7 });
      });
      return s;
    }
  };

  // FLAIR -- light at speed, kept easy on the eyes: every mark is drawn crisp over a soft,
  // steady glow (no trails, no pulsing, no halo on the text), and the only motion on most
  // tiles is one slow sheen that crosses the tile now and then.
  S.flair = {
    fonts: ["mplus"],
    sheen: 0.07,                      // opacity of the light band that crosses the tile
    c: { face: "#16181b", edge: "#2a2d33", border: "#31353a", bw: 1,
         roles: { B: "#6cb2ff", G: "#4fe0b6", R: "#ff86d9" }, red: "#ff5c5c", ink: "#f4f4f4", accent: "#8fdcff" },
    p: function (t, c) {
      function ring(x, y, r, col, sw) {
        return C(x, y, r, { stroke: col, sw: sw + 3, op: 0.16 }) + C(x, y, r, { stroke: col, sw: sw });
      }
      if (t.n === 1) {
        var col = t.red ? c.red : c.accent;
        return ring(30, 40, 18, col, 2.6) + ring(30, 40, 10, t.red ? c.red : c.roles.R, 2.2) + C(30, 40, 3.6, { fill: col });
      }
      return PIN[t.n].map(function (p) {
        var col = roleColour(c, p[3], t.red);
        return ring(p[0], p[1], p[2] - 1, col, 2.4) + C(p[0], p[1], p[2] * 0.3, { fill: col });
      }).join("");
    },
    s: function (t, c) {
      if (t.n === 1) {                  // the sparrow as a neon outline over a soft halo, hopping now and then
        return P("M 9 65.2 H 51", { stroke: c.roles.B, sw: 4.6, op: 0.16, lc: "round" }) +
          P("M 9 65.2 H 51", { stroke: c.roles.B, sw: 1.8, lc: "round" }) +
          G(sparrow({ tail: c.face, body: c.face, wing: c.face, streak: c.roles.R, head: c.face, cap: c.roles.R,
            bib: c.roles.R, beak: "#efc84a", eye: c.accent, legs: c.accent }, { line: c.accent, lw: 1.6, glow: c.accent }), { cls: "lt-hop" });
      }
      return SOU[t.n].map(function (b) {
        var col = roleColour(c, b[3], t.red), x = b[0], y = b[1], h = b[2];
        var lean = t.n === 8 ? b[4] : b[4] || 8;   // a slight forward lean; 8 sou keeps its real shape
        return G(R(x - 4.2, y - h / 2, 8.4, h, { rx: 4.2, fill: col, op: 0.16 }) +
          R(x - 2.3, y - h / 2, 4.6, h, { rx: 2.3, fill: col }), { tf: "rotate(" + lean + " " + x + " " + y + ")" });
      }).join("");
    },
    m: function (t, c) {
      return T(30, 26, KANJI[t.n - 1], { font: FONT.mplus, weight: 800, size: 24, fill: t.red ? c.red : c.ink, tf: skew(30, 26, -6) }) +
        T(30, 60, MAN, { font: FONT.mplus, weight: 800, size: 22, fill: c.roles.R, tf: skew(30, 60, -6) });
    },
    z: function (t, c) {
      if (t.n === 5) {
        return R(15, 25, 30, 30, { rx: 3, stroke: c.accent, sw: 5.6, op: 0.16 }) +
          R(15, 25, 30, 30, { rx: 3, stroke: c.accent, sw: 2.6 });
      }
      var col = t.n === 6 ? "#46e07f" : t.n === 7 ? c.red : c.ink, line = t.n <= 4 ? c.roles.B : col;
      return T(30, 39, HON[t.n - 1], { font: FONT.mplus, weight: 800, size: 31, fill: col, tf: skew(30, 39, -6) }) +
        P("M 14 67 H 46", { stroke: "#31353a", sw: 2, lc: "round" }) +
        P("M 14 67 H 46", { stroke: line, sw: 2, lc: "round", pl: 100, dash: "18 82", cls: "lt-lap" });
    },
    back: function (c) {
      var s = "";
      [["M 6 64 L 54 30", 0], ["M 6 76 L 54 42", 1.2], ["M 6 50 L 54 16", 2.3]].forEach(function (l) {
        s += P(l[0], { stroke: "#2c3036", sw: 1.6 }) +
          P(l[0], { stroke: c.accent, sw: 1.6, lc: "round", pl: 100, dash: "12 88", cls: "lt-lap", st: "animation-duration:3.4s;animation-delay:-" + l[1] + "s" });
      });
      return s;
    }
  };

  // BLOCK -- the 3D view: every mark is a softly extruded block; the depth breathes. Drawn inside
  // a margin (inset) with a shallow, light extrusion so the tile stays airy.
  S.block = {
    fonts: ["dela"],
    inset: 0.88,
    c: { face: "#f4f4f4", edge: "#c4c4c4", border: "#b4b4b4", bw: 1, backFace: "#e4e4e4", side: "#bdbdbd", depth: 1.5,
         roles: { B: "#2b2e33", G: "#3a86d8", R: "#e0524a" }, red: "#e0524a" },
    p: function (t, c) {
      var d = c.depth, sides = "", tops = "";
      var list = t.n === 1 ? [[30, 40, 17, t.red ? "R" : "B"]] : PIN[t.n];
      list.forEach(function (p) {
        var col = roleColour(c, p[3], t.red), r = p[2] * 0.88, q = r * 0.62;
        sides += C(p[0] + d, p[1] + d, r, { fill: c.side });
        tops += C(p[0], p[1], r, { fill: col }) + R(p[0] - q / 2, p[1] - q / 2, q, q, { fill: "#f4f4f4" });
      });
      if (t.n === 1) tops += R(27, 37, 6, 6, { fill: c.roles.B });
      return G(sides, { cls: "lt-breath" }) + tops;
    },
    s: function (t, c) {
      var d = c.depth;
      if (t.n === 1) {                  // an extruded sparrow on an extruded perch; the bird bobs
        var shadow = { tail: c.side, body: c.side, wing: c.side, head: c.side, beak: c.side, eye: c.side };
        return G(R(10 + d, 64.8 + d, 40, 4.6, { rx: 1, fill: c.side }), { cls: "lt-breath" }) +
          R(10, 64.8, 40, 4.6, { rx: 1, fill: "#3f9a55" }) +
          G(G(G(sparrow(shadow), { tf: "translate(" + d + " " + d + ")" }), { cls: "lt-breath" }) +
            sparrow({ tail: "#8a5a33", body: "#c9a77c", wing: "#8a5a33", streak: "#5a3a20", head: "#b08a62", cap: "#6f6a66",
              cheek: "#f4f4f4", bib: c.roles.B, beak: c.roles.B, eye: c.roles.B, legs: "#8a5a33" }), { cls: "lt-bob" });
      }
      var sides = "", tops = "";
      SOU[t.n].forEach(function (b) {
        var col = roleColour(c, b[3], t.red), x = b[0], y = b[1], h = b[2];
        var rot = b[4] ? "rotate(" + b[4] + " " + x + " " + y + ")" : null;
        sides += G(R(x - 3.1 + d, y - h / 2 + d, 6.2, h, { rx: 1, fill: c.side }), { tf: rot });
        tops += G(R(x - 3.1, y - h / 2, 6.2, h, { rx: 1, fill: col }) +
          R(x - 1, y - h / 2 + 2, 2, h - 4, { rx: 1, fill: "#ffffff", op: 0.3 }), { tf: rot });
      });
      return G(sides, { cls: "lt-breath" }) + tops;
    },
    m: function (t, c) {
      var d = 1.1, col = t.red ? c.red : c.roles.B;
      return G(T(30 + d, 26 + d, KANJI[t.n - 1], { font: FONT.dela, size: 21, fill: c.side }) +
          T(30 + d, 60 + d, MAN, { font: FONT.dela, size: 22, fill: c.side }), { cls: "lt-breath" }) +
        T(30, 26, KANJI[t.n - 1], { font: FONT.dela, size: 21, fill: col }) +
        T(30, 60, MAN, { font: FONT.dela, size: 22, fill: c.red });
    },
    z: function (t, c) {
      var d = 1.2;
      if (t.n === 5) {
        return G(R(17 + d, 27 + d, 26, 26, { stroke: c.side, sw: 4.4 }), { cls: "lt-breath" }) +
          R(17, 27, 26, 26, { stroke: c.roles.B, sw: 4.4 });
      }
      var col = t.n === 6 ? "#3f9a55" : t.n === 7 ? c.red : c.roles.B;
      return G(T(30 + d, 41 + d, HON[t.n - 1], { font: FONT.dela, size: 28, fill: c.side }), { cls: "lt-breath" }) +
        T(30, 41, HON[t.n - 1], { font: FONT.dela, size: 28, fill: col });
    },
    back: function (c) {
      var d = c.depth, sides = "", tops = "";
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 4; j++) {
          var x = 9 + i * 15, y = 9 + j * 16;
          sides += R(x + d, y + d, 9, 9, { fill: c.side });
          tops += R(x, y, 9, 9, { fill: "#f4f4f4" });
        }
      }
      return G(sides, { cls: "lt-breath" }) + tops;
    }
  };

  var SETS = Object.keys(S);
  // Only the font families the sets in this file use (a browser then fetches only
  // the glyph subsets a page actually shows).
  var FONTS_HREF = "https://fonts.googleapis.com/css2?" + Object.keys(FAMILY).filter(function (f) {
    return SETS.some(function (s) { return S[s].fonts.indexOf(f) >= 0; });
  }).map(function (f) { return "family=" + FAMILY[f]; }).join("&") + "&display=swap";

  // ---- the motion, once per page -------------------------------------------
  var CSS = [
    ".lt{display:inline-block;vertical-align:bottom;overflow:hidden}",
    ".lt-lap{animation:lt-lap 2.6s linear infinite}",
    "@keyframes lt-lap{to{stroke-dashoffset:-100}}",
    ".lt-pulse{animation:lt-pulse 1.8s ease-in-out infinite alternate}",
    "@keyframes lt-pulse{from{opacity:.35}to{opacity:.95}}",
    // the rim light only makes sense moving: on still tiles it would sit as a stray dash, so hide it
    ".lt-rim{stroke-linecap:round}",
    ".lt-motion-off .lt-rim{opacity:0}",
    "@media (prefers-reduced-motion:reduce){.lt-rim{opacity:0}}",
    ".lt-boil{transform-box:fill-box;transform-origin:center;animation:lt-boil .66s steps(1,end) infinite}",
    "@keyframes lt-boil{0%{transform:rotate(0deg)}33%{transform:rotate(1.4deg) translate(.25px,-.2px)}66%{transform:rotate(-1.1deg) translate(-.2px,.25px)}}",
    ".lt-ants{animation:lt-ants .9s linear infinite}",
    "@keyframes lt-ants{to{stroke-dashoffset:-7}}",
    // the sparrow rests, then hops twice: a big hop and a small one
    ".lt-hop{transform-box:fill-box;transform-origin:50% 100%;animation:lt-hop 3.6s ease-in-out infinite}",
    "@keyframes lt-hop{0%,64%,100%{transform:none}70%{transform:translateY(-3.2px)}76%{transform:none}81%{transform:translateY(-1.6px)}86%{transform:none}}",
    ".lt-twinkle{animation:lt-twinkle 1.5s steps(1,end) infinite}",
    "@keyframes lt-twinkle{0%{opacity:1}50%{opacity:.45}}",
    ".lt-nod{transform-box:fill-box;transform-origin:center;animation:lt-nod 3.4s ease-in-out infinite alternate}",
    "@keyframes lt-nod{from{transform:rotate(-12deg) scale(.92)}to{transform:rotate(12deg) scale(1.03)}}",
    ".lt-spin{transform-box:fill-box;transform-origin:center;animation:lt-spin 24s linear infinite}",
    "@keyframes lt-spin{to{transform:rotate(360deg)}}",
    ".lt-sway{transform-box:fill-box;transform-origin:50% 100%;animation:lt-sway 3.6s ease-in-out infinite alternate}",
    "@keyframes lt-sway{from{transform:rotate(-2.6deg)}to{transform:rotate(2.6deg)}}",
    ".lt-flutter{transform-box:fill-box;animation:lt-flutter 2.6s ease-in-out infinite alternate}",
    "@keyframes lt-flutter{from{transform:rotate(-14deg)}to{transform:rotate(10deg)}}",
    ".lt-chase{animation:lt-chase 2.2s linear infinite}",
    "@keyframes lt-chase{0%,100%{opacity:.85}10%{opacity:1}30%{opacity:.85}}",
    ".lt-sheen{animation:lt-sheen 7s ease-in-out infinite}",
    "@keyframes lt-sheen{0%{transform:translateX(0)}25%,100%{transform:translateX(100px)}}",
    ".lt-breath{animation:lt-breath 3.2s ease-in-out infinite alternate}",
    "@keyframes lt-breath{from{transform:translate(-.5px,-.5px)}to{transform:translate(.5px,.5px)}}",
    ".lt-bob{animation:lt-bob 1.3s ease-in-out infinite alternate}",
    "@keyframes lt-bob{from{transform:translateY(0)}to{transform:translateY(-1.4px)}}",
    ".lt-motion-off,.lt-motion-off *{animation:none!important}",
    ".lt-motion-hover:not(:hover),.lt-motion-hover:not(:hover) *{animation-play-state:paused!important}",
    "@media (prefers-reduced-motion:reduce){.lt,.lt *{animation:none!important}}"
  ].join("\n");

  function ensureStyles() {
    if (typeof document === "undefined") return;
    if (!document.getElementById("lines-tiles-css")) {
      var st = document.createElement("style");
      st.id = "lines-tiles-css";
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    if (!root.LinesTilesNoFonts && !document.getElementById("lines-tiles-fonts")) {
      var ln = document.createElement("link");
      ln.id = "lines-tiles-fonts";
      ln.rel = "stylesheet";
      ln.href = FONTS_HREF;
      (document.head || document.documentElement).appendChild(ln);
    }
  }

  // ---- public API -----------------------------------------------------------
  function parse(code) {
    var s = String(code == null ? "" : code).trim().toLowerCase();
    if (s === "back") return { suit: "back" };
    var m = /^([0-9])([mpsz])$/.exec(s);
    if (!m) return null;
    var n = +m[1], suit = m[2];
    if (suit === "z") return n >= 1 && n <= 7 ? { suit: "z", n: n } : null;
    return n === 0 ? { suit: suit, n: 5, red: true } : { suit: suit, n: n, red: false };
  }
  function label(t) {
    if (t.suit === "back") return "tile back";
    if (t.suit === "z") return HON_WORDS[t.n - 1];
    return (t.red ? "red " : "") + t.n + " " + SUIT_WORDS[t.suit];
  }
  function width(size) {
    var w = +size;
    return w > 0 && isFinite(w) ? w : 48;     // a missing, zero, negative or junk size falls back
  }
  function svg(set, code, opts) {
    opts = opts || {};
    var st = S[set];
    if (!st) throw new Error("LinesTiles: unknown set '" + set + "' (this file has " + SETS.join(", ") + ")");
    var t = parse(code);
    if (!t) throw new Error("LinesTiles: unknown tile '" + code + "' (use 1m-9m, 1p-9p, 1s-9s, 0m/0p/0s, 1z-7z or back)");
    ensureStyles();
    var w = width(opts.size), h = w * 86 / 60, c = st.c;
    var motion = opts.motion === "off" || opts.motion === "hover" ? opts.motion : "on";
    var face = t.suit === "back" ? (c.backFace || c.face) : c.face;
    var inner = t.suit === "back" ? st.back(c) : st[t.suit](t, c);
    // draw the marks a little smaller around the tile's centre, leaving a margin
    if (st.inset) inner = G(inner, { tf: "translate(30 40) scale(" + st.inset + ") translate(-30 -40)" });
    if (st.rim && t.suit !== "back") {
      // one dim light laps the tile's rim, each tile at its own moment
      var rk = t.suit + (t.n || 0) + (t.red ? "r" : ""), rh = 0;
      for (var j = 0; j < rk.length; j++) rh = (rh * 31 + rk.charCodeAt(j)) % 7001;
      inner += P(roundRectD(3.5, 3.5, 53, 73, 4.5), { stroke: c.ink, sw: 1, op: st.rim, pl: 100, dash: "5 95", cls: "lt-lap lt-rim",
        st: "animation-duration:10s;animation-delay:-" + n2((rh % 100) / 10) + "s" });
    }
    if (st.sheen) {
      // a light band crosses the tile every 7 s; each tile starts at its own moment so a
      // row of tiles never flashes at once
      var key = t.suit + (t.n || 0) + (t.red ? "r" : ""), hsh = 0;
      for (var i = 0; i < key.length; i++) hsh = (hsh * 31 + key.charCodeAt(i)) % 7001;
      var cid = "lts" + (++uid);
      inner += '<clipPath id="' + cid + '">' + R(0.5, 0.5, 59, 80, { rx: 7 }) + "</clipPath>" +
        G(G(P("M -16 0 H -2 L -22 86 H -36 Z", { fill: "#ffffff", op: st.sheen }),
          { cls: "lt-sheen", st: "animation-delay:-" + n2((hsh % 70) / 10) + "s" }), { clip: "url(#" + cid + ")" });
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" class="lt lt-' + set + (motion === "on" ? "" : " lt-motion-" + motion) +
      '" viewBox="0 0 60 86" width="' + n2(w) + '" height="' + n2(h) + '" role="img" aria-label="' + esc(label(t)) + '">' +
      R(0.5, 5.5, 59, 80, { rx: 7, fill: c.edge }) +
      R(0.5, 0.5, 59, 80, { rx: 7, fill: face, stroke: c.border, sw: c.bw }) + inner + "</svg>";
  }

  // A hand in the usual notation: digits then their suit letter ("123m456p789s1122z",
  // 0 = red five). A space (or several) leaves one gap, as before a drawn tile.
  // Returns the tile codes, with null where a gap goes.
  function parseHand(notation) {
    var s = String(notation == null ? "" : notation), out = [], digits = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), lc = ch.toLowerCase();
      if (ch >= "0" && ch <= "9") { digits += ch; continue; }
      if (lc === "m" || lc === "p" || lc === "s" || lc === "z") {
        if (!digits) throw new Error("LinesTiles: '" + ch + "' at position " + (i + 1) + " has no numbers before it");
        for (var k = 0; k < digits.length; k++) {
          if (!parse(digits.charAt(k) + lc)) throw new Error("LinesTiles: there is no tile '" + digits.charAt(k) + lc + "'");
          out.push(digits.charAt(k) + lc);
        }
        digits = "";
        continue;
      }
      if (/\s/.test(ch)) {
        if (digits) throw new Error("LinesTiles: the numbers '" + digits + "' have no suit letter (m, p, s or z)");
        if (out.length && out[out.length - 1] !== null) out.push(null);
        continue;
      }
      throw new Error("LinesTiles: unexpected '" + ch + "' at position " + (i + 1) + " (use digits, m, p, s, z and spaces)");
    }
    if (digits) throw new Error("LinesTiles: the numbers '" + digits + "' have no suit letter (m, p, s or z)");
    if (out[out.length - 1] === null) out.pop();
    return out;
  }
  function hand(set, notation, opts) {
    opts = opts || {};
    var codes = parseHand(notation), w = width(opts.size);
    var tiles = codes.map(function (code) {
      return code === null ? '<span style="flex:none;width:' + n2(w * 0.3) + 'px"></span>' : svg(set, code, opts);
    }).join("");
    var words = codes.filter(function (c) { return c !== null; }).map(function (c) { return label(parse(c)); }).join(", ");
    // wraps onto a second line only when its container is too narrow for the whole hand
    return '<span class="lt-hand" role="img" aria-label="' + esc(words) + '" style="display:inline-flex;flex-wrap:wrap;' +
      "align-items:flex-end;vertical-align:bottom;gap:" + n2(Math.max(1, w * 0.05)) + 'px">' + tiles + "</span>";
  }

  var TILES = [];
  ["m", "p", "s"].forEach(function (s) {
    for (var n = 1; n <= 9; n++) TILES.push(n + s);
    TILES.push("0" + s);
  });
  for (var z = 1; z <= 7; z++) TILES.push(z + "z");
  TILES.push("back");

  var API = { version: VERSION, sets: SETS.slice(), tiles: TILES.slice(), svg: svg, hand: hand, parse: parse,
              parseHand: parseHand, label: function (code) { var t = parse(code); return t ? label(t) : null; },
              ensureStyles: ensureStyles, fontsHref: FONTS_HREF };
  root.LinesTiles = API;

  if (typeof customElements !== "undefined" && typeof HTMLElement !== "undefined") {
    // Draw once even when several attributes change together.
    var drawSoon = function (el) {
      if (!el.isConnected || el._queued) return;
      el._queued = true;
      Promise.resolve().then(function () { el._queued = false; el.render(); });
    };
    var attrOpts = function (el) { return { size: el.getAttribute("size"), motion: el.getAttribute("motion") }; };
    if (!customElements.get("lines-tile")) {
      customElements.define("lines-tile", class extends HTMLElement {
        static get observedAttributes() { return ["set", "tile", "size", "motion"]; }
        connectedCallback() { this.render(); }
        attributeChangedCallback() { drawSoon(this); }
        render() {
          try {
            this.innerHTML = svg(this.getAttribute("set") || SETS[0], this.getAttribute("tile") || "1m", attrOpts(this));
            this.removeAttribute("title");
          } catch (e) {
            this.textContent = "?";
            this.title = e.message;
          }
        }
      });
    }
    if (!customElements.get("lines-hand")) {
      customElements.define("lines-hand", class extends HTMLElement {
        static get observedAttributes() { return ["set", "tiles", "size", "motion"]; }
        connectedCallback() { this.render(); }
        attributeChangedCallback() { drawSoon(this); }
        render() {
          var tiles = this.getAttribute("tiles") || "";
          try {
            this.innerHTML = hand(this.getAttribute("set") || SETS[0], tiles, attrOpts(this));
            this.removeAttribute("title");
          } catch (e) {
            this.textContent = tiles;           // keep the words readable, and say what went wrong
            this.title = e.message;
          }
        }
      });
    }
  }
})(typeof window !== "undefined" ? window : this);
