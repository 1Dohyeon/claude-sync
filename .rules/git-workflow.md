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

## Why a worktree is needed

One working directory can check out **only one** branch. So opening a new session in a folder checked out to branch A still sees A — to work on B in parallel, a dedicated worktree folder for B is **required**.

- When a task splits into two or more, write the per-branch task docs up front during design. That way, opening a new session on each branch later starts already knowing its own design. (Otherwise it lives only on the base branch and starts empty.)
- For every branch except the currently checked-out one, create a separate directory with `git worktree add`. (Just creating the branch won't enable parallel sessions.)

## Parallel task execution

- With a single task, the designer session just proceeds with the work.
- With multiple tasks, the original (designer) session **switches to a supervisor role**, and the user opens a new session per worktree folder created earlier. (Opening only a new session in the same folder still sees the original branch.)

## Commit / PR

- **Commit/push only when the user asks.**
- Completion is signaled by moving the task file into `done/`; **do NOT record PR/merge status in the task doc.** (A PR can be sent back, so it isn't a reliable completion signal.)
