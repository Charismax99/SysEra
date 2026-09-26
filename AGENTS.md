# SysEra Agent Guidelines

## Project

SysEra is a lightweight software-house website built with:

- HTML
- CSS
- Vanilla JavaScript
- PHP for the contact form

Do not introduce frameworks, libraries, build tools, or unnecessary dependencies unless explicitly requested.

## Scope Discipline

For every task:

- Work only on the requested feature or section.
- Inspect only files directly relevant to the task.
- Prefer targeted searches over broad repository exploration.
- Do not perform a site-wide audit unless explicitly requested.
- Do not inspect unrelated sections just to understand the website.
- Do not refactor unrelated code.
- Do not redesign unrelated components.
- Preserve existing working behavior unless the task requires changing it.

If the requested change is isolated, keep the implementation isolated.

- Do not re-read or re-analyze files that are not necessary for the current task.
- Once the relevant implementation has been located, stop repository exploration and proceed with the smallest required change.

## Design System

Preserve the existing SysEra visual language:

- dark/navy interface
- cyan accents
- technical/editorial aesthetic
- thin lines, nodes and subtle technical details
- restrained motion
- clean typography
- intentional desktop and mobile layouts

Avoid:

- generic SaaS styling
- excessive rounded cards
- generic pill UI
- unnecessary gradients
- repetitive card layouts
- redesigning established sections without being asked

New work should visually belong to the existing website.

## Responsive Behavior

Desktop and mobile are intentionally designed.

Do not treat mobile as a compressed desktop layout.

When modifying an existing component:

- preserve its current responsive behavior unless explicitly asked otherwise
- verify only the modified component at relevant breakpoints
- do not alter unrelated responsive rules

Respect `prefers-reduced-motion`.

## Portfolio / Selected Work

The Selected Work portfolio is data-driven.

Project data lives in:

`js/portfolio-data.js`

The portfolio UI is generated from that data.

Adding a future project should require only:

1. adding its optimized image assets to the portfolio image directory
2. adding one project object to `portfolio-data.js`

Optimized portfolio images are required project files and must be included when the project is committed or pushed.

Do not manually duplicate portfolio tabs or project panels.
Do not restructure the portfolio architecture when simply adding a project.
Do not hardcode project counts.

Project selectors should adapt automatically and use horizontal overflow when necessary.

## Validation

Use the smallest validation scope appropriate for the change.

For isolated changes:

- test only the affected component
- run directly relevant tests
- avoid unnecessary site-wide validation

Run broader validation only when shared/global behavior is modified.

Do not repeatedly inspect unrelated files after the relevant implementation has already been identified.

## Git

Do not commit or push unless explicitly requested.

New files intentionally created or added for the current requested feature are part of that feature even when Git reports them as untracked.

When committing or pushing a completed feature, include every file required for the feature to work, including new assets such as images. Do not exclude a required task-related file only because it is untracked.

Continue excluding unrelated untracked files.

Before committing, verify that local assets referenced by the changed implementation are included in the intended commit.

Always use targeted staging. Never use broad staging such as `git add .`.

Do not add unrelated files to a commit.

## Secrets

Never expose, modify, commit, or stage secrets unless explicitly required for a local configuration task.

`contact/smtp-config.php` contains environment-specific SMTP configuration and must remain untracked.

Do not include credentials in source files or commits.

## General Rule

Prefer the smallest correct change.

Do not turn a focused request into a broader cleanup, refactor, redesign, or audit.

When the existing implementation already supports the requested behavior, extend it instead of rebuilding it.
