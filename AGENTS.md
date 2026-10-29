# Contributor instructions

## Server repository

The server dependency is the Adobe fork:
<https://github.com/adobe/cruise-control>. Use that fork's target revision when
checking API behavior, generating the mock contract, and linking server issues
or pull requests. A local `../cruise-control` checkout is only a convenience;
verify its repository and revision rather than assuming it is the right source.

## Opening pull requests

These contribution rules are inherited from the server repository's `AGENTS.md`;
its server-side OpenAPI maintenance instructions are not inherited here.

Use the repository's PR template when one exists. This repository currently has
no `.github/pull_request_template.md`, so use these sections in PR descriptions
and complete them meaningfully without placeholder text:

| Section | What to write |
|---|---|
| Summary - Why | Explain the motivation or problem being solved. |
| Summary - What | Describe the changes introduced by this PR. |
| Expected Behavior | Describe what should happen after the change. |
| Actual Behavior | Describe the bug or new capability. |
| Steps to Reproduce | Give concrete reproduction steps for bug fixes. |
| Known Workarounds | Describe workarounds, or write "None". |
| Additional Evidence | Attach relevant logs, screenshots, or environment details. |
| Categorization | Check all applicable categories. |

Link every PR to an existing issue, using `This PR resolves #<issue-number>.`
Search for an existing issue before creating one; create one if none exists.
Do not leave an issue placeholder in a submitted PR.

## Contribution guidelines

Follow [CONTRIBUTING.md](./CONTRIBUTING.md).

1. New features must have passing tests for both existing and new behavior.
2. Bug fixes must include a regression test that demonstrates the defect.
3. Open an issue before submitting large features for discussion.
4. Do not submit WIP pull requests.
5. Use clear, concise PR titles that describe the scope of the change.
6. Link each PR to its issue.

Write PR descriptions clearly, with enough context for reviewers unfamiliar with
the change. Reference related issues, discussions, and documentation. Put lengthy
logs or code output in `<details>` blocks rather than pasting large blocks inline.

## Cruise Control API mocks

`test/fixtures/cruise-control.js` serves the browser tests. Its request parameters
and response validation use the committed, generated contract at
`test/fixtures/cruise-control-openapi.json`. This snapshot is the source of truth
for documented API shapes in UI tests; it must come from the Adobe server generator,
not a hand-written UI schema. Do not invent successful responses or accept
parameters that the real server rejects. Undocumented successful methods,
endpoints, status codes, or content types must fail mock validation rather than
silently falling back to the error schema.

Refresh this contract at each Cruise Control upgrade, before changing mocked API
behavior, and during periodic dependency maintenance:

1. Use the server checkout explicitly selected by the user. Otherwise, check for
   `../cruise-control` and verify its Adobe remote, exact revision, and worktree
   changes. Do not assume that the default branch matches the pinned contract.
   Run the following snippets in the same Bash shell; this example uses the sibling
   checkout:

   ```sh
   UI_ROOT="$(git rev-parse --show-toplevel)"
   SERVER_DIR="$(cd ../cruise-control && pwd)"
   git -C "$SERVER_DIR" remote -v
   git -C "$SERVER_DIR" rev-parse HEAD
   git -C "$SERVER_DIR" status --short
   ```

   Never switch, clean, reset, or fetch over a contributor's checkout to refresh
   this contract. A local revision may not have been pushed; use its actual sources
   and record that fact rather than substituting a remote branch.

   If there is no suitable local checkout, select a published server commit and
   set `SERVER_REVISION` to its full SHA. Clone the Adobe fork outside the UI
   repository, then check out that revision:

   ```sh
   SERVER_DIR="$(mktemp -d "${TMPDIR:-/tmp}/cruise-control-openapi.XXXXXX")"
   git clone --filter=blob:none --no-checkout https://github.com/adobe/cruise-control.git "$SERVER_DIR"
   git -C "$SERVER_DIR" checkout --detach "$SERVER_REVISION"
   ```

   If the required revision is unpublished and its local checkout is unavailable,
   report the blocker. Do not regenerate from a different revision.
2. Initialize SDKMAN and select the required installed JDK in the same shell.
   Inspect the target revision's build configuration and CI first; this server
   uses **Gradle**, not Maven. Use `sdk env` when `.sdkmanrc` exists; otherwise
   select a compatible installed JDK. The pinned revision's CI uses JDK 25; this
   example selects an installed Temurin JDK 25. Stop if it is unavailable rather
   than silently using Java from `PATH`. Do not change SDKMAN's global default.

   ```sh
   cd "$SERVER_DIR"
   source "$HOME/.sdkman/bin/sdkman-init.sh"
   if [ -f .sdkmanrc ]; then
     sdk env
   else
     sdk use java 25.0.5.0+8-tem
   fi
   java -version
   ./gradlew --version
   ```

   Repeat SDKMAN initialization and selection in every new shell.
3. Regenerate the artifact; never reuse an old generated file after a failed build:

   ```sh
   ./gradlew --quiet :cruise-control:generateOpenApiJson --rerun-tasks
   ```

4. Compare the newly generated artifact with the pinned UI snapshot before copying:

   ```sh
   git --no-pager diff --no-index -- \
     "$UI_ROOT/test/fixtures/cruise-control-openapi.json" \
     "$SERVER_DIR/cruise-control/src/main/resources/webroot/openapi.json"
   ```

   Exit status 0 means identical, 1 means there are changes to review, and a larger
   status indicates an error. When checking drift, report differences without
   overwriting the snapshot. When intentionally refreshing it, review the diff,
   then copy the generated file:

   ```sh
   cp "$SERVER_DIR/cruise-control/src/main/resources/webroot/openapi.json" \
     "$UI_ROOT/test/fixtures/cruise-control-openapi.json"
   ```

   Never hand-edit the snapshot or silently accept new upstream shapes just to
   make tests green. Record the exact server revision and any local patches below.
5. Update the shared fixtures and affected tests for accepted contract changes.
   The generator bundles hand-maintained YAML; it does not derive schemas from
   Java. Cross-check query encoding/defaults with `servlet/parameters/ParameterUtils`,
   task headers with `servlet/UserTaskManager`, and status codes, content types,
   version envelopes, and payloads with `servlet/response`. If YAML disagrees with
   Java, fix the server specification and its regressions, regenerate, then refresh
   this snapshot. Run the server's `RequestParameterTest` and `ResponseTest` when
   changing that contract. Do not silently weaken validation or add a mock-only exception.
6. From `UI_ROOT`, run `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e`.
   Preserve HTTP 202 progress, HTTP 200 completion, JSON/plaintext negotiation,
   UUID `User-Task-ID` response/retry headers, and server-shaped HTTP 400/404 errors.
   Do not add CORS headers unless the test explicitly models enabled server CORS.
   Normal UI tests and CI consume the committed snapshot only: they must not
   require Java, a sibling server checkout, or network access to the server repository.

### Snapshot provenance

Server revision: `c901117f96bfc467132f3a976f003ef4de674076` from the local
`../cruise-control` checkout, with no uncommitted changes when generated.
This revision is not yet pushed to `adobe/cruise-control`; do not assume that a
fresh clone can reproduce it until it is published.
This commit contains the OpenAPI corrections for task headers, disk-list
serialization, disk-only demotion, `/load` HTTP 202, fractional metrics,
review-list/version fields, the nested progress envelope, and generator input tracking.
Keep the exact revision recorded until deliberately refreshed.
