## Description
JasonZhang's personal website

in this website, you could see:
- JasonZhang's introduction
- front-end development articles
- rust articles
- go articles

## Tech
- `Vue3`  + `vitepress`
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
