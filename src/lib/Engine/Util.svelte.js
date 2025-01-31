export default class {
  actuallyIsMobile = $state(false);
  constructor(game) {
    this.game = game;
  }
  lerp(t, e, r) {
    return t * (1 - r) + e * r;
  }
  mod(t, e) {
    return ((t % e) + e) % e;
  }
  interpolateYaw(t, e) {
    const r = Math.min(
      1,
      this.game.renderer.replicator.getMsInThisTick() /
        this.game.renderer.replicator.msPerTick,
    );
    let n = t + this.lerp(0, this.mod(e - t + 180, 360) - 180, r);
    return n < 0 && (n += 360), n >= 360 && (n -= 360), n;
  }
  angleTo(t, e) {
    return ((180 * Math.atan2(e.y - t.y, e.x - t.x)) / Math.PI + 90 + 360) % 360;
  }
  measureDistance(t, e) {
    if (void 0 === t.x || void 0 === t.y || void 0 === e.x || void 0 === e.y)
      return 1 / 0;
    let r = e.x - t.x,
      n = e.y - t.y;
    return Math.abs(r ** 2 + n ** 2);
  }
  isMobile() {
    return (this.actuallyIsMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ));
  }
  hexToRgb(t) {
    t = t.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function (t, e, r, n) {
      return e + e + r + r + n + n;
    });
    var e = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);
    return e
      ? {
          r: parseInt(e[1], 16),
          g: parseInt(e[2], 16),
          b: parseInt(e[3], 16),
        }
      : null;
  }
  createResourceCostString(t, e = 1, r = 1, n = !0) {
    const i = ["wood", "stone", "gold", "tokens"],
      o = [],
      s = this.game.ui.playerTick;
    for (const a of i) {
      const i = `${a}Costs`;
      if (i in t) {
        const c = (null == t[i][e - 1] ? t[i] : t[i][e - 1]) * r;
        if (0 === c) continue;
        o.push(
          `<span class="${null !== s && !0 === n ? (s[a] >= c ? "" : "low") : ""}">${this.abbreviateNumber(c, 3).toLocaleString()} ${a}</span>`,
        );
      }
    }
    return o.length > 0
      ? {
          elem: o.join(", "),
        }
      : {
          elem: "<span>Free</span>",
          lowResource: false,
        };
  }
  createResourceRefundString(t, e = 1, r = 0) {
    const n = ["wood", "stone", "gold", "tokens"],
      i = [];
    for (const o of n) {
      const n = `${o}Costs`;
      if (t[n]) {
        const s = Math.floor(t[n].slice(0, e).reduce((t, e) => t + e) * r * 0.75);
        s > 0 && i.push(`${this.abbreviateNumber(s, 3).toLocaleString()} ${o}`);
      }
    }
    return i.length > 0 ? `${i.join(", ")}` : "<span>None</span>";
  }
  canAfford(t, e) {
    const r = ["wood", "stone", "gold", "tokens"];
    for (let n of r) if (t[n] < e[`${n}Costs`]) return !1;
    return !0;
  }
  abbreviateNumber(t, e) {
    const r = ["K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"];
    e = Math.pow(10, e);
    for (let n = r.length - 1; n >= 0; n--) {
      const i = Math.pow(10, 3 * (n + 1));
      if (i <= t) {
        1e3 == (t = Math.round((t * e) / i) / e) && n < r.length - 1 && ((t = 1), n++),
          (t += r[n]);
        break;
      }
    }
    return t;
  }
  uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(
        16,
      ),
    );
  }
}
