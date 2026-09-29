// Small expression parser: never executes JavaScript or application code.
export function calculateCell(
  cells: string[][],
  row: number,
  col: number,
  seen = new Set<string>(),
): number | string {
  const key = `${row}:${col}`;
  if (seen.has(key)) return "#CYCLE";
  const input = cells[row]?.[col] ?? "";
  if (!input.startsWith("="))
    return input.trim() === ""
      ? ""
      : Number.isFinite(Number(input))
        ? Number(input)
        : input;
  seen.add(key);
  try {
    let exp = input.slice(1).toUpperCase().replace(/\s/g, "");
    const value = (ref: string): number => {
      const m = /^([A-Z]+)([1-9][0-9]*)$/.exec(ref);
      if (!m) throw Error("Reference");
      const c =
        [...m[1]].reduce((a, b) => a * 26 + b.charCodeAt(0) - 64, 0) - 1;
      const v = calculateCell(cells, Number(m[2]) - 1, c, new Set(seen));
      if (v === "") return 0;
      if (typeof v !== "number") throw Error("Cell");
      return v;
    };
    exp = exp.replace(
      /(SUM|AVERAGE|MIN|MAX)\(([^()]*)\)/g,
      (_, fn: string, arg: string) => {
        const values: number[] = [];
        for (const part of arg.split(",")) {
          if (part.includes(":")) {
            const [a, b] = part.split(":");
            const am = /^([A-Z])([0-9]+)$/.exec(a),
              bm = /^([A-Z])([0-9]+)$/.exec(b);
            if (!am || !bm) throw Error("Range");
            const r1 = Number(am[2]),
              r2 = Number(bm[2]);
            if (r2 - r1 > 1000) throw Error("Range");
            for (let ri = r1; ri <= r2; ri++)
              for (
                let ci = am[1].charCodeAt(0);
                ci <= bm[1].charCodeAt(0);
                ci++
              )
                values.push(value(String.fromCharCode(ci) + ri));
          } else values.push(/^[A-Z]/.test(part) ? value(part) : Number(part));
        }
        if (!values.length || values.some((v) => !Number.isFinite(v)))
          throw Error("Value");
        return String(
          fn === "SUM"
            ? values.reduce((a, b) => a + b, 0)
            : fn === "AVERAGE"
              ? values.reduce((a, b) => a + b, 0) / values.length
              : fn === "MIN"
                ? Math.min(...values)
                : Math.max(...values),
        );
      },
    );
    exp = exp
      .replace(/[A-Z]+[1-9][0-9]*/g, (ref) => String(value(ref)))
      .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
    const tokens = exp.match(/\d*\.?\d+(?:e[+-]?\d+)?|[()+*/-]/gi) || [];
    if (tokens.join("") !== exp) throw Error("Expression");
    let pos = 0;
    const atom = (): number => {
      const t = tokens[pos++];
      if (t === "-") return -atom();
      if (t === "+") return atom();
      if (t === "(") {
        const n = add();
        if (tokens[pos++] !== ")") throw Error("Bracket");
        return n;
      }
      if (t === undefined || !Number.isFinite(Number(t))) throw Error("Number");
      return Number(t);
    };
    const mul = (): number => {
      let n = atom();
      while (tokens[pos] === "*" || tokens[pos] === "/") {
        const op = tokens[pos++];
        const rhs = atom();
        n = op === "*" ? n * rhs : n / rhs;
      }
      return n;
    };
    const add = (): number => {
      let n = mul();
      while (tokens[pos] === "+" || tokens[pos] === "-") {
        const op = tokens[pos++];
        const rhs = mul();
        n = op === "+" ? n + rhs : n - rhs;
      }
      return n;
    };
    const result = add();
    if (pos !== tokens.length || !Number.isFinite(result))
      throw Error("Result");
    return Math.round(result * 10000) / 10000;
  } catch {
    return "#ERROR";
  }
}
