/* ═══════════════════════════════════════════════════════════════
   LULC DASHBOARD — APPLICATION LOGIC
   All data is pre-loaded. Zero network requests during interaction.
   ═══════════════════════════════════════════════════════════════ */

// ─── DATA ──────────────────────────────────────────────────────

const BOUNDS = {
    lahore: {
        south: 31.197574693647738,  west: 74.09511449763578,
        north: 31.702420353581598, east: 74.55242942457797,
    },
    gujranwala: {
        south: 31.907053619803197,  west: 73.94921941181867,
        north: 32.41299282185118,  east: 74.4083481382861,
    },
};

// Paths to the colored prediction PNGs (Prithvi = best model)
const OVERLAY_PATHS = {
    lahore: {
        "2018": "../results/pipeline/lahore/web_lahore_2018.png",
        "2021": "../results/pipeline/lahore/web_lahore_2021.png",
        "2026": "../results/pipeline/lahore/web_lahore_2026.png",
    },
    gujranwala: {
        "2018": "../results/pipeline/gujranwala/web_gujranwala_2018.png",
        "2021": "../results/pipeline/gujranwala/web_gujranwala_2021.png",
        "2026": "../results/pipeline/gujranwala/web_gujranwala_2026.png",
    },
};

// Change detection (Ensemble results from inference pipeline)
const CHANGE_DATA = {
    lahore: {
        "Vegetation":   { area_2018: 793.23, area_2021: 771.0,  area_2026: 751.59, net: -41.64 },
        "Built-up":     { area_2018: 500.35, area_2021: 553.0,  area_2026: 606.97, net: 106.62 },
        "Cropland":     { area_2018: 889.74, area_2021: 910.0,  area_2026: 928.38, net:  38.64 },
        "Water":        { area_2018:  21.21, area_2021:  22.7,   area_2026:  24.20, net:   2.99 },
        "Barren/Other": { area_2018: 196.27, area_2021: 144.0,  area_2026:  89.66, net:-106.61 },
    },
    gujranwala: {
        "Vegetation":   { area_2018: 616.27, area_2021: 607.0,  area_2026: 598.13, net: -18.14 },
        "Built-up":     { area_2018: 188.84, area_2021: 207.0,  area_2026: 225.66, net:  36.82 },
        "Cropland":     { area_2018:1540.84, area_2021:1540.0,  area_2026:1539.08, net:  -1.76 },
        "Water":        { area_2018:   7.95, area_2021:   7.3,   area_2026:   6.73, net:  -1.22 },
        "Barren/Other": { area_2018:  36.54, area_2021:  28.7,   area_2026:  20.83, net: -15.70 },
    },
};

// ESA 2021 validation metrics (from evaluation JSONs)
const MODEL_METRICS = {
    lahore: {
        "U-Net (B4)":    { acc: 72.74, f1: 66.54, miou: 51.66 },
        "SegFormer":     { acc: 72.60, f1: 66.50, miou: 51.66 },
        "DeepLabV3+":    { acc: 72.80, f1: 66.98, miou: 52.17 },
        "Prithvi v2":    { acc: 74.44, f1: 68.37, miou: 53.64 },
        "Ensemble":      { acc: 74.27, f1: 68.32, miou: 53.60 },
    },
    gujranwala: {
        "U-Net (B4)":    { acc: 75.82, f1: 59.06, miou: 44.98 },
        "SegFormer":     { acc: 75.85, f1: 59.36, miou: 45.31 },
        "DeepLabV3+":    { acc: 75.85, f1: 58.35, miou: 44.56 },
        "Prithvi v2":    { acc: 76.49, f1: 60.94, miou: 46.90 },
        "Ensemble":      { acc: 76.57, f1: 60.93, miou: 46.87 },
    },
};

const CLASS_COLORS = {
    "Vegetation":   "#22c55e",
    "Built-up":     "#ef4444",
    "Cropland":     "#eab308",
    "Water":        "#3b82f6",
    "Barren/Other": "#d2b48c",
};


// ─── STATE ─────────────────────────────────────────────────────

let currentCity = "lahore";
let currentYear = "2026";
let map, overlay, baseTile;
let donutChart = null;
let barChart   = null;


// ─── MAP INIT ──────────────────────────────────────────────────

function initMap() {
    const b = BOUNDS[currentCity];
    const center = [(b.south + b.north) / 2, (b.west + b.east) / 2];

    map = L.map("map", {
        center,
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
    });

    // Dark satellite tile layer
    baseTile = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
    ).addTo(map);

    // Add attribution
    L.control.attribution({ prefix: false, position: "bottomleft" })
        .addAttribution('Imagery &copy; Esri | LULC &copy; Prithvi v2')
        .addTo(map);

    updateOverlay();
}


function updateOverlay() {
    const b = BOUNDS[currentCity];
    const bounds = [[b.south, b.west], [b.north, b.east]];
    const imgPath = OVERLAY_PATHS[currentCity][currentYear];
    const opacity = document.getElementById("opacity-slider").value / 100;

    if (overlay) {
        map.removeLayer(overlay);
    }

    overlay = L.imageOverlay(imgPath, bounds, {
        opacity,
        interactive: false,
    }).addTo(map);

    map.fitBounds(bounds, { padding: [20, 20] });
}


// ─── STATS ─────────────────────────────────────────────────────

function updateStats() {
    const data = CHANGE_DATA[currentCity];
    const grid = document.getElementById("stats-grid");

    const items = [
        {
            label: "Vegetation",
            value: data["Vegetation"].net,
            sub: `${data["Vegetation"].area_2018} → ${data["Vegetation"].area_2026} km²`,
        },
        {
            label: "Built-up",
            value: data["Built-up"].net,
            sub: `${data["Built-up"].area_2018} → ${data["Built-up"].area_2026} km²`,
        },
        {
            label: "Cropland",
            value: data["Cropland"].net,
            sub: `${data["Cropland"].area_2018} → ${data["Cropland"].area_2026} km²`,
        },
        {
            label: "Barren",
            value: data["Barren/Other"].net,
            sub: `${data["Barren/Other"].area_2018} → ${data["Barren/Other"].area_2026} km²`,
        },
    ];

    grid.innerHTML = items.map(item => {
        const sign = item.value >= 0 ? "+" : "";
        const cls  = item.value >= 0 ? "positive" : "negative";
        return `
            <div class="stat-item">
                <div class="stat-value ${cls}">${sign}${item.value.toFixed(1)}</div>
                <div class="stat-label">${item.label} (km²)</div>
                <div class="stat-sub">${item.sub}</div>
            </div>
        `;
    }).join("");
}


// ─── DONUT CHART ───────────────────────────────────────────────

function updateDonutChart() {
    const data = CHANGE_DATA[currentCity];
    const yearKey = `area_${currentYear}`;
    const values = Object.keys(data).map(k => data[k][yearKey]);
    const labels = Object.keys(data);
    const colors = labels.map(l => CLASS_COLORS[l]);

    document.getElementById("donut-year-label").textContent = currentYear;

    if (donutChart) donutChart.destroy();

    donutChart = new Chart(document.getElementById("donut-chart"), {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: "rgba(6, 11, 24, 0.8)",
                borderWidth: 2,
                hoverOffset: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#8b95ab",
                        font: { family: "Inter", size: 11 },
                        padding: 12,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                    },
                },
                tooltip: {
                    backgroundColor: "rgba(12, 18, 37, 0.95)",
                    titleColor: "#e8ecf4",
                    bodyColor: "#8b95ab",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    bodyFont: { family: "Inter" },
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = (ctx.parsed * 100 / total).toFixed(1);
                            return ` ${ctx.label}: ${ctx.parsed.toFixed(1)} km² (${percentage}%)`;
                        },
                    },
                },
            },
        },
    });
}


// ─── BAR CHART ─────────────────────────────────────────────────

function updateBarChart() {
    const data = CHANGE_DATA[currentCity];
    const classes = Object.keys(data);
    const years = ["2018", "2021", "2026"];

    const datasets = years.map((yr, i) => ({
        label: yr,
        data: classes.map(c => data[c][`area_${yr}`]),
        backgroundColor: [
            "rgba(59, 130, 246, 0.5)",
            "rgba(99, 102, 241, 0.5)",
            "rgba(34, 197, 94, 0.5)",
        ][i],
        borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(99, 102, 241, 1)",
            "rgba(34, 197, 94, 1)",
        ][i],
        borderWidth: 1,
        borderRadius: 4,
    }));

    if (barChart) barChart.destroy();

    barChart = new Chart(document.getElementById("bar-chart"), {
        type: "bar",
        data: { labels: classes, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: "#8b95ab", font: { family: "Inter", size: 10 } },
                    grid: { color: "rgba(59, 130, 246, 0.06)" },
                },
                y: {
                    ticks: {
                        color: "#8b95ab",
                        font: { family: "Inter", size: 10 },
                        callback: v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v,
                    },
                    grid: { color: "rgba(59, 130, 246, 0.06)" },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#8b95ab",
                        font: { family: "Inter", size: 11 },
                        usePointStyle: true,
                        pointStyleWidth: 8,
                        padding: 12,
                    },
                },
                tooltip: {
                    backgroundColor: "rgba(12, 18, 37, 0.95)",
                    titleColor: "#e8ecf4",
                    bodyColor: "#8b95ab",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    borderWidth: 1,
                    cornerRadius: 8,
                    bodyFont: { family: "Inter" },
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} km²`,
                    },
                },
            },
        },
    });
}


// ─── MODEL INFO ────────────────────────────────────────────────

function updateModelInfo() {
    const metrics = MODEL_METRICS[currentCity];
    const container = document.getElementById("model-info");

    // Find best mIoU
    let bestMiou = 0;
    let bestName = "";
    for (const [name, m] of Object.entries(metrics)) {
        if (m.miou > bestMiou) { bestMiou = m.miou; bestName = name; }
    }

    container.innerHTML = Object.entries(metrics).map(([name, m]) => {
        const isBest = name === bestName;
        return `
            <div class="model-row ${isBest ? 'best' : ''}">
                <span class="model-name">${name}</span>
                <span class="model-metric ${isBest ? 'best-val' : ''}">${m.miou.toFixed(2)}% mIoU</span>
            </div>
        `;
    }).join("");
}


// ─── EVENT LISTENERS ───────────────────────────────────────────

function setupListeners() {
    // City toggle
    document.querySelectorAll("#city-toggle .toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#city-toggle .toggle-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCity = btn.dataset.city;
            refreshAll();
        });
    });

    // Year toggle
    document.querySelectorAll("#year-toggle .toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#year-toggle .toggle-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentYear = btn.dataset.year;
            updateOverlay();
            updateDonutChart();
        });
    });

    // Opacity slider
    document.getElementById("opacity-slider").addEventListener("input", e => {
        if (overlay) overlay.setOpacity(e.target.value / 100);
    });
}


// ─── REFRESH ALL ───────────────────────────────────────────────

function refreshAll() {
    updateOverlay();
    updateStats();
    updateDonutChart();
    updateBarChart();
    updateModelInfo();
}


// ─── INIT ──────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    setupListeners();
    updateStats();
    updateDonutChart();
    updateBarChart();
    updateModelInfo();
});
