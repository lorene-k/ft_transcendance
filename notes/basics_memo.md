## 1. 📦 Flexbox Essentials (with Tailwind CSS)

### 🔹 Flexbox Parent (Container)

| CSS Property           | Tailwind Class         | Description                                      |
|------------------------|------------------------|--------------------------------------------------|
| `display: flex`        | `flex`                 | Enables flexbox layout                           |
| `flex-direction`       | `flex-row`, `flex-col` | Horizontal or vertical layout                    |
| `justify-content`      | `justify-center`       | Align children horizontally                      |
|                        | `justify-between`      | Space between items                              |
|                        | `justify-end`          | Align items to the right                         |
| `align-items`          | `items-center`         | Align children vertically                        |
|                        | `items-start`          | Align top                                        |
|                        | `items-end`            | Align bottom                                     |
| `gap`                  | `gap-4`, `gap-x-2`     | Space between children (x/y direction)           |

### 🔸 Flexbox Children (Items)

| CSS Property         | Tailwind Class     | Description                             |
|----------------------|--------------------|-----------------------------------------|
| `flex-grow`          | `flex-grow`        | Allow item to grow                      |
| `flex-shrink`        | `flex-shrink`      | Allow item to shrink                    |
| `flex-basis`         | `basis-1/2`        | Initial size of the item                |
| `align-self`         | `self-center`      | Override vertical alignment per item    |

---

## 2. 🧱 Useful HTML Elements

| Purpose           | Tag           | Example                        |
|-------------------|----------------|--------------------------------|
| Container         | `<div>`        | `<div class="p-4">Box</div>`   |
| Headings          | `<h1>`–`<h6>`  | `<h1>Title</h1>`               |
| Paragraph         | `<p>`          | `<p>Text</p>`                  |
| Anchor/Link       | `<a>`          | `<a href="#">Link</a>`         |
| Button            | `<button>`     | `<button>Click</button>`       |
| Image             | `<img>`        | `<img src="img.png" />`        |
| Input fields      | `<input>`      | `<input type="text" />`        |
| Form              | `<form>`       | `<form>...</form>`             |
| Lists             | `<ul>`, `<li>` | `<ul><li>Item</li></ul>`       |
| Table             | `<table>` etc. | `<table><tr><td>Data</td></tr></table>` |

---

## 🎨 Tailwind CSS Utility Classes

### Spacing
- Margin: `m-4`, `mt-2`, `mx-auto`
- Padding: `p-4`, `px-6`, `py-2`
- Gap between children: `gap-4`, `gap-x-2`

### Text & Font
- Size: `text-sm`, `text-xl`, `text-4xl`
- Weight: `font-light`, `font-bold`
- Align: `text-left`, `text-center`, `text-right`

### Colors
- Text: `text-gray-700`, `text-white`, `text-blue-500`
- Background: `bg-white`, `bg-gray-900`, `bg-red-500`
- Border: `border`, `border-gray-300`

### Layout
- Width & height: `w-full`, `w-1/2`, `h-screen`
- Display: `flex`, `grid`, `block`, `hidden`
- Position: `relative`, `absolute`, `fixed`

### Effects
- Hover: `hover:bg-blue-600`
- Shadow: `shadow`, `shadow-md`, `shadow-lg`
- Rounded corners: `rounded`, `rounded-full`, `rounded-xl`

---

## 🌙 Tailwind Dark Mode Classes

Tailwind supports dark mode using the `dark:` prefix.

### Enabling Dark Mode
In `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}