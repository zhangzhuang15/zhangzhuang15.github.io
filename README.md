## Description

JasonZhang's personal website

in this website, you could see:

- JasonZhang's introduction
- front-end development articles
- rust articles
- go articles

## Tech

- `Vue3` + `vitepress`
- vite
- naiveUI ( I hear it from a chatgpt project)
- [giscus](https://giscus.app/zh-CN), a comment component

## How do I create this project

- `npx vitepress init`, automatically create the project
- install other packages I need
- add some new features, insert new code and adopt matched techs

> if someone wants to make a project organized by `vite`, run `pnpm create vite`

## Notice During Development

at early time, `.vitepress` is located in `docs` directory,
I drag the `.vitepress` directory out from `docs` directory,
and locate it in the root project directory, so I have to change
the command of starting dev server:
before: `vitepress dev docs`

> in this way, it means that `.vitepress` is under `docs` directory.

after: `vitepress dev`

## GitHub workflow

I create a workflow named 'Deploy' which is defined in `.github/workflow/deploy.yml`.

Every time I create PR, it will helps me re-deploy my website.

But sometimes, it doesn't work very well. My website will fall back to the default README page of Github style. I do a research, and catch the reason: `npm ci`.

When workflow runs and try to install dependencies with npm, if it doesn't find package-lock.json, `npm ci` might be failed.

By default, I use pnpm locally, to make everything simple, I add
pnpm@7.9.3 action into deploy.yml.

> make sure of pnpm-lock.yml, if it doesn't exist, pnpm install will be failed.

Everything works well.

If you want to search github actions or apps, please visit [github markplace](https://github.com/marketplace?category=&type=actions&verification=&query=setup-node)
