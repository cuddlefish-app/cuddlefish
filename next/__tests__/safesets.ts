import { SafeSet } from "../src/common_utils";

describe("SafeSet", () => {
  it("empty set", () => {
    expect(new SafeSet([]).size()).toBe(0);
  });
  it("arrays", () => {
    const set = new SafeSet([
      [1, 2],
      [2, 1],
      [1, 2],
      ["a", "b"],
    ]);
    expect(set.size()).toBe(3);
    expect(set.has([1, 2])).toBeTruthy();
    expect(set.has([2, 1])).toBeTruthy();
    expect(set.has(["a", "b"])).toBeTruthy();
  });
  it("objects", () => {
    const set = new SafeSet([
      { a: 1, b: 2 },
      { a: 2, b: 1 },
      { a: 1, b: 2 },
      { a: "a", b: "b" },
    ]);
    expect(set.size()).toBe(3);
    expect(set.has({ a: 1, b: 2 })).toBeTruthy();
    expect(set.has({ a: 2, b: 1 })).toBeTruthy();
    expect(set.has({ a: "a", b: "b" })).toBeTruthy();
  });
});
