<div align="center">

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ███████╗██╗   ██╗██████╗       ║
║   ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔══██╗██╔════╝██║   ██║██╔══██╗      ║
║   ███████╗██║   ██║██║   ██║███████║██████╔╝█████╗  ██║   ██║██████╔╝      ║
║   ╚════██║██║▄▄ ██║██║   ██║██╔══██║██╔══██╗██╔══╝  ██║   ██║██╔═══╝       ║
║   ███████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║███████╗╚██████╔╝██║           ║
║   ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝           ║
║                                                                              ║
║          ·  Mental  Math  Trainer  ·  Competitive  Exam  Prep  ·            ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

<p>
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/CRA-5.0-09d3ac?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-ffc200?style=for-the-badge" />
  <img src="https://img.shields.io/badge/External_Deps-Zero-00e87a?style=for-the-badge" />
</p>

<p><em>Train fast. Calculate faster.</em></p>

<br/>

### ⚡ Live Demo

<a href="https://square-up-bice.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/▶%20%20PLAY%20NOW-%20SquareUp%20Live-ffc200?style=for-the-badge&logoColor=black" alt="Play SquareUp Live" />
</a>

<br/><br/>

> A browser-based mental math trainer for UPSC, SSC, CAT, and Banking PO aspirants.
> Drills squares, cubes, square roots, cube roots, speed arithmetic, and multiplication tables — with real-time feedback, animated hints, and a built-in scientific calculator.
>
> **No login. No ads. No fluff. Just math.**

</div>

---

## What is SquareUp?

SquareUp is a **speed-focused mental math game** that forces you to solve before moving forward. Every question must be answered correctly to unlock the next one — no skipping, no cheating yourself.

It teaches you the actual Vedic and UPSC shortcut methods through step-by-step hints, so you're not just grinding — you're learning *why* the answers work.

---

## Features

### 4 Quiz Modes

| Mode | Range | Example | Technique |
|:----:|:-----:|:-------:|:---------:|
| **n²** Squares | 1 – 99 | `47²` = ? | Vedic Duplex |
| **n³** Cubes | 1 – 30 | `28³` = ? | Step-by-step squaring |
| **√n** Square Root | √1 – √250,000 | `√176569` = ? | UPSC Digit-Pair |
| **∛n** Cube Root | ∛1 – ∛970,299 | `∛195112` = ? | UPSC Triplet |

### Game Mechanics

| Feature | Description |
|:--------|:------------|
| 🔒 **Must Solve to Advance** | Correct answer required before next question unlocks |
| 🔥 **Streak System** | Consecutive first-try correct answers build a streak |
| 🎯 **First-Try Accuracy** | Score only counts answers correct on the very first attempt |
| ⏱️ **Silent Timer** | Progress bar runs quietly; solve time revealed only after correct answer |
| 💥 **Particle Burst** | Visual explosion on every correct answer |
| 📳 **Card Shake** | Wrong input triggers a shake + red flash; field clears to retry |

**Streak milestones:**

```
3  →  TRIPLE! 🎯     5  →  ON FIRE! 🔥     10  →  UNSTOPPABLE! ⚡
15  →  LEGENDARY! 👑     20  →  GODMODE! 🏆
```

### Step-by-Step Hints

Every mode has a dedicated hint panel teaching the actual shortcut method:

| Mode | What It Teaches |
|:-----|:----------------|
| Squares | Vedic duplex breakdown with carry/keep notation |
| Cubes | Two-step: compute n² first, then multiply by n |
| Square Root | UPSC digit-pair method with last-digit analysis |
| Cube Root | UPSC triplet method with unique cube-ending lookup table |

### Scientific Calculator (5th Tab)

Built-in calculator for cross-verifying your mental math:

- `x²` `x³` `√` `∛` `1/x` `n!` — scientific functions
- `±` `%` `⌫` — sign toggle, percentage, backspace
- `+` `−` `×` `÷` — arithmetic with operator chaining
- Active operator highlight stays lit until `=` is pressed
- Expression history shown above main display
- **Full keyboard support** — no mouse needed

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+
- npm (bundled with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Pratham-Tomar/SquareUp.git

# Enter the project directory
cd SquareUp

# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

Outputs an optimized static bundle to `build/` — ready to deploy on Vercel, Netlify, or GitHub Pages.

---

## How to Use

```
1.  Pick a mode  →  n²   n³   √n   ∛n   CALC

2.  A question appears — type your answer

3.  Press Enter or click Submit
      ✓ Correct  →  particles burst · timer revealed · Next unlocks
      ✗ Wrong    →  card shakes · field clears · timer keeps running · retry

4.  Press Enter again (or click Next →) for the next question

5.  Click Hint at any time for the step-by-step method
```

### Keyboard Shortcuts

| Key | Action |
|:----|:-------|
| `Enter` | Submit answer / next question |
| `Enter` | Equals (in calculator) |
| `+ - * /` | Operators (in calculator) |
| `Backspace` | Delete last digit (calculator) |
| `Esc` | Clear / AC (calculator) |

---

## How the Methods Work

<details>
<summary><strong>Duplex Method — Squares</strong></summary>

For `47²` → split as `a = 4, b = 7`

```
Right:   b²             =  7²      = 49   →  write 9, carry 4
Middle:  2 × a × b + 4  =  56 + 4  = 60   →  write 0, carry 6
Left:    a² + 6         =  16 + 6  = 22

Read left to right:  22 | 0 | 9  =  2209  ✓
```

</details>

<details>
<summary><strong>Digit-Pair Method — Square Root</strong></summary>

For `√7056`:

```
Step 1 — pair digits from right:   [ 70 ][ 56 ]
Step 2 — left pair 70:             8² = 64 ≤ 70 < 81 = 9²   →  tens digit = 8
Step 3 — last digit of 7056 is 6:  root ends in 4 or 6
Step 4 — range check:              80² = 6400 < 7056 < 8100 = 90²

Answer: 84   (84² = 7056)  ✓
```

</details>

<details>
<summary><strong>Triplet Method — Cube Root</strong></summary>

For `∛195112`:

```
Step 1 — group digits in 3s from right:   [ 195 ][ 112 ]
Step 2 — last digit of 195112 is 2:       cube endings are unique → root ends in 8
Step 3 — left group 195:                  5³ = 125 ≤ 195 < 216 = 6³  →  tens digit = 5

Answer: 58   (58³ = 195112)  ✓
```

</details>

---

## Project Structure

```
squareup/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← Entire app (all components, zero external UI libs)
│   ├── index.js        ← React entry point
│   └── setupTests.js
├── package.json
└── README.md
```

> Built as a **single-file React component** with no external UI libraries. All styling is pure inline CSS with injected `@keyframes` animations — minimal bundle, zero overhead.

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Framework | React 19 |
| Bundler | Create React App 5 |
| Styling | Inline styles + injected `@keyframes` CSS |
| State | `useState` · `useEffect` · `useRef` |
| External UI libs | **None** |

---

## Roadmap

- [ ] LocalStorage — persist streaks and personal records across sessions
- [ ] Session mode — fixed N questions with a full end-of-session report card
- [ ] Weak number targeting — auto-prioritise numbers you get wrong most often
- [ ] Spaced repetition — re-show missed questions at increasing intervals
- [ ] Mobile numpad — custom on-screen numpad for touch-only devices
- [ ] Shareable score card image
- [ ] Difficulty presets — Easy / Medium / Hard / UPSC

---

## Contributing

Contributions welcome. Keep PRs focused — one feature or fix per PR.

```bash
git checkout -b feature/your-feature
# make your changes
git commit -m "feat: describe your change"
git push origin feature/your-feature
# open a Pull Request against main
```

---

## License

MIT © [Pratham Tomar](https://github.com/Pratham-Tomar)

---

<div align="center">

Built to make competitive exam prep faster and more effective.

<a href="https://square-up-bice.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/▶%20%20OPEN%20LIVE%20APP-square--up--bice.vercel.app-ffc200?style=for-the-badge" alt="Open Live App" />
</a>

<br/><br/>

**Star this repo ⭐ if it helped you crack a question faster.**

</div>
