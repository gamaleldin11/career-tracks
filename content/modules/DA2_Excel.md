# Excel for Analysts — Tables, Lookups, Dynamic Arrays, PivotTables and Power Query

Almost every analyst posting in Egypt lists Excel, and many interviews include a practical Excel test: "here's a sales file, build a summary by region and month, find the top products, flag late orders". Your gaps file is honest that there's no Excel evidence on your drives, so this module is both the theory and a plan to produce that evidence quickly. It assumes **Excel for Microsoft 365**, which has dynamic arrays; where older versions differ, it says so.

> [!focus]
> **Entry must:** clean data into an Excel Table; SUMIFS, COUNTIFS, IF and IFERROR; XLOOKUP (and why VLOOKUP breaks); absolute vs relative references; a PivotTable with grouping, % of total and slicers; conditional formatting; a clear chart.
> **Mid adds:** dynamic arrays (FILTER, UNIQUE, SORT, LET), GROUPBY and PIVOTBY, Power Query for repeatable cleaning and merges, the data model with relationships and measures, what-if tools, basic macros.
> **Most asked:** *VLOOKUP vs XLOOKUP vs INDEX/MATCH?* · *What's a PivotTable and how do you show % of total?* · *How do you remove duplicates / clean messy data?* · *What is Power Query?* · *Absolute vs relative reference?* · Practical: *summarise this file by region and month.*
> **Time budget:** 4 hours, with Excel open, doing every example.

## DA2.0 Foundations: cells, formulas and references 🟢

A worksheet is a grid: columns are lettered, rows numbered, so every **cell** has an address such as `B2`. A cell holds either a **value** you typed or a **formula** (starting with `=`) that calculates from other cells. Excel tracks which formulas depend on which cells, so changing `B2` recalculates everything that uses it, directly or indirectly.

What makes spreadsheets scale is **how references copy**. A plain reference like `B2` is stored *relative to the formula*: "one column to my left, same row". Copy the formula down and it becomes `B3`, `B4`… A **`$`** pins the column, the row or both, so one formula filled down a thousand rows can still point at a single exchange-rate cell.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 196" role="img" aria-label="Copying the formula =B2*$E$1 down a column: the relative reference to B changes row by row while the absolute reference to E1 stays fixed; without the dollar signs the copy points at an empty cell">
<rect class="sN" x="60" y="44" width="80" height="22" rx="0"/><text class="sC" x="100" y="60" text-anchor="middle">A</text><rect class="sN" x="140" y="44" width="80" height="22" rx="0"/><text class="sC" x="180" y="60" text-anchor="middle">B</text><rect class="sN" x="220" y="44" width="80" height="22" rx="0"/><text class="sC" x="260" y="60" text-anchor="middle">C</text><rect class="sN" x="300" y="44" width="80" height="22" rx="0"/><text class="sC" x="340" y="60" text-anchor="middle">D</text><rect class="sN" x="380" y="44" width="80" height="22" rx="0"/><text class="sC" x="420" y="60" text-anchor="middle">E</text><rect class="sN" x="30" y="66" width="30" height="30" rx="0"/><text class="sC" x="45" y="86" text-anchor="middle">1</text><rect class="sN" x="60" y="66" width="80" height="30" rx="0"/><rect class="sN" x="140" y="66" width="80" height="30" rx="0"/><rect class="sN" x="220" y="66" width="80" height="30" rx="0"/><rect class="sN" x="300" y="66" width="80" height="30" rx="0"/><rect class="sN" x="380" y="66" width="80" height="30" rx="0"/><rect class="sN" x="30" y="96" width="30" height="30" rx="0"/><text class="sC" x="45" y="116" text-anchor="middle">2</text><rect class="sN" x="60" y="96" width="80" height="30" rx="0"/><rect class="sN" x="140" y="96" width="80" height="30" rx="0"/><rect class="sN" x="220" y="96" width="80" height="30" rx="0"/><rect class="sN" x="300" y="96" width="80" height="30" rx="0"/><rect class="sN" x="380" y="96" width="80" height="30" rx="0"/><rect class="sN" x="30" y="126" width="30" height="30" rx="0"/><text class="sC" x="45" y="146" text-anchor="middle">3</text><rect class="sN" x="60" y="126" width="80" height="30" rx="0"/><rect class="sN" x="140" y="126" width="80" height="30" rx="0"/><rect class="sN" x="220" y="126" width="80" height="30" rx="0"/><rect class="sN" x="300" y="126" width="80" height="30" rx="0"/><rect class="sN" x="380" y="126" width="80" height="30" rx="0"/><rect class="sN" x="30" y="156" width="30" height="30" rx="0"/><text class="sC" x="45" y="176" text-anchor="middle">4</text><rect class="sN" x="60" y="156" width="80" height="30" rx="0"/><rect class="sN" x="140" y="156" width="80" height="30" rx="0"/><rect class="sN" x="220" y="156" width="80" height="30" rx="0"/><rect class="sN" x="300" y="156" width="80" height="30" rx="0"/><rect class="sN" x="380" y="156" width="80" height="30" rx="0"/>
<rect class="sN" x="60" y="8" width="400" height="26" rx="4"/><text class="sM" x="72" y="26">fx</text>
<text class="sT" x="100" y="86" text-anchor="middle">item</text>
<text class="sT" x="180" y="86" text-anchor="middle">price</text>
<text class="sT" x="260" y="86" text-anchor="middle">+ VAT</text>
<text class="sC" x="420" y="86" text-anchor="middle">1.14</text>
<text class="sC" x="100" y="116" text-anchor="middle">pen</text>
<text class="sC" x="180" y="116" text-anchor="middle">10</text>
<text class="sC" x="100" y="146" text-anchor="middle">book</text>
<text class="sC" x="180" y="146" text-anchor="middle">80</text>
<text class="sC" x="100" y="176" text-anchor="middle">bag</text>
<text class="sC" x="180" y="176" text-anchor="middle">250</text>
<text class="sC" x="468" y="86">← VAT factor</text>
<g data-s="1-1"><rect class="sA" x="222" y="98" width="76" height="26" rx="3" opacity=".6"/><rect class="sG" x="142" y="98" width="76" height="26" rx="3" opacity=".6"/><rect class="sV" x="382" y="68" width="76" height="26" rx="3" opacity=".6"/><text class="sC" x="96" y="26" xml:space="preserve" style="white-space:pre">=B2*$E$1</text><line class="sLg" x1="226" y1="111" x2="190" y2="111" marker-end="url(#ahg)"/><line class="sLv" x1="280" y1="102" x2="416" y2="82" marker-end="url(#ahv)"/></g>
<g data-s="1"><text class="sC" x="260" y="116" text-anchor="middle">11.40</text></g>
<g data-s="2-2"><rect class="sA" x="222" y="128" width="76" height="26" rx="3" opacity=".6"/><rect class="sG" x="142" y="128" width="76" height="26" rx="3" opacity=".6"/><rect class="sV" x="382" y="68" width="76" height="26" rx="3" opacity=".6"/><text class="sC" x="96" y="26" xml:space="preserve" style="white-space:pre">=B3*$E$1</text><line class="sLg" x1="226" y1="141" x2="190" y2="141" marker-end="url(#ahg)"/><line class="sLv" x1="280" y1="132" x2="416" y2="82" marker-end="url(#ahv)"/></g>
<g data-s="2-3"><text class="sC" x="260" y="146" text-anchor="middle">91.20</text></g>
<g data-s="3-3"><rect class="sA" x="222" y="158" width="76" height="26" rx="3" opacity=".6"/><rect class="sG" x="142" y="158" width="76" height="26" rx="3" opacity=".6"/><rect class="sV" x="382" y="68" width="76" height="26" rx="3" opacity=".6"/><text class="sC" x="96" y="26" xml:space="preserve" style="white-space:pre">=B4*$E$1</text><line class="sLg" x1="226" y1="171" x2="190" y2="171" marker-end="url(#ahg)"/><line class="sLv" x1="280" y1="162" x2="416" y2="82" marker-end="url(#ahv)"/></g>
<g data-s="3"><text class="sC" x="260" y="176" text-anchor="middle">285.00</text></g>
<g data-s="4-4"><rect class="sR" x="222" y="128" width="76" height="26" rx="3" opacity=".6"/><rect class="sR" x="382" y="98" width="76" height="26" rx="3" opacity=".6"/><text class="sRt" x="260" y="146" text-anchor="middle">0</text><text class="sC" x="96" y="26" xml:space="preserve" style="white-space:pre">=B3*E2   ← copied from =B2*E1, no $</text><line class="sLr" x1="280" y1="136" x2="410" y2="116" marker-end="url(#ahr)"/><rect class="sR" x="480" y="110" width="226" height="70" rx="8" opacity=".85"/><text class="sC" x="593" y="134" text-anchor="middle">E1 slid down to E2,</text><text class="sC" x="593" y="154" text-anchor="middle">an empty cell: result 0</text><text class="sT" x="593" y="172" text-anchor="middle">no error, just wrong</text></g>
</svg><ol class="dia-steps">
<li>In C2, <code>=B2*$E$1</code>: price times the VAT factor. <code>B2</code> is stored as "one column to my left"; <code>$E$1</code> as "exactly E1".</li>
<li>Fill down to C3. The relative part moves with the formula (<code>B3</code>); the absolute part stays on <code>E1</code>.</li>
<li>Same again in C4. One formula, filled down a thousand rows, is how spreadsheets scale.</li>
<li>Without the <code>$</code>, the copy in C3 becomes <code>=B3*E2</code>. E2 is empty, so the answer is silently 0. This is the most common spreadsheet error there is.</li>
</ol><figcaption>Relative references describe a position relative to the formula; <code>$</code> pins a column or row. Press F4 to cycle the four combinations.</figcaption></figure>

The second habit is **tidy data**: one header row, one row per record, one column per field ([[DA2.1]]). Every tool in this module (and SQL, Power BI and pandas) assumes it.

## DA2.1 Start with clean, tabular data 🟢 ⭐

Excel analysis works when the data is **one row per record, one column per field, one header row, no blank rows or merged cells**.

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="A messy report with a merged title, a blank row, months as columns, a number stored as text and a total row, next to the same data as a tidy table with city, month and amount columns">
<text class="sRt" x="176" y="20" text-anchor="middle">what people send you</text><text class="sGt" x="544" y="20" text-anchor="middle">what Excel (and SQL, and Power BI) want</text>
<rect class="sN" x="30" y="32" width="278" height="24" rx="0"/><text class="sT" x="169" y="49" text-anchor="middle">Sales report, Q1 2026</text>
<rect class="sN" x="30" y="56" width="278" height="24" rx="0"/>
<rect class="sN" x="30" y="80" width="80" height="24" rx="0"/><text class="sC" x="70" y="97" text-anchor="middle">City</text><rect class="sN" x="110" y="80" width="66" height="24" rx="0"/><text class="sC" x="143" y="97" text-anchor="middle">Jan</text><rect class="sN" x="176" y="80" width="66" height="24" rx="0"/><text class="sC" x="209" y="97" text-anchor="middle">Feb</text><rect class="sN" x="242" y="80" width="66" height="24" rx="0"/><text class="sC" x="275" y="97" text-anchor="middle">Mar</text>
<rect class="sB" x="30" y="104" width="80" height="24" rx="0"/><text class="sC" x="70" y="121" text-anchor="middle">Cairo</text><rect class="sB" x="110" y="104" width="66" height="24" rx="0"/><text class="sC" x="143" y="121" text-anchor="middle">1,200</text><rect class="sB" x="176" y="104" width="66" height="24" rx="0"/><text class="sC" x="209" y="121" text-anchor="middle">980</text><rect class="sB" x="242" y="104" width="66" height="24" rx="0"/><text class="sC" x="275" y="121" text-anchor="middle">1,105</text>
<rect class="sB" x="30" y="128" width="80" height="24" rx="0"/><text class="sC" x="70" y="145" text-anchor="middle">Giza</text><rect class="sB" x="110" y="128" width="66" height="24" rx="0"/><text class="sC" x="143" y="145" text-anchor="middle">"850 "</text><rect class="sB" x="176" y="128" width="66" height="24" rx="0"/><text class="sC" x="209" y="145" text-anchor="middle">910</text><rect class="sB" x="242" y="128" width="66" height="24" rx="0"/><text class="sC" x="275" y="145" text-anchor="middle">1,020</text>
<rect class="sW" x="30" y="152" width="80" height="24" rx="0"/><text class="sC" x="70" y="169" text-anchor="middle">Total</text><rect class="sW" x="110" y="152" width="66" height="24" rx="0"/><text class="sC" x="143" y="169" text-anchor="middle">2,050</text><rect class="sW" x="176" y="152" width="66" height="24" rx="0"/><text class="sC" x="209" y="169" text-anchor="middle">1,890</text><rect class="sW" x="242" y="152" width="66" height="24" rx="0"/><text class="sC" x="275" y="169" text-anchor="middle">2,125</text>
<circle class="sPr" cx="322" cy="44" r="9"/><text class="sX" x="322" y="48" text-anchor="middle">1</text>
<circle class="sPr" cx="322" cy="68" r="9"/><text class="sX" x="322" y="72" text-anchor="middle">2</text>
<circle class="sPr" cx="322" cy="92" r="9"/><text class="sX" x="322" y="96" text-anchor="middle">3</text>
<circle class="sPr" cx="322" cy="140" r="9"/><text class="sX" x="322" y="144" text-anchor="middle">4</text>
<circle class="sPr" cx="322" cy="164" r="9"/><text class="sX" x="322" y="168" text-anchor="middle">5</text>
<text class="sRt" x="30" y="200">1 merged title cell</text>
<text class="sRt" x="180" y="200">2 blank row</text>
<text class="sRt" x="30" y="218">3 months as columns</text>
<text class="sRt" x="180" y="218">4 number stored as text</text>
<text class="sRt" x="30" y="236">5 a total inside the data</text>
<rect class="sN" x="400" y="32" width="90" height="24" rx="0"/><text class="sC" x="445" y="49" text-anchor="middle">city</text><rect class="sN" x="490" y="32" width="90" height="24" rx="0"/><text class="sC" x="535" y="49" text-anchor="middle">month</text><rect class="sN" x="580" y="32" width="90" height="24" rx="0"/><text class="sC" x="625" y="49" text-anchor="middle">amount</text>
<rect class="sG" x="400" y="56" width="90" height="24" rx="0"/><text class="sC" x="445" y="73" text-anchor="middle">Cairo</text><rect class="sG" x="490" y="56" width="90" height="24" rx="0"/><text class="sC" x="535" y="73" text-anchor="middle">2026-01</text><rect class="sG" x="580" y="56" width="90" height="24" rx="0"/><text class="sC" x="625" y="73" text-anchor="middle">1200</text>
<rect class="sG" x="400" y="80" width="90" height="24" rx="0"/><text class="sC" x="445" y="97" text-anchor="middle">Cairo</text><rect class="sG" x="490" y="80" width="90" height="24" rx="0"/><text class="sC" x="535" y="97" text-anchor="middle">2026-02</text><rect class="sG" x="580" y="80" width="90" height="24" rx="0"/><text class="sC" x="625" y="97" text-anchor="middle">980</text>
<rect class="sG" x="400" y="104" width="90" height="24" rx="0"/><text class="sC" x="445" y="121" text-anchor="middle">Cairo</text><rect class="sG" x="490" y="104" width="90" height="24" rx="0"/><text class="sC" x="535" y="121" text-anchor="middle">2026-03</text><rect class="sG" x="580" y="104" width="90" height="24" rx="0"/><text class="sC" x="625" y="121" text-anchor="middle">1105</text>
<rect class="sG" x="400" y="128" width="90" height="24" rx="0"/><text class="sC" x="445" y="145" text-anchor="middle">Giza</text><rect class="sG" x="490" y="128" width="90" height="24" rx="0"/><text class="sC" x="535" y="145" text-anchor="middle">2026-01</text><rect class="sG" x="580" y="128" width="90" height="24" rx="0"/><text class="sC" x="625" y="145" text-anchor="middle">850</text>
<rect class="sG" x="400" y="152" width="90" height="24" rx="0"/><text class="sC" x="445" y="169" text-anchor="middle">Giza</text><rect class="sG" x="490" y="152" width="90" height="24" rx="0"/><text class="sC" x="535" y="169" text-anchor="middle">2026-02</text><rect class="sG" x="580" y="152" width="90" height="24" rx="0"/><text class="sC" x="625" y="169" text-anchor="middle">910</text>
<rect class="sG" x="400" y="176" width="90" height="24" rx="0"/><text class="sC" x="445" y="193" text-anchor="middle">…</text><rect class="sG" x="490" y="176" width="90" height="24" rx="0"/><text class="sC" x="535" y="193" text-anchor="middle">…</text><rect class="sG" x="580" y="176" width="90" height="24" rx="0"/><text class="sC" x="625" y="193" text-anchor="middle">…</text>
<text class="sC" x="535" y="220" text-anchor="middle">one header row · one row per record</text><text class="sC" x="535" y="238" text-anchor="middle">one type per column · no totals</text>
</svg><figcaption>Tidy data: every row is one record, every column one field. Totals and formatting belong in the report built <b>from</b> it.</figcaption></figure>

- **Convert ranges to Tables** (Ctrl+T). Tables expand automatically as data is added, keep formatting consistent, and allow **structured references** such as `Sales[Amount]` instead of `C2:C5000`, so formulas don't break when rows are added.
- Fix types: numbers stored as text (a green triangle), dates stored as text (`Text to Columns`, or `DATEVALUE`), consistent date formats.
- Clean text: `TRIM` (extra spaces), `CLEAN` (non-printing characters), `PROPER`/`UPPER`, and **Find & Replace**.
- **Remove Duplicates** (Data tab), after deciding which columns define a duplicate.
- **Data Validation** drop-down lists stop new errors at entry.

## DA2.2 References and the formulas you'll use daily 🟢 ⭐

| Reference | Copies as | Use |
|---|---|---|
| `A1` | Both row and column change | Most formulas |
| `$A$1` | Fixed | A constant: a tax rate, an exchange rate cell |
| `$A1` / `A$1` | Column fixed / row fixed | Two-way tables (a times table, a price × quantity grid) |

Press **F4** to cycle through them.

```text
=SUMIFS(Sales[Amount], Sales[Region], "Cairo", Sales[Date], ">="&DATE(2026,1,1))
=COUNTIFS(Orders[Status], "Late", Orders[City], H2)
=AVERAGEIFS(Orders[DeliveryHours], Orders[Courier], "Internal")
=IF(D2>E2, "Late", "On time")
=IFS(D2>=5000, "Large", D2>=1000, "Medium", TRUE, "Small")
=IFERROR(D2/E2, 0)
=TEXT(A2, "mmm yyyy")              =EOMONTH(A2, 0)          =NETWORKDAYS(A2, B2, Holidays)
=ROUND(D2*1.14, 2)                 =TEXTJOIN(", ", TRUE, B2:B9)
```

> [!tip] SUMIFS over SUMIF
> `SUMIFS` takes multiple conditions and puts the sum range first, so it's one consistent pattern for one condition or five. The same goes for `COUNTIFS` and `AVERAGEIFS`.

## DA2.3 Lookups: VLOOKUP, INDEX/MATCH, XLOOKUP 🟢 ⭐

```text
=VLOOKUP(A2, Products!A:D, 4, FALSE)                       ' classic
=INDEX(Products!D:D, MATCH(A2, Products!A:A, 0))           ' the robust classic
=XLOOKUP(A2, Products[ID], Products[Price], "Not found")   ' modern (Excel 2021 / 365)
```

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 196" role="img" aria-label="XLOOKUP searches the ID column and returns the price from the same row; VLOOKUP uses a column number, which returns the wrong column after someone inserts a new column">
<rect class="sN" x="14" y="8" width="692" height="26" rx="4"/><text class="sM" x="26" y="26">fx</text>
<rect class="sB" x="470" y="50" width="110" height="46" rx="8"/><text class="sT" x="525" y="71" text-anchor="middle">find</text><text class="sC" x="525" y="87" text-anchor="middle">A101</text>
<g data-s="1-1"><rect class="sN" x="14" y="50" width="100" height="26" rx="0"/><text class="sT" x="64" y="68" text-anchor="middle">ID</text><rect class="sV" x="14" y="76" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="64" y="95" text-anchor="middle">A100</text><rect class="sV" x="14" y="104" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="64" y="123" text-anchor="middle">A101</text><rect class="sV" x="14" y="132" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="64" y="151" text-anchor="middle">A102</text><rect class="sN" x="114" y="50" width="100" height="26" rx="0"/><text class="sT" x="164" y="68" text-anchor="middle">name</text><rect class="sN" x="114" y="76" width="100" height="28" rx="0"/><text class="sC" x="164" y="95" text-anchor="middle">pen</text><rect class="sN" x="114" y="104" width="100" height="28" rx="0"/><text class="sC" x="164" y="123" text-anchor="middle">book</text><rect class="sN" x="114" y="132" width="100" height="28" rx="0"/><text class="sC" x="164" y="151" text-anchor="middle">bag</text><rect class="sN" x="214" y="50" width="100" height="26" rx="0"/><text class="sT" x="264" y="68" text-anchor="middle">category</text><rect class="sN" x="214" y="76" width="100" height="28" rx="0"/><text class="sC" x="264" y="95" text-anchor="middle">office</text><rect class="sN" x="214" y="104" width="100" height="28" rx="0"/><text class="sC" x="264" y="123" text-anchor="middle">books</text><rect class="sN" x="214" y="132" width="100" height="28" rx="0"/><text class="sC" x="264" y="151" text-anchor="middle">travel</text><rect class="sN" x="314" y="50" width="100" height="26" rx="0"/><text class="sT" x="364" y="68" text-anchor="middle">price</text><rect class="sG" x="314" y="76" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="364" y="95" text-anchor="middle">10</text><rect class="sG" x="314" y="104" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="364" y="123" text-anchor="middle">80</text><rect class="sG" x="314" y="132" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="364" y="151" text-anchor="middle">250</text><rect class="sN" x="14" y="104" width="400" height="28" rx="0" style="fill:none;stroke:var(--accent);stroke-width:3"/><text class="sC" x="56" y="26" xml:space="preserve" style="white-space:pre">=XLOOKUP(G2, Products[ID], Products[price], "Not found")</text><rect class="sG" x="600" y="50" width="106" height="46" rx="8"/><text class="sT" x="653" y="71" text-anchor="middle">result</text><text class="sC" x="653" y="87" text-anchor="middle">80 ✓</text><text class="sC" x="560" y="150" text-anchor="middle">search one column, return</text><text class="sC" x="560" y="168" text-anchor="middle">the same row of another</text></g>
<g data-s="2-2"><rect class="sN" x="14" y="50" width="100" height="26" rx="0"/><text class="sT" x="64" y="68" text-anchor="middle">ID</text><rect class="sV" x="14" y="76" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="64" y="95" text-anchor="middle">A100</text><rect class="sV" x="14" y="104" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="64" y="123" text-anchor="middle">A101</text><rect class="sV" x="14" y="132" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="64" y="151" text-anchor="middle">A102</text><rect class="sN" x="114" y="50" width="100" height="26" rx="0"/><text class="sT" x="164" y="68" text-anchor="middle">name</text><rect class="sN" x="114" y="76" width="100" height="28" rx="0"/><text class="sC" x="164" y="95" text-anchor="middle">pen</text><rect class="sN" x="114" y="104" width="100" height="28" rx="0"/><text class="sC" x="164" y="123" text-anchor="middle">book</text><rect class="sN" x="114" y="132" width="100" height="28" rx="0"/><text class="sC" x="164" y="151" text-anchor="middle">bag</text><rect class="sN" x="214" y="50" width="100" height="26" rx="0"/><text class="sT" x="264" y="68" text-anchor="middle">category</text><rect class="sN" x="214" y="76" width="100" height="28" rx="0"/><text class="sC" x="264" y="95" text-anchor="middle">office</text><rect class="sN" x="214" y="104" width="100" height="28" rx="0"/><text class="sC" x="264" y="123" text-anchor="middle">books</text><rect class="sN" x="214" y="132" width="100" height="28" rx="0"/><text class="sC" x="264" y="151" text-anchor="middle">travel</text><rect class="sN" x="314" y="50" width="100" height="26" rx="0"/><text class="sT" x="364" y="68" text-anchor="middle">price</text><rect class="sG" x="314" y="76" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="364" y="95" text-anchor="middle">10</text><rect class="sG" x="314" y="104" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="364" y="123" text-anchor="middle">80</text><rect class="sG" x="314" y="132" width="100" height="28" rx="0" opacity=".55"/><text class="sC" x="364" y="151" text-anchor="middle">250</text><rect class="sN" x="14" y="104" width="400" height="28" rx="0" style="fill:none;stroke:var(--accent);stroke-width:3"/><text class="sC" x="56" y="26" xml:space="preserve" style="white-space:pre">=VLOOKUP(G2, A:D, 4, FALSE)</text><text class="sWt" x="64" y="44" text-anchor="middle">1</text><text class="sWt" x="164" y="44" text-anchor="middle">2</text><text class="sWt" x="264" y="44" text-anchor="middle">3</text><text class="sWt" x="364" y="44" text-anchor="middle">4</text><rect class="sG" x="600" y="50" width="106" height="46" rx="8"/><text class="sT" x="653" y="71" text-anchor="middle">result</text><text class="sC" x="653" y="87" text-anchor="middle">80 ✓</text><text class="sWt" x="560" y="150" text-anchor="middle">"4" means the 4th column</text><text class="sWt" x="560" y="168" text-anchor="middle">of the range, counted</text></g>
<g data-s="3-3"><rect class="sN" x="14" y="50" width="80" height="26" rx="0"/><text class="sT" x="54" y="68" text-anchor="middle">ID</text><rect class="sV" x="14" y="76" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="54" y="95" text-anchor="middle">A100</text><rect class="sV" x="14" y="104" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="54" y="123" text-anchor="middle">A101</text><rect class="sV" x="14" y="132" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="54" y="151" text-anchor="middle">A102</text><rect class="sN" x="94" y="50" width="80" height="26" rx="0"/><text class="sT" x="134" y="68" text-anchor="middle">name</text><rect class="sN" x="94" y="76" width="80" height="28" rx="0"/><text class="sC" x="134" y="95" text-anchor="middle">pen</text><rect class="sN" x="94" y="104" width="80" height="28" rx="0"/><text class="sC" x="134" y="123" text-anchor="middle">book</text><rect class="sN" x="94" y="132" width="80" height="28" rx="0"/><text class="sC" x="134" y="151" text-anchor="middle">bag</text><rect class="sN" x="174" y="50" width="80" height="26" rx="0"/><text class="sT" x="214" y="68" text-anchor="middle">supplier</text><rect class="sN" x="174" y="76" width="80" height="28" rx="0"/><text class="sC" x="214" y="95" text-anchor="middle">Delta</text><rect class="sN" x="174" y="104" width="80" height="28" rx="0"/><text class="sC" x="214" y="123" text-anchor="middle">Nile</text><rect class="sN" x="174" y="132" width="80" height="28" rx="0"/><text class="sC" x="214" y="151" text-anchor="middle">Delta</text><rect class="sN" x="254" y="50" width="80" height="26" rx="0"/><text class="sT" x="294" y="68" text-anchor="middle">category</text><rect class="sR" x="254" y="76" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="294" y="95" text-anchor="middle">office</text><rect class="sR" x="254" y="104" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="294" y="123" text-anchor="middle">books</text><rect class="sR" x="254" y="132" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="294" y="151" text-anchor="middle">travel</text><rect class="sN" x="334" y="50" width="80" height="26" rx="0"/><text class="sT" x="374" y="68" text-anchor="middle">price</text><rect class="sG" x="334" y="76" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="374" y="95" text-anchor="middle">10</text><rect class="sG" x="334" y="104" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="374" y="123" text-anchor="middle">80</text><rect class="sG" x="334" y="132" width="80" height="28" rx="0" opacity=".55"/><text class="sC" x="374" y="151" text-anchor="middle">250</text><rect class="sN" x="14" y="104" width="400" height="28" rx="0" style="fill:none;stroke:var(--accent);stroke-width:3"/><text class="sC" x="56" y="26" xml:space="preserve" style="white-space:pre">=VLOOKUP(G2, A:E, 4, FALSE)   still says 4</text><text class="sWt" x="54" y="44" text-anchor="middle">1</text><text class="sWt" x="134" y="44" text-anchor="middle">2</text><text class="sWt" x="214" y="44" text-anchor="middle">3</text><text class="sWt" x="294" y="44" text-anchor="middle">4</text><text class="sWt" x="374" y="44" text-anchor="middle">5</text><rect class="sR" x="600" y="50" width="106" height="46" rx="8"/><text class="sT" x="653" y="71" text-anchor="middle">result</text><text class="sC" x="653" y="87" text-anchor="middle">"books" ✗</text><text class="sRt" x="560" y="150" text-anchor="middle">a new column shifted it:</text><text class="sGt" x="560" y="168" text-anchor="middle">XLOOKUP still returns 80</text></g>
</svg><ol class="dia-steps">
<li><code>XLOOKUP</code> names two columns: where to search (ID) and what to return (price). It finds A101 and returns 80.</li>
<li><code>VLOOKUP</code> names a column <b>number</b>: "the 4th column of A:D". Today that's price.</li>
<li>A colleague inserts a "supplier" column. VLOOKUP still counts 4 and now returns the category, with no error. XLOOKUP's reference moved with the column, so it's still right.</li>
</ol><figcaption>Lookups by position break silently; lookups by reference don't.</figcaption></figure>

| | VLOOKUP | INDEX / MATCH | **XLOOKUP** |
|---|---|---|---|
| Look left of the key | ✗ (key must be the first column) | ✓ | ✓ |
| Breaks if a column is inserted | ✓ (the column **number** shifts) | ✗ | ✗ |
| Default match | **Approximate** unless you pass `FALSE`: a silent-error classic | Exact with `0` | **Exact** |
| "Not found" value | Needs `IFERROR` | Needs `IFERROR` | Built-in argument |
| Return several columns, search from the end, wildcards | ✗ | Partly | ✓ |

> [!say]
> "I use XLOOKUP: it defaults to exact match, can look left, doesn't break when columns are inserted, and has a built-in not-found value. On older Excel versions I'd use INDEX with MATCH for the same reasons, and I always pass FALSE to VLOOKUP, because its default approximate match silently returns wrong values on unsorted data."

> [!mistake] Lookups on dirty keys
> "Not found" errors are usually `"A100 "` (a trailing space) vs `"A100"`, or a number stored as text vs a real number. `TRIM` the keys and make the types match before blaming the formula.

## DA2.4 Dynamic arrays 🟡 ⭐

In Microsoft 365, a formula can return many values that **spill** into neighbouring cells. If something is in the way, you get `#SPILL!`.

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="A dynamic array formula spills a sorted list of regions down five cells; when a cell in that range is occupied, the formula shows #SPILL!">
<text class="sM" x="170" y="22" text-anchor="middle">=SORT(UNIQUE(Sales[Region]))</text>
<rect class="sN" x="30" y="34" width="150" height="28" rx="0"/><rect class="sN" x="180" y="34" width="130" height="28" rx="0"/>
<rect class="sN" x="30" y="62" width="150" height="28" rx="0"/><rect class="sN" x="180" y="62" width="130" height="28" rx="0"/>
<rect class="sN" x="30" y="90" width="150" height="28" rx="0"/><rect class="sN" x="180" y="90" width="130" height="28" rx="0"/>
<rect class="sN" x="30" y="118" width="150" height="28" rx="0"/><rect class="sN" x="180" y="118" width="130" height="28" rx="0"/>
<rect class="sN" x="30" y="146" width="150" height="28" rx="0"/><rect class="sN" x="180" y="146" width="130" height="28" rx="0"/>
<rect class="sN" x="30" y="174" width="150" height="28" rx="0"/><rect class="sN" x="180" y="174" width="130" height="28" rx="0"/>
<rect class="sA" x="32" y="36" width="146" height="24" rx="3" opacity=".6"/>
<text class="sC" x="105" y="53" text-anchor="middle">Alexandria</text>
<text class="sC" x="105" y="81" text-anchor="middle">Cairo</text>
<text class="sC" x="105" y="109" text-anchor="middle">Delta</text>
<text class="sC" x="105" y="137" text-anchor="middle">Giza</text>
<text class="sC" x="105" y="165" text-anchor="middle">Upper Egypt</text>
<rect class="sN" x="30" y="34" width="150" height="140" rx="0" style="fill:none;stroke:var(--accent);stroke-width:2" stroke-dasharray="6 4"/>
<text class="sC" x="245" y="110" text-anchor="middle">spill range</text>
<text class="sM" x="530" y="22" text-anchor="middle">the same formula, with a value in the way</text>
<rect class="sN" x="390" y="34" width="150" height="28" rx="0"/><rect class="sN" x="540" y="34" width="130" height="28" rx="0"/>
<rect class="sN" x="390" y="62" width="150" height="28" rx="0"/><rect class="sN" x="540" y="62" width="130" height="28" rx="0"/>
<rect class="sN" x="390" y="90" width="150" height="28" rx="0"/><rect class="sN" x="540" y="90" width="130" height="28" rx="0"/>
<rect class="sN" x="390" y="118" width="150" height="28" rx="0"/><rect class="sN" x="540" y="118" width="130" height="28" rx="0"/>
<rect class="sN" x="390" y="146" width="150" height="28" rx="0"/><rect class="sN" x="540" y="146" width="130" height="28" rx="0"/>
<rect class="sN" x="390" y="174" width="150" height="28" rx="0"/><rect class="sN" x="540" y="174" width="130" height="28" rx="0"/>
<rect class="sA" x="392" y="36" width="146" height="24" rx="3" opacity=".6"/>
<text class="sRt" x="465" y="53" text-anchor="middle">#SPILL!</text>
<rect class="sR" x="392" y="92" width="146" height="24" rx="3" opacity=".5"/><text class="sC" x="465" y="109" text-anchor="middle">note</text>
<rect class="sN" x="390" y="34" width="150" height="140" rx="0" style="fill:none;stroke:var(--senior);stroke-width:2" stroke-dasharray="6 4"/>
<text class="sRt" x="605" y="110" text-anchor="middle">clear it to spill</text>
<text class="sS" x="360" y="210" text-anchor="middle">one formula, many results: the range grows and shrinks as the data changes</text>
</svg><figcaption>Dynamic arrays: write the formula once, in one cell. Refer to the whole result with <code>F2#</code>.</figcaption></figure>

```text
=UNIQUE(Sales[Region])                                         ' distinct list
=SORT(UNIQUE(Sales[Product]))
=FILTER(Sales, (Sales[Region]="Giza")*(Sales[Amount]>1000), "None")   ' * = AND, + = OR
=SORTBY(Products[Name], Products[Revenue], -1)                 ' sort by another column, descending
=TAKE(SORTBY(Products, Products[Revenue], -1), 10)             ' top 10 rows
=SEQUENCE(12, 1, DATE(2026,1,1), 31)                           ' generate a series
=LET(rev, Sales[Amount], cost, Sales[Cost], SUM(rev-cost)/SUM(rev))   ' name parts of a formula
```

**GROUPBY and PIVOTBY** (generally available in Microsoft 365 since late 2024) produce summary tables with a formula, like a PivotTable that updates instantly:

```text
=GROUPBY(Sales[Region], Sales[Amount], SUM)                                  ' revenue by region
=PIVOTBY(Sales[Region], TEXT(Sales[Date],"yyyy-mm"), Sales[Amount], SUM)    ' region × month
```

**LAMBDA** lets you define your own reusable functions (named in the Name Manager), for example `=MarginPct(revenue, cost)`.

## DA2.5 PivotTables 🟢 ⭐

A PivotTable summarises a table by dragging fields into **Rows**, **Columns**, **Values** and **Filters**: SQL's `GROUP BY` without writing it.

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="PivotTable field wells: Region in Rows, Month in Columns, Sum of Amount in Values and Year in Filters, producing a region by month grid with totals">
<rect class="sN" x="14" y="20" width="230" height="200" rx="10"/><text class="sT" x="129" y="40" text-anchor="middle">PivotTable Fields</text>
<text class="sM" x="26" y="74">Filters</text><rect class="sN" x="104" y="56" width="128" height="28" rx="5"/><text class="sC" x="168" y="75" text-anchor="middle">Year = 2026</text>
<text class="sM" x="26" y="115">Columns</text><rect class="sV" x="104" y="97" width="128" height="28" rx="5"/><text class="sC" x="168" y="116" text-anchor="middle">Month</text>
<text class="sM" x="26" y="156">Rows</text><rect class="sA" x="104" y="138" width="128" height="28" rx="5"/><text class="sC" x="168" y="157" text-anchor="middle">Region</text>
<text class="sM" x="26" y="197">Values</text><rect class="sG" x="104" y="179" width="128" height="28" rx="5"/><text class="sC" x="168" y="198" text-anchor="middle">Sum of Amount</text>
<rect class="sN" x="300" y="52" width="110" height="28" rx="0"/><text class="sT" x="355" y="71" text-anchor="middle"></text>
<rect class="sV" x="410" y="52" width="70" height="28" rx="0" opacity=".7"/><text class="sT" x="445" y="71" text-anchor="middle">Jan</text>
<rect class="sV" x="480" y="52" width="70" height="28" rx="0" opacity=".7"/><text class="sT" x="515" y="71" text-anchor="middle">Feb</text>
<rect class="sV" x="550" y="52" width="70" height="28" rx="0" opacity=".7"/><text class="sT" x="585" y="71" text-anchor="middle">Mar</text>
<rect class="sN" x="620" y="52" width="80" height="28" rx="0"/><text class="sT" x="660" y="71" text-anchor="middle">Total</text>
<rect class="sA" x="300" y="80" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="355" y="99" text-anchor="middle">Cairo</text>
<rect class="sG" x="410" y="80" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="445" y="99" text-anchor="middle">1,200</text>
<rect class="sG" x="480" y="80" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="515" y="99" text-anchor="middle">980</text>
<rect class="sG" x="550" y="80" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="585" y="99" text-anchor="middle">1,105</text>
<rect class="sN" x="620" y="80" width="80" height="28" rx="0"/><text class="sT" x="660" y="99" text-anchor="middle">3,285</text>
<rect class="sA" x="300" y="108" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="355" y="127" text-anchor="middle">Giza</text>
<rect class="sG" x="410" y="108" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="445" y="127" text-anchor="middle">850</text>
<rect class="sG" x="480" y="108" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="515" y="127" text-anchor="middle">910</text>
<rect class="sG" x="550" y="108" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="585" y="127" text-anchor="middle">1,020</text>
<rect class="sN" x="620" y="108" width="80" height="28" rx="0"/><text class="sT" x="660" y="127" text-anchor="middle">2,780</text>
<rect class="sA" x="300" y="136" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="355" y="155" text-anchor="middle">Alexandria</text>
<rect class="sG" x="410" y="136" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="445" y="155" text-anchor="middle">640</text>
<rect class="sG" x="480" y="136" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="515" y="155" text-anchor="middle">700</text>
<rect class="sG" x="550" y="136" width="70" height="28" rx="0" opacity=".55"/><text class="sC" x="585" y="155" text-anchor="middle">690</text>
<rect class="sN" x="620" y="136" width="80" height="28" rx="0"/><text class="sT" x="660" y="155" text-anchor="middle">2,030</text>
<rect class="sN" x="300" y="164" width="110" height="28" rx="0"/><text class="sT" x="355" y="183" text-anchor="middle">Grand Total</text>
<rect class="sN" x="410" y="164" width="70" height="28" rx="0"/><text class="sT" x="445" y="183" text-anchor="middle">2,690</text>
<rect class="sN" x="480" y="164" width="70" height="28" rx="0"/><text class="sT" x="515" y="183" text-anchor="middle">2,590</text>
<rect class="sN" x="550" y="164" width="70" height="28" rx="0"/><text class="sT" x="585" y="183" text-anchor="middle">2,815</text>
<rect class="sN" x="620" y="164" width="80" height="28" rx="0"/><text class="sT" x="660" y="183" text-anchor="middle">8,095</text>
<line class="sLv" x1="232" y1="125" x2="296" y2="72" marker-end="url(#ahv)"/><line class="sLm" x1="232" y1="166" x2="296" y2="120" marker-end="url(#ahm)"/><line class="sLg" x1="232" y1="207" x2="296" y2="150" marker-end="url(#ahg)"/>
<text class="sS" x="500" y="216" text-anchor="middle">GROUP BY region, month · SUM(amount), with totals</text>
</svg><figcaption>Each well is part of a GROUP BY: Rows and Columns are the groups, Values the aggregate, Filters the WHERE.</figcaption></figure>

The features interviewers check:

- **Value Field Settings → Summarize by** Sum, Count, Average, Max, or **Distinct Count** (needs "Add this data to the Data Model").
- **Show Values As:** **% of Grand Total**, **% of Column/Row Total**, **% Difference From** (month-over-month growth), **Running Total In**, **Rank**.
- **Group** dates by month, quarter and year; group numbers into bands.
- **Slicers** and **Timelines** for clickable filters, connected to several PivotTables at once (Report Connections).
- **Calculated fields** for simple ratios (and know their limitation: they compute on sums, so "average price" must be revenue ÷ quantity, not an average of prices).
- **Refresh** after the source changes (Data → Refresh All); with a Table as the source, new rows are included.
- **PivotCharts** that follow the PivotTable's filters.

> [!say]
> "I'd convert the data to a Table, build a PivotTable with region in rows, month in columns and revenue in values, group the dates by month, then use Show Values As % of Grand Total or % Difference From the previous month. Slicers for product category and channel make it explorable, and because the source is a Table, Refresh All picks up new rows."

## DA2.6 Power Query: repeatable cleaning 🟡 ⭐

> [!term] Power Query
> Excel's (and Power BI's) built-in **ETL** tool: Data → Get Data. You connect to sources (Excel, CSV, folders, databases, web, SharePoint), apply transformation **steps** through the interface (each recorded in the **M** language), and load the result. Next month you click **Refresh** and every step re-runs on the new data, with no manual cleaning.

<figure class="dia anim"><svg viewBox="0 0 720 276" role="img" aria-label="Animation: Power Query reads every CSV in a folder, applies recorded steps such as combining files, removing blank rows, unpivoting months and changing types, and loads a clean table; refresh replays the steps">
<rect class="sN" x="14" y="40" width="150" height="150" rx="10"/><text class="sT" x="89" y="60" text-anchor="middle">folder: sales/</text>
<text class="sC" x="89" y="86" text-anchor="middle">jan.csv</text>
<text class="sC" x="89" y="106" text-anchor="middle">feb.csv</text>
<text class="sC" x="89" y="126" text-anchor="middle">mar.csv</text>
<text class="sC" x="89" y="146" text-anchor="middle">…</text>
<text class="sGt" x="89" y="166" text-anchor="middle">next.csv</text>
<rect class="sV" x="220" y="14" width="220" height="222" rx="10" opacity=".35"/><text class="sT" x="330" y="32" text-anchor="middle">Applied Steps (M)</text>
<rect class="sB" x="236" y="42" width="188" height="22" rx="4"/><text class="sC" x="330" y="58" text-anchor="middle">Source: folder</text>
<rect class="sB" x="236" y="68" width="188" height="22" rx="4"/><text class="sC" x="330" y="84" text-anchor="middle">Combine files</text>
<rect class="sB" x="236" y="94" width="188" height="22" rx="4"/><text class="sC" x="330" y="110" text-anchor="middle">Promoted headers</text>
<rect class="sB" x="236" y="120" width="188" height="22" rx="4"/><text class="sC" x="330" y="136" text-anchor="middle">Removed blank rows</text>
<rect class="sB" x="236" y="146" width="188" height="22" rx="4"/><text class="sC" x="330" y="162" text-anchor="middle">Trimmed text</text>
<rect class="sB" x="236" y="172" width="188" height="22" rx="4"/><text class="sC" x="330" y="188" text-anchor="middle">Unpivoted months</text>
<rect class="sB" x="236" y="198" width="188" height="22" rx="4"/><text class="sC" x="330" y="214" text-anchor="middle">Changed types</text>
<line class="sL" x1="164" y1="115" x2="216" y2="115" marker-end="url(#ah)"/><line class="sL" x1="440" y1="115" x2="496" y2="115" marker-end="url(#ah)"/>
<rect class="sG" x="500" y="80" width="206" height="70" rx="8"/><text class="sT" x="603" y="113" text-anchor="middle">clean table</text><text class="sC" x="603" y="129" text-anchor="middle">loaded to a sheet or model</text>
<path class="sLw" d="M603 150 V248 H89 V194" fill="none" stroke-dasharray="5 4" marker-end="url(#ahw)"/><text class="sWt" x="400" y="266" text-anchor="middle">Refresh: replay every step on the new files</text>
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M164 115 H230 M330 46 V214 M440 115 H500"/></circle>
</svg><figcaption>Power Query records cleaning as steps instead of doing it by hand. Next month you drop a file into the folder and press Refresh.</figcaption></figure>

Transformations to know:

| Step | Use |
|---|---|
| Change type, trim, clean, split column, replace values | Basic cleaning |
| Remove duplicates, filter rows, remove errors | Data quality |
| **Unpivot columns** | Turn a wide report (one column per month) into tidy long data (Month, Value): one of the most valuable skills in practice |
| **Merge queries** | Joins (left, inner, full, anti) between tables, like SQL |
| **Append queries** | Stack tables (`UNION ALL`) |
| **Combine files from a folder** | Load 12 monthly CSVs as one table, automatically including next month's file |
| Group by | Aggregate before loading |
| Add custom / conditional column | Derived fields |

> [!story]
> This is the same idea as your FinSight CSV ingestion and categoriser, without code: a repeatable pipeline from messy files to a clean table. Say that link aloud in an interview; it shows you understand *why* Power Query exists.

## DA2.7 The data model and measures 🟡

With **Power Pivot** (Data → Data Model), you can load several tables, create **relationships** between them (Sales → Products, Sales → Calendar) and write **DAX measures** such as `Total Revenue := SUM(Sales[Amount])`. PivotTables built on the data model can use fields from all related tables without VLOOKUPs. This is exactly how Power BI works, so learning it in Excel transfers directly to [[DA4]].

## DA2.8 Charts and conditional formatting 🟢

- Choose the chart by the question ([[DA5]]): a line for trends, a bar for comparing categories, a stacked bar sparingly; avoid 3-D and pie charts with many slices.
- Clean up defaults: a clear title that states the finding, labelled axes, removed gridlines and legends where they don't help, consistent colours.
- **Conditional formatting** for exceptions: highlight late orders, colour scales on a heat map of region × month, data bars, icon sets; rules with formulas (`=$F2>$G2`) to highlight whole rows.
- **Sparklines** for tiny in-cell trends.

## DA2.9 What-if analysis 🟡

| Tool | Answers |
|---|---|
| **Goal Seek** | "What price gives a 25% margin?" (one input, one target) |
| **Data Table** (one or two variables) | "Profit for every combination of price and volume" |
| **Scenario Manager** | Best, base and worst cases side by side |
| **Solver** (add-in) | Optimise with constraints: the best product mix given capacity |
| **Forecast Sheet** | A quick exponential-smoothing forecast with confidence bounds |

## DA2.10 Automation 🟡

- **Macros / VBA:** record repetitive steps, then edit the code (loops over sheets, formatting, exporting PDFs). Many Egyptian finance and operations teams still run on VBA.
- **Office Scripts** (TypeScript) automate Excel on the web, often triggered by Power Automate.
- **Python in Excel** (Microsoft 365) runs Python (pandas, matplotlib) in cells, with computation in the Microsoft cloud.
- **Copilot in Excel** can suggest formulas, highlight patterns and create PivotTables from prompts; you still need to check the results.

## DA2.11 The practical Excel test 🟢 ⭐

A typical 30–60-minute test with a sales file:

1. Clean: convert to a Table, fix dates stored as text, trim names, remove duplicate orders.
2. Add columns: `Month` (`=TEXT([@Date],"yyyy-mm")`), `Margin` (`=[@Revenue]-[@Cost]`), `Late?` (`=IF([@Delivered]>[@Promised],"Late","On time")`).
3. Look up the product category from another sheet with XLOOKUP.
4. Summarise revenue by region and month with a PivotTable; add % of total and month-over-month change.
5. Find the top 10 products by revenue (`TAKE(SORTBY(...))` or a PivotTable with a Top 10 filter).
6. Highlight late orders with conditional formatting; compute the late rate by courier with `COUNTIFS`.
7. Build one clear chart and write **two or three sentences of findings** at the top.

That last step is what separates analysts from spreadsheet operators.

> [!lab] Produce real Excel evidence this week (from your gaps file)
> Use the Superstore data on `E:\Big data`. Do the full practical test above, plus: Power Query to load and clean the data (and an unpivot of a wide table), a data-model PivotTable with a DAX measure, a one-page dashboard with slicers, and a three-bullet findings box. Save the workbook and screenshots in a public repository with a README. That turns "pivot tables, VLOOKUP" from a claim into a link.

## DA2.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| VLOOKUP vs XLOOKUP? | XLOOKUP defaults to exact match, can look left, doesn't break when columns move, and has a not-found argument. |
| Why does VLOOKUP return wrong values? | Its default is approximate match; pass FALSE for exact. Also check for trailing spaces and text-vs-number keys. |
| Absolute vs relative reference? | $A$1 stays fixed when copied; A1 adjusts; mixed references fix just the row or column. |
| Why use Excel Tables? | They expand with new data, keep formulas consistent, and allow structured references. |
| How do you show % of total in a PivotTable? | Value Field Settings → Show Values As → % of Grand Total (or column/row total). |
| How do you get a distinct count in a PivotTable? | Add the data to the Data Model, then choose Distinct Count. |
| What is Power Query? | Excel's ETL tool: recorded, refreshable transformation steps from many sources. |
| What does unpivot do? | Turns many value columns (one per month) into two columns (attribute and value): tidy long format. |
| SUMIF vs SUMIFS? | SUMIFS supports several conditions with a consistent argument order. |
| What does #SPILL! mean? | A dynamic-array formula can't output its results because cells in the way aren't empty. |
| What are GROUPBY and PIVOTBY? | Microsoft 365 functions that create grouped and pivoted summaries with a formula. |
| Goal Seek vs Solver? | Goal Seek changes one input to hit a target; Solver optimises with several variables and constraints. |
| How do you combine monthly files automatically? | Power Query "From Folder", combine files, then refresh each month. |

## Key takeaways

> [!check]
> - Clean, tabular data in Tables first; most "formula problems" are data problems.
> - XLOOKUP (or INDEX/MATCH), SUMIFS and COUNTIFS cover most calculations.
> - PivotTables with Show Values As and slicers answer most summary questions fast.
> - Power Query makes cleaning repeatable, the same skill as in Power BI.
> - Always finish with written findings, not just a table.

## Sources

- Microsoft Support: [XLOOKUP function](https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929), [Dynamic array formulas and spilled array behavior](https://support.microsoft.com/en-us/office/dynamic-array-formulas-and-spilled-array-behavior-205c6b06-03ba-4151-89a1-87a7eb36e531), [GROUPBY function](https://support.microsoft.com/en-us/office/groupby-function-5e08ae8c-6800-4b72-b623-c41773611505), [PIVOTBY function](https://support.microsoft.com/en-us/office/pivotby-function-de86516a-90ad-4ced-8522-3a25fac389cf), [Overview of PivotTables](https://support.microsoft.com/en-us/office/overview-of-pivottables-and-pivotcharts-527c8fa3-02c0-445a-a2db-7794676bce96), [About Power Query in Excel](https://support.microsoft.com/en-us/office/about-power-query-in-excel-7104fbee-9e62-4cb9-a02e-5bfb1a6c536a), [Python in Excel](https://support.microsoft.com/en-us/office/introduction-to-python-in-excel-55643c2e-ff56-4168-b1ce-9428c8308545).
- Microsoft Learn: [Power Query M formula language](https://learn.microsoft.com/en-us/powerquery-m/).
- [ExcelJet](https://exceljet.net/), a well-maintained formula reference with examples.
