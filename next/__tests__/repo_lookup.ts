import { ADMIN_getOctokit, lookupRepoByNodeId } from "../src/server/github";

describe("lookupRepoByNodeId", () => {
  const octokit = ADMIN_getOctokit();

  it("drshrey/spotify-flask-auth-example", async () => {
    const { owner, repo } = await lookupRepoByNodeId(
      octokit,
      "MDEwOlJlcG9zaXRvcnkyODQwNjk1Mg=="
    );
    expect(owner).toBe("drshrey");
    expect(repo).toBe("spotify-flask-auth-example");
  });
});
