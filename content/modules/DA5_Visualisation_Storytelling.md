# Visualisation and Storytelling — Choosing Charts, Designing Dashboards, Presenting Findings

An analysis only creates value when someone understands it and acts. Interviewers test this by asking you to critique a chart, choose a chart for a question, sketch a dashboard, or present a take-home's findings in five minutes. This module covers the principles (perception, chart choice, clutter, colour), dashboard design, and how to structure a data story, with the formats Egyptian managers and executives actually use: Power BI pages and slide decks.

> [!focus]
> **Entry must:** pick the right chart for a question; remove clutter; title charts with the finding; design a clean one-page dashboard; present answer-first.
> **Mid adds:** perceptual principles (pre-attentive attributes, position vs area), colour for meaning and accessibility, honest axes, dashboard layout and audience, narrative structure, handling uncertainty and caveats.
> **Most asked:** *What chart would you use to show X?* · *What's wrong with this chart?* · *How do you design a dashboard for executives?* · *When would you use a pie chart?* · *Present your take-home findings.*
> **Time budget:** 2.5 hours.

## DA5.0 Foundations: marks, channels and the reader's eye 🟢

A chart **encodes** numbers as visual properties. Each chart is a choice of **marks** (bars, points, lines, areas) and of **channels** that carry the values: position, length, angle, area, colour.

- **Quantities** (revenue, counts, rates) need channels the eye compares accurately: **position** and **length**.
- **Categories** (city, channel) need channels that tell things apart without implying an order: separate positions, different **hues**.
- **Ordered values** (months, low/medium/high) need channels with a natural order: position along an axis, colour **lightness**.

The reader's job should be **comparing**, not decoding. Everything else in this module (choosing charts, decluttering, colour, dashboards) follows from that.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="The same four values shown as bars, as pie slices and as bubbles; the bars make the ranking obvious while angles and areas are hard to compare">
<text class="sGt" x="120" y="22" text-anchor="middle">position + length</text><text class="sWt" x="360" y="22" text-anchor="middle">angle (pie)</text><text class="sRt" x="590" y="22" text-anchor="middle">area (bubbles)</text>
<line class="sLm" x1="30" y1="180" x2="220" y2="180"/>
<rect class="sA" x="40" y="69.6" width="32" height="110.4" rx="3"/><text class="sT" x="56" y="196" text-anchor="middle">A</text>
<rect class="sA" x="85" y="42" width="32" height="138" rx="3"/><text class="sT" x="101" y="196" text-anchor="middle">B</text>
<rect class="sA" x="130" y="55.8" width="32" height="124.2" rx="3"/><text class="sT" x="146" y="196" text-anchor="middle">C</text>
<rect class="sA" x="175" y="92.6" width="32" height="87.4" rx="3"/><text class="sT" x="191" y="196" text-anchor="middle">D</text>
<path class="sA" d="M360 108 L360.0 36.0 A72 72 0 0 1 431.9 103.5 Z"/>
<text class="sT" x="391.489" y="79.4674" text-anchor="middle">A</text>
<path class="sB" d="M360 108 L431.9 103.5 A72 72 0 0 1 342.1 177.7 Z"/>
<text class="sT" x="389.322" y="148.444" text-anchor="middle">B</text>
<path class="sV" d="M360 108 L342.1 177.7 A72 72 0 0 1 293.1 81.5 Z"/>
<text class="sT" x="319.014" y="133.884" text-anchor="middle">C</text>
<path class="sG" d="M360 108 L293.1 81.5 A72 72 0 0 1 360.0 36.0 Z"/>
<text class="sT" x="334.144" y="74.9543" text-anchor="middle">D</text>
<circle class="sA" cx="510" cy="108" r="24.5"/><text class="sT" x="510" y="113" text-anchor="middle">A</text>
<circle class="sA" cx="564" cy="108" r="27.4"/><text class="sT" x="564" y="113" text-anchor="middle">B</text>
<circle class="sA" cx="618" cy="108" r="26.0"/><text class="sT" x="618" y="113" text-anchor="middle">C</text>
<circle class="sA" cx="672" cy="108" r="21.8"/><text class="sT" x="672" y="113" text-anchor="middle">D</text>
<text class="sS" x="360" y="214" text-anchor="middle">which is biggest, and by how much? Easy on the left, guesswork on the right</text>
</svg><figcaption>Four numbers, three encodings. Position and length are read accurately; angles and areas are not.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 148" role="img" aria-label="A grid of grey dots with a single red dot that stands out immediately">
<circle class="sP" cx="60" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="98" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="136" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="174" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="212" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="250" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="288" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="326" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="364" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="402" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="440" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="478" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="516" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="554" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="592" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="630" cy="24" r="7" opacity=".35"/>
<circle class="sP" cx="60" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="98" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="136" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="174" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="212" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="250" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="288" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="326" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="364" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="402" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="440" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="478" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="516" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="554" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="592" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="630" cy="50" r="7" opacity=".35"/>
<circle class="sP" cx="60" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="98" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="136" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="174" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="212" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="250" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="288" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="326" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="364" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="402" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="440" cy="76" r="7" opacity=".35"/>
<circle class="sPr" cx="478" cy="76" r="8"/>
<circle class="sP" cx="516" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="554" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="592" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="630" cy="76" r="7" opacity=".35"/>
<circle class="sP" cx="60" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="98" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="136" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="174" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="212" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="250" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="288" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="326" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="364" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="402" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="440" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="478" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="516" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="554" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="592" cy="102" r="7" opacity=".35"/>
<circle class="sP" cx="630" cy="102" r="7" opacity=".35"/>
<text class="sS" x="360" y="136" text-anchor="middle">you found the odd one before reading this sentence: that's a pre-attentive attribute</text>
</svg><figcaption>One colour, used once, does the work of an arrow and a paragraph.</figcaption></figure>

## DA5.2 Choosing the chart 🟢 ⭐

<figure class="dia"><svg viewBox="0 0 720 284" role="img" aria-label="Chart chooser: change over time to a line, comparing categories to a sorted bar, part of a whole to a 100% bar, distribution to a histogram, relationship to a scatter, explaining a change to a waterfall, one key number to a KPI card">
<rect class="sV" x="14" y="116" width="150" height="50" rx="8"/><text class="sT" x="89" y="139" text-anchor="middle">what is the</text><text class="sT" x="89" y="155" text-anchor="middle">question?</text>
<path class="sLm" d="M164 141 H186 V29 H206" fill="none"/>
<rect class="sB" x="206" y="14" width="220" height="30" rx="6"/><text class="sC" x="316" y="34" text-anchor="middle">change over time</text>
<line class="sLm" x1="426" y1="29" x2="456" y2="29" marker-end="url(#ahm)"/><polyline class="sL" points="470,37 490,29 510,33 530,21" fill="none" stroke-width="2"/><text class="sT" x="550" y="34">line</text>
<path class="sLm" d="M164 141 H186 V67 H206" fill="none"/>
<rect class="sB" x="206" y="52" width="220" height="30" rx="6"/><text class="sC" x="316" y="72" text-anchor="middle">compare categories</text>
<line class="sLm" x1="426" y1="67" x2="456" y2="67" marker-end="url(#ahm)"/><rect class="sA" x="470" y="57" width="60" height="6" rx="1"/><rect class="sA" x="470" y="65" width="44" height="6" rx="1"/><rect class="sA" x="470" y="73" width="28" height="6" rx="1"/><text class="sT" x="550" y="72">sorted bar</text>
<path class="sLm" d="M164 141 H186 V105 H206" fill="none"/>
<rect class="sB" x="206" y="90" width="220" height="30" rx="6"/><text class="sC" x="316" y="110" text-anchor="middle">part of a whole</text>
<line class="sLm" x1="426" y1="105" x2="456" y2="105" marker-end="url(#ahm)"/><rect class="sA" x="470" y="99" width="30" height="14" rx="1"/><rect class="sB" x="500" y="99" width="18" height="14" rx="1"/><rect class="sG" x="518" y="99" width="12" height="14" rx="1"/><text class="sT" x="550" y="110">100% bar</text>
<path class="sLm" d="M164 141 H186 V143 H206" fill="none"/>
<rect class="sB" x="206" y="128" width="220" height="30" rx="6"/><text class="sC" x="316" y="148" text-anchor="middle">distribution</text>
<line class="sLm" x1="426" y1="143" x2="456" y2="143" marker-end="url(#ahm)"/><rect class="sA" x="470" y="150" width="9" height="5" rx="1"/><rect class="sA" x="480" y="143" width="9" height="12" rx="1"/><rect class="sA" x="490" y="135" width="9" height="20" rx="1"/><rect class="sA" x="500" y="141" width="9" height="14" rx="1"/><rect class="sA" x="510" y="148" width="9" height="7" rx="1"/><rect class="sA" x="520" y="152" width="9" height="3" rx="1"/><text class="sT" x="550" y="148">histogram</text>
<path class="sLm" d="M164 141 H186 V181 H206" fill="none"/>
<rect class="sB" x="206" y="166" width="220" height="30" rx="6"/><text class="sC" x="316" y="186" text-anchor="middle">relationship</text>
<line class="sLm" x1="426" y1="181" x2="456" y2="181" marker-end="url(#ahm)"/><circle class="sP" cx="474" cy="189" r="2.5"/><circle class="sP" cx="482" cy="185" r="2.5"/><circle class="sP" cx="490" cy="186" r="2.5"/><circle class="sP" cx="498" cy="179" r="2.5"/><circle class="sP" cx="506" cy="181" r="2.5"/><circle class="sP" cx="514" cy="175" r="2.5"/><circle class="sP" cx="524" cy="173" r="2.5"/><text class="sT" x="550" y="186">scatter</text>
<path class="sLm" d="M164 141 H186 V219 H206" fill="none"/>
<rect class="sB" x="206" y="204" width="220" height="30" rx="6"/><text class="sC" x="316" y="224" text-anchor="middle">explain a change</text>
<line class="sLm" x1="426" y1="219" x2="456" y2="219" marker-end="url(#ahm)"/><rect class="sB" x="470" y="215" width="10" height="16" rx="1"/><rect class="sG" x="484" y="211" width="10" height="4" rx="1"/><rect class="sR" x="498" y="211" width="10" height="8" rx="1"/><rect class="sB" x="512" y="209" width="10" height="22" rx="1"/><text class="sT" x="550" y="224">waterfall</text>
<path class="sLm" d="M164 141 H186 V257 H206" fill="none"/>
<rect class="sB" x="206" y="242" width="220" height="30" rx="6"/><text class="sC" x="316" y="262" text-anchor="middle">one key number</text>
<line class="sLm" x1="426" y1="257" x2="456" y2="257" marker-end="url(#ahm)"/><rect class="sN" x="470" y="245" width="60" height="24" rx="4"/><text class="sT" x="500" y="262" text-anchor="middle">91%</text><text class="sT" x="550" y="262">KPI card</text>
</svg><figcaption>Name the question first; the chart usually follows.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Revenue bridge waterfall: last year 100, price plus 15, volume minus 10, mix plus 5, this year 110">
<line class="sLm" x1="60" y1="210" x2="660" y2="210"/>
<rect class="sB" x="90" y="60" width="70" height="150" rx="3"/><text class="sT" x="125" y="228" text-anchor="middle">last year</text>
<text class="sC" x="125" y="54" text-anchor="middle">100</text>
<line class="sD" x1="160" y1="60" x2="205" y2="60"/>
<rect class="sG" x="205" y="37.5" width="70" height="22.5" rx="3"/><text class="sT" x="240" y="228" text-anchor="middle">price</text>
<text class="sC" x="240" y="31.5" text-anchor="middle">+15</text>
<line class="sD" x1="275" y1="38" x2="320" y2="38"/>
<rect class="sR" x="320" y="37.5" width="70" height="15" rx="3"/><text class="sT" x="355" y="228" text-anchor="middle">volume</text>
<text class="sC" x="355" y="31.5" text-anchor="middle">-10</text>
<line class="sD" x1="390" y1="52" x2="435" y2="52"/>
<rect class="sG" x="435" y="45" width="70" height="7.5" rx="3"/><text class="sT" x="470" y="228" text-anchor="middle">mix</text>
<text class="sC" x="470" y="39" text-anchor="middle">+5</text>
<line class="sD" x1="505" y1="45" x2="550" y2="45"/>
<rect class="sB" x="550" y="45" width="70" height="165" rx="3"/><text class="sT" x="585" y="228" text-anchor="middle">this year</text>
<text class="sC" x="585" y="39" text-anchor="middle">110</text>
</svg><figcaption>A revenue bridge. Each floating bar is one driver, so "why did revenue grow 10%?" is answered in one picture.</figcaption></figure>

> [!say]
> "I start from the question. For a trend I'd use a line; to compare categories, a sorted bar from zero; for distributions, a histogram or box plot; for relationships, a scatter; and for explaining a change, a waterfall. I avoid pies unless there are two or three parts and one obvious message."

## DA5.3 Decluttering and honesty 🟢 ⭐

**Remove what doesn't help:** heavy gridlines, borders, 3-D effects, redundant legends (label the lines directly), unnecessary decimals, rotated axis labels (use horizontal bars instead), default chart titles like "Sum of Amount by Month".

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="Before and after: a cluttered bar chart with gridlines, a legend, decimals and four colours, and a clean sorted bar chart with direct labels, grey bars and the app highlighted under a title that states the finding">
<text class="sC" x="176" y="22" text-anchor="middle">Sum of Revenue by Channel</text>
<line class="sLm" x1="40" y1="180" x2="320" y2="180"/><text class="sC" x="34" y="184" text-anchor="end">0</text>
<line class="sLm" x1="40" y1="150" x2="320" y2="150"/><text class="sC" x="34" y="154" text-anchor="end">20</text>
<line class="sLm" x1="40" y1="120" x2="320" y2="120"/><text class="sC" x="34" y="124" text-anchor="end">40</text>
<line class="sLm" x1="40" y1="90" x2="320" y2="90"/><text class="sC" x="34" y="94" text-anchor="end">60</text>
<line class="sLm" x1="40" y1="60" x2="320" y2="60"/><text class="sC" x="34" y="64" text-anchor="end">80</text>
<rect class="sB" x="60" y="116.445" width="40" height="63.555" rx="2"/><text class="sC" x="80" y="108.445" text-anchor="middle">42.37</text>
<rect class="sA" x="124" y="87.3" width="40" height="92.7" rx="2"/><text class="sC" x="144" y="79.3" text-anchor="middle">61.80</text>
<rect class="sV" x="188" y="152.925" width="40" height="27.075" rx="2"/><text class="sC" x="208" y="144.925" text-anchor="middle">18.05</text>
<rect class="sW" x="252" y="141.84" width="40" height="38.16" rx="2"/><text class="sC" x="272" y="133.84" text-anchor="middle">25.44</text>
<rect class="sN" x="250" y="34" width="96" height="70" rx="4"/><rect class="sB" x="258" y="42" width="8" height="8" rx="1"/><text class="sC" x="272" y="50">web</text><rect class="sA" x="258" y="57" width="8" height="8" rx="1"/><text class="sC" x="272" y="65">app</text><rect class="sV" x="258" y="72" width="8" height="8" rx="1"/><text class="sC" x="272" y="80">call centre</text><rect class="sW" x="258" y="87" width="8" height="8" rx="1"/><text class="sC" x="272" y="95">partners</text>
<text class="sRt" x="176" y="206" text-anchor="middle">gridlines, legend, decimals, four colours</text>
<line class="sD" x1="360" y1="10" x2="360" y2="216"/>
<text class="sT" x="540" y="22" text-anchor="middle">The app drove September's revenue</text>
<text class="sC" x="470" y="62" text-anchor="end">app</text><rect class="sA" x="478" y="44" width="185.4" height="24" rx="3"/><text class="sT" x="669.4" y="61">62k</text>
<text class="sC" x="470" y="96" text-anchor="end">web</text><rect class="sN" x="478" y="78" width="127.11" height="24" rx="3"/><text class="sC" x="611.11" y="95">42k</text>
<text class="sC" x="470" y="130" text-anchor="end">partners</text><rect class="sN" x="478" y="112" width="76.32" height="24" rx="3"/><text class="sC" x="560.32" y="129">25k</text>
<text class="sC" x="470" y="164" text-anchor="end">call centre</text><rect class="sN" x="478" y="146" width="54.15" height="24" rx="3"/><text class="sC" x="538.15" y="163">18k</text>
<text class="sGt" x="540" y="206" text-anchor="middle">sorted, labelled directly, one colour for the point</text>
</svg><figcaption>Same data. The right-hand chart can be understood in five seconds because everything that doesn't carry the message is gone.</figcaption></figure>

**Use the title to say the finding:**

- ❌ "Revenue by month"
- ✅ "Revenue recovered in September after the Ramadan dip, led by the app channel"

**Honest charts:**

- **Bar charts start at zero**: a truncated axis makes a 2% difference look like 50%. Line charts may zoom in to show change, but say so.
- Same scales when comparing panels side by side.
- Show **uncertainty** where it matters: confidence intervals, ranges, sample sizes ([[S6.5]]).
- Per-capita or rates rather than raw totals when sizes differ (orders per 1,000 users in each governorate, not total orders).
- Don't cherry-pick start dates to manufacture a trend.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="The same two quarterly values, 98 and 100, drawn as bars from zero and from 97; the truncated axis makes a 2% rise look like a tripling">
<text class="sGt" x="180" y="22" text-anchor="middle">axis from 0: honest</text>
<line class="sLm" x1="60" y1="190" x2="300" y2="190"/><line class="sLm" x1="60" y1="190" x2="60" y2="40"/>
<text class="sC" x="54" y="194" text-anchor="end">0</text><text class="sC" x="54" y="54" text-anchor="end">100</text>
<rect class="sA" x="100" y="52.8" width="60" height="137.2" rx="3"/><text class="sT" x="130" y="208" text-anchor="middle">Q1</text><text class="sC" x="130" y="46.8" text-anchor="middle">98</text>
<rect class="sA" x="200" y="50" width="60" height="140" rx="3"/><text class="sT" x="230" y="208" text-anchor="middle">Q2</text><text class="sC" x="230" y="44" text-anchor="middle">100</text>
<text class="sRt" x="540" y="22" text-anchor="middle">axis from 97: misleading</text>
<line class="sLm" x1="420" y1="190" x2="660" y2="190"/><line class="sLm" x1="420" y1="190" x2="420" y2="40"/>
<text class="sC" x="414" y="194" text-anchor="end">97</text><text class="sC" x="414" y="54" text-anchor="end">100</text>
<rect class="sA" x="460" y="143.333" width="60" height="46.6667" rx="3"/><text class="sT" x="490" y="208" text-anchor="middle">Q1</text><text class="sC" x="490" y="137.333" text-anchor="middle">98</text>
<rect class="sA" x="560" y="50" width="60" height="140" rx="3"/><text class="sT" x="590" y="208" text-anchor="middle">Q2</text><text class="sC" x="590" y="44" text-anchor="middle">100</text>
<text class="sGt" x="180" y="228" text-anchor="middle">a 2% rise looks like 2%</text><text class="sRt" x="540" y="228" text-anchor="middle">the same 2% looks like tripling</text>
</svg><figcaption>Bars encode values by length, so their axis must start at zero. Lines encode by position and may zoom, if the axis says so.</figcaption></figure>

> [!mistake] Dual-axis charts
> Two y-axes with different scales invite readers to see relationships that are only an artefact of how the scales were chosen. Prefer two aligned charts, or index both series to 100 at the start.

## DA5.4 Colour 🟢

- **Grey by default, colour for emphasis:** one highlight colour draws the eye to the point.
- **Categorical** palettes for distinct groups (few, clearly different hues); **sequential** (light to dark) for ordered values; **diverging** (two hues around a midpoint) for above/below target or profit/loss.
- **Consistent meaning:** the same category is the same colour on every chart and page.
- **Accessibility:** about 1 in 12 men has some colour-vision deficiency, so avoid relying on red vs green alone; add labels, icons or patterns; check contrast ([[F1.8]]). Colour-blind-safe palettes (Okabe–Ito, ColorBrewer, Power BI's accessible themes) help.
- **Cultural and corporate conventions:** red for negative in finance; respect brand colours, but never at the cost of readability.

<figure class="dia"><svg viewBox="0 0 720 198" role="img" aria-label="Three kinds of colour palette: categorical for distinct groups, sequential for ordered values, diverging around a midpoint">
<text class="sT" x="150" y="40" text-anchor="end">categorical</text><text class="sT" x="150" y="92" text-anchor="end">sequential</text><text class="sT" x="150" y="144" text-anchor="end">diverging</text>
<rect class="sB" x="164" y="22" width="58" height="30" rx="4"/>
<rect class="sA" x="228" y="22" width="58" height="30" rx="4"/>
<rect class="sG" x="292" y="22" width="58" height="30" rx="4"/>
<rect class="sW" x="356" y="22" width="58" height="30" rx="4"/>
<rect class="sV" x="420" y="22" width="58" height="30" rx="4"/>
<rect class="sG" x="164" y="74" width="58" height="30" rx="4" opacity="0.2"/>
<rect class="sG" x="228" y="74" width="58" height="30" rx="4" opacity="0.4"/>
<rect class="sG" x="292" y="74" width="58" height="30" rx="4" opacity="0.6"/>
<rect class="sG" x="356" y="74" width="58" height="30" rx="4" opacity="0.8"/>
<rect class="sG" x="420" y="74" width="58" height="30" rx="4" opacity="1.0"/>
<rect class="sR" x="164" y="126" width="58" height="30" rx="4" opacity="1"/>
<rect class="sR" x="228" y="126" width="58" height="30" rx="4" opacity="0.5"/>
<rect class="sN" x="292" y="126" width="58" height="30" rx="4" opacity="1"/>
<rect class="sG" x="356" y="126" width="58" height="30" rx="4" opacity="0.5"/>
<rect class="sG" x="420" y="126" width="58" height="30" rx="4" opacity="1"/>
<text class="sC" x="494" y="42">distinct groups</text><text class="sC" x="494" y="94">ordered: low → high</text><text class="sC" x="494" y="146">below / above a target</text>
<text class="sS" x="360" y="186" text-anchor="middle">add labels or icons too: about 1 in 12 men can't rely on red versus green</text>
</svg><figcaption>Pick the palette from the data's type, not from taste.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 156" role="img" aria-label="A data story as slides: the answer, context, three findings, recommendation, caveats, then an appendix">
<rect class="sA" x="10" y="40" width="80" height="56" rx="6"/><text class="sC" x="50" y="114" text-anchor="middle">answer</text>
<text class="sT" x="50" y="72" text-anchor="middle">one line</text>
<rect class="sB" x="98" y="40" width="80" height="56" rx="6"/><text class="sC" x="138" y="114" text-anchor="middle">context</text>
<rect class="sG" x="186" y="40" width="80" height="56" rx="6"/><text class="sC" x="226" y="114" text-anchor="middle">finding 1</text>
<polyline class="sL" points="198,84 218,76 238,80 254,58" fill="none" stroke-width="2"/>
<rect class="sG" x="274" y="40" width="80" height="56" rx="6"/><text class="sC" x="314" y="114" text-anchor="middle">finding 2</text>
<polyline class="sL" points="286,84 306,76 326,80 342,58" fill="none" stroke-width="2"/>
<rect class="sG" x="362" y="40" width="80" height="56" rx="6"/><text class="sC" x="402" y="114" text-anchor="middle">finding 3</text>
<polyline class="sL" points="374,84 394,76 414,80 430,58" fill="none" stroke-width="2"/>
<rect class="sV" x="450" y="40" width="80" height="56" rx="6"/><text class="sC" x="490" y="114" text-anchor="middle">recommend</text>
<rect class="sW" x="538" y="40" width="80" height="56" rx="6"/><text class="sC" x="578" y="114" text-anchor="middle">caveats</text>
<rect class="sN" x="626" y="40" width="80" height="56" rx="6"/><text class="sC" x="666" y="114" text-anchor="middle">appendix</text>
<path class="sLm" d="M10 32 V24 H530 V32" fill="none"/><text class="sC" x="269" y="16" text-anchor="middle">the five-minute version</text>
<line class="sD" x1="622" y1="34" x2="622" y2="104"/>
<text class="sS" x="360" y="144" text-anchor="middle">each finding slide: one chart, and a title that states the finding</text>
</svg><figcaption>Answer first, evidence next, the ask at the end. The appendix is for questions, not for the talk.</figcaption></figure>

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
