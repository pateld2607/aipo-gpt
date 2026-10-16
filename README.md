# AIPO-GPT

AIPO-GPT is a PC build optimizer I developed to make choosing computer parts easier. Instead of spending hours researching components and figuring out whether everything works together, users can describe what they need their PC for, set a budget, and get a complete build recommendation.

The goal is to help users find the right balance between performance, cost, compatibility, and future upgrades without needing extensive knowledge of computer hardware.

## Features

### Personalized PC Recommendations
Users can describe what they want to do with their PC, whether that's gaming, streaming, programming, video editing, or running AI models locally. AIPO-GPT takes those goals and recommends a complete setup, including the CPU, GPU, motherboard, RAM, storage, power supply, cooler, and case.

It also understands natural-language requests like "I want a gaming PC for around 2 grand" or "I need a workstation with 64GB of RAM."

### Build Comparisons
Rather than giving users just one option, AIPO-GPT generates three different build profiles:
- **Balanced:** A combination of performance, affordability, and upgrade potential.
- **Maximum Performance:** Prioritizes getting the most computing power within the budget.
- **Best Value:** Focuses on getting the most performance for the money.

Users can compare these builds based on pricing, power consumption, upgrade potential, and how well they meet their goals. The application also provides alternative configurations.

### Automatic Compatibility Checking
One of the biggest challenges when building a PC is making sure all the components work together.

AIPO-GPT automatically checks things like CPU and motherboard compatibility, RAM requirements, GPU clearance, cooling capacity, power supply wattage, and physical case dimensions.

It explains these decisions so users understand not just which components to choose, but why they work together.

### Customization and Advanced Constraints
Users can customize their builds beyond just setting a budget. They can specify CPU core counts, graphics memory, system RAM, storage capacity, power limits, noise levels, and case sizes.

The optimizer also considers future upgrades. For example, it can recommend a power supply with enough headroom for a stronger GPU or a motherboard that supports additional memory.

### Cost and Performance Breakdown
Each recommended build includes a detailed breakdown of component prices, estimated power usage, and how much of the total budget is being spent. A responsive budget-composition donut summarizes the largest component shares while the accessible allocation controls open each part's rationale.

I also implemented a value score and upgrade-readiness score to help users understand the tradeoffs between different configurations.

If a user's budget is too low to meet their requirements, the application explains what is limiting the build and suggests more affordable alternatives.

### Interactive Interface
I built the interface to make comparing and adjusting builds straightforward.

Users can filter components, switch between recommendations, adjust their budgets, inspect individual parts, and see how changes affect their results. A live mission rail mirrors the active budget, workload, target, and priority, while CPU and GPU spotlight cards provide direct access to the two parts that shape performance most.

The application also includes mobile support, keyboard shortcuts, adjustable display settings, persistent lime, cyan, violet, and ember accent themes, and accessibility features.

A slim accessible progress rail in the sticky header shows how far the visitor has explored the long-form optimizer page.

The interactive GPU scene automatically pauses when it is offscreen or the browser tab is hidden, reducing unnecessary graphics work without changing the current view.

Keyboard users can focus the 3D graphics card, rotate it with the arrow keys, and press Home to restore the default camera view.

Visible reset and persistent auto-orbit controls make the same camera actions available to mouse and touch users, with gesture-specific help on touch devices.

The graphics-card stage can enter a native fullscreen inspection mode and returns cleanly with the browser's standard Escape control.

Cooling, power-delivery, and performance hotspots move the camera to relevant hardware details; the performance view reflects the GPU selected by the optimizer.

Exploded view reveals five labeled hardware layers—backplate, PCB, heatsink, shroud, and fan array—and each label focuses its part.

Persistent Eco, Auto, and High scene-quality controls let visitors trade particles, shadows, and pixel density for performance on their device.

The 3D lighting palette persists locally and exposes its selected color to assistive technology.

The global motion preference also governs the 3D card's fans, floating movement, automatic rotation, particles, RGB cycle, and exploded-view transitions.

If WebGL initialization fails or the browser releases its graphics context, the stage now presents a clear recovery panel without blocking the optimizer and can resume automatically when the context returns.

### Saving and Sharing Builds
Users can save configurations locally, revisit recent builds, compare new recommendations against previous ones, and share their settings through a URL.

Builds can also be exported as Markdown, CSV, or JSON files, making it easier to share recommendations or purchase components later.

## How It Works

The current version uses a deterministic recommendation engine, meaning the application evaluates components using predefined hardware specifications, compatibility rules, and scoring systems rather than relying on AI to guess which parts work together.

This makes the recommendations easier to verify and helps ensure that compatibility decisions are consistent.

The optimizer evaluates different component combinations, filters out incompatible options, and ranks the remaining builds based on the user's goals, budget, performance requirements, and upgrade preferences.

## Running Locally

To run AIPO-GPT, serve the `dist` directory using any static web server and open the local URL in your browser.

## Future Plans

This is the first working version of AIPO-GPT. My long-term goal is to integrate OpenAI-powered reasoning so users can describe more complicated requirements and have those requests translated into specific hardware constraints.

I also plan to expand the component database and improve how the application evaluates pricing and performance.

Ultimately, I want AIPO-GPT to combine the flexibility of AI with reliable hardware compatibility checks, making custom PC building more accessible to anyone, regardless of their technical experience.
