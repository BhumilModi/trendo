---
name: Trendo
description: Five tech stories a day, printed off a news-agency wire on canary teleprinter paper.
colors:
  canary-paper: "#f1e7b4"
  canary-paper-deep: "#e6d995"
  carbon-ink: "#1c1a12"
  carbon-ink-soft: "#5a5338"
  wire-red: "#b3261e"
  rule: "rgba(28, 26, 18, 0.24)"
  sprocket-hole: "rgba(28, 26, 18, 0.11)"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  story:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "ui-monospace, SF Mono, Roboto Mono, Droid Sans Mono, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.06em"
    fontFeature: "tnum"
  numeral:
    fontFamily: "ui-monospace, SF Mono, Roboto Mono, Droid Sans Mono, Menlo, Consolas, monospace"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  hair: "1px"
  sm: "2px"
  stamp: "3px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  row: "14px"
  lg: "18px"
  block: "26px"
  edge: "28px"
components:
  button-primary:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.canary-paper}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "56px"
    width: "100%"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "56px"
  button-small:
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  feed-bar:
    backgroundColor: "{colors.canary-paper-deep}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    height: "56px"
  field-input:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "52px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  tag:
    textColor: "{colors.carbon-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 7px"
  toast:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.canary-paper}"
    rounded: "{rounded.stamp}"
    padding: "8px 14px"
  nav-link:
    textColor: "{colors.carbon-ink-soft}"
    typography: "{typography.label}"
    height: "60px"
  nav-link-active:
    textColor: "{colors.carbon-ink}"
---

# Design System: Trendo

## Overview

**Creative North Star: "The Wire Desk"**

Every screen is a strip of canary teleprinter paper coming off a news-agency wire. Items are numbered and printed one at a time, slug lines carry the datelines, times and points in mono caps, and the day ends when you tear off the leaf along its perforation. It rejects the category default: a scroll of rounded white cards with a streak flame.

Density is a single narrow column (38rem max) with hairline and dashed rules doing all the structural work. Nothing floats; everything is printed on the same sheet.

Display type is heavy system sans because PRODUCT.md requires system fonts for mobile data. That is a product constraint, not a stylistic preference. Weight (800) and tight tracking carry the voice instead of a typeface.

**Key Characteristics:**
- Canary paper fills every screen; no white surfaces, no cards.
- Mono uppercase slug lines for every number, date, label and status.
- State is shown by a drawn mark (tick, flag, stitch, hatch, dashed outline), not by a colour.
- Sprocket strips on both edges of the viewport, and dashed perforations between rows.
- One red, used as a signal and never as a fill.

## Colors

Two inks on one paper, plus one wire red. There is no dark mode: the canary paper is the product's one look, whatever the device setting (decided 2026-10-15).

### Primary
- **Wire Red** (`wire-red`): the brand caret, the current item's number and flag, the leading caret on the feed bar, the active nav bar, the red stitch on patched leaves, today's leaf outline, the focus ring, text selection, error text and the wrong-answer mark.

### Neutral
- **Canary Paper** / **Carbon Paper** (`canary-paper` / `dark-carbon-paper`): the page, the nav and the dock. Also the text colour on inked surfaces.
- **Deep Canary** / **Deep Carbon** (`canary-paper-deep` / `dark-carbon-paper-deep`): the unfilled feed bar, the torn leaf, the progress bar track, and correct quiz answers.
- **Carbon Ink** / **Canary Ink** (`carbon-ink` / `dark-canary-ink`): body text, solid rules, primary button fill, inked leaves and selected states.
- **Faded Ink** (`carbon-ink-soft` / `dark-canary-ink-soft`): slug lines, ledes, read headlines, the hatching on late leaves.
- **Rule** (`rule` / `dark-rule`): dashed perforations, empty leaves, disabled and used outlines, progress ticks still to come.
- **Sprocket Hole** (`sprocket-hole` / `dark-sprocket-hole`): the tractor-feed holes on the edges and the perforation dots on the end-of-wire strip.

### Named Rules
**The One Wire Red Rule.** Red is a signal: a caret, a flag, a stitch, an outline, a 2-4px bar, a focus ring, error text. It never fills a button, a panel or a background.

**The Two Inks Rule.** Every surface is paper or ink. Inverting (ink fill, paper text) is how this system shows emphasis: primary button, your own leaderboard row, the toast, a selected tab.

## Typography

**Display Font:** system-ui sans (with -apple-system, Segoe UI, Roboto, Noto Sans, Arial)
**Body Font:** the same system sans
**Label/Mono Font:** ui-monospace (with SF Mono, Roboto Mono, Menlo, Consolas)

**Character:** Heavy sans for the news, mono caps for the machine. Wire metadata is always mono. Anything a person reads as prose is always sans.

### Hierarchy
- **Display** (800, 1.75rem, 1.15, -0.02em, balanced wrap): one per screen; the screen's plain-English status ("You're caught up for today.").
- **Headline** (800, 1.25rem, 1.25): secondary headings, such as the puzzle result.
- **Title** (700, 1.0625rem, 1.35): item headlines in numbered lists.
- **Body** (400, 17px, 1.6): the default. Ledes are in faded ink with a 60ch max width.
- **Story** (400, 1.0625rem, 1.65, max 62ch, pretty wrap): card text on the reader.
- **Label / slug** (600, 12px, 0.06em, uppercase, tabular numbers): datelines, categories, legends, block heads, button meta. Nav labels are 700 11px with 0.08em tracking. The brand is 800 15px with 0.08em tracking.
- **Numeral** (700, 15px mono, tabular): points and ranks. Item numbers are 700 13px mono, zero-padded ("01").

### Named Rules
**The Slug Line Rule.** Numbers, dates, times, points, categories and states are set as mono uppercase slugs. Headlines, sentences and hints are never set in mono caps.

## Layout

The layout is a single centred sheet (max 38rem) inset by a 28px `--edge` that clears the 14px sprocket strips. Fixed bottom nav is 60px high with four equal tabs. The primary action sits in a fixed dock above the nav, or at the bottom on screens without a nav. The dock fades in from paper over 22px. The sheet's bottom padding clears both the dock and the nav. Vertical rhythm follows the spacing scale: list rows 14px, blocks 26px apart, slug gaps 4-14px. Lists use a `30px / 1fr / 22px` grid: number, headline, mark. Respects `env(safe-area-inset-bottom)`.

## Elevation & Depth

The system is flat: nothing sits above the paper. Depth comes from inking (inverting), solid vs dashed rules, and border weight (1px rule, 1.5px control, 2px earned). The only `box-shadow` is a 1px inset ink line that thickens a pressed quiz choice into a double border, and it adds no elevation.

**The Printed Sheet Rule.** No drop shadows, blur or glass. If something has to stand out, ink it or thicken its rule.

## Shapes

Corners are nearly square: 4px on controls (buttons, inputs, chips, choices, tabs), 3px on stamps and the toast, 2px on tags and the inked rank row, 1px on leaves and bars. Solid lines mean structure or an active state. Dashed lines mean perforation, empty or unavailable. The torn leaf has a zig-zag bottom edge made with a conic-gradient mask. Earned badge stamps are tilted -1.5deg and 1.2deg, like rubber stamps.

## Components

### Buttons
- **Shape:** full width, 56px tall, with a 1.5px ink border and gently squared corners (4px). Label on the left, mono meta or an arrow on the right.
- **Primary:** ink fill with paper text, 700 17px sans.
- **Quiet:** transparent with ink text and border. When disabled, the border turns dashed in rule colour and the text fades.
- **Small:** 44px tall, 15px text, 14px side padding.
- **Press:** scales to 0.97 over 140ms using `--ease-out`. There is no hover treatment; this is a touch-first app.

### Feed Bar (signature)
The primary button doubles as the 15-second reading clock. It starts as deep canary. An ink layer is revealed left to right with `clip-path`, timed linearly to the server's clock (`--feed`), with a 4px red caret at the leading edge. Once the clock finishes, the caret is hidden and the full-ink button is ready. `feed-drain` runs the same layer in reverse as a countdown, which is used for the puzzle and quiz timers. With reduced motion, the caret is hidden.

### Chips
- **Style:** 44px tall, a 1.5px ink outline, 700 14px mono, 4px corners.
- **Used:** dashed rule-coloured border with faded text. Press scales to 0.96.

### Choices (quiz)
- 52px tall, a 1.5px rule border, left-aligned 16px text. Pressed: ink border plus a 1px inset ink line. Right: deep canary fill. Wrong: dashed ink border with a red cross.

### Inputs / Fields
- **Style:** 52px tall, transparent, a 1.5px ink border, 4px corners, 600 18px mono text. Label above is an ink slug. The hint below is 14px sans in faded ink.
- **Focus:** a 2px red outline at a 2px offset (applies to every element).
- **Error:** red 600-weight text with an alert mark.

### Navigation
A fixed bottom bar with paper fill and a 1px ink top rule. Four mono uppercase tabs (700 11px): Wire, Back issues, Board, Me. Inactive tabs use faded ink. The active tab uses ink with a 3px red bar on the top rule. The masthead is the TRENDO wordmark with a red block caret on the left and an ink slug on the right, above a 1px ink rule.

### Streak Leaves (signature)
A 14-column strip of 26px leaves with 3px gaps. On time = solid ink. Patched = ink with a 2px red stitch through the middle. Late = 135deg hatching in faded ink. Missed = empty dashed outline. Today = a red outline at a 2px offset. A mono legend sits underneath.

### Stamps, Tags, Toast, Tabs
- **Stamps:** dashed rule boxes with 3px corners. Earned stamps get a 2px ink border and a tilt.
- **Tags:** 1px ink box with 2px corners and 700 12px mono text. A struck tag adds a line-through and a dashed border.
- **Toast:** an ink pill with 3px corners and 700 13px mono text. It enters from 8px below via `@starting-style`.
- **Tabs:** a two-up segmented control with a 1.5px ink border. The selected segment is inked.

### Motion
One easing curve, `cubic-bezier(0.23, 1, 0.32, 1)`. Card text prints in from the top with a clip-path over 520ms. The end strip rises after 260ms. The torn leaf lifts up and away (translate 48px/-56px, rotate 10deg, 700ms). Today's new leaf drops in at 700ms. Every one of these has a reduced-motion fallback.

## Do's and Don'ts

### Do:
- **Do** keep canary (or carbon) paper behind every screen, with the sprocket strips on both edges.
- **Do** show state with a drawn 2px square-capped mark (tick, flag, cross, stitch, hatch), not with colour alone.
- **Do** set every number, date and status as a mono uppercase slug with tabular figures.
- **Do** separate rows with dashed perforations (1px rule), and use solid 1px ink rules for list and block heads.
- **Do** keep touch targets at 44px or more, and primary actions at 56px in the thumb dock.

### Don't:
- **Don't** use red as a fill. It is a caret, flag, stitch, outline or bar only.
- **Don't** add rounded white cards, drop shadows or a streak flame.
- **Don't** set prose, hints or headlines in mono caps.
- **Don't** load a web font. PRODUCT.md requires system fonts only.
- **Don't** add hover-only affordances. Use press scale and inking instead.
