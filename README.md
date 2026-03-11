<div align="center">

```
 ███████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ███████╗██╗   ██╗██████╗
 ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔══██╗██╔════╝██║   ██║██╔══██╗
 ███████╗██║   ██║██║   ██║███████║██████╔╝█████╗  ██║   ██║██████╔╝
 ╚════██║██║▄▄ ██║██║   ██║██╔══██║██╔══██╗██╔══╝  ██║   ██║██╔═══╝
 ███████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║███████╗╚██████╔╝██║
 ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝
```

**Mental Math Trainer · Built for Competitive Exam Aspirants**

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![CRA](https://img.shields.io/badge/Create_React_App-5.0-09d3ac?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-ffc200?style=flat-square)
![Zero Dependencies](https://img.shields.io/badge/External_Deps-0-00e87a?style=flat-square)

*Train fast. Calculate faster.*

</div>

---

## What is SquareUp?

SquareUp is a **browser-based mental math trainer** designed to build speed and accuracy for competitive exams like UPSC, SSC, CAT, and banking POs. It drills you on squares, cubes, square roots, and cube roots — the four operations that appear most in quantitative aptitude sections — with real-time feedback, animated hints, and a built-in scientific calculator for cross-verification.

No login. No ads. No fluff. Just math.

---

## Features

### 4 Quiz Modes

| Mode | Range | Example | Technique Taught |
|------|-------|---------|-----------------|
| **n²** Squares | 1 – 99 | `47²` = ? | Vedic Duplex method |
| **n³** Cubes | 1 – 30 | `28³` = ? | Step-by-step squaring |
| **√n** Square Root | √1 – √250,000 | `√176569` = ? | Digit-pair method (UPSC) |
| **∛n** Cube Root | ∛1 – ∛970,299 | `∛195112` = ? | Triplet method (UPSC) |

### Game Mechanics

- **Must solve to advance** — no skipping allowed. The correct answer must be entered before the next question unlocks, forcing genuine learning over passive review
- **Streak system** — consecutive first-try correct answers build a streak with milestone toast notifications
  - 3 → `TRIPLE! 🎯`  · 5 → `ON FIRE! 🔥`  · 10 → `UNSTOPPABLE! ⚡`  · 15 → `LEGENDARY! 👑`  · 20 → `GODMODE! 🏆`
- **First-try scoring** — accuracy tracks questions answered correctly on the first attempt, not just eventually
- **Non-distracting timer** — a subtle progress bar runs silently during each question with no flickering numbers; your solve time is revealed only after submission
- **Particle burst** — satisfying visual explosion on every correct answer
- **Card shake** — wrong input triggers a shake + red flash animation and clears the field to retry

### Step-by-Step Hints

Every mode has a dedicated hint panel teaching the actual mental math method:

| Mode | Hint Teaches |
|------|-------------|
| Squares | Vedic duplex breakdown — carry/keep notation at each digit position |
| Cubes | Two-step: compute n² first, then multiply by n |
| Square Root | UPSC digit-pair method with last-digit analysis and range narrowing |
| Cube Root | UPSC triplet method with unique cube-ending lookup table |

### Scientific Calculator

A full-featured built-in calculator for cross-verifying mental calculations:

- **Scientific functions** — `x²`  `x³`  `√`  `∛`  `1/x`  `n!`
- **Utility** — `±` sign toggle, `%` percentage, `⌫` backspace
- **Arithmetic** — `+` `−` `×` `÷` with operator chaining
- **Active operator highlight** — selected operator stays lit until `=` is pressed
- **Expression history** — previous calculation shown above the main display
- **Full keyboard support** — type naturally; no need to reach for the mouse

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm (bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/squareup.git

# 2. Enter the project directory
cd squareup

# 3. Install dependencies
npm install

# 4. Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

Outputs an optimized static bundle to the `build/` directory — ready to deploy on Vercel, Netlify, or GitHub Pages.

---

## How to Use

```
1. Pick a mode from the tab bar   →   n²   n³   √n   ∛n   CALC

2. A question appears — type your answer in the input field

3. Press Enter or click Submit
     ✓ Correct  →  particles burst · timer revealed · Next button appears
     ✗ Wrong    →  card shakes · field clears · timer keeps running · retry

4. Press Enter again (or click  Next →) to load the next question

5. Click Hint at any time to reveal the step-by-step method
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Submit answer / go to next question |
| `Enter` | Equals (calculator) |
| `+ - * /` | Operators (calculator) |
| `Backspace` | Delete last digit (calculator) |
| `Esc` | Clear calculator (AC) |

---

## How the Methods Work

### Duplex Method — Squares

For `47²` → split as `a = 4, b = 7`

```
Right:   b²             =  7²      = 49   →  write 9, carry 4
Middle:  2 × a × b + 4  =  56 + 4  = 60   →  write 0, carry 6
Left:    a² + 6         =  16 + 6  = 22

Read left to right:  22 | 0 | 9  =  2209  ✓
```

### Digit-Pair Method — Square Root

For `√7056`:

```
Step 1 — pair digits from right:   [ 70 ][ 56 ]
Step 2 — left pair 70:             8² = 64 ≤ 70 < 81 = 9²   →  tens digit = 8
Step 3 — last digit of 7056 is 6:  root ends in 4 or 6
Step 4 — range check:              80² = 6400,  90² = 8100

Answer: 84   (84² = 7056)  ✓
```

### Triplet Method — Cube Root

For `∛195112`:

```
Step 1 — group digits in 3s from right:   [ 195 ][ 112 ]
Step 2 — last digit of 195112 is 2:       cube endings are unique → root ends in 8
Step 3 — left group 195:                  5³ = 125 ≤ 195 < 216 = 6³  →  tens digit = 5

Answer: 58   (58³ = 195112)  ✓
```

---

## Project Structure

```
squareup/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← Entire application (all components, zero external UI libs)
│   ├── index.js        ← React entry point
│   └── setupTests.js
├── package.json
└── README.md
```

> The app is intentionally built as a **single-file React component** with no external UI libraries. All styling is pure inline CSS with injected keyframe animations. The result is a minimal bundle with zero style-library overhead.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Bundler | Create React App 5 |
| Styling | Inline styles + injected `@keyframes` CSS |
| State management | React `useState` · `useEffect` · `useRef` |
| External UI libs | **None** |

---

## Roadmap

- [ ] LocalStorage persistence for streaks and personal records
- [ ] Session mode — fixed N questions with a full end-of-session report card
- [ ] Weak number targeting — auto-prioritise numbers you get wrong most often
- [ ] Spaced repetition — re-show missed questions at increasing intervals
- [ ] Mobile numpad — custom on-screen numpad for touch-only devices
- [ ] Shareable score card image
- [ ] Difficulty presets — Easy / Medium / Hard / UPSC

---

## Contributing

Contributions are welcome. Please keep PRs focused — one feature or bug fix per PR.

```bash
# Fork, then:
git checkout -b feature/your-feature
# Make changes
git commit -m "feat: describe your change clearly"
git push origin feature/your-feature
# Open a Pull Request against main
```

---

## License

MIT © [Pratham Tomar](https://github.com/your-username)

---

<div align="center">

Built to make competitive exam prep faster and more effective.

**Star this repo ⭐ if it helped you crack a question faster.**

</div>
