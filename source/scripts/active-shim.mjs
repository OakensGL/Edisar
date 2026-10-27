// Test helper: since multi-character accounts, each character's save lives in "edisar.char.<id>".
// The pseudo-key "@active" maps to the save of the last played character (account.last), so the older tests
// can keep reading/writing "the save". Writing "@active" also updates that character's entry and the account's coins/Premium,
// exactly like the game's own storeChar does.
export const activeShim = () => {
  const P = Storage.prototype, g0 = P.getItem, s0 = P.setItem, r0 = P.removeItem;
  const acc = (ls) => { try { return JSON.parse(g0.call(ls, "edisar.account.v1") || "null"); } catch { return null; } };
  const key = (ls) => { const a = acc(ls); return a && a.last ? "edisar.char." + a.last : "edisar.char.none"; };
  P.getItem = function (k) { return g0.call(this, k === "@active" ? key(this) : k); };
  P.removeItem = function (k) { return r0.call(this, k === "@active" ? key(this) : k); };
  P.setItem = function (k, v) {
    if (k !== "@active") return s0.call(this, k, v);
    s0.call(this, key(this), v);
    try { const a = acc(this); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(String(v).split("-")[2]), (c) => c.charCodeAt(0))));
      const e = a.chars.find((c) => c.id === a.last); if (e) { e.level = d.level; e.name = d.name; e.savedAt = d.savedAt; }
      if (d.cs) { a.coins = d.cs.coins; a.premUntil = d.cs.premUntil; } s0.call(this, "edisar.account.v1", JSON.stringify(a)); } catch { /* ignore */ }
  };
};
