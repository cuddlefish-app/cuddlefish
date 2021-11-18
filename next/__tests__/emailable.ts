// We can ignore anything ending in `.local`: https://en.wikipedia.org/wiki/.local
const baddies = [
  /^.*\.local$/,
  /^.*@users\.noreply\.github\.com$/,
  /^noreply@github\.com$/,
];

function emailable(email: string): boolean {
  return !baddies.some((re) => re.test(email));
}

describe("emailable", () => {
  it("valid emails", () => {
    expect(emailable("thisisanemail@gmail.com")).toBeTruthy();
    expect(emailable("foobar@hotmail.com")).toBeTruthy();
    expect(emailable("people@nytimes.com")).toBeTruthy();
  });
  it(".local", () => {
    expect(emailable("drshrey@Shreyass-MacBook-Pro.local")).toBeFalsy();
    expect(emailable("a.person_name+bob@foo.local.com")).toBeTruthy();
  });
  it("@users.noreply.github.com", () => {
    expect(emailable("drshrey@users.noreply.github.com")).toBeFalsy();
    expect(emailable("elmisback@users.noreply.github.com")).toBeFalsy();
  });

  // It's occasionally the case that the committer is has name "GitHub" and
  // email "noreply@github.com".
  it("noreply@github.com", () => {
    expect(emailable("noreply@github.com")).toBeFalsy();
  });
});

// Necessary to make this a module.
export {};
