# Visualisation and Storytelling — Choosing Charts, Designing Dashboards, Presenting Findings

An analysis only creates value when someone understands it and acts. Interviewers test this by asking you to critique a chart, choose a chart for a question, sketch a dashboard, or present a take-home's findings in five minutes. This module covers the principles (perception, chart choice, clutter, colour), dashboard design, and how to structure a data story, with the formats Egyptian managers and executives actually use: Power BI pages and slide decks.

> [!focus]
> **Entry must:** pick the right chart for a question; remove clutter; title charts with the finding; design a clean one-page dashboard; present answer-first.
> **Mid adds:** perceptual principles (pre-attentive attributes, position vs area), colour for meaning and accessibility, honest axes, dashboard layout and audience, narrative structure, handling uncertainty and caveats.
> **Most asked:** *What chart would you use to show X?* · *What's wrong with this chart?* · *How do you design a dashboard for executives?* · *When would you use a pie chart?* · *Present your take-home findings.*
> **Time budget:** 2.5 hours.

## DA5.1 How people read charts 🟢 ⭐

People judge some visual encodings far more accurately than others. From most to least accurate (based on Cleveland and McGill's experiments):

1. **Position on a common scale** (bar ends, dots, line heights against one axis)
2. Position on non-aligned scales (small multiples)
3. **Length** (bars from a common baseline)
4. Angle and slope
5. **Area**
6. Volume, colour saturation and hue for quantities

That's why bar and line charts are the workhorses, and why pies (angles and areas), bubbles (areas) and 3-D charts (volumes) make comparisons hard.

> [!term] Pre-attentive attributes
> Visual properties the eye notices in under a quarter of a second, before conscious attention: colour hue, intensity, size, position, orientation, enclosure. Use **one** of them deliberately (one highlighted bar in the brand colour, the rest grey) to point the audience at the insight.

## DA5.2 Choosing the chart 🟢 ⭐

| The question | Chart | Notes |
|---|---|---|
| How did it change **over time**? | **Line** chart | Bars for few periods; avoid more than about five lines (use small multiples) |
| How do **categories compare**? | **Bar** chart, sorted, horizontal if labels are long | Start the axis at zero |
| **Part of a whole**? | Stacked bar, 100% bar, a treemap, or a simple table of percentages | A **pie** only with two or three slices and one clear point |
| How is a value **distributed**? | **Histogram**, box plot | Show skew and outliers ([[S6.1]]) |
| Is there a **relationship** between two measures? | **Scatter** plot (with a trend line) | Colour by group; beware overplotting |
| How do two groups compare across many categories? | Grouped bar, **dot plot** ("dumbbell") | Dumbbells show before/after cleanly |
| What contributes to a **change**? | **Waterfall** | Revenue bridge: last year → price → volume → mix → this year |
| Where does the funnel leak? | **Funnel** or a sorted bar of step conversion | Show step-to-step rates |
| How does a metric vary across two dimensions? | **Heat map** (a matrix with colour) | Region × month, hour × weekday |
| Geographic pattern? | **Map** (filled for rates, points for locations) | Only when geography matters; a sorted bar by governorate is often clearer |
| One number that matters | A **KPI card** with comparison (vs target, vs last period) and a sparkline | Context makes a number meaningful |
| Exact values to look up | A **table** with conditional formatting | Not everything should be a chart |

> [!say]
> "I start from the question. For a trend I'd use a line; to compare categories, a sorted bar from zero; for distributions, a histogram or box plot; for relationships, a scatter; and for explaining a change, a waterfall. I avoid pies unless there are two or three parts and one obvious message."

## DA5.3 Decluttering and honesty 🟢 ⭐

**Remove what doesn't help:** heavy gridlines, borders, 3-D effects, redundant legends (label the lines directly), unnecessary decimals, rotated axis labels (use horizontal bars instead), default chart titles like "Sum of Amount by Month".

**Use the title to say the finding:**

- ❌ "Revenue by month"
- ✅ "Revenue recovered in September after the Ramadan dip, led by the app channel"

**Honest charts:**

- **Bar charts start at zero**: a truncated axis makes a 2% difference look like 50%. Line charts may zoom in to show change, but say so.
- Same scales when comparing panels side by side.
- Show **uncertainty** where it matters: confidence intervals, ranges, sample sizes ([[S6.5]]).
- Per-capita or rates rather than raw totals when sizes differ (orders per 1,000 users in each governorate, not total orders).
- Don't cherry-pick start dates to manufacture a trend.

> [!mistake] Dual-axis charts
> Two y-axes with different scales invite readers to see relationships that are only an artefact of how the scales were chosen. Prefer two aligned charts, or index both series to 100 at the start.

## DA5.4 Colour 🟢

- **Grey by default, colour for emphasis:** one highlight colour draws the eye to the point.
- **Categorical** palettes for distinct groups (few, clearly different hues); **sequential** (light to dark) for ordered values; **diverging** (two hues around a midpoint) for above/below target or profit/loss.
- **Consistent meaning:** the same category is the same colour on every chart and page.
- **Accessibility:** about 1 in 12 men has some colour-vision deficiency, so avoid relying on red vs green alone; add labels, icons or patterns; check contrast ([[F1.8]]). Colour-blind-safe palettes (Okabe–Ito, ColorBrewer, Power BI's accessible themes) help.
- **Cultural and corporate conventions:** red for negative in finance; respect brand colours, but never at the cost of readability.

## DA5.5 Designing a dashboard 🟢 🟡 ⭐

**Start from the audience and their decisions**, not from the available data:

| Audience | Needs | Design |
|---|---|---|
| **Executives** | Are we on track? What needs attention? | A few KPI cards vs target and last period, one or two trend charts, exceptions highlighted; one page |
| **Managers** (sales, operations) | Where are the problems, and who owns them? | Breakdown by region, team and product; drill-through to detail; filters |
| **Analysts and operators** | Detail to investigate and act | Tables, filters, exports, drill-down |

**Layout:**

- The most important information **top-left** (where eyes start, for left-to-right readers; consider an RTL layout for Arabic-first audiences).
- **Overview first, then detail on demand** (Shneiderman's mantra: overview, zoom and filter, details on demand).
- Group related visuals; align to a grid; consistent fonts and number formats (EGP with thousands separators; one decimal for percentages).
- **5–8 visuals per page at most**; more pages or drill-through instead of cramming.
- Every KPI has **context**: vs target, vs last period, trend.
- Filters in a consistent place, with their current state visible.
- Define every metric in a tooltip or an "About" page ([[DA1.4]]).

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Executive dashboard wireframe: KPI cards row, trend chart, breakdown bar chart, exceptions table">
<rect class="sB" x="10" y="10" width="700" height="230" rx="10"/>
<g class="sT" text-anchor="middle">
<rect class="sA" x="25" y="25" width="160" height="58" rx="6"/><text x="105" y="50">Revenue</text><text class="sS" x="105" y="70">EGP 12.4M ▲ 8% vs LY</text>
<rect class="sA" x="200" y="25" width="160" height="58" rx="6"/><text x="280" y="50">Orders</text><text class="sS" x="280" y="70">48.2K ▲ 3%</text>
<rect class="sA" x="375" y="25" width="160" height="58" rx="6"/><text x="455" y="50">On-time %</text><text class="sS" x="455" y="70">91% ▼ 2 pts (target 95%)</text>
<rect class="sA" x="550" y="25" width="145" height="58" rx="6"/><text x="622" y="50">Refund rate</text><text class="sS" x="622" y="70">1.8% ●</text>
<rect class="sG" x="25" y="98" width="400" height="130" rx="6"/><text x="225" y="118">Trend: revenue vs target, 13 months</text>
<rect class="sW" x="440" y="98" width="255" height="62" rx="6"/><text x="567" y="124">By region (sorted bars)</text>
<rect class="sR" x="440" y="168" width="255" height="60" rx="6"/><text x="567" y="194">Exceptions: lowest on-time</text>
</g>
</svg><figcaption>An executive page: KPIs with context across the top, the main trend large, a breakdown, and the exceptions someone must act on.</figcaption></figure>

## DA5.6 Telling the story 🟢 ⭐

A data story has a **point**, a **structure** and an **ask**.

**Structure (for a five-minute presentation or a short deck):**

1. **The answer** in one or two sentences (the pyramid principle, [[DA1.9]]).
2. **Context:** what we looked at and why it matters (one slide).
3. **Three supporting findings**, one per slide, each with a chart whose **title states the finding**.
4. **Recommendation** and its expected impact, with how you'll measure it.
5. **Caveats and next steps:** data limitations, assumptions, what you'd analyse next.
6. **Appendix:** method, definitions, extra charts, for questions.

> [!term] Big idea
> Cole Nussbaumer Knaflic's test for a presentation: can you state your point in **one complete sentence** that says what's at stake and what you recommend? "Late deliveries in Giza are costing us repeat customers, and adding two evening couriers would recover most of it." If you can't write that sentence, the analysis isn't finished.

**Tips:** one message per slide; build complex charts step by step; speak to the insight, not the axes; prepare for "how confident are you?" with sample sizes and intervals; end with the decision you need from them.

> [!say]
> "Our on-time rate fell to 91% in September, and the drop is almost entirely evening orders in Giza, where courier capacity didn't grow with demand. Customers who got a late order were far less likely to reorder within 30 days. I recommend adding evening couriers in Giza for a four-week trial, measured on on-time rate and 30-day reorders."

## DA5.7 Critiquing a chart, the interview exercise 🟢 ⭐

When shown a chart, comment in this order:

1. **What's the message?** Is it obvious within five seconds? Does the title state it?
2. **Is the chart type right** for the question ([[DA5.2]])?
3. **Is it honest?** Axis baselines, scales, cherry-picked ranges, missing context (targets, previous period), raw counts vs rates.
4. **Is it cluttered?** Gridlines, 3-D, legends, decimals, too many colours or series.
5. **Is it accessible?** Colour dependence, contrast, text size.
6. **What would you change?** Say concretely: "sort the bars, label them directly, grey everything except Giza, and title it with the finding."

## DA5.8 Tools for visualising 🟢

| Tool | When |
|---|---|
| **Power BI** | Interactive, shared, refreshable dashboards ([[DA4]]) |
| **Excel** | Quick charts, finance teams, one-off analyses ([[DA2.8]]) |
| **Tableau** | Visual exploration; some multinationals |
| **Python** (matplotlib, seaborn, Plotly) | Analyses, notebooks, reproducible reports ([[S7.10]]) |
| **Slides** (PowerPoint, Google Slides) | Presenting findings to decision-makers: still the most common format for executives |

> [!lab] Redesign three charts
> Find three charts from your old reports, a news site or the AI Journey notebooks. For each: write the finding as a title, critique it with the checklist, and redraw it (Excel, Power BI or Python) with the fixes. Then make a five-slide deck from your Superstore or Olist analysis following the story structure. Rehearse it aloud in five minutes. This is the exact "present your take-home" exercise.

## DA5.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Which chart for a trend over time? | A line chart (bars for a few periods). |
| Which chart to compare categories? | A sorted bar chart starting at zero, horizontal if labels are long. |
| When is a pie chart acceptable? | Two or three parts with one obvious message; otherwise a bar chart is easier to read. |
| How do you show a distribution? | A histogram or box plot. |
| How do you explain what drove a change? | A waterfall (bridge) chart. |
| Why should bar charts start at zero? | Bar length encodes value; a truncated axis exaggerates differences. |
| What's wrong with dual axes? | Arbitrary scales create misleading visual relationships; use two charts or an index. |
| How do you use colour well? | Grey by default, one highlight for the message, consistent meanings, not red/green alone. |
| How do you design an executive dashboard? | Few KPIs with targets and trends, the main trend, a breakdown, exceptions; one page, top-left first. |
| How do you structure a findings presentation? | Answer first, context, three findings with titled charts, recommendation and impact, caveats, appendix. |
| What's a good chart title? | One that states the finding, not the variables. |
| How do you critique a chart? | Message, chart type, honesty, clutter, accessibility, then concrete fixes. |

## Key takeaways

> [!check]
> - Choose the chart from the question; position and length beat angle and area.
> - Declutter, use one highlight colour, and title every chart with its finding.
> - Be honest: zero baselines for bars, rates over raw counts, uncertainty shown.
> - Design dashboards for an audience's decisions: KPIs with context, overview then detail.
> - Present answer-first with one big idea and a clear ask.

## Sources

- Cole Nussbaumer Knaflic, *Storytelling with Data* (Wiley, 2015) and [storytellingwithdata.com](https://www.storytellingwithdata.com/).
- William S. Cleveland and Robert McGill, "Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods" (*Journal of the American Statistical Association*, 1984).
- Edward Tufte, *The Visual Display of Quantitative Information*, 2nd ed. (2001).
- Stephen Few, *Information Dashboard Design*, 2nd ed. (2013).
- Ben Shneiderman, "The Eyes Have It" (1996), the visual information-seeking mantra.
- Claus Wilke, [*Fundamentals of Data Visualization*](https://clauswilke.com/dataviz/) (free online).
- Microsoft Learn: [Power BI report design tips](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-tips-and-tricks-for-creating-reports), [Accessibility in Power BI reports](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-overview).
- Okabe and Ito, [Color Universal Design](https://jfly.uni-koeln.de/color/) palette; [ColorBrewer](https://colorbrewer2.org/).
