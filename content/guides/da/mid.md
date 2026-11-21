# Data Analyst — mid level

*What a mid-level role adds: model design and DAX you can reason about, performance, security, experiments and product metrics.*

## Modelling and DAX

- Prefer one-directional, one-to-many relationships from dimensions to facts; bidirectional filtering can cause ambiguity and slow models ([Power BI guidance: Bi-directional relationships](https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering)).
- Row context iterates rows (calculated columns and iterators such as `SUMX`); filter context comes from slicers, visuals and `CALCULATE` ([DAX overview: Context](https://learn.microsoft.com/en-us/dax/dax-overview#context)).
- `CALCULATE` turns row context into filter context (context transition) when it is used inside an iterator or calculated column ([DAX: CALCULATE](https://learn.microsoft.com/en-us/dax/calculate-function-dax)).
- Variables (`VAR … RETURN`) make measures easier to read and avoid evaluating the same expression twice ([DAX: VAR](https://learn.microsoft.com/en-us/dax/var-dax)).
- `ALL` and `REMOVEFILTERS` clear filters, for example to compute a share of total ([DAX: REMOVEFILTERS](https://learn.microsoft.com/en-us/dax/removefilters-function-dax)).
- Semi-additive measures such as balances must not be summed over time; take the closing value instead ([DAX: CLOSINGBALANCEMONTH](https://learn.microsoft.com/en-us/dax/closingbalancemonth-function-dax)).
- Calculation groups apply the same time logic, such as YTD, to many measures without copying them ([Power BI: Calculation groups](https://learn.microsoft.com/en-us/power-bi/transform-model/calculation-groups)).

## Performance and refresh

- Import mode loads data into the in-memory engine; DirectQuery sends queries to the source at view time; composite models mix both ([Power BI: Storage mode](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-storage-mode)).
- Query folding pushes Power Query steps back to the source as SQL; steps that break folding force local processing ([Power Query: Query folding](https://learn.microsoft.com/en-us/power-query/query-folding-basics)).
- Incremental refresh reloads only recent partitions of a large table ([Power BI: Incremental refresh](https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-overview)).
- Performance Analyzer times each visual's DAX query and rendering ([Power BI: Performance Analyzer](https://learn.microsoft.com/en-us/power-bi/create-reports/performance-analyzer)).

## Security and governance

- Row-level security filters the rows each user sees using roles and DAX rules ([Power BI: Row-level security](https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security)).
- Object-level security hides whole tables or columns from some roles ([Power BI: Object-level security](https://learn.microsoft.com/en-us/fabric/security/service-admin-object-level-security)).
- Sensitivity labels classify and protect reports and exported data ([Power BI: Sensitivity labels](https://learn.microsoft.com/en-us/fabric/enterprise/powerbi/service-security-sensitivity-label-overview)).

## Advanced SQL for analysis

- `LAG` and `LEAD` compare a row with the previous or next one, such as month-over-month growth ([PostgreSQL: Window functions](https://www.postgresql.org/docs/current/functions-window.html)).
- Join a calendar built with `generate_series` so days with no orders show as zero instead of disappearing ([PostgreSQL: Set returning functions](https://www.postgresql.org/docs/current/functions-srf.html)).
- `percentile_cont` computes medians and percentiles as ordered-set aggregates ([PostgreSQL: Ordered-set aggregate functions](https://www.postgresql.org/docs/current/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE)).
- The `FILTER` clause computes several conditional aggregates in one pass ([PostgreSQL: Aggregate expressions](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES)).

## Experiments

- Decide the primary metric, guardrail metrics and sample size before the test starts ([Kohavi et al., 2009: Controlled experiments on the web](https://doi.org/10.1007/s10618-008-0114-1)).
- Stopping a test the first time it looks significant inflates false positives; use a fixed horizon or a sequential method designed for continuous monitoring ([Johari et al.: Peeking at A/B tests](https://arxiv.org/abs/1512.04922)).
- A sample ratio mismatch, when the split of users differs from the design, signals a broken experiment whose results should not be trusted ([Fabijan et al., 2019: Diagnosing sample ratio mismatch](https://doi.org/10.1145/3292500.3330722)).
- CUPED uses pre-experiment data to reduce variance, so tests need fewer users ([Deng et al., 2013: CUPED](https://doi.org/10.1145/2433396.2433413)).
- A hypothesis test asks whether the observed difference is plausible under the null hypothesis; the p-value is that probability, not the probability the change works ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).

## Communicating results

- Put the most important information where readers look first, at the top left, and keep each page focused on one question ([Power BI: Tips for designing a great dashboard](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips)).
- Report experiment results with confidence intervals, not just a point estimate and a verdict ([Kohavi et al., 2009](https://doi.org/10.1007/s10618-008-0114-1)).
- Check charts for colour-only encodings, which colour-blind readers may miss ([W3C: Understanding Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).
