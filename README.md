<div align="center">

# GreenWatch Dashboard

[![Live Demo](https://img.shields.io/badge/Live-greenwatch--dashboard.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://greenwatch-dashboard.vercel.app)

**Interactive LULC change detection dashboard for Punjab, Pakistan (2018-2026)**

Built with Leaflet.js and Chart.js | Powered by Prithvi-EO 2.0 predictions

</div>

---

## What is this?

An interactive web dashboard that visualizes land use/land cover (LULC) maps and change detection results for **Lahore** and **Gujranwala**, Punjab, Pakistan. All predictions come from the **NASA/IBM Prithvi-EO 2.0** foundation model, fine-tuned on Sentinel-2 imagery.

### Features

- **City toggle** - switch between Lahore and Gujranwala
- **Year selector** - view LULC maps for 2018, 2021, and 2026
- **Change detection stats** - built-up expansion, vegetation loss, area comparisons
- **Donut & bar charts** - land use distribution and area comparison across years
- **Model performance panel** - full-city metrics, patch-level metrics, LoRA ablation results
- **Deforestation analysis** - side-by-side 2018 vs 2026 comparison with vegetation loss highlighting
- **Opacity controls** - adjust overlay transparency for satellite basemap inspection

### LULC Classes

| Class | Color |
|-------|-------|
| Vegetation | Green |
| Built-up | Red |
| Cropland | Yellow |
| Water | Blue |
| Barren | Brown |

---

## Run Locally

```bash
cd webapp
python -m http.server 8000
# Open http://localhost:8000
```

---

## Related

This dashboard is part of a larger research project benchmarking foundation models for land cover mapping:

**[prithvi-lulc-punjab](https://github.com/ZentaCros/prithvi-lulc-punjab)** - Training code, evaluation scripts, and full results

Paper: *"Benchmarking a LoRA-Adapted EO Foundation Model for Land Cover Mapping and Zero-Shot Cross-City Generalization in Punjab, Pakistan"* (under review at MDPI Remote Sensing)

---

## License

MIT
