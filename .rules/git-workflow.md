# Git workflow rules

Rules for branch / worktree / commit / PR work. (The summary decision rule lives in HOW TO WORK step 4 of CLAUDE.md.)

## Branch vs worktree decision

When starting a new task, **if the target branch differs from the current checkout**, decide as follows:

- **Current branch is a base like `develop`/`main`** → this checkout has no work in progress, so work on a **new branch**.
- **Current branch is `feature/`·`fix/`·`chore/` etc** → that checkout is already busy with other work, so split off via a **worktree**.
- **Target branch == current branch** → don't create anything; just continue (you're already on that task).

## Approval rule (important)

- **Creating branches/worktrees happens only after user approval.** Claude never creates them on its own.
- **New branches** are usually created manually by the user → Claude only proposes the name and timing.
- **Worktrees (+ their parallel-session branches)** are the case the user does NOT create manually, so Claude may create them — but **must get permission first**.

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
