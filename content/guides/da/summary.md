# Data Analyst — super summary

## The job

- Tie each KPI to a target and an owner; Power BI goals track a value against its target, with owners and status check-ins ([Power BI: Get started with goals](https://learn.microsoft.com/en-us/power-bi/create-reports/service-goals-introduction)).
- Ratios such as conversion rate must be computed as the sum of numerators over the sum of denominators, not as an average of daily rates; aggregated and disaggregated data can tell opposite stories (Simpson's paradox) ([Stanford Encyclopedia of Philosophy: Simpson's paradox](https://plato.stanford.edu/entries/paradox-simpson/)).

## SQL

- `GROUP BY` with aggregate functions summarises rows per group; `HAVING` filters the groups ([PostgreSQL: Aggregate functions tutorial](https://www.postgresql.org/docs/current/tutorial-agg.html)).
- Window functions such as `ROW_NUMBER`, `RANK` and running `SUM` compute across rows without collapsing them ([PostgreSQL: Window functions](https://www.postgresql.org/docs/current/tutorial-window.html)).
- Common table expressions (`WITH`) break a long query into named steps ([PostgreSQL: WITH queries](https://www.postgresql.org/docs/current/queries-with.html)).
- `COUNT(DISTINCT x)` counts unique values, which matters when one order has several rows ([PostgreSQL: Aggregate functions](https://www.postgresql.org/docs/current/functions-aggregate.html)).

## Excel

- `XLOOKUP` finds a value in one range and returns the matching value from another, with an exact match by default ([Microsoft: XLOOKUP function](https://support.microsoft.com/en-us/excel/functions/xlookup-function)).
- PivotTables summarise, group and filter large ranges without formulas ([Microsoft: Create a PivotTable](https://support.microsoft.com/en-us/excel/get-started/create-a-pivottable-to-analyze-worksheet-data)).
- Power Query records cleaning steps once so they rerun on every refresh ([Microsoft: About Power Query in Excel](https://support.microsoft.com/en-us/excel/about-power-query-in-excel)).

## Power BI

- Model data as a star schema: fact tables of events, dimension tables to filter and group by ([Power BI guidance: Star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)).
- Measures are calculated at query time in the current filter context; calculated columns are stored per row at refresh ([Power BI: Measures](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-measures)).
- `CALCULATE` evaluates an expression in a modified filter context and is the core of DAX ([DAX: CALCULATE](https://learn.microsoft.com/en-us/dax/calculate-function-dax)).
- Time-intelligence functions need a proper date table marked as such ([Power BI guidance: Date tables](https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables)).

## Statistics

- The mean is pulled by outliers; the median is robust to them ([NIST/SEMATECH e-Handbook: Measures of location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm)).
- A box plot shows the median, the quartiles and points far outside the interquartile range ([NIST/SEMATECH e-Handbook: Box plot](https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm)).
- Online controlled experiments (A/B tests) randomise users into variants so a difference in the metric can be attributed to the change ([Kohavi et al., 2009: Controlled experiments on the web](https://doi.org/10.1007/s10618-008-0114-1)).
- Repeatedly checking a running test and stopping when it looks significant inflates false positives ([Johari et al.: Peeking at A/B tests](https://arxiv.org/abs/1512.04922)).

## Visualisation and storytelling

- People judge position along a common scale more accurately than length, angle or area, which is why bar and dot charts beat pie charts for comparisons ([Cleveland & McGill, 1984: Graphical perception](https://doi.org/10.1080/01621459.1984.10478080)).
- Do not use colour as the only way to convey information ([W3C: Understanding Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).
- Use sequential palettes for ordered data, diverging ones around a meaningful midpoint, and qualitative ones for categories ([ColorBrewer](https://colorbrewer2.org/)).

## Python

- pandas `groupby` splits data, applies a function and combines the results ([pandas: Group by](https://pandas.pydata.org/docs/user_guide/groupby.html)).
- `merge` joins DataFrames like SQL joins; check row counts before and after ([pandas: Merge, join, concatenate](https://pandas.pydata.org/docs/user_guide/merging.html)).
