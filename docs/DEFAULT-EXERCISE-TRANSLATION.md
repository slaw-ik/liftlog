# Default exercise and category translation (beginner guide)

## What problem does this solve?

The app supports several languages (e.g. English, Russian, Ukrainian). We want:

- **Built-in exercises** (like “Bench Press”, “Deadlift”) to **change with the app language**. If you switch to Ukrainian, you should see “Жим лежачи” instead of “Bench Press”.
- **Your own exercises** (ones you add yourself) to **stay exactly as you typed them**. If you created “My custom row”, it should never turn into a translated phrase.

- **Default section names** (PULLS, PRESSES, LEGS) to **change with the app language** (e.g. "ТЯГИ", "ЖИМЫ", "НОГИ" in Russian). **Custom section names** you create stay as you typed them.

So: **defaults = translated**, **custom = as entered** (for both exercises and categories).

---

## How do we know which is which?

The database has a list of **exercises**. Each exercise has:

- **name** – e.g. “Bench Press” (what we store).
- **i18n_key** – optional. If it’s set (e.g. `defaultExercises.benchPress`), the app treats this as a built-in exercise and shows the translated label for the current language. If it’s empty, we show **name** as-is (your custom name).

So:

- **Default exercise:** has `i18n_key` set → we show `t(i18n_key)` (translated).
- **Custom exercise:** no `i18n_key` → we show `name`.

---

## Where do default exercises come from?

When you tap “Add default categories” in Sections, the app **seeds** a fixed list of exercises. For each of those we save:

- **name** = English name (e.g. “Bench Press”), so the database always has one stable value.
- **i18n_key** = e.g. `defaultExercises.benchPress`, which points into our translation table.

Translations live in code (e.g. in `lib/i18n.ts`): for each language we have a map like “Bench Press” → “Жим лёжа” (Russian), “Жим лежачи” (Ukrainian), etc. The **key** (e.g. `defaultExercises.benchPress`) is what we store; the **value** is what we show, and it depends on the current language.

---

## What about exercises I already had before this feature?

When the app was updated, we added a **migration**:

1. A new column `i18n_key` was added to the exercises table.
2. For every **existing** exercise whose **name** matches one of the built-in names (in any of our languages), we set `i18n_key` to the right key.

So old data is fixed up once: your existing “Bench Press” (or “Жим лёжа” if it was in Russian) gets `i18n_key = defaultExercises.benchPress`, and from then on it behaves like a default exercise and changes with the language.

---

## What about category/section names?

The three **default sections** (PULLS, PRESSES, LEGS) are also translated. We don’t store a key in the database for them; instead we have a small map from every translation of these names (in en/ru/uk) to the i18n key (`defaultSections.pulls`, etc.). When we **display** a category, we look it up: if it’s one of those three (in any language), we show the translated label for the current language; otherwise we show the stored name (your custom section name).

So the same idea: **default sections = translated**, **custom sections = as entered**.

## Where do we use this in the app?

**Exercise names:** everywhere we show an exercise we use the same rule (if `i18n_key` is set → translated; else → stored name). That’s in Sections, Home/Workout (picker, recent sets), and History (set list, filters, chart, progress modal, edit-set modal).

**Category names:** everywhere we show a section/category we use `getCategoryDisplayName(category, t)` so the three default sections are translated and custom section names stay as entered. That’s in Sections (section headers), Home (section name in picker, category under recent sets), and History (set list, filters, progress modal).

So one rule everywhere: **defaults translate, custom names stay as entered**.

---

## Short glossary

- **i18n** = internationalization (making the app work in multiple languages).
- **Default / built-in exercise** = one from the app’s predefined list (has `i18n_key`).
- **Custom exercise** = one you created (no `i18n_key`).
- **Stable id** = in History we group sets by “exercise”. For defaults we use the i18n key (e.g. `defaultExercises.benchPress`), for custom we use the name. That way changing language doesn’t break grouping.
- **getCategoryDisplayName(category, t)** = returns the translated label for the three default sections (by matching stored category to a key), or the raw category for custom sections.
- **Seed** = inserting the initial list of default exercises into the database.
- **Migration** = a one-time update to the database (e.g. add column, backfill `i18n_key` for existing rows).
