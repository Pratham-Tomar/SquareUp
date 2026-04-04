import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  Global CSS
// ─────────────────────────────────────────────────────────────────────────────
const STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    18%     { transform: translateX(-11px); }
    36%     { transform: translateX(11px); }
    54%     { transform: translateX(-6px); }
    72%     { transform: translateX(6px); }
  }
  @keyframes pop {
    0%   { transform: scale(1); }
    45%  { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes toastAnim {
    0%   { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.9); }
    15%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    78%  { opacity: 1; }
    100% { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.95); }
  }
  @keyframes pOut {
    0%   { opacity: 1; transform: translate(-50%,-50%) translate(0,0) scale(1); }
    100% { opacity: 0; transform: translate(-50%,-50%) translate(var(--dx),var(--dy)) scale(0.1); }
  }
  @keyframes glowGreen {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,255,136,0); }
    50%     { box-shadow: 0 0 30px 8px rgba(0,255,136,0.2); }
  }
  @keyframes glowRed {
    0%,100% { box-shadow: 0 0 0 0 rgba(255,68,85,0); }
    50%     { box-shadow: 0 0 30px 8px rgba(255,68,85,0.18); }
  }
  @keyframes wrongFlash {
    0%   { border-color: #ff4455; box-shadow: 0 0 18px rgba(255,68,85,0.4); background: rgba(255,68,85,0.07); }
    100% { border-color: #1a1a2e; box-shadow: none; background: #080810; }
  }
  @keyframes streakBounce {
    0%   { transform: scale(1) rotate(-4deg); }
    100% { transform: scale(1.25) rotate(4deg); }
  }
  @keyframes scoreFlash {
    0%   { color: #fff; transform: scale(1.4); }
    100% { transform: scale(1); }
  }
  @keyframes modeSlide {
    from { opacity: 0; transform: translateY(-5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes calcBtnPress {
    0%   { transform: scale(1); }
    50%  { transform: scale(0.94); }
    100% { transform: scale(1); }
  }

  .anim-shake      { animation: shake 0.42s ease; }
  .anim-pop        { animation: pop 0.32s ease; }
  .anim-slide-up   { animation: slideUp 0.26s ease; }
  .anim-toast      { animation: toastAnim 2.4s ease forwards; }
  .anim-particle   { animation: pOut 0.65s ease-out forwards; }
  .anim-glow-green { animation: glowGreen 0.65s ease 2; }
  .anim-glow-red   { animation: glowRed 0.65s ease 2; }
  .anim-wrong-inp  { animation: wrongFlash 0.9s ease forwards; }
  .anim-streak     { animation: streakBounce 0.35s ease infinite alternate; }
  .anim-score      { animation: scoreFlash 0.4s ease; }
  .anim-mode       { animation: modeSlide 0.22s ease; }
  .anim-btn-press  { animation: calcBtnPress 0.12s ease; }

  button { cursor: pointer; transition: filter 0.15s, transform 0.1s; }
  button:hover  { filter: brightness(1.18); transform: translateY(-1px); }
  button:active { filter: brightness(0.85); transform: scale(0.96); }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  ::selection { background: rgba(255,194,0,0.22); }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getDuplexHint = (n) => {
  const a = Math.floor(n/10), b = n%10;
  const right = b*b, rd = right%10, rc = Math.floor(right/10);
  const mid = 2*a*b+rc, md = mid%10, mc = Math.floor(mid/10);
  return { a, b, right, rightDigit:rd, rightCarry:rc, mid, midDigit:md, midCarry:mc, left:a*a+mc };
};

const CBRT_LAST = {0:0,1:1,8:2,7:3,4:4,5:5,6:6,3:7,2:8,9:9};
const SQRT_LAST = {0:[0],1:[1,9],4:[2,8],5:[5],6:[4,6],9:[3,7]};
const STREAK_MSGS = {3:"TRIPLE! 🎯",5:"ON FIRE! 🔥",10:"UNSTOPPABLE! ⚡",15:"LEGENDARY! 👑",20:"GODMODE! 🏆"};

// ─────────────────────────────────────────────────────────────────────────────
//  Speed Math — level-based problem generator
//  tier = every 5 correct answers (first-try) → digits scale up
// ─────────────────────────────────────────────────────────────────────────────
const TABLES_NUMS = Array.from({length:20}, (_,i) => i+1);

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Digit helpers
// ─────────────────────────────────────────────────────────────────────────────
const UNIT_CYCLES = {2:[2,4,8,6], 3:[3,9,7,1], 7:[7,9,3,1], 8:[8,4,2,6]};

const modPow = (base, exp, mod) => {
  if (mod === 1) return 0;
  let result = 1; base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
};

const getRemCycle = (base, divisor) => {
  const cycle = [];
  let cur = base % divisor;
  for (let i = 0; i < divisor + 2; i++) {
    cycle.push(cur);
    if (i > 0 && cur === cycle[0]) { cycle.pop(); break; }
    cur = (cur * base) % divisor;
  }
  return cycle;
};

const calcUnitDigitPower = (base, power) => {
  const ud = base % 10;
  if (power === 0) return 1;
  if ([0,1,5,6].includes(ud)) return ud;
  if (ud === 4) return power % 2 === 0 ? 6 : 4;
  if (ud === 9) return power % 2 === 0 ? 1 : 9;
  const cycle = UNIT_CYCLES[ud];
  const rem = power % 4;
  return cycle[rem === 0 ? 3 : rem - 1];
};

const genUnitProblem = (op) => {
  if (op === "mul") {
    const count = rand(3, 4);
    const nums = Array.from({length: count}, () => rand(12, 99));
    const answer = nums.reduce((acc, n) => (acc * n) % 10, 1);
    return { nums, answer, op };
  }
  if (op === "rem") {
    const bases = [2, 3, 4, 5, 6, 7, 8, 9];
    const divisors = [3, 7, 9, 11, 13];
    const base = bases[rand(0, bases.length - 1)];
    const divisor = divisors[rand(0, divisors.length - 1)];
    const power = rand(50, 999);
    const answer = modPow(base, power, divisor);
    return { base, power, divisor, answer, op };
  }
  // For power — pick a base whose unit digit has an interesting cycle (not trivial 0,1,5,6)
  const interestingUnits = [2,3,4,7,8,9];
  const unitDigit = interestingUnits[rand(0, interestingUnits.length - 1)];
  const tens = rand(1, 9);
  const base = tens * 10 + unitDigit;
  const power = rand(3, 49);
  const answer = calcUnitDigitPower(base, power);
  return { base, power, answer, op };
};

const UNIT_SUBS = [
  { id:"mul", label:"MULTIPLY",  color:"#fb7185" },
  { id:"pow", label:"POWER",     color:"#fb7185" },
  { id:"rem", label:"REMAINDER", color:"#fb7185" },
];

const SPEED_SUBS = [
  { id:"add", label:"＋", sym:"+", color:"#00e87a" },
  { id:"sub", label:"－", sym:"−", color:"#ffc200" },
  { id:"mul", label:"×",  sym:"×", color:"#ff6b35" },
  { id:"div", label:"÷",  sym:"÷", color:"#a78bfa" },
];

const genSpeedProblem = (op, level) => {
  const tier = Math.min(Math.floor((level - 1) / 5), 6);
  if (op === "add") {
    const cfgs = [
      [rand(2,9),      rand(2,9)],
      [rand(12,99),    rand(2,9)],
      [rand(12,99),    rand(12,99)],
      [rand(100,999),  rand(12,99)],
      [rand(100,999),  rand(100,999)],
      [rand(1000,9999),rand(100,999)],
      [rand(1000,9999),rand(1000,9999)],
    ];
    const [a,b] = cfgs[tier];
    return { a, b, sym:"+", answer:a+b };
  }
  if (op === "sub") {
    const gens = [
      ()=>{ const b=rand(1,7);   return [rand(b+1,9),b];         },
      ()=>{ const b=rand(2,9);   return [rand(b+10,99),b];       },
      ()=>{ const b=rand(10,49); return [rand(b+10,b+50),b];     },
      ()=>{ const b=rand(12,99); return [rand(b+100,b+500),b];   },
      ()=>{ const b=rand(100,499);return [rand(b+100,b+400),b];  },
      ()=>{ const b=rand(100,999);return [rand(b+1000,b+3000),b];},
      ()=>{ const b=rand(1000,4999);return [rand(b+1000,b+4000),b];},
    ];
    const [a,b] = gens[tier]();
    return { a, b, sym:"−", answer:a-b };
  }
  if (op === "mul") {
    const cfgs = [
      [rand(2,9),   rand(2,9)],
      [rand(11,99), rand(2,9)],
      [rand(11,99), rand(2,9)],
      [rand(11,29), rand(11,29)],
      [rand(12,59), rand(12,49)],
      [rand(25,99), rand(25,99)],
      [rand(100,999),rand(2,9)],
    ];
    const [a,b] = cfgs[tier];
    return { a, b, sym:"×", answer:a*b };
  }
  // div — generate clean (no remainder) by multiplying first
  const gens = [
    ()=>{ const b=rand(2,9);   const q=rand(2,9);   return [b*q,b,q]; },
    ()=>{ const b=rand(2,9);   const q=rand(10,19);  return [b*q,b,q]; },
    ()=>{ const b=rand(2,9);   const q=rand(20,99);  return [b*q,b,q]; },
    ()=>{ const b=rand(11,29); const q=rand(11,39);  return [b*q,b,q]; },
    ()=>{ const b=rand(12,49); const q=rand(20,79);  return [b*q,b,q]; },
    ()=>{ const b=rand(12,99); const q=rand(50,199); return [b*q,b,q]; },
    ()=>{ const b=rand(25,99); const q=rand(100,299);return [b*q,b,q]; },
  ];
  const [a,b,ans] = gens[tier]();
  return { a, b, sym:"÷", answer:ans };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Modes
// ─────────────────────────────────────────────────────────────────────────────
const MODES = [
  { id:"squares", label:"n²",   title:"SQUARES",    subtitle:"1–99  ·  Find the square",  color:"#ffc200",
    gen:()=>{ const n=rand(1,99);  return {n, display:n,     answer:n*n};    } },
  { id:"cubes",   label:"n³",   title:"CUBES",      subtitle:"1–30  ·  Find the cube",    color:"#ff6b35",
    gen:()=>{ const n=rand(1,30);  return {n, display:n,     answer:n*n*n};  } },
  { id:"sqrt",    label:"√n",   title:"SQ. ROOT",   subtitle:"1–500  ·  UPSC style",      color:"#00e87a",
    gen:()=>{ const n=rand(1,500); return {n, display:n*n,   answer:n};      } },
  { id:"cbrt",    label:"∛n",   title:"CUBE ROOT",  subtitle:"1–99  ·  UPSC style",       color:"#a78bfa",
    gen:()=>{ const n=rand(1,99);  return {n, display:n*n*n, answer:n};      } },
  { id:"calc",    label:"CALC",  title:"CALCULATOR", subtitle:"Scientific calculator",      color:"#38bdf8",
    gen: null },
  { id:"speed",   label:"SPEED",  title:"SPEED MATH", subtitle:"Progressive mental arithmetic", color:"#f472b6",
    gen: null },
  { id:"tables",  label:"TABLE",  title:"TABLES",     subtitle:"1–20 · Complete all 10",         color:"#22d3ee",
    gen: null },
  { id:"unit",    label:"UNIT",   title:"UNIT DIGIT", subtitle:"Find the unit place digit",         color:"#fb7185",
    gen: null },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Particles
// ─────────────────────────────────────────────────────────────────────────────
const PDOTS = Array.from({length:20},(_,i)=>{
  const a=(i/20)*Math.PI*2, d=65+Math.random()*55;
  return { dx:Math.cos(a)*d, dy:Math.sin(a)*d, size:i%3===0?9:5, alt:i%2===0 };
});
function Particles({ color }) {
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:"inherit"}}>
      {PDOTS.map((p,i)=>(
        <div key={i} className="anim-particle" style={{
          position:"absolute", left:"50%", top:"45%",
          width:p.size, height:p.size, borderRadius:"50%",
          background:p.alt?color:"#fff",
          "--dx":p.dx+"px","--dy":p.dy+"px",
        }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ msg, color }) {
  return (
    <div className="anim-toast" style={{
      position:"fixed", bottom:"88px", left:"50%",
      background:color, color:"#07070f",
      fontFamily:"'Courier New',monospace", fontWeight:"900",
      fontSize:"13px", letterSpacing:"3px",
      padding:"10px 28px", borderRadius:"3px",
      zIndex:200, pointerEvents:"none", whiteSpace:"nowrap",
      boxShadow:`0 4px 28px ${color}66`,
    }}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Timer Bar  (bar only — number shows after solve to avoid distraction)
// ─────────────────────────────────────────────────────────────────────────────
function TimerBar({ elapsed, accent, solved }) {
  const secs = parseFloat(elapsed);
  const pct  = Math.min(secs / 30, 1);
  const barColor = secs > 25 ? "#ff4455" : secs > 15 ? "#ff6b35" : accent;

  return (
    <div style={{width:"100%",maxWidth:"460px",marginBottom:"12px",zIndex:1}}>
      {/* Thin bar */}
      <div style={{
        width:"100%", height:"3px",
        background:"#111128", borderRadius:"3px", overflow:"hidden",
      }}>
        <div style={{
          height:"100%",
          width: solved ? `${pct*100}%` : `${pct*100}%`,
          background:`linear-gradient(90deg, ${accent}88, ${barColor})`,
          borderRadius:"3px",
          transition: solved ? "none" : "width 1s linear, background 0.5s",
          boxShadow:`0 0 6px ${barColor}88`,
        }}/>
      </div>

      {/* Labels — time only visible after solving */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginTop:"5px", padding:"0 1px",
      }}>
        <div style={{fontSize:"9px",letterSpacing:"2px",color:"#4a4a6a"}}>TIMER</div>
        <div style={{
          fontSize: solved ? "13px" : "11px",
          fontFamily:"'Courier New',monospace",
          fontWeight: solved ? "700" : "400",
          color: solved ? barColor : "#1e1e38",
          letterSpacing:"1px",
          transition:"color 0.3s, font-size 0.2s",
        }}>
          {solved ? `${elapsed}s` : "• • •"}
        </div>
        <div style={{fontSize:"9px",letterSpacing:"2px",color:solved?"#6b6b8a":"#4a4a6a"}}>
          {solved ? "DONE" : "LIVE"}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Calculator
// ─────────────────────────────────────────────────────────────────────────────
function Calculator({ accent }) {
  const [display,    setDisplay]    = useState("0");
  const [history,    setHistory]    = useState("");
  const [pending,    setPending]    = useState(null);   // { val, op }
  const [fresh,      setFresh]      = useState(true);
  const [activeOp,   setActiveOp]   = useState(null);   // highlights active operator
  const [pressedBtn, setPressedBtn] = useState(null);

  const fmt = (n) => {
    if (!isFinite(n)) return "Error";
    return parseFloat(n.toFixed(10)).toString();
  };

  const applyOp = (a, op, b) => {
    if (op === "+") return a + b;
    if (op === "−") return a - b;
    if (op === "×") return a * b;
    if (op === "÷") return b === 0 ? Infinity : a / b;
    return b;
  };

  const pressDigit = (d) => {
    setActiveOp(null);
    setDisplay(prev => (fresh || prev === "0") && d !== "." ? d : prev.length < 15 ? prev + d : prev);
    setFresh(false);
  };

  const pressDot = () => {
    const base = fresh ? "0" : display;
    if (!base.includes(".")) { setDisplay(base + "."); setFresh(false); }
  };

  const pressOp = (op) => {
    const cur = parseFloat(display);
    if (pending && !fresh) {
      const result = applyOp(pending.val, pending.op, cur);
      setHistory(fmt(result) + "  " + op);
      setPending({ val: result, op });
      setDisplay(fmt(result));
    } else {
      setHistory(display + "  " + op);
      setPending({ val: cur, op });
    }
    setActiveOp(op);
    setFresh(true);
  };

  const pressEquals = () => {
    if (!pending) return;
    const cur = parseFloat(display);
    const result = applyOp(pending.val, pending.op, cur);
    setHistory(`${pending.val}  ${pending.op}  ${cur}  =`);
    setDisplay(fmt(result));
    setPending(null);
    setActiveOp(null);
    setFresh(true);
  };

  const pressSpecial = (fn) => {
    const val = parseFloat(display);
    const ops = {
      "x²":  [val * val,           `${display}²`],
      "x³":  [val * val * val,     `${display}³`],
      "√":   [Math.sqrt(val),      `√(${display})`],
      "∛":   [Math.cbrt(val),      `∛(${display})`],
      "1/x": [1 / val,             `1/${display}`],
      "n!":  [factorial(val),      `${display}!`],
      "%":   [val / 100,           `${display}%`],
      "±":   [-val,                `±(${display})`],
    };
    const [result, label] = ops[fn] ?? [val, display];
    setHistory(label + "  =");
    setDisplay(fmt(result));
    setPending(null);
    setActiveOp(null);
    setFresh(true);
  };

  const pressBack = () => {
    if (fresh) return;
    const next = display.slice(0, -1);
    setDisplay(next.length === 0 || next === "-" ? "0" : next);
  };

  const pressClear = () => {
    setDisplay("0"); setHistory(""); setPending(null); setFresh(true); setActiveOp(null);
  };

  const handlePress = (label) => {
    setPressedBtn(label);
    setTimeout(() => setPressedBtn(null), 130);
    if ("0123456789".includes(label))          { pressDigit(label); return; }
    if (label === ".")                          { pressDot();        return; }
    if (label === "=")                          { pressEquals();     return; }
    if (label === "AC")                         { pressClear();      return; }
    if (label === "⌫")                         { pressBack();       return; }
    if (["+","−","×","÷"].includes(label))     { pressOp(label);    return; }
    pressSpecial(label);
  };

  useEffect(() => {
    const handler = (e) => {
      const map = {
        "0":"0","1":"1","2":"2","3":"3","4":"4",
        "5":"5","6":"6","7":"7","8":"8","9":"9",
        ".":".","Enter":"=","Backspace":"⌫","Escape":"AC",
        "+":"+","-":"−","*":"×","/":"÷",
      };
      if (map[e.key]) { e.preventDefault(); handlePress(map[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, pending, fresh]);

  // ── button appearance ────────────────────────────────────────────────────
  const BTN_H = 58;
  const pressed = (l) => pressedBtn === l;

  const Btn = ({ label, style: extraStyle, children }) => {
    const isP = pressed(label);
    const base = {
      height: BTN_H,
      borderRadius: 12,
      border: "none",
      fontSize: 18,
      fontFamily: "'Courier New', monospace",
      fontWeight: 500,
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "100%",
      transform: isP ? "scale(0.91)" : "scale(1)",
      transition: "transform 0.1s, filter 0.1s",
      filter: isP ? "brightness(0.78)" : "brightness(1)",
      userSelect: "none",
    };

    let specific = {};
    if (label === "=")                          specific = { background: accent, color: "#07070f", fontWeight: 700, fontSize: 22, boxShadow: `0 4px 20px ${accent}55` };
    else if (label === "AC")                    specific = { background: "#2a0e0e", color: "#ff6b6b", fontWeight: 700, fontSize: 15 };
    else if (label === "⌫")                    specific = { background: "#1c1a0a", color: "#ffb347", fontSize: 15 };
    else if (["+","−","×","÷"].includes(label)) specific = {
      background: activeOp === label ? accent : `${accent}18`,
      color:      activeOp === label ? "#07070f" : accent,
      fontWeight: 700, fontSize: 22,
      boxShadow:  activeOp === label ? `0 2px 12px ${accent}44` : "none",
    };
    else if (["±","%"].includes(label))         specific = { background: "#131325", color: "#6b6b9a", fontSize: 16 };
    else                                        specific = { background: "#13132a", color: "#e0e0d8" };

    return (
      <button
        onClick={() => handlePress(label)}
        style={{ ...base, ...specific, ...extraStyle }}
      >
        {children ?? label}
      </button>
    );
  };

  // science buttons
  const SCI = [
    { l:"x²",  sym:"x²" }, { l:"x³",  sym:"x³" },
    { l:"√",   sym:"√"  }, { l:"∛",   sym:"∛"  },
    { l:"1/x", sym:"1/x"}, { l:"n!",  sym:"n!" },
  ];

  const displayFontSize =
    display.length > 14 ? 22 :
    display.length > 10 ? 28 :
    display.length > 7  ? 36 : 46;

  return (
    <div style={{ width:"100%", maxWidth:"360px", zIndex:1 }}>

      {/* ── Display Panel ── */}
      <div style={{
        background:"linear-gradient(160deg, #0f0f22 0%, #09091a 100%)",
        border:"1.5px solid #1e1e38",
        borderRadius:"16px 16px 0 0",
        padding:"20px 22px 16px",
        minHeight:"110px",
        display:"flex", flexDirection:"column", justifyContent:"flex-end",
      }}>
        {/* History / expression */}
        <div style={{
          fontSize: 11, color:"#333", minHeight:16,
          textAlign:"right", letterSpacing:"0.5px", marginBottom:6,
          fontFamily:"'Courier New',monospace",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {history || "\u00A0"}
        </div>

        {/* Main value */}
        <div style={{
          fontSize: displayFontSize, fontWeight:700, color:"#fff",
          textAlign:"right", fontFamily:"'Courier New',monospace",
          letterSpacing:"-1px", lineHeight:1.1, wordBreak:"break-all",
          transition:"font-size 0.12s",
          textShadow:`0 0 24px ${accent}55`,
        }}>
          {display}
        </div>

        {/* Active op pill */}
        {activeOp && (
          <div style={{
            display:"flex", justifyContent:"flex-end", marginTop:6,
          }}>
            <span style={{
              background:`${accent}22`, color:accent,
              borderRadius:20, padding:"2px 10px",
              fontSize:11, letterSpacing:1,
              fontFamily:"'Courier New',monospace",
              border:`1px solid ${accent}44`,
            }}>
              {activeOp}
            </span>
          </div>
        )}
      </div>

      {/* ── Science Strip ── */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4,
        background:"#0b0b1e",
        borderLeft:"1.5px solid #1e1e38", borderRight:"1.5px solid #1e1e38",
        padding:"8px 10px",
      }}>
        {SCI.map(({l, sym}) => (
          <button
            key={l}
            onClick={() => handlePress(l)}
            style={{
              height:36, borderRadius:8, border:"1px solid #252540",
              background: pressed(l) ? "#252545" : "#0f0f28",
              color:"#a78bfa", fontSize:13,
              fontFamily:"'Courier New',monospace", fontWeight:500,
              cursor:"pointer",
              transform: pressed(l) ? "scale(0.9)" : "scale(1)",
              transition:"transform 0.1s, filter 0.1s",
              filter: pressed(l) ? "brightness(0.75)" : "brightness(1)",
              letterSpacing:"0.3px",
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* ── Main Button Grid ── */}
      <div style={{
        background:"#0d0d1e",
        border:"1.5px solid #1e1e38",
        borderTop:"none",
        borderRadius:"0 0 16px 16px",
        padding:"10px 10px 14px",
        display:"flex", flexDirection:"column", gap:5,
      }}>

        {/* Row 1: AC  ±  %  ÷ */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          {["AC","±","%","÷"].map(l => <Btn key={l} label={l}/>)}
        </div>

        {/* Row 2: 7 8 9 × */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          {["7","8","9","×"].map(l => <Btn key={l} label={l}/>)}
        </div>

        {/* Row 3: 4 5 6 − */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          {["4","5","6","−"].map(l => <Btn key={l} label={l}/>)}
        </div>

        {/* Row 4: 1 2 3 + */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          {["1","2","3","+"].map(l => <Btn key={l} label={l}/>)}
        </div>

        {/* Row 5: 0(wide)  .  ⌫  = */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:5}}>
          <Btn label="0"/>
          <Btn label="." style={{fontSize:24,fontWeight:700}}>·</Btn>
          <Btn label="⌫">⌫</Btn>
          <Btn label="="/>
        </div>

      </div>

      <div style={{
        textAlign:"center", marginTop:10,
        fontSize:9, color:"#1a1a30", letterSpacing:"2px",
      }}>
        KEYBOARD · + − * / ENTER BACKSPACE ESC
      </div>
    </div>
  );
}

// factorial helper
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 20) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Hint Panel
// ─────────────────────────────────────────────────────────────────────────────
function HintPanel({ modeId, n, accent }) {
  const lb = { color:accent, letterSpacing:"2px", fontSize:"11px", marginBottom:"14px", fontWeight:"700" };
  const rw = { color:"#555", lineHeight:"2.1", fontSize:"13px" };
  const hl = v => <span style={{color:"#ddd"}}>{v}</span>;
  const gr = v => <span style={{color:"#00ff88",fontWeight:"700"}}>{v}</span>;
  const or = v => <span style={{color:"#ff6b35"}}>{v}</span>;
  const dm = v => <span style={{color:"#333"}}>{v}</span>;
  const bx = v => <span style={{color:"#ccc",border:"1px solid #2a2a3a",padding:"1px 5px",borderRadius:"2px",margin:"0 2px",fontFamily:"monospace"}}>{v}</span>;

  if (modeId==="squares") {
    const h=getDuplexHint(n);
    return (<>
      <div style={lb}>DUPLEX BREAKDOWN</div>
      <div style={rw}>Right:  {h.b}² = {hl(h.right)} → keep {gr(h.rightDigit)}, carry {or(h.rightCarry)}</div>
      <div style={rw}>Middle: 2×{h.a}×{h.b} + {h.rightCarry} = {hl(h.mid)} → keep {gr(h.midDigit)}, carry {or(h.midCarry)}</div>
      <div style={rw}>Left:   {h.a}² + {h.midCarry} = {gr(h.left)}</div>
      <div style={{color:"#3a3a5a",fontSize:"12px",marginTop:"10px"}}>Answer: {gr(h.left)}{gr(h.midDigit)}{gr(h.rightDigit)}</div>
    </>);
  }
  if (modeId==="cubes") {
    const sq=n*n;
    return (<>
      <div style={lb}>STEP-BY-STEP</div>
      <div style={rw}>Step 1: {n}² = {gr(sq)}</div>
      <div style={rw}>Step 2: {n}³ = {n} × {sq} = {gr(sq*n)}</div>
      <div style={{color:"#333",fontSize:"12px",marginTop:"8px"}}>{dm("Square first → then multiply by "+n)}</div>
    </>);
  }
  if (modeId==="sqrt") {
    const sq=n*n, str=String(sq), pairs=[];
    let t=str;
    while(t.length>0){const k=t.length%2===1&&pairs.length===0?1:2;pairs.push(t.slice(0,k));t=t.slice(k);}
    const lp=parseInt(pairs[0]),td=Math.floor(Math.sqrt(lp)),ld=sq%10,poss=SQRT_LAST[ld]??[],lo=Math.floor(n/10)*10;
    return (<>
      <div style={lb}>DIGIT-PAIR METHOD  √{sq.toLocaleString()}</div>
      <div style={rw}>Step 1 — pair from right: {pairs.map((p,i)=><span key={i}>{bx(p)}</span>)}</div>
      <div style={rw}>Step 2 — left pair {hl(lp)}: largest x² ≤ {lp} → {gr(td)} {dm(`(${td}²=${td*td})`)}</div>
      <div style={rw}>Step 3 — last digit {hl(ld)}: root ends in {gr(poss.join(" or "))}</div>
      <div style={rw}>Step 4 — range: {lo}²={hl(lo*lo)},  {lo+10}²={hl((lo+10)*(lo+10))}</div>
      <div style={{color:"#333",fontSize:"12px",marginTop:"8px"}}>Answer = {gr(n)}</div>
    </>);
  }
  if (modeId==="cbrt") {
    const cube=n*n*n, cs=String(cube), groups=[];
    let t2=cs;
    while(t2.length>0){const k=t2.length%3===0?3:t2.length%3;if(groups.length===0){groups.push(t2.slice(0,k));t2=t2.slice(k);}else{groups.push(t2.slice(0,3));t2=t2.slice(3);}}
    const lg=parseInt(groups[0]),lcd=cube%10,rl=CBRT_LAST[lcd],td=Math.floor(Math.cbrt(lg));
    return (<>
      <div style={lb}>TRIPLET METHOD  ∛{cube.toLocaleString()}</div>
      <div style={rw}>Step 1 — group in 3s: {groups.map((g,i)=><span key={i}>{bx(g)}</span>)}</div>
      <div style={rw}>Step 2 — last digit {hl(lcd)} → root ends in {gr(rl)} {dm("(cube endings unique!)")}</div>
      <div style={rw}>Step 3 — left group {hl(lg)}: largest x³ ≤ {lg} → {gr(td)} {dm(`(${td}³=${td**3})`)}</div>
      <div style={rw}>Step 4 — tens={gr(td)}, units={gr(rl)}</div>
      <div style={{color:"#333",fontSize:"12px",marginTop:"8px"}}>Answer = {gr(n)}</div>
    </>);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Digit Hint Panel
// ─────────────────────────────────────────────────────────────────────────────
function UnitDigitHint({ q, accent }) {
  const lb = { color:accent, letterSpacing:"2px", fontSize:"11px", marginBottom:"14px", fontWeight:"700" };
  const rw = { color:"#555", lineHeight:"2.1", fontSize:"13px" };
  const gr = v => <span style={{color:"#00ff88",fontWeight:"700"}}>{v}</span>;
  const hl = v => <span style={{color:"#ddd"}}>{v}</span>;
  const or = v => <span style={{color:"#ff6b35"}}>{v}</span>;
  const dm = v => <span style={{color:"#333"}}>{v}</span>;

  if (q.op === "rem") {
    const cycle = getRemCycle(q.base, q.divisor);
    const cycleLen = cycle.length;
    const posInCycle = q.power % cycleLen;
    return (<>
      <div style={lb}>REMAINDER — CYCLICITY METHOD</div>
      <div style={rw}>Find pattern: remainders of {hl(q.base)}^n ÷ {hl(q.divisor)}</div>
      <div style={rw}>Cycle: [{cycle.map((c,i)=><span key={i}>{i>0&&","}{or(c)}</span>)}] {dm(`(repeats every ${cycleLen})`)}</div>
      <div style={rw}>Power {hl(q.power)} mod {hl(cycleLen)} = {hl(posInCycle === 0 ? `0 → use ${cycleLen}th` : posInCycle)}</div>
      <div style={rw}>→ remainder = {gr(q.answer)}</div>
      <div style={{color:"#3a3a5a",fontSize:"12px",marginTop:"8px"}}>Answer: {gr(q.answer)}</div>
    </>);
  }

  if (q.op === "mul") {
    const unitDigits = q.nums.map(n => n % 10);
    const steps = [];
    let acc = unitDigits[0];
    for (let i = 1; i < unitDigits.length; i++) {
      const prev = acc;
      const full = prev * unitDigits[i];
      acc = full % 10;
      steps.push({ a: prev, b: unitDigits[i], full, result: acc });
    }
    return (<>
      <div style={lb}>UNIT DIGIT — MULTIPLICATION</div>
      <div style={rw}>Step 1 — extract unit digits: {unitDigits.map((d,i) => <span key={i}>{i>0 && <span style={{color:"#444"}}> × </span>}{hl(d)}</span>)}</div>
      {steps.map((s, i) => (
        <div key={i} style={rw}>Step {i+2} — {hl(s.a)} × {hl(s.b)} = {hl(s.full)} → unit digit {gr(s.result)}</div>
      ))}
      <div style={{color:"#3a3a5a",fontSize:"12px",marginTop:"8px"}}>Answer: {gr(q.answer)}</div>
    </>);
  }

  const ud = q.base % 10;
  return (<>
    <div style={lb}>UNIT DIGIT — POWER (CYCLICITY)</div>
    <div style={rw}>Base {hl(q.base)} → unit digit of base = {hl(ud)}</div>
    {[0,1,5,6].includes(ud) && (
      <div style={rw}>Unit digit {hl(ud)} is fixed — always gives {gr(ud)} for any power</div>
    )}
    {ud === 4 && <>
      <div style={rw}>Cycle of {hl(4)}: [{or(4)},{or(6)}] {dm("(cycle of 2)")}</div>
      <div style={rw}>Power {hl(q.power)} mod 2 = {hl(q.power % 2)} → {gr(q.answer)}</div>
    </>}
    {ud === 9 && <>
      <div style={rw}>Cycle of {hl(9)}: [{or(9)},{or(1)}] {dm("(cycle of 2)")}</div>
      <div style={rw}>Power {hl(q.power)} mod 2 = {hl(q.power % 2)} → {gr(q.answer)}</div>
    </>}
    {[2,3,7,8].includes(ud) && <>
      <div style={rw}>Cycle of {hl(ud)}: [{UNIT_CYCLES[ud].map((c,i)=><span key={i}>{i>0&&","}{or(c)}</span>)}] {dm("(cycle of 4)")}</div>
      <div style={rw}>Power {hl(q.power)} mod 4 = {hl(q.power%4===0?"0 → use 4th":q.power%4)}</div>
      <div style={rw}>→ unit digit = {gr(q.answer)}</div>
    </>}
    <div style={{color:"#3a3a5a",fontSize:"12px",marginTop:"8px"}}>Answer: {gr(q.answer)}</div>
  </>);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Question Display
// ─────────────────────────────────────────────────────────────────────────────
function QuestionDisplay({ mode, q }) {
  const ac=mode.color;
  if (mode.id==="squares") return (
    <div style={{fontSize:"80px",fontWeight:"900",letterSpacing:"-3px",lineHeight:1}}>
      {q.display}<span style={{color:ac,fontSize:"44px",verticalAlign:"super"}}>²</span>
    </div>
  );
  if (mode.id==="cubes") return (
    <div style={{fontSize:"80px",fontWeight:"900",letterSpacing:"-3px",lineHeight:1}}>
      {q.display}<span style={{color:ac,fontSize:"44px",verticalAlign:"super"}}>³</span>
    </div>
  );
  if (mode.id==="sqrt") return (
    <div style={{fontSize:"60px",fontWeight:"900",letterSpacing:"-2px",lineHeight:1}}>
      <span style={{color:ac,fontSize:"54px",fontWeight:"200",marginRight:"2px"}}>√</span>
      {q.display.toLocaleString()}
    </div>
  );
  if (mode.id==="cbrt") return (
    <div style={{fontSize:"60px",fontWeight:"900",letterSpacing:"-2px",lineHeight:1}}>
      <span style={{color:ac,fontSize:"50px",fontWeight:"200",marginRight:"2px"}}>∛</span>
      {q.display.toLocaleString()}
    </div>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Speed Math Component
// ─────────────────────────────────────────────────────────────────────────────
function SpeedMath({ accent, setToast }) {
  const [subIdx,         setSubIdx]        = useState(0);
  const [levels,         setLevels]        = useState({add:1,sub:1,mul:1,div:1});
  const [q,              setQ]             = useState(null);
  const [qKey,           setQKey]          = useState(0);
  const [input,          setInput]         = useState("");
  const [inputAnim,      setInputAnim]     = useState("");
  const [solved,         setSolved]        = useState(false);
  const [firstTry,       setFirstTry]      = useState(true);
  const [wrongMsg,       setWrongMsg]      = useState("");
  const [score,          setScore]         = useState(0);
  const [total,          setTotal]         = useState(0);
  const [streak,         setStreak]        = useState(0);
  const [bestStreak,     setBestStreak]    = useState(0);
  const [cardAnim,       setCardAnim]      = useState("");
  const [showParticles,  setShowParticles] = useState(false);
  const [elapsed,        setElapsed]       = useState("0.0");
  const [startTime,      setStartTime]     = useState(Date.now());
  const [running,        setRunning]       = useState(false);
  const [scoreAnim,      setScoreAnim]     = useState(false);
  const inputRef = useRef();

  const sub = SPEED_SUBS[subIdx];

  const newQ = (sIdx, lvl) => {
    const s = SPEED_SUBS[sIdx];
    setQ(genSpeedProblem(s.id, lvl));
    setQKey(k => k+1);
    setInput(""); setInputAnim(""); setSolved(false); setFirstTry(true);
    setWrongMsg(""); setCardAnim(""); setShowParticles(false);
    setStartTime(Date.now()); setElapsed("0.0"); setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { newQ(0, 1); }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(((Date.now()-startTime)/1000).toFixed(1)), 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  const switchSub = (i) => {
    setSubIdx(i);
    setScore(0); setTotal(0); setStreak(0); setBestStreak(0);
    newQ(i, levels[SPEED_SUBS[i].id]);
  };

  const handleSubmit = () => {
    if (!input || !q) return;
    const isCorrect = parseInt(input, 10) === q.answer;
    if (isCorrect) {
      setRunning(false); setSolved(true); setTotal(t => t+1);
      if (firstTry) {
        setScore(s => s+1);
        const ns = streak+1; setStreak(ns);
        if (ns > bestStreak) setBestStreak(ns);
        setScoreAnim(true); setTimeout(() => setScoreAnim(false), 500);
        setLevels(prev => ({ ...prev, [sub.id]: prev[sub.id]+1 }));
        if (STREAK_MSGS[ns]) {
          const tid = Date.now();
          setToast({ msg:STREAK_MSGS[ns], color:sub.color, id:tid });
          setTimeout(() => setToast(t => t?.id===tid ? null : t), 2600);
        }
      }
      setCardAnim("anim-pop anim-glow-green");
      setShowParticles(true);
      setTimeout(() => setCardAnim(""), 900);
    } else {
      if (firstTry) { setFirstTry(false); setStreak(0); }
      setCardAnim("anim-shake anim-glow-red");
      setInputAnim("wrong");
      setWrongMsg(`✗  "${input}" is incorrect — try again`);
      setTimeout(() => {
        setCardAnim(""); setInputAnim(""); setInput(""); setWrongMsg("");
        inputRef.current?.focus();
      }, 950);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { if (solved) newQ(subIdx, levels[sub.id]); else handleSubmit(); }
  };

  const accuracy = total > 0 ? Math.round((score/total)*100) : 0;
  const level = levels[sub.id];
  const subAccent = sub.color;
  const borderColor = solved ? "#00ff88" : "#1a1a2e";
  if (!q) return null;

  return (
    <div style={{ width:"100%", maxWidth:"460px", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>

      {/* Sub-mode tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:10, background:"#0d0d1c", border:"1px solid #1a1a2e", borderRadius:6, padding:4 }}>
        {SPEED_SUBS.map((s,i) => {
          const active = subIdx===i;
          return (
            <button key={s.id} onClick={() => switchSub(i)} style={{
              background: active ? `${s.color}1a` : "transparent",
              color:       active ? s.color : "#2e2e4a",
              border:      active ? `1px solid ${s.color}44` : "1px solid transparent",
              borderRadius:4, padding:"8px 20px",
              fontSize:"20px", fontFamily:"'Courier New',monospace",
              fontWeight:"700", transition:"all 0.2s", position:"relative",
            }}>
              {s.label}
              {active && <div style={{ position:"absolute", bottom:"-1px", left:"22%", right:"22%", height:"2px", background:s.color, borderRadius:"2px", boxShadow:`0 0 8px ${s.color}` }}/>}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:6, marginBottom:14, justifyContent:"center" }}>
        {[
          { v:`${score}/${total}`, l:"SCORE",    c:subAccent, flash:scoreAnim },
          { v:`${streak}`,         l:"STREAK",   c:streak>2?"#ff6b35":"#e0e0d8", fire:streak>2 },
          { v:`LVL ${level}`,      l:"LEVEL",    c:subAccent },
          { v:`${accuracy}%`,      l:"ACCURACY", c:"#e0e0d8" },
        ].map(({ v,l,c,fire,flash }) => (
          <div key={l} style={{ textAlign:"center", background:"#0d0d1c", border:"1px solid #1a1a2e", borderRadius:4, padding:"9px 14px", minWidth:"65px" }}>
            <div className={flash?"anim-score":""} style={{ color:c, fontSize:"15px", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center", gap:3, transition:"color 0.3s" }}>
              {v}{fire && <span className="anim-streak" style={{fontSize:"13px",display:"inline-block"}}>🔥</span>}
            </div>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color:"#6b6b8a", marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      <TimerBar elapsed={elapsed} accent={subAccent} solved={solved}/>

      {/* Card */}
      <div className={cardAnim} style={{
        background:"#0d0d1c", border:`2px solid ${borderColor}`, borderRadius:8,
        padding:"36px 52px 32px", textAlign:"center", width:"100%", position:"relative",
        transition:"border-color 0.25s",
        boxShadow: solved ? "0 8px 48px rgba(0,255,136,0.1)" : "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {showParticles && <Particles color={subAccent}/>}

        <div style={{ display:"inline-block", background:`${subAccent}12`, border:`1px solid ${subAccent}28`, borderRadius:2, padding:"3px 10px", fontSize:"9px", letterSpacing:"4px", color:subAccent, marginBottom:16 }}>
          SPEED MATH · {sub.sym} · LVL {level}
        </div>

        {/* Question */}
        <div key={qKey} className="anim-slide-up" style={{ marginBottom:12 }}>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:"16px",
            fontSize: (q.a > 999 || q.b > 999) ? "40px" : "60px",
            fontWeight:900, letterSpacing:"-2px", lineHeight:1,
          }}>
            <span>{q.a.toLocaleString()}</span>
            <span style={{ color:subAccent, fontSize:"0.75em" }}>{q.sym}</span>
            <span>{q.b.toLocaleString()}</span>
          </div>
          <div style={{ fontSize:12, color:"#1a1a30", marginTop:8 }}>= ?</div>
        </div>

        {!solved && (<>
          <input
            ref={inputRef} autoFocus type="number"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="your answer..."
            className={inputAnim==="wrong" ? "anim-wrong-inp" : ""}
            style={{ width:"100%", background:"#080810", border:"1px solid #1a1a2e", borderRadius:4, padding:"14px 16px", fontSize:26, fontFamily:"'Courier New',monospace", color:subAccent, textAlign:"center", outline:"none", letterSpacing:"3px", transition:"border-color 0.2s, box-shadow 0.2s" }}
            onFocus={e=>{ e.target.style.borderColor=subAccent+"55"; e.target.style.boxShadow=`0 0 16px ${subAccent}22`; }}
            onBlur={e=>{ e.target.style.borderColor="#1a1a2e"; e.target.style.boxShadow="none"; }}
          />
          {wrongMsg && <div className="anim-slide-up" style={{ marginTop:10, fontSize:12, color:"#ff4455", letterSpacing:"1px" }}>{wrongMsg}</div>}
        </>)}

        {solved && (
          <div className="anim-slide-up">
            <div style={{ fontSize:54, fontWeight:900, color:"#00ff88", marginBottom:10, textShadow:"0 0 24px #00ff8855" }}>✓</div>
            <div style={{ fontSize:14, color:"#555", marginBottom:6 }}>
              Correct!&nbsp;
              {firstTry
                ? <span style={{ color:subAccent }}>First try! 🎯  → LVL {level}</span>
                : <span style={{ color:"#3a3a5a" }}>Keep practising</span>
              }
            </div>
            <div style={{ fontSize:12, color:"#6b6b8a", display:"flex", justifyContent:"center", gap:16, marginTop:4 }}>
              <span>Answer: <span style={{ color:"#00ff88", fontWeight:700 }}>{q.answer.toLocaleString()}</span></span>
              <span>·</span>
              <span>Time: <span style={{ color:subAccent, fontWeight:700 }}>{elapsed}s</span></span>
            </div>
          </div>
        )}

        <div style={{ marginTop:24, display:"flex", gap:10, justifyContent:"center" }}>
          {!solved && <button onClick={handleSubmit} style={{ background:subAccent, color:"#07070f", border:"none", borderRadius:3, padding:"13px 36px", fontSize:13, fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", boxShadow:`0 4px 18px ${subAccent}44` }}>Submit</button>}
          {solved  && <button onClick={() => newQ(subIdx, levels[sub.id])} style={{ background:subAccent, color:"#07070f", border:"none", borderRadius:3, padding:"13px 48px", fontSize:13, fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", boxShadow:`0 4px 18px ${subAccent}44` }}>Next →</button>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tables Component
// ─────────────────────────────────────────────────────────────────────────────
function Tables({ accent, setToast }) {
  const [tableNum,      setTableNum]      = useState(null);
  const [queue,         setQueue]         = useState([]);
  const [qIdx,          setQIdx]          = useState(0);
  const [qKey,          setQKey]          = useState(0);
  const [input,         setInput]         = useState("");
  const [inputAnim,     setInputAnim]     = useState("");
  const [wrongMsg,      setWrongMsg]      = useState("");
  const [cardAnim,      setCardAnim]      = useState("");
  const [showParticles, setShowParticles] = useState(false);
  const [solved,        setSolved]        = useState(false);
  const [done,          setDone]          = useState(false);
  const [firstTry,      setFirstTry]      = useState(true);
  const [perfectCount,  setPerfectCount]  = useState(0);
  const [elapsed,       setElapsed]       = useState("0.0");
  const [startTime,     setStartTime]     = useState(Date.now());
  const [running,       setRunning]       = useState(false);
  const inputRef = useRef();

  const startTable = (n) => {
    const shuffled = Array.from({length:10}, (_,i) => i+1).sort(() => Math.random()-0.5);
    setTableNum(n); setQueue(shuffled); setQIdx(0); setQKey(0);
    setInput(""); setInputAnim(""); setWrongMsg("");
    setCardAnim(""); setShowParticles(false);
    setSolved(false); setDone(false);
    setFirstTry(true); setPerfectCount(0);
    setStartTime(Date.now()); setElapsed("0.0"); setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(((Date.now()-startTime)/1000).toFixed(1)), 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  const mult = queue[qIdx] ?? 1;

  const handleSubmit = () => {
    if (!input || solved || done || !tableNum) return;
    const isCorrect = parseInt(input, 10) === tableNum * mult;
    if (isCorrect) {
      const newPerfect = firstTry ? perfectCount + 1 : perfectCount;
      setCardAnim("anim-pop anim-glow-green"); setShowParticles(true);
      setTimeout(() => setCardAnim(""), 900);
      if (qIdx + 1 >= 10) {
        setRunning(false); setDone(true); setPerfectCount(newPerfect);
        if (newPerfect === 10) {
          const tid = Date.now();
          setToast({ msg:"PERFECT TABLE! 🏆", color:accent, id:tid });
          setTimeout(() => setToast(t => t?.id===tid ? null : t), 2600);
        }
      } else {
        setPerfectCount(newPerfect); setSolved(true);
        setTimeout(() => {
          setQIdx(i => i+1); setQKey(k => k+1);
          setInput(""); setInputAnim(""); setSolved(false);
          setFirstTry(true); setWrongMsg(""); setCardAnim(""); setShowParticles(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        }, 750);
      }
    } else {
      if (firstTry) setFirstTry(false);
      setCardAnim("anim-shake anim-glow-red"); setInputAnim("wrong");
      setWrongMsg(`✗  "${input}" — try again`);
      setTimeout(() => {
        setCardAnim(""); setInputAnim(""); setInput(""); setWrongMsg("");
        inputRef.current?.focus();
      }, 950);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !solved) handleSubmit(); };

  // ── PICKER ──
  if (tableNum === null) return (
    <div style={{ width:"100%", maxWidth:"460px", zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:"11px", letterSpacing:"4px", color:accent, marginBottom:4 }}>CHOOSE A TABLE</div>
        <div style={{ fontSize:"10px", color:"#2a2a4a", letterSpacing:"2px" }}>ALL 10 MULTIPLICATIONS · RANDOM ORDER</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
        {TABLES_NUMS.map(n => (
          <button key={n} onClick={() => startTable(n)} style={{
            background:"#0d0d1c", border:`1px solid ${accent}22`, borderRadius:8,
            padding:"18px 0", fontSize:"20px", fontFamily:"'Courier New',monospace",
            fontWeight:"700", color:"#e0e0d8", transition:"all 0.15s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background=`${accent}18`; e.currentTarget.style.color=accent; e.currentTarget.style.borderColor=`${accent}55`; e.currentTarget.style.boxShadow=`0 0 14px ${accent}33`; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="#0d0d1c"; e.currentTarget.style.color="#e0e0d8"; e.currentTarget.style.borderColor=`${accent}22`; e.currentTarget.style.boxShadow="none"; }}
          >{n}</button>
        ))}
      </div>
    </div>
  );

  // ── DONE ──
  if (done) {
    const perfect = perfectCount === 10;
    return (
      <div style={{ width:"100%", maxWidth:"460px", zIndex:1 }}>
        <div className={cardAnim} style={{
          background:"#0d0d1c", border:`2px solid ${perfect?"#00ff88":"#1a1a2e"}`,
          borderRadius:8, padding:"44px 48px 36px", textAlign:"center", position:"relative",
          boxShadow: perfect ? "0 8px 48px rgba(0,255,136,0.12)" : "0 8px 40px rgba(0,0,0,0.6)",
        }}>
          {showParticles && <Particles color={accent}/>}
          <div style={{ fontSize:56, marginBottom:12 }}>{perfect ? "🏆" : "✓"}</div>
          <div style={{ fontSize:"22px", fontWeight:900, color:"#fff", marginBottom:8, letterSpacing:"-1px" }}>
            Table of {tableNum} — Done!
          </div>
          <div style={{ fontSize:"13px", color:"#555", marginBottom:10 }}>
            {perfect
              ? <span style={{ color:accent }}>Perfect! All 10 on first try 🎯</span>
              : <span>{perfectCount}<span style={{ color:"#333" }}>/10</span> on first try</span>
            }
          </div>
          <div style={{ fontSize:"12px", color:"#6b6b8a", marginBottom:28 }}>
            Completed in <span style={{ color:accent, fontWeight:700 }}>{elapsed}s</span>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => startTable(tableNum)} style={{ background:accent, color:"#07070f", border:"none", borderRadius:3, padding:"13px 28px", fontSize:13, fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", boxShadow:`0 4px 18px ${accent}44` }}>Retry ↺</button>
            <button onClick={() => setTableNum(null)} style={{ background:"transparent", color:"#4a4a6a", border:"1px solid #1a1a2e", borderRadius:3, padding:"13px 28px", fontSize:13, fontFamily:"'Courier New',monospace", letterSpacing:"2px", textTransform:"uppercase" }}>Change ←</button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION ──
  const borderColor = solved ? "#00ff88" : "#1a1a2e";
  return (
    <div style={{ width:"100%", maxWidth:"460px", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", marginBottom:8 }}>
        <button onClick={() => setTableNum(null)} style={{ background:"transparent", color:"#2e2e4a", border:"1px solid #1a1a2e", borderRadius:4, padding:"6px 14px", fontSize:11, fontFamily:"'Courier New',monospace", letterSpacing:"2px" }}>← BACK</button>
        <div style={{ fontSize:"11px", letterSpacing:"3px", color:"#4a4a6a" }}>
          TABLE OF <span style={{ color:accent, fontWeight:700 }}>{tableNum}</span>
        </div>
        <div style={{ fontSize:"13px", fontFamily:"'Courier New',monospace", color:"#e0e0d8", fontWeight:700 }}>
          {qIdx+1}<span style={{ color:"#333" }}>/10</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width:"100%", height:"4px", background:"#111128", borderRadius:3, overflow:"hidden", marginBottom:12 }}>
        <div style={{ height:"100%", width:`${(qIdx/10)*100}%`, background:`linear-gradient(90deg,${accent}88,${accent})`, borderRadius:3, transition:"width 0.4s ease", boxShadow:`0 0 6px ${accent}88` }}/>
      </div>

      <TimerBar elapsed={elapsed} accent={accent} solved={false}/>

      {/* Card */}
      <div className={cardAnim} style={{
        background:"#0d0d1c", border:`2px solid ${borderColor}`, borderRadius:8,
        padding:"36px 52px 32px", textAlign:"center", width:"100%", position:"relative",
        transition:"border-color 0.25s",
        boxShadow: solved ? "0 8px 48px rgba(0,255,136,0.1)" : "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {showParticles && <Particles color={accent}/>}
        <div style={{ display:"inline-block", background:`${accent}12`, border:`1px solid ${accent}28`, borderRadius:2, padding:"3px 10px", fontSize:"9px", letterSpacing:"4px", color:accent, marginBottom:16 }}>
          TABLES · {qIdx+1} OF 10
        </div>

        <div key={qKey} className="anim-slide-up" style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", fontSize:"64px", fontWeight:900, letterSpacing:"-2px", lineHeight:1 }}>
            <span>{tableNum}</span>
            <span style={{ color:accent, fontSize:"0.75em" }}>×</span>
            <span>{mult}</span>
          </div>
          <div style={{ fontSize:12, color:"#1a1a30", marginTop:8 }}>= ?</div>
        </div>

        {!solved && (<>
          <input
            ref={inputRef} autoFocus type="number"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="your answer..."
            className={inputAnim==="wrong" ? "anim-wrong-inp" : ""}
            style={{ width:"100%", background:"#080810", border:"1px solid #1a1a2e", borderRadius:4, padding:"14px 16px", fontSize:26, fontFamily:"'Courier New',monospace", color:accent, textAlign:"center", outline:"none", letterSpacing:"3px", transition:"border-color 0.2s, box-shadow 0.2s" }}
            onFocus={e=>{ e.target.style.borderColor=accent+"55"; e.target.style.boxShadow=`0 0 16px ${accent}22`; }}
            onBlur={e=>{ e.target.style.borderColor="#1a1a2e"; e.target.style.boxShadow="none"; }}
          />
          {wrongMsg && <div className="anim-slide-up" style={{ marginTop:10, fontSize:12, color:"#ff4455", letterSpacing:"1px" }}>{wrongMsg}</div>}
        </>)}

        {solved && (
          <div className="anim-slide-up">
            <div style={{ fontSize:42, fontWeight:900, color:"#00ff88", textShadow:"0 0 24px #00ff8855" }}>✓</div>
            <div style={{ fontSize:13, color:"#555", marginTop:6 }}>
              {firstTry ? <span style={{ color:accent }}>Next up →</span> : <span style={{ color:"#3a3a5a" }}>Moving on...</span>}
            </div>
          </div>
        )}

        {!solved && (
          <div style={{ marginTop:24, display:"flex", justifyContent:"center" }}>
            <button onClick={handleSubmit} style={{ background:accent, color:"#07070f", border:"none", borderRadius:3, padding:"13px 36px", fontSize:13, fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", boxShadow:`0 4px 18px ${accent}44` }}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Digit Component
// ─────────────────────────────────────────────────────────────────────────────
function UnitDigit({ accent, setToast }) {
  const [subIdx,        setSubIdx]       = useState(0);
  const [q,             setQ]            = useState(null);
  const [qKey,          setQKey]         = useState(0);
  const [input,         setInput]        = useState("");
  const [inputAnim,     setInputAnim]    = useState("");
  const [solved,        setSolved]       = useState(false);
  const [firstTry,      setFirstTry]     = useState(true);
  const [wrongMsg,      setWrongMsg]     = useState("");
  const [score,         setScore]        = useState(0);
  const [total,         setTotal]        = useState(0);
  const [streak,        setStreak]       = useState(0);
  const [bestStreak,    setBestStreak]   = useState(0);
  const [cardAnim,      setCardAnim]     = useState("");
  const [showParticles, setShowParticles]= useState(false);
  const [elapsed,       setElapsed]      = useState("0.0");
  const [startTime,     setStartTime]    = useState(Date.now());
  const [running,       setRunning]      = useState(false);
  const [scoreAnim,     setScoreAnim]    = useState(false);
  const [showHint,      setShowHint]     = useState(false);
  const inputRef = useRef();

  const sub = UNIT_SUBS[subIdx];

  const newQ = (sIdx) => {
    setQ(genUnitProblem(UNIT_SUBS[sIdx].id));
    setQKey(k => k+1);
    setInput(""); setInputAnim(""); setSolved(false); setFirstTry(true);
    setWrongMsg(""); setCardAnim(""); setShowParticles(false); setShowHint(false);
    setStartTime(Date.now()); setElapsed("0.0"); setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { newQ(0); }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(((Date.now()-startTime)/1000).toFixed(1)), 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  const switchSub = (i) => {
    setSubIdx(i);
    setScore(0); setTotal(0); setStreak(0); setBestStreak(0);
    newQ(i);
  };

  const handleSubmit = () => {
    if (!input || !q) return;
    const isCorrect = parseInt(input, 10) === q.answer;
    if (isCorrect) {
      setRunning(false); setSolved(true); setTotal(t => t+1);
      if (firstTry) {
        setScore(s => s+1);
        const ns = streak+1; setStreak(ns);
        if (ns > bestStreak) setBestStreak(ns);
        setScoreAnim(true); setTimeout(() => setScoreAnim(false), 500);
        if (STREAK_MSGS[ns]) {
          const tid = Date.now();
          setToast({ msg:STREAK_MSGS[ns], color:accent, id:tid });
          setTimeout(() => setToast(t => t?.id===tid ? null : t), 2600);
        }
      }
      setCardAnim("anim-pop anim-glow-green");
      setShowParticles(true);
      setTimeout(() => setCardAnim(""), 900);
    } else {
      if (firstTry) { setFirstTry(false); setStreak(0); }
      setCardAnim("anim-shake anim-glow-red");
      setInputAnim("wrong");
      setWrongMsg(`✗  "${input}" is incorrect — try again`);
      setTimeout(() => {
        setCardAnim(""); setInputAnim(""); setInput(""); setWrongMsg("");
        inputRef.current?.focus();
      }, 950);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { if (solved) newQ(subIdx); else handleSubmit(); }
  };

  const accuracy = total > 0 ? Math.round((score/total)*100) : 0;
  const borderColor = solved ? "#00ff88" : "#1a1a2e";
  if (!q) return null;

  return (
    <div style={{ width:"100%", maxWidth:"460px", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>

      {/* Sub-mode tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:10, background:"#0d0d1c", border:"1px solid #1a1a2e", borderRadius:6, padding:4 }}>
        {UNIT_SUBS.map((s,i) => {
          const active = subIdx===i;
          return (
            <button key={s.id} onClick={() => switchSub(i)} style={{
              background: active ? `${accent}1a` : "transparent",
              color:       active ? accent : "#2e2e4a",
              border:      active ? `1px solid ${accent}44` : "1px solid transparent",
              borderRadius:4, padding:"8px 28px",
              fontSize:"13px", fontFamily:"'Courier New',monospace",
              fontWeight:"700", letterSpacing:"2px", transition:"all 0.2s", position:"relative",
            }}>
              {s.label}
              {active && <div style={{ position:"absolute", bottom:"-1px", left:"22%", right:"22%", height:"2px", background:accent, borderRadius:"2px", boxShadow:`0 0 8px ${accent}` }}/>}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:6, marginBottom:14, justifyContent:"center" }}>
        {[
          { v:`${score}/${total}`, l:"SCORE",    c:accent, flash:scoreAnim },
          { v:`${streak}`,         l:"STREAK",   c:streak>2?"#ff6b35":"#e0e0d8", fire:streak>2 },
          { v:`${accuracy}%`,      l:"ACCURACY", c:"#e0e0d8" },
          { v:`${bestStreak}`,     l:"BEST",     c:"#e0e0d8" },
        ].map(({ v,l,c,fire,flash }) => (
          <div key={l} style={{ textAlign:"center", background:"#0d0d1c", border:"1px solid #1a1a2e", borderRadius:4, padding:"9px 14px", minWidth:"65px" }}>
            <div className={flash?"anim-score":""} style={{ color:c, fontSize:"15px", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center", gap:3, transition:"color 0.3s" }}>
              {v}{fire && <span className="anim-streak" style={{fontSize:"13px",display:"inline-block"}}>🔥</span>}
            </div>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color:"#6b6b8a", marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      <TimerBar elapsed={elapsed} accent={accent} solved={solved}/>

      {/* Card */}
      <div className={cardAnim} style={{
        background:"#0d0d1c", border:`2px solid ${borderColor}`, borderRadius:8,
        padding:"36px 52px 32px", textAlign:"center", width:"100%", position:"relative",
        transition:"border-color 0.25s",
        boxShadow: solved ? "0 8px 48px rgba(0,255,136,0.1)" : "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {showParticles && <Particles color={accent}/>}

        <div style={{ display:"inline-block", background:`${accent}12`, border:`1px solid ${accent}28`, borderRadius:2, padding:"3px 10px", fontSize:"9px", letterSpacing:"4px", color:accent, marginBottom:16 }}>
          UNIT DIGIT · {sub.label}
        </div>

        {/* Question */}
        <div key={qKey} className="anim-slide-up" style={{ marginBottom:8 }}>
          {q.op === "mul" ? (
            <div style={{ fontSize:"36px", fontWeight:900, letterSpacing:"-1px", lineHeight:1.4, display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:"6px" }}>
              {q.nums.map((n, i) => (
                <span key={i} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  {i > 0 && <span style={{color:accent}}>×</span>}
                  <span>{n}</span>
                </span>
              ))}
            </div>
          ) : q.op === "rem" ? (
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:"13px", color:"#4a4a6a", letterSpacing:"1px", marginBottom:8 }}>What is the remainder when</div>
              <div style={{ fontSize:"52px", fontWeight:900, letterSpacing:"-2px", lineHeight:1 }}>
                {q.base}
                <span style={{ color:accent, fontSize:"26px", verticalAlign:"super", letterSpacing:"-1px" }}>{q.power}</span>
                <span style={{ color:"#4a4a6a", fontSize:"32px", margin:"0 6px" }}>÷</span>
                <span>{q.divisor}</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:"64px", fontWeight:900, letterSpacing:"-2px", lineHeight:1 }}>
              {q.base}
              <span style={{ color:accent, fontSize:"30px", verticalAlign:"super", letterSpacing:"-1px" }}>{q.power}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize:12, color:"#4a4a6a", marginBottom:20 }}>
          {q.op === "rem" ? `Find the remainder (0–${q.divisor - 1})` : "Find the unit place digit (0–9)"}
        </div>

        {!solved && (<>
          <input
            ref={inputRef} autoFocus type="number"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={q.op === "rem" ? `0–${q.divisor - 1}` : "0–9"}
            className={inputAnim==="wrong" ? "anim-wrong-inp" : ""}
            style={{ width:"120px", background:"#080810", border:"1px solid #1a1a2e", borderRadius:4, padding:"14px 16px", fontSize:36, fontFamily:"'Courier New',monospace", color:accent, textAlign:"center", outline:"none", letterSpacing:"3px", transition:"border-color 0.2s, box-shadow 0.2s" }}
            onFocus={e=>{ e.target.style.borderColor=accent+"55"; e.target.style.boxShadow=`0 0 16px ${accent}22`; }}
            onBlur={e=>{ e.target.style.borderColor="#1a1a2e"; e.target.style.boxShadow="none"; }}
          />
          {wrongMsg && <div className="anim-slide-up" style={{ marginTop:10, fontSize:12, color:"#ff4455", letterSpacing:"1px" }}>{wrongMsg}</div>}
        </>)}

        {solved && (
          <div className="anim-slide-up">
            <div style={{ fontSize:54, fontWeight:900, color:"#00ff88", marginBottom:10, textShadow:"0 0 24px #00ff8855" }}>✓</div>
            <div style={{ fontSize:14, color:"#555", marginBottom:6 }}>
              Correct!&nbsp;
              {firstTry
                ? <span style={{ color:accent }}>First try! 🎯</span>
                : <span style={{ color:"#3a3a5a" }}>Keep practising</span>
              }
            </div>
            <div style={{ fontSize:12, color:"#6b6b8a", display:"flex", justifyContent:"center", gap:16, marginTop:4 }}>
              <span>{q.op === "rem" ? "Remainder" : "Unit digit"}: <span style={{ color:"#00ff88", fontWeight:700 }}>{q.answer}</span></span>
              <span>·</span>
              <span>Time: <span style={{ color:accent, fontWeight:700 }}>{elapsed}s</span></span>
            </div>
          </div>
        )}

        <div style={{ marginTop:24, display:"flex", gap:10, justifyContent:"center" }}>
          {!solved && <>
            <button onClick={handleSubmit} style={{ background:accent, color:"#07070f", border:"none", borderRadius:3, padding:"13px 36px", fontSize:13, fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", boxShadow:`0 4px 18px ${accent}44` }}>Submit</button>
            <button onClick={() => setShowHint(h=>!h)} style={{ background:showHint?`${accent}18`:"transparent", color:showHint?accent:"#2e2e4a", border:`1px solid ${showHint?accent+"44":"#1a1a2e"}`, borderRadius:3, padding:"13px 22px", fontSize:13, fontFamily:"'Courier New',monospace", letterSpacing:"1px", transition:"all 0.2s" }}>
              {showHint ? "Hide" : "Hint"}
            </button>
          </>}
          {solved && <button onClick={() => newQ(subIdx)} style={{ background:accent, color:"#07070f", border:"none", borderRadius:3, padding:"13px 48px", fontSize:13, fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", boxShadow:`0 4px 18px ${accent}44` }}>Next →</button>}
        </div>
      </div>

      {/* Hint Panel */}
      {showHint && !solved && q && (
        <div className="anim-slide-up" style={{ marginTop:12, background:"#0d0d1c", border:"1px solid #1a1a2e", borderRadius:6, padding:"20px 28px", width:"100%", zIndex:1, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
          <UnitDigitHint q={q} accent={accent}/>
        </div>
      )}

      <div style={{ marginTop:16, fontSize:10, color:"#131326", letterSpacing:"3px" }}>
        ENTER TO SUBMIT · ENTER AGAIN FOR NEXT
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function SquareQuiz() {
  const [modeIdx,       setModeIdx]       = useState(0);
  const [q,             setQ]             = useState(null);
  const [qKey,          setQKey]          = useState(0);
  const [input,         setInput]         = useState("");
  const [inputAnim,     setInputAnim]     = useState("");
  const [solved,        setSolved]        = useState(false);
  const [firstTry,      setFirstTry]      = useState(true);
  const [wrongMsg,      setWrongMsg]      = useState("");
  const [score,         setScore]         = useState(0);
  const [total,         setTotal]         = useState(0);
  const [showHint,      setShowHint]      = useState(false);
  const [streak,        setStreak]        = useState(0);
  const [bestStreak,    setBestStreak]    = useState(0);
  const [startTime,     setStartTime]     = useState(Date.now());
  const [elapsed,       setElapsed]       = useState("0.0");
  const [running,       setRunning]       = useState(false);
  const [cardAnim,      setCardAnim]      = useState("");
  const [showParticles, setShowParticles] = useState(false);
  const [toast,         setToast]         = useState(null);
  const [scoreAnim,     setScoreAnim]     = useState(false);
  const inputRef = useRef();

  const mode    = MODES[modeIdx];
  const accent  = mode.color;
  const isCalc   = mode.id === "calc";
  const isSpeed  = mode.id === "speed";
  const isTables = mode.id === "tables";
  const isUnit   = mode.id === "unit";

  const newQuestion = (idx) => {
    const m = MODES[idx];
    if (!m.gen) return;
    setQ(m.gen());
    setQKey(k => k+1);
    setInput(""); setInputAnim(""); setSolved(false); setFirstTry(true);
    setWrongMsg(""); setShowHint(false);
    setStartTime(Date.now()); setElapsed("0.0"); setRunning(true);
    setCardAnim(""); setShowParticles(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (MODES[modeIdx].gen) {
      setScore(0); setTotal(0); setStreak(0); setBestStreak(0);
      newQuestion(modeIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeIdx]);

  // Timer — updates every 1s to keep display stable (bar uses CSS transition for smoothness)
  useEffect(() => {
    if (!running || isCalc || isSpeed || isTables || isUnit) return;
    const id = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, startTime, isCalc, isSpeed, isTables, isUnit]);

  const handleSubmit = () => {
    if (!input || !q) return;
    const isCorrect = parseInt(input) === q.answer;

    if (isCorrect) {
      setRunning(false); setSolved(true); setTotal(t => t+1);
      if (firstTry) {
        setScore(s => s+1);
        const ns = streak+1; setStreak(ns);
        if (ns > bestStreak) setBestStreak(ns);
        setScoreAnim(true); setTimeout(()=>setScoreAnim(false), 500);
        if (STREAK_MSGS[ns]) {
          const tid=Date.now();
          setToast({msg:STREAK_MSGS[ns],color:accent,id:tid});
          setTimeout(()=>setToast(t=>t?.id===tid?null:t), 2600);
        }
      }
      setCardAnim("anim-pop anim-glow-green");
      setShowParticles(true); setWrongMsg("");
      setTimeout(()=>setCardAnim(""), 900);
    } else {
      if (firstTry) { setFirstTry(false); setStreak(0); }
      setCardAnim("anim-shake anim-glow-red");
      setInputAnim("wrong");
      setWrongMsg(`✗  "${input}" is incorrect — try again`);
      setTimeout(() => {
        setCardAnim(""); setInputAnim(""); setInput(""); setWrongMsg("");
        inputRef.current?.focus();
      }, 950);
    }
  };

  const handleKey = (e) => {
    if (e.key==="Enter") { if (solved) newQuestion(modeIdx); else handleSubmit(); }
  };

  const accuracy = total > 0 ? Math.round((score/total)*100) : 0;
  if (!q && !isCalc && !isSpeed && !isTables && !isUnit) return null;

  const borderColor = solved ? "#00ff88" : "#1a1a2e";

  return (
    <>
      <style>{STYLE}</style>
      {toast && <Toast key={toast.id} msg={toast.msg} color={toast.color}/>}

      <div style={{
        minHeight:"100vh", background:"#07070f",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        fontFamily:"'Courier New',monospace", color:"#e0e0d8",
        padding:"24px 16px", position:"relative", overflow:"hidden",
      }}>

        {/* Background */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:`linear-gradient(${accent}07 1px,transparent 1px),linear-gradient(90deg,${accent}07 1px,transparent 1px)`,
          backgroundSize:"44px 44px", transition:"background-image 0.5s",
        }}/>
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse 55% 45% at 50% 50%, ${accent}09, transparent 70%)`,
          transition:"background 0.5s",
        }}/>

        {/* Title */}
        <div style={{textAlign:"center",marginBottom:"20px",zIndex:1}}>
          <div style={{fontSize:"10px",letterSpacing:"7px",color:accent,marginBottom:"6px",transition:"color 0.3s"}}>
            MENTAL MATH TRAINER
          </div>
          <div style={{fontSize:"34px",fontWeight:"900",letterSpacing:"-2px",color:"#fff",lineHeight:1}}>
            SQUARE<span style={{color:accent,transition:"color 0.3s"}}>UP</span>
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display:"flex", marginBottom:"6px",
          background:"#0d0d1c", border:"1px solid #1a1a2e",
          borderRadius:"6px", padding:"4px", gap:"3px",
          zIndex:1, boxShadow:"0 4px 24px rgba(0,0,0,0.5)",
          flexWrap:"wrap", justifyContent:"center",
        }}>
          {MODES.map((m,i) => {
            const active = modeIdx===i;
            return (
              <button key={m.id} onClick={()=>setModeIdx(i)} style={{
                background: active ? `${m.color}1a` : "transparent",
                color:       active ? m.color : "#2e2e4a",
                border:      active ? `1px solid ${m.color}44` : "1px solid transparent",
                borderRadius:"4px", padding:"9px 18px",
                fontSize:"14px", fontFamily:"'Courier New',monospace",
                fontWeight:"700", letterSpacing:"1px",
                transition:"all 0.2s", position:"relative",
              }}>
                {m.label}
                {active && <div style={{
                  position:"absolute", bottom:"-1px", left:"22%", right:"22%",
                  height:"2px", background:m.color, borderRadius:"2px",
                  boxShadow:`0 0 8px ${m.color}`,
                }}/>}
              </button>
            );
          })}
        </div>

        {/* Subtitle */}
        <div className="anim-mode" key={modeIdx} style={{
          fontSize:"10px", letterSpacing:"3px", color:"#4a4a6a",
          marginBottom:"18px", zIndex:1,
        }}>
          {mode.subtitle.toUpperCase()}
        </div>

        {/* ── CALCULATOR MODE ── */}
        {isCalc  && <Calculator accent={accent}/>}

        {/* ── SPEED MATH MODE ── */}
        {isSpeed  && <SpeedMath accent={accent} setToast={setToast}/>}

        {/* ── TABLES MODE ── */}
        {isTables && <Tables accent={accent} setToast={setToast}/>}

        {/* ── UNIT DIGIT MODE ── */}
        {isUnit && <UnitDigit accent={accent} setToast={setToast}/>}

        {/* ── QUIZ MODE ── */}
        {!isCalc && !isSpeed && !isTables && !isUnit && (<>
          {/* Stats */}
          <div style={{display:"flex",gap:"6px",marginBottom:"14px",zIndex:1}}>
            {[
              {v:`${score}/${total}`,l:"SCORE",   c:accent,                    flash:scoreAnim},
              {v:`${streak}`,        l:"STREAK",  c:streak>2?"#ff6b35":"#e0e0d8",fire:streak>2},
              {v:`${accuracy}%`,     l:"ACCURACY",c:"#e0e0d8"},
              {v:`${bestStreak}`,    l:"BEST",    c:"#e0e0d8"},
            ].map(({v,l,c,fire,flash})=>(
              <div key={l} style={{
                textAlign:"center", background:"#0d0d1c",
                border:"1px solid #1a1a2e", borderRadius:"4px",
                padding:"9px 14px", minWidth:"65px",
              }}>
                <div className={flash?"anim-score":""} style={{
                  color:c, fontSize:"18px", fontWeight:"700",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"3px",
                  transition:"color 0.3s",
                }}>
                  {v}
                  {fire && <span className="anim-streak" style={{fontSize:"14px",display:"inline-block"}}>🔥</span>}
                </div>
                <div style={{fontSize:"9px",letterSpacing:"2px",color:"#6b6b8a",marginTop:"3px"}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Timer bar — minimal, non-distracting */}
          <TimerBar elapsed={elapsed} accent={accent} solved={solved}/>

          {/* Main Card */}
          <div className={cardAnim} style={{
            background:"#0d0d1c",
            border:`2px solid ${borderColor}`,
            borderRadius:"8px",
            padding:"36px 52px 32px",
            textAlign:"center", width:"100%", maxWidth:"460px",
            transition:"border-color 0.25s", position:"relative", zIndex:1,
            boxShadow: solved ? "0 8px 48px rgba(0,255,136,0.1)" : "0 8px 40px rgba(0,0,0,0.6)",
          }}>
            {showParticles && <Particles color={accent}/>}

            {/* Mode badge */}
            <div style={{
              display:"inline-block",
              background:`${accent}12`, border:`1px solid ${accent}28`,
              borderRadius:"2px", padding:"3px 10px",
              fontSize:"9px", letterSpacing:"4px", color:accent,
              marginBottom:"22px",
            }}>
              {mode.title}
            </div>

            {/* Question */}
            <div key={qKey} className="anim-slide-up" style={{marginBottom:"8px"}}>
              {q && <QuestionDisplay mode={mode} q={q}/>}
            </div>
            <div style={{fontSize:"12px",color:"#1a1a30",marginBottom:"26px"}}>= ?</div>

            {/* Input */}
            {!solved && (<>
              <input
                ref={inputRef} autoFocus type="number"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="your answer..."
                className={inputAnim==="wrong"?"anim-wrong-inp":""}
                style={{
                  width:"100%", background:"#080810",
                  border:"1px solid #1a1a2e", borderRadius:"4px",
                  padding:"14px 16px", fontSize:"26px",
                  fontFamily:"'Courier New',monospace",
                  color:accent, textAlign:"center",
                  outline:"none", letterSpacing:"3px",
                  transition:"border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e=>{if(inputAnim!=="wrong"){e.target.style.borderColor=accent+"55";e.target.style.boxShadow=`0 0 16px ${accent}22`;}}}
                onBlur={e=>{e.target.style.borderColor="#1a1a2e";e.target.style.boxShadow="none";}}
              />
              {wrongMsg && (
                <div className="anim-slide-up" style={{
                  marginTop:"10px", fontSize:"12px",
                  color:"#ff4455", letterSpacing:"1px",
                }}>
                  {wrongMsg}
                </div>
              )}
            </>)}

            {/* Correct result */}
            {solved && (
              <div className="anim-slide-up">
                <div style={{
                  fontSize:"54px",fontWeight:"900",color:"#00ff88",
                  marginBottom:"10px",textShadow:"0 0 24px #00ff8855",
                }}>✓</div>
                <div style={{fontSize:"14px",color:"#555",marginBottom:"6px"}}>
                  Correct!&nbsp;
                  {firstTry
                    ? <span style={{color:accent}}>First try! 🎯</span>
                    : <span style={{color:"#3a3a5a"}}>Keep practising</span>
                  }
                </div>
                <div style={{
                  fontSize:"12px",color:"#6b6b8a",
                  display:"flex",justifyContent:"center",gap:"16px",marginTop:"4px",
                }}>
                  <span>Answer: <span style={{color:"#00ff88",fontWeight:"700"}}>{q?.answer}</span></span>
                  <span>·</span>
                  <span>Time: <span style={{color:accent,fontWeight:"700"}}>{elapsed}s</span></span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{marginTop:"24px",display:"flex",gap:"10px",justifyContent:"center"}}>
              {!solved && (<>
                <button onClick={handleSubmit} style={{
                  background:accent, color:"#07070f",
                  border:"none", borderRadius:"3px",
                  padding:"13px 36px", fontSize:"13px",
                  fontFamily:"'Courier New',monospace",
                  fontWeight:"700", letterSpacing:"2px",
                  textTransform:"uppercase",
                  boxShadow:`0 4px 18px ${accent}44`,
                }}>
                  Submit
                </button>
                <button onClick={()=>setShowHint(h=>!h)} style={{
                  background:showHint?`${accent}18`:"transparent",
                  color:      showHint?accent:"#2e2e4a",
                  border:    `1px solid ${showHint?accent+"44":"#1a1a2e"}`,
                  borderRadius:"3px", padding:"13px 22px",
                  fontSize:"13px", fontFamily:"'Courier New',monospace",
                  letterSpacing:"1px", transition:"all 0.2s",
                }}>
                  {showHint?"Hide":"Hint"}
                </button>
              </>)}
              {solved && (
                <button onClick={()=>newQuestion(modeIdx)} style={{
                  background:accent, color:"#07070f",
                  border:"none", borderRadius:"3px",
                  padding:"13px 48px", fontSize:"13px",
                  fontFamily:"'Courier New',monospace",
                  fontWeight:"700", letterSpacing:"2px",
                  textTransform:"uppercase",
                  boxShadow:`0 4px 18px ${accent}44`,
                }}>
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Hint panel */}
          {showHint && !solved && q && (
            <div className="anim-slide-up" style={{
              marginTop:"12px", background:"#0d0d1c",
              border:"1px solid #1a1a2e", borderRadius:"6px",
              padding:"20px 28px", width:"100%", maxWidth:"460px",
              zIndex:1, boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
            }}>
              <HintPanel modeId={mode.id} n={q.n} accent={accent}/>
            </div>
          )}

          <div style={{marginTop:"16px",fontSize:"10px",color:"#131326",letterSpacing:"3px",zIndex:1}}>
            ENTER TO SUBMIT  ·  ENTER AGAIN FOR NEXT
          </div>
        </>)}


      {/* ── Crafted by credit — fixed bottom right ── */}
      <div style={{
        position:"fixed",
        bottom:"16px",
        right:"18px",
        zIndex:100,
        display:"flex",
        alignItems:"center",
        gap:"8px",
        pointerEvents:"none",
        background:"#0d0d1e",
        border:`1px solid ${accent}33`,
        borderRadius:"20px",
        padding:"6px 14px 6px 10px",
        boxShadow:`0 2px 16px rgba(0,0,0,0.5), 0 0 12px ${accent}18`,
        transition:"border-color 0.4s, box-shadow 0.4s",
      }}>
        <div style={{
          width:"6px", height:"6px", borderRadius:"50%",
          background:accent,
          boxShadow:`0 0 8px ${accent}, 0 0 4px ${accent}`,
          flexShrink:0,
          transition:"background 0.4s, box-shadow 0.4s",
        }}/>
        <div style={{
          fontSize:"10px",
          letterSpacing:"2px",
          color:"#5a5a7a",
          fontFamily:"'Courier New',monospace",
          textTransform:"uppercase",
          lineHeight:1,
          whiteSpace:"nowrap",
        }}>
          crafted by{" "}
          <span style={{
            color:accent,
            fontWeight:"700",
            letterSpacing:"2px",
            transition:"color 0.4s",
          }}>
            Pratham
          </span>
        </div>
      </div>

      </div>
    </>
  );
}
