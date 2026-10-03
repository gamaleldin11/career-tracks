# Excel for Analysts — Tables, Lookups, Dynamic Arrays, PivotTables and Power Query

Almost every analyst posting in Egypt lists Excel, and many interviews include a practical Excel test: "here's a sales file, build a summary by region and month, find the top products, flag late orders". Your gaps file is honest that there's no Excel evidence on your drives, so this module is both the theory and a plan to produce that evidence quickly. It assumes **Excel for Microsoft 365**, which has dynamic arrays; where older versions differ, it says so.

> [!focus]
> **Entry must:** clean data into an Excel Table; SUMIFS, COUNTIFS, IF and IFERROR; XLOOKUP (and why VLOOKUP breaks); absolute vs relative references; a PivotTable with grouping, % of total and slicers; conditional formatting; a clear chart.
> **Mid adds:** dynamic arrays (FILTER, UNIQUE, SORT, LET), GROUPBY and PIVOTBY, Power Query for repeatable cleaning and merges, the data model with relationships and measures, what-if tools, basic macros.
> **Most asked:** *VLOOKUP vs XLOOKUP vs INDEX/MATCH?* · *What's a PivotTable and how do you show % of total?* · *How do you remove duplicates / clean messy data?* · *What is Power Query?* · *Absolute vs relative reference?* · Practical: *summarise this file by region and month.*
> **Time budget:** 4 hours, with Excel open, doing every example.

## DA2.1 Start with clean, tabular data 🟢 ⭐

Excel analysis works when the data is **one row per record, one column per field, one header row, no blank rows or merged cells**.

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
