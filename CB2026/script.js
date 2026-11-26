// Polyfill seguro para CanvasRenderingContext2D.roundRect en navegadores antiguos
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii[0] : (radii || 0);
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
    return this;
  };
}

/* ==========================================================================
   VisualMath V3 — "Funciones que se ven"
   Lógica completa en JavaScript Vanilla + Canvas 2D (59 temas animados)
   ========================================================================== */

"use strict";

// ==========================================================================
// 1. UTILIDADES GENERALES Y HERRAMIENTAS DE DIBUJO EN CANVAS 2D
// ==========================================================================

/**
 * Formatea un número con decimales limpios y signo opcional.
 */
function fmt(num, dec = 2) {
  const n = Number(num);
  if (!Number.isFinite(n)) return "0";
  return Math.abs(n) < 1e-9 ? (0).toFixed(dec) : n.toFixed(dec);
}

/**
 * Formatea término con signo para mostrar fórmulas limpias (ej. " + 2.0" o " - 2.0").
 */
function fmtSign(num, dec = 1) {
  const n = Number(num);
  return (n >= 0 ? " + " : " - ") + Math.abs(n).toFixed(dec);
}

/**
 * Devuelve la paleta de colores del Canvas sincronizada con el modo Claro / Oscuro.
 */
function getPalette() {
  const light = document.documentElement.dataset.theme === "light";
  return {
    light,
    bg: light ? "#f8faff" : "#090d19",
    bgPanel: light ? "rgba(255,255,255,0.88)" : "rgba(15,21,40,0.82)",
    grid: light ? "rgba(20,30,60,0.08)" : "rgba(255,255,255,0.07)",
    axis: light ? "rgba(20,30,60,0.45)" : "rgba(255,255,255,0.36)",
    text: light ? "#141a2e" : "#eef3ff",
    muted: light ? "#556282" : "#97a6cc",
    purple: "#6c5ce7",
    purpleSoft: light ? "rgba(108,92,231,0.18)" : "rgba(108,92,231,0.28)",
    cyan: "#00cec9",
    cyanSoft: light ? "rgba(0,206,201,0.18)" : "rgba(0,206,201,0.24)",
    accent: "#ff7675",
    gold: "#fdcb6e",
    green: light ? "#009970" : "#00e6a8",
    blue: "#38bdf8",
    pink: "#f472b6"
  };
}

/**
 * Limpia el canvas y dibuja un fondo limpio con borde sutil.
 */
function limpiarCanvas(ctx, W, H, p) {
  ctx.save();
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/**
 * Dibuja un sistema de coordenadas cartesianas con cuadrícula y etiquetas.
 * Devuelve funciones toX(x), toY(y) para mapear coordenadas matemáticas a píxeles.
 */
function dibujarPlano(ctx, W, H, xMin, xMax, yMin, yMax, p, opts = {}) {
  const padL = opts.padL ?? 52;
  const padR = opts.padR ?? 28;
  const padT = opts.padT ?? 36;
  const padB = opts.padB ?? 42;
  const pw = W - padL - padR;
  const ph = H - padT - padB;

  const toX = (x) => padL + ((x - xMin) / (xMax - xMin)) * pw;
  const toY = (y) => padT + ph - ((y - yMin) / (yMax - yMin)) * ph;

  ctx.save();
  // Cuadrícula vertical
  const stepX = opts.stepX ?? Math.max(1, Math.round((xMax - xMin) / 10));
  const stepY = opts.stepY ?? Math.max(1, Math.round((yMax - yMin) / 8));

  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
    const px = toX(x);
    ctx.moveTo(px, padT);
    ctx.lineTo(px, padT + ph);
  }
  for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
    const py = toY(y);
    ctx.moveTo(padL, py);
    ctx.lineTo(padL + pw, py);
  }
  ctx.stroke();

  // Ejes principales
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (yMin <= 0 && yMax >= 0) {
    const py0 = toY(0);
    ctx.moveTo(padL, py0);
    ctx.lineTo(padL + pw, py0);
  }
  if (xMin <= 0 && xMax >= 0) {
    const px0 = toX(0);
    ctx.moveTo(px0, padT);
    ctx.lineTo(px0, padT + ph);
  }
  ctx.stroke();

  // Etiquetas numéricas
  ctx.fillStyle = p.muted;
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  const axisY = (yMin <= 0 && yMax >= 0) ? Math.min(padT + ph - 6, Math.max(padT + 14, toY(0) + 14)) : padT + ph + 16;
  for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
    if (Math.abs(x) < 1e-6 && xMin < 0 && xMax > 0) continue;
    ctx.fillText(Number.isInteger(x) ? x : x.toFixed(1), toX(x), axisY);
  }
  ctx.textAlign = "right";
  const axisX = (xMin <= 0 && xMax >= 0) ? Math.min(padL + pw - 8, Math.max(padL + 26, toX(0) - 6)) : padL - 8;
  for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
    if (Math.abs(y) < 1e-6 && yMin < 0 && yMax > 0) continue;
    ctx.fillText(Number.isInteger(y) ? y : y.toFixed(1), axisX, toY(y) + 4);
  }

  // Nombres de ejes
  if (opts.labelX) {
    ctx.fillStyle = p.text;
    ctx.textAlign = "right";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(opts.labelX, padL + pw, padT + ph + 30);
  }
  if (opts.labelY) {
    ctx.fillStyle = p.text;
    ctx.textAlign = "left";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(opts.labelY, padL + 6, padT - 12);
  }
  ctx.restore();
  return { toX, toY, padL, padR, padT, padB, pw, ph };
}

/**
 * Traza una curva continua f(x) sobre el plano dado.
 */
function dibujarCurva(ctx, fn, xMin, xMax, toX, toY, color, width = 3, pasos = 260, yLimit = 1e4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= pasos; i++) {
    const x = xMin + (i / pasos) * (xMax - xMin);
    const y = fn(x);
    if (!Number.isFinite(y) || Math.abs(y) > yLimit) {
      started = false;
      continue;
    }
    const px = toX(x);
    const py = toY(y);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Dibuja un vector (flecha) con punta triangular limpia.
 */
function dibujarFlecha(ctx, x1, y1, x2, y2, color, width = 2.6, label = "") {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ang = Math.atan2(dy, dx);
  const head = Math.min(12, Math.max(7, len * 0.25));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
  ctx.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(label, x2 + 8 * Math.cos(ang), y2 + 8 * Math.sin(ang) - 4);
  }
  ctx.restore();
}

/**
 * Dibuja una insignia informativa (HUD) semitransparente dentro del canvas.
 */
function dibujarHUD(ctx, x, y, lines, p) {
  ctx.save();
  ctx.font = "700 12.5px ui-monospace, Menlo, Consolas, monospace";
  let maxW = 0;
  for (const line of lines) {
    maxW = Math.max(maxW, ctx.measureText(line).width);
  }
  const bw = maxW + 22;
  const bh = lines.length * 19 + 14;
  ctx.fillStyle = p.bgPanel;
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = p.text;
  ctx.textAlign = "left";
  lines.forEach((line, idx) => {
    ctx.fillText(line, x + 11, y + 20 + idx * 19);
  });
  ctx.restore();
}

/**
 * Dibuja un punto luminoso destacado.
 */
function dibujarPunto(ctx, x, y, r, color, halo = true) {
  ctx.save();
  if (halo) {
    ctx.beginPath();
    ctx.arc(x, y, r * 2.1, 0, Math.PI * 2);
    ctx.fillStyle = color + "33";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// ==========================================================================
// 2. FUNCIONES DE DIBUJO — MATEMÁTICAS (32 TEMAS ANIMADOS)
// ==========================================================================

/* --- NIVEL BÁSICO / PROPEDÉUTICO (13 TEMAS) --- */

// 1. Función Lineal
function dibujarLineal(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -8, 8, -8, 8, p, { labelX: "x", labelY: "y" });
  const f = (x) => A * x + B;
  dibujarCurva(ctx, f, -8, 8, toX, toY, p.cyan, 3.5);

  const xm = -6 + ((t * (1.2 + Math.abs(C) * 0.4)) % 12);
  const ym = f(xm);
  const dx = 2;
  const dy = A * dx;

  // Triángulo de pendiente animado
  if (xm + dx <= 7.5 && Math.abs(ym + dy) <= 8) {
    ctx.save();
    ctx.strokeStyle = p.gold;
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(xm), toY(ym));
    ctx.lineTo(toX(xm + dx), toY(ym));
    ctx.lineTo(toX(xm + dx), toY(ym + dy));
    ctx.stroke();
    ctx.fillStyle = p.gold;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText("Δx = 2", toX(xm + 1) - 18, toY(ym) + (dy >= 0 ? 18 : -8));
    ctx.fillText("Δy = " + fmt(dy, 1), toX(xm + dx) + 8, toY(ym + dy * 0.5));
    ctx.restore();
  }

  dibujarPunto(ctx, toX(0), toY(B), 6, p.purple);
  dibujarPunto(ctx, toX(xm), toY(ym), 8, p.cyan);
  dibujarHUD(ctx, 64, 18, [`x = ${fmt(xm, 2)}`, `y = ${fmt(ym, 2)}`, `Pendiente m = ${fmt(A, 2)}`], p);
}

// 2. Función Cuadrática (Parábola)
function dibujarCuadratica(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -7, 7, -8, 10, p, { labelX: "x", labelY: "y" });
  const aSafe = Math.abs(A) < 0.05 ? 0.05 : A;
  const f = (x) => aSafe * x * x + B * x + C;

  // Eje de simetría
  const xv = -B / (2 * aSafe);
  const yv = f(xv);
  if (xv >= -7 && xv <= 7) {
    ctx.save();
    ctx.strokeStyle = p.purple;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(toX(xv), toY(-8));
    ctx.lineTo(toX(xv), toY(10));
    ctx.stroke();
    ctx.restore();
  }

  dibujarCurva(ctx, f, -7, 7, toX, toY, p.cyan, 3.5);
  if (xv >= -7 && xv <= 7 && yv >= -8 && yv <= 10) {
    dibujarPunto(ctx, toX(xv), toY(yv), 6.5, p.gold);
  }

  // Balón recorriendo la parábola
  const xm = Math.sin(t * 1.3) * 4.5 + Math.max(-2, Math.min(2, xv));
  const ym = f(xm);
  if (ym >= -8 && ym <= 10) {
    dibujarPunto(ctx, toX(xm), toY(ym), 9, p.accent);
  }
  dibujarHUD(ctx, 64, 18, [`Vértice: (${fmt(xv, 2)}, ${fmt(yv, 2)})`, `Punto: (${fmt(xm, 2)}, ${fmt(ym, 2)})`, aSafe > 0 ? "Abre hacia ARRIBA (U)" : "Abre hacia ABAJO (∩)"], p);
}

// 3. Función Cúbica
function dibujarCubica(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -5, 5, -10, 10, p, { labelX: "x", labelY: "y" });
  const f = (x) => A * x * x * x + B * x + C;
  dibujarCurva(ctx, f, -5, 5, toX, toY, p.purple, 3.5);

  const xm = Math.sin(t * 1.1) * 3.1;
  const ym = f(xm);
  // Punto de inflexión en x = 0
  dibujarPunto(ctx, toX(0), toY(C), 6, p.gold);
  if (Math.abs(ym) <= 10) {
    dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.cyan);
  }
  dibujarHUD(ctx, 64, 18, [`Inflexión: (0, ${fmt(C, 1)})`, `f(${fmt(xm, 2)}) = ${fmt(ym, 2)}`], p);
}

// 4. Trigonometría: Seno con Círculo Unitario animado
function dibujarSenoCirculo(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const cx = 185, cy = H * 0.52, r = 95 * Math.min(1.25, Math.max(0.45, Math.abs(A) * 0.55));
  const ang = t * B + C;
  const px = cx + r * Math.cos(ang);
  const py = cy - r * Math.sin(ang);

  // Círculo unitario
  ctx.save();
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 130, cy); ctx.lineTo(cx + 130, cy);
  ctx.moveTo(cx, cy - 135); ctx.lineTo(cx, cy + 135);
  ctx.stroke();

  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Radio y altura seno
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(px, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Onda seno a la derecha
  const startX = 355, waveW = W - startX - 35;
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(startX, cy); ctx.lineTo(startX + waveW, cy);
  ctx.moveTo(startX, cy - 150); ctx.lineTo(startX, cy + 150);
  ctx.stroke();

  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const frac = i / 240;
    const xPos = startX + frac * waveW;
    const yPos = cy - r * Math.sin(ang - frac * Math.PI * 3.5);
    if (i === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos);
  }
  ctx.stroke();

  // Línea conectora horizontal
  ctx.strokeStyle = p.accent;
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(startX, py);
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, px, py, 7.5, p.accent);
  dibujarPunto(ctx, startX, py, 7.5, p.cyan);
  const deg = (((ang * 180) / Math.PI) % 360 + 360) % 360;
  dibujarHUD(ctx, 20, 16, [`Ángulo θ = ${fmt(deg, 0)}°`, `y = A·sen(θ) = ${fmt(A * Math.sin(ang), 2)}`], p);
}

// 5. Trigonometría: Coseno con Círculo Unitario
function dibujarCosenoCirculo(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const cx = 185, cy = H * 0.52, r = 95 * Math.min(1.25, Math.max(0.45, Math.abs(A) * 0.55));
  const ang = t * B + C;
  const px = cx + r * Math.cos(ang);
  const py = cy - r * Math.sin(ang);

  ctx.save();
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 130, cy); ctx.lineTo(cx + 130, cy);
  ctx.moveTo(cx, cy - 135); ctx.lineTo(cx, cy + 135);
  ctx.stroke();

  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Proyección horizontal (coseno)
  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, cy);
  ctx.stroke();

  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Onda coseno
  const startX = 355, waveW = W - startX - 35;
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(startX, cy); ctx.lineTo(startX + waveW, cy);
  ctx.moveTo(startX, cy - 150); ctx.lineTo(startX, cy + 150);
  ctx.stroke();

  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const frac = i / 240;
    const xPos = startX + frac * waveW;
    const yPos = cy - r * Math.cos(ang - frac * Math.PI * 3.5);
    if (i === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos);
  }
  ctx.stroke();
  ctx.restore();

  const waveY = cy - r * Math.cos(ang);
  dibujarPunto(ctx, px, py, 7.5, p.gold);
  dibujarPunto(ctx, startX, waveY, 7.5, p.purple);
  dibujarHUD(ctx, 20, 16, [`cos(θ) = proyección en X`, `A·cos(θ) = ${fmt(A * Math.cos(ang), 2)}`], p);
}

// 6. Trigonometría: Tangente y Asíntotas
function dibujarTangente(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY, padT, ph } = dibujarPlano(ctx, W, H, -6, 6, -6, 6, p, { labelX: "x", labelY: "tan(x)" });
  const bSafe = Math.abs(B) < 0.2 ? 0.2 : B;
  const f = (x) => A * Math.tan(bSafe * x + C);

  // Asíntotas verticales
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;
  for (let k = -8; k <= 8; k++) {
    const xa = ((Math.PI / 2 + k * Math.PI) - C) / bSafe;
    if (xa >= -6 && xa <= 6) {
      ctx.beginPath();
      ctx.moveTo(toX(xa), padT);
      ctx.lineTo(toX(xa), padT + ph);
      ctx.stroke();
    }
  }
  ctx.restore();

  dibujarCurva(ctx, f, -6, 6, toX, toY, p.cyan, 3, 480, 6.2);
  const xm = -5.5 + ((t * 1.5) % 11);
  const ym = f(xm);
  if (Math.abs(ym) <= 6) {
    dibujarPunto(ctx, toX(xm), toY(ym), 8, p.gold);
  }
  dibujarHUD(ctx, 64, 18, [`x = ${fmt(xm, 2)}`, `y = ${Math.abs(ym) > 50 ? "∞ (Asíntota)" : fmt(ym, 2)}`], p);
}

// 7. Geometría Analítica: Recta (Dos Puntos y Distancia)
function dibujarRectaAnalitica(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -8, 8, -6, 6, p, { labelX: "x", labelY: "y" });
  const x1 = -4, y1 = B;
  const x2 = 4, y2 = B + A * 4;
  const m = (y2 - y1) / (x2 - x1);
  const f = (x) => y1 + m * (x - x1);

  dibujarCurva(ctx, f, -8, 8, toX, toY, p.purple, 3.2);
  const u = (Math.sin(t * 1.4 + C) + 1) * 0.5;
  const xm = x1 + u * (x2 - x1);
  const ym = y1 + u * (y2 - y1);
  const dist = Math.hypot(x2 - x1, y2 - y1);

  ctx.save();
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(toX(x1), toY(y1));
  ctx.lineTo(toX(xm), toY(ym));
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, toX(x1), toY(y1), 7, p.gold);
  dibujarPunto(ctx, toX(x2), toY(y2), 7, p.gold);
  dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.cyan);
  dibujarHUD(ctx, 64, 18, [`Distancia P1→P2 = ${fmt(dist, 2)}`, `Avance = ${fmt(u * 100, 0)}%`, `Pendiente m = ${fmt(m, 2)}`], p);
}

// 8. Geometría Analítica: Parábola con Foco y Directriz
function dibujarParabolaFoco(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -8, 8, -6, 8, p, { labelX: "x", labelY: "y" });
  const fp = Math.abs(A) < 0.4 ? 0.4 : A;
  const h = B, k = C;
  const f = (x) => ((x - h) * (x - h)) / (4 * fp) + k;

  // Directriz
  const yDir = k - fp;
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(-8), toY(yDir));
  ctx.lineTo(toX(8), toY(yDir));
  ctx.stroke();
  ctx.restore();

  dibujarCurva(ctx, f, -8, 8, toX, toY, p.cyan, 3.2, 260, 12);

  // Punto animado + distancias iguales al foco y a la directriz
  const xm = h + Math.sin(t * 1.2) * 4.2;
  const ym = f(xm);
  const fy = k + fp;
  if (ym >= -6 && ym <= 8) {
    ctx.save();
    ctx.strokeStyle = p.gold;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(toX(h), toY(fy));
    ctx.lineTo(toX(xm), toY(ym));
    ctx.lineTo(toX(xm), toY(yDir));
    ctx.stroke();
    ctx.restore();
    dibujarPunto(ctx, toX(xm), toY(ym), 8, p.cyan);
  }
  dibujarPunto(ctx, toX(h), toY(fy), 7, p.gold);
  const dFoco = Math.hypot(xm - h, ym - fy);
  dibujarHUD(ctx, 64, 18, [`Foco: (${fmt(h, 1)}, ${fmt(fy, 1)})`, `d(P, Foco) = ${fmt(dFoco, 2)}`, `d(P, Directriz) = ${fmt(Math.abs(ym - yDir), 2)}`], p);
}

// 9. Geometría Analítica: Círculo
function dibujarCirculoAnalitico(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -9, 9, -6, 6, p, { labelX: "x", labelY: "y" });
  const r = Math.max(0.5, A);
  const rx = Math.abs(toX(r) - toX(0));
  const ry = Math.abs(toY(0) - toY(r));

  ctx.save();
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.ellipse(toX(B), toY(C), rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  const ang = t * 1.4;
  const xm = B + r * Math.cos(ang);
  const ym = C + r * Math.sin(ang);

  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(toX(B), toY(C));
  ctx.lineTo(toX(xm), toY(ym));
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, toX(B), toY(C), 6, p.purple);
  dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.cyan);
  dibujarHUD(ctx, 64, 18, [`Centro: (${fmt(B, 1)}, ${fmt(C, 1)})`, `Radio r = ${fmt(r, 2)}`, `Área = πr² = ${fmt(Math.PI * r * r, 2)}`], p);
}

// 10. Geometría Analítica: Elipse y Focos
function dibujarElipse(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -9, 9, -6, 6, p, { labelX: "x", labelY: "y" });
  const a = Math.max(1, A), b = Math.max(0.8, B);
  const rx = Math.abs(toX(a) - toX(0));
  const ry = Math.abs(toY(0) - toY(b));

  ctx.save();
  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.ellipse(toX(0), toY(0), rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  const ang = t * (0.9 + C * 0.35);
  const xm = a * Math.cos(ang);
  const ym = b * Math.sin(ang);

  // Focos
  const cF = Math.sqrt(Math.abs(a * a - b * b));
  const f1 = a >= b ? [-cF, 0] : [0, -cF];
  const f2 = a >= b ? [cF, 0] : [0, cF];

  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(toX(f1[0]), toY(f1[1]));
  ctx.lineTo(toX(xm), toY(ym));
  ctx.lineTo(toX(f2[0]), toY(f2[1]));
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, toX(f1[0]), toY(f1[1]), 6, p.accent);
  dibujarPunto(ctx, toX(f2[0]), toY(f2[1]), 6, p.accent);
  dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.cyan);
  const d1 = Math.hypot(xm - f1[0], ym - f1[1]);
  const d2 = Math.hypot(xm - f2[0], ym - f2[1]);
  dibujarHUD(ctx, 64, 18, [`d1 + d2 = ${fmt(d1 + d2, 2)} (Constante)`, `Excentricidad e = ${fmt(cF / Math.max(a, b), 2)}`], p);
}

// 11. Precálculo: Función Exponencial
function dibujarExponencial(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -5, 5, -2, 12, p, { labelX: "x", labelY: "y" });
  const f = (x) => A * Math.exp(B * x) + C;
  dibujarCurva(ctx, f, -5, 5, toX, toY, p.cyan, 3.5, 260, 15);

  const xm = -4.5 + ((t * 1.8) % 9);
  const ym = f(xm);
  if (ym >= -2 && ym <= 12) {
    dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.accent);
  }
  dibujarHUD(ctx, 64, 18, [`x = ${fmt(xm, 2)}`, `y = ${fmt(ym, 2)}`, B > 0 ? "Crecimiento explosivo" : "Decaimiento suave"], p);
}

// 12. Precálculo: Función Logarítmica
function dibujarLogaritmo(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -1, 10, -5, 6, p, { labelX: "x", labelY: "y" });
  const bSafe = Math.max(0.2, B);
  const f = (x) => (x > 0.01 ? A * Math.log(bSafe * x) + C : NaN);

  dibujarCurva(ctx, f, 0.04, 10, toX, toY, p.purple, 3.5);
  const xm = 0.25 + ((t * 1.9) % 9.2);
  const ym = f(xm);
  if (ym >= -5 && ym <= 6) {
    dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.cyan);
  }
  dibujarHUD(ctx, 64, 18, [`x = ${fmt(xm, 2)}`, `ln(${fmt(bSafe * xm, 2)}) → y = ${fmt(ym, 2)}`], p);
}

// 13. Precálculo: Función Valor Absoluto
function dibujarValorAbsoluto(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -8, 8, -5, 9, p, { labelX: "x", labelY: "y" });
  const f = (x) => A * Math.abs(x - B) + C;
  dibujarCurva(ctx, f, -8, 8, toX, toY, p.cyan, 3.5);

  // Rayo rebotando en el vértice
  const xm = -7 + ((t * 3.4) % 14);
  const ym = f(xm);
  dibujarPunto(ctx, toX(B), toY(C), 6.5, p.gold);
  if (ym >= -5 && ym <= 9) {
    dibujarPunto(ctx, toX(xm), toY(ym), 8.5, p.accent);
  }
  dibujarHUD(ctx, 64, 18, [`Vértice en (${fmt(B, 1)}, ${fmt(C, 1)})`, `|x - ${fmt(B, 1)}| = ${fmt(Math.abs(xm - B), 2)}`], p);
}

/* --- NIVEL INTERMEDIO / TRONCO COMÚN (8 TEMAS) --- */

// 14. Cálculo Diferencial: Derivada (Recta Tangente móvil)
function dibujarDerivada(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -6, 6, -6, 6, p, { labelX: "x", labelY: "f(x)" });
  const f = (x) => A * Math.sin(B * x) + 0.12 * C * x * x;
  const df = (x) => A * B * Math.cos(B * x) + 0.24 * C * x;

  dibujarCurva(ctx, f, -6, 6, toX, toY, p.purple, 3.4);

  const xm = Math.sin(t * 0.75) * 4.5;
  const ym = f(xm);
  const m = df(xm);

  // Recta tangente
  const tanColor = m > 0.12 ? p.green : (m < -0.12 ? p.accent : p.gold);
  const xL = xm - 1.8, xR = xm + 1.8;
  ctx.save();
  ctx.strokeStyle = tanColor;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(toX(xL), toY(ym + m * (xL - xm)));
  ctx.lineTo(toX(xR), toY(ym + m * (xR - xm)));
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, toX(xm), toY(ym), 8.5, tanColor);
  const estado = m > 0.12 ? "SUBIENDO (f' > 0)" : (m < -0.12 ? "BAJANDO (f' < 0)" : "CIMA / VALLE (f' ≈ 0)");
  dibujarHUD(ctx, 64, 18, [`x = ${fmt(xm, 2)}`, `Derivada f'(x) = ${fmt(m, 2)}`, estado], p);
}

// 15. Cálculo Integral: Área bajo la curva con rectángulos animados
function dibujarIntegral(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 8, -1, 8, p, { labelX: "x", labelY: "f(x)" });
  const f = (x) => Math.max(0.1, A * Math.sin(0.7 * x) + B * 0.25 * x + 2.2);
  const N = Math.max(4, Math.round(C));
  const aLim = 0.5, bLim = 7.5;
  const dx = (bLim - aLim) / N;

  // Animación de llenado de rectángulos
  const progreso = (t * 0.45) % 1.35;
  const rectsVisibles = Math.min(N, Math.floor(progreso * N) + 1);
  let area = 0;

  ctx.save();
  for (let i = 0; i < rectsVisibles; i++) {
    const xi = aLim + i * dx;
    const hVal = f(xi + dx * 0.5);
    area += hVal * dx;
    const px = toX(xi);
    const py = toY(hVal);
    const pw = toX(xi + dx) - px;
    const ph = toY(0) - py;
    ctx.fillStyle = p.cyanSoft;
    ctx.strokeStyle = p.cyan;
    ctx.lineWidth = 1.4;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);
  }
  ctx.restore();

  dibujarCurva(ctx, f, 0, 8, toX, toY, p.purple, 3.5);
  dibujarHUD(ctx, 64, 18, [`Rectángulos: ${rectsVisibles} / ${N}`, `Área acumulada ≈ ${fmt(area, 2)} u²`, `Ancho Δx = ${fmt(dx, 2)}`], p);
}

// 16. Álgebra Lineal: Vectores que Rotan
function dibujarRotacionVectores(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -6, 6, -4.5, 4.5, p, { labelX: "x", labelY: "y" });
  const ang = t * B + (C * Math.PI) / 180;
  const escala = A;

  // Cuadrado original (punteado) y rotado
  const pts = [[0, 0], [2, 0], [2, 1.5], [0, 1.5]];
  const rot = (x, y) => [
    escala * (x * Math.cos(ang) - y * Math.sin(ang)),
    escala * (x * Math.sin(ang) + y * Math.cos(ang))
  ];

  ctx.save();
  ctx.strokeStyle = p.muted;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(toX(x), toY(y)) : ctx.lineTo(toX(x), toY(y))));
  ctx.closePath();
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = p.purpleSoft;
  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const [rx, ry] = rot(x, y);
    if (i === 0) ctx.moveTo(toX(rx), toY(ry)); else ctx.lineTo(toX(rx), toY(ry));
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const [vx, vy] = rot(2.5, 1.2);
  dibujarFlecha(ctx, toX(0), toY(0), toX(vx), toY(vy), p.cyan, 3.4, "v'");
  const deg = (((ang * 180) / Math.PI) % 360 + 360) % 360;
  dibujarHUD(ctx, 64, 18, [`Ángulo θ = ${fmt(deg, 0)}°`, `v' = (${fmt(vx, 2)}, ${fmt(vy, 2)})`, `Escala = ${fmt(escala, 2)}x`], p);
}

// 17. Álgebra Lineal: Transformación de Matriz 2x2
function dibujarTransformacionMatriz(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -6, 6, -4.5, 4.5, p, { labelX: "x", labelY: "y" });
  const alpha = (Math.sin(t * 1.1) + 1) * 0.5;
  const m11 = 1 + (A - 1) * alpha;
  const m12 = B * alpha;
  const m21 = C * alpha;
  const m22 = 1 + (1.2 - 1) * alpha;
  const T = (x, y) => [m11 * x + m12 * y, m21 * x + m22 * y];

  // Rejilla transformada
  ctx.save();
  ctx.strokeStyle = p.cyanSoft;
  ctx.lineWidth = 1.4;
  for (let i = -3; i <= 3; i++) {
    const [x1, y1] = T(i, -3), [x2, y2] = T(i, 3);
    ctx.beginPath(); ctx.moveTo(toX(x1), toY(y1)); ctx.lineTo(toX(x2), toY(y2)); ctx.stroke();
    const [x3, y3] = T(-3, i), [x4, y4] = T(3, i);
    ctx.beginPath(); ctx.moveTo(toX(x3), toY(y3)); ctx.lineTo(toX(x4), toY(y4)); ctx.stroke();
  }
  // Cuadrado unitario transformado (representa el determinante)
  const [i1, i2] = T(1, 0);
  const [j1, j2] = T(0, 1);
  const [s1, s2] = T(1, 1);
  ctx.fillStyle = p.purpleSoft;
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(0));
  ctx.lineTo(toX(i1), toY(i2));
  ctx.lineTo(toX(s1), toY(s2));
  ctx.lineTo(toX(j1), toY(j2));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  dibujarFlecha(ctx, toX(0), toY(0), toX(i1), toY(i2), p.accent, 3.2, "î'");
  dibujarFlecha(ctx, toX(0), toY(0), toX(j1), toY(j2), p.green, 3.2, "ĵ'");
  const det = m11 * m22 - m12 * m21;
  dibujarHUD(ctx, 64, 18, [`Determinante (Área) = ${fmt(det, 2)}`, `Interpolación: ${fmt(alpha * 100, 0)}%`], p);
}

// 18. Álgebra Lineal: Combinación Lineal
function dibujarCombinacionLineal(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -7, 7, -5, 5, p, { labelX: "x", labelY: "y" });
  const pulso = 0.75 + 0.25 * Math.sin(t * 1.5);
  const u = [2, 0.8];
  const v = [-0.6, 1.8];
  const au = [A * pulso * u[0], A * pulso * u[1]];
  const bv = [B * pulso * v[0], B * pulso * v[1]];
  const res = [au[0] + bv[0] + C * 0.2, au[1] + bv[1]];

  // Paralelogramo
  ctx.save();
  ctx.strokeStyle = p.muted;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(toX(au[0]), toY(au[1]));
  ctx.lineTo(toX(res[0]), toY(res[1]));
  ctx.lineTo(toX(bv[0]), toY(bv[1]));
  ctx.stroke();
  ctx.restore();

  dibujarFlecha(ctx, toX(0), toY(0), toX(au[0]), toY(au[1]), p.cyan, 3, "a·u");
  dibujarFlecha(ctx, toX(0), toY(0), toX(bv[0]), toY(bv[1]), p.purple, 3, "b·v");
  dibujarFlecha(ctx, toX(0), toY(0), toX(res[0]), toY(res[1]), p.gold, 3.8, "w = a·u + b·v");
  dibujarHUD(ctx, 64, 18, [`Resultante w = (${fmt(res[0], 2)}, ${fmt(res[1], 2)})`, `Magnitud |w| = ${fmt(Math.hypot(res[0], res[1]), 2)}`], p);
}

// 19. EDO: Crecimiento Poblacional (Logístico)
function dibujarEdoPoblacion(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const K = Math.max(20, B);
  const P0 = Math.min(K - 2, Math.max(2, C));
  const r = Math.max(0.1, A);
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 14, 0, 120, p, { labelX: "Tiempo (t)", labelY: "Población P(t)", stepY: 20 });
  const P = (x) => K / (1 + ((K - P0) / P0) * Math.exp(-r * x));

  // Línea de capacidad de carga K
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(K));
  ctx.lineTo(toX(14), toY(K));
  ctx.stroke();
  ctx.restore();

  dibujarCurva(ctx, P, 0, 14, toX, toY, p.green, 3.5);
  const tm = (t * 2.1) % 14;
  const pop = P(tm);
  dibujarPunto(ctx, toX(tm), toY(pop), 8.5, p.cyan);

  // Caja visual de individuos multiplicándose
  const bx = W - 190, by = 60, bw = 155, bh = 115;
  ctx.save();
  ctx.fillStyle = p.bgPanel;
  ctx.strokeStyle = p.green;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.stroke();
  const count = Math.min(60, Math.round(pop * 0.55));
  for (let i = 0; i < count; i++) {
    const px = bx + 14 + ((i * 37) % (bw - 28)) + Math.sin(t * 2 + i) * 3;
    const py = by + 16 + ((i * 53) % (bh - 30)) + Math.cos(t * 2.3 + i) * 3;
    ctx.fillStyle = p.green;
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  dibujarHUD(ctx, 64, 18, [`t = ${fmt(tm, 1)} h`, `Población = ${fmt(pop, 0)} / ${fmt(K, 0)} máx.`], p);
}

// 20. EDO: Ley de Enfriamiento de Newton
function dibujarEdoEnfriamiento(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const T0 = A, Tamb = B, k = C;
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 20, 0, 105, p, { labelX: "Minutos", labelY: "Temp (°C)", stepY: 20 });
  const T = (x) => Tamb + (T0 - Tamb) * Math.exp(-k * x);

  ctx.save();
  ctx.strokeStyle = p.blue;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(Tamb));
  ctx.lineTo(toX(20), toY(Tamb));
  ctx.stroke();
  ctx.restore();

  dibujarCurva(ctx, T, 0, 20, toX, toY, p.accent, 3.4);
  const tm = (t * 2.6) % 20;
  const temp = T(tm);
  const fracHot = Math.max(0, Math.min(1, (temp - 15) / 80));
  const colorTemp = `rgb(${Math.round(56 + 199 * fracHot)}, ${Math.round(189 - 105 * fracHot)}, ${Math.round(248 - 170 * fracHot)})`;

  dibujarPunto(ctx, toX(tm), toY(temp), 8.5, colorTemp);
  // Taza térmica a la derecha
  const cx = W - 125, cy = 125;
  ctx.save();
  ctx.fillStyle = colorTemp;
  ctx.beginPath();
  ctx.roundRect(cx - 32, cy - 26, 64, 58, 12);
  ctx.fill();
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 34, cy + 2, 14, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Vapor proporcional al calor
  if (fracHot > 0.2) {
    ctx.strokeStyle = p.muted;
    ctx.lineWidth = 2;
    for (let s = -1; s <= 1; s++) {
      ctx.beginPath();
      const vx = cx + s * 14;
      ctx.moveTo(vx, cy - 32);
      ctx.quadraticCurveTo(vx + Math.sin(t * 4 + s) * 8, cy - 48, vx, cy - 60 - fracHot * 16);
      ctx.stroke();
    }
  }
  ctx.restore();
  dibujarHUD(ctx, 64, 18, [`Minuto: ${fmt(tm, 1)}`, `Temperatura: ${fmt(temp, 1)} °C`, `Ambiente: ${fmt(Tamb, 0)} °C`], p);
}

// 21. EDO: Decaimiento Radiactivo
function dibujarEdoRadiactivo(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const N0 = A, lam = B;
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 15, 0, 110, p, { labelX: "Tiempo", labelY: "Átomos N(t)", stepY: 20 });
  const N = (x) => N0 * Math.exp(-lam * x);
  dibujarCurva(ctx, N, 0, 15, toX, toY, p.gold, 3.4);

  const tm = (t * (1.4 + C * 0.4)) % 15;
  const restantes = N(tm);
  dibujarPunto(ctx, toX(tm), toY(restantes), 8.5, p.gold);

  // Muestra visual de átomos activos vs decaídos
  const bx = W - 190, by = 52;
  ctx.save();
  ctx.fillStyle = p.bgPanel;
  ctx.strokeStyle = p.gold;
  ctx.beginPath();
  ctx.roundRect(bx, by, 156, 130, 12);
  ctx.fill();
  ctx.stroke();
  const totalDots = 48;
  const activeDots = Math.round((restantes / Math.max(1, N0)) * totalDots);
  for (let i = 0; i < totalDots; i++) {
    const col = i % 8, row = Math.floor(i / 8);
    const active = ((i * 17) % totalDots) < activeDots;
    ctx.fillStyle = active ? p.gold : p.muted + "55";
    ctx.beginPath();
    ctx.arc(bx + 18 + col * 17, by + 20 + row * 18, active ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  const vidaMedia = Math.LN2 / Math.max(0.05, lam);
  dibujarHUD(ctx, 64, 18, [`Restantes: ${fmt(restantes, 0)} de ${fmt(N0, 0)}`, `Vida media t½ = ${fmt(vidaMedia, 2)} s`], p);
}

/* --- NIVEL AVANZADO / ESPECIALIDAD (11 TEMAS) --- */

// 22. EDP: Ecuación de Onda Viajera / Cuerda Vibrante
function dibujarEdpOnda(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, -4, 4, p, { labelX: "Posición x", labelY: "u(x,t)" });
  const k = Math.max(1, Math.round(B)) * (Math.PI / 10);
  const cVel = C;
  const u = (x) => A * Math.sin(k * x) * Math.cos(k * cVel * t) + 0.35 * A * Math.sin(2 * k * x - cVel * t * 1.4);

  // Relleno energético
  ctx.save();
  ctx.fillStyle = p.cyanSoft;
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(0));
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * 10;
    ctx.lineTo(toX(x), toY(u(x)));
  }
  ctx.lineTo(toX(10), toY(0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  dibujarCurva(ctx, u, 0, 10, toX, toY, p.cyan, 3.5);
  dibujarHUD(ctx, 64, 18, [`Armónico n = ${Math.round(B)}`, `Velocidad onda c = ${fmt(cVel, 1)} m/s`], p);
}

// 23. EDP: Ecuación del Calor 1D
function dibujarEdpCalor(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const alpha = Math.max(0.05, A);
  const pico = B;
  const tau = (t * 0.65) % 4.5;
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, 0, 110, p, { labelX: "Barra metálica x", labelY: "Temp u(x,t)", padB: 96, stepY: 20 });

  // Solución analítica suma de modos de Fourier
  const temp = (x) => {
    const L = 10;
    const m1 = pico * Math.sin((Math.PI * x) / L) * Math.exp(-alpha * Math.pow(Math.PI / L, 2) * tau * 12);
    const m3 = C * 12 * Math.sin((3 * Math.PI * x) / L) * Math.exp(-alpha * Math.pow((3 * Math.PI) / L, 2) * tau * 12);
    return Math.max(0, m1 + m3 + 10);
  };

  dibujarCurva(ctx, temp, 0, 10, toX, toY, p.accent, 3.4);

  // Barra metálica térmica debajo de la gráfica
  const barY = H - 56, barH = 26, segs = 70;
  const xStart = toX(0), xEnd = toX(10), sw = (xEnd - xStart) / segs;
  for (let i = 0; i < segs; i++) {
    const x = ((i + 0.5) / segs) * 10;
    const v = Math.max(0, Math.min(1, temp(x) / 100));
    ctx.fillStyle = `rgb(${Math.round(35 + 220 * v)}, ${Math.round(130 + 60 * (1 - Math.abs(v - 0.5) * 2) - 70 * v)}, ${Math.round(240 * (1 - v))})`;
    ctx.fillRect(xStart + i * sw, barY, sw + 1, barH);
  }
  ctx.strokeStyle = p.text;
  ctx.strokeRect(xStart, barY, xEnd - xStart, barH);
  dibujarHUD(ctx, 64, 18, [`Difusividad α = ${fmt(alpha, 2)}`, `Tiempo t = ${fmt(tau, 2)} s`, `Centro: ${fmt(temp(5), 1)} °C`], p);
}

// 24. Variable Compleja: Plano Complejo y Fórmula de Euler
function dibujarPlanoComplejo(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -5, 5, -3.6, 3.6, p, { labelX: "Re(z)", labelY: "Im(z)" });
  const r = A, theta = t * B;
  const nPow = Math.max(1, Math.round(C));

  // Espiral compleja r^s e^(i s theta)
  ctx.save();
  ctx.strokeStyle = p.purpleSoft;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 140; i++) {
    const s = (i / 140) * nPow;
    const rs = Math.pow(r, s * 0.45);
    const px = toX(rs * Math.cos(s * theta));
    const py = toY(rs * Math.sin(s * theta));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  const zx = r * Math.cos(theta), zy = r * Math.sin(theta);
  const rxn = Math.min(3.4, Math.pow(r, nPow * 0.45));
  const znx = rxn * Math.cos(nPow * theta), zny = rxn * Math.sin(nPow * theta);

  dibujarFlecha(ctx, toX(0), toY(0), toX(zx), toY(zy), p.cyan, 3.2, "z");
  dibujarFlecha(ctx, toX(0), toY(0), toX(znx), toY(zny), p.gold, 3.2, `z^${nPow}`);
  dibujarHUD(ctx, 64, 18, [`z = ${fmt(zx, 2)} ${zy >= 0 ? "+" : "-"} ${fmt(Math.abs(zy), 2)}i`, `|z| = ${fmt(r, 2)}, θ = ${fmt((theta % (Math.PI * 2)), 2)} rad`], p);
}

// 25. Análisis Matemático: Función de Onda Compleja (Paquete)
function dibujarFuncionOndaCompleja(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -6, 6, -3.5, 3.5, p, { labelX: "x", labelY: "Re / Im" });
  const x0 = -4 + ((t * (1.2 + C * 0.5)) % 8);
  const env = (x) => A * Math.exp(-0.45 * (x - x0) * (x - x0));
  const re = (x) => env(x) * Math.cos(B * x - 4 * t);
  const im = (x) => env(x) * Math.sin(B * x - 4 * t);

  dibujarCurva(ctx, env, -6, 6, toX, toY, p.gold, 2);
  dibujarCurva(ctx, (x) => -env(x), -6, 6, toX, toY, p.gold, 2);
  dibujarCurva(ctx, im, -6, 6, toX, toY, p.purple, 2.6);
  dibujarCurva(ctx, re, -6, 6, toX, toY, p.cyan, 3.4);
  dibujarHUD(ctx, 64, 18, [`Cian: Parte Real Re(ψ)`, `Morado: Imaginaria Im(ψ)`, `Dorado: Envolvente |ψ|`], p);
}

// 26. Probabilidad: Campana de Gauss animada (con lluvia de datos)
function dibujarGauss(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const mu = A, sigma = Math.max(0.35, B);
  const { toX, toY } = dibujarPlano(ctx, W, H, -6, 6, 0, 1.15, p, { labelX: "x", labelY: "Densidad f(x)", stepY: 0.25 });
  const gauss = (x) => (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

  // Área bajo +-1 sigma (68.2%)
  ctx.save();
  ctx.fillStyle = p.purpleSoft;
  ctx.beginPath();
  ctx.moveTo(toX(mu - sigma), toY(0));
  for (let i = 0; i <= 80; i++) {
    const x = (mu - sigma) + (i / 80) * (2 * sigma);
    ctx.lineTo(toX(x), toY(gauss(x)));
  }
  ctx.lineTo(toX(mu + sigma), toY(0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  dibujarCurva(ctx, gauss, -6, 6, toX, toY, p.cyan, 3.5);

  // Bolitas cayendo siguiendo distribución normal (pseudoaleatorias deterministas)
  const nBalls = Math.round(14 + C * 6);
  for (let i = 0; i < nBalls; i++) {
    const u1 = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const u2 = ((Math.sin(i * 78.233) * 19341.123) % 1 + 1) % 1;
    const z = Math.sqrt(-2 * Math.log(Math.max(0.001, u1))) * Math.cos(2 * Math.PI * u2);
    const xb = mu + z * sigma;
    if (xb < -5.8 || xb > 5.8) continue;
    const prog = (t * 0.7 + i * 0.13) % 1;
    const yTarget = gauss(xb) * 0.85;
    const yb = 1.12 - prog * (1.12 - yTarget);
    dibujarPunto(ctx, toX(xb), toY(yb), 4.2, p.gold, false);
  }
  dibujarHUD(ctx, 64, 18, [`Media μ = ${fmt(mu, 2)}`, `Desv. Estándar σ = ${fmt(sigma, 2)}`, `Zona morada = 68.2% de datos`], p);
}

// 27. Estadística: Histograma y Distribución Binomial
function dibujarBinomial(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const n = Math.max(4, Math.round(A));
  const prob = Math.max(0.08, Math.min(0.92, B));
  const { toX, toY } = dibujarPlano(ctx, W, H, -0.5, n + 0.5, 0, 0.55, p, { labelX: "Éxitos k", labelY: "P(X=k)", stepX: Math.max(1, Math.round(n / 10)), stepY: 0.1 });

  const fact = (m) => { let r = 1; for (let i = 2; i <= m; i++) r *= i; return r; };
  const pulso = 0.5 + 0.5 * Math.sin(t * 2.2 * C);

  for (let k = 0; k <= n; k++) {
    const comb = fact(n) / (fact(k) * fact(n - k));
    const pk = comb * Math.pow(prob, k) * Math.pow(1 - prob, n - k);
    const animH = pk * (0.88 + 0.12 * Math.sin(t * 3 - k * 0.5));
    const xBar = toX(k - 0.34);
    const wBar = toX(k + 0.34) - xBar;
    const yBar = toY(Math.min(0.54, animH));
    ctx.fillStyle = Math.abs(k - n * prob) < 1.1 ? p.cyan : p.purple;
    ctx.beginPath();
    ctx.roundRect(xBar, yBar, wBar, toY(0) - yBar, [6, 6, 0, 0]);
    ctx.fill();
  }
  dibujarHUD(ctx, 64, 18, [`Ensayos n = ${n}, p = ${fmt(prob, 2)}`, `Esperanza E[X] = n·p = ${fmt(n * prob, 2)}`, `Pulso muestral: ${fmt(pulso * 100, 0)}%`], p);
}

// 28. Métodos Numéricos: Método de Euler
function dibujarMetodoEuler(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const k = A, h = Math.max(0.15, B);
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 5, 0, 12, p, { labelX: "x", labelY: "y(x)" });
  const exacta = (x) => C * Math.exp(k * x);
  dibujarCurva(ctx, exacta, 0, 5, toX, toY, p.green, 3, 200, 16);

  // Pasos de Euler animados
  const maxPasos = Math.ceil(5 / h);
  const pasosVis = Math.min(maxPasos, Math.floor(((t * 2.2) % (maxPasos + 2))) + 1);
  let x = 0, y = C;
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(toX(x), toY(y));
  for (let i = 0; i < pasosVis; i++) {
    const dy = k * y;
    x += h;
    y += h * dy;
    if (x <= 5.2 && y <= 14) {
      ctx.lineTo(toX(x), toY(y));
    }
  }
  ctx.stroke();
  ctx.restore();

  if (x <= 5.2 && y <= 12) dibujarPunto(ctx, toX(x), toY(y), 7, p.accent);
  const err = Math.abs(exacta(Math.min(5, x)) - y);
  dibujarHUD(ctx, 64, 18, [`Verde: Solución exacta`, `Rojo: Euler (paso h = ${fmt(h, 2)})`, `Error actual ≈ ${fmt(err, 2)}`], p);
}

// 29. Métodos Numéricos: Regla de Rectángulos / Trapecios
function dibujarRectangulosNumericos(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const n = Math.max(2, Math.round(A));
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 6, 0, 8, p, { labelX: "x", labelY: "f(x)" });
  const f = (x) => 1.5 + B * Math.sin(0.9 * x + t * 0.4 * C) + 0.14 * x * x;
  const dx = 6 / n;
  let suma = 0;

  ctx.save();
  for (let i = 0; i < n; i++) {
    const x1 = i * dx, x2 = (i + 1) * dx;
    const y1 = f(x1), y2 = f(x2);
    suma += 0.5 * (y1 + y2) * dx;
    ctx.fillStyle = p.purpleSoft;
    ctx.strokeStyle = p.cyan;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(toX(x1), toY(0));
    ctx.lineTo(toX(x1), toY(y1));
    ctx.lineTo(toX(x2), toY(y2));
    ctx.lineTo(toX(x2), toY(0));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  dibujarCurva(ctx, f, 0, 6, toX, toY, p.gold, 3.2);
  dibujarHUD(ctx, 64, 18, [`Subintervalos N = ${n}`, `Área numérica ≈ ${fmt(suma, 3)} u²`], p);
}

// 30. Métodos Numéricos: Newton-Raphson
function dibujarNewtonRaphson(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const { toX, toY } = dibujarPlano(ctx, W, H, -1, 6, -4, 10, p, { labelX: "x", labelY: "f(x)" });
  const f = (x) => 0.45 * x * x - A;
  const df = (x) => 0.9 * x;
  dibujarCurva(ctx, f, -1, 6, toX, toY, p.cyan, 3.4);

  const iters = Math.min(5, Math.floor((t * (0.9 + C * 0.3)) % 6) + 1);
  let xn = Math.max(0.6, B);
  for (let i = 0; i < iters; i++) {
    const yn = f(xn);
    const xNext = xn - yn / df(xn);
    ctx.save();
    ctx.strokeStyle = p.gold;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(xn), toY(0));
    ctx.lineTo(toX(xn), toY(yn));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(toX(xn), toY(yn));
    ctx.lineTo(toX(xNext), toY(0));
    ctx.stroke();
    ctx.restore();
    dibujarPunto(ctx, toX(xn), toY(yn), 5.5, p.gold, false);
    xn = xNext;
  }
  const raiz = Math.sqrt(A / 0.45);
  dibujarPunto(ctx, toX(xn), toY(0), 8, p.green);
  dibujarHUD(ctx, 64, 18, [`Iteración #${iters}`, `xₙ = ${fmt(xn, 4)}`, `Raíz real = ${fmt(raiz, 4)}`], p);
}

// 31. Topología: Deformación Continua (Toro <-> Taza)
function dibujarToroTaza(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const morph = (Math.sin(t * A + B) + 1) * 0.5; // 0 = Toro (dona), 1 = Taza
  const cx = W * 0.5, cy = H * 0.54;

  ctx.save();
  // Cuerpo principal deformándose suavemente
  const bodyW = 145 - morph * 45;
  const bodyH = 95 + morph * 55;
  const shiftX = -morph * 42;

  const grad = ctx.createLinearGradient(cx - 140, cy - 120, cx + 140, cy + 120);
  grad.addColorStop(0, p.purple);
  grad.addColorStop(1, p.cyan);

  // Asa / agujero topológico que SIEMPRE permanece (género g = 1)
  const asaX = cx + shiftX + bodyW * 0.82 * morph + (1 - morph) * 0;
  const asaR = 46 - morph * 8;

  if (morph > 0.25) {
    // Asa de la taza
    ctx.strokeStyle = p.cyan;
    ctx.lineWidth = 24 - morph * 6;
    ctx.beginPath();
    ctx.arc(asaX + 18, cy + 8, asaR, -Math.PI * 0.48, Math.PI * 0.48);
    ctx.stroke();
  }

  // Forma externa (dona -> cilindro de taza)
  ctx.fillStyle = grad;
  ctx.beginPath();
  const radiusCorner = 90 * (1 - morph * 0.72);
  ctx.roundRect(cx + shiftX - bodyW, cy - bodyH * 0.8, bodyW * 2, bodyH * 1.6, radiusCorner);
  ctx.fill();

  // Agujero central de la dona que se desplaza y se convierte en el hueco del asa
  if (morph < 0.75) {
    ctx.fillStyle = p.bg;
    ctx.beginPath();
    const holeX = cx + morph * 88;
    const holeRx = 54 * (1 - morph * 0.65);
    const holeRy = 34 * (1 - morph * 0.35);
    ctx.ellipse(holeX, cy, Math.max(8, holeRx), Math.max(8, holeRy), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cavidad superior de la taza (solo una hendidura, NO rompe la superficie)
  if (morph > 0.2) {
    ctx.fillStyle = p.bg;
    ctx.globalAlpha = Math.min(0.85, (morph - 0.2) * 1.1);
    ctx.beginPath();
    ctx.ellipse(cx + shiftX, cy - bodyH * 0.78, bodyW * 0.82, 22 * morph, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Malla topológica de anillos
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1.5;
  const rings = Math.max(3, Math.round(C));
  for (let i = 1; i <= rings; i++) {
    const yy = cy - bodyH * 0.6 + (i / (rings + 1)) * bodyH * 1.2;
    ctx.beginPath();
    ctx.ellipse(cx + shiftX, yy, bodyW * 0.96, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const fase = morph < 0.3 ? "Dona (Toro)" : (morph > 0.7 ? "Taza de Café" : "Homeomorfismo en curso...");
  dibujarHUD(ctx, 24, 18, [`Forma: ${fase}`, `Transformación: ${fmt(morph * 100, 0)}%`, `Agujeros (Género g) = 1 (Invariante)`], p);
}

// 32. Álgebra Abstracta: Grupo de Simetrías Diedral Dn
function dibujarGrupoSimetrias(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const n = Math.max(3, Math.min(8, Math.round(A)));
  const cx = W * 0.5, cy = H * 0.53, R = 155;
  const rotStep = (Math.PI * 2) / n;
  const ang = t * B * 0.7;
  const flip = C > 0.5 ? Math.cos(t * 1.4) : 1;

  // Ejes de simetría
  ctx.save();
  ctx.strokeStyle = p.grid;
  ctx.setLineDash([6, 6]);
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI) / n;
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.25 * Math.cos(a), cy - R * 1.25 * Math.sin(a));
    ctx.lineTo(cx + R * 1.25 * Math.cos(a), cy + R * 1.25 * Math.sin(a));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Polígono rotando / reflejándose
  const colores = [p.cyan, p.purple, p.gold, p.accent, p.green, p.blue, p.pink, "#a29bfe"];
  ctx.strokeStyle = p.cyan;
  ctx.fillStyle = p.purpleSoft;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = i * rotStep + ang - Math.PI / 2;
    const x = cx + R * Math.cos(a) * flip;
    const y = cy + R * Math.sin(a);
    verts.push([x, y]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  verts.forEach(([x, y], i) => {
    dibujarPunto(ctx, x, y, 13, colores[i % colores.length], false);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), x, y + 4);
  });
  ctx.restore();

  dibujarHUD(ctx, 24, 18, [`Grupo Diedral D${n}`, `Orden del grupo = ${2 * n} simetrías`, C > 0.5 ? "Operación: Rotación + Reflexión" : "Operación: Solo Rotaciones"], p);
}


// ==========================================================================
// 3. FUNCIONES DE DIBUJO — FÍSICA (27 TEMAS ANIMADOS)
// ==========================================================================

/* --- NIVEL BÁSICO (9 TEMAS) --- */

// 33. Mecánica Clásica: Tiro Parabólico con balón animado
function dibujarTiroParabolico(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const v0 = A, angDeg = B, g = C;
  const rad = (angDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(rad);
  const vy0 = v0 * Math.sin(rad);
  const tVuelo = (2 * vy0) / g;
  const alcance = vx * tVuelo;
  const hMax = (vy0 * vy0) / (2 * g);

  const xMax = Math.max(40, alcance * 1.15);
  const yMax = Math.max(25, hMax * 1.35);
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, xMax, 0, yMax, p, { labelX: "Distancia (m)", labelY: "Altura (m)" });

  // Trayectoria completa punteada
  ctx.save();
  ctx.strokeStyle = p.purple;
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const ti = (i / 120) * tVuelo;
    const x = vx * ti;
    const y = vy0 * ti - 0.5 * g * ti * ti;
    if (i === 0) ctx.moveTo(toX(x), toY(y)); else ctx.lineTo(toX(x), toY(y));
  }
  ctx.stroke();
  ctx.restore();

  // Posición actual del balón
  const tm = (t * 1.25) % (tVuelo + 0.55);
  const tClamped = Math.min(tm, tVuelo);
  const bx = vx * tClamped;
  const by = Math.max(0, vy0 * tClamped - 0.5 * g * tClamped * tClamped);
  const vy = vy0 - g * tClamped;

  // Vectores velocidad
  dibujarFlecha(ctx, toX(bx), toY(by), toX(bx) + vx * 2.2, toY(by), p.cyan, 2.5, "vx");
  dibujarFlecha(ctx, toX(bx), toY(by), toX(bx), toY(by) - vy * 2.2, p.gold, 2.5, "vy");
  dibujarPunto(ctx, toX(bx), toY(by), 10, p.accent);
  dibujarHUD(ctx, 64, 18, [`Altura máx: ${fmt(hMax, 1)} m`, `Alcance: ${fmt(alcance, 1)} m`, `Tiempo vuelo: ${fmt(tVuelo, 2)} s`], p);
}

// 34. Mecánica Clásica: Caída Libre
function dibujarCaidaLibre(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const h0 = A, g = B, v0 = C;
  const tCaida = (-v0 + Math.sqrt(v0 * v0 + 2 * g * h0)) / g;
  const tm = (t * 1.1) % (tCaida + 0.7);
  const tc = Math.min(tm, tCaida);
  const yAct = Math.max(0, h0 - v0 * tc - 0.5 * g * tc * tc);
  const vAct = v0 + g * tc;

  // Escena vertical a la izquierda + gráfica h(t) a la derecha
  const towerX = 165, groundY = H - 55, topY = 65;
  const mapY = (h) => groundY - (h / Math.max(10, h0)) * (groundY - topY);

  ctx.save();
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, groundY); ctx.lineTo(270, groundY);
  ctx.stroke();

  // Torre de referencia
  ctx.fillStyle = p.purpleSoft;
  ctx.strokeStyle = p.purple;
  ctx.fillRect(85, topY, 45, groundY - topY);
  ctx.strokeRect(85, topY, 45, groundY - topY);

  // Huellas estroboscópicas cada 0.35s
  for (let ts = 0; ts < tc; ts += 0.35) {
    const hs = Math.max(0, h0 - v0 * ts - 0.5 * g * ts * ts);
    ctx.fillStyle = p.cyan + "44";
    ctx.beginPath();
    ctx.arc(towerX, mapY(hs), 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  dibujarPunto(ctx, towerX, mapY(yAct), 11, p.accent);
  dibujarFlecha(ctx, towerX + 22, mapY(yAct), towerX + 22, mapY(yAct) + Math.min(75, vAct * 2.1), p.gold, 2.8, "v");

  // Gráfica Altura vs Tiempo en la mitad derecha
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, Math.max(2, tCaida * 1.15), 0, Math.max(10, h0 * 1.1), p, {
    padL: 340, padR: 28, padT: 46, padB: 55, labelX: "t (s)", labelY: "Altura (m)"
  });
  dibujarCurva(ctx, (x) => Math.max(0, h0 - v0 * x - 0.5 * g * x * x), 0, tCaida, toX, toY, p.cyan, 3.2);
  dibujarPunto(ctx, toX(tc), toY(yAct), 7.5, p.accent);
  dibujarHUD(ctx, 355, 16, [`Altura: ${fmt(yAct, 1)} m`, `Velocidad: ${fmt(vAct, 1)} m/s`, `t caída = ${fmt(tCaida, 2)} s`], p);
}

// 35. Mecánica Clásica: Plano Inclinado
function dibujarPlanoInclinado(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const angDeg = A, mu = B, masa = C;
  const g = 9.81;
  const rad = (angDeg * Math.PI) / 180;
  const aNet = Math.max(0, g * (Math.sin(rad) - mu * Math.cos(rad)));

  const baseX = 140, baseY = H - 70, rampLen = 470;
  const topX = baseX + rampLen * Math.cos(rad);
  const topY = baseY - rampLen * Math.sin(rad);

  ctx.save();
  // Triángulo de la rampa
  ctx.fillStyle = p.purpleSoft;
  ctx.strokeStyle = p.purple;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(topX, baseY);
  ctx.lineTo(topX, topY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Posición deslizándose por la rampa
  const ciclo = 3.2;
  const tm = t % ciclo;
  const dist = aNet > 0.02 ? Math.min(rampLen - 70, 0.5 * aNet * tm * tm * 24) : 0;
  const bx = topX - (40 + dist) * Math.cos(rad);
  const by = topY + (40 + dist) * Math.sin(rad);

  // Caja rotada sobre la rampa
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(-rad);
  ctx.fillStyle = p.cyan;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-24, -44, 48, 42, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Vectores de fuerza desde el centro del bloque
  const cx = bx - 22 * Math.sin(rad);
  const cy = by - 22 * Math.cos(rad);
  const sc = 7.5 * Math.sqrt(masa);
  dibujarFlecha(ctx, cx, cy, cx, cy + g * sc * 0.85, p.accent, 3, "mg");
  const nLen = g * Math.cos(rad) * sc * 0.85;
  dibujarFlecha(ctx, cx, cy, cx - nLen * Math.sin(rad), cy - nLen * Math.cos(rad), p.green, 2.8, "N");
  const fLen = mu * g * Math.cos(rad) * sc * 0.85;
  if (fLen > 3) {
    dibujarFlecha(ctx, cx, cy, cx + fLen * Math.cos(rad), cy - fLen * Math.sin(rad), p.gold, 2.8, "fr");
  }
  ctx.restore();

  dibujarHUD(ctx, 24, 18, [
    `Ángulo θ = ${fmt(angDeg, 0)}° | Fricción μ = ${fmt(mu, 2)}`,
    `Aceleración neta = ${fmt(aNet, 2)} m/s²`,
    aNet <= 0.02 ? "Bloque en REPOSO (la fricción gana)" : "Deslizándose hacia abajo"
  ], p);
}

// 36. Leyes de Newton: F = ma con carrito animado
function dibujarCarritoNewton(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const F = A, masa = Math.max(1, B), mu = C;
  const g = 9.81;
  const fric = mu * masa * g;
  const fNeta = Math.max(0, F - fric);
  const acel = fNeta / masa;

  // Carretera
  const roadY = H * 0.68;
  ctx.save();
  ctx.fillStyle = p.bgPanel;
  ctx.fillRect(40, roadY, W - 80, 44);
  ctx.strokeStyle = p.gold;
  ctx.setLineDash([22, 18]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, roadY + 22); ctx.lineTo(W - 40, roadY + 22);
  ctx.stroke();
  ctx.setLineDash([]);

  // Movimiento del carrito
  const tm = t % 4;
  const disp = acel > 0.02 ? (0.5 * acel * tm * tm * 24) % (W - 220) : 0;
  const carX = 95 + disp;
  const carY = roadY - 14;

  // Chasis del carrito
  const grad = ctx.createLinearGradient(carX, carY - 50, carX + 115, carY);
  grad.addColorStop(0, p.purple);
  grad.addColorStop(1, p.cyan);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(carX, carY - 46, 115, 36, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(carX + 20, carY - 72, 68, 30, 10);
  ctx.fill();

  // Ruedas girando
  const wheelAng = disp * 0.08;
  [carX + 26, carX + 88].forEach((wx) => {
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wx, carY - 4, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx, carY - 4);
    ctx.lineTo(wx + 12 * Math.cos(wheelAng), carY - 4 + 12 * Math.sin(wheelAng));
    ctx.stroke();
  });
  ctx.restore();

  // Vectores fuerza aplicada vs fricción
  dibujarFlecha(ctx, carX + 118, carY - 30, carX + 118 + Math.min(180, F * 2.2), carY - 30, p.green, 3.6, `F = ${fmt(F, 0)}N`);
  if (fric > 0.5) {
    dibujarFlecha(ctx, carX - 4, carY - 22, carX - 4 - Math.min(140, fric * 2.2), carY - 22, p.accent, 3.2, `fr = ${fmt(fric, 1)}N`);
  }

  dibujarHUD(ctx, 30, 20, [
    `Fuerza neta = ${fmt(fNeta, 1)} N`,
    `Aceleración a = F_neta / m = ${fmt(acel, 2)} m/s²`,
    `Velocidad actual = ${fmt(acel * tm, 1)} m/s`
  ], p);
}

// 37. Energía y Momento: Péndulo Simple con barras de Energía Ep / Ec
function dibujarPendulo(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const L = A, theta0 = (B * Math.PI) / 180, g = C;
  const omega = Math.sqrt(g / L);
  const theta = theta0 * Math.cos(omega * t);
  const thetaDot = -theta0 * omega * Math.sin(omega * t);

  const pivotX = W * 0.36, pivotY = 78;
  const lenPx = 115 + L * 58;
  const bx = pivotX + lenPx * Math.sin(theta);
  const by = pivotY + lenPx * Math.cos(theta);

  // Soporte y arco de trayectoria
  ctx.save();
  ctx.strokeStyle = p.muted;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, lenPx, Math.PI / 2 - theta0, Math.PI / 2 + theta0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = p.text;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pivotX - 65, pivotY); ctx.lineTo(pivotX + 65, pivotY);
  ctx.stroke();

  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, pivotX, pivotY, 6, p.gold, false);
  dibujarPunto(ctx, bx, by, 18, p.purple);

  // Energías (masa = 1 kg)
  const h = L * (1 - Math.cos(theta));
  const hMax = Math.max(0.01, L * (1 - Math.cos(theta0)));
  const Ep = g * h;
  const Et = g * hMax;
  const Ec = Math.max(0, Et - Ep);

  // Barras de energía a la derecha (escalables a cualquier tamaño de canvas)
  const bxBar = W * 0.64;
  const byBar = Math.round(H * 0.26);
  const barH = Math.round(H * 0.52);
  const barW = Math.min(54, Math.round(W * 0.068));
  const barStep = Math.min(78, Math.round(W * 0.10));
  const barras = [
    { label: "Ep", val: Ep / Et, color: p.purple },
    { label: "Ec", val: Ec / Et, color: p.cyan },
    { label: "Total", val: 1, color: p.gold }
  ];
  ctx.save();
  barras.forEach((b, i) => {
    const x = bxBar + i * barStep;
    ctx.fillStyle = p.bgPanel;
    ctx.strokeStyle = p.axis;
    ctx.beginPath();
    ctx.roundRect(x, byBar, barW, barH, 10);
    ctx.fill();
    ctx.stroke();
    const fillH = Math.max(4, b.val * barH);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(x + 3, byBar + barH - fillH + 3, barW - 6, fillH - 6, 8);
    ctx.fill();
    ctx.fillStyle = p.text;
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.label, x + barW / 2, byBar + barH + 22);
    ctx.fillText(`${fmt(b.val * 100, 0)}%`, x + barW / 2, byBar - 10);
  });
  ctx.restore();

  const periodo = 2 * Math.PI * Math.sqrt(L / g);
  dibujarHUD(ctx, 24, 18, [`Periodo T = ${fmt(periodo, 2)} s`, `Velocidad = ${fmt(Math.abs(thetaDot * L), 2)} m/s`], p);
}

// 38. Energía y Momento: Colisión Elástica 1D
function dibujarColisionElastica(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const m1 = A, m2 = B, v1i = C, v2i = -1.8;
  // Velocidades después del choque elástico
  const v1f = ((m1 - m2) / (m1 + m2)) * v1i + ((2 * m2) / (m1 + m2)) * v2i;
  const v2f = ((2 * m1) / (m1 + m2)) * v1i + ((m2 - m1) / (m1 + m2)) * v2i;

  const ciclo = 4.2;
  const tm = t % ciclo;
  const tChoque = 1.65;
  const midX = W * 0.5, trackY = H * 0.58;
  const r1 = 18 + m1 * 3.2, r2 = 18 + m2 * 3.2;
  const pxScale = 36;

  let x1, x2, v1Act, v2Act;
  if (tm < tChoque) {
    const dt = tm - tChoque;
    x1 = midX - r1 + v1i * dt * pxScale;
    x2 = midX + r2 + v2i * dt * pxScale;
    v1Act = v1i; v2Act = v2i;
  } else {
    const dt = tm - tChoque;
    x1 = midX - r1 + v1f * dt * pxScale;
    x2 = midX + r2 + v2f * dt * pxScale;
    v1Act = v1f; v2Act = v2f;
  }

  // Pista
  ctx.save();
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(45, trackY + 42); ctx.lineTo(W - 45, trackY + 42);
  ctx.stroke();

  // Destello al momento del choque
  if (Math.abs(tm - tChoque) < 0.18) {
    ctx.strokeStyle = p.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(midX, trackY, 45 * (1 - Math.abs(tm - tChoque) / 0.18), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const cx1 = Math.max(60, Math.min(W - 60, x1));
  const cx2 = Math.max(60, Math.min(W - 60, x2));
  dibujarPunto(ctx, cx1, trackY, r1, p.cyan);
  dibujarPunto(ctx, cx2, trackY, r2, p.purple);
  dibujarFlecha(ctx, cx1, trackY - r1 - 14, cx1 + v1Act * 16, trackY - r1 - 14, p.cyan, 2.8, "v1");
  dibujarFlecha(ctx, cx2, trackY - r2 - 14, cx2 + v2Act * 16, trackY - r2 - 14, p.purple, 2.8, "v2");

  const pTot = m1 * v1Act + m2 * v2Act;
  const ecTot = 0.5 * m1 * v1Act * v1Act + 0.5 * m2 * v2Act * v2Act;
  dibujarHUD(ctx, 26, 18, [
    tm < tChoque ? "Fase: ANTES del choque" : "Fase: DESPUÉS del choque",
    `Momento total p = ${fmt(pTot, 2)} kg·m/s (Conservado)`,
    `Energía Cinética Ec = ${fmt(ecTot, 2)} J (Conservada)`
  ], p);
}

// 39. Ondas: Onda Sonora (Longitudinal + Presión)
function dibujarOndaSonora(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const amp = A, freq = B, vel = C;

  // Parte superior: partículas de aire vibrando longitudinalmente
  ctx.save();
  const topY = 125;
  const cols = 38, rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xBase = 85 + (c / (cols - 1)) * (W - 140);
      const phase = (c / cols) * Math.PI * 2 * freq - t * vel * 2.2;
      const disp = Math.sin(phase) * amp * 13;
      const comp = Math.cos(phase);
      ctx.fillStyle = comp > 0.35 ? p.accent : (comp < -0.35 ? p.blue : p.cyan);
      ctx.beginPath();
      ctx.arc(xBase + disp, topY + r * 22, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bocina vibrando a la izquierda
  const coneX = 52 + Math.sin(-t * vel * 2.2) * amp * 5;
  ctx.fillStyle = p.purple;
  ctx.beginPath();
  ctx.moveTo(28, topY + 20);
  ctx.lineTo(coneX, topY - 4);
  ctx.lineTo(coneX, topY + 96);
  ctx.lineTo(28, topY + 72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Parte inferior: gráfica de presión sonora
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, -2.5, 2.5, p, {
    padL: 85, padR: 55, padT: 265, padB: 42, labelX: "Distancia", labelY: "Presión"
  });
  dibujarCurva(ctx, (x) => amp * Math.cos((x / 10) * Math.PI * 2 * freq - t * vel * 2.2), 0, 10, toX, toY, p.cyan, 3.2);
  dibujarHUD(ctx, 88, 16, [`Frecuencia = ${fmt(freq * 110, 0)} Hz`, `Rojo: Compresión | Azul: Rarefacción`], p);
}

// 40. Termodinámica Básica: Gas Ideal que se Expande en Pistón
function dibujarGasPiston(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const T = A, Pext = B, nMol = Math.round(C);
  const volTarget = Math.min(1, Math.max(0.24, (nMol * T) / (Pext * 4800)));
  const osc = Math.sin(t * 2.4) * 0.02;
  const vol = Math.min(0.95, Math.max(0.22, volTarget + osc));

  const cylX = 240, cylW = 420, botY = H - 62, maxH = 340;
  const pistonY = botY - vol * maxH;

  ctx.save();
  // Interior del gas coloreado por temperatura
  const hot = (T - 200) / 600;
  ctx.fillStyle = `rgba(${Math.round(50 + 205 * hot)}, ${Math.round(180 - 95 * hot)}, ${Math.round(240 - 180 * hot)}, 0.16)`;
  ctx.fillRect(cylX, pistonY, cylW, botY - pistonY);

  // Partículas rebotando con rapidez proporcional a sqrt(T)
  const speed = Math.sqrt(T / 300) * 140;
  const nDots = Math.min(55, nMol * 6);
  for (let i = 0; i < nDots; i++) {
    const vx = Math.sin(i * 12.7 + 1) * speed;
    const vy = Math.cos(i * 19.3 + 2) * speed;
    const wBox = cylW - 20;
    const hBox = Math.max(24, botY - pistonY - 20);
    const rawX = Math.abs(((i * 53 + vx * t) % (2 * wBox) + 2 * wBox) % (2 * wBox));
    const rawY = Math.abs(((i * 37 + vy * t) % (2 * hBox) + 2 * hBox) % (2 * hBox));
    const px = cylX + 10 + (rawX > wBox ? 2 * wBox - rawX : rawX);
    const py = pistonY + 10 + (rawY > hBox ? 2 * hBox - rawY : rawY);
    ctx.fillStyle = hot > 0.5 ? p.accent : p.cyan;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paredes del cilindro y émbolo
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cylX, botY - maxH - 25);
  ctx.lineTo(cylX, botY);
  ctx.lineTo(cylX + cylW, botY);
  ctx.lineTo(cylX + cylW, botY - maxH - 25);
  ctx.stroke();

  ctx.fillStyle = p.purple;
  ctx.fillRect(cylX + 3, pistonY - 18, cylW - 6, 18);
  ctx.fillRect(cylX + cylW / 2 - 10, pistonY - 85, 20, 68);
  ctx.restore();

  dibujarHUD(ctx, 24, 18, [`Temp T = ${fmt(T, 0)} K`, `Presión P = ${fmt(Pext, 1)} atm`, `Volumen relativo = ${fmt(vol * 100, 0)}%`], p);
}

// 41. Termodinámica Básica: Tu Café que se Enfría
function dibujarCafeEnfriamiento(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const T0 = A, Tamb = B, k = C;
  const tm = (t * 2.5) % 25;
  const T = Tamb + (T0 - Tamb) * Math.exp(-k * tm);
  const frac = Math.max(0, Math.min(1, (T - 15) / 80));

  // Taza grande a la izquierda
  const cx = 220, cy = H * 0.58;
  const colorLiquido = `rgb(${Math.round(56 + 195 * frac)}, ${Math.round(180 - 100 * frac)}, ${Math.round(235 - 170 * frac)})`;

  ctx.save();
  // Plato
  ctx.fillStyle = p.bgPanel;
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 84, 108, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cuerpo de la taza
  ctx.fillStyle = colorLiquido;
  ctx.beginPath();
  ctx.roundRect(cx - 72, cy - 55, 144, 132, [8, 8, 36, 36]);
  ctx.fill();
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Asa
  ctx.beginPath();
  ctx.arc(cx + 75, cy + 5, 32, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  // Partículas térmicas escapando como vapor
  const nSteam = Math.round(4 + frac * 14);
  for (let i = 0; i < nSteam; i++) {
    const prog = (t * (0.6 + frac) + i * 0.19) % 1;
    const sx = cx - 48 + ((i * 29) % 96) + Math.sin(t * 3 + i) * 10;
    const sy = cy - 64 - prog * (55 + frac * 70);
    ctx.fillStyle = `rgba(255,255,255,${(1 - prog) * 0.55 * frac})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 5 + prog * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Curva de enfriamiento a la derecha
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 25, 0, 105, p, {
    padL: 385, padR: 28, padT: 48, padB: 52, labelX: "Minutos", labelY: "°C", stepY: 20
  });
  dibujarCurva(ctx, (x) => Tamb + (T0 - Tamb) * Math.exp(-k * x), 0, 25, toX, toY, p.accent, 3.2);
  dibujarPunto(ctx, toX(tm), toY(T), 8, colorLiquido);

  const estado = T > 65 ? "Muy caliente 🔥" : (T > 42 ? "Ideal para tomar ☕" : "Ya se enfrió ❄️");
  dibujarHUD(ctx, 24, 18, [`Café: ${fmt(T, 1)} °C (${estado})`, `Minuto ${fmt(tm, 1)} | Habitación: ${fmt(Tamb, 0)} °C`], p);
}

/* --- NIVEL INTERMEDIO (7 TEMAS) --- */

// 42. Electromagnetismo: Campo Eléctrico con Flechas Animadas
function dibujarCampoElectrico(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const q1 = A, q2 = B, sep = C * 95;
  const p1 = [W * 0.5 - sep, H * 0.52];
  const p2 = [W * 0.5 + sep, H * 0.52];

  const field = (x, y) => {
    const dx1 = x - p1[0], dy1 = y - p1[1], r1 = Math.pow(dx1 * dx1 + dy1 * dy1 + 900, 1.5);
    const dx2 = x - p2[0], dy2 = y - p2[1], r2 = Math.pow(dx2 * dx2 + dy2 * dy2 + 900, 1.5);
    return [(q1 * dx1) / r1 + (q2 * dx2) / r2, (q1 * dy1) / r1 + (q2 * dy2) / r2];
  };

  // Malla de flechas del campo eléctrico
  for (let gx = 75; gx <= W - 65; gx += 62) {
    for (let gy = 75; gy <= H - 55; gy += 56) {
      if (Math.hypot(gx - p1[0], gy - p1[1]) < 36 || Math.hypot(gx - p2[0], gy - p2[1]) < 36) continue;
      const [ex, ey] = field(gx, gy);
      const mag = Math.hypot(ex, ey);
      if (mag < 1e-7) continue;
      const len = 18 + 6 * Math.sin(t * 4 - mag * 50000);
      const ux = (ex / mag) * len, uy = (ey / mag) * len;
      dibujarFlecha(ctx, gx - ux * 0.4, gy - uy * 0.4, gx + ux * 0.6, gy + uy * 0.6, p.cyan + "bb", 1.8);
    }
  }

  // Partícula de prueba recorriendo el campo
  const ang = t * 1.1;
  const tx = p1[0] + Math.cos(ang) * 90 + Math.sin(t * 0.7) * sep;
  const ty = H * 0.52 + Math.sin(ang) * 110;
  const [etx, ety] = field(tx, ty);
  const em = Math.hypot(etx, ety) || 1;
  dibujarFlecha(ctx, tx, ty, tx + (etx / em) * 48, ty + (ety / em) * 48, p.gold, 3, "F");
  dibujarPunto(ctx, tx, ty, 7, p.gold);

  // Cargas principales
  dibujarPunto(ctx, p1[0], p1[1], 19, q1 >= 0 ? p.accent : p.blue);
  dibujarPunto(ctx, p2[0], p2[1], 19, q2 >= 0 ? p.accent : p.blue);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(q1 >= 0 ? "+" : "−", p1[0], p1[1] + 6);
  ctx.fillText(q2 >= 0 ? "+" : "−", p2[0], p2[1] + 6);
  dibujarHUD(ctx, 24, 16, [`q1 = ${fmt(q1, 1)} μC | q2 = ${fmt(q2, 1)} μC`, `Las flechas salen de (+) y entran a (−)`], p);
}

// 43. Electromagnetismo: Campo Magnético y Fuerza de Lorentz
function dibujarCampoMagnetico(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const v = A, Bfield = B, qSign = C >= 0 ? 1 : -1;

  // Fondo con símbolos de campo magnético (× entrando / • saliendo)
  ctx.save();
  ctx.fillStyle = p.muted + "66";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let x = 70; x < W - 40; x += 72) {
    for (let y = 70; y < H - 40; y += 68) {
      ctx.fillText(Bfield >= 0 ? "×" : "•", x, y);
    }
  }
  ctx.restore();

  const bAbs = Math.max(0.35, Math.abs(Bfield));
  const R = Math.min(185, Math.max(42, (v / bAbs) * 34));
  const omega = (v * 0.9 / Math.max(0.6, R / 65)) * qSign * (Bfield >= 0 ? 1 : -1);
  const cx = W * 0.5, cy = H * 0.53;
  const ang = t * omega;
  const px = cx + R * Math.cos(ang);
  const py = cy + R * Math.sin(ang);

  ctx.save();
  ctx.strokeStyle = p.purple;
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Vector velocidad tangente y Fuerza centrípeta de Lorentz
  const dir = omega >= 0 ? 1 : -1;
  const vx = -Math.sin(ang) * dir * 56;
  const vy = Math.cos(ang) * dir * 56;
  dibujarFlecha(ctx, px, py, px + vx, py + vy, p.cyan, 3, "v");
  dibujarFlecha(ctx, px, py, px + (cx - px) * 0.45, py + (cy - py) * 0.45, p.gold, 3, "F_B");
  dibujarPunto(ctx, px, py, 12, qSign > 0 ? p.accent : p.blue);

  dibujarHUD(ctx, 24, 16, [
    `Radio ciclotrón R = mv / |qB| ≈ ${fmt(R / 34, 2)} m`,
    `Campo B = ${fmt(Bfield, 2)} T (${Bfield >= 0 ? "hacia adentro ×" : "hacia afuera •"})`
  ], p);
}

// 44. Leyes de Maxwell: Onda Electromagnética Propagándose (E y B perpendiculares)
function dibujarOndaEM(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const amp = A * 46, k = B * 0.022, speed = C * 2.8;
  const startX = 90, endX = W - 65, midY = H * 0.54;

  // Eje de propagación
  ctx.save();
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, midY); ctx.lineTo(endX, midY);
  ctx.stroke();

  // Onda Eléctrica E (vertical en cian) y Magnética B (inclinada en perspectiva 3D en morado/dorado)
  const pasos = 90;
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= pasos; i++) {
    const x = startX + (i / pasos) * (endX - startX);
    const val = Math.sin(k * (x - startX) - t * speed) * amp;
    if (i === 0) ctx.moveTo(x, midY - val); else ctx.lineTo(x, midY - val);
  }
  ctx.stroke();

  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= pasos; i++) {
    const x = startX + (i / pasos) * (endX - startX);
    const val = Math.sin(k * (x - startX) - t * speed) * amp;
    const bx = x + val * 0.48;
    const by = midY + val * 0.48;
    if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
  }
  ctx.stroke();

  // Flechas de campo periódicas
  for (let i = 0; i <= 24; i++) {
    const x = startX + (i / 24) * (endX - startX);
    const val = Math.sin(k * (x - startX) - t * speed) * amp;
    if (Math.abs(val) > 8) {
      dibujarFlecha(ctx, x, midY, x, midY - val, p.cyan + "aa", 1.7);
      dibujarFlecha(ctx, x, midY, x + val * 0.48, midY + val * 0.48, p.gold + "aa", 1.7);
    }
  }
  ctx.restore();
  dibujarFlecha(ctx, endX - 95, 72, endX - 15, 72, p.accent, 3, "c (luz)");
  dibujarHUD(ctx, 24, 16, [`Cian: Campo Eléctrico E (vertical)`, `Dorado: Campo Magnético B (perpendicular)`, `Maxwell: E genera B y B genera E`], p);
}

// 45. Circuitos: Ley de Ohm (V = IR) con Focos y Electrones
function dibujarCircuitoOhm(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const V = A, R = Math.max(1, B), focos = Math.round(C);
  const rTot = R * focos;
  const I = V / rTot;
  const potencia = V * I;

  const left = 150, right = W - 150, top = 115, bot = H - 95;
  ctx.save();
  // Cable del circuito rectangular
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.strokeRect(left, top, right - left, bot - top);

  // Batería a la izquierda
  const batY = (top + bot) / 2;
  ctx.fillStyle = p.purple;
  ctx.beginPath();
  ctx.roundRect(left - 34, batY - 46, 68, 92, 12);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${fmt(V, 1)}V`, left, batY + 5);
  ctx.fillText("+", left, batY - 24);
  ctx.fillText("−", left, batY + 34);

  // Focos en serie en la rama superior
  const brillo = Math.min(1, I / 2.2);
  for (let i = 0; i < focos; i++) {
    const fx = left + ((i + 1) / (focos + 1)) * (right - left);
    const fy = top;
    // Halo luminoso
    const radGlow = 26 + brillo * 58;
    const grad = ctx.createRadialGradient(fx, fy, 4, fx, fy, radGlow);
    grad.addColorStop(0, `rgba(255, 224, 102, ${0.25 + brillo * 0.75})`);
    grad.addColorStop(1, "rgba(255, 224, 102, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, radGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = brillo > 0.15 ? "#ffe066" : p.bgPanel;
    ctx.strokeStyle = p.text;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Electrones fluyendo por el perímetro proporcionalmente a I
  const perim = 2 * ((right - left) + (bot - top));
  const nElec = 22;
  const speedPx = Math.min(260, I * 85);
  for (let i = 0; i < nElec; i++) {
    const d = ((i / nElec) * perim + t * speedPx) % perim;
    let ex, ey;
    const wSeg = right - left, hSeg = bot - top;
    if (d < wSeg) { ex = left + d; ey = top; }
    else if (d < wSeg + hSeg) { ex = right; ey = top + (d - wSeg); }
    else if (d < 2 * wSeg + hSeg) { ex = right - (d - wSeg - hSeg); ey = bot; }
    else { ex = left; ey = bot - (d - 2 * wSeg - hSeg); }
    dibujarPunto(ctx, ex, ey, 5, p.cyan, false);
  }
  ctx.restore();

  dibujarHUD(ctx, 24, 16, [
    `Corriente I = V / R_total = ${fmt(I, 2)} A`,
    `Resistencia total = ${fmt(rTot, 1)} Ω (${focos} foco${focos > 1 ? "s" : ""})`,
    `Potencia P = ${fmt(potencia, 2)} W`
  ], p);
}

// 46. Circuitos: Carga y Descarga de Capacitor RC
function dibujarCapacitor(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const V0 = A, R = B, Cap = C;
  const tau = R * Cap;
  const ciclo = 10;
  const tm = t % ciclo;
  const cargando = tm < 5;
  const tLocal = cargando ? tm : tm - 5;
  const Vc = cargando ? V0 * (1 - Math.exp(-tLocal / tau)) : V0 * Math.exp(-tLocal / tau);
  const frac = Vc / Math.max(0.1, V0);

  // Placas del capacitor a la izquierda
  const cx = 175, cy = H * 0.56;
  ctx.save();
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy - 85); ctx.lineTo(cx - 32, cy + 85);
  ctx.moveTo(cx + 32, cy - 85); ctx.lineTo(cx + 32, cy + 85);
  ctx.stroke();

  // Campo eléctrico interno entre placas
  ctx.fillStyle = `rgba(0, 206, 201, ${frac * 0.25})`;
  ctx.fillRect(cx - 28, cy - 80, 56, 160);

  const nCargas = Math.round(frac * 8);
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < nCargas; i++) {
    const yy = cy - 64 + (i / 7) * 128;
    ctx.fillStyle = p.accent;
    ctx.fillText("+", cx - 50, yy + 6);
    ctx.fillStyle = p.blue;
    ctx.fillText("−", cx + 50, yy + 6);
  }
  ctx.restore();

  // Gráfica V(t) a la derecha
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, 0, 16, p, {
    padL: 340, padR: 28, padT: 48, padB: 50, labelX: "Tiempo (s)", labelY: "Voltaje Vc (V)"
  });
  dibujarCurva(ctx, (x) => (x < 5 ? V0 * (1 - Math.exp(-x / tau)) : V0 * Math.exp(-(x - 5) / tau)), 0, 10, toX, toY, p.cyan, 3.3);
  dibujarPunto(ctx, toX(tm), toY(Vc), 8.5, cargando ? p.green : p.accent);
  dibujarHUD(ctx, 24, 16, [
    cargando ? "Estado: CARGANDO capacitor" : "Estado: DESCARGANDO capacitor",
    `Constante τ = RC = ${fmt(tau, 2)} s`,
    `Voltaje actual = ${fmt(Vc, 2)} V (${fmt(frac * 100, 0)}%)`
  ], p);
}

// 47. Termodinámica Formal: Ciclo de Carnot (Diagrama P-V)
function dibujarCicloCarnot(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const Th = Math.max(B + 80, A), Tc = B, vel = C;
  const eta = 1 - Tc / Th;
  const { toX, toY } = dibujarPlano(ctx, W, H, 0.5, 6.5, 0, 12, p, { labelX: "Volumen V", labelY: "Presión P" });

  // 4 vértices estilizados del ciclo de Carnot
  const V1 = 1.2, V2 = 2.8, V3 = 5.4, V4 = 2.5;
  const kH = (Th / 600) * 11, kC = (Tc / 600) * 11;
  const pIsoH = (v) => kH / v;
  const pIsoC = (v) => kC / v;

  // Construir la ruta cerrada de las 4 etapas
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) { const v = V1 + (i / N) * (V2 - V1); pts.push([v, pIsoH(v), "1. Expansión Isotérmica (Calor entra)"]); }
  const p2 = pIsoH(V2), p3 = pIsoC(V3);
  for (let i = 1; i <= N; i++) { const f = i / N; const v = V2 + f * (V3 - V2); pts.push([v, p2 * Math.pow(V2 / v, 1.45) * (1 - f) + p3 * f, "2. Expansión Adiabática (Se enfría)"]); }
  for (let i = 1; i <= N; i++) { const v = V3 - (i / N) * (V3 - V4); pts.push([v, pIsoC(v), "3. Compresión Isotérmica (Calor sale)"]); }
  const p4 = pIsoC(V4), p1 = pIsoH(V1);
  for (let i = 1; i <= N; i++) { const f = i / N; const v = V4 - f * (V4 - V1); pts.push([v, p4 * Math.pow(V4 / v, 1.45) * (1 - f) + p1 * f, "4. Compresión Adiabática (Se calienta)"]); }

  // Relleno = Trabajo útil neto W
  ctx.save();
  ctx.fillStyle = p.purpleSoft;
  ctx.beginPath();
  pts.forEach(([v, pr], idx) => (idx === 0 ? ctx.moveTo(toX(v), toY(pr)) : ctx.lineTo(toX(v), toY(pr))));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.restore();

  const idx = Math.floor((t * 28 * vel) % pts.length);
  const [cv, cp, etapa] = pts[idx];
  dibujarPunto(ctx, toX(cv), toY(cp), 9, p.gold);
  dibujarHUD(ctx, 64, 16, [`Eficiencia máx η = ${fmt(eta * 100, 1)}%`, etapa, `Área interior = Trabajo útil W`], p);
}

// 48. Termodinámica Formal: Entropía (Orden -> Desorden)
function dibujarEntropia(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const nPart = Math.round(A), vel = B;
  const ciclo = 9;
  const tm = t % ciclo;
  const abierta = tm > 1.2;
  const mezcla = abierta ? Math.min(1, (tm - 1.2) / (5.5 / Math.max(0.4, vel))) : 0;

  const bx = 70, by = 95, bw = 430, bh = 315;
  ctx.save();
  ctx.fillStyle = p.bgPanel;
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);

  // Compuerta central
  ctx.strokeStyle = abierta ? p.green : p.accent;
  ctx.lineWidth = 4;
  if (!abierta) {
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by + bh);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by + 45);
    ctx.moveTo(bx + bw / 2, by + bh - 45); ctx.lineTo(bx + bw / 2, by + bh);
    ctx.stroke();
  }

  let enDer = 0;
  for (let i = 0; i < nPart; i++) {
    const seedX = ((i * 73) % 100) / 100;
    const seedY = ((i * 41) % 100) / 100;
    const cruza = (i % 2 === 0 || C > 1.2) && (seedX < mezcla);
    const zonaW = cruza ? bw - 26 : bw / 2 - 22;
    const rawX = Math.abs(((seedX * zonaW + Math.sin(i + 1) * vel * 55 * tm) % (2 * zonaW) + 2 * zonaW) % (2 * zonaW));
    const px = bx + 12 + (rawX > zonaW ? 2 * zonaW - rawX : rawX);
    const py = by + 14 + (((seedY * (bh - 28) + Math.cos(i * 2) * vel * 55 * tm) % (bh - 28) + (bh - 28)) % (bh - 28));
    if (px > bx + bw / 2) enDer++;
    ctx.fillStyle = i % 2 === 0 ? p.cyan : p.purple;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Gráfica de Entropía S(t) a la derecha
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 9, 0, 1.15, p, {
    padL: 555, padR: 26, padT: 95, padB: 105, labelX: "Tiempo", labelY: "Entropía S", stepY: 0.25
  });
  const entFn = (x) => (x < 1.2 ? 0.08 : 0.08 + 0.92 * (1 - Math.exp(-(x - 1.2) * vel * 0.65)));
  dibujarCurva(ctx, entFn, 0, 9, toX, toY, p.gold, 3.2);
  dibujarPunto(ctx, toX(tm), toY(entFn(tm)), 7.5, p.gold);

  dibujarHUD(ctx, 24, 16, [
    abierta ? "Compuerta ABIERTA: el gas se desordena" : "Compuerta CERRADA: orden inicial",
    `Izquierda: ${nPart - enDer} | Derecha: ${enDer}`,
    `Entropía relativa S = ${fmt(entFn(tm) * 100, 0)}%`
  ], p);
}

/* --- NIVEL AVANZADO (11 TEMAS) --- */

// Estado persistente para el péndulo doble caótico (integración RK4 real)
const estadoPenduloDoble = {
  th1: 2.1, th2: 2.4, w1: 0, w2: 0,
  trail: [], lastParams: ""
};

// 49. Mecánica Analítica: Péndulo Doble Caótico
function dibujarPenduloDoble(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const m1 = A, m2 = B, g = C;
  const L1 = 125, L2 = 120;
  const key = `${m1.toFixed(1)}-${m2.toFixed(1)}-${g.toFixed(1)}`;
  if (estadoPenduloDoble.lastParams !== key) {
    estadoPenduloDoble.th1 = 2.05;
    estadoPenduloDoble.th2 = 2.55;
    estadoPenduloDoble.w1 = 0;
    estadoPenduloDoble.w2 = 0;
    estadoPenduloDoble.trail = [];
    estadoPenduloDoble.lastParams = key;
  }

  // Solo avanzamos la física si la animación está corriendo
  if (appState.animando) {
    const dt = 0.032;
    const deriv = (th1, th2, w1, w2) => {
      const del = th1 - th2;
      const den = 2 * m1 + m2 - m2 * Math.cos(2 * del);
      const a1 = (-g * (2 * m1 + m2) * Math.sin(th1) - m2 * g * Math.sin(th1 - 2 * th2) - 2 * Math.sin(del) * m2 * (w2 * w2 * 1.2 + w1 * w1 * 1.25 * Math.cos(del))) / (1.25 * den);
      const a2 = (2 * Math.sin(del) * (w1 * w1 * 1.25 * (m1 + m2) + g * (m1 + m2) * Math.cos(th1) + w2 * w2 * 1.2 * m2 * Math.cos(del))) / (1.2 * den);
      return [w1, w2, a1, a2];
    };
    const s = estadoPenduloDoble;
    const k1 = deriv(s.th1, s.th2, s.w1, s.w2);
    const k2 = deriv(s.th1 + k1[0] * dt / 2, s.th2 + k1[1] * dt / 2, s.w1 + k1[2] * dt / 2, s.w2 + k1[3] * dt / 2);
    const k3 = deriv(s.th1 + k2[0] * dt / 2, s.th2 + k2[1] * dt / 2, s.w1 + k2[2] * dt / 2, s.w2 + k2[3] * dt / 2);
    const k4 = deriv(s.th1 + k3[0] * dt, s.th2 + k3[1] * dt, s.w1 + k3[2] * dt, s.w2 + k3[3] * dt);
    s.th1 += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    s.th2 += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    s.w1 += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    s.w2 += (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
    s.w1 *= 0.9998; s.w2 *= 0.9998;
  }

  const ox = W * 0.5, oy = 185;
  const x1 = ox + L1 * Math.sin(estadoPenduloDoble.th1);
  const y1 = oy + L1 * Math.cos(estadoPenduloDoble.th1);
  const x2 = x1 + L2 * Math.sin(estadoPenduloDoble.th2);
  const y2 = y1 + L2 * Math.cos(estadoPenduloDoble.th2);

  if (appState.animando) {
    estadoPenduloDoble.trail.push([x2, y2]);
    if (estadoPenduloDoble.trail.length > 260) estadoPenduloDoble.trail.shift();
  }

  // Estela caótica luminosa
  ctx.save();
  for (let i = 1; i < estadoPenduloDoble.trail.length; i++) {
    const alpha = i / estadoPenduloDoble.trail.length;
    ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.85})`;
    ctx.lineWidth = 1.5 + alpha * 2;
    ctx.beginPath();
    ctx.moveTo(estadoPenduloDoble.trail[i - 1][0], estadoPenduloDoble.trail[i - 1][1]);
    ctx.lineTo(estadoPenduloDoble.trail[i][0], estadoPenduloDoble.trail[i][1]);
    ctx.stroke();
  }

  ctx.strokeStyle = p.text;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(ox, oy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();

  dibujarPunto(ctx, ox, oy, 6, p.gold, false);
  dibujarPunto(ctx, x1, y1, 10 + m1 * 2, p.purple);
  dibujarPunto(ctx, x2, y2, 10 + m2 * 2, p.accent);
  dibujarHUD(ctx, 24, 16, [`Sistema caótico determinista (RK4)`, `m1 = ${fmt(m1, 1)} kg | m2 = ${fmt(m2, 1)} kg`, `Pequeños cambios → trayectorias únicas`], p);
}

// 50. Mecánica Analítica: Lagrangiana (L = T - V) y Principio de Mínima Acción
function dibujarLagrangiana(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const amp = A, k = B, perturb = C;
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 6.28, -4.5, 4.5, p, { labelX: "Tiempo t", labelY: "Posición / L(t)" });

  const xReal = (s) => amp * Math.sin(s * Math.sqrt(k));
  const xFalsa = (s) => xReal(s) + perturb * Math.sin(s * 0.5) * Math.sin(s);
  const lagrangiana = (s) => {
    const v = amp * Math.sqrt(k) * Math.cos(s * Math.sqrt(k));
    const T = 0.5 * v * v;
    const V = 0.5 * k * Math.pow(xReal(s), 2);
    return Math.max(-4.3, Math.min(4.3, (T - V) * 0.45));
  };

  dibujarCurva(ctx, xFalsa, 0, 6.28, toX, toY, p.muted, 2.2);
  dibujarCurva(ctx, xReal, 0, 6.28, toX, toY, p.cyan, 3.4);
  dibujarCurva(ctx, lagrangiana, 0, 6.28, toX, toY, p.gold, 2.6);

  const tm = (t * 1.4) % 6.28;
  dibujarPunto(ctx, toX(tm), toY(xReal(tm)), 8, p.cyan);
  dibujarPunto(ctx, toX(tm), toY(lagrangiana(tm)), 7, p.gold);
  dibujarHUD(ctx, 64, 16, [`Cian: Trayectoria real (Acción mínima)`, `Gris: Ruta perturbada (Mayor acción)`, `Dorado: L = T − V en vivo`], p);
}

// 51. Física Cuántica: Partícula en una Caja 1D
function dibujarParticulaCaja(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const n = Math.max(1, Math.round(A)), L = B, vel = C;
  const { toX, toY, padT, ph } = dibujarPlano(ctx, W, H, 0, L, -1.6, 1.8, p, { labelX: "Posición en la caja x", labelY: "ψ(x) y |ψ|²" });

  // Paredes infinitas de potencial
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(toX(0), padT); ctx.lineTo(toX(0), padT + ph);
  ctx.moveTo(toX(L), padT); ctx.lineTo(toX(L), padT + ph);
  ctx.stroke();

  // Densidad de probabilidad |ψ|²
  const prob = (x) => Math.pow(Math.sin((n * Math.PI * x) / L), 2) * 1.35;
  ctx.fillStyle = p.purpleSoft;
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(0));
  for (let i = 0; i <= 180; i++) {
    const x = (i / 180) * L;
    ctx.lineTo(toX(x), toY(prob(x)));
  }
  ctx.lineTo(toX(L), toY(0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const psi = (x) => Math.sin((n * Math.PI * x) / L) * Math.cos(t * n * vel * 1.3);
  dibujarCurva(ctx, prob, 0, L, toX, toY, p.purple, 2.8);
  dibujarCurva(ctx, psi, 0, L, toX, toY, p.cyan, 3.4);

  // Destellos probabilísticos donde es más probable medir la partícula
  for (let k = 0; k < n; k++) {
    const peakX = ((k + 0.5) / n) * L + Math.sin(t * 7 + k * 3) * (L / (n * 5));
    dibujarPunto(ctx, toX(peakX), toY(prob(peakX) * 0.5), 5.5, p.gold);
  }
  dibujarHUD(ctx, 64, 16, [`Nivel cuántico n = ${n}`, `Energía Eₙ ∝ n²/L² = ${fmt((n * n) / (L * L), 2)}`, `Morado: Probabilidad |ψ|² | Cian: Onda ψ`], p);
}

// 52. Física Cuántica: Efecto Túnel
function dibujarEfectoTunel(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const E = A, Vbar = B, ancho = C;
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, -1.6, 2.4, p, { labelX: "Posición x", labelY: "Amplitud / Barrera" });
  const x1 = 4.6, x2 = 4.6 + ancho;

  // Barrera de potencial
  ctx.save();
  ctx.fillStyle = "rgba(255, 118, 117, 0.22)";
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2.4;
  const bh = Math.min(2.2, Vbar * 0.35);
  ctx.fillRect(toX(x1), toY(bh), toX(x2) - toX(x1), toY(0) - toY(bh));
  ctx.strokeRect(toX(x1), toY(bh), toX(x2) - toX(x1), toY(0) - toY(bh));
  ctx.restore();

  // Transmisión cuántica aproximada exp(-2 * kappa * ancho)
  const kappa = Vbar > E ? Math.sqrt(Vbar - E) * 0.72 : 0.1;
  const Tprob = Math.exp(-2 * kappa * ancho);

  const wave = (x) => {
    const k = 3.2 * Math.sqrt(Math.max(0.5, E));
    if (x < x1) {
      const inc = Math.sin(k * x - t * 4.5);
      const ref = (1 - Tprob) * 0.75 * Math.sin(-k * x - t * 4.5);
      return (inc + ref) * 0.68;
    } else if (x <= x2) {
      return 0.68 * Math.exp(-kappa * (x - x1)) * Math.sin(k * x1 - t * 4.5);
    } else {
      return 0.68 * Math.sqrt(Tprob) * Math.sin(k * x - t * 4.5);
    }
  };

  dibujarCurva(ctx, wave, 0, 10, toX, toY, p.cyan, 3.3, 360);
  dibujarHUD(ctx, 64, 16, [`Energía E = ${fmt(E, 1)} | Barrera V = ${fmt(Vbar, 1)}`, `Probabilidad de cruzar (Túnel) ≈ ${fmt(Tprob * 100, 1)}%`], p);
}

// 53. Física Cuántica: Dualidad Onda-Partícula (Doble Rendija)
function dibujarDualidad(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const dRendija = A * 38, lambda = B * 24, vel = C;
  const slitX = 240, screenX = W - 165, midY = H * 0.52;
  const s1Y = midY - dRendija, s2Y = midY + dRendija;

  ctx.save();
  // Onda plana incidente a la izquierda
  ctx.strokeStyle = p.purple + "aa";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const wx = 40 + ((i * lambda + t * 45 * vel) % (slitX - 45));
    ctx.beginPath();
    ctx.moveTo(wx, 70); ctx.lineTo(wx, H - 55);
    ctx.stroke();
  }

  // Frentes circulares saliendo de ambas rendijas
  ctx.strokeStyle = p.cyan + "66";
  for (let r = (t * 45 * vel) % lambda; r < screenX - slitX; r += lambda) {
    ctx.beginPath(); ctx.arc(slitX, s1Y, r, -Math.PI * 0.45, Math.PI * 0.45); ctx.stroke();
    ctx.beginPath(); ctx.arc(slitX, s2Y, r, -Math.PI * 0.45, Math.PI * 0.45); ctx.stroke();
  }

  // Pared de doble rendija
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(slitX, 55); ctx.lineTo(slitX, s1Y - 11);
  ctx.moveTo(slitX, s1Y + 11); ctx.lineTo(slitX, s2Y - 11);
  ctx.moveTo(slitX, s2Y + 11); ctx.lineTo(slitX, H - 45);
  ctx.stroke();

  // Pantalla de interferencia a la derecha + impactos de fotones
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = 60; y <= H - 50; y += 3) {
    const diff = Math.hypot(screenX - slitX, y - s1Y) - Math.hypot(screenX - slitX, y - s2Y);
    const inten = Math.pow(Math.cos((Math.PI * diff) / lambda), 2);
    const px = screenX + inten * 95;
    if (y === 60) ctx.moveTo(px, y); else ctx.lineTo(px, y);
  }
  ctx.stroke();

  // Fotones individuales detectados en la pantalla
  for (let i = 0; i < 28; i++) {
    const y = 75 + ((i * 59 + Math.floor(t * 2) * 17) % (H - 135));
    const diff = Math.hypot(screenX - slitX, y - s1Y) - Math.hypot(screenX - slitX, y - s2Y);
    const inten = Math.pow(Math.cos((Math.PI * diff) / lambda), 2);
    if (inten > 0.4) {
      dibujarPunto(ctx, screenX - 4, y, 3.2, p.gold, false);
    }
  }
  ctx.restore();
  dibujarHUD(ctx, 24, 16, [`Viaja como ONDA (interferencia)`, `Llega como PARTÍCULA (puntos dorados)`], p);
}

// 54. Física Estadística: Distribución de Maxwell-Boltzmann
function dibujarMaxwellBoltzmann(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const T = A, masa = B, nMol = Math.round(C);
  const aScale = Math.max(0.3, T / (masa * 220));

  // Gráfica f(v) a la izquierda
  const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, 0, 0.72, p, {
    padL: 58, padR: 300, padT: 48, padB: 48, labelX: "Rapidez v", labelY: "f(v)", stepY: 0.2
  });
  const mb = (v) => 1.65 * Math.pow(1 / aScale, 1.5) * v * v * Math.exp(-(v * v) / (2 * aScale));
  dibujarCurva(ctx, mb, 0, 10, toX, toY, p.cyan, 3.4);

  const vPeak = Math.sqrt(2 * aScale);
  if (vPeak < 9.8) dibujarPunto(ctx, toX(vPeak), toY(mb(vPeak)), 7.5, p.gold);

  // Caja de moléculas a la derecha con colores según rapidez
  const bx = W - 270, by = 78, bw = 240, bh = 365;
  ctx.save();
  ctx.fillStyle = p.bgPanel;
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(bx, by, bw, bh);

  for (let i = 0; i < nMol; i++) {
    const speedFactor = 0.4 + ((i % 7) / 6) * Math.sqrt(aScale) * 1.4;
    const vx = Math.cos(i * 2.1) * speedFactor * 65;
    const vy = Math.sin(i * 3.7) * speedFactor * 65;
    const wB = bw - 18, hB = bh - 18;
    const rx = Math.abs(((i * 43 + vx * t) % (2 * wB) + 2 * wB) % (2 * wB));
    const ry = Math.abs(((i * 29 + vy * t) % (2 * hB) + 2 * hB) % (2 * hB));
    const px = bx + 9 + (rx > wB ? 2 * wB - rx : rx);
    const py = by + 9 + (ry > hB ? 2 * hB - ry : ry);
    ctx.fillStyle = speedFactor > 1.7 ? p.accent : (speedFactor > 1.0 ? p.gold : p.blue);
    ctx.beginPath();
    ctx.arc(px, py, 4.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  dibujarHUD(ctx, 64, 16, [`Temp = ${fmt(T, 0)} K | Masa = ${fmt(masa, 1)} u`, `Rapidez más probable v_p = ${fmt(vPeak, 2)}`, `Azul: lentas | Rojo: muy rápidas`], p);
}

// 55. Óptica: Lente Convergente y Divergente
function dibujarLentesOptica(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const f = Math.abs(A) < 0.4 ? (A >= 0 ? 0.4 : -0.4) : A;
  const doObj = B, hObj = C;
  const lx = W * 0.5, axisY = H * 0.55, sc = 56;

  // Ecuación de lentes delgadas: 1/di = 1/f - 1/do
  const invDi = (1 / f) - (1 / doObj);
  const di = Math.abs(invDi) < 0.02 ? 99 : 1 / invDi;
  const m = -di / doObj;
  const hImg = hObj * m;

  ctx.save();
  // Eje óptico
  ctx.strokeStyle = p.axis;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(40, axisY); ctx.lineTo(W - 40, axisY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dibujo de la lente (biconvexa si f>0, bicóncava si f<0)
  ctx.fillStyle = p.cyanSoft;
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (f > 0) {
    ctx.moveTo(lx, axisY - 155);
    ctx.quadraticCurveTo(lx + 32, axisY, lx, axisY + 155);
    ctx.quadraticCurveTo(lx - 32, axisY, lx, axisY - 155);
  } else {
    ctx.moveTo(lx - 24, axisY - 155);
    ctx.quadraticCurveTo(lx - 4, axisY, lx - 24, axisY + 155);
    ctx.lineTo(lx + 24, axisY + 155);
    ctx.quadraticCurveTo(lx + 4, axisY, lx + 24, axisY - 155);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  // Focos F y F'
  dibujarPunto(ctx, lx - Math.abs(f) * sc, axisY, 5.5, p.gold, false);
  dibujarPunto(ctx, lx + Math.abs(f) * sc, axisY, 5.5, p.gold, false);

  // Objeto (flecha morada)
  const ox = lx - doObj * sc, oy = axisY - hObj * sc;
  dibujarFlecha(ctx, ox, axisY, ox, oy, p.purple, 4, "Objeto");

  // Rayos luminosos animados
  const ix = lx + di * sc, iy = axisY - hImg * sc;
  const drawRay = (x1, y1, x2, y2, x3, y3, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.stroke();
    // Fotón animado viajando a lo largo del rayo
    const u = (t * 0.7) % 1;
    const px = u < 0.5 ? x1 + (x2 - x1) * (u * 2) : x2 + (x3 - x2) * ((u - 0.5) * 2);
    const py = u < 0.5 ? y1 + (y2 - y1) * (u * 2) : y2 + (y3 - y2) * ((u - 0.5) * 2);
    dibujarPunto(ctx, px, py, 4.5, col, false);
  };

  if (Math.abs(di) < 12) {
    drawRay(ox, oy, lx, oy, ix, iy, p.gold);
    drawRay(ox, oy, lx, axisY, ix, iy, p.accent);
    // Imagen formada
    if (ix > 40 && ix < W - 40) {
      dibujarFlecha(ctx, ix, axisY, ix, Math.max(45, Math.min(H - 35, iy)), di > 0 ? p.green : p.pink, 4, di > 0 ? "Imagen Real" : "Virtual");
    }
  }
  ctx.restore();

  dibujarHUD(ctx, 24, 16, [
    f > 0 ? `Lente CONVERGENTE (f = +${fmt(f, 1)})` : `Lente DIVERGENTE (f = ${fmt(f, 1)})`,
    `Aumento M = ${fmt(m, 2)}x (${di > 0 ? "Real e invertida" : "Virtual y derecha"})`
  ], p);
}

// 56. Óptica: Difracción por una Rendija
function dibujarDifraccion(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const anchoA = A, lambda = B, vel = C;
  const slitX = 210, screenX = 465, midY = H * 0.52;
  const gapPx = anchoA * 22;

  ctx.save();
  // Onda incidente
  ctx.strokeStyle = p.cyan + "aa";
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 6; i++) {
    const wx = 35 + ((i * lambda * 28 + t * 50 * vel) % (slitX - 40));
    ctx.beginPath(); ctx.moveTo(wx, 75); ctx.lineTo(wx, H - 55); ctx.stroke();
  }
  // Frentes difractados
  ctx.strokeStyle = p.purple + "88";
  for (let r = (t * 50 * vel) % (lambda * 28); r < screenX - slitX; r += lambda * 28) {
    ctx.beginPath();
    ctx.arc(slitX, midY, r, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
  }
  // Barrera con abertura
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(slitX, 55); ctx.lineTo(slitX, midY - gapPx);
  ctx.moveTo(slitX, midY + gapPx); ctx.lineTo(slitX, H - 45);
  ctx.stroke();

  // Patrón de intensidad sinc²(β) a la derecha
  ctx.fillStyle = p.cyanSoft;
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX, 60);
  for (let y = 60; y <= H - 50; y += 2) {
    const theta = (y - midY) / 210;
    const beta = (Math.PI * anchoA * 2.4 * Math.sin(theta)) / Math.max(0.25, lambda);
    const inten = Math.abs(beta) < 0.001 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
    ctx.lineTo(screenX + inten * 320, y);
  }
  ctx.lineTo(screenX, H - 50);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  dibujarHUD(ctx, 24, 16, [`Abertura a = ${fmt(anchoA, 1)} | λ = ${fmt(lambda, 1)}`, `Más estrecha la rendija → ¡más se abre la luz!`], p);
}

// 57. Estado Sólido: Red Cristalina Vibrando (Fonones)
function dibujarRedCristalina(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const amp = A * 14, freq = B * 2.6, kWave = C * 0.7;
  const cols = 10, rows = 6;
  const startX = 115, startY = 105, gapX = 72, gapY = 66;

  const pos = [];
  for (let r = 0; r < rows; r++) {
    pos[r] = [];
    for (let c = 0; c < cols; c++) {
      const phase = c * kWave + r * 0.45 - t * freq;
      const dx = Math.sin(phase) * amp;
      const dy = Math.cos(phase * 0.85) * amp * 0.55;
      pos[r][c] = [startX + c * gapX + dx, startY + r * gapY + dy, Math.sin(phase)];
    }
  }

  ctx.save();
  // Enlaces / resortes entre átomos
  ctx.strokeStyle = p.purple + "88";
  ctx.lineWidth = 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y] = pos[r][c];
      if (c + 1 < cols) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(pos[r][c + 1][0], pos[r][c + 1][1]); ctx.stroke();
      }
      if (r + 1 < rows) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(pos[r + 1][c][0], pos[r + 1][c][1]); ctx.stroke();
      }
    }
  }
  ctx.restore();

  // Átomos vibrando
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y, sVal] = pos[r][c];
      dibujarPunto(ctx, x, y, 8.5, sVal > 0 ? p.cyan : p.accent, false);
    }
  }
  dibujarHUD(ctx, 24, 16, [`Red cristalina 2D (Fonones)`, `Amplitud térmica = ${fmt(A, 1)} | Frecuencia = ${fmt(B, 1)}`], p);
}

// 58. Astrofísica: Órbitas Planetarias (Leyes de Kepler)
function dibujarOrbitasKepler(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const a = A * 62, e = Math.min(0.75, B), speed = C;
  const b = a * Math.sqrt(1 - e * e);
  const cx = W * 0.52, cy = H * 0.54;
  const fDist = a * e;
  const sunX = cx - fDist, sunY = cy;

  // Resolver anomalía excéntrica aproximada para respetar 2ª Ley de Kepler (más rápido en perihelio)
  const M = (t * speed * 1.15) % (Math.PI * 2);
  let E = M;
  for (let i = 0; i < 4; i++) E = M + e * Math.sin(E);
  const px = cx + a * Math.cos(E);
  const py = cy + b * Math.sin(E);

  ctx.save();
  // Sector barrido recientemente (2ª Ley de Kepler)
  ctx.fillStyle = p.purpleSoft;
  ctx.beginPath();
  ctx.moveTo(sunX, sunY);
  for (let i = 0; i <= 18; i++) {
    const Mi = M - (i / 18) * 0.45;
    let Ei = Mi;
    for (let j = 0; j < 3; j++) Ei = Mi + e * Math.sin(Ei);
    ctx.lineTo(cx + a * Math.cos(Ei), cy + b * Math.sin(Ei));
  }
  ctx.closePath();
  ctx.fill();

  // Órbita elíptica
  ctx.strokeStyle = p.cyan + "aa";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Sol con brillo
  const glow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 44);
  glow.addColorStop(0, "#ffe066");
  glow.addColorStop(1, "rgba(255, 224, 102, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(sunX, sunY, 44, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  dibujarPunto(ctx, sunX, sunY, 16, p.gold, false);
  dibujarPunto(ctx, px, py, 11, p.blue);

  const dist = Math.hypot(px - sunX, py - sunY) / 62;
  const vRel = Math.sqrt(Math.max(0.2, (2 / dist) - (1 / A)));
  dibujarHUD(ctx, 24, 16, [`Excentricidad e = ${fmt(e, 2)}`, `Distancia al Sol r = ${fmt(dist, 2)} UA`, `Rapidez orbital ∝ ${fmt(vRel, 2)} (Más rápido cerca del Sol)`], p);
}

// 59. Astrofísica: Expansión del Universo (Ley de Hubble)
function dibujarExpansionUniverso(ctx, W, H, t, A, B, C, p) {
  limpiarCanvas(ctx, W, H, p);
  const H0 = A, escalaMax = B, nGal = Math.round(C);
  const factor = 1 + ((t * H0 * 0.35) % escalaMax);
  const cx = W * 0.5, cy = H * 0.54;

  // Rejilla del espacio-tiempo expandiéndose
  ctx.save();
  ctx.strokeStyle = p.purple + "44";
  ctx.lineWidth = 1.2;
  const paso = 36 * factor;
  for (let x = cx % paso; x < W; x += paso) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = cy % paso; y < H; y += paso) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // Galaxia central (Observador: Vía Láctea)
  dibujarPunto(ctx, cx, cy, 9, p.cyan);

  // Galaxias alejándose con corrimiento al rojo proporcional a la distancia
  for (let i = 1; i <= nGal; i++) {
    const ang = i * 2.39996; // ángulo áureo
    const r0 = 26 + (i / nGal) * 105;
    const rAct = r0 * factor;
    const gx = cx + rAct * Math.cos(ang);
    const gy = cy + rAct * Math.sin(ang);
    if (gx < 10 || gx > W - 10 || gy < 10 || gy > H - 10) continue;

    const redshift = Math.min(1, rAct / 340);
    const col = `rgb(${Math.round(80 + 175 * redshift)}, ${Math.round(210 - 135 * redshift)}, ${Math.round(255 - 185 * redshift)})`;
    // Pequeña espiral galáctica
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(ang + t * 0.5);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (i % 4 === 0) {
      const vLen = Math.min(48, (rAct / 300) * H0 * 24);
      dibujarFlecha(ctx, gx, gy, gx + vLen * Math.cos(ang), gy + vLen * Math.sin(ang), col, 1.8);
    }
  }
  dibujarHUD(ctx, 24, 16, [`Factor de escala a(t) = ${fmt(factor, 2)}x`, `Ley de Hubble: v = H₀ · d`, `Más lejos → más rápido y más rojo (Redshift)`], p);
}


// ==========================================================================
// 4. CATÁLOGO COMPLETO DE LOS 59 TEMAS (32 MATEMÁTICAS + 27 FÍSICA)
// ==========================================================================

const TEMAS = [
  // -------------------- MATEMÁTICAS: NIVEL BÁSICO (13) --------------------
  {
    id: "mat_lineal", materia: "matematicas", nivel: "basico", categoria: "Álgebra Avanzada",
    titulo: "Función Lineal (La Recta)", gancho: "Crecimiento constante paso a paso.",
    sliders: [
      { label: "A · Pendiente (m)", min: -3, max: 3, step: 0.1, val: 1.2 },
      { label: "B · Altura inicial (b)", min: -5, max: 5, step: 0.2, val: 1.0 },
      { label: "C · Velocidad del punto", min: 0.2, max: 3, step: 0.2, val: 1.0 }
    ],
    formula: (A, B) => `y = ${fmt(A, 1)}x${fmtSign(B, 1)}`,
    explicacion: "Es una relación completamente pareja: cada vez que avanzas lo mismo en X, subes o bajas exactamente la misma cantidad en Y.",
    ejemplo: "Un taxi que cobra tarifa base (B) más un precio fijo por cada kilómetro recorrido (A).",
    lectura: (A, B) => A > 0 ? `Sube ${fmt(A, 1)} unidades por cada paso a la derecha y cruza el eje Y en ${fmt(B, 1)}.` : (A < 0 ? `Baja ${fmt(Math.abs(A), 1)} unidades por cada paso a la derecha.` : `Es totalmente horizontal (pendiente cero) en altura ${fmt(B, 1)}.`),
    draw: dibujarLineal
  },
  {
    id: "mat_cuadratica", materia: "matematicas", nivel: "basico", categoria: "Álgebra Avanzada",
    titulo: "Función Cuadrática (Parábola)", gancho: "La curva de un balón en el aire.",
    sliders: [
      { label: "A · Apertura (a)", min: -2.5, max: 2.5, step: 0.1, val: 0.8 },
      { label: "B · Desplazamiento (b)", min: -4, max: 4, step: 0.2, val: 0.0 },
      { label: "C · Altura inicial (c)", min: -5, max: 5, step: 0.2, val: -2.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)}x²${fmtSign(B, 1)}x${fmtSign(C, 1)}`,
    explicacion: "El término x² hace que la curva se doble formando una 'U' o un arco. Mientras más grande sea A, más cerrada y empinada es la curva.",
    ejemplo: "El vuelo de un balón de fútbol, un chorro de agua en una fuente o la forma de una antena parabólica.",
    lectura: (A) => Math.abs(A) > 1.4 ? "Con un valor grande de A, la parábola se vuelve muy angosta y empinada." : "Con un valor pequeño de A, la parábola se abre suavemente como un plato ancho.",
    draw: dibujarCuadratica
  },
  {
    id: "mat_cubica", materia: "matematicas", nivel: "basico", categoria: "Álgebra Avanzada",
    titulo: "Función Cúbica", gancho: "Curvas en forma de S con doble giro.",
    sliders: [
      { label: "A · Coeficiente cúbico (a)", min: -1.2, max: 1.2, step: 0.1, val: 0.4 },
      { label: "B · Término lineal (b)", min: -4, max: 4, step: 0.2, val: -2.0 },
      { label: "C · Altura central (c)", min: -4, max: 4, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)}x³${fmtSign(B, 1)}x${fmtSign(C, 1)}`,
    explicacion: "A diferencia de la parábola, elevar al cubo conserva el signo negativo: un extremo sube y el otro baja formando una elegante 'S'.",
    ejemplo: "Diseño de montañas rusas, curvas suaves de carreteras y modelado 3D en videojuegos.",
    lectura: (A, B) => (A * B < 0) ? "Como A y B tienen signos opuestos, aparecen una colina y un valle muy marcados." : "Al tener el mismo signo, la curva crece o decrece sin formar crestas intermedias.",
    draw: dibujarCubica
  },
  {
    id: "mat_trig_seno", materia: "matematicas", nivel: "basico", categoria: "Trigonometría",
    titulo: "Seno con Círculo Unitario", gancho: "Un punto girando crea una nota musical.",
    sliders: [
      { label: "A · Amplitud (volumen)", min: 0.5, max: 2.2, step: 0.1, val: 1.5 },
      { label: "B · Frecuencia (velocidad)", min: 0.4, max: 3.5, step: 0.1, val: 1.4 },
      { label: "C · Desfase inicial", min: 0, max: 6.2, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)} · sen(${fmt(B, 1)}t${fmtSign(C, 1)})`,
    explicacion: "La onda seno es simplemente la altura vertical (Y) de un punto que da vueltas alrededor de un círculo a velocidad constante.",
    ejemplo: "El sonido puro de una flauta o un diapasón, las olas del mar y la corriente alterna en tu casa.",
    lectura: (A, B) => `Amplitud ${fmt(A, 1)} (altura de la ola) y frecuencia ${fmt(B, 1)} rad/s (${B > 2 ? "tono más agudo/rápido" : "tono grave/relajado"}).`,
    draw: dibujarSenoCirculo
  },
  {
    id: "mat_trig_coseno", materia: "matematicas", nivel: "basico", categoria: "Trigonometría",
    titulo: "Coseno con Círculo Unitario", gancho: "La sombra horizontal de un giro.",
    sliders: [
      { label: "A · Amplitud", min: 0.5, max: 2.2, step: 0.1, val: 1.5 },
      { label: "B · Frecuencia angular", min: 0.4, max: 3.5, step: 0.1, val: 1.3 },
      { label: "C · Desfase", min: 0, max: 6.2, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)} · cos(${fmt(B, 1)}t${fmtSign(C, 1)})`,
    explicacion: "El coseno es hermano gemelo del seno, pero mide la posición horizontal (X) del punto en el círculo. Por eso empieza arriba en su punto máximo.",
    ejemplo: "El movimiento de un pistón de motor visto desde arriba o el vaivén de un columpio soltado desde lo alto.",
    lectura: (A, B) => `Oscila entre +${fmt(A, 1)} y -${fmt(A, 1)} completando un ciclo cada ${fmt((2 * Math.PI) / B, 2)} segundos.`,
    draw: dibujarCosenoCirculo
  },
  {
    id: "mat_trig_tangente", materia: "matematicas", nivel: "basico", categoria: "Trigonometría",
    titulo: "Tangente y Asíntotas", gancho: "Cuando la pendiente se dispara al infinito.",
    sliders: [
      { label: "A · Escala vertical", min: 0.4, max: 2.5, step: 0.1, val: 1.0 },
      { label: "B · Frecuencia", min: 0.4, max: 2.2, step: 0.1, val: 0.8 },
      { label: "C · Desfase", min: -2, max: 2, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)} · tan(${fmt(B, 1)}x${fmtSign(C, 1)})`,
    explicacion: "La tangente divide seno entre coseno. Cada vez que el coseno vale cero, intentas dividir entre cero y la curva se dispara hacia el infinito (las líneas rojas punteadas).",
    ejemplo: "Calcular la altura de un edificio o árbol midiendo su sombra y el ángulo del sol.",
    lectura: (A, B) => `Aparecen paredes invisibles (asíntotas) cada ${fmt(Math.PI / B, 2)} unidades en X.`,
    draw: dibujarTangente
  },
  {
    id: "mat_geo_recta", materia: "matematicas", nivel: "basico", categoria: "Geometría Analítica",
    titulo: "Recta: Distancia y Pendiente", gancho: "El camino más corto entre dos puntos.",
    sliders: [
      { label: "A · Inclinación", min: -1.5, max: 1.5, step: 0.1, val: 0.7 },
      { label: "B · Altura punto P1", min: -3, max: 3, step: 0.2, val: -1.0 },
      { label: "C · Fase de recorrido", min: 0, max: 6.2, step: 0.2, val: 0.0 }
    ],
    formula: (A, B) => `y - (${fmt(B, 1)}) = ${fmt(A * 0.5, 2)}·(x + 4)`,
    explicacion: "En geometría analítica dos puntos definen una única recta. El teorema de Pitágoras nos da la distancia exacta entre ellos.",
    ejemplo: "Trazar una ruta directa en un GPS o calcular la longitud de un cable tensado entre dos postes.",
    lectura: (A) => `Pendiente calculada m = ${fmt(A * 0.5, 2)}. La línea turquesa recorre continuamente el segmento P1→P2.`,
    draw: dibujarRectaAnalitica
  },
  {
    id: "mat_geo_parabola", materia: "matematicas", nivel: "basico", categoria: "Geometría Analítica",
    titulo: "Parábola con Foco y Directriz", gancho: "El secreto de las antenas parabólicas.",
    sliders: [
      { label: "A · Distancia focal (p)", min: -3, max: 3, step: 0.2, val: 1.6 },
      { label: "B · Centro horizontal (h)", min: -3, max: 3, step: 0.2, val: 0.0 },
      { label: "C · Centro vertical (k)", min: -3, max: 3, step: 0.2, val: -1.0 }
    ],
    formula: (A, B, C) => `(x${fmtSign(-B, 1)})² = ${fmt(4 * (Math.abs(A) < 0.4 ? 0.4 : A), 1)}·(y${fmtSign(-C, 1)})`,
    explicacion: "Todos los puntos de la parábola están exactamente a la misma distancia del punto dorado (Foco) y de la línea roja (Directriz).",
    ejemplo: "Los faros de los autos y antenas satelitales concentran toda la luz o señal justo en el Foco.",
    lectura: (A) => `Foco a ${fmt(Math.abs(A), 1)} unidades del vértice: observa cómo los dos segmentos dorados siempre miden lo mismo.`,
    draw: dibujarParabolaFoco
  },
  {
    id: "mat_geo_circulo", materia: "matematicas", nivel: "basico", categoria: "Geometría Analítica",
    titulo: "Circunferencia en el Plano", gancho: "Todos los puntos a igual distancia del centro.",
    sliders: [
      { label: "A · Radio (r)", min: 1.0, max: 5.0, step: 0.2, val: 3.2 },
      { label: "B · Centro X (h)", min: -3.5, max: 3.5, step: 0.2, val: 0.0 },
      { label: "C · Centro Y (k)", min: -2.5, max: 2.5, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `(x${fmtSign(-B, 1)})² + (y${fmtSign(-C, 1)})² = ${fmt(A * A, 1)}`,
    explicacion: "Un círculo no es más que la aplicación de Pitágoras: cualquier punto cuyo radio al centro sea constante pertenece a la circunferencia.",
    ejemplo: "El área de cobertura de una antena Wi-Fi, una rueda de bicicleta o el radar de un aeropuerto.",
    lectura: (A, B, C) => `Centro en (${fmt(B, 1)}, ${fmt(C, 1)}) con radio ${fmt(A, 1)} y perímetro ${fmt(2 * Math.PI * A, 2)}.`,
    draw: dibujarCirculoAnalitico
  },
  {
    id: "mat_geo_elipse", materia: "matematicas", nivel: "basico", categoria: "Geometría Analítica",
    titulo: "Elipse y sus Dos Focos", gancho: "Un círculo estirado que dibuja órbitas.",
    sliders: [
      { label: "A · Semieje horizontal (a)", min: 1.5, max: 7.5, step: 0.2, val: 5.4 },
      { label: "B · Semieje vertical (b)", min: 1.0, max: 5.2, step: 0.2, val: 3.2 },
      { label: "C · Velocidad orbital", min: 0.2, max: 3.0, step: 0.2, val: 1.0 }
    ],
    formula: (A, B) => `x² / ${fmt(A * A, 1)} + y² / ${fmt(B * B, 1)} = 1`,
    explicacion: "Imagina atar un hilo flojo a dos chinchetas (los focos rojos) y estirarlo con un lápiz: la suma de las dos cuerdas doradas nunca cambia.",
    ejemplo: "Las órbitas de los planetas alrededor del Sol y las galerías de los susurros donde el sonido rebota de un foco al otro.",
    lectura: (A, B) => Math.abs(A - B) < 0.3 ? "Casi es un círculo perfecto porque ambos semiejes miden casi igual." : (A > B ? "Elipse alargada horizontalmente." : "Elipse alargada verticalmente."),
    draw: dibujarElipse
  },
  {
    id: "mat_pre_exponencial", materia: "matematicas", nivel: "basico", categoria: "Precálculo",
    titulo: "Función Exponencial", gancho: "Crecer multiplicando en vez de sumando.",
    sliders: [
      { label: "A · Valor inicial", min: 0.3, max: 3.0, step: 0.1, val: 1.0 },
      { label: "B · Tasa de crecimiento", min: -0.9, max: 0.9, step: 0.05, val: 0.45 },
      { label: "C · Desplazamiento vertical", min: -1.5, max: 3.0, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)} · e^(${fmt(B, 2)}x)${fmtSign(C, 1)}`,
    explicacion: "Al principio parece ir lenta, pero como crece multiplicándose a sí misma, de pronto despega como un cohete (o cae suavemente si B es negativo).",
    ejemplo: "Videos que se vuelven virales, interés compuesto en finanzas o reproducción de bacterias.",
    lectura: (A, B) => B > 0 ? "Tasa positiva: el crecimiento se acelera explosivamente." : "Tasa negativa: decae rápidamente al inicio y luego se acerca a cero sin tocarlo.",
    draw: dibujarExponencial
  },
  {
    id: "mat_pre_logaritmo", materia: "matematicas", nivel: "basico", categoria: "Precálculo",
    titulo: "Función Logarítmica", gancho: "La inversa que doma números gigantes.",
    sliders: [
      { label: "A · Escala vertical", min: -2.5, max: 2.5, step: 0.1, val: 1.6 },
      { label: "B · Factor interno", min: 0.3, max: 3.5, step: 0.1, val: 1.0 },
      { label: "C · Altura base", min: -2.0, max: 2.5, step: 0.2, val: 0.5 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)} · ln(${fmt(B, 1)}x)${fmtSign(C, 1)}`,
    explicacion: "El logaritmo responde: '¿a qué potencia debo elevar para llegar a X?'. Crece rápido al principio y luego avanza muy despacito.",
    ejemplo: "La escala Richter de terremotos, los decibelios del sonido y el pH químico: comprimen rangos enormes en números pequeños.",
    lectura: (A) => A >= 0 ? "Crece indefinidamente, pero cada vez más lento conforme X aumenta." : "Al ser A negativo, la curva se invierte y baja suavemente.",
    draw: dibujarLogaritmo
  },
  {
    id: "mat_pre_abs", materia: "matematicas", nivel: "basico", categoria: "Precálculo",
    titulo: "Función Valor Absoluto", gancho: "Un rebote perfecto en forma de V.",
    sliders: [
      { label: "A · Pendiente de las alas", min: -2.5, max: 2.5, step: 0.1, val: 1.2 },
      { label: "B · Posición del vértice X", min: -4, max: 4, step: 0.2, val: 0.0 },
      { label: "C · Altura del vértice Y", min: -3, max: 4, step: 0.2, val: 0.0 }
    ],
    formula: (A, B, C) => `y = ${fmt(A, 1)} · |x${fmtSign(-B, 1)}|${fmtSign(C, 1)}`,
    explicacion: "El valor absoluto convierte cualquier número negativo en positivo: mide pura distancia sin importar si vas a la izquierda o a la derecha.",
    ejemplo: "El rebote de una bola de billar contra la banda o medir el margen de error respecto a una meta.",
    lectura: (A, B, C) => `El pico de rebote está en (${fmt(B, 1)}, ${fmt(C, 1)}) y ${A >= 0 ? "apunta hacia abajo (forma de V)" : "apunta hacia arriba (forma de techo)"}.`,
    draw: dibujarValorAbsoluto
  },

  // -------------------- MATEMÁTICAS: NIVEL INTERMEDIO (8) --------------------
  {
    id: "mat_derivada", materia: "matematicas", nivel: "intermedio", categoria: "Cálculo Diferencial",
    titulo: "Derivada (Recta Tangente en Movimiento)", gancho: "La inclinación exacta en cada instante.",
    sliders: [
      { label: "A · Amplitud de la curva", min: 0.5, max: 3.0, step: 0.1, val: 2.0 },
      { label: "B · Frecuencia de colinas", min: 0.4, max: 2.0, step: 0.1, val: 0.9 },
      { label: "C · Curvatura extra", min: -1.5, max: 1.5, step: 0.1, val: 0.3 }
    ],
    formula: (A, B, C) => `f(x) = ${fmt(A, 1)}sen(${fmt(B, 1)}x)${fmtSign(C * 0.12, 2)}x²  |  f'(x) = pendiente`,
    explicacion: "La derivada es el 'velocímetro' de una curva: la barra que toca un solo punto muestra qué tan empinada es la subida (verde), bajada (rojo) o cima plana (dorado).",
    ejemplo: "El velocímetro de un coche: aunque tu viaje dure una hora, la derivada te dice tu velocidad exacta justo en este segundo.",
    lectura: (A, B) => `Máxima inclinación aproximada ≈ ±${fmt(A * B, 2)}. Observa que en cada cima o valle la barra se pone horizontal (derivada = 0).`,
    draw: dibujarDerivada
  },
  {
    id: "mat_integral", materia: "matematicas", nivel: "intermedio", categoria: "Cálculo Integral",
    titulo: "Integral (Área con Rectángulos)", gancho: "Sumar rebanadas finitas hasta medir el área.",
    sliders: [
      { label: "A · Onda de la curva", min: 0.0, max: 2.2, step: 0.1, val: 1.2 },
      { label: "B · Inclinación general", min: 0.0, max: 2.5, step: 0.1, val: 1.0 },
      { label: "C · Número de rectángulos (N)", min: 4, max: 45, step: 1, val: 14 }
    ],
    formula: (A, B, C) => `∫ f(x)dx ≈ Σ f(xᵢ)·Δx   (N = ${Math.round(C)} rectángulos)`,
    explicacion: "Como no existe una fórmula geométrica simple para áreas curvas, las partimos en rectángulos delgados. Cuantos más rectángulos usas, más exacta es el área.",
    ejemplo: "Calcular cuánta agua entra a una presa con flujo variable o la distancia total recorrida sumando velocidades.",
    lectura: (A, B, C) => C >= 25 ? `Con ${Math.round(C)} rectángulos finos, los huecos casi desaparecen y el área es muy precisa.` : `Con solo ${Math.round(C)} rectángulos se notan escalones; sube C para refinar el cálculo.`,
    draw: dibujarIntegral
  },
  {
    id: "mat_lin_rotacion", materia: "matematicas", nivel: "intermedio", categoria: "Álgebra Lineal",
    titulo: "Vectores que Rotan (Matriz de Rotación)", gancho: "Cómo giran los gráficos en videojuegos.",
    sliders: [
      { label: "A · Escala (Zoom)", min: 0.5, max: 1.8, step: 0.1, val: 1.1 },
      { label: "B · Velocidad de giro", min: -2.5, max: 2.5, step: 0.1, val: 1.0 },
      { label: "C · Ángulo inicial (°)", min: 0, max: 360, step: 5, val: 20 }
    ],
    formula: (A, B) => `R(θ) = ${fmt(A, 1)} · [[cos θ, -sen θ], [sen θ, cos θ]]  (ω = ${fmt(B, 1)})`,
    explicacion: "Una matriz de rotación toma cada esquina de una figura y la gira suavemente alrededor del origen sin deformarla.",
    ejemplo: "Rotar una foto en tu teléfono, mover la cámara en un videojuego 3D o guiar un brazo robótico.",
    lectura: (A, B) => `Girando ${B >= 0 ? "en sentido antihorario" : "en sentido horario"} con factor de tamaño ${fmt(A, 1)}x.`,
    draw: dibujarRotacionVectores
  },
  {
    id: "mat_lin_matriz", materia: "matematicas", nivel: "intermedio", categoria: "Álgebra Lineal",
    titulo: "Transformación Lineal de Matriz 2×2", gancho: "Estira, inclina y voltea todo el espacio.",
    sliders: [
      { label: "A · Estiramiento en X (m11)", min: -1.8, max: 2.5, step: 0.1, val: 1.6 },
      { label: "B · Cizalla horizontal (m12)", min: -1.8, max: 1.8, step: 0.1, val: 0.8 },
      { label: "C · Cizalla vertical (m21)", min: -1.5, max: 1.5, step: 0.1, val: 0.2 }
    ],
    formula: (A, B, C) => `M = [[${fmt(A, 1)}, ${fmt(B, 1)}], [${fmt(C, 1)}, 1.2]]  |  det(M) = ${fmt(A * 1.2 - B * C, 2)}`,
    explicacion: "Una matriz 2×2 mueve toda la cuadrícula manteniendo las líneas rectas y paralelas. El determinante te dice cuánto creció o se aplastó el área morada.",
    ejemplo: "Efectos de perspectiva en cine, compresión de imágenes y capas de redes neuronales de IA.",
    lectura: (A, B, C) => {
      const det = A * 1.2 - B * C;
      return Math.abs(det) < 0.15 ? "¡Cuidado! Determinante casi cero: el espacio se aplasta en una sola línea." : (det < 0 ? "Determinante negativo: el espacio se volteó como un espejo." : `El área del cuadrado unitario se multiplica por ${fmt(det, 2)}.`);
    },
    draw: dibujarTransformacionMatriz
  },
  {
    id: "mat_lin_comb", materia: "matematicas", nivel: "intermedio", categoria: "Álgebra Lineal",
    titulo: "Combinación Lineal de Vectores", gancho: "Llegar a cualquier punto mezclando dos pasos.",
    sliders: [
      { label: "A · Escalar del vector u", min: -2.2, max: 2.2, step: 0.1, val: 1.4 },
      { label: "B · Escalar del vector v", min: -2.2, max: 2.2, step: 0.1, val: 1.2 },
      { label: "C · Desplazamiento extra", min: -2.0, max: 2.0, step: 0.2, val: 0.0 }
    ],
    formula: (A, B) => `w = (${fmt(A, 1)})·u + (${fmt(B, 1)})·v`,
    explicacion: "Combinar linealmente es como caminar en una ciudad: das A pasos en una avenida (u) y B pasos en otra calle (v) para llegar a tu destino (w).",
    ejemplo: "Mezclar colores RGB en una pantalla o combinar dos fuerzas de viento y motor sobre un avión.",
    lectura: (A, B) => `Mezclando ${fmt(A, 1)} veces u más ${fmt(B, 1)} veces v forma el paralelogramo que apunta a w.`,
    draw: dibujarCombinacionLineal
  },
  {
    id: "mat_edo_poblacion", materia: "matematicas", nivel: "intermedio", categoria: "Ecuaciones Diferenciales (EDO)",
    titulo: "Crecimiento Poblacional Logístico", gancho: "Crecer rápido hasta topar con el límite.",
    sliders: [
      { label: "A · Tasa de reproducción (r)", min: 0.2, max: 1.4, step: 0.05, val: 0.65 },
      { label: "B · Capacidad máxima (K)", min: 40, max: 110, step: 5, val: 90 },
      { label: "C · Población inicial (P0)", min: 4, max: 35, step: 1, val: 8 }
    ],
    formula: (A, B, C) => `dP/dt = ${fmt(A, 2)}·P·(1 - P/${fmt(B, 0)})  |  P(0) = ${fmt(C, 0)}`,
    explicacion: "Al principio sobra comida y espacio, así que la población crece en curva rápida; al acercarse al límite K (línea roja), el crecimiento se frena suavemente.",
    ejemplo: "Peces en un lago, adopción de un nuevo smartphone en el mercado o colonias de bacterias.",
    lectura: (A, B) => `Con tasa r=${fmt(A, 2)}, la colonia se estabilizará en exactamente ${fmt(B, 0)} individuos.`,
    draw: dibujarEdoPoblacion
  },
  {
    id: "mat_edo_enfriamiento", materia: "matematicas", nivel: "intermedio", categoria: "Ecuaciones Diferenciales (EDO)",
    titulo: "Ley de Enfriamiento de Newton", gancho: "Mientras más caliente está, más rápido se enfría.",
    sliders: [
      { label: "A · Temp. inicial (°C)", min: 50, max: 98, step: 1, val: 90 },
      { label: "B · Temp. ambiente (°C)", min: 5, max: 35, step: 1, val: 22 },
      { label: "C · Velocidad enfriamiento (k)", min: 0.05, max: 0.35, step: 0.01, val: 0.15 }
    ],
    formula: (A, B, C) => `T(t) = ${fmt(B, 0)} + (${fmt(A - B, 0)})·e^(-${fmt(C, 2)}t)`,
    explicacion: "La rapidez con que baja la temperatura depende de la diferencia contra el cuarto. Por eso tu bebida baja muy rápido al principio y tarda mucho al final.",
    ejemplo: "Enfriamiento de un café, cálculo forense de tiempo o enfriamiento de piezas metálicas en fábrica.",
    lectura: (A, B, C) => `A los 5 minutos la bebida habrá bajado a ${fmt(B + (A - B) * Math.exp(-C * 5), 1)} °C.`,
    draw: dibujarEdoEnfriamiento
  },
  {
    id: "mat_edo_radiactivo", materia: "matematicas", nivel: "intermedio", categoria: "Ecuaciones Diferenciales (EDO)",
    titulo: "Decaimiento Radiactivo", gancho: "El reloj atómico de la naturaleza.",
    sliders: [
      { label: "A · Átomos iniciales (N0)", min: 40, max: 100, step: 5, val: 100 },
      { label: "B · Constante decaimiento (λ)", min: 0.08, max: 0.55, step: 0.02, val: 0.22 },
      { label: "C · Velocidad del tiempo", min: 0.5, max: 3.0, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `N(t) = ${fmt(A, 0)} · e^(-${fmt(B, 2)}t)  |  t½ = ${fmt(Math.LN2 / B, 2)}`,
    explicacion: "Cada cierto tiempo constante (llamado vida media), exactamente la mitad de los átomos activos se transforman en átomos estables.",
    ejemplo: "Datación por Carbono-14 para saber la edad de fósiles o medicamentos trazadores en hospitales.",
    lectura: (A, B) => `Cada ${fmt(Math.LN2 / B, 2)} unidades de tiempo sobrevive justo el 50% de la muestra anterior.`,
    draw: dibujarEdoRadiactivo
  },

  // -------------------- MATEMÁTICAS: NIVEL AVANZADO (11) --------------------
  {
    id: "mat_edp_onda", materia: "matematicas", nivel: "avanzado", categoria: "Ecuaciones Diferenciales Parciales",
    titulo: "EDP: Ecuación de Onda Viajera", gancho: "Cómo vibra una cuerda de guitarra.",
    sliders: [
      { label: "A · Amplitud de vibración", min: 0.5, max: 2.6, step: 0.1, val: 1.8 },
      { label: "B · Modo armónico (n)", min: 1, max: 5, step: 1, val: 2 },
      { label: "C · Velocidad de onda (c)", min: 0.5, max: 3.0, step: 0.1, val: 1.5 }
    ],
    formula: (A, B, C) => `∂²u/∂t² = (${fmt(C, 1)})² · ∂²u/∂x²   (Modo n = ${Math.round(B)})`,
    explicacion: "A diferencia de una EDO, aquí la altura u cambia tanto en el espacio (x) como en el tiempo (t). La curvatura de la cuerda jala cada punto hacia el centro.",
    ejemplo: "Cuerdas de guitarra y violín, ondas sísmicas en la Tierra y antenas de telecomunicaciones.",
    lectura: (A, B, C) => `Vibrando en el armónico ${Math.round(B)} con rapidez ${fmt(C, 1)}. Más armónicos = sonido más agudo.`,
    draw: dibujarEdpOnda
  },
  {
    id: "mat_edp_calor", materia: "matematicas", nivel: "avanzado", categoria: "Ecuaciones Diferenciales Parciales",
    titulo: "EDP: Ecuación del Calor 1D", gancho: "Cómo se reparte el calor en una barra.",
    sliders: [
      { label: "A · Difusividad térmica (α)", min: 0.1, max: 1.2, step: 0.05, val: 0.45 },
      { label: "B · Calor inicial central", min: 40, max: 95, step: 5, val: 85 },
      { label: "C · Picos secundarios", min: 0, max: 3.0, step: 0.2, val: 1.4 }
    ],
    formula: (A) => `∂u/∂t = ${fmt(A, 2)} · ∂²u/∂x²`,
    explicacion: "El calor siempre fluye de las zonas rojas (calientes) hacia las azules (frías), suavizando los picos bruscos hasta igualar toda la barra.",
    ejemplo: "Una cuchara de metal metida en sopa caliente o el disipador térmico de un procesador de computadora.",
    lectura: (A) => A > 0.7 ? "Difusividad alta (como el cobre): el calor se nivela muy rápido." : "Difusividad moderada: el pico caliente tarda más en esparcirse.",
    draw: dibujarEdpCalor
  },
  {
    id: "mat_compleja_plano", materia: "matematicas", nivel: "avanzado", categoria: "Variable Compleja",
    titulo: "Plano Complejo y Espiral de Euler", gancho: "Los números imaginarios son giros reales.",
    sliders: [
      { label: "A · Módulo |z| (tamaño)", min: 0.6, max: 2.6, step: 0.1, val: 1.6 },
      { label: "B · Velocidad angular ω", min: 0.3, max: 2.5, step: 0.1, val: 1.1 },
      { label: "C · Potencia n (zⁿ)", min: 1, max: 5, step: 1, val: 3 }
    ],
    formula: (A, B, C) => `z = ${fmt(A, 1)}·e^(i·${fmt(B, 1)}t)   |   z^${Math.round(C)}`,
    explicacion: "Multiplicar por 'i' no es algo misterioso: simplemente significa girar 90 grados en el plano. Por eso elevar un número complejo a una potencia dibuja espirales.",
    ejemplo: "Análisis de señales Wi-Fi, circuitos de corriente alterna y filtros de audio digital.",
    lectura: (A, B, C) => `Mientras z da una vuelta, su potencia z^${Math.round(C)} (flecha dorada) gira ${Math.round(C)} veces más rápido.`,
    draw: dibujarPlanoComplejo
  },
  {
    id: "mat_compleja_onda", materia: "matematicas", nivel: "avanzado", categoria: "Análisis Matemático",
    titulo: "Función de Onda Compleja", gancho: "Dos ondas gemelas viajando en paquete.",
    sliders: [
      { label: "A · Amplitud del paquete", min: 0.8, max: 2.8, step: 0.1, val: 2.0 },
      { label: "B · Número de onda (k)", min: 1.5, max: 7.0, step: 0.2, val: 4.0 },
      { label: "C · Velocidad de grupo", min: 0.4, max: 2.5, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `ψ(x,t) = ${fmt(A, 1)}·e^(-(x-x₀)²/2) · e^(i(${fmt(B, 1)}x - ωt))`,
    explicacion: "Un paquete de ondas combina parte real (cian) e imaginaria (morado) encerradas dentro de una campana dorada que viaja junta.",
    ejemplo: "Pulsos de luz en fibra óptica que llevan internet y electrones viajando en mecánica cuántica.",
    lectura: (A, B) => `Dentro de la envolvente dorada caben más oscilaciones cuanto mayor es k = ${fmt(B, 1)}.`,
    draw: dibujarFuncionOndaCompleja
  },
  {
    id: "mat_prob_gauss", materia: "matematicas", nivel: "avanzado", categoria: "Probabilidad y Estadística",
    titulo: "Campana de Gauss Animada", gancho: "El patrón secreto de la naturaleza.",
    sliders: [
      { label: "A · Media / Promedio (μ)", min: -3.0, max: 3.0, step: 0.2, val: 0.0 },
      { label: "B · Dispersión (σ)", min: 0.45, max: 2.2, step: 0.05, val: 1.0 },
      { label: "C · Lluvia de muestras", min: 1, max: 5, step: 1, val: 3 }
    ],
    formula: (A, B) => `f(x) = [1 / (${fmt(B, 2)}√2π)] · e^(-(x${fmtSign(-A, 1)})² / ${fmt(2 * B * B, 2)})`,
    explicacion: "La mayoría de los datos caen cerca del promedio (el pico central) y muy pocos en los extremos. Subir σ aplasta y ensancha la campana.",
    ejemplo: "Estatura de las personas, calificaciones de un examen masivo y errores de medición industrial.",
    lectura: (A, B) => `El 68.2% de los casos cae entre ${fmt(A - B, 2)} y ${fmt(A + B, 2)} (zona sombreada morada).`,
    draw: dibujarGauss
  },
  {
    id: "mat_prob_binomial", materia: "matematicas", nivel: "avanzado", categoria: "Probabilidad y Estadística",
    titulo: "Histograma y Distribución Binomial", gancho: "Lanzar monedas muchas veces seguidas.",
    sliders: [
      { label: "A · Número de ensayos (n)", min: 5, max: 18, step: 1, val: 12 },
      { label: "B · Probabilidad de éxito (p)", min: 0.1, max: 0.9, step: 0.05, val: 0.5 },
      { label: "C · Ritmo de muestreo", min: 0.5, max: 2.5, step: 0.1, val: 1.0 }
    ],
    formula: (A, B) => `P(X=k) = C(${Math.round(A)}, k) · (${fmt(B, 2)})^k · (${fmt(1 - B, 2)})^(${Math.round(A)}-k)`,
    explicacion: "Mide cuántos éxitos obtienes al repetir un experimento de 'sí o no' n veces. La barra turquesa señala el resultado más probable.",
    ejemplo: "Control de calidad en una fábrica (piezas buenas vs defectuosas) o tiros libres encestados.",
    lectura: (A, B) => `En promedio esperarías ${fmt(Math.round(A) * B, 1)} éxitos de ${Math.round(A)} intentos.`,
    draw: dibujarBinomial
  },
  {
    id: "mat_num_euler", materia: "matematicas", nivel: "avanzado", categoria: "Métodos Numéricos",
    titulo: "Aproximación de Euler", gancho: "Seguir una curva dando pasos rectos.",
    sliders: [
      { label: "A · Tasa k (y' = ky)", min: 0.2, max: 0.75, step: 0.05, val: 0.45 },
      { label: "B · Tamaño de paso (h)", min: 0.2, max: 1.5, step: 0.05, val: 0.75 },
      { label: "C · Valor inicial y(0)", min: 0.5, max: 2.5, step: 0.1, val: 1.0 }
    ],
    formula: (A, B) => `yₙ₊₁ = yₙ + ${fmt(B, 2)} · (${fmt(A, 2)}·yₙ)`,
    explicacion: "Las computadoras resuelven ecuaciones difíciles dando pasitos rectos de tamaño h. Si el paso h es muy grande, te separas de la curva verde real.",
    ejemplo: "Simulación del clima, física de videojuegos y trayectorias de naves espaciales.",
    lectura: (A, B) => B <= 0.35 ? "Paso h pequeño: la aproximación roja se pega muy bien a la curva real." : "Paso h grande: el error se acumula rápido. Prueba bajar B para ver cómo mejora.",
    draw: dibujarMetodoEuler
  },
  {
    id: "mat_num_rectangulos", materia: "matematicas", nivel: "avanzado", categoria: "Métodos Numéricos",
    titulo: "Integración Numérica (Trapecios)", gancho: "Medir áreas sin resolver la integral a mano.",
    sliders: [
      { label: "A · Subintervalos (N)", min: 2, max: 24, step: 1, val: 8 },
      { label: "B · Ondulación", min: 0.2, max: 2.2, step: 0.1, val: 1.2 },
      { label: "C · Movimiento de curva", min: 0.0, max: 2.5, step: 0.1, val: 1.0 }
    ],
    formula: (A) => `Area ≈ Σ (Δx / 2) · [f(xᵢ) + f(xᵢ₊₁)]   (N = ${Math.round(A)})`,
    explicacion: "En lugar de rectángulos planos, conectamos cada par de puntos con techos inclinados (trapecios), ajustándonos mucho mejor a la curva.",
    ejemplo: "Calcular el consumo eléctrico diario a partir de lecturas cada hora de un medidor inteligente.",
    lectura: (A) => `Dividiendo el intervalo en ${Math.round(A)} trapecios de ancho Δx = ${fmt(6 / Math.round(A), 2)}.`,
    draw: dibujarRectangulosNumericos
  },
  {
    id: "mat_num_newton", materia: "matematicas", nivel: "avanzado", categoria: "Métodos Numéricos",
    titulo: "Método de Newton-Raphson", gancho: "Cazar raíces disparando tangentes.",
    sliders: [
      { label: "A · Constante objetivo", min: 1.0, max: 7.0, step: 0.2, val: 3.6 },
      { label: "B · Punto inicial x₀", min: 0.8, max: 5.5, step: 0.1, val: 5.0 },
      { label: "C · Velocidad de pasos", min: 0.3, max: 2.5, step: 0.1, val: 1.0 }
    ],
    formula: (A, B) => `xₙ₊₁ = xₙ - (0.45xₙ² - ${fmt(A, 1)}) / (0.9xₙ)  |  x₀ = ${fmt(B, 1)}`,
    explicacion: "Para encontrar dónde la curva cruza el eje X, trazas una tangente desde tu suposición y miras dónde toca el piso; en 3 o 4 rebotes aciertas con precisión brutal.",
    ejemplo: "Así calcula tu calculadora raíces cuadradas en milisegundos y optimizan costos las empresas.",
    lectura: (A) => `Convergiendo rápidamente hacia la raíz exacta √(${fmt(A / 0.45, 2)}) ≈ ${fmt(Math.sqrt(A / 0.45), 3)}.`,
    draw: dibujarNewtonRaphson
  },
  {
    id: "mat_topo_toro", materia: "matematicas", nivel: "avanzado", categoria: "Topología",
    titulo: "Deformación Continua (Toro ↔ Taza)", gancho: "Para un topólogo, una dona es una taza.",
    sliders: [
      { label: "A · Velocidad de morphing", min: 0.3, max: 2.2, step: 0.1, val: 0.9 },
      { label: "B · Fase manual", min: 0, max: 6.2, step: 0.2, val: 0.0 },
      { label: "C · Anillos de malla", min: 3, max: 9, step: 1, val: 5 }
    ],
    formula: () => `Homeomorfismo: Toro (g = 1) ≅ Taza de Café (g = 1)`,
    explicacion: "En topología puedes estirar y moldear como plastilina sin cortar ni pegar. Como la dona y el asa de la taza tienen 1 solo agujero, ¡son la misma figura!",
    ejemplo: "Diseño de mapas del metro (importan las conexiones, no las distancias exactas) y plegamiento de ADN.",
    lectura: () => "El hueco de la dona nunca desaparece: se mueve a un costado para volverse el asa, mientras la cavidad del café es solo un hundimiento.",
    draw: dibujarToroTaza
  },
  {
    id: "mat_alg_simetrias", materia: "matematicas", nivel: "avanzado", categoria: "Álgebra Abstracta",
    titulo: "Grupo de Simetrías Diedral (Dₙ)", gancho: "Todas las formas de girar sin cambiar la figura.",
    sliders: [
      { label: "A · Lados del polígono (n)", min: 3, max: 8, step: 1, val: 5 },
      { label: "B · Velocidad de rotación", min: -2.0, max: 2.0, step: 0.1, val: 0.9 },
      { label: "C · Activar reflexión (>0.5)", min: 0, max: 1, step: 0.1, val: 0.2 }
    ],
    formula: (A) => `D_${Math.round(A)} = ⟨r, s | r^${Math.round(A)} = e, s² = e⟩  (|D_${Math.round(A)}| = ${2 * Math.round(A)})`,
    explicacion: "Un grupo de simetrías reúne todos los giros y volteos espejo que dejan al polígono ocupando exactamente el mismo lugar, aunque sus vértices cambien de puesto.",
    ejemplo: "Simetría de cristales minerales, moléculas químicas, copos de nieve y criptografía moderna.",
    lectura: (A, B, C) => `Un polígono de ${Math.round(A)} lados tiene ${Math.round(A)} rotaciones y ${Math.round(A)} reflexiones (${2 * Math.round(A)} simetrías).`,
    draw: dibujarGrupoSimetrias
  },

  // -------------------- FÍSICA: NIVEL BÁSICO (9) --------------------
  {
    id: "fis_parabolico", materia: "fisica", nivel: "basico", categoria: "Mecánica Clásica",
    titulo: "Tiro Parabólico", gancho: "Lanza un balón y controla su alcance.",
    sliders: [
      { label: "A · Velocidad inicial v₀ (m/s)", min: 10, max: 35, step: 1, val: 22 },
      { label: "B · Ángulo de tiro (°)", min: 15, max: 80, step: 1, val: 45 },
      { label: "C · Gravedad g (m/s²)", min: 1.6, max: 20, step: 0.2, val: 9.8 }
    ],
    formula: (A, B, C) => `x = (${fmt(A, 0)}cos${fmt(B, 0)}°)t  |  y = (${fmt(A, 0)}sen${fmt(B, 0)}°)t - ½(${fmt(C, 1)})t²`,
    explicacion: "Mientras la velocidad horizontal (cian) se mantiene constante, la gravedad frena la velocidad vertical (dorada) hasta que el balón cae.",
    ejemplo: "Un tiro libre de fútbol, un pase de básquetbol o el chorro de una manguera de bomberos.",
    lectura: (A, B, C) => `Con ${fmt(B, 0)}° logras un alcance de ${fmt((A * A * Math.sin((2 * B * Math.PI) / 180)) / C, 1)} m. Recuerda que 45° da el máximo alcance.`,
    draw: dibujarTiroParabolico
  },
  {
    id: "fis_caida_libre", materia: "fisica", nivel: "basico", categoria: "Mecánica Clásica",
    titulo: "Caída Libre", gancho: "Cada segundo que pasa, cae más rápido.",
    sliders: [
      { label: "A · Altura inicial h₀ (m)", min: 15, max: 100, step: 5, val: 55 },
      { label: "B · Gravedad g (m/s²)", min: 1.6, max: 24, step: 0.2, val: 9.8 },
      { label: "C · Empuje inicial v₀ (m/s)", min: 0, max: 15, step: 1, val: 0 }
    ],
    formula: (A, B, C) => `h(t) = ${fmt(A, 0)} - ${fmt(C, 0)}t - ½(${fmt(B, 1)})t²`,
    explicacion: "Sin aire que frene, la gravedad acelera constantemente el objeto. Por eso las huellas estroboscópicas se van separando más y más conforme baja.",
    ejemplo: "Soltar una moneda en un pozo o comparar cómo cae un objeto en la Tierra (9.8) vs la Luna (1.6).",
    lectura: (A, B, C) => `Impacta el suelo a ${fmt(Math.sqrt(C * C + 2 * B * A), 1)} m/s (${fmt(Math.sqrt(C * C + 2 * B * A) * 3.6, 0)} km/h).`,
    draw: dibujarCaidaLibre
  },
  {
    id: "fis_plano_inclinado", materia: "fisica", nivel: "basico", categoria: "Mecánica Clásica",
    titulo: "Plano Inclinado y Vectores", gancho: "Por qué las rampas facilitan subir peso.",
    sliders: [
      { label: "A · Ángulo de la rampa (°)", min: 10, max: 52, step: 1, val: 28 },
      { label: "B · Coef. de fricción (μ)", min: 0.0, max: 0.8, step: 0.05, val: 0.2 },
      { label: "C · Masa del bloque (kg)", min: 1, max: 10, step: 0.5, val: 4 }
    ],
    formula: (A, B) => `a = g · (sen ${fmt(A, 0)}° - ${fmt(B, 2)}·cos ${fmt(A, 0)}°)`,
    explicacion: "El peso (rojo) se divide en dos: una parte jala hacia abajo por la rampa y otra aprieta contra la superficie, generando fricción (dorada).",
    ejemplo: "Una resbaladilla en el parque, rampas de acceso para sillas de ruedas o bajar cajas de un camión.",
    lectura: (A, B) => {
      const a = 9.81 * (Math.sin((A * Math.PI) / 180) - B * Math.cos((A * Math.PI) / 180));
      return a <= 0 ? "La fricción es más fuerte que la pendiente: el bloque no se mueve." : `El bloque acelera cuesta abajo a ${fmt(a, 2)} m/s².`;
    },
    draw: dibujarPlanoInclinado
  },
  {
    id: "fis_newton_fma", materia: "fisica", nivel: "basico", categoria: "Leyes de Newton",
    titulo: "2ª Ley de Newton (F = m·a) con Carrito", gancho: "Más empuje acelera; más peso frena.",
    sliders: [
      { label: "A · Fuerza del motor F (N)", min: 5, max: 80, step: 1, val: 38 },
      { label: "B · Masa del carrito (kg)", min: 1, max: 15, step: 0.5, val: 5 },
      { label: "C · Fricción del suelo (μ)", min: 0.0, max: 0.6, step: 0.05, val: 0.15 }
    ],
    formula: (A, B, C) => `a = (${fmt(A, 0)} - ${fmt(C * B * 9.81, 1)}) / ${fmt(B, 1)} = ${fmt(Math.max(0, A - C * B * 9.81) / B, 2)} m/s²`,
    explicacion: "La aceleración depende de la fuerza que sobra después de vencer la fricción, dividida entre qué tan pesado es el carrito.",
    ejemplo: "Empujar un carrito de supermercado vacío vs lleno de despensa sobre piso liso o alfombra.",
    lectura: (A, B, C) => {
      const fn = A - C * B * 9.81;
      return fn <= 0 ? "Tu fuerza no supera la fricción del suelo: sube A o reduce la masa B." : `Fuerza neta ganadora: ${fmt(fn, 1)} N empujando el carrito hacia la derecha.`;
    },
    draw: dibujarCarritoNewton
  },
  {
    id: "fis_pendulo", materia: "fisica", nivel: "basico", categoria: "Energía y Momento",
    titulo: "Péndulo Simple (Energía Ep ↔ Ec)", gancho: "La energía se transforma, nunca se pierde.",
    sliders: [
      { label: "A · Longitud cuerda L (m)", min: 0.5, max: 2.8, step: 0.1, val: 1.5 },
      { label: "B · Ángulo inicial (°)", min: 10, max: 65, step: 1, val: 38 },
      { label: "C · Gravedad g (m/s²)", min: 1.6, max: 20, step: 0.2, val: 9.8 }
    ],
    formula: (A, B, C) => `T = 2π√(${fmt(A, 1)}/${fmt(C, 1)}) = ${fmt(2 * Math.PI * Math.sqrt(A / C), 2)} s  |  Ep + Ec = Const`,
    explicacion: "En los extremos el péndulo se detiene arriba (100% Energía Potencial morada). Al pasar por abajo va a máxima velocidad (100% Energía Cinética turquesa).",
    ejemplo: "Un columpio en el parque, un reloj de péndulo antiguo o una bola de demolición.",
    lectura: (A, B, C) => `Observa la barra dorada (Energía Total): jamás baja ni sube mientras Ep y Ec se turnan.`,
    draw: dibujarPendulo
  },
  {
    id: "fis_colision", materia: "fisica", nivel: "basico", categoria: "Energía y Momento",
    titulo: "Colisión Elástica 1D", gancho: "Choque perfecto donde el impulso se transfiere.",
    sliders: [
      { label: "A · Masa esfera cian m₁ (kg)", min: 1, max: 8, step: 0.5, val: 3 },
      { label: "B · Masa esfera morada m₂ (kg)", min: 1, max: 8, step: 0.5, val: 3 },
      { label: "C · Velocidad inicial v₁ (m/s)", min: 0.5, max: 6, step: 0.2, val: 3.2 }
    ],
    formula: (A, B, C) => `p = (${fmt(A, 1)})(${fmt(C, 1)}) + (${fmt(B, 1)})(-1.8) = ${fmt(A * C - B * 1.8, 1)} kg·m/s`,
    explicacion: "En un choque elástico sin deformación, tanto la cantidad de movimiento total como la energía cinética se conservan exactamente igual antes y después.",
    ejemplo: "Bolas de billar golpeándose entre sí o el famoso péndulo de Newton de escritorio.",
    lectura: (A, B) => A > B ? "La esfera cian es más pesada y empuja con fuerza a la morada." : (A < B ? "La esfera morada es más pesada y hace rebotar hacia atrás a la cian." : "Con masas iguales intercambian perfectamente sus velocidades."),
    draw: dibujarColisionElastica
  },
  {
    id: "fis_onda_sonora", materia: "fisica", nivel: "basico", categoria: "Ondas",
    titulo: "Onda Sonora (Compresión del Aire)", gancho: "El sonido son empujones invisibles de aire.",
    sliders: [
      { label: "A · Volumen / Amplitud", min: 0.3, max: 2.0, step: 0.1, val: 1.2 },
      { label: "B · Tono / Frecuencia", min: 1.0, max: 5.0, step: 0.2, val: 2.4 },
      { label: "C · Velocidad propagación", min: 0.4, max: 2.5, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `ΔP(x,t) = ${fmt(A, 1)} · cos(${fmt(B, 1)}kx - ωt)`,
    explicacion: "Una bocina no 'avienta' aire hasta tu oído; cada partícula solo vibra en su lugar empujando a su vecina y creando zonas apretadas (rojas) y flojas (azules).",
    ejemplo: "La vibración que sientes al poner la mano cerca de un bafle con música fuerte.",
    lectura: (A, B) => `Tono ${B > 3 ? "agudo (ondas muy juntas)" : "grave (ondas separadas)"} con volumen ${A > 1.3 ? "alto" : "moderado"}.`,
    draw: dibujarOndaSonora
  },
  {
    id: "fis_termo_gas", materia: "fisica", nivel: "basico", categoria: "Termodinámica Básica",
    titulo: "Gas Ideal en Pistón (PV = nRT)", gancho: "Calentar un gas hace que empuje más fuerte.",
    sliders: [
      { label: "A · Temperatura T (K)", min: 200, max: 750, step: 10, val: 380 },
      { label: "B · Presión externa P (atm)", min: 0.6, max: 3.0, step: 0.1, val: 1.2 },
      { label: "C · Cantidad de gas (n mol)", min: 2, max: 10, step: 1, val: 6 }
    ],
    formula: (A, B, C) => `V = nRT / P = (${Math.round(C)} · R · ${fmt(A, 0)}) / ${fmt(B, 1)}`,
    explicacion: "La temperatura es simplemente qué tan rápido rebotan las moléculas. Al calentar el gas, golpean más fuerte el pistón y lo levantan expandiendo el volumen.",
    ejemplo: "Un globo aerostático subiendo al calentar el aire, o el pistón dentro del motor de un automóvil.",
    lectura: (A, B) => A > 520 ? "Gas muy caliente: moléculas rapidísimas empujando el émbolo hacia arriba." : "Gas templado/frío: menos choque térmico y menor volumen.",
    draw: dibujarGasPiston
  },
  {
    id: "fis_termo_cafe", materia: "fisica", nivel: "basico", categoria: "Termodinámica Básica",
    titulo: "La Termo es tu Café (Transferencia Térmica)", gancho: "Por qué tu café se enfría y nunca se calienta solo.",
    sliders: [
      { label: "A · Temp. inicial café (°C)", min: 55, max: 98, step: 1, val: 92 },
      { label: "B · Temp. habitación (°C)", min: 5, max: 35, step: 1, val: 21 },
      { label: "C · Aislamiento (menor = termo)", min: 0.03, max: 0.25, step: 0.01, val: 0.11 }
    ],
    formula: (A, B, C) => `T(t) = ${fmt(B, 0)} + (${fmt(A - B, 0)})·e^(-${fmt(C, 2)}t)`,
    explicacion: "El calor siempre fluye espontáneamente del objeto caliente (café) al entorno frío (aire) hasta alcanzar el equilibrio térmico.",
    ejemplo: "Usar un termo aislado (baja C) mantiene tu bebida caliente horas; soplarle (sube C) acelera la pérdida de calor.",
    lectura: (A, B, C) => C < 0.07 ? "Aislamiento tipo termo: tu café conserva el calor mucho más tiempo." : "Taza abierta: el vapor escapa rápido y la temperatura cae velozmente.",
    draw: dibujarCafeEnfriamiento
  },

  // -------------------- FÍSICA: NIVEL INTERMEDIO (7) --------------------
  {
    id: "fis_campo_electrico", materia: "fisica", nivel: "intermedio", categoria: "Electromagnetismo",
    titulo: "Campo Eléctrico con Flechas Animadas", gancho: "El mapa invisible de fuerzas entre cargas.",
    sliders: [
      { label: "A · Carga izquierda q₁ (μC)", min: -5, max: 5, step: 0.5, val: 3.5 },
      { label: "B · Carga derecha q₂ (μC)", min: -5, max: 5, step: 0.5, val: -3.5 },
      { label: "C · Separación entre cargas", min: 0.8, max: 2.5, step: 0.1, val: 1.6 }
    ],
    formula: (A, B) => `E = k · (q₁/r₁² + q₂/r₂²)   |   q₁=${fmt(A, 1)}, q₂=${fmt(B, 1)}`,
    explicacion: "Cada flecha muestra hacia dónde saldría disparada una carga positiva de prueba. Las flechas nacen en cargas (+) y mueren en cargas (−).",
    ejemplo: "La estática que eriza tu cabello al frotar un globo o el funcionamiento de las pantallas táctiles.",
    lectura: (A, B) => (A * B < 0) ? "Cargas opuestas (Dipolo): las flechas fluyen como un puente de (+) hacia (−)." : "Cargas del mismo signo: se repelen y desvían el campo en el centro.",
    draw: dibujarCampoElectrico
  },
  {
    id: "fis_campo_magnetico", materia: "fisica", nivel: "intermedio", categoria: "Electromagnetismo",
    titulo: "Campo Magnético y Fuerza de Lorentz", gancho: "Los imanes curvan partículas en círculos.",
    sliders: [
      { label: "A · Velocidad partícula (v)", min: 1.0, max: 5.0, step: 0.2, val: 3.0 },
      { label: "B · Campo Magnético (B)", min: -2.5, max: 2.5, step: 0.1, val: 1.2 },
      { label: "C · Signo de carga (+ / −)", min: -1, max: 1, step: 2, val: 1 }
    ],
    formula: (A, B, C) => `F_B = (${C >= 0 ? "+" : "-"}q) · (${fmt(A, 1)}) × (${fmt(B, 1)} T)`,
    explicacion: "A diferencia de la electricidad, el magnetismo siempre empuja perpendicular a la velocidad. Por eso nunca acelera la partícula: ¡solo la hace dar vueltas!",
    ejemplo: "Las auroras boreales (el campo magnético de la Tierra desvía el viento solar) y aceleradores como el CERN.",
    lectura: (A, B) => `Si subes el campo magnético B (${fmt(B, 1)} T), el radio del círculo se vuelve más apretado.`,
    draw: dibujarCampoMagnetico
  },
  {
    id: "fis_maxwell_onda", materia: "fisica", nivel: "intermedio", categoria: "Leyes de Maxwell",
    titulo: "Onda Electromagnética (Luz)", gancho: "Electricidad y magnetismo bailando juntos.",
    sliders: [
      { label: "A · Intensidad (Amplitud)", min: 0.6, max: 2.2, step: 0.1, val: 1.5 },
      { label: "B · Frecuencia (Color/Banda)", min: 0.6, max: 3.0, step: 0.1, val: 1.4 },
      { label: "C · Rapidez visual", min: 0.4, max: 2.5, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `∇×E = -∂B/∂t  |  ∇×B = μ₀ε₀·∂E/∂t  (f ∝ ${fmt(B, 1)})`,
    explicacion: "Maxwell descubrió que un campo eléctrico vibrante (cian) crea un campo magnético perpendicular (dorado), que a su vez recrea el eléctrico y viajan solos por el vacío.",
    ejemplo: "La luz del sol, el Wi-Fi de tu router, las microondas de tu cocina y las señales 5G: ¡todas son esta misma onda!",
    lectura: (A, B) => B > 2.1 ? "Alta frecuencia (ondas cortas): como luz azul, ultravioleta o rayos X." : "Frecuencia baja (ondas largas): como radio, microondas o luz roja.",
    draw: dibujarOndaEM
  },
  {
    id: "fis_circuito_ohm", materia: "fisica", nivel: "intermedio", categoria: "Circuitos Eléctricos",
    titulo: "Ley de Ohm (V = I·R) con Focos", gancho: "El circuito funciona igual que una manguera.",
    sliders: [
      { label: "A · Voltaje batería V (V)", min: 1.5, max: 24, step: 0.5, val: 12 },
      { label: "B · Resistencia por foco R (Ω)", min: 2, max: 20, step: 1, val: 6 },
      { label: "C · Cantidad de focos en serie", min: 1, max: 3, step: 1, val: 2 }
    ],
    formula: (A, B, C) => `I = V / R_total = ${fmt(A, 1)}V / ${fmt(B * Math.round(C), 0)}Ω = ${fmt(A / (B * Math.round(C)), 2)} A`,
    explicacion: "El voltaje es la presión del agua, la corriente son los electrones fluyendo y la resistencia es qué tan apretada está la manguera. Menos resistencia = focos más brillantes.",
    ejemplo: "Un regulador de intensidad (dimmer) para bajar la luz de una lámpara o el cargador de tu celular.",
    lectura: (A, B, C) => {
      const I = A / (B * Math.round(C));
      return I > 1.2 ? `¡Corriente fuerte (${fmt(I, 2)} A)! Los electrones corren rápido y los focos brillan al máximo.` : `Corriente baja (${fmt(I, 2)} A): sube el voltaje A o baja la resistencia B para dar más brillo.`;
    },
    draw: dibujarCircuitoOhm
  },
  {
    id: "fis_capacitor", materia: "fisica", nivel: "intermedio", categoria: "Circuitos Eléctricos",
    titulo: "Carga y Descarga de un Capacitor (RC)", gancho: "Una mini-batería ultrarrápida de placas.",
    sliders: [
      { label: "A · Voltaje fuente V₀ (V)", min: 3, max: 15, step: 0.5, val: 12 },
      { label: "B · Resistencia R (kΩ)", min: 0.5, max: 3.5, step: 0.1, val: 1.4 },
      { label: "C · Capacitancia C (mF)", min: 0.4, max: 2.5, step: 0.1, val: 1.0 }
    ],
    formula: (A, B, C) => `Vc(t) = ${fmt(A, 1)}·(1 - e^(-t / ${fmt(B * C, 2)}))   (τ = RC = ${fmt(B * C, 2)} s)`,
    explicacion: "Un capacitor guarda energía acumulando cargas (+) y (−) frente a frente en dos placas. Tarda unas 5 constantes de tiempo τ en llenarse o vaciarse.",
    ejemplo: "El flash instantáneo de una cámara fotográfica, desfibriladores médicos y estabilizadores de voltaje.",
    lectura: (A, B, C) => `Constante de tiempo τ = ${fmt(B * C, 2)} s. A menor τ, el capacitor se llena y vacía mucho más rápido.`,
    draw: dibujarCapacitor
  },
  {
    id: "fis_carnot", materia: "fisica", nivel: "intermedio", categoria: "Termodinámica Formal",
    titulo: "Ciclo de Carnot (Máquina Térmica Ideal)", gancho: "El límite máximo de eficiencia de cualquier motor.",
    sliders: [
      { label: "A · Foco caliente Th (K)", min: 450, max: 1000, step: 10, val: 700 },
      { label: "B · Foco frío Tc (K)", min: 200, max: 420, step: 10, val: 300 },
      { label: "C · Velocidad del ciclo", min: 0.4, max: 2.5, step: 0.1, val: 1.0 }
    ],
    formula: (A, B) => `η_máx = 1 - (Tc / Th) = 1 - (${fmt(B, 0)}/${fmt(Math.max(B + 80, A), 0)}) = ${fmt((1 - B / Math.max(B + 80, A)) * 100, 1)}%`,
    explicacion: "Ningún motor térmico puede convertir el 100% del calor en movimiento. El área encerrada dentro del ciclo P-V representa el trabajo útil obtenido en cada vuelta.",
    ejemplo: "Centrales eléctricas de vapor, motores de combustión y refrigeradores (que funcionan al revés).",
    lectura: (A, B) => `Para mejorar la eficiencia (${fmt((1 - B / Math.max(B + 80, A)) * 100, 1)}%), aumenta la diferencia entre Th y Tc.`,
    draw: dibujarCicloCarnot
  },
  {
    id: "fis_entropia", materia: "fisica", nivel: "intermedio", categoria: "Termodinámica Formal",
    titulo: "Entropía y la Flecha del Tiempo", gancho: "Por qué el desorden siempre gana.",
    sliders: [
      { label: "A · Número de moléculas", min: 16, max: 60, step: 2, val: 36 },
      { label: "B · Agitación térmica", min: 0.5, max: 2.5, step: 0.1, val: 1.2 },
      { label: "C · Mezcla de especies", min: 0.5, max: 2.0, step: 0.1, val: 1.5 }
    ],
    formula: (A) => `S = k_B · ln(Ω)   |   ΔS ≥ 0  (N = ${Math.round(A)} partículas)`,
    explicacion: "Al abrir la compuerta, las partículas se esparcen por toda la caja porque hay millones de formas desordenadas de acomodarse frente a una sola forma ordenada.",
    ejemplo: "Una gota de tinta dispersándose en agua o el aroma de un perfume llenando toda la habitación.",
    lectura: () => "Observa la curva dorada de Entropía S: siempre sube al mezclarse y nunca regresa espontáneamente al lado izquierdo.",
    draw: dibujarEntropia
  },

  // -------------------- FÍSICA: NIVEL AVANZADO (11) --------------------
  {
    id: "fis_pendulo_doble", materia: "fisica", nivel: "avanzado", categoria: "Mecánica Analítica",
    titulo: "Péndulo Doble Caótico", gancho: "Reglas simples que crean caos impredecible.",
    sliders: [
      { label: "A · Masa superior m₁ (kg)", min: 1.0, max: 5.0, step: 0.2, val: 2.0 },
      { label: "B · Masa inferior m₂ (kg)", min: 1.0, max: 5.0, step: 0.2, val: 2.0 },
      { label: "C · Gravedad g (m/s²)", min: 3.0, max: 18.0, step: 0.5, val: 9.8 }
    ],
    formula: (A, B, C) => `L = T(θ₁,θ₂,θ̇₁,θ̇₂) - V(θ₁,θ₂)  |  m₁=${fmt(A, 1)}, m₂=${fmt(B, 1)}, g=${fmt(C, 1)}`,
    explicacion: "Colgar un péndulo debajo de otro genera un sistema caótico: aunque sigue leyes exactas de física, cambiar un milímetro un peso crea una estela completamente distinta.",
    ejemplo: "El 'efecto mariposa' en la predicción del clima y la turbulencia de fluidos.",
    lectura: () => "La estela turquesa jamás se repite igual; mueve ligeramente A o B para reiniciar con una coreografía totalmente nueva.",
    draw: dibujarPenduloDoble
  },
  {
    id: "fis_lagrangiana", materia: "fisica", nivel: "avanzado", categoria: "Mecánica Analítica",
    titulo: "Lagrangiana (L = T − V) y Mínima Acción", gancho: "La naturaleza siempre elige el camino más ahorrador.",
    sliders: [
      { label: "A · Amplitud movimiento", min: 0.8, max: 3.0, step: 0.1, val: 2.2 },
      { label: "B · Rigidez del resorte (k)", min: 0.5, max: 4.0, step: 0.1, val: 1.8 },
      { label: "C · Desvío de ruta falsa", min: -2.0, max: 2.0, step: 0.1, val: 1.1 }
    ],
    formula: (A, B) => `L = T - V = ½v² - ½(${fmt(B, 1)})x²   |   δ∫L dt = 0`,
    explicacion: "En vez de pelear con flechas de fuerzas, Lagrange descubrió que la naturaleza elige la trayectoria real (cian) que hace mínima la acción total ∫(T−V)dt.",
    ejemplo: "Cálculo de órbitas espaciales complejas, física de partículas y robótica articulada.",
    lectura: (A, B, C) => `Cualquier ruta gris desviada (C=${fmt(C, 1)}) cuesta más 'acción' que la trayectoria natural cian.`,
    draw: dibujarLagrangiana
  },
  {
    id: "fis_particula_caja", materia: "fisica", nivel: "avanzado", categoria: "Física Moderna y Cuántica",
    titulo: "Partícula Cuántica en una Caja", gancho: "En el mundo atómico, la energía viene en escalones.",
    sliders: [
      { label: "A · Nivel cuántico (n)", min: 1, max: 6, step: 1, val: 2 },
      { label: "B · Ancho de la caja (L)", min: 2.0, max: 6.0, step: 0.2, val: 4.0 },
      { label: "C · Velocidad de fase", min: 0.4, max: 2.5, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `ψ_${Math.round(A)}(x) = √(2/${fmt(B, 1)}) · sen(${Math.round(A)}πx / ${fmt(B, 1)})   |   Eₙ ∝ n²`,
    explicacion: "Un electrón atrapado se comporta como onda: solo caben ondas exactas que valgan cero en las paredes. Las jorobas moradas muestran dónde es más probable encontrarlo.",
    ejemplo: "Los colores brillantes de los televisores QLED (puntos cuánticos) dependen del tamaño L de la 'caja'.",
    lectura: (A) => `En el nivel n=${Math.round(A)} hay ${Math.round(A)} zonas de alta probabilidad y ${Math.round(A) - 1} nodos donde jamás aparece la partícula.`,
    draw: dibujarParticulaCaja
  },
  {
    id: "fis_efecto_tunel", materia: "fisica", nivel: "avanzado", categoria: "Física Moderna y Cuántica",
    titulo: "Efecto Túnel Cuántico", gancho: "Atravesar paredes que clásicamente son imposibles.",
    sliders: [
      { label: "A · Energía partícula (E)", min: 1.0, max: 5.5, step: 0.1, val: 2.8 },
      { label: "B · Altura de la barrera (V)", min: 2.0, max: 7.0, step: 0.1, val: 4.5 },
      { label: "C · Grosor de la barrera", min: 0.4, max: 2.4, step: 0.1, val: 1.1 }
    ],
    formula: (A, B, C) => `T ≈ e^(-2κL)  |  E=${fmt(A, 1)} vs Barrera V=${fmt(B, 1)}, L=${fmt(C, 1)}`,
    explicacion: "Si lanzas una pelota contra una pared sin suficiente energía, rebota siempre. Pero una onda cuántica se atenúa dentro de la barrera roja y ¡un porcentaje logra salir del otro lado!",
    ejemplo: "Sin efecto túnel el Sol no podría brillar (fusión nuclear) ni funcionarían las memorias flash USB y microscopios STM.",
    lectura: (A, B, C) => B > A ? "Aunque la barrera es más alta que la energía E, la onda continúa al lado derecho con menor amplitud." : "La partícula tiene más energía que la barrera y cruza libremente.",
    draw: dibujarEfectoTunel
  },
  {
    id: "fis_dualidad", materia: "fisica", nivel: "avanzado", categoria: "Física Moderna y Cuántica",
    titulo: "Dualidad Onda-Partícula (Doble Rendija)", gancho: "Viaja como onda, aterriza como puntito.",
    sliders: [
      { label: "A · Separación rendijas (d)", min: 0.7, max: 2.4, step: 0.1, val: 1.4 },
      { label: "B · Longitud de onda (λ)", min: 0.7, max: 2.2, step: 0.1, val: 1.2 },
      { label: "C · Rapidez de onda", min: 0.4, max: 2.5, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `I(y) ∝ cos²(π · Δr / λ)   |   d=${fmt(A, 1)}, λ=${fmt(B, 1)}`,
    explicacion: "Al pasar por dos rendijas, las ondas se refuerzan y cancelan formando franjas brillantes y oscuras en la pantalla, aunque los fotones lleguen de uno en uno.",
    ejemplo: "El experimento más famoso de la física cuántica y la base de la interferometría láser.",
    lectura: (A, B) => `Si acercas las rendijas (baja A) o aumentas λ (sube B), las franjas brillantes se separan más en la pantalla.`,
    draw: dibujarDualidad
  },
  {
    id: "fis_maxwell_boltzmann", materia: "fisica", nivel: "avanzado", categoria: "Física Estadística",
    titulo: "Distribución de Maxwell-Boltzmann", gancho: "No todas las moléculas de un gas van igual de rápido.",
    sliders: [
      { label: "A · Temperatura T (K)", min: 150, max: 900, step: 20, val: 420 },
      { label: "B · Masa molecular (u)", min: 0.5, max: 4.0, step: 0.1, val: 1.4 },
      { label: "C · Moléculas en cámara", min: 20, max: 65, step: 5, val: 40 }
    ],
    formula: (A, B) => `f(v) ∝ v² · e^(-mv² / 2kT)   |   T=${fmt(A, 0)} K, m=${fmt(B, 1)}`,
    explicacion: "En un gas hay moléculas lentas (azules), promedio (doradas) y rapidísimas (rojas). Al subir la temperatura, la curva se estira hacia velocidades más altas.",
    ejemplo: "Por qué el agua se evapora incluso sin hervir: las moléculas más rápidas de la cola derecha logran escapar.",
    lectura: (A, B) => A > 600 ? "Temperatura alta: muchas moléculas rojas veloces y una curva muy ancha." : "Temperatura baja: la mayoría de moléculas son lentas y se agrupan cerca de la izquierda.",
    draw: dibujarMaxwellBoltzmann
  },
  {
    id: "fis_optica_lentes", materia: "fisica", nivel: "avanzado", categoria: "Óptica",
    titulo: "Lente Convergente y Divergente", gancho: "Cómo enfocan la luz tus ojos y una cámara.",
    sliders: [
      { label: "A · Distancia focal f (+Conv / −Div)", min: -3.5, max: 3.5, step: 0.2, val: 1.8 },
      { label: "B · Distancia del objeto", min: 1.2, max: 5.5, step: 0.1, val: 3.6 },
      { label: "C · Altura del objeto", min: 0.8, max: 2.4, step: 0.1, val: 1.6 }
    ],
    formula: (A, B) => `1/f = 1/dₒ + 1/dᵢ   |   f=${fmt(A, 1)}, dₒ=${fmt(B, 1)}`,
    explicacion: "Una lente convergente (f>0) junta los rayos de luz; una divergente (f<0) los separa. Dependiendo de dónde pongas el objeto, la imagen se voltea o se agranda.",
    ejemplo: "Lentes para corregir miopía (divergentes) o hipermetropía (convergentes), lupas y telescopios.",
    lectura: (A, B) => A < 0 ? "Lente divergente: siempre crea una imagen virtual, derecha y más pequeña." : (B > A ? "Objeto fuera del foco: la lente forma una imagen real e invertida al otro lado." : "Objeto dentro del foco: ¡funciona como una lupa gigante!"),
    draw: dibujarLentesOptica
  },
  {
    id: "fis_optica_difraccion", materia: "fisica", nivel: "avanzado", categoria: "Óptica",
    titulo: "Difracción por una Rendija", gancho: "La luz se dobla al pasar por huecos pequeños.",
    sliders: [
      { label: "A · Ancho de la abertura (a)", min: 0.6, max: 3.0, step: 0.1, val: 1.3 },
      { label: "B · Longitud de onda (λ)", min: 0.6, max: 2.2, step: 0.1, val: 1.2 },
      { label: "C · Velocidad de onda", min: 0.4, max: 2.5, step: 0.1, val: 1.2 }
    ],
    formula: (A, B) => `I(θ) = I₀ · [sen(β)/β]²   |   β = (π·${fmt(A, 1)}·senθ)/${fmt(B, 1)}`,
    explicacion: "Cuando una onda pasa por una rendija estrecha, se abre en abanico y crea un gran pico brillante al centro rodeado de lóbulos pequeños.",
    ejemplo: "Los reflejos arcoíris en un CD/DVD y el límite de nitidez de los microscopios y telescopios.",
    lectura: (A) => A < 1.1 ? "¡Efecto sorprendente! Al hacer la abertura muy angosta, el pico central se vuelve mucho más ancho." : "Con abertura ancha, la luz pasa más concentrada en un haz delgado.",
    draw: dibujarDifraccion
  },
  {
    id: "fis_estado_solido", materia: "fisica", nivel: "avanzado", categoria: "Física del Estado Sólido",
    titulo: "Red Cristalina Vibrando (Fonones)", gancho: "Los sólidos nunca están realmente quietos.",
    sliders: [
      { label: "A · Energía térmica (Amplitud)", min: 0.2, max: 1.8, step: 0.1, val: 0.9 },
      { label: "B · Frecuencia de vibración", min: 0.4, max: 2.5, step: 0.1, val: 1.2 },
      { label: "C · Longitud de onda (k)", min: 0.3, max: 2.2, step: 0.1, val: 1.0 }
    ],
    formula: (A, B, C) => `u(n,t) = ${fmt(A, 1)} · sen(${fmt(C, 1)}na - ${fmt(B, 1)}ωt)`,
    explicacion: "Dentro de un metal o cristal, los átomos están unidos como por resortes invisibles y se pasan olas de vibración (fonones) que transportan el calor y el sonido.",
    ejemplo: "Por qué el diamante conduce tan bien el calor y cómo funcionan los semiconductores de microchips.",
    lectura: (A) => A > 1.3 ? "Vibración intensa (sólido caliente): cerca de la temperatura de fusión los átomos se agitan muchísimo." : "Vibración ordenada propagando ondas elásticas por la red.",
    draw: dibujarRedCristalina
  },
  {
    id: "fis_astro_orbitas", materia: "fisica", nivel: "avanzado", categoria: "Astrofísica",
    titulo: "Órbitas Planetarias (Leyes de Kepler)", gancho: "Más cerca del Sol, más rápido viaja el planeta.",
    sliders: [
      { label: "A · Tamaño de órbita (a)", min: 1.8, max: 3.4, step: 0.1, val: 2.7 },
      { label: "B · Excentricidad (e)", min: 0.0, max: 0.72, step: 0.02, val: 0.48 },
      { label: "C · Ritmo orbital", min: 0.4, max: 2.5, step: 0.1, val: 1.1 }
    ],
    formula: (A, B) => `T² ∝ a³  |  a = ${fmt(A, 1)} UA, excentricidad e = ${fmt(B, 2)}`,
    explicacion: "El Sol no está en el centro exacto sino en un foco. La 2ª Ley de Kepler dice que el planeta barre áreas iguales en tiempos iguales, así que acelera al pasar cerca del Sol.",
    ejemplo: "La órbita de la Tierra (casi circular, e=0.017) comparada con la del cometa Halley (muy alargada).",
    lectura: (A, B) => B < 0.1 ? "Órbita casi circular: velocidad casi constante todo el año." : "Órbita elíptica marcada: mira cómo se dispara el planeta al rozar el Sol.",
    draw: dibujarOrbitasKepler
  },
  {
    id: "fis_astro_expansion", materia: "fisica", nivel: "avanzado", categoria: "Astrofísica",
    titulo: "Expansión del Universo (Ley de Hubble)", gancho: "El espacio mismo se estira entre galaxias.",
    sliders: [
      { label: "A · Constante de Hubble (H₀)", min: 0.3, max: 2.4, step: 0.1, val: 1.1 },
      { label: "B · Límite de expansión", min: 1.2, max: 3.2, step: 0.2, val: 2.2 },
      { label: "C · Número de galaxias", min: 16, max: 52, step: 2, val: 34 }
    ],
    formula: (A) => `v = H₀ · d   (Tasa relativa H₀ = ${fmt(A, 1)})`,
    explicacion: "Las galaxias no vuelan a través de un espacio quieto: es la cuadrícula del espacio la que se estira, como pasas en un pan que crece en el horno. Entre más lejos están, más rápido se alejan.",
    ejemplo: "El corrimiento al rojo (Redshift) que midió Edwin Hubble y observa hoy el telescopio James Webb.",
    lectura: (A) => `Las galaxias más lejanas cambian de azul a rojo intenso porque su luz se estira con el espacio.`,
    draw: dibujarExpansionUniverso
  }
];

// ==========================================================================
// 5. MODO FÁCIL (SIN FÓRMULAS AL INICIO — PURAS ANALOGÍAS)
// ==========================================================================

const MODO_FACIL_TARJETAS = [
  {
    icono: "⚽",
    titulo: "La parábola es un balón",
    desc: "Cuando pateas un balón hacia arriba, la gravedad lo curva formando exactamente una función cuadrática. Subir o bajar el número 'a' solo cambia qué tan alto y cerrado es el tiro.",
    temaId: "mat_cuadratica"
  },
  {
    icono: "🎵",
    titulo: "El seno es música",
    desc: "Cada nota que escuchas en tus audífonos es aire vibrando en forma de onda seno. Más amplitud significa más volumen; más frecuencia significa una nota más aguda.",
    temaId: "mat_trig_seno"
  },
  {
    icono: "🚗",
    titulo: "La derivada es velocidad",
    desc: "Olvida los símbolos raros: derivar simplemente pregunta '¿qué tan rápido está cambiando esto justo ahora?'. Como mirar la aguja del velocímetro de un auto.",
    temaId: "mat_derivada"
  },
  {
    icono: "🚿",
    titulo: "El circuito es una manguera",
    desc: "La batería es la presión del agua, los cables son la manguera y la resistencia es apretarla con el dedo. Si la aprietas mucho, pasa menos agua y el foco brilla menos.",
    temaId: "fis_circuito_ohm"
  },
  {
    icono: "🎲",
    titulo: "La cuántica es probabilidad",
    desc: "En el mundo diminuto de los átomos, un electrón no está en un puntito fijo como canica: es una nube de probabilidades que vibra como onda.",
    temaId: "fis_particula_caja"
  },
  {
    icono: "☕",
    titulo: "La termo es tu café",
    desc: "Cuando dejas un café hirviendo sobre la mesa, cede su calor al aire hasta quedar tibio. Nunca verás que una taza tibia se caliente sola: esa es la esencia de la termodinámica.",
    temaId: "fis_termo_cafe"
  },
  {
    icono: "🏊",
    titulo: "La integral es llenar una piscina",
    desc: "Si quieres saber cuánta área hay bajo una forma curva, solo la llenas de rectángulos delgaditos y sumas todos. ¡Eso es integrar!",
    temaId: "mat_integral"
  },
  {
    icono: "🔔",
    titulo: "La campana de Gauss está en todos lados",
    desc: "Estaturas, calificaciones, tiempos de llegada: cuando muchas causas pequeñas se suman al azar, la mayoría cae al centro formando una campana.",
    temaId: "mat_prob_gauss"
  },
  {
    icono: "🍩",
    titulo: "Una dona es igual a una taza",
    desc: "En topología no importa el tamaño sino los agujeros. Como la dona y el asa de tu taza tienen un solo agujero, puedes moldear una en la otra sin romperla.",
    temaId: "mat_topo_toro"
  }
];

// ==========================================================================
// 6. QUIZ / RETO VISUAL (5 PREGUNTAS CON EXPLICACIÓN ANIMADA EN VIVO)
// ==========================================================================

const PREGUNTAS_QUIZ = [
  {
    pregunta: "1. Si subo la 'a' en y = ax² (por ejemplo de 0.5 a 3), ¿qué pasa con la parábola?",
    opciones: [
      "Se hace más ancha y plana.",
      "Se hace más angosta y empinada (se cierra hacia arriba).",
      "Se mueve hacia la derecha sin cambiar de forma.",
      "Se convierte en una línea recta."
    ],
    correcta: 1,
    explicacion: "¡Exacto! Multiplicar x² por un número 'a' más grande hace que Y crezca mucho más rápido, cerrando la 'U' como un vaso angosto.",
    caption: "Observa cómo al aumentar 'a' de 0.3 a 3.0 la parábola se estrecha animadamente.",
    dibujarDemo: (ctx, W, H, t, p) => {
      limpiarCanvas(ctx, W, H, p);
      const { toX, toY } = dibujarPlano(ctx, W, H, -5, 5, -1, 10, p, { labelX: "x", labelY: "y" });
      const a = 0.3 + 2.7 * ((Math.sin(t * 1.4) + 1) * 0.5);
      dibujarCurva(ctx, (x) => 0.4 * x * x, -5, 5, toX, toY, p.muted, 2);
      dibujarCurva(ctx, (x) => a * x * x, -5, 5, toX, toY, p.cyan, 3.6);
      dibujarHUD(ctx, 64, 16, [`a = ${fmt(a, 2)} (subiendo y bajando)`, `Gris: a = 0.4 | Cian: y = ${fmt(a, 2)}x²`], p);
    }
  },
  {
    pregunta: "2. En una onda sonora y = A·sen(B·x), ¿qué notas si aumentas mucho el valor de B?",
    opciones: [
      "La onda se estira y se vuelve más lenta.",
      "Las crestas se juntan más (mayor frecuencia / sonido más agudo).",
      "La onda sube más alto pero mantiene el mismo ancho.",
      "La onda desaparece."
    ],
    correcta: 1,
    explicacion: "B controla la frecuencia: cuantas más repeticiones caben en el mismo espacio, más agudo se escucha el sonido.",
    caption: "Mira cómo al subir B caben muchas más ondas en la misma pantalla.",
    dibujarDemo: (ctx, W, H, t, p) => {
      limpiarCanvas(ctx, W, H, p);
      const { toX, toY } = dibujarPlano(ctx, W, H, 0, 10, -2.5, 2.5, p, { labelX: "x", labelY: "sen(Bx)" });
      const B = 0.8 + 2.8 * ((Math.sin(t * 1.1) + 1) * 0.5);
      dibujarCurva(ctx, (x) => 1.6 * Math.sin(B * x - t * 2), 0, 10, toX, toY, p.purple, 3.5);
      dibujarHUD(ctx, 64, 16, [`Frecuencia B = ${fmt(B, 2)}`, B > 2.2 ? "Ondas muy juntas (Agudo)" : "Ondas separadas (Grave)"], p);
    }
  },
  {
    pregunta: "3. Si la recta tangente (derivada) en un punto de una montaña rusa está completamente horizontal, ¿qué significa?",
    opciones: [
      "El carrito va en caída libre vertical.",
      "La derivada vale 0: estás justo en una cima o en el fondo de un valle.",
      "La derivada vale infinito.",
      "La función dejó de existir."
    ],
    correcta: 1,
    explicacion: "Cuando la inclinación es cero (horizontal), el cambio instantáneo se detiene un momento: es un punto máximo (cima) o mínimo (valle).",
    caption: "Fíjate cómo la tangente se pinta de dorado (f' = 0) justo al llegar a la cima.",
    dibujarDemo: (ctx, W, H, t, p) => {
      limpiarCanvas(ctx, W, H, p);
      const { toX, toY } = dibujarPlano(ctx, W, H, -4, 4, -2, 6, p, { labelX: "x", labelY: "f(x)" });
      const f = (x) => 4.2 - 0.5 * x * x;
      const df = (x) => -x;
      dibujarCurva(ctx, f, -4, 4, toX, toY, p.cyan, 3.2);
      const xm = Math.sin(t * 1.1) * 2.4;
      const m = df(xm);
      const col = Math.abs(m) < 0.25 ? p.gold : (m > 0 ? p.green : p.accent);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(toX(xm - 1.4), toY(f(xm) - m * 1.4));
      ctx.lineTo(toX(xm + 1.4), toY(f(xm) + m * 1.4));
      ctx.stroke();
      dibujarPunto(ctx, toX(xm), toY(f(xm)), 8, col);
      dibujarHUD(ctx, 64, 16, [`Pendiente f'(x) = ${fmt(m, 2)}`, Math.abs(m) < 0.25 ? "¡CIMA! Tangente horizontal" : "Subiendo o bajando"], p);
    }
  },
  {
    pregunta: "4. En un circuito simple (V = I·R), si duplicas la resistencia R sin cambiar la batería V, ¿qué pasa con la corriente?",
    opciones: [
      "La corriente se duplica y el foco brilla más.",
      "La corriente baja a la mitad y el foco brilla menos.",
      "No cambia nada porque el voltaje es el mismo.",
      "La corriente se invierte de dirección."
    ],
    correcta: 1,
    explicacion: "Como I = V / R, resistencia y corriente son inversas: si aprietas la manguera al doble, pasa la mitad de corriente.",
    caption: "Comparación en vivo: poca resistencia (brillo fuerte) vs resistencia doble (menos brillo).",
    dibujarDemo: (ctx, W, H, t, p) => {
      const rDin = 4 + 8 * ((Math.sin(t * 1.3) + 1) * 0.5);
      dibujarCircuitoOhm(ctx, W, H, t, 12, rDin, 1, p);
    }
  },
  {
    pregunta: "5. En un péndulo sin fricción, cuando la esfera pasa por el punto más bajo de su arco, ¿cómo está su energía?",
    opciones: [
      "100% Energía Potencial y velocidad cero.",
      "100% Energía Cinética (máxima velocidad) y mínima altura.",
      "Toda la energía desapareció temporalmente.",
      "Ambas energías valen cero."
    ],
    correcta: 1,
    explicacion: "Al llegar al punto más bajo toda la altura (Energía Potencial) se convirtió en rapidez (Energía Cinética).",
    caption: "Mira las barras Ep y Ec intercambiándose en el péndulo en tiempo real.",
    dibujarDemo: (ctx, W, H, t, p) => {
      dibujarPendulo(ctx, W, H, t, 1.4, 42, 9.8, p);
    }
  }
];

// ==========================================================================
// 7. CONTROLADOR DE ESTADO, INTERFAZ Y BUCLE requestAnimationFrame
// ==========================================================================

const appState = {
  pestana: "matematicas",
  materia: "matematicas",
  nivel: "basico",
  temaActual: TEMAS[0],
  A: 1.2,
  B: 1.0,
  C: 1.0,
  animando: true,
  tiempo: 0,
  ultimoFrame: 0,
  quizIndice: 0,
  quizPuntaje: 0,
  quizRespondido: false
};

// Referencias al DOM
const dom = {};

function cacheDOM() {
  dom.buscador = document.getElementById("buscador-temas");
  dom.resultados = document.getElementById("resultados-busqueda");
  dom.btnTema = document.getElementById("btn-tema");
  dom.iconoTema = document.getElementById("icono-tema");
  dom.textoTema = document.getElementById("texto-tema");
  dom.tabs = document.querySelectorAll(".tab-btn");
  dom.panelSim = document.getElementById("panel-simulador");
  dom.panelFacil = document.getElementById("panel-facil");
  dom.panelQuiz = document.getElementById("panel-quiz");
  dom.heroTitulo = document.getElementById("hero-titulo");
  dom.heroDesc = document.getElementById("hero-descripcion");
  dom.countMat = document.getElementById("count-mat");
  dom.countFis = document.getElementById("count-fis");
  dom.statTotal = document.getElementById("stat-total");

  dom.etiquetaMateria = document.getElementById("etiqueta-materia");
  dom.etiquetaNivel = document.getElementById("etiqueta-nivel");
  dom.selectNivel = document.getElementById("select-nivel");
  dom.selectTema = document.getElementById("select-tema");

  dom.sliders = [
    { input: document.getElementById("slider-a"), label: document.getElementById("label-a"), out: document.getElementById("val-a"), key: "A" },
    { input: document.getElementById("slider-b"), label: document.getElementById("label-b"), out: document.getElementById("val-b"), key: "B" },
    { input: document.getElementById("slider-c"), label: document.getElementById("label-c"), out: document.getElementById("val-c"), key: "C" }
  ];

  dom.btnAnimar = document.getElementById("btn-animar");
  dom.btnReiniciar = document.getElementById("btn-reiniciar");
  dom.tituloTema = document.getElementById("titulo-tema");
  dom.subtituloTema = document.getElementById("subtitulo-tema");
  dom.puntoEstado = document.getElementById("punto-estado");
  dom.textoEstado = document.getElementById("texto-estado");
  dom.canvas = document.getElementById("canvas-principal");
  dom.ctx = dom.canvas.getContext("2d");
  dom.formulaVivo = document.getElementById("formula-vivo");
  dom.explicacionSimple = document.getElementById("explicacion-simple");
  dom.ejemploReal = document.getElementById("ejemplo-real");
  dom.lecturaVivo = document.getElementById("lectura-vivo");

  dom.tituloCatalogo = document.getElementById("titulo-catalogo");
  dom.contadorCatalogo = document.getElementById("contador-catalogo");
  dom.gridTemas = document.getElementById("grid-temas");
  dom.gridFacil = document.getElementById("grid-modo-facil");

  dom.quizPaso = document.getElementById("quiz-paso");
  dom.quizPuntaje = document.getElementById("quiz-puntaje");
  dom.quizProgreso = document.getElementById("quiz-progreso-fill");
  dom.quizPregunta = document.getElementById("quiz-pregunta");
  dom.quizOpciones = document.getElementById("quiz-opciones");
  dom.quizFeedback = document.getElementById("quiz-feedback");
  dom.quizFbTitulo = document.getElementById("quiz-feedback-titulo");
  dom.quizFbTexto = document.getElementById("quiz-feedback-texto");
  dom.btnQuizSig = document.getElementById("btn-quiz-siguiente");
  dom.btnQuizReset = document.getElementById("btn-quiz-reiniciar");
  dom.canvasQuiz = document.getElementById("canvas-quiz");
  dom.ctxQuiz = dom.canvasQuiz.getContext("2d");
  dom.quizCaption = document.getElementById("quiz-caption");
}

function normalizarTexto(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function nombreNivel(n) {
  if (n === "basico") return "Básico / Propedéutico";
  if (n === "intermedio") return "Intermedio / Tronco Común";
  return "Avanzado / Especialidad";
}

function obtenerTemasFiltrados(materia, nivel) {
  return TEMAS.filter((t) => t.materia === materia && t.nivel === nivel);
}

/**
 * Actualiza el selector de temas y la cuadrícula de tarjetas del nivel actual.
 */
function renderizarListaTemas(seleccionarId = null) {
  const lista = obtenerTemasFiltrados(appState.materia, appState.nivel);
  dom.selectTema.innerHTML = "";
  dom.gridTemas.innerHTML = "";

  lista.forEach((tema) => {
    const opt = document.createElement("option");
    opt.value = tema.id;
    opt.textContent = `${tema.categoria} — ${tema.titulo}`;
    dom.selectTema.appendChild(opt);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "topic-chip-card";
    card.dataset.temaId = tema.id;
    card.innerHTML = `
      <div class="topic-chip-top">
        <span class="topic-chip-cat">${tema.categoria}</span>
        <span aria-hidden="true">▶</span>
      </div>
      <span class="topic-chip-name">${tema.titulo}</span>
      <span class="topic-chip-hook">${tema.gancho}</span>
    `;
    card.addEventListener("click", () => {
      cargarTema(tema);
      dom.panelSim.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    dom.gridTemas.appendChild(card);
  });

  dom.tituloCatalogo.textContent = `${appState.materia === "matematicas" ? "Matemáticas" : "Física"} · ${nombreNivel(appState.nivel)}`;
  dom.contadorCatalogo.textContent = `${lista.length} temas animados`;

  const elegido = lista.find((t) => t.id === seleccionarId) || lista[0];
  if (elegido) cargarTema(elegido);
}

/**
 * Carga un tema específico en el simulador y configura sus 3 sliders A, B, C.
 */
function cargarTema(tema) {
  appState.temaActual = tema;
  appState.materia = tema.materia;
  appState.nivel = tema.nivel;
  appState.tiempo = 0;

  dom.selectNivel.value = tema.nivel;
  dom.selectTema.value = tema.id;
  dom.etiquetaMateria.textContent = tema.materia === "matematicas" ? "Matemáticas" : "Física";
  dom.etiquetaNivel.textContent = nombreNivel(tema.nivel);
  dom.tituloTema.textContent = tema.titulo;
  dom.subtituloTema.textContent = `${tema.categoria} · ${nombreNivel(tema.nivel)}`;
  dom.explicacionSimple.textContent = tema.explicacion;
  dom.ejemploReal.textContent = tema.ejemplo;
  dom.canvas.setAttribute("aria-label", `Animación interactiva de ${tema.titulo}`);

  // Configurar sliders A, B, C
  tema.sliders.forEach((cfg, idx) => {
    const s = dom.sliders[idx];
    s.label.textContent = cfg.label;
    s.input.min = cfg.min;
    s.input.max = cfg.max;
    s.input.step = cfg.step;
    s.input.value = cfg.val;
    appState[s.key] = Number(cfg.val);
    s.out.textContent = fmt(cfg.val, cfg.step < 0.1 ? 2 : (cfg.step < 1 ? 1 : 0));
  });

  // Resaltar tarjeta activa en el catálogo rápido
  dom.gridTemas.querySelectorAll(".topic-chip-card").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.temaId === tema.id);
  });

  actualizarTextosEnVivo();
  dibujarEscenaActual();
}

/**
 * Actualiza fórmula y lectura interpretada sin recargar.
 */
function actualizarTextosEnVivo() {
  const t = appState.temaActual;
  dom.formulaVivo.textContent = t.formula(appState.A, appState.B, appState.C);
  dom.lecturaVivo.textContent = t.lectura(appState.A, appState.B, appState.C);
}

/**
 * Dibuja un fotograma del tema actual.
 */
function dibujarEscenaActual() {
  const p = getPalette();
  appState.temaActual.draw(
    dom.ctx,
    dom.canvas.width,
    dom.canvas.height,
    appState.tiempo,
    appState.A,
    appState.B,
    appState.C,
    p
  );
}

/**
 * Cambia entre las 4 pestañas principales con transición fade-in.
 */
function cambiarPestana(nueva) {
  appState.pestana = nueva;
  dom.tabs.forEach((btn) => {
    const active = btn.dataset.tab === nueva;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  const esSim = nueva === "matematicas" || nueva === "fisica";
  dom.panelSim.hidden = !esSim;
  dom.panelFacil.hidden = nueva !== "facil";
  dom.panelQuiz.hidden = nueva !== "quiz";

  if (esSim) {
    appState.materia = nueva;
    dom.panelSim.setAttribute("aria-labelledby", nueva === "matematicas" ? "tab-matematicas" : "tab-fisica");
    dom.heroTitulo.textContent = nueva === "matematicas"
      ? "Entiende Matemáticas viendo cómo se mueven"
      : "Comprende la Física experimentando en vivo";
    dom.heroDesc.textContent = nueva === "matematicas"
      ? "Mueve los deslizadores A, B y C y observa en tiempo real cómo cambia la curva, la fórmula y su sentido cotidiano."
      : "Cambia masas, fuerzas, voltajes o temperaturas y observa las leyes de la naturaleza animadas al instante.";
    renderizarListaTemas();
  } else if (nueva === "facil") {
    dom.heroTitulo.textContent = "Modo Fácil: primero entiendes la idea, luego la fórmula";
    dom.heroDesc.textContent = "Elige cualquier analogía de la vida diaria y salta directo a su animación interactiva.";
  } else if (nueva === "quiz") {
    dom.heroTitulo.textContent = "Quiz / Reto Visual de Ciencias Básicas";
    dom.heroDesc.textContent = "Pon a prueba tu intuición visual en 5 preguntas con demostraciones animadas.";
    renderizarPreguntaQuiz();
  }
}

/**
 * Salta desde Modo Fácil o el Buscador directamente a cualquier tema por ID.
 */
function abrirTemaPorId(temaId) {
  const tema = TEMAS.find((t) => t.id === temaId);
  if (!tema) return;
  appState.materia = tema.materia;
  appState.nivel = tema.nivel;
  dom.selectNivel.value = tema.nivel;

  // Activar pestaña correspondiente sin sobreescribir el tema elegido
  appState.pestana = tema.materia;
  dom.tabs.forEach((btn) => {
    const active = btn.dataset.tab === tema.materia;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  dom.panelSim.hidden = false;
  dom.panelFacil.hidden = true;
  dom.panelQuiz.hidden = true;

  renderizarListaTemas(tema.id);
  dom.panelSim.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Construye las tarjetas de Modo Fácil.
 */
function renderizarModoFacil() {
  dom.gridFacil.innerHTML = "";
  MODO_FACIL_TARJETAS.forEach((item) => {
    const card = document.createElement("article");
    card.className = "easy-card";
    card.innerHTML = `
      <div>
        <div class="easy-icon" role="img" aria-label="${item.titulo}">${item.icono}</div>
        <h3 class="easy-title">${item.titulo}</h3>
        <p class="easy-desc">${item.desc}</p>
      </div>
      <div>
        <button type="button" class="btn-pill btn-primary">▶ Ver animación</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => abrirTemaPorId(item.temaId));
    dom.gridFacil.appendChild(card);
  });
}

/**
 * Renderiza la pregunta actual del Quiz / Reto.
 */
function renderizarPreguntaQuiz() {
  const total = PREGUNTAS_QUIZ.length;
  const q = PREGUNTAS_QUIZ[appState.quizIndice];
  appState.quizRespondido = false;

  dom.quizPaso.textContent = `Pregunta ${appState.quizIndice + 1} de ${total}`;
  dom.quizPuntaje.textContent = `Puntaje: ${appState.quizPuntaje} / ${total}`;
  dom.quizProgreso.style.width = `${((appState.quizIndice + 1) / total) * 100}%`;
  dom.quizPregunta.textContent = q.pregunta;
  dom.quizCaption.textContent = "Elige una respuesta para confirmar con la animación en vivo.";
  dom.quizFeedback.hidden = true;
  dom.quizFeedback.className = "quiz-feedback";
  dom.btnQuizSig.hidden = true;

  dom.quizOpciones.innerHTML = "";
  q.opciones.forEach((op, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.textContent = `${String.fromCharCode(65 + idx)}) ${op}`;
    btn.addEventListener("click", () => evaluarRespuestaQuiz(idx, btn));
    dom.quizOpciones.appendChild(btn);
  });
}

function evaluarRespuestaQuiz(indiceElegido, btnElegido) {
  if (appState.quizRespondido) return;
  appState.quizRespondido = true;

  const q = PREGUNTAS_QUIZ[appState.quizIndice];
  const botones = dom.quizOpciones.querySelectorAll(".quiz-option-btn");
  botones.forEach((b, i) => {
    b.disabled = true;
    if (i === q.correcta) b.classList.add("correct");
  });

  const acierto = indiceElegido === q.correcta;
  if (acierto) {
    appState.quizPuntaje++;
    dom.quizFeedback.classList.add("ok");
    dom.quizFbTitulo.textContent = "✅ ¡Correcto!";
  } else {
    btnElegido.classList.add("wrong");
    dom.quizFeedback.classList.add("bad");
    dom.quizFbTitulo.textContent = "❌ Casi, mira la explicación animada:";
  }

  dom.quizFbTexto.textContent = q.explicacion;
  dom.quizCaption.textContent = q.caption;
  dom.quizFeedback.hidden = false;
  dom.quizPuntaje.textContent = `Puntaje: ${appState.quizPuntaje} / ${PREGUNTAS_QUIZ.length}`;

  if (appState.quizIndice < PREGUNTAS_QUIZ.length - 1) {
    dom.btnQuizSig.textContent = "Siguiente pregunta →";
    dom.btnQuizSig.hidden = false;
  } else {
    dom.btnQuizSig.hidden = true;
    dom.quizFbTexto.textContent += ` 🏆 ¡Reto completado con ${appState.quizPuntaje} de ${PREGUNTAS_QUIZ.length} aciertos!`;
  }
}

/**
 * Configura el buscador interactivo del header sticky.
 */
function configurarBuscador() {
  dom.buscador.addEventListener("input", () => {
    const q = normalizarTexto(dom.buscador.value.trim());
    if (!q) {
      dom.resultados.hidden = true;
      dom.buscador.setAttribute("aria-expanded", "false");
      return;
    }

    const coincidencias = TEMAS.filter((t) => {
      const hay = normalizarTexto(`${t.titulo} ${t.categoria} ${t.explicacion} ${t.ejemplo}`);
      return hay.includes(q);
    }).slice(0, 10);

    dom.resultados.innerHTML = "";
    if (coincidencias.length === 0) {
      dom.resultados.innerHTML = `<li class="search-empty">No se encontraron temas para "${dom.buscador.value}"</li>`;
    } else {
      coincidencias.forEach((t) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "search-result-item";
        btn.innerHTML = `
          <span><strong>${t.titulo}</strong><br><small>${t.categoria}</small></span>
          <span class="search-result-meta">${t.materia === "matematicas" ? "Mate" : "Física"} · ${t.nivel}</span>
        `;
        btn.addEventListener("click", () => {
          dom.buscador.value = "";
          dom.resultados.hidden = true;
          dom.buscador.setAttribute("aria-expanded", "false");
          abrirTemaPorId(t.id);
        });
        li.appendChild(btn);
        dom.resultados.appendChild(li);
      });
    }
    dom.resultados.hidden = false;
    dom.buscador.setAttribute("aria-expanded", "true");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      dom.resultados.hidden = true;
      dom.buscador.setAttribute("aria-expanded", "false");
    }
  });
}

/**
 * Configura el interruptor de modo Oscuro / Claro.
 */
function configurarTemaVisual() {
  const aplicar = (modo) => {
    document.documentElement.dataset.theme = modo;
    const esClaro = modo === "light";
    dom.iconoTema.textContent = esClaro ? "🌙" : "☀️";
    dom.textoTema.textContent = esClaro ? "Modo Oscuro" : "Modo Claro";
    dom.btnTema.setAttribute("aria-pressed", String(esClaro));
    try { localStorage.setItem("visualmath_theme", modo); } catch (_) {}
    dibujarEscenaActual();
  };

  let inicial = "dark";
  try {
    const guardado = localStorage.getItem("visualmath_theme");
    if (guardado === "light" || guardado === "dark") inicial = guardado;
  } catch (_) {}
  aplicar(inicial);

  dom.btnTema.addEventListener("click", () => {
    const actual = document.documentElement.dataset.theme;
    aplicar(actual === "dark" ? "light" : "dark");
  });
}

/**
 * Bucle principal a 60 FPS con requestAnimationFrame.
 */
function bucleAnimacion(timestamp) {
  if (!appState.ultimoFrame) appState.ultimoFrame = timestamp;
  const dt = Math.min(0.05, (timestamp - appState.ultimoFrame) / 1000);
  appState.ultimoFrame = timestamp;

  if (appState.animando) {
    appState.tiempo += dt;
  }

  if (appState.pestana === "matematicas" || appState.pestana === "fisica") {
    dibujarEscenaActual();
  } else if (appState.pestana === "quiz") {
    const q = PREGUNTAS_QUIZ[appState.quizIndice];
    q.dibujarDemo(dom.ctxQuiz, dom.canvasQuiz.width, dom.canvasQuiz.height, timestamp / 1000, getPalette());
  }

  requestAnimationFrame(bucleAnimacion);
}

/**
 * Inicialización general al cargar la página.
 */
function iniciarVisualMath() {
  cacheDOM();

  // Contadores reales dinámicos
  const totalMat = TEMAS.filter((t) => t.materia === "matematicas").length;
  const totalFis = TEMAS.filter((t) => t.materia === "fisica").length;
  dom.countMat.textContent = String(totalMat);
  dom.countFis.textContent = String(totalFis);
  dom.statTotal.textContent = String(TEMAS.length);

  // Eventos de pestañas
  dom.tabs.forEach((btn) => {
    btn.addEventListener("click", () => cambiarPestana(btn.dataset.tab));
  });

  // Selector de nivel y tema
  dom.selectNivel.addEventListener("change", () => {
    appState.nivel = dom.selectNivel.value;
    renderizarListaTemas();
  });

  dom.selectTema.addEventListener("change", () => {
    const elegido = TEMAS.find((t) => t.id === dom.selectTema.value);
    if (elegido) cargarTema(elegido);
  });

  // Sliders en tiempo real
  dom.sliders.forEach((s) => {
    s.input.addEventListener("input", () => {
      const val = Number(s.input.value);
      appState[s.key] = val;
      const step = Number(s.input.step);
      s.out.textContent = fmt(val, step < 0.1 ? 2 : (step < 1 ? 1 : 0));
      actualizarTextosEnVivo();
      dibujarEscenaActual();
    });
  });

  // Botón Animar / Pausar
  dom.btnAnimar.addEventListener("click", () => {
    appState.animando = !appState.animando;
    dom.btnAnimar.innerHTML = appState.animando
      ? '<span aria-hidden="true">⏸</span> Pausar'
      : '<span aria-hidden="true">▶</span> Animar';
    dom.btnAnimar.setAttribute("aria-pressed", String(appState.animando));
    dom.puntoEstado.classList.toggle("paused", !appState.animando);
    dom.textoEstado.textContent = appState.animando ? "Animando" : "Pausado";
  });

  // Botón Reiniciar
  dom.btnReiniciar.addEventListener("click", () => {
    estadoPenduloDoble.lastParams = "";
    cargarTema(appState.temaActual);
  });

  // Botones del Quiz
  dom.btnQuizSig.addEventListener("click", () => {
    if (appState.quizIndice < PREGUNTAS_QUIZ.length - 1) {
      appState.quizIndice++;
      renderizarPreguntaQuiz();
    }
  });

  dom.btnQuizReset.addEventListener("click", () => {
    appState.quizIndice = 0;
    appState.quizPuntaje = 0;
    renderizarPreguntaQuiz();
  });

  configurarBuscador();
  configurarTemaVisual();
  renderizarModoFacil();
  renderizarListaTemas();
  renderizarPreguntaQuiz();

  requestAnimationFrame(bucleAnimacion);
}

document.addEventListener("DOMContentLoaded", iniciarVisualMath);
