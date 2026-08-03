const modelData = [
  { name: "AlexNet", date: "2012-09-30", org: "University of Toronto", compute: 4.7e17, params: 6e7, era: "research" },
  { name: "AlphaGo Zero", date: "2017-10-18", org: "DeepMind", compute: 6.49439910290227e20, params: 46400244, era: "research" },
  { name: "BERT-Large", date: "2018-10-11", org: "Google", compute: 2.85e20, params: 3.4e8, era: "industry" },
  { name: "GPT-2 (1.5B)", date: "2019-02-14", org: "OpenAI", compute: 1.920000000001e21, params: 1.5e9, era: "industry" },
  { name: "GPT-3 175B", date: "2020-05-28", org: "OpenAI", compute: 3.14e23, params: 1.746e11, era: "industry" },
  { name: "PaLM 540B", date: "2022-04-04", org: "Google Research", compute: 2.5272e24, params: 5.4035e11, era: "industry" },
  { name: "GPT-4", date: "2023-03-15", org: "OpenAI", compute: 2.1e25, params: 1.8e12, era: "industry" },
  { name: "Llama 3.1 405B", date: "2024-07-23", org: "Meta AI", compute: 3.8e25, params: 4.05e11, era: "industry" },
  { name: "DeepSeek-V3", date: "2024-12-24", org: "DeepSeek", compute: 3.3e24, params: 6.71e11, era: "industry" }
].map(d => ({ ...d, parsedDate: d3.timeParse("%Y-%m-%d")(d.date) }));

const adoptionData = [
  { year: 2023, type: "Any AI", value: 55 }, { year: 2024, type: "Any AI", value: 78 },
  { year: 2023, type: "Generative AI", value: 33 }, { year: 2024, type: "Generative AI", value: 71 }
];

const scenes = [
  { kicker: "SCENE 1 OF 3", title: "Early deep-learning milestones", description: "AlexNet’s 2012 image-recognition result helped establish deep learning as a successful approach. AlphaGo Zero and BERT later demonstrated its value in game playing and language tasks.", takeaway: "BERT-Large used about <strong>600 times</strong> AlexNet’s estimated training compute.", hint: "Hover over a model to see its organization and exact values.", measure: "ESTIMATED TRAINING COMPUTE", unit: "FLOP (LOG SCALE)" },
  { kicker: "SCENE 2 OF 3", title: "Training compute increased rapidly", description: "The chart now includes foundation models through 2024. Their training runs required substantially more compute than the earlier task-specific systems.", takeaway: "Llama 3.1 405B used about <strong>81 million times</strong> AlexNet’s estimated training compute.", hint: "Use the filter below the chart or hover over a model to compare values.", measure: "ESTIMATED TRAINING COMPUTE", unit: "FLOP (LOG SCALE)" },
  { kicker: "SCENE 3 OF 3", title: "Organizational use also increased", description: "Stanford’s AI Index reports a large increase in organizational AI use between 2023 and 2024. The largest change was in reported use of generative AI.", takeaway: "In 2024, <strong>78%</strong> reported using AI and <strong>71%</strong> reported using generative AI.", hint: "Hover over a bar to see the exact survey value.", measure: "ORGANIZATIONS REPORTING AI USE", unit: "PERCENT OF RESPONDENTS" }
];

const state = { scene: 0, modelFilter: "all" };
const colors = { ink: "#132d26", green: "#2f7d64", lime: "#b9ed5b", sand: "#eee8dc", gray: "#87938e" };
const tooltip = d3.select("#tooltip");

function formatCompute(value) { return `10${Math.log10(value).toFixed(1).replace(".0", "")} FLOP`; }
function formatParams(value) { return value >= 1e12 ? `${(value / 1e12).toFixed(1)}T` : value >= 1e9 ? `${d3.format(".3~g")(value / 1e9)}B` : `${d3.format(".3~g")(value / 1e6)}M`; }
function showTooltip(event, html) {
  tooltip.html(html).classed("visible", true);
  const bounds = event.currentTarget?.getBoundingClientRect?.();
  const pointerX = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : (bounds?.left ?? 12);
  const pointerY = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : (bounds?.top ?? 92);
  const x = Math.max(12, Math.min(pointerX + 16, window.innerWidth - 260));
  const y = Math.max(12, pointerY - 80);
  tooltip.style("left", `${x}px`).style("top", `${y}px`);
}
function hideTooltip() { tooltip.classed("visible", false); }

function chartSize() {
  const node = document.querySelector("#chart");
  return { width: Math.max(320, node.clientWidth), height: Math.max(380, Math.min(530, window.innerHeight * .58)) };
}

function drawComputeChart(sceneIndex) {
  const { width, height } = chartSize();
  const mobile = width < 560;
  const margin = { top: 34, right: mobile ? 18 : 42, bottom: 58, left: mobile ? 56 : 78 };
  const svg = d3.select("#chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
  const shown = sceneIndex === 0 ? modelData.filter(d => d.parsedDate.getFullYear() <= 2018) : modelData;
  const x = d3.scaleTime().domain([new Date(2011, 8), new Date(2025, 5)]).range([margin.left, width - margin.right]);
  const y = d3.scaleLog().domain([1e17, 1e26]).range([height - margin.bottom, margin.top]);
  const ticks = [1e18, 1e20, 1e22, 1e24, 1e26];

  svg.append("g").selectAll("line").data(ticks).join("line").attr("x1", margin.left).attr("x2", width - margin.right).attr("y1", y).attr("y2", y).attr("class", "grid-line");
  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).attr("class", "axis").call(d3.axisBottom(x).ticks(mobile ? 4 : 7).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).attr("class", "axis").call(d3.axisLeft(y).tickValues(ticks).tickFormat(d => `10${Math.log10(d)}`).tickSize(0));

  const line = d3.line().x(d => x(d.parsedDate)).y(d => y(d.compute));
  svg.append("path").datum(shown.slice().sort((a,b) => a.parsedDate-b.parsedDate)).attr("class", "trend-line").attr("d", line);
  const points = svg.append("g").selectAll("circle").data(shown, d => d.name).join("circle")
    .attr("class", d => `model-point ${d.era}`).attr("cx", d => x(d.parsedDate)).attr("cy", d => y(d.compute)).attr("r", 0).attr("tabindex", 0)
    .on("pointerenter focus", function(event, d) { d3.select(this).attr("r", 10); showTooltip(event, `<strong>${d.name}</strong><span>${d.org} · ${d.date.slice(0,4)}</span><b>${formatCompute(d.compute)}</b><span>${formatParams(d.params)} parameters</span>`); })
    .on("pointermove", (event, d) => showTooltip(event, `<strong>${d.name}</strong><span>${d.org} · ${d.date.slice(0,4)}</span><b>${formatCompute(d.compute)}</b><span>${formatParams(d.params)} parameters</span>`))
    .on("pointerleave blur", function() { d3.select(this).attr("r", 6.5); hideTooltip(); });
  points.transition().duration(650).delay((d,i) => i * 65).attr("r", 6.5);

  const labels = sceneIndex === 0 ? shown : shown.filter(d => ["AlexNet", "GPT-3 175B", "Llama 3.1 405B"].includes(d.name));
  svg.append("g").selectAll("text").data(labels).join("text").attr("class", "point-label").attr("x", d => x(d.parsedDate) + 9).attr("y", d => y(d.compute) - 9).text(d => mobile && d.name === "AlphaGo Zero" ? "AlphaGo" : d.name);

  const annotation = sceneIndex === 0
    ? { d: shown[0], title: "AlexNet (2012)", body: "An influential early result in image recognition." }
    : { d: shown.find(d => d.name === "GPT-3 175B"), title: "GPT-3 (2020)", body: "A large language model trained for many text tasks." };
  addAnnotation(svg, x(annotation.d.parsedDate), y(annotation.d.compute), annotation.title, annotation.body, width, height);
  if (sceneIndex === 1) drawFilter();
}

function addAnnotation(svg, px, py, title, body, width, height) {
  const rightSide = px < width * .58;
  const boxW = Math.min(220, width * .43), boxH = 70;
  const bx = rightSide ? Math.min(px + 36, width - boxW - 8) : Math.max(8, px - boxW - 36);
  const by = Math.max(12, Math.min(py - 100, height - boxH - 12));
  const g = svg.append("g").attr("class", "annotation");
  g.append("path").attr("d", `M${px},${py} L${rightSide ? bx : bx + boxW},${by + boxH/2}`);
  g.append("rect").attr("x", bx).attr("y", by).attr("width", boxW).attr("height", boxH).attr("rx", 3);
  g.append("text").attr("x", bx + 13).attr("y", by + 22).attr("class", "annotation-title").text(title);
  const words = body.split(" "); let line = "", lines = [];
  words.forEach(word => { const test = `${line} ${word}`.trim(); if (test.length > 34) { lines.push(line); line = word; } else line = test; }); lines.push(line);
  g.selectAll(".annotation-body").data(lines).join("text").attr("x", bx + 13).attr("y", (d,i) => by + 43 + i*15).attr("class", "annotation-body").text(d => d);
}

function drawFilter() {
  const wrap = d3.select("#legend");
  wrap.append("span").text("SHOW:");
  ["all", "research", "industry"].forEach(filter => {
    wrap.append("button").attr("class", `filter-button ${state.modelFilter === filter ? "active" : ""}`).text(filter === "all" ? "All models" : filter[0].toUpperCase() + filter.slice(1))
      .on("click", () => { state.modelFilter = filter; d3.selectAll(".filter-button").classed("active", function() { return this.textContent.toLowerCase().startsWith(filter === "all" ? "all" : filter); }); d3.selectAll(".model-point").classed("muted", d => filter !== "all" && d.era !== filter); });
  });
}

function drawAdoptionChart() {
  const { width, height } = chartSize();
  const mobile = width < 560;
  const margin = { top: 45, right: 20, bottom: 64, left: mobile ? 52 : 72 };
  const svg = d3.select("#chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
  const x0 = d3.scaleBand().domain([2023, 2024]).range([margin.left, width - margin.right]).padding(.35);
  const x1 = d3.scaleBand().domain(["Any AI", "Generative AI"]).range([0, x0.bandwidth()]).padding(.16);
  const y = d3.scaleLinear().domain([0,100]).range([height-margin.bottom, margin.top]);
  svg.append("g").selectAll("line").data([0,25,50,75,100]).join("line").attr("class","grid-line").attr("x1",margin.left).attr("x2",width-margin.right).attr("y1",y).attr("y2",y);
  svg.append("g").attr("transform",`translate(${margin.left},0)`).attr("class","axis").call(d3.axisLeft(y).tickValues([0,25,50,75,100]).tickFormat(d=>`${d}%`).tickSize(0));
  svg.append("g").attr("transform",`translate(0,${height-margin.bottom})`).attr("class","axis year-axis").call(d3.axisBottom(x0).tickSize(0));
  const bars = svg.append("g").selectAll("rect").data(adoptionData).join("rect").attr("class",d=>d.type==="Any AI"?"bar any":"bar gen").attr("x",d=>x0(d.year)+x1(d.type)).attr("width",x1.bandwidth()).attr("y",y(0)).attr("height",0).attr("tabindex",0)
    .on("pointerenter focus", (event,d)=>showTooltip(event,`<strong>${d.type}</strong><span>Survey year ${d.year}</span><b>${d.value}% of organizations</b>`)).on("pointermove",(event,d)=>showTooltip(event,`<strong>${d.type}</strong><span>Survey year ${d.year}</span><b>${d.value}% of organizations</b>`)).on("pointerleave blur",hideTooltip);
  bars.transition().duration(700).delay((d,i)=>i*90).attr("y",d=>y(d.value)).attr("height",d=>y(0)-y(d.value));
  svg.append("g").selectAll("text").data(adoptionData).join("text").attr("class","bar-label").attr("x",d=>x0(d.year)+x1(d.type)+x1.bandwidth()/2).attr("y",d=>y(d.value)-10).text(d=>`${d.value}%`);
  addAnnotation(svg, x0(2024)+x1("Generative AI")+x1.bandwidth()/2, y(71), "2024 result", "Generative AI use rose 38 percentage points.", width, height);
  const legend=d3.select("#legend"); legend.append("span").html('<i class="swatch any"></i> Any AI'); legend.append("span").html('<i class="swatch gen"></i> Generative AI');
}

function updateScene() {
  const s = scenes[state.scene];
  d3.select("#scene-kicker").text(s.kicker); d3.select("#scene-title").text(s.title); d3.select("#scene-description").text(s.description);
  d3.select("#takeaway").html(s.takeaway); d3.select("#interaction-hint").text(s.hint); d3.select("#chart-measure").text(s.measure); d3.select("#chart-unit").text(s.unit);
  d3.select("#chart").html(""); d3.select("#legend").html("");
  state.scene < 2 ? drawComputeChart(state.scene) : drawAdoptionChart();
  d3.selectAll(".scene-tab").classed("active", function(){return +this.dataset.scene===state.scene;}).attr("aria-current", function(){return +this.dataset.scene===state.scene?"step":null;});
  d3.select("#progress-text").text(`${state.scene+1} / ${scenes.length}`); d3.select("#progress-fill").style("width",`${(state.scene+1)/scenes.length*100}%`);
  d3.select("#prev").property("disabled",state.scene===0); d3.select("#next span").text(state.scene===scenes.length-1?"Start again":"Next chapter");
}
function goToScene(index) { state.scene = (index + scenes.length) % scenes.length; updateScene(); }
d3.selectAll(".scene-tab").on("click",function(){goToScene(+this.dataset.scene);});
d3.select("#prev").on("click",()=>goToScene(state.scene-1));
d3.select("#next").on("click",()=>goToScene(state.scene===scenes.length-1?0:state.scene+1));
d3.select("#start-story").on("click",()=>document.querySelector("#story").scrollIntoView({behavior:"smooth"}));
d3.select(window).on("keydown",event=>{if(event.key==="ArrowRight")goToScene(state.scene===2?0:state.scene+1);if(event.key==="ArrowLeft"&&state.scene>0)goToScene(state.scene-1);});
let resizeTimer; d3.select(window).on("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(updateScene,180);});
updateScene();
