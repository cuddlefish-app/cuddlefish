import { ADMIN_getOctokit, lookupCommit } from "../src/github";

// Try commit signature email first, check for signature overrides, fall back
// to user.email, fall back to looking up the email for user.id in hasura. If
// all else fails, queue the email and report that we couldn't find it to the
// commenter.

describe("lookupCommit", () => {
  const octokit = ADMIN_getOctokit();

  it("author has @users.noreply.github.com email", async () => {
    const c = await lookupCommit(
      octokit,
      "elmisback",
      "flowview",
      "fe137d89b62cc161218ecd1b99db60eb7d22f020"
    );
    expect(c.firstAuthor.name).toBe("Edward Misback");
    expect(c.firstAuthor.email).toBe("elmisback@users.noreply.github.com");
    expect(c.firstAuthor.user?.login).toBe("elmisback");
    expect(c.firstAuthor.user?.email).toBe("");

    expect(c.coauthors).toHaveLength(0);

    expect(c.committer.name).toBe("GitHub");
    expect(c.committer.email).toBe("noreply@github.com");
    expect(c.committer.user).toBeNull();
  });

  it("author info, no committer info", async () => {
    const c = await lookupCommit(
      octokit,
      "drshrey",
      "spotify-flask-auth-example",
      "96e3243cae2195526c8aa8ef59af82ee13351db4"
    );
    expect(c.firstAuthor.name).toBe("Shreyas Jaganmohan");
    expect(c.firstAuthor.email.endsWith("@gmail.com")).toBeTruthy();
    expect(c.firstAuthor.user?.id).toBe("MDQ6VXNlcjMxODg0MTM=");
    expect(c.firstAuthor.user?.login).toBe("drshrey");
    expect(c.firstAuthor.user?.email.endsWith("@gmail.com")).toBeTruthy();

    expect(c.coauthors).toHaveLength(0);

    expect(c.committer.name).toBe("GitHub");
    expect(c.committer.email).toBe("noreply@github.com");
    expect(c.committer.user).toBeNull();
  });

  it("user info and email info, and committer info", async () => {
    const c = await lookupCommit(
      octokit,
      "cuddlefish-app",
      "cuddlefish",
      "dd5db81b44d1135cff75c936b5464b096a5a8f78"
    );
    expect(c.firstAuthor.name).toBe("Samuel Ainsworth");
    expect(c.firstAuthor.email.endsWith("@gmail.com")).toBeTruthy();
    expect(c.firstAuthor.user?.id).toBe("MDQ6VXNlcjIyNjg3Mg==");
    expect(c.firstAuthor.user?.login).toBe("samuela");
    expect(c.firstAuthor.user?.email.endsWith("@gmail.com")).toBeTruthy();

    expect(c.coauthors).toHaveLength(0);

    expect(c.committer.name).toBe("Samuel Ainsworth");
    expect(c.committer.email.endsWith("@gmail.com")).toBeTruthy();
    expect(c.committer.user?.id).toBe("MDQ6VXNlcjIyNjg3Mg==");
    expect(c.committer.user?.login).toBe("samuela");
    expect(c.committer.user?.email.endsWith("@gmail.com")).toBeTruthy();
  });

  it("author info, no committer info", async () => {
    const c = await lookupCommit(
      octokit,
      "drshrey",
      "goto-line-link",
      "0f01b1c4e35be4df2cabc789b12d071a8d384403"
    );
    expect(c.coauthors).toHaveLength(0);

    expect(c.firstAuthor.name).toBe("Shreyas Jaganmohan");
    expect(c.firstAuthor.email).toBe("drshrey@Shreyass-MacBook-Pro.local");
    expect(c.firstAuthor.user).toBeNull();

    expect(c.committer.name).toBe("Shreyas Jaganmohan");
    expect(c.committer.email).toBe("drshrey@Shreyass-MacBook-Pro.local");
    expect(c.committer.user).toBeNull();
  });

  it("different author than committer", async () => {
    const c = await lookupCommit(
      octokit,
      "NixOS",
      "nixpkgs",
      "e8328148cd446452b51971b796649fd88e2499a4"
    );
    expect(c.firstAuthor.name).toBe("fortuneteller2k");
    expect(c.firstAuthor.email.endsWith("@gmail.com")).toBeTruthy();
    expect(c.firstAuthor.user?.id).toBe("MDQ6VXNlcjIwNjE5Nzc2");
    expect(c.firstAuthor.user?.login).toBe("fortuneteller2k");
    expect(c.firstAuthor.user?.email.endsWith("@gmail.com")).toBeTruthy();

    expect(c.coauthors).toHaveLength(0);

    expect(c.committer.name).toBe("Bernardo Meurer");
    expect(c.committer.email.endsWith("@meurer.org")).toBeTruthy();
    expect(c.committer.user?.id).toBe("MDQ6VXNlcjcyNDM3ODM=");
    expect(c.committer.user?.login).toBe("lovesegfault");
    expect(c.committer.user?.email.endsWith("@meurer.org")).toBeTruthy();
  });

  it("coauthors", async () => {
    const c = await lookupCommit(
      octokit,
      "NixOS",
      "nixpkgs",
      "dbfd26724defe3f8a63431e0fe1bf6955cc2f44f"
    );
    expect(c.firstAuthor.name).toBe("Guillaume Girol");
    expect(c.firstAuthor.email).toBe("symphorien@users.noreply.github.com");
    expect(c.firstAuthor.user?.id).toBe("MDQ6VXNlcjEyNTk1OTcx");
    expect(c.firstAuthor.user?.login).toBe("symphorien");
    expect(c.firstAuthor.user?.email).toBe("");

    expect(c.coauthors).toHaveLength(2);
    expect(c.coauthors[0].name).toBe("Sandro");
    expect(c.coauthors[0].email.endsWith("@gmail.com")).toBeTruthy();
    expect(c.coauthors[0].user?.id).toBe("MDQ6VXNlcjcyNTg4NTg=");
    expect(c.coauthors[0].user?.login).toBe("SuperSandro2000");
    expect(c.coauthors[0].user?.email.endsWith("@gmail.com")).toBeTruthy();

    // This is an interesting case: the commit signature has an email but the
    // `user.email` field is still an empty string.
    expect(c.coauthors[1].name).toBe("Dmitry Kalinkin");
    expect(c.coauthors[1].email.endsWith("@gmail.com")).toBeTruthy();
    expect(c.coauthors[1].user?.id).toBe("MDQ6VXNlcjI0NTU3Mw==");
    expect(c.coauthors[1].user?.login).toBe("veprbl");
    expect(c.coauthors[1].user?.email).toBe("");

    expect(c.committer.name).toBe("GitHub");
    expect(c.committer.email).toBe("noreply@github.com");
    expect(c.committer.user).toBeNull();
  });
});
