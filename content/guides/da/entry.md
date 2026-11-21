# Data Analyst — entry level

*What a junior analyst role expects: clean SQL, confident Excel, a working Power BI report, basic statistics and clear charts.*

## SQL you will write every day

- Filter rows with `WHERE`, groups with `HAVING` ([PostgreSQL: GROUP BY and HAVING](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP)).
- `LEFT JOIN` keeps every row from the left table even without a match ([PostgreSQL: Joined tables](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)).
- A NULL compared with `=` is never true; test with `IS NULL` and replace with `COALESCE` ([PostgreSQL: Conditional expressions](https://www.postgresql.org/docs/current/functions-conditional.html)).
- `CASE WHEN … THEN … END` turns conditions into categories or 0/1 flags ([PostgreSQL: CASE](https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE)).
- `date_trunc('month', ts)` groups timestamps by month ([PostgreSQL: date_trunc](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-TRUNC)).
- `ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)` numbers rows within each group, for "latest per customer" or "top N per category" ([PostgreSQL: Window function calls](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS)).
- Avoid division by zero with `NULLIF(denominator, 0)` ([PostgreSQL: NULLIF](https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-NULLIF)).

## Excel

- Format ranges as Excel tables so formulas use column names and ranges grow with the data ([Microsoft: Overview of Excel tables](https://support.microsoft.com/en-us/excel/overview-of-excel-tables)).
- `SUMIFS` and `COUNTIFS` total or count rows that meet several conditions ([Microsoft: SUMIFS function](https://support.microsoft.com/en-us/excel/functions/sumifs-function)).
- `XLOOKUP` replaces `VLOOKUP` and can look left and return a default when nothing matches ([Microsoft: XLOOKUP function](https://support.microsoft.com/en-us/excel/functions/xlookup-function)).
- Dynamic array formulas such as `UNIQUE`, `FILTER` and `SORT` spill results into neighbouring cells; a blocked range shows `#SPILL!` ([Microsoft: Dynamic array formulas and spilled array behavior](https://support.microsoft.com/en-us/excel/dynamic-array-formulas-and-spilled-array-behavior)).
- PivotTables group by rows and columns and summarise values, with filters ([Microsoft: Create a PivotTable](https://support.microsoft.com/en-us/excel/get-started/create-a-pivottable-to-analyze-worksheet-data)).
- Power Query can combine every file in a folder into one table that refreshes ([Microsoft: Import data from a folder with multiple files](https://support.microsoft.com/en-us/excel/import-data-from-a-folder-with-multiple-files-power-query)).

## Power BI

- The workflow is: get data, transform it in Power Query, model it, build visuals, publish to the service ([Power BI: Get started with Power BI Desktop](https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-getting-started)).
- Relationships between tables let a filter on a dimension flow to the fact table ([Power BI: Model relationships](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand)).
- Write measures, not calculated columns, for totals and ratios that must respond to filters ([Power BI: Calculated columns](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculated-columns)).
- `DIVIDE` handles division by zero safely in DAX ([DAX: DIVIDE](https://learn.microsoft.com/en-us/dax/divide-function-dax)).
- `TOTALYTD` and `SAMEPERIODLASTYEAR` give year-to-date and prior-year comparisons ([DAX: TOTALYTD](https://learn.microsoft.com/en-us/dax/totalytd-function-dax), [DAX: SAMEPERIODLASTYEAR](https://learn.microsoft.com/en-us/dax/sameperiodlastyear-function-dax)).

## Statistics

- Report the median as well as the mean for skewed data such as order values ([NIST/SEMATECH e-Handbook: Measures of location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm)).
- Standard deviation measures how spread out values are around the mean ([NIST/SEMATECH e-Handbook: Measures of scale](https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm)).
- A confidence interval gives a range of plausible values for a quantity estimated from a sample ([NIST/SEMATECH e-Handbook: Confidence intervals](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm)).
- Correlation does not establish causation; a randomised experiment is the standard way to test cause ([Kohavi et al., 2009: Controlled experiments on the web](https://doi.org/10.1007/s10618-008-0114-1)).

## Charts

- Prefer bars and dots for comparisons; position on a common scale is read most accurately ([Cleveland & McGill, 1984](https://doi.org/10.1080/01621459.1984.10478080)).
- Start bar charts at zero, because a bar's length encodes the value ([Cleveland & McGill, 1984](https://doi.org/10.1080/01621459.1984.10478080)).
- Text on charts needs enough contrast to read: 4.5:1 for normal text ([W3C: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

## Python

- `pd.read_csv` loads a file; `df.info()` and `df.describe()` show types, missing values and summary statistics ([pandas: 10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html)).
- Missing values show as `NaN` or `NA`; `isna()`, `fillna()` and `dropna()` find and handle them ([pandas: Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)).
