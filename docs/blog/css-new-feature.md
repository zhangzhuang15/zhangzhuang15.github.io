---
title: "css new feature"
page: true
aside: true
---

# CSS New Feature

## align-content
Set element at center of its container, replace old way:
```css 
.center {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

## `@property`
Define custom property and use it with`var`

## `@starting-style`
Avoid flash of unstyled content.

Flash of unstyled content: when page is loading, its style isn't loaded, it looks an unstyled page, then style loaded, it comes to styled page suddenly.

## round, mod, rem
`calc` is the old css math method, now it brings `round`, `mod` and `rem`.


## light-dark
Replace the old way `@media (prefers-color-scheme: dark)`, it looks like:
```css 
.main {
    background: light-dark(white, blue);
}
```
Background is white in light mode, and blue in dark mode.

## `:user-valid` & `:user-invalid`
Old way, `:valid` and `:invalid`, is triggered after page loaded. But new way,
`:user-valid` and `:user-invalid` is triggered after user interacts with the field, e.g. `<input>` `<button>`.

## interpolate-size
Animating sizes in CSS was limited, now we have `interpolate-size`, it looks like:
```css 
.main {
    interpolate-size: height ease-in-out 3s;
}
```