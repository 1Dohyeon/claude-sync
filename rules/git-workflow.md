# Git workflow rules

Rules for branch / worktree / commit / PR work. (The summary decision rule lives in HOW TO WORK step 4 of CLAUDE.md.)

## Branch vs worktree decision

The main working directory (where `.git/` actually lives, not a linked worktree) is reserved for `main`/`develop`
(base branches — `develop` may not exist in every repo) plus any branch the user personally pulled/checked out
there. Claude never runs `git checkout -b` or switches the main working directory to a different branch.

When starting a new task, decide as follows:

- **Target branch == current checkout** → don't create anything; just continue (you're already on that task).
- **Anything else** (a brand-new branch, or an existing branch not currently checked out here) → always split off
  into a **worktree**. This applies even when the main working directory is currently on a base branch — a base
  branch being "idle" is no longer a reason to check out new work there.

## Approval rule (important)

- **Creating a worktree (and the branch it holds) happens only after user approval.** Claude never creates one on its own.
- The main working directory's branch is the user's to manage directly (tracking `main`/`develop`, or manually
  pulling a branch to inspect) — Claude does not check out or create branches there.

## Creating a worktree — remote branch first (required)

**Never let a worktree branch track a base branch.** `git worktree add -b <branch> <dir> origin/develop` sets the
new branch's upstream to `origin/develop`, so a bare `git push` later lands **directly on develop**. The branch
name in `git status` looks right, which is exactly why this goes unnoticed.

Create the remote branch first, then point the worktree at it:

```sh
git fetch origin
git push origin origin/develop:refs/heads/<branch>          # 1. remote branch, empty, at base
git fetch origin
git worktree add --track -b <branch> <dir> origin/<branch>  # 2. worktree tracks itself
git -C <dir> status -sb                                     # 3. must read: ## <branch>...origin/<branch>
```

- Step 1 is a push, but it only creates an empty branch at the base commit. **The approval to create the worktree
  covers it** — don't stop to ask again. (Substitute the repo's actual base: `origin/main` where `develop` is absent.)
- Step 3 is the guard. If the upstream reads `...origin/develop` (or any base branch), stop: run
  `git -C <dir> branch --unset-upstream` and redo step 1–2. **Never commit on a branch whose upstream is a base branch.**
- Precedent (2026-08-07, mobisell-back `feat/agency-telecom`): the worktree tracked `origin/develop`, and a routine
  `git push` put a feature commit straight onto shared develop. Recovered with
  `git push --force-with-lease=develop:<sha> origin <base-sha>:develop`.

## After creating a worktree (required, no extra approval)

A fresh worktree has no `node_modules`, so setup is finished in the **same step** as creation — never hand back a
worktree that still needs a manual install. Approval to create the worktree already covers both steps below; do
not stop to ask in between.

1. **Install dependencies** in the new worktree directory, using the repo's own package manager (detect it from
   the lockfile / the repo's CLAUDE.md — `bun.lock` → `bun install`, `pnpm-lock.yaml` → `pnpm install`, etc.).
2. **Discard any lockfile change the install produced**: `git -C <worktree> checkout -- <lockfile>`.
   A freshly created worktree of an existing branch starts clean, so a modified lockfile here is environment noise
   (e.g. a newer package-manager version rewriting metadata), not an intended change. Already-installed
   `node_modules` are unaffected by the discard.
3. **Verify and report** with `git -C <worktree> status -sb` — the tree must come back clean **and the upstream
   must be the branch's own remote**, not a base branch (see the section above).

If the discarded lockfile diff was more than metadata (actual dependency version changes), say so in the report —
discard it anyway, but don't let it pass silently.

## Why a worktree is needed

One working directory can check out **only one** branch. So opening a new session in a folder checked out to branch A still sees A — to work on B in parallel, a dedicated worktree folder for B is **required**.

- When a task splits into two or more, write the per-branch task docs up front during design. That way, opening a new session on each branch later starts already knowing its own design. (Otherwise it lives only on the base branch and starts empty.)
- For every branch except the currently checked-out one, create a separate directory with `git worktree add`. (Just creating the branch won't enable parallel sessions.)

## Parallel task execution

- With a single task, the designer session just proceeds with the work.
- With multiple tasks, the original (designer) session **switches to a supervisor role**, and the user opens a new session per worktree folder created earlier. (Opening only a new session in the same folder still sees the original branch.)

## Commit / PR

- **Commit/push only when the user asks.**
- **Push the branch by name, never bare `git push`**: `git push -u origin <branch>`. A bare push follows whatever
  upstream is configured, which is how a feature commit reaches a base branch.
- Before the first push of a branch, re-check `git status -sb`. If the upstream is a base branch, fix it first.
- Completion is signaled by moving the task file into `done/`; **do NOT record PR/merge status in the task doc.** (A PR can be sent back, so it isn't a reliable completion signal.)
