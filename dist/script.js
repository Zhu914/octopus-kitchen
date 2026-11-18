(() => {
  "use strict";

  const canvas = document.getElementById("kitchen");
  const ctx = canvas.getContext("2d");
  const menuBox = document.getElementById("menu");
  const ticketsBox = document.getElementById("tickets");
  const ticketEmpty = document.getElementById("ticket-empty");
  const stationListBox = document.getElementById("stations");
  const activeCount = document.getElementById("active-count");
  const servedCount = document.getElementById("served-count");
  const peakState = document.getElementById("peak-state");
  const pauseBtn = document.getElementById("pause");
  const peakBtn = document.getElementById("peak");
  const resetBtn = document.getElementById("reset");
  const speedInput = document.getElementById("speed");
  const speedValue = document.getElementById("speed-value");

  const stationsData = [
    { id: 0, name: "切菜台", action: "快速切配", x: 170, y: 285, color: "#7be0ff", duration: 1.45 },
    { id: 1, name: "颠锅灶", action: "抛锅翻炒", x: 95, y: 390, color: "#ffab6b", duration: 2.15 },
    { id: 2, name: "搅汤锅", action: "画圈慢搅", x: 175, y: 505, color: "#a6f7c2", duration: 2.35 },
    { id: 3, name: "调料架", action: "撒下调味", x: 315, y: 570, color: "#ffd166", duration: 1.4 },
    { id: 4, name: "煎烤板", action: "翻面煎烤", x: 685, y: 570, color: "#ff8867", duration: 2.3 },
    { id: 5, name: "揉面案", action: "压揉面团", x: 825, y: 505, color: "#ffe7a0", duration: 1.9 },
    { id: 6, name: "摆装盘", action: "装饰摆盘", x: 905, y: 390, color: "#f3b7ff", duration: 1.65 },
    { id: 7, name: "出餐铃", action: "摇铃送客", x: 840, y: 285, color: "#c9f7ff", duration: 1.05 }
  ];

  const menuData = [
    {
      id: "inkRamen", name: "深海墨鱼面", short: "揉面起手 · 六道工序",
      steps: [
        { station: 5, label: "揉面团" },
        { station: 0, label: "切面条" },
        { station: 1, label: "颠锅拌炒" },
        { station: 3, label: "撒海盐" },
        { station: 6, label: "入碗摆面" },
        { station: 7, label: "摇铃出餐" }
      ]
    },
    {
      id: "coralSkewer", name: "珊瑚炙烧串", short: "切串起手 · 五道工序",
      steps: [
        { station: 0, label: "切串备料" },
        { station: 3, label: "抹炙烧酱" },
        { station: 4, label: "翻面煎烤" },
        { station: 6, label: "摆盘点缀" },
        { station: 7, label: "摇铃出餐" }
      ]
    },
    {
      id: "pearlSoup", name: "珍珠雾汤", short: "备料起手 · 五道工序",
      steps: [
        { station: 0, label: "切配鲜蔬" },
        { station: 2, label: "入锅慢搅" },
        { station: 3, label: "撒珍珠盐" },
        { station: 6, label: "注碗摆盘" },
        { station: 7, label: "摇铃出餐" }
      ]
    },
    {
      id: "moonBun", name: "月光蟹粉包", short: "揉皮起手 · 五道工序",
      steps: [
        { station: 5, label: "揉制面皮" },
        { station: 4, label: "翻面煎包" },
        { station: 3, label: "撒葱香油" },
        { station: 6, label: "叠层摆盘" },
        { station: 7, label: "摇铃出餐" }
      ]
    }
  ];

  const roots = [
    { x: 438, y: 340 }, { x: 433, y: 358 }, { x: 439, y: 377 }, { x: 452, y: 393 },
    { x: 548, y: 393 }, { x: 561, y: 377 }, { x: 567, y: 358 }, { x: 562, y: 340 }
  ];

  const state = {
    time: 0,
    speed: 1,
    paused: false,
    peak: false,
    peakTimer: 0,
    orderSeq: 1,
    served: 0,
    orders: [],
    flights: [],
    stations: stationsData.map((data) => ({
      ...data,
      root: roots[data.id],
      busy: null,
      queue: [],
      phase: Math.random() * Math.PI * 2,
      pauseLeft: 0,
      poof: 0,
      pressed: 0,
      hitFlash: 0,
      workPulse: 0
    })),
    particles: [],
    bubbles: [],
    fish: [],
    sweat: [],
    pointerGlow: []
  };

  const palette = {
    ink: "#0f2242",
    skin: "#f2948f",
    skinDark: "#d96c72",
    belly: "#ffd0c0",
    wood1: "#8a5334",
    wood2: "#643c25",
    brass: "#ffce6a",
    steel: "#c9d8e6",
    shadow: "rgba(2,8,18,.28)"
  };

  function makeEnvironment() {
    state.bubbles = Array.from({ length: 36 }, (_, i) => ({
      x: Math.random() * 1000,
      y: Math.random() * 680,
      r: 2 + Math.random() * 5,
      v: 14 + Math.random() * 32,
      drift: Math.random() * Math.PI * 2,
      alpha: 0.08 + Math.random() * 0.2
    }));
    state.fish = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * 1000,
      y: 105 + i * 36 + Math.random() * 20,
      len: 25 + Math.random() * 24,
      v: (i % 2 ? 1 : -1) * (15 + Math.random() * 16),
      hue: [38, 175, 205, 335][i],
      tail: Math.random() * 10,
      depth: 0.26 + i * 0.06
    }));
  }

  function orderColor(id) {
    return { inkRamen: "#5f55d9", coralSkewer: "#e2582f", pearlSoup: "#48b799", moonBun: "#e09d3a" }[id] || "#48e5ff";
  }

  function spawnOrder(dishId) {
    const dish = menuData.find((m) => m.id === dishId);
    const order = {
      id: state.orderSeq++,
      dish,
      stepIndex: 0,
      currentStation: null,
      flight: null,
      createdAt: state.time,
      servedAt: null,
      poof: 1
    };
    state.orders.push(order);
    addToStationQueue(order, dish.steps[0].station, true);
    emitBurst(stationsData[dish.steps[0].station].x, stationsData[dish.steps[0].station].y - 24, "#ffe9a8", 10);
  }

  function addToStationQueue(order, stationId, incoming = false) {
    const station = state.stations[stationId];
    order.currentStation = station;
    order.currentStepIndex = order.stepIndex;
    order.arrive = incoming ? state.time : state.time + 0.9;
    station.queue.push(order);
  }

  function startStationWork(station, order) {
    if (station.busy || !station.queue.length || station.pauseLeft > 0) return;
    const next = station.queue[0];
    if (next.arrive > state.time) return;
    station.queue.shift();
    station.busy = next;
    next.currentStation = station;
    next.stepStarted = state.time;
    next.progress = 0;
    station.workPulse = 1;
    next.begun = true;
  }

  function completeStationWork(station) {
    const order = station.busy;
    const dish = order.dish;
    const completedStep = dish.steps[order.stepIndex];
    if (completedStep.station !== station.id) return;
    order.stepIndex += 1;
    order.progress = 1;
    order.lastDoneAt = state.time;
    station.busy = null;

    if (order.stepIndex >= dish.steps.length) {
      order.status = "served";
      order.servedAt = state.time;
      state.served += 1;
      emitBurst(station.x, station.y - 35, "#9df8ff", 18);
      setTimeout(() => removeOrder(order), 2400);
    } else {
      const nextStationId = dish.steps[order.stepIndex].station;
      launchFlight(order, station.id, nextStationId);
    }
  }

  function launchFlight(order, fromId, toId) {
    const flight = {
      order,
      from: stationsData[fromId],
      to: stationsData[toId],
      t: 0,
      duration: 0.85
    };
    order.flight = flight;
    state.flights.push(flight);
    order.currentStation = state.stations[toId];
    order.arrive = state.time + flight.duration;
    state.stations[toId].queue.push(order);
  }

  function removeOrder(order) {
    const index = state.orders.indexOf(order);
    if (index >= 0) state.orders.splice(index, 1);
    for (const station of state.stations) {
      const qi = station.queue.indexOf(order);
      if (qi >= 0) station.queue.splice(qi, 1);
    }
  }

  function emitBurst(x, y, color, count = 10, spread = 55) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * 55 - 12,
        life: 0.6 + Math.random() * 0.7,
        age: 0,
        r: 1.5 + Math.random() * 3.5,
        color
      });
    }
  }

  function emitSteam(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      state.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: -18 - Math.random() * 22,
        life: 1 + Math.random() * .8,
        age: 0,
        r: 4 + Math.random() * 6,
        color: "rgba(235,255,255,.34)",
        steam: true
      });
    }
  }

  function stationTip(station, t) {
    const s = station;
    const idle = Math.sin(t * 1.5 + s.phase) * 5 + Math.cos(t * 0.8 + s.id) * 3;
    let dx = 0, dy = 0;
    const busy = !!s.busy;
    const progress = s.busy ? clamp(s.busy.progress || 0, 0, 1) : 0;
    if (s.pauseLeft > 0) {
      const pulse = Math.sin(s.pauseLeft * 15) * 5;
      dx = (500 - s.x) * .055 + pulse;
      dy = (390 - s.y) * .055 + Math.cos(s.pauseLeft * 13) * 3;
    } else if (busy) {
      if (s.id === 0) { dy = -22 + Math.abs(Math.sin(t * 8)) * 32; dx = Math.cos(t * 8) * 4; }
      if (s.id === 1) { const jump = Math.sin(progress * Math.PI * 2); dy = -26 - Math.sin(t * 4.6) * 20; dx = jump * 8; }
      if (s.id === 2) { dx = Math.cos(t * 1.9) * 13; dy = Math.sin(t * 1.9) * 8; }
      if (s.id === 3) { const shake = Math.max(0, Math.sin(t * 9)); dy = -16 - shake * 12; dx = Math.sin(t * 14) * 5; }
      if (s.id === 4) { const flip = Math.sin(t * 3.4); dy = -18 - Math.max(0, flip) * 20; dx = flip * 13; }
      if (s.id === 5) { dy = -13 + Math.abs(Math.sin(t * 3.1)) * 13; dx = Math.cos(t * 3.1) * 10; }
      if (s.id === 6) { dy = -8 + Math.sin(t * 2.6) * 5; dx = Math.cos(t * 1.7) * 7; }
      if (s.id === 7) { dy = -18 + Math.abs(Math.sin(t * 5.5)) * 20; dx = Math.cos(t * 5.5) * 4; }
    } else {
      dx = idle; dy = idle * .65;
    }
    return { x: s.x + dx, y: s.y + dy };
  }

  function cubic(p0, p1, p2, p3, u) {
    const v = 1 - u;
    return {
      x: v*v*v*p0.x + 3*v*v*u*p1.x + 3*v*u*u*p2.x + u*u*u*p3.x,
      y: v*v*v*p0.y + 3*v*v*u*p1.y + 3*v*u*u*p2.y + u*u*u*p3.y
    };
  }

  function tentaclePoints(station, tip, t) {
    const p0 = station.root;
    const between = { x: (tip.x + p0.x) / 2, y: (tip.y + p0.y) / 2 };
    const verticality = station.y > 420 ? 1 : station.y < 340 ? -1 : 0;
    const bend = Math.sin(t * 1.5 + station.phase) * 13;
    const p1 = {
      x: p0.x + (tip.x - p0.x) * .22 - Math.sign(station.x - 500) * 5,
      y: p0.y + (tip.y - p0.y) * .18 + bend * .5 + verticality * 5
    };
    const p2 = {
      x: between.x + (tip.x - between.x) * .7 + bend,
      y: between.y + (tip.y - between.y) * .62 + Math.cos(t * 1.1 + station.phase) * 8
    };
    return [p0, p1, p2, tip];
  }

  function drawTaperedPath(points, baseWidth, tipWidth, fill, stroke) {
    const left = [];
    const right = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const ang = Math.atan2(next.y - prev.y, next.x - prev.x);
      const w = (baseWidth + (tipWidth - baseWidth) * (i / (points.length - 1))) / 2;
      left.push({ x: p.x + Math.cos(ang + Math.PI / 2) * w, y: p.y + Math.sin(ang + Math.PI / 2) * w });
      right.push({ x: p.x + Math.cos(ang - Math.PI / 2) * w, y: p.y + Math.sin(ang - Math.PI / 2) * w });
    }
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function drawTentacle(station, t) {
    const tip = stationTip(station, t);
    const base = cubic(...tentaclePoints(station, tip, t), 0);
    const samples = [];
    for (let i = 0; i <= 16; i++) samples.push(cubic(...tentaclePoints(station, tip, t), i / 16));
    ctx.save();
    ctx.globalAlpha = .22;
    ctx.fillStyle = "#021022";
    drawTaperedPath(samples, 17, 5, "#021022");
    ctx.restore();
    drawTaperedPath(samples, 16, 4.4, palette.skin, palette.skinDark);
    ctx.save();
    ctx.globalAlpha = .55;
    for (let i = 2; i < samples.length - 2; i += 2) {
      const p = samples[i];
      const q = samples[i + 1];
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      const inward = Math.sign(500 - station.root.x) || 1;
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(ang + Math.PI / 2) * 3.2 * inward, p.y + Math.sin(ang + Math.PI / 2) * 3.2 * inward, 2.1, 1.3, ang, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,238,230,.7)";
      ctx.fill();
    }
    ctx.restore();
    drawTool(station, tip, t);
    station.tip = tip;
  }

  function drawTool(station, tip, t) {
    const busy = !!station.busy;
    const progress = station.busy ? clamp(station.busy.progress || 0, 0, 1) : 0;
    const faceRight = station.x > 500;
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(Math.sin(t * 1.2 + station.phase) * .08);
    if (station.pauseLeft > 0) ctx.rotate(Math.sin(t * 24) * .1);
    const order = station.busy;
    if (station.id === 0) {
      drawBoard(0, 8, faceRight);
      if (order) drawDishShape(order, order.stepIndex, .75, 0, 0, 13);
      ctx.save(); ctx.translate(10, -14 - (busy ? Math.max(0, Math.sin(t * 8)) * 25 : Math.sin(t * 2) * 3)); ctx.rotate(faceRight ? -.7 : .7);
      drawKnife(); ctx.restore();
    } else if (station.id === 1) {
      drawWok(busy ? Math.sin(t * 4.6) * .4 : Math.sin(t * 1.1) * .08);
      if (order && !(busy && Math.sin(t * 4.6) > .4)) drawDishShape(order, order.stepIndex, .7, Math.sin(t * 2) * .2, 0, 0);
      if (busy) drawTossFood(station, t, progress);
    } else if (station.id === 2) {
      drawPot(station.color, busy);
      if (order) drawDishShape(order, order.stepIndex, .55, t * (busy ? .7 : .15), 0, -4);
      ctx.save(); ctx.translate(0, -17); ctx.rotate(t * (busy ? 2.3 : .3)); drawLadle(); ctx.restore();
    } else if (station.id === 3) {
      drawShelf();
      if (order) drawDishShape(order, order.stepIndex, .58, Math.sin(t * 3) * .12, -9, 11);
      ctx.save(); ctx.translate(4, -14 - (busy ? Math.max(0, Math.sin(t * 9)) * 18 : Math.sin(t * 2) * 2)); ctx.rotate(busy ? Math.sin(t * 16) * .45 : .12); drawShaker(station.color); ctx.restore();
    } else if (station.id === 4) {
      drawGrill(busy, t);
      if (order) drawDishShape(order, order.stepIndex, .7, Math.sin(t * 3.4) * .55, 0, -2);
      ctx.save(); ctx.translate(12, -17); ctx.rotate(Math.sin(t * 3.4) * (busy ? .35 : .08)); drawTongs(); ctx.restore();
    } else if (station.id === 5) {
      drawDoughBoard();
      if (order) drawDishShape(order, order.stepIndex, .75 + Math.abs(Math.sin(t * (busy ? 3.1 : .6))) * .05, 0, 0, -2);
      ctx.save(); ctx.translate(2, -15); ctx.rotate(Math.sin(t * (busy ? 3.1 : .6)) * (busy ? .6 : .12)); drawRollingPin(); ctx.restore();
    } else if (station.id === 6) {
      drawPlateStation(station, t, busy);
    } else if (station.id === 7) {
      drawBell(station, t, busy);
    }
    ctx.restore();
  }

  function drawBoard(x, y, faceRight) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#845a35"; roundedRect(-24, -2, 48, 8, 4, true);
    ctx.fillStyle = "#6c472a"; roundedRect(-24, 4, 48, 2, 1, true);
    ctx.restore();
  }
  function drawKnife() {
    ctx.fillStyle = "#dfe9f2"; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(5, -10); ctx.lineTo(4, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#37465a"; roundedRect(-7, 0, 10, 4, 2, true);
  }
  function drawWok(rot) {
    ctx.rotate(rot);
    ctx.fillStyle = "#263444"; ctx.beginPath(); ctx.ellipse(0, 0, 27, 12, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#415569"; ctx.beginPath(); ctx.ellipse(0, 0, 27, 10, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#8e5a34"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-27, -2); ctx.lineTo(-43, -13); ctx.stroke();
  }
  function drawTossFood(station, t, progress) {
    ctx.save();
    const ang = station.busy.progress * Math.PI * 3;
    const arc = Math.sin(station.busy.progress * Math.PI);
    ctx.translate(Math.cos(ang) * 13, -18 - arc * 32 + Math.sin(t * 4.6) * 3);
    ctx.rotate(ang);
    ctx.fillStyle = "#ffbe58"; ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#7fd672"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-7 + i * 5, -2 + Math.sin(i * 3) * 3, 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (Math.sin(t * 4.6) > .8) emitSteam(station.x, station.y - 36, 1);
  }
  function drawPot(color, busy) {
    ctx.fillStyle = "#2d3c4e"; roundedRect(-24, -20, 48, 32, 7, true);
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -20, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (busy) { ctx.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 4; i++) { const a = i * 1.57; ctx.beginPath(); ctx.arc(Math.cos(a) * 12, -20 + Math.sin(a) * 3, 2.2, 0, Math.PI * 2); ctx.fill(); } }
    ctx.strokeStyle = "#7c8fa3"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, -12); ctx.lineTo(34, -17); ctx.stroke();
  }
  function drawLadle() {
    ctx.strokeStyle = "#a9bccf"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -8); ctx.stroke();
    ctx.fillStyle = "#a9bccf"; ctx.beginPath(); ctx.ellipse(0, -12, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawShelf() {
    ctx.fillStyle = "#5e3d25"; roundedRect(-25, 4, 50, 6, 3, true);
    ctx.fillStyle = "#3c5971"; roundedRect(-21, -2, 12, 6, 2, true); roundedRect(7, -2, 12, 6, 2, true);
  }
  function drawShaker(color) {
    ctx.fillStyle = "#f4f7fb"; roundedRect(-7, -11, 14, 20, 6, true);
    ctx.fillStyle = color; ctx.fillRect(-7, -4, 14, 5);
    ctx.fillStyle = "#b8c9d8"; ctx.beginPath(); ctx.arc(0, -11, 6, Math.PI, 0); ctx.fill();
  }
  function drawGrill(busy, t) {
    ctx.fillStyle = "#443b3c"; roundedRect(-29, -6, 58, 14, 4, true);
    ctx.fillStyle = "#ff7b43"; for (let i = 0; i < 5; i++) { ctx.globalAlpha = busy ? .55 + Math.sin(t * 10 + i) * .35 : .2; ctx.fillRect(-24 + i * 10, 8, 6, 8); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#2c333d"; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 12, -6); ctx.lineTo(-24 + i * 12, 8); ctx.stroke(); }
  }
  function drawTongs() {
    ctx.strokeStyle = "#d7e3ee"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(9, -6); ctx.moveTo(3, 7); ctx.lineTo(14, -2); ctx.stroke();
  }
  function drawDoughBoard() {
    ctx.fillStyle = "#966239"; roundedRect(-26, -1, 52, 9, 4, true);
    ctx.fillStyle = "#f5e0bb"; ctx.beginPath(); ctx.ellipse(0, -5, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawRollingPin() {
    ctx.fillStyle = "#b8814d"; roundedRect(-19, -4, 38, 7, 3, true);
    ctx.fillStyle = "#7c4f26"; roundedRect(-25, -3, 6, 5, 2, true); roundedRect(19, -3, 6, 5, 2, true);
  }
  function drawPlateStation(station, t, busy) {
    ctx.fillStyle = "#eef5fb"; ctx.beginPath(); ctx.ellipse(0, 4, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d3e3ef"; ctx.beginPath(); ctx.ellipse(0, 3, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    const order = station.busy;
    if (order) {
      const p = order.progress || 0;
      ctx.save(); ctx.translate(0, -3); ctx.rotate(Math.sin(t * 2.2) * .04);
      drawDishShape(order, 6, 1, .35);
      if (p > .55) { ctx.fillStyle = "#7fe089"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-11 + i * 7, -6 + Math.sin(i * 2) * 3, 1.7, 0, Math.PI * 2); ctx.fill(); } }
      ctx.restore();
    }
    ctx.strokeStyle = "#9db3c6"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(24, -16, 8, Math.PI * 1.1, Math.PI * 2.3); ctx.stroke();
  }
  function drawBell(station, t, busy) {
    const hit = station.workPulse;
    ctx.fillStyle = "#523a26"; roundedRect(-18, 5, 36, 7, 3, true);
    ctx.fillStyle = "#ffcd64"; ctx.beginPath(); ctx.moveTo(-13, 4); ctx.quadraticCurveTo(0, -24 - hit * 4, 13, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffefc4"; ctx.beginPath(); ctx.arc(0, -18 - hit * 4, 3.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#765431"; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-7, -12); ctx.stroke();
    ctx.save(); ctx.translate(-9, -18); ctx.rotate(busy ? Math.sin(t * 5.5) * .7 : Math.sin(t * .8) * .08);
    ctx.fillStyle = "#8a5d38"; roundedRect(-3, -9, 6, 16, 3, true); ctx.restore();
    if (hit > .7) { ctx.strokeStyle = "rgba(255,246,201,.75)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -12, 30 - hit * 10, -.7, .7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 30 - hit * 10, Math.PI - .7, Math.PI + .7); ctx.stroke(); }
  }

  function drawStation(station, t) {
    const x = station.x, y = station.y;
    ctx.save();
    ctx.globalAlpha = station.hitFlash > 0 ? clamp(station.hitFlash, 0, 1) * .35 : .2;
    ctx.fillStyle = station.color;
    ctx.beginPath(); ctx.ellipse(x, y + 13, 46, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(8,24,44,.78)";
    ctx.strokeStyle = "rgba(72,229,255,.24)";
    roundedRect(x - 39, y - 37, 78, 54, 15, true, true);
    ctx.fillStyle = station.color;
    ctx.beginPath(); ctx.arc(x - 32, y - 30, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "rgba(230,250,255,.96)";
    ctx.font = "700 13px ui-sans-serif, -apple-system, 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${station.id + 1}. ${station.name}`, x, y - 20);
    ctx.fillStyle = "rgba(154,192,214,.82)";
    ctx.font = "500 9px ui-sans-serif, -apple-system, 'Noto Sans SC', sans-serif";
    ctx.fillText(station.action, x, y - 8);

    if (station.queue.length) {
      ctx.save();
      ctx.fillStyle = "#ff6f7d";
      ctx.beginPath(); ctx.arc(x + 38, y - 36, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "800 11px ui-sans-serif, sans-serif"; ctx.fillText(station.queue.length, x + 38, y - 32);
      for (let i = 0; i < Math.min(3, station.queue.length); i++) {
        const order = station.queue[i];
        const px = x + 18 - i * 9;
        const py = y + 6 + i * 3;
        ctx.globalAlpha = .72 + i * .08;
        drawDishShape(order, Math.max(0, order.stepIndex - 1), .65 - i * .08, Math.sin(t * 3 + i) * .08, px, py);
      }
      ctx.restore();
    }
    if (station.pauseLeft > 0) {
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 8, 24, -Math.PI * .5, -Math.PI * .5 + (station.pauseLeft / 1.3) * Math.PI * 2); ctx.stroke();
    }
  }

  function drawChef(t) {
    const activeCountNum = state.stations.filter((s) => s.busy).length;
    const stress = clamp(activeCountNum / 4, 0, 1);
    const poked = state.stations.some((s) => s.pauseLeft > 0);
    const bob = Math.sin(t * 1.4) * 3 + stress * Math.sin(t * 9) * 2;
    ctx.save();
    ctx.fillStyle = "rgba(2,10,22,.35)";
    ctx.beginPath(); ctx.ellipse(500, 425, 95, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(500, 330 + bob);
    const skin = stress > .62 ? "#f77b78" : poked ? "#ff9c93" : palette.skin;
    ctx.fillStyle = skin;
    roundedRect(-70, -64, 140, 128, 70, true);
    ctx.beginPath(); ctx.ellipse(0, -82, 62, 57, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.beginPath(); ctx.ellipse(-20, -104, 29, 20, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = palette.belly;
    ctx.beginPath(); ctx.ellipse(0, -32, 44, 34, 0, 0, Math.PI * 2); ctx.fill();

    // Hat
    ctx.fillStyle = "#f7f2e2";
    ctx.beginPath(); ctx.ellipse(0, -131, 54, 14, 0, 0, Math.PI * 2); ctx.fill();
    roundedRect(-34, -168, 68, 42, 10, true);
    ctx.fillStyle = "#f7f2e2"; ctx.beginPath(); ctx.ellipse(0, -168, 37, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#cfd6df"; roundedRect(-35, -135, 70, 10, 5, true);

    // Eyes track busy stations
    let target = null;
    const actives = state.stations.filter((s) => s.busy);
    if (actives.length) {
      target = { x: actives.reduce((sum, s) => sum + s.x, 0) / actives.length - 500, y: actives.reduce((sum, s) => sum + s.y, 0) / actives.length - 330 };
    } else if (state.flights.length) {
      target = { x: state.flights[0].order.flight ? lerp(state.flights[0].from.x, state.flights[0].to.x, state.flights[0].t) - 500 : 0, y: -30 };
    } else {
      target = { x: Math.sin(t * .4) * 40, y: Math.cos(t * .3) * 10 - 20 };
    }
    const look = normalize(target);
    for (const sx of [-24, 24]) {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(sx, -85, 15 + stress * 1.5, poked ? 17 : 13 + stress * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#152734";
      ctx.beginPath(); ctx.arc(sx + clamp(look.x * 7, -6, 6), -85 + clamp(look.y * 4, -4, 4), 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx + clamp(look.x * 7, -6, 6) - 2, -88 + clamp(look.y * 4, -4, 4), 2.3, 0, Math.PI * 2); ctx.fill();
    }
    // Eyebrows / expression
    ctx.strokeStyle = "#7d3b44"; ctx.lineWidth = 3.2; ctx.lineCap = "round";
    ctx.beginPath();
    if (poked) { ctx.moveTo(-36, -105); ctx.lineTo(-13, -98); ctx.moveTo(13, -98); ctx.lineTo(36, -105); }
    else if (stress > .3) { ctx.moveTo(-35, -103 + stress * 3); ctx.lineTo(-13, -100 - stress * 4); ctx.moveTo(13, -100 - stress * 4); ctx.lineTo(35, -103 + stress * 3); }
    else { ctx.moveTo(-33, -102); ctx.lineTo(-14, -104); ctx.moveTo(14, -104); ctx.lineTo(33, -102); }
    ctx.stroke();

    // Mouth
    ctx.beginPath();
    if (poked) ctx.ellipse(0, -56, 11, 13, 0, 0, Math.PI * 2);
    else if (stress > .55) ctx.ellipse(0, -55, 13, 8, 0, 0, Math.PI * 2);
    else ctx.arc(0, -60, 12, .2, Math.PI - .2);
    ctx.fillStyle = "#8e3945"; ctx.fill();
    if (stress > .3) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, stress > .55 ? -58 : -56, 9, 3.5, 0, 0, Math.PI); ctx.fill();
    }

    // Sweat drops when stressed
    if (stress > .42 || poked) {
      for (let i = 0; i < (poked ? 5 : 3); i++) {
        const sx = i % 2 ? -52 : 50;
        const sy = -104 + i * 6;
        const fall = ((t * 40 + i * 18) % 36);
        ctx.fillStyle = "rgba(150,230,255,.85)";
        ctx.beginPath(); ctx.ellipse(sx, sy + fall, 3.2, 4.6, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawDishShape(order, stageIndex, scale = 1, rot = 0, px = null, py = null) {
    const x = px, y = py;
    const base = order.dish.id;
    const color = orderColor(base);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    if (base === "inkRamen") {
      if (stageIndex <= 0) { ctx.fillStyle = "#f6dfb2"; ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#d3b180"; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-9, i * 2); ctx.quadraticCurveTo(0, i * 2 + 2, 9, i * 2); ctx.stroke(); } }
      else if (stageIndex <= 2) { ctx.strokeStyle = "#ede0bd"; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-12, i * 2); ctx.quadraticCurveTo(0, i * 2 + Math.sin(i) * 3, 12, i * 2); ctx.stroke(); } ctx.fillStyle = color; ctx.beginPath(); ctx.arc(7, -3, 3, 0, Math.PI * 2); ctx.fill(); }
      else if (stageIndex <= 3) { ctx.fillStyle = "#2f3b4f"; ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ede0bd"; ctx.beginPath(); ctx.ellipse(-2, -1, 11, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffe38e"; for (let i = 0; i < 4; i++) { ctx.fillRect(-7 + i * 4, -6, 2, 1.4); } }
      else { ctx.fillStyle = "#f3f7fb"; ctx.beginPath(); ctx.ellipse(0, 0, 17, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#ece0bf"; ctx.lineWidth = 1.8; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-11, i * 2); ctx.quadraticCurveTo(0, i * 2 + 2, 11, i * 2); ctx.stroke(); } ctx.fillStyle = "#5f55d9"; ctx.beginPath(); ctx.arc(7, -3, 3.4, 0, Math.PI * 2); ctx.fill(); }
    } else if (base === "coralSkewer") {
      ctx.strokeStyle = "#8b5e36"; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-14, 2); ctx.lineTo(15, -2); ctx.stroke();
      if (stageIndex <= 0) { ctx.fillStyle = "#ff9a8f"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-8 + i * 8, 1 - i, 5.5, 0, Math.PI * 2); ctx.fill(); } }
      else if (stageIndex <= 1) { ctx.fillStyle = "#e2582f"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-8 + i * 8, 1 - i, 5.5, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = "#ffd166"; ctx.fillRect(-10, -5, 4, 1.2); ctx.fillRect(2, 0, 4, 1.2); }
      else if (stageIndex <= 2) { ctx.fillStyle = "#a83c23"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-8 + i * 8, 1 - i, 5.8, 0, Math.PI * 2); ctx.fill(); } ctx.strokeStyle = "#3d1e13"; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 5, -3); ctx.lineTo(-10 + i * 5, 1); ctx.stroke(); } }
      else { ctx.fillStyle = "#f6f9fc"; ctx.beginPath(); ctx.ellipse(0, 2, 16, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#a83c23"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-7 + i * 7, -1 + Math.sin(i) * 2, 4.6, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = "#7fe089"; ctx.beginPath(); ctx.arc(9, 1, 2, 0, Math.PI * 2); ctx.fill(); }
    } else if (base === "pearlSoup") {
      if (stageIndex <= 0) { ctx.fillStyle = "#8ed37b"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-7 + i * 7, -1 + Math.sin(i) * 3, 5, 3.5, i, 0, Math.PI * 2); ctx.fill(); } }
      else if (stageIndex <= 1) { ctx.fillStyle = "#dff8f2"; ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#8ed37b"; ctx.beginPath(); ctx.arc(-5, -1, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(5, 1, 2.7, 0, Math.PI * 2); ctx.fill(); }
      else if (stageIndex <= 2) { ctx.fillStyle = "#c8f2ea"; ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-6 + i * 4, -1 + Math.sin(i * 3) * 2, 1.5, 0, Math.PI * 2); ctx.fill(); } }
      else { ctx.fillStyle = "#f4fdff"; ctx.beginPath(); ctx.ellipse(0, 0, 17, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#48b799"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-5 + i * 4, Math.sin(i * 4) * 2, 1.8, 0, Math.PI * 2); ctx.fill(); } }
    } else {
      if (stageIndex <= 0) { ctx.fillStyle = "#fbeec9"; ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#dfc491"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(0, 2, 8, -2); ctx.stroke(); }
      else if (stageIndex <= 1) { ctx.fillStyle = "#e09d3a"; ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#a96d1f"; ctx.beginPath(); ctx.ellipse(-3, -2, 5, 3, .3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffdf9e"; ctx.beginPath(); ctx.ellipse(5, 3, 5, 3, -.2, 0, Math.PI * 2); ctx.fill(); }
      else if (stageIndex <= 2) { ctx.fillStyle = "#eaa844"; ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#57965a"; for (let i = 0; i < 5; i++) { ctx.fillRect(-8 + i * 4, -6 + Math.sin(i) * 2, 3, 1.5); } }
      else { ctx.fillStyle = "#fff7e6"; ctx.beginPath(); ctx.ellipse(0, 2, 16, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#f0c168"; ctx.beginPath(); ctx.ellipse(-4, -2, 8, 6, .1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(5, -1, 8, 6, -.1, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#c98840"; ctx.beginPath(); ctx.arc(8, -5, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawFlight(flight, t) {
    const order = flight.order;
    const u = ease(clamp(flight.t / flight.duration, 0, 1));
    const x = lerp(flight.from.x, flight.to.x, u);
    const y = lerp(flight.from.y, flight.to.y, u) - Math.sin(u * Math.PI) * 58 - 4;
    const angle = (flight.to.x - flight.from.x) * .0005;
    ctx.save();
    ctx.fillStyle = "rgba(2,10,22,.18)";
    ctx.beginPath(); ctx.ellipse(x, flight.from.y + 18, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    drawDishShape(order, order.stepIndex - 1, 1, angle + Math.sin(t * 7) * .08, x, y);
    if (Math.random() < .08) state.particles.push({ x, y: y + 10, vx: 0, vy: -5, life: .4, age: 0, r: 2, color: "rgba(255,255,255,.3)", steam: true });
  }

  function drawBackground(t) {
    const g = ctx.createLinearGradient(0, 0, 0, 680);
    g.addColorStop(0, "#08203d"); g.addColorStop(.45, "#0b3161"); g.addColorStop(1, "#05102b");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1000, 680);
    const glow = ctx.createRadialGradient(500, 340, 40, 500, 340, 520);
    glow.addColorStop(0, "rgba(110,240,255,.15)"); glow.addColorStop(.4, "rgba(50,160,255,.06)"); glow.addColorStop(1, "rgba(2,8,18,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 1000, 680);

    // cave silhouette
    ctx.fillStyle = "rgba(4,17,35,.8)";
    ctx.beginPath(); ctx.moveTo(0, 680); ctx.lineTo(0, 150); ctx.quadraticCurveTo(120, 70, 260, 130); ctx.quadraticCurveTo(420, 40, 620, 120); ctx.quadraticCurveTo(800, 55, 1000, 140); ctx.lineTo(1000, 680); ctx.closePath(); ctx.fill();
    // coral / rocks
    for (let i = 0; i < 12; i++) {
      const x = 35 + i * 85 + Math.sin(i * 3) * 20;
      const y = 645 + Math.sin(i * 5) * 12;
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,111,125,.3)" : i % 3 === 1 ? "rgba(72,229,255,.16)" : "rgba(255,209,102,.13)";
      ctx.beginPath(); ctx.arc(x, y, 18 + (i % 4) * 5, 0, Math.PI * 2); ctx.fill();
    }
    // fish
    for (const fish of state.fish) {
      ctx.save();
      ctx.globalAlpha = fish.depth;
      ctx.translate(fish.x, fish.y + Math.sin(t * 1.6 + fish.len) * 7);
      ctx.scale(fish.v > 0 ? 1 : -1, 1);
      ctx.fillStyle = `hsla(${fish.hue}, 72%, 65%, .68)`;
      ctx.beginPath(); ctx.ellipse(0, 0, fish.len * .55, fish.len * .22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-fish.len * .45, 0); ctx.lineTo(-fish.len * .8, -fish.len * .22); ctx.lineTo(-fish.len * .8, fish.len * .22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(10,20,35,.8)"; ctx.beginPath(); ctx.arc(fish.len * .32, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // bubbles
    for (const b of state.bubbles) {
      ctx.strokeStyle = `rgba(230,255,255,${b.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x + Math.sin(state.time + b.drift) * 7, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
    }
    // hanging lights
    for (const lx of [180, 500, 820]) {
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 55); ctx.stroke();
      ctx.fillStyle = "rgba(255,214,102,.9)";
      ctx.beginPath(); ctx.moveTo(lx - 20, 78); ctx.quadraticCurveTo(lx, 118, lx + 20, 78); ctx.closePath(); ctx.fill();
      const lg = ctx.createRadialGradient(lx, 85, 4, lx, 85, 115);
      lg.addColorStop(0, "rgba(255,224,138,.22)"); lg.addColorStop(1, "rgba(255,224,138,0)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, 85, 115, 0, Math.PI * 2); ctx.fill();
    }
    // counter ring
    ctx.strokeStyle = "rgba(126,208,235,.13)";
    ctx.lineWidth = 74;
    ctx.beginPath(); ctx.ellipse(500, 430, 345, 195, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,209,102,.08)";
    ctx.lineWidth = 82;
    ctx.beginPath(); ctx.ellipse(500, 430, 345, 195, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function drawParticles(dt) {
    for (const p of state.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.steam) { p.vy *= .98; p.r += dt * 7; }
      else p.vy += 55 * dt;
      const a = clamp(1 - p.age / p.life, 0, 1);
      ctx.globalAlpha = p.steam ? a * .5 : a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    state.particles = state.particles.filter((p) => p.age < p.life);
  }

  function drawOverlay(t) {
    const busy = state.stations.filter((s) => s.busy).length;
    ctx.save();
    ctx.fillStyle = "rgba(7,23,44,.72)";
    roundedRect(20, 585, 262, 65, 16, true, true);
    ctx.fillStyle = "#9bc3d6"; ctx.font = "600 10px ui-sans-serif, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("八爪厨房 · 并行烹饪中", 34, 608);
    ctx.fillStyle = "#fff"; ctx.font = "800 22px ui-sans-serif, sans-serif";
    ctx.fillText(`${busy} / 8 工位工作`, 34, 635);
    ctx.fillStyle = state.peak ? "#ff8877" : "#7be0ff"; ctx.font = "700 11px ui-sans-serif, sans-serif";
    ctx.fillText(state.peak ? "高峰期来单中" : state.paused ? "已暂停" : `速度 ${state.speed.toFixed(2)}×`, 34, 651);
    ctx.restore();
  }

  function update(dt) {
    state.time += dt;
    if (state.peak && !state.paused) {
      state.peakTimer -= dt;
      if (state.peakTimer <= 0) {
        spawnOrder(menuData[Math.floor(Math.random() * menuData.length)].id);
        state.peakTimer = 1.7 + Math.random() * .8;
      }
    }
    for (const station of state.stations) {
      station.workPulse = Math.max(0, station.workPulse - dt * 2.2);
      station.hitFlash = Math.max(0, station.hitFlash - dt * 1.4);
      if (station.pauseLeft > 0) { station.pauseLeft -= dt; continue; }
      startStationWork(station, station.queue[0]);
      if (station.busy) {
        const order = station.busy;
        const step = order.dish.steps[order.stepIndex];
        const duration = station.duration * (step.station === 7 ? .8 : 1);
        order.progress = clamp((state.time - order.stepStarted) / duration, 0, 1);
        if (station.id === 1 || station.id === 2 || station.id === 4) {
          if (Math.random() < dt * (station.id === 4 ? 14 : 6)) emitSteam(station.x, station.y - 25, 1);
        }
        if (station.id === 4 && Math.random() < dt * 5) emitBurst(station.x, station.y - 8, "rgba(255,140,70,.7)", 1, 18);
        if (order.progress >= 1) completeStationWork(station);
      }
    }
    for (const flight of state.flights) {
      flight.t += dt;
      if (flight.t >= flight.duration) {
        flight.order.flight = null;
        flight.order.arrive = state.time;
      }
    }
    state.flights = state.flights.filter((f) => f.t < f.duration);
    for (const b of state.bubbles) {
      b.y -= b.v * dt;
      if (b.y < -10) { b.y = 690; b.x = Math.random() * 1000; }
    }
    for (const fish of state.fish) {
      fish.x += fish.v * dt;
      if (fish.x > 1050) fish.x = -50;
      if (fish.x < -50) fish.x = 1050;
    }
  }

  function render() {
    const t = state.time;
    ctx.clearRect(0, 0, 1000, 680);
    drawBackground(t);
    // Stations behind chef based on y.
    const backStations = state.stations.filter((s) => s.y <= 420);
    const frontStations = state.stations.filter((s) => s.y > 420);
    // Draw chef body first for front tentacles to overlap; but head behind upper tentacles.
    drawChef(t);
    for (const s of backStations) { drawStation(s, t); drawTentacle(s, t); }
    for (const f of state.flights) drawFlight(f, t);
    drawParticles(state.paused ? 0 : Math.min(.033, 1 / 60));
    for (const s of frontStations) { drawStation(s, t); drawTentacle(s, t); }
    // redraw head/torso over tentacle bases to keep correct occlusion, then show root joints.
    drawChefHeadOverlay(t);
    for (const s of state.stations) {
      ctx.fillStyle = s.pauseLeft > 0 ? "#ffd0c4" : palette.skinDark;
      ctx.beginPath(); ctx.arc(s.root.x, s.root.y, 9, 0, Math.PI * 2); ctx.fill();
    }
    drawOverlay(t);
  }

  function drawChefHeadOverlay(t) {
    const activeCountNum = state.stations.filter((s) => s.busy).length;
    const stress = clamp(activeCountNum / 4, 0, 1);
    const bob = Math.sin(t * 1.4) * 3 + stress * Math.sin(t * 9) * 2;
    ctx.save();
    ctx.translate(500, 330 + bob);
    const skin = stress > .62 ? "#f77b78" : "#f2948f";
    ctx.fillStyle = skin;
    roundedRect(-70, -64, 140, 128, 70, true);
    ctx.beginPath(); ctx.ellipse(0, -82, 62, 57, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.beginPath(); ctx.ellipse(-20, -104, 29, 20, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = palette.belly;
    ctx.beginPath(); ctx.ellipse(0, -32, 44, 34, 0, 0, Math.PI * 2); ctx.fill();
    // Hat
    ctx.fillStyle = "#f7f2e2";
    ctx.beginPath(); ctx.ellipse(0, -131, 54, 14, 0, 0, Math.PI * 2); ctx.fill();
    roundedRect(-34, -168, 68, 42, 10, true);
    ctx.fillStyle = "#f7f2e2"; ctx.beginPath(); ctx.ellipse(0, -168, 37, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#cfd6df"; roundedRect(-35, -135, 70, 10, 5, true);
    // Eyes overlay simplified
    const actives = state.stations.filter((s) => s.busy);
    let target = actives.length
      ? { x: actives.reduce((sum, s) => sum + s.x, 0) / actives.length - 500, y: actives.reduce((sum, s) => sum + s.y, 0) / actives.length - 330 }
      : { x: Math.sin(t * .4) * 40, y: -20 };
    const look = normalize(target);
    const poked = state.stations.some((s) => s.pauseLeft > 0);
    for (const sx of [-24, 24]) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(sx, -85, 15 + stress, poked ? 17 : 13 + stress * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#152734"; ctx.beginPath(); ctx.arc(sx + clamp(look.x * 7, -6, 6), -85 + clamp(look.y * 4, -4, 4), 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx + clamp(look.x * 7, -6, 6) - 2, -88 + clamp(look.y * 4, -4, 4), 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "#7d3b44"; ctx.lineWidth = 3.2; ctx.lineCap = "round";
    ctx.beginPath();
    if (poked) { ctx.moveTo(-36, -105); ctx.lineTo(-13, -98); ctx.moveTo(13, -98); ctx.lineTo(36, -105); }
    else if (stress > .3) { ctx.moveTo(-35, -103 + stress * 3); ctx.lineTo(-13, -100 - stress * 4); ctx.moveTo(13, -100 - stress * 4); ctx.lineTo(35, -103 + stress * 3); }
    else { ctx.moveTo(-33, -102); ctx.lineTo(-14, -104); ctx.moveTo(14, -104); ctx.lineTo(33, -102); }
    ctx.stroke();
    ctx.beginPath();
    if (poked) ctx.ellipse(0, -56, 11, 13, 0, 0, Math.PI * 2); else if (stress > .55) ctx.ellipse(0, -55, 13, 8, 0, 0, Math.PI * 2); else ctx.arc(0, -60, 12, .2, Math.PI - .2);
    ctx.fillStyle = "#8e3945"; ctx.fill();
    ctx.restore();
  }

  function loop(timestamp) {
    if (!state.last) state.last = timestamp;
    const wallDt = Math.min(.05, (timestamp - state.last) / 1000);
    state.last = timestamp;
    const dt = state.paused ? 0 : wallDt * state.speed;
    update(dt);
    render();
    updateUI();
    requestAnimationFrame(loop);
  }

  function updateUI() {
    activeCount.textContent = String(state.orders.filter((o) => o.status !== "served").length);
    servedCount.textContent = String(state.served);
    peakState.textContent = state.peak ? "开启" : "关闭";
    stationListBox.innerHTML = state.stations.map((s) => {
      const cls = s.busy ? "busy" : s.queue.length ? "queue" : "";
      const label = s.busy ? "忙碌" : s.queue.length ? `排队 ${s.queue.length}` : "空闲";
      return `<li><span class="station-id">${s.id + 1}. ${s.name}</span><span class="station-state">${s.busy ? s.action : s.queue.length ? "等待接手" : "待机轻摆"}</span><span class="status-chip ${cls}">${label}</span></li>`;
    }).join("");

    ticketEmpty.hidden = state.orders.length > 0;
    ticketsBox.innerHTML = state.orders.map((order) => {
      const isServed = order.status === "served";
      const rows = order.dish.steps.map((step, i) => {
        const cls = i < order.stepIndex ? "done" : i === order.stepIndex && !isServed ? "active" : "";
        return `<div class="step ${cls}">${i + 1}. ${step.label}</div>`;
      }).join("");
      return `<article class="ticket"><div class="ticket-head"><span>#${String(order.id).padStart(2, "0")} ${order.dish.name}</span><span class="ticket-status ${isServed ? "done" : "cooking"}">${isServed ? "已出餐" : order.currentStation ? order.currentStation.name : "配送中"}</span></div><div class="steps">${rows}</div></article>`;
    }).join("");
  }

  function initMenu() {
    menuBox.innerHTML = menuData.map((dish) => `
      <button class="menu-btn" type="button" data-dish="${dish.id}" aria-label="点一份${dish.name}">
        <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="${orderColor(dish.id)}" opacity=".82"/><ellipse cx="24" cy="29" rx="13" ry="6" fill="#fff9ec"/><path d="M14 29q10 7 20 0" stroke="${orderColor(dish.id)}" stroke-width="2" fill="none"/></svg>
        <span><span class="menu-name">${dish.name}</span><span class="menu-meta">${dish.short}</span></span>
      </button>`).join("");
    menuBox.addEventListener("click", (event) => {
      const button = event.target.closest(".menu-btn");
      if (button) spawnOrder(button.dataset.dish);
    });
  }

  function handlePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width * 1000;
    const py = (event.clientY - rect.top) / rect.height * 680;
    let nearest = null, dist = 1e9;
    for (const s of state.stations) {
      const d = Math.hypot(s.tip ? s.tip.x - px : s.x - px, s.tip ? s.tip.y - py : s.y - py);
      if (d < dist) { dist = d; nearest = s; }
    }
    if (nearest && dist < 82) {
      nearest.pauseLeft = 1.3;
      nearest.hitFlash = 1;
      if (nearest.busy) nearest.busy.progress = Math.max(0, nearest.busy.progress - .1);
      emitBurst(nearest.x, nearest.y - 55, "rgba(20,28,45,.82)", 22, 95);
      emitBurst(nearest.x, nearest.y - 30, "#9be7ff", 10);
      state.pointerGlow.push({ x: px, y: py, age: 0 });
    }
  }

  function resetKitchen() {
    const speed = state.speed, peak = state.peak;
    state.orderSeq = 1; state.served = 0; state.orders = []; state.flights = []; state.particles = [];
    state.stations.forEach((s) => { s.busy = null; s.queue = []; s.pauseLeft = 0; s.hitFlash = 0; s.workPulse = 0; });
    state.speed = speed; state.peak = peak;
    updateUI();
  }

  pauseBtn.addEventListener("click", () => {
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "继续" : "暂停";
    pauseBtn.setAttribute("aria-pressed", String(state.paused));
  });
  peakBtn.addEventListener("click", () => {
    state.peak = !state.peak;
    peakBtn.textContent = `高峰期：${state.peak ? "开" : "关"}`;
    peakBtn.setAttribute("aria-pressed", String(state.peak));
    if (state.peak) state.peakTimer = 0;
  });
  resetBtn.addEventListener("click", () => resetKitchen());
  speedInput.addEventListener("input", () => {
    state.speed = Number(speedInput.value);
    speedValue.textContent = `${state.speed.toFixed(2)}×`;
  });
  canvas.addEventListener("pointerdown", handlePointer);
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handlePointer({ clientX: canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2, clientY: canvas.getBoundingClientRect().top + canvas.getBoundingClientRect().height / 2 }); }
  });

  makeEnvironment();
  initMenu();
  spawnOrder("coralSkewer");
  spawnOrder("pearlSoup");
  requestAnimationFrame(loop);

  // utils
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function normalize(v) { const d = Math.hypot(v.x, v.y) || 1; return { x: v.x / d, y: v.y / d }; }
  function roundedRect(x, y, w, h, r, fill = false, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
})();
