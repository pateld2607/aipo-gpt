# AIPO-GPT

A practical PC build optimizer that turns a plain-language goal into structured constraints, selects a balanced component set, and explains compatibility decisions.

## Current slice

- Goal parsing for gaming, streaming, workstation, efficiency, resolution, and budgets including `1.8k` or `2 grand` shorthand
- Deterministic recommendations across CPU, GPU, motherboard, RAM, storage, PSU, cooler, and case
- Side-by-side balanced, maximum-performance, and best-value profile comparison
- Socket, memory, cooling, form-factor, clearance, PSU headroom, and workload-specific VRAM checks
- Transparent cost and power estimates

This first release intentionally keeps the recommendation engine local and inspectable. OpenAI-assisted reasoning and a larger data pipeline are planned as later milestones.

## Run locally

Serve the `dist` directory with any static web server, then open the printed local URL.

## Project direction

The long-term architecture follows the AIPO-GPT project described in Dev Patel's resume: deterministic hardware rules provide safety guarantees, while structured AI reasoning will help translate nuanced goals into machine-readable constraints.
