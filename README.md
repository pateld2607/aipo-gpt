# AIPO-GPT

A practical PC build optimizer that turns a plain-language goal into structured constraints, selects a balanced component set, and explains compatibility decisions.

## Current slice

- Goal parsing for gaming, streaming, workstation, software development, local AI, efficiency, resolution, and budgets including `1.8k`, `2 grand`, `USD 2.4k`, or `1,950 dollars`
- Deterministic recommendations across CPU, GPU, motherboard, RAM, storage, PSU, cooler, and case
- Side-by-side balanced, maximum-performance, and best-value profile comparison with price, parts, peak power, upgrade score, and goal coverage
- CPU socket and motherboard power-delivery support, cooler socket and RAM clearance, memory type, capacity, and slot count, storage and GPU interfaces, cooling performance and physical fit, motherboard and PSU form factors, PSU length, GPU length, thickness and power connector, PSU headroom, and workload-specific VRAM checks
- Transparent cost and power estimates
- Visual budget-utilization meter with an at-a-glance spending label
- Transparent value-density index using weighted component tiers per $1,000
- Exact PSU wattage and percentage reserve for future upgrades
- Automatic or explicit 450W, 550W, and 650W peak-power ceilings with goal validation
- Upgrade-readiness scoring for power, memory, motherboard, and case headroom
- Expandable upgrade-readiness breakdown showing each contributing signal
- Upgrade-headroom priority that favors stronger expansion paths and parses future-proofing language
- Visible cooler-noise classification for quiet-build decisions
- Automatic or explicit 24dBA, 28dBA, and 32dBA cooler-noise ceilings with goal validation
- Explicit automatic, 12GB, or 16GB graphics-memory targets, including natural-language parsing
- Workload-specific CPU core targets with core and thread explanations
- Explicit automatic, 6-core, 8-core, or 12-core CPU requirements, including natural-language parsing
- Explicit automatic, 32GB, or 64GB system-memory targets, including natural-language parsing
- Explicit automatic, 1TB, or 2TB storage targets, including natural-language parsing
- Automatic, compact, or standard case-size preference with natural-language parsing and goal validation
- Accessible validation for missing goals and out-of-range budgets
- Synchronized number and range controls for quick, precise budget changes
- Progressive advanced constraints with a live count of manually pinned limits
- Pointer-responsive lighting and ambient depth with reduced-motion and touch-safe fallbacks
- Mobile workspace switcher that moves directly between configuration and recommendations
- Animated recommendation refreshes with real completion feedback and accessible busy state
- Keyboard-friendly component inspection cards with rationale and budget-share details
- Clickable active-constraint chips that jump back to the exact input
- Live stale-result detection that clearly prompts users to refresh changed inputs
- Dismissible action toasts for copy, download, import, print, and local-save feedback
- Persistent motion control that respects operating-system reduced-motion preferences
- Persistent comfortable and compact result-density modes
- Searchable quick-action command center with Command-K and Control-K shortcuts
- Sticky result-section navigation for overview, components, and validation
- Smooth numeric transitions for price, headroom, and peak-power changes
- One-click gaming, streaming, and workstation goal presets
- Shareable URLs that restore the selected constraints and recommendation profile
- Keyboard skip navigation, result focus management, and screen-reader build summaries
- Copyable pass/fail validation reports for compatibility and workload goals
- Runtime catalog validation for duplicate IDs, missing specifications, and invalid prices
- Per-component budget allocation with a visual percentage breakdown
- Actionable guidance when a budget cannot meet every workload target
- Stable build IDs for comparing, exporting, and reproducing recommendations
- Search transparency showing evaluated, compatible, and affordable candidate counts
- Three distinct runner-up configurations with price, headroom, peak power, and goal coverage
- Workload-aware CPU-to-GPU component balance scoring
- Print-ready build sheets that remove controls and expand recommendation details
- Portable Markdown build sheets with components, prices, and validation results
- Spreadsheet-ready CSV bills of materials with prices and component rationales
- Safe JSON plan import that validates constraints and recalculates the recommendation
- One-click reset to a complete, shareable default configuration
- Device-local save and restore for revisiting a configuration without an account
- Clear-saved-build control for managing browser-stored configuration data
- Lowest-cost recovery paths for builds that miss workload targets

This first release intentionally keeps the recommendation engine local and inspectable. OpenAI-assisted reasoning and a larger data pipeline are planned as later milestones.

## Run locally

Serve the `dist` directory with any static web server, then open the printed local URL.

## Project direction

The long-term architecture follows the AIPO-GPT project described in Dev Patel's resume: deterministic hardware rules provide safety guarantees, while structured AI reasoning will help translate nuanced goals into machine-readable constraints.
