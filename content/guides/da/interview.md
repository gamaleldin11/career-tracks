# Data Analyst — interview prep

*Short answers to the questions analyst interviews ask most: SQL, Excel, Power BI, statistics and the business case.*

## SQL

### `WHERE` or `HAVING`?

`WHERE` filters rows before grouping; `HAVING` filters groups after aggregation, so conditions on `SUM` or `COUNT` go in `HAVING` ([PostgreSQL: GROUP BY and HAVING](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP)).

### `ROW_NUMBER`, `RANK` or `DENSE_RANK`?

`ROW_NUMBER` numbers rows uniquely; `RANK` gives ties the same rank and leaves gaps; `DENSE_RANK` gives ties the same rank without gaps ([PostgreSQL: Window functions](https://www.postgresql.org/docs/current/functions-window.html)).

### How do you get the latest order per customer?

Number each customer's orders with `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)` in a CTE and keep row 1 ([PostgreSQL: WITH queries](https://www.postgresql.org/docs/current/queries-with.html), [PostgreSQL: Window functions tutorial](https://www.postgresql.org/docs/current/tutorial-window.html)).

### Why are your revenue totals too high after a join?

The join multiplied rows, for example one order joined to several order lines or payments; aggregate to the right grain before joining, or count distinct keys ([PostgreSQL: Joined tables](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)).

### How do you calculate month-over-month growth?

Aggregate by month with `date_trunc`, then compare each month with `LAG` of the previous one and divide, protecting against zero with `NULLIF` ([PostgreSQL: date_trunc](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-TRUNC), [PostgreSQL: Window functions](https://www.postgresql.org/docs/current/functions-window.html)).

## Excel and Power BI

### `VLOOKUP` or `XLOOKUP`?

`XLOOKUP`: it defaults to exact match, can return columns to the left, and takes a value to return when nothing is found ([Microsoft: XLOOKUP function](https://support.microsoft.com/en-us/excel/functions/xlookup-function)).

### Measure or calculated column?

A measure is computed at query time in the visual's filter context, right for totals and ratios; a calculated column is stored per row at refresh, right for row-level attributes you slice by ([Power BI: Measures](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-measures), [Power BI: Calculated columns](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculated-columns)).

### What does `CALCULATE` do?

It evaluates an expression in a filter context that it modifies with its filter arguments, such as one region or the previous year ([DAX: CALCULATE](https://learn.microsoft.com/en-us/dax/calculate-function-dax)).

### Why a star schema?

Facts in one table and descriptive attributes in dimensions make filters predictable, DAX simpler and the model faster ([Power BI guidance: Star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)).

### Import or DirectQuery?

Import for speed and full DAX features when data fits and can refresh on a schedule; DirectQuery when data must be near real time or is too large, accepting slower visuals ([Power BI: Storage mode](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-storage-mode)).

### How do you limit what each manager sees?

Row-level security: a role with a DAX filter, often using `USERPRINCIPALNAME()` against a mapping table ([Power BI: Row-level security](https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security)).

## Statistics and experiments

### Mean or median for order value?

The median, or both: order values are usually skewed and the mean is pulled by large orders ([NIST/SEMATECH e-Handbook: Measures of location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm)).

### What is a p-value?

The probability of a result at least as extreme as the one observed if the null hypothesis were true; it is not the probability that the change works ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).

### How would you run an A/B test on a new checkout?

Define one primary metric and guardrails, compute the sample size, randomise users, run for the planned time without stopping early, check the sample ratio, then decide ([Kohavi et al., 2009](https://doi.org/10.1007/s10618-008-0114-1), [Fabijan et al., 2019: Sample ratio mismatch](https://doi.org/10.1145/3292500.3330722)).

### The average of daily conversion rates differs from the overall rate. Which is right?

The overall rate, total conversions over total sessions; averaging rates gives a small day the same weight as a big one, and aggregation can even reverse a trend ([Stanford Encyclopedia of Philosophy: Simpson's paradox](https://plato.stanford.edu/entries/paradox-simpson/)).

## Visualisation

### Why not a pie chart?

Readers compare angles and areas less accurately than positions and lengths, so a sorted bar chart shows the ranking far better ([Cleveland & McGill, 1984: Graphical perception](https://doi.org/10.1080/01621459.1984.10478080)).

### How do you make a dashboard accessible?

Sufficient contrast, labels that do not rely on colour alone, and a logical reading order ([W3C: Understanding Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [Power BI: Design reports for accessibility](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports)).

## Behavioural

### "Tell me about an analysis that changed a decision."

The question, your approach, the finding, the decision and its measured outcome, with your own contribution clear; structured interviews look for specific, job-related evidence ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
