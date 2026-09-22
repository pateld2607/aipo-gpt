# AIPO-GPT

A practical PC build optimizer that turns a plain-language goal into structured constraints, selects a balanced component set, and explains compatibility decisions.

## Current slice

- Goal parsing for gaming, streaming, workstation, software development, efficiency, resolution, and budgets including `1.8k` or `2 grand` shorthand
- Deterministic recommendations across CPU, GPU, motherboard, RAM, storage, PSU, cooler, and case
- Side-by-side balanced, maximum-performance, and best-value profile comparison
- Socket, memory, cooling, form-factor, GPU length, thickness and power connector, PSU headroom, and workload-specific VRAM checks
- Transparent cost and power estimates
- Upgrade-readiness scoring for power, memory, motherboard, and case headroom
- Visible cooler-noise classification for quiet-build decisions
- Workload-specific CPU core targets with core and thread explanations
- Accessible validation for missing goals and out-of-range budgets
- One-click gaming, streaming, and workstation goal presets
- Shareable URLs that restore the selected constraints and recommendation profile
- Keyboard skip navigation, result focus management, and screen-reader build summaries
- Runtime catalog validation for duplicate IDs, missing specifications, and invalid prices
- Per-component budget allocation with a visual percentage breakdown
- Actionable guidance when a budget cannot meet every workload target
- Stable build IDs for comparing, exporting, and reproducing recommendations
- Search transparency showing evaluated, compatible, and affordable candidate counts
- Three distinct runner-up CPU and GPU configurations for comparison
- Workload-aware CPU-to-GPU component balance scoring

This first release intentionally keeps the recommendation engine local and inspectable. OpenAI-assisted reasoning and a larger data pipeline are planned as later milestones.

## Run locally

Serve the `dist` directory with any static web server, then open the printed local URL.

## Project direction

The long-term architecture follows the AIPO-GPT project described in Dev Patel's resume: deterministic hardware rules provide safety guarantees, while structured AI reasoning will help translate nuanced goals into machine-readable constraints.
