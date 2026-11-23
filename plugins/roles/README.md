# roles

Two [omp](https://github.com/can1357/oh-my-pi) subagents, each bound to its own model role so you choose the model once in config.

| Agent | Model role | Use |
| --- | --- | --- |
| `pr-reviewer` | `review` | Read-only review of a PR, branch or diff: severity, `file:line`, trigger, impact, evidence, fix, verdict. Never edits or runs builds. |
| `unblocker` | `unblock` | Fresh-eyes help after going in circles on one problem for 30+ minutes. Challenges the framing, names the cause, the next action and the check that proves it. Read-only unless assigned a fix. |

## Install

```sh
omp plugin marketplace add danieljohnmorris/omp-plugins
omp plugin install roles@omp-plugins
```

## Configure

The agents resolve `@review` and `@unblock`, so define both roles in `~/.omp/agent/config.yml`. Pick any models; a different vendor from your default model makes review more independent:

```yaml
modelRoles:
  review: <provider>/<model>:high
  unblock: <provider>/<model>:high
```

## Make omp use them automatically

Agents are only used when something dispatches them. Add to `~/.omp/agent/RULES.md`:

```md
# Code review role

Reviewer subagents MUST use the `pr-reviewer` agent (model role `review`). When the user says "review <x>" (a branch, PR, diff, commit or file set) without asking for the full PR workflow, dispatch a read-only `pr-reviewer` on it instead of reviewing inline, and relay its findings.

# Unblock role

When you have been going in circles on the same problem for 30 minutes or more of wall-clock time (repeated failures, retrying variants of a failed approach, no measurable progress), stop and spawn the `unblocker` agent (model role `unblock`) with a compact evidence packet: goal, what was tried, exact errors/outputs, relevant files. Track elapsed time with `date` when you start a problem; do not estimate it. Apply its recommendation or state why not. Also use it when the user says "unblock".
```

The [pr-review skill](https://github.com/danieljohnmorris/pr-review-skill) dispatches `pr-reviewer` for each of its review perspectives when it is installed.
