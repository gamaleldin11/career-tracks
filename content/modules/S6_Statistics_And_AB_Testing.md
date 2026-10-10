# Statistics and A/B Testing — What Analysts and Data Scientists Get Asked

Statistics questions in Egyptian analyst and data-scientist interviews are mostly about **interpretation**: what a p-value means, whether a difference is real, whether an experiment was run properly. You won't be asked to derive formulas. You will be asked to explain them to a product manager, the "Bob" from the recruiter videos. Your *AI Journey* Part 15 goes deeper on the theory; this module is the interview-ready core shared by the analyst and data-scientist tracks.

> [!focus]
> **Entry must:** choose mean vs median; explain standard deviation, percentiles and outliers; state Bayes' rule and use it; explain the central limit theorem, confidence intervals and p-values **correctly**; know type I and II errors; design a basic A/B test.
> **Mid adds:** sample size and power, the right test for the data, sample-ratio mismatch, peeking, multiple comparisons, Simpson's paradox, guardrail metrics.
> **Most asked:** *What is a p-value?* · *Explain a confidence interval to a manager* · *How long should this A/B test run?* · *Correlation vs causation* · *Mean or median for salaries?* · *The test is significant but the effect is tiny. Ship it?*
> **Time budget:** 4 hours.

## S6.0 Foundations: kinds of data, samples and the notation 🟢

Statistics is the toolkit for one problem: you only ever see **some** of the data, and you need to say something trustworthy about **all** of it. Before any test, get three things straight.

### What kind of variable is it?

| Type | Examples | Summaries that make sense | Typical chart |
|---|---|---|---|
| **Numerical, continuous** | Order value, delivery time | Mean, median, SD, percentiles | Histogram, box plot |
| **Numerical, discrete** (counts) | Items per order, tickets per hour | Mean, median | Bar chart of counts |
| **Categorical, nominal** | City, payment method | Counts, proportions, mode | Bar chart |
| **Categorical, ordinal** | Satisfaction 1–5, plan tier | Median, percentiles; a mean only with care | Ordered bar chart |
| **Binary** | Converted: yes or no | A proportion (a rate) | Bars, or the rate over time |

The type decides the summary, the chart ([[DA5]]) and the test ([[S6.7]]). Averaging an ordinal 1–5 rating, for example, assumes the step from 1 to 2 equals the step from 4 to 5.

### Population and sample, parameter and statistic

- The **population** is everyone you care about: all of a telecom's prepaid customers. A number describing it is a **parameter**, such as the true churn rate. You almost never know it.
- A **sample** is the part you observe. A number computed from it is a **statistic**, such as the churn rate among the 5,000 customers you surveyed. A different sample gives a slightly different statistic. Quantifying that **sampling variability** is what the rest of this module is about.
- A sample only represents the population if it was drawn **at random** from it. Surveying only app users tells you about app users.

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="A population of 400 customers with a true churn proportion, and three random samples of 40 that each estimate it with a slightly different sample proportion">
<circle class="sP" cx="20" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="47" cy="34" r="3" opacity="0.4"/>
<circle class="sPr" cx="56" cy="34" r="3" opacity="0.9"/>
<circle class="sP" cx="65" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="34" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="34" r="3" opacity="0.4"/>
<circle class="sPr" cx="236" cy="34" r="3" opacity="0.9"/>
<circle class="sP" cx="20" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="43" r="3" opacity="0.4"/>
<circle class="sPr" cx="47" cy="43" r="3" opacity="0.9"/>
<circle class="sP" cx="56" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="43" r="3" opacity="0.4"/>
<circle class="sPr" cx="191" cy="43" r="3" opacity="0.9"/>
<circle class="sP" cx="200" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="43" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="43" r="3" opacity="0.4"/>
<circle class="sPr" cx="236" cy="43" r="3" opacity="0.9"/>
<circle class="sP" cx="20" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="52" r="3" opacity="0.4"/>
<circle class="sPr" cx="38" cy="52" r="3" opacity="0.9"/>
<circle class="sP" cx="47" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="52" r="3" opacity="0.4"/>
<circle class="sPr" cx="83" cy="52" r="3" opacity="0.9"/>
<circle class="sP" cx="92" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="52" r="3" opacity="0.4"/>
<circle class="sPr" cx="119" cy="52" r="3" opacity="0.9"/>
<circle class="sP" cx="128" cy="52" r="3" opacity="0.4"/>
<circle class="sPr" cx="137" cy="52" r="3" opacity="0.9"/>
<circle class="sP" cx="146" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="52" r="3" opacity="0.4"/>
<circle class="sPr" cx="200" cy="52" r="3" opacity="0.9"/>
<circle class="sP" cx="209" cy="52" r="3" opacity="0.4"/>
<circle class="sPr" cx="218" cy="52" r="3" opacity="0.9"/>
<circle class="sP" cx="227" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="52" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="47" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="61" r="3" opacity="0.4"/>
<circle class="sPr" cx="146" cy="61" r="3" opacity="0.9"/>
<circle class="sP" cx="155" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="61" r="3" opacity="0.4"/>
<circle class="sPr" cx="191" cy="61" r="3" opacity="0.9"/>
<circle class="sPr" cx="200" cy="61" r="3" opacity="0.9"/>
<circle class="sPr" cx="209" cy="61" r="3" opacity="0.9"/>
<circle class="sP" cx="218" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="61" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="47" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="70" r="3" opacity="0.4"/>
<circle class="sPr" cx="101" cy="70" r="3" opacity="0.9"/>
<circle class="sP" cx="110" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="70" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="70" r="3" opacity="0.4"/>
<circle class="sPr" cx="20" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="29" cy="79" r="3" opacity="0.4"/>
<circle class="sPr" cx="38" cy="79" r="3" opacity="0.9"/>
<circle class="sPr" cx="47" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="56" cy="79" r="3" opacity="0.4"/>
<circle class="sPr" cx="65" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="74" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="79" r="3" opacity="0.4"/>
<circle class="sPr" cx="110" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="119" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="79" r="3" opacity="0.4"/>
<circle class="sPr" cx="191" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="200" cy="79" r="3" opacity="0.4"/>
<circle class="sPr" cx="209" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="218" cy="79" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="79" r="3" opacity="0.4"/>
<circle class="sPr" cx="236" cy="79" r="3" opacity="0.9"/>
<circle class="sP" cx="20" cy="88" r="3" opacity="0.4"/>
<circle class="sPr" cx="29" cy="88" r="3" opacity="0.9"/>
<circle class="sPr" cx="38" cy="88" r="3" opacity="0.9"/>
<circle class="sP" cx="47" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="88" r="3" opacity="0.4"/>
<circle class="sPr" cx="92" cy="88" r="3" opacity="0.9"/>
<circle class="sP" cx="101" cy="88" r="3" opacity="0.4"/>
<circle class="sPr" cx="110" cy="88" r="3" opacity="0.9"/>
<circle class="sP" cx="119" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="88" r="3" opacity="0.4"/>
<circle class="sPr" cx="182" cy="88" r="3" opacity="0.9"/>
<circle class="sP" cx="191" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="88" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="97" r="3" opacity="0.4"/>
<circle class="sPr" cx="29" cy="97" r="3" opacity="0.9"/>
<circle class="sP" cx="38" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="47" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="97" r="3" opacity="0.4"/>
<circle class="sPr" cx="74" cy="97" r="3" opacity="0.9"/>
<circle class="sP" cx="83" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="97" r="3" opacity="0.4"/>
<circle class="sPr" cx="128" cy="97" r="3" opacity="0.9"/>
<circle class="sPr" cx="137" cy="97" r="3" opacity="0.9"/>
<circle class="sP" cx="146" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="97" r="3" opacity="0.4"/>
<circle class="sPr" cx="173" cy="97" r="3" opacity="0.9"/>
<circle class="sPr" cx="182" cy="97" r="3" opacity="0.9"/>
<circle class="sP" cx="191" cy="97" r="3" opacity="0.4"/>
<circle class="sPr" cx="200" cy="97" r="3" opacity="0.9"/>
<circle class="sP" cx="209" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="97" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="29" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="38" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="47" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="56" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="83" cy="106" r="3" opacity="0.9"/>
<circle class="sPr" cx="92" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="101" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="110" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="119" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="128" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="137" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="146" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="155" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="106" r="3" opacity="0.4"/>
<circle class="sPr" cx="218" cy="106" r="3" opacity="0.9"/>
<circle class="sP" cx="227" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="106" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="47" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="115" r="3" opacity="0.4"/>
<circle class="sPr" cx="173" cy="115" r="3" opacity="0.9"/>
<circle class="sP" cx="182" cy="115" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="115" r="3" opacity="0.4"/>
<circle class="sPr" cx="200" cy="115" r="3" opacity="0.9"/>
<circle class="sPr" cx="209" cy="115" r="3" opacity="0.9"/>
<circle class="sP" cx="218" cy="115" r="3" opacity="0.4"/>
<circle class="sPr" cx="227" cy="115" r="3" opacity="0.9"/>
<circle class="sP" cx="236" cy="115" r="3" opacity="0.4"/>
<circle class="sPr" cx="20" cy="124" r="3" opacity="0.9"/>
<circle class="sP" cx="29" cy="124" r="3" opacity="0.4"/>
<circle class="sPr" cx="38" cy="124" r="3" opacity="0.9"/>
<circle class="sP" cx="47" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="124" r="3" opacity="0.4"/>
<circle class="sPr" cx="128" cy="124" r="3" opacity="0.9"/>
<circle class="sP" cx="137" cy="124" r="3" opacity="0.4"/>
<circle class="sPr" cx="146" cy="124" r="3" opacity="0.9"/>
<circle class="sPr" cx="155" cy="124" r="3" opacity="0.9"/>
<circle class="sP" cx="164" cy="124" r="3" opacity="0.4"/>
<circle class="sPr" cx="173" cy="124" r="3" opacity="0.9"/>
<circle class="sP" cx="182" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="124" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="47" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="133" r="3" opacity="0.4"/>
<circle class="sPr" cx="137" cy="133" r="3" opacity="0.9"/>
<circle class="sP" cx="146" cy="133" r="3" opacity="0.4"/>
<circle class="sPr" cx="155" cy="133" r="3" opacity="0.9"/>
<circle class="sP" cx="164" cy="133" r="3" opacity="0.4"/>
<circle class="sPr" cx="173" cy="133" r="3" opacity="0.9"/>
<circle class="sP" cx="182" cy="133" r="3" opacity="0.4"/>
<circle class="sPr" cx="191" cy="133" r="3" opacity="0.9"/>
<circle class="sP" cx="200" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="133" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="133" r="3" opacity="0.4"/>
<circle class="sPr" cx="236" cy="133" r="3" opacity="0.9"/>
<circle class="sPr" cx="20" cy="142" r="3" opacity="0.9"/>
<circle class="sPr" cx="29" cy="142" r="3" opacity="0.9"/>
<circle class="sPr" cx="38" cy="142" r="3" opacity="0.9"/>
<circle class="sPr" cx="47" cy="142" r="3" opacity="0.9"/>
<circle class="sP" cx="56" cy="142" r="3" opacity="0.4"/>
<circle class="sPr" cx="65" cy="142" r="3" opacity="0.9"/>
<circle class="sP" cx="74" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="142" r="3" opacity="0.4"/>
<circle class="sPr" cx="92" cy="142" r="3" opacity="0.9"/>
<circle class="sP" cx="101" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="142" r="3" opacity="0.4"/>
<circle class="sPr" cx="182" cy="142" r="3" opacity="0.9"/>
<circle class="sP" cx="191" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="142" r="3" opacity="0.4"/>
<circle class="sP" cx="20" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="151" r="3" opacity="0.4"/>
<circle class="sPr" cx="38" cy="151" r="3" opacity="0.9"/>
<circle class="sP" cx="47" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="65" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="74" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="151" r="3" opacity="0.4"/>
<circle class="sPr" cx="128" cy="151" r="3" opacity="0.9"/>
<circle class="sP" cx="137" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="151" r="3" opacity="0.4"/>
<circle class="sPr" cx="182" cy="151" r="3" opacity="0.9"/>
<circle class="sP" cx="191" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="200" cy="151" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="151" r="3" opacity="0.4"/>
<circle class="sPr" cx="218" cy="151" r="3" opacity="0.9"/>
<circle class="sP" cx="227" cy="151" r="3" opacity="0.4"/>
<circle class="sPr" cx="236" cy="151" r="3" opacity="0.9"/>
<circle class="sP" cx="20" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="29" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="38" cy="160" r="3" opacity="0.4"/>
<circle class="sPr" cx="47" cy="160" r="3" opacity="0.9"/>
<circle class="sP" cx="56" cy="160" r="3" opacity="0.4"/>
<circle class="sPr" cx="65" cy="160" r="3" opacity="0.9"/>
<circle class="sP" cx="74" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="92" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="101" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="110" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="119" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="137" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="146" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="191" cy="160" r="3" opacity="0.4"/>
<circle class="sPr" cx="200" cy="160" r="3" opacity="0.9"/>
<circle class="sPr" cx="209" cy="160" r="3" opacity="0.9"/>
<circle class="sPr" cx="218" cy="160" r="3" opacity="0.9"/>
<circle class="sP" cx="227" cy="160" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="160" r="3" opacity="0.4"/>
<circle class="sPr" cx="20" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="29" cy="169" r="3" opacity="0.4"/>
<circle class="sPr" cx="38" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="47" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="56" cy="169" r="3" opacity="0.4"/>
<circle class="sPr" cx="65" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="74" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="83" cy="169" r="3" opacity="0.4"/>
<circle class="sPr" cx="92" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="101" cy="169" r="3" opacity="0.4"/>
<circle class="sPr" cx="110" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="119" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="128" cy="169" r="3" opacity="0.4"/>
<circle class="sPr" cx="137" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="146" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="155" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="164" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="173" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="182" cy="169" r="3" opacity="0.4"/>
<circle class="sPr" cx="191" cy="169" r="3" opacity="0.9"/>
<circle class="sP" cx="200" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="209" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="218" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="227" cy="169" r="3" opacity="0.4"/>
<circle class="sP" cx="236" cy="169" r="3" opacity="0.4"/>
<text class="sT" x="128" y="22" text-anchor="middle">population: all 400 customers</text>
<text class="sGt" x="128" y="196" text-anchor="middle">parameter p = 0.207 (true churn, red)</text>
<line class="sLm" x1="250" y1="110" x2="300" y2="54" marker-end="url(#ahm)"/>
<rect class="sN" x="304" y="40" width="230" height="34" rx="6"/><text class="sC" x="316" y="61">sample 1: 40 random customers</text>
<text class="sT" x="548" y="61">statistic p̂ = 0.200</text>
<line class="sLm" x1="250" y1="110" x2="300" y2="106" marker-end="url(#ahm)"/>
<rect class="sN" x="304" y="92" width="230" height="34" rx="6"/><text class="sC" x="316" y="113">sample 2: 40 random customers</text>
<text class="sT" x="548" y="113">statistic p̂ = 0.175</text>
<line class="sLm" x1="250" y1="110" x2="300" y2="158" marker-end="url(#ahm)"/>
<rect class="sN" x="304" y="144" width="230" height="34" rx="6"/><text class="sC" x="316" y="165">sample 3: 40 random customers</text>
<text class="sT" x="548" y="165">statistic p̂ = 0.175</text>
<text class="sS" x="450" y="216" text-anchor="middle">every sample gives a different p̂: that spread is what standard errors measure</text>
</svg><figcaption>Parameter vs statistic: one fixed truth, many estimates. Simulated.</figcaption></figure>

### Reading the notation

| Symbol | Read as | Means |
|---|---|---|
| *n* | "n" | Sample size |
| x̄ | "x-bar" | The sample mean (a statistic) |
| μ | "mu" | The population mean (a parameter) |
| *s*, σ | "s", "sigma" | Sample and population standard deviation |
| p̂, *p* | "p-hat", "p" | Sample and true proportion |
| Σ | "sigma" (capital) | Add up |
| α, β | "alpha", "beta" | The false-positive and false-negative rates of a test |
| H₀, H₁ | "H-nought", "H-one" | Null and alternative hypotheses |

Greek letters usually mean the unknown truth; Latin letters and hats mean what you estimated from data.

### Mean, variance and standard deviation by hand

Take eight delivery times in days: 2, 4, 4, 4, 5, 5, 7, 9.

1. **Mean:** 40 / 8 = **5**.
2. **Deviations** from the mean: −3, −1, −1, −1, 0, 0, 2, 4. They always sum to zero, which is why we square them.
3. **Squared** deviations: 9, 1, 1, 1, 0, 0, 4, 16, which sum to 32.
4. **Variance:** 32 / 8 = 4 if these eight are the whole population; **32 / 7 ≈ 4.57** if they're a sample. Dividing by *n* − 1 corrects for the sample mean sitting closer to its own data than the true mean does.
5. **Standard deviation:** the square root, back in days: 2, or about 2.14 for the sample version.

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Eight delivery times with their deviations from the mean of 5 drawn as vertical bars; the squared deviations 9, 1, 1, 1, 0, 0, 4 and 16 sum to 32, giving variance 4 for a population or 4.57 for a sample">
<line class="sLg" x1="40" y1="110" x2="545" y2="110" stroke-dasharray="5 3"/><text class="sGt" x="44" y="104">mean 5</text>
<line class="sLv" x1="70" y1="110" x2="70" y2="164" style="stroke-width:3"/>
<circle class="sP" cx="70" cy="164" r="5"/><text class="sT" x="70" y="216" text-anchor="middle">2</text>
<text class="sS" x="84" y="168">-3</text>
<text class="sC" x="70" y="234" text-anchor="middle">9</text>
<line class="sLv" x1="136" y1="110" x2="136" y2="128" style="stroke-width:3"/>
<circle class="sP" cx="136" cy="128" r="5"/><text class="sT" x="136" y="216" text-anchor="middle">4</text>
<text class="sS" x="150" y="132">-1</text>
<text class="sC" x="136" y="234" text-anchor="middle">1</text>
<line class="sLv" x1="202" y1="110" x2="202" y2="128" style="stroke-width:3"/>
<circle class="sP" cx="202" cy="128" r="5"/><text class="sT" x="202" y="216" text-anchor="middle">4</text>
<text class="sS" x="216" y="132">-1</text>
<text class="sC" x="202" y="234" text-anchor="middle">1</text>
<line class="sLv" x1="268" y1="110" x2="268" y2="128" style="stroke-width:3"/>
<circle class="sP" cx="268" cy="128" r="5"/><text class="sT" x="268" y="216" text-anchor="middle">4</text>
<text class="sS" x="282" y="132">-1</text>
<text class="sC" x="268" y="234" text-anchor="middle">1</text>
<circle class="sP" cx="334" cy="110" r="5"/><text class="sT" x="334" y="216" text-anchor="middle">5</text>
<text class="sS" x="348" y="114">0</text>
<text class="sC" x="334" y="234" text-anchor="middle">0</text>
<circle class="sP" cx="400" cy="110" r="5"/><text class="sT" x="400" y="216" text-anchor="middle">5</text>
<text class="sS" x="414" y="114">0</text>
<text class="sC" x="400" y="234" text-anchor="middle">0</text>
<line class="sLr" x1="466" y1="110" x2="466" y2="74" style="stroke-width:3"/>
<circle class="sP" cx="466" cy="74" r="5"/><text class="sT" x="466" y="216" text-anchor="middle">7</text>
<text class="sS" x="480" y="78">+2</text>
<text class="sC" x="466" y="234" text-anchor="middle">4</text>
<line class="sLr" x1="532" y1="110" x2="532" y2="38" style="stroke-width:3"/>
<circle class="sP" cx="532" cy="38" r="5"/><text class="sT" x="532" y="216" text-anchor="middle">9</text>
<text class="sS" x="546" y="42">+4</text>
<text class="sC" x="532" y="234" text-anchor="middle">16</text>
<text class="sM" x="14" y="216">x</text><text class="sM" x="14" y="234">(x−x̄)²</text>
<rect class="sN" x="560" y="40" width="146" height="86" rx="8"/><text class="sT" x="633" y="60" text-anchor="middle">Σ = 32</text><text class="sC" x="633" y="82" text-anchor="middle">÷ n = 4</text><text class="sGt" x="633" y="102" text-anchor="middle">÷ (n−1) = 4.57</text><text class="sS" x="633" y="118" text-anchor="middle">sample variance</text>
</svg><figcaption>Variance by hand: deviations from the mean, squared, summed, then divided by n or n − 1. Computed.</figcaption></figure>

> [!mistake] Two libraries, two answers
> pandas `Series.std()` divides by *n* − 1 by default; NumPy `np.std()` divides by *n* unless you pass `ddof=1`. Excel has both: `STDEV.S` (sample) and `STDEV.P` (population). On small data the difference is visible, so say which one you used.

### Expected value

The **expected value** is the long-run average outcome: each outcome times its probability, added up. A voucher that costs 20 EGP per user and raises the chance of an order worth 150 EGP in margin from 10% to 14% earns 0.04 × 150 = 6 EGP per user, so it loses 14 EGP per user however exciting the 40% relative lift sounds. Expected-value thinking turns "is it significant?" into "is it worth it?" ([[S6.10]]).

## S6.1 Describing data 🟢 ⭐

| Measure | What it tells you | Sensitive to outliers? |
|---|---|---|
| **Mean** | Arithmetic average | Very |
| **Median** | Middle value (50th percentile) | No |
| **Mode** | Most frequent value | No |
| **Variance** | Average squared distance from the mean | Very |
| **Standard deviation (SD)** | Square root of variance, in the data's own units | Very |
| **Percentiles** (p25, p75, p95) | The value below which that share of data falls | No |
| **IQR** | p75 − p25, the spread of the middle half | No |

**Skew.** Money data (salaries, order values, revenue per user) is usually **right-skewed**: most values are small and a few are huge. Then **mean > median**, and the median describes the "typical" user better. Report both when they differ much.

<figure class="dia"><svg viewBox="0 0 720 255" role="img" aria-label="A right-skewed distribution with the mode, then the median, then the mean further right">
<path class="sA" d="M41.6 200 L41.6 200.0 L45.6 200.0 L49.6 200.0 L53.6 199.6 L57.6 198.5 L61.6 196.0 L65.5 191.7 L69.5 185.4 L73.5 177.2 L77.5 167.4 L81.5 156.4 L85.5 144.5 L89.5 132.3 L93.5 120.0 L97.5 108.0 L101.5 96.5 L105.4 85.7 L109.4 75.8 L113.4 66.9 L117.4 59.0 L121.4 52.1 L125.4 46.3 L129.4 41.4 L133.4 37.5 L137.4 34.5 L141.3 32.4 L145.3 31.0 L149.3 30.3 L153.3 30.2 L157.3 30.8 L161.3 31.8 L165.3 33.3 L169.3 35.2 L173.3 37.4 L177.3 40.0 L181.2 42.8 L185.2 45.8 L189.2 48.9 L193.2 52.3 L197.2 55.7 L201.2 59.2 L205.2 62.8 L209.2 66.4 L213.2 70.1 L217.2 73.7 L221.2 77.4 L225.1 81.0 L229.1 84.6 L233.1 88.1 L237.1 91.6 L241.1 95.0 L245.1 98.4 L249.1 101.7 L253.1 105.0 L257.1 108.1 L261.1 111.2 L265.0 114.2 L269.0 117.1 L273.0 120.0 L277.0 122.7 L281.0 125.4 L285.0 128.0 L289.0 130.5 L293.0 133.0 L297.0 135.3 L301.0 137.6 L304.9 139.8 L308.9 142.0 L312.9 144.0 L316.9 146.0 L320.9 148.0 L324.9 149.8 L328.9 151.6 L332.9 153.4 L336.9 155.0 L340.9 156.6 L344.8 158.2 L348.8 159.7 L352.8 161.1 L356.8 162.5 L360.8 163.9 L364.8 165.2 L368.8 166.4 L372.8 167.6 L376.8 168.8 L380.8 169.9 L384.7 171.0 L388.7 172.0 L392.7 173.0 L396.7 173.9 L400.7 174.9 L404.7 175.8 L408.7 176.6 L412.7 177.4 L416.7 178.2 L420.6 179.0 L424.6 179.7 L428.6 180.4 L432.6 181.1 L436.6 181.8 L440.6 182.4 L444.6 183.0 L448.6 183.6 L452.6 184.2 L456.6 184.7 L460.6 185.2 L464.5 185.8 L468.5 186.2 L472.5 186.7 L476.5 187.2 L480.5 187.6 L484.5 188.0 L488.5 188.4 L492.5 188.8 L496.5 189.2 L500.5 189.6 L504.4 189.9 L508.4 190.2 L512.4 190.6 L516.4 190.9 L520.4 191.2 L524.4 191.5 L528.4 191.8 L532.4 192.0 L536.4 192.3 L540.3 192.5 L544.3 192.8 L548.3 193.0 L552.3 193.2 L556.3 193.5 L560.3 193.7 L564.3 193.9 L568.3 194.1 L572.3 194.3 L576.3 194.5 L580.2 194.6 L584.2 194.8 L588.2 195.0 L592.2 195.1 L596.2 195.3 L600.2 195.4 L604.2 195.6 L608.2 195.7 L612.2 195.8 L616.2 196.0 L620.1 196.1 L624.1 196.2 L628.1 196.3 L632.1 196.4 L636.1 196.6 L640.1 196.7 L644.1 196.8 L648.1 196.9 L652.1 197.0 L656.1 197.0 L660.1 197.1 L664.0 197.2 L668.0 197.3 L672.0 197.4 L676.0 197.5 L680.0 197.5 L680.0 200 Z" opacity=".55"/>
<polyline class="sL" points="41.6,200.0 45.6,200.0 49.6,200.0 53.6,199.6 57.6,198.5 61.6,196.0 65.5,191.7 69.5,185.4 73.5,177.2 77.5,167.4 81.5,156.4 85.5,144.5 89.5,132.3 93.5,120.0 97.5,108.0 101.5,96.5 105.4,85.7 109.4,75.8 113.4,66.9 117.4,59.0 121.4,52.1 125.4,46.3 129.4,41.4 133.4,37.5 137.4,34.5 141.3,32.4 145.3,31.0 149.3,30.3 153.3,30.2 157.3,30.8 161.3,31.8 165.3,33.3 169.3,35.2 173.3,37.4 177.3,40.0 181.2,42.8 185.2,45.8 189.2,48.9 193.2,52.3 197.2,55.7 201.2,59.2 205.2,62.8 209.2,66.4 213.2,70.1 217.2,73.7 221.2,77.4 225.1,81.0 229.1,84.6 233.1,88.1 237.1,91.6 241.1,95.0 245.1,98.4 249.1,101.7 253.1,105.0 257.1,108.1 261.1,111.2 265.0,114.2 269.0,117.1 273.0,120.0 277.0,122.7 281.0,125.4 285.0,128.0 289.0,130.5 293.0,133.0 297.0,135.3 301.0,137.6 304.9,139.8 308.9,142.0 312.9,144.0 316.9,146.0 320.9,148.0 324.9,149.8 328.9,151.6 332.9,153.4 336.9,155.0 340.9,156.6 344.8,158.2 348.8,159.7 352.8,161.1 356.8,162.5 360.8,163.9 364.8,165.2 368.8,166.4 372.8,167.6 376.8,168.8 380.8,169.9 384.7,171.0 388.7,172.0 392.7,173.0 396.7,173.9 400.7,174.9 404.7,175.8 408.7,176.6 412.7,177.4 416.7,178.2 420.6,179.0 424.6,179.7 428.6,180.4 432.6,181.1 436.6,181.8 440.6,182.4 444.6,183.0 448.6,183.6 452.6,184.2 456.6,184.7 460.6,185.2 464.5,185.8 468.5,186.2 472.5,186.7 476.5,187.2 480.5,187.6 484.5,188.0 488.5,188.4 492.5,188.8 496.5,189.2 500.5,189.6 504.4,189.9 508.4,190.2 512.4,190.6 516.4,190.9 520.4,191.2 524.4,191.5 528.4,191.8 532.4,192.0 536.4,192.3 540.3,192.5 544.3,192.8 548.3,193.0 552.3,193.2 556.3,193.5 560.3,193.7 564.3,193.9 568.3,194.1 572.3,194.3 576.3,194.5 580.2,194.6 584.2,194.8 588.2,195.0 592.2,195.1 596.2,195.3 600.2,195.4 604.2,195.6 608.2,195.7 612.2,195.8 616.2,196.0 620.1,196.1 624.1,196.2 628.1,196.3 632.1,196.4 636.1,196.6 640.1,196.7 644.1,196.8 648.1,196.9 652.1,197.0 656.1,197.0 660.1,197.1 664.0,197.2 668.0,197.3 672.0,197.4 676.0,197.5 680.0,197.5"/>
<line class="sLm" x1="40" y1="200" x2="690" y2="200"/>
<line class="sLg" x1="151.6" y1="26.2" x2="151.6" y2="200" stroke-dasharray="4 3"/>
<line class="sLw" x1="200.0" y1="54.2" x2="200.0" y2="200" stroke-dasharray="4 3"/>
<line class="sLr" x1="231.6" y1="82.7" x2="231.6" y2="200" stroke-dasharray="4 3"/>
<text class="sGt" x="147.628" y="218" text-anchor="end">mode</text>
<text class="sWt" x="202" y="232" text-anchor="middle">median</text>
<text class="sRt" x="235.555" y="218">mean</text>
<text class="sS" x="420" y="70">a few very large values (the long right tail)</text>
<text class="sS" x="420" y="88">pull the mean to the right of the median</text>
<text class="sC" x="40" y="246">order value →</text>
</svg><figcaption>Right skew, typical of money. Mode &lt; median &lt; mean: the mean is dragged toward the tail, so the median is the better "typical" value.</figcaption></figure>

> [!term] Outlier
> A value far from the rest. A common rule flags values below p25 − 1.5·IQR or above p75 + 1.5·IQR (the box-plot whiskers). An outlier is a question, not an error: is it a data-entry bug, fraud, or your best customer?

> [!say]
> "For salaries or order values I'd report the median, because the data is right-skewed and a few large values pull the mean up. I'd show the p25 to p75 range as the spread, and look at the extreme values separately rather than deleting them."

## S6.2 Distributions you should recognise 🟢

| Distribution | Models | Example | Key fact |
|---|---|---|---|
| **Normal** | Sums of many small effects | Heights, measurement error, sample means | ≈68% within 1 SD, 95% within 1.96 SD, 99.7% within 3 SD |
| **Binomial** | Number of successes in *n* yes/no trials | Conversions out of 1,000 visitors | Mean *np*, variance *np(1−p)* |
| **Bernoulli** | One yes/no trial | Did this user convert? | Variance *p(1−p)*, largest at p = 0.5 |
| **Poisson** | Counts of events in a fixed interval | Support tickets per hour | Mean = variance = λ |
| **Exponential** | Time between Poisson events | Minutes between tickets | Memoryless |
| **Uniform** | Every value equally likely | A random number generator | — |
| **Log-normal / long-tailed** | Multiplicative effects | Revenue per user, file sizes | Analyse the log, or use medians |

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Normal curve with the bands within one, two and three standard deviations shaded">
<path class="sV" d="M60.0 190 L60.0 188.3 L67.5 187.9 L75.0 187.4 L82.5 186.8 L90.0 186.1 L97.5 185.2 L105.0 184.2 L112.5 183.0 L120.0 181.6 L127.5 180.0 L135.0 178.1 L142.5 175.9 L150.0 173.5 L157.5 170.7 L165.0 167.7 L172.5 164.2 L180.0 160.4 L187.5 156.2 L195.0 151.7 L202.5 146.7 L210.0 141.4 L217.5 135.8 L225.0 129.9 L232.5 123.6 L240.0 117.2 L247.5 110.5 L255.0 103.8 L262.5 97.0 L270.0 90.2 L277.5 83.6 L285.0 77.1 L292.5 70.9 L300.0 65.0 L307.5 59.7 L315.0 54.8 L322.5 50.6 L330.0 47.0 L337.5 44.1 L345.0 42.1 L352.5 40.8 L360.0 40.4 L367.5 40.8 L375.0 42.1 L382.5 44.1 L390.0 47.0 L397.5 50.6 L405.0 54.8 L412.5 59.7 L420.0 65.0 L427.5 70.9 L435.0 77.1 L442.5 83.6 L450.0 90.2 L457.5 97.0 L465.0 103.8 L472.5 110.5 L480.0 117.2 L487.5 123.6 L495.0 129.9 L502.5 135.8 L510.0 141.4 L517.5 146.7 L525.0 151.7 L532.5 156.2 L540.0 160.4 L547.5 164.2 L555.0 167.7 L562.5 170.7 L570.0 173.5 L577.5 175.9 L585.0 178.1 L592.5 180.0 L600.0 181.6 L607.5 183.0 L615.0 184.2 L622.5 185.2 L630.0 186.1 L637.5 186.8 L645.0 187.4 L652.5 187.9 L660.0 188.3 L660.0 190 Z" opacity=".5"/>
<path class="sW" d="M160.0 190 L160.0 169.8 L165.0 167.7 L170.0 165.4 L175.0 163.0 L180.0 160.4 L185.0 157.6 L190.0 154.7 L195.0 151.7 L200.0 148.4 L205.0 145.0 L210.0 141.4 L215.0 137.7 L220.0 133.9 L225.0 129.9 L230.0 125.7 L235.0 121.5 L240.0 117.2 L245.0 112.8 L250.0 108.3 L255.0 103.8 L260.0 99.3 L265.0 94.7 L270.0 90.2 L275.0 85.8 L280.0 81.4 L285.0 77.1 L290.0 72.9 L295.0 68.9 L300.0 65.0 L305.0 61.4 L310.0 58.0 L315.0 54.8 L320.0 51.9 L325.0 49.3 L330.0 47.0 L335.0 45.0 L340.0 43.4 L345.0 42.1 L350.0 41.1 L355.0 40.6 L360.0 40.4 L365.0 40.6 L370.0 41.1 L375.0 42.1 L380.0 43.4 L385.0 45.0 L390.0 47.0 L395.0 49.3 L400.0 51.9 L405.0 54.8 L410.0 58.0 L415.0 61.4 L420.0 65.0 L425.0 68.9 L430.0 72.9 L435.0 77.1 L440.0 81.4 L445.0 85.8 L450.0 90.2 L455.0 94.7 L460.0 99.3 L465.0 103.8 L470.0 108.3 L475.0 112.8 L480.0 117.2 L485.0 121.5 L490.0 125.7 L495.0 129.9 L500.0 133.9 L505.0 137.7 L510.0 141.4 L515.0 145.0 L520.0 148.4 L525.0 151.7 L530.0 154.7 L535.0 157.6 L540.0 160.4 L545.0 163.0 L550.0 165.4 L555.0 167.7 L560.0 169.8 L560.0 190 Z" opacity=".55"/>
<path class="sA" d="M260.0 190 L260.0 99.3 L262.5 97.0 L265.0 94.7 L267.5 92.5 L270.0 90.2 L272.5 88.0 L275.0 85.8 L277.5 83.6 L280.0 81.4 L282.5 79.2 L285.0 77.1 L287.5 75.0 L290.0 72.9 L292.5 70.9 L295.0 68.9 L297.5 66.9 L300.0 65.0 L302.5 63.2 L305.0 61.4 L307.5 59.7 L310.0 58.0 L312.5 56.4 L315.0 54.8 L317.5 53.3 L320.0 51.9 L322.5 50.6 L325.0 49.3 L327.5 48.1 L330.0 47.0 L332.5 45.9 L335.0 45.0 L337.5 44.1 L340.0 43.4 L342.5 42.7 L345.0 42.1 L347.5 41.6 L350.0 41.1 L352.5 40.8 L355.0 40.6 L357.5 40.4 L360.0 40.4 L362.5 40.4 L365.0 40.6 L367.5 40.8 L370.0 41.1 L372.5 41.6 L375.0 42.1 L377.5 42.7 L380.0 43.4 L382.5 44.1 L385.0 45.0 L387.5 45.9 L390.0 47.0 L392.5 48.1 L395.0 49.3 L397.5 50.6 L400.0 51.9 L402.5 53.3 L405.0 54.8 L407.5 56.4 L410.0 58.0 L412.5 59.7 L415.0 61.4 L417.5 63.2 L420.0 65.0 L422.5 66.9 L425.0 68.9 L427.5 70.9 L430.0 72.9 L432.5 75.0 L435.0 77.1 L437.5 79.2 L440.0 81.4 L442.5 83.6 L445.0 85.8 L447.5 88.0 L450.0 90.2 L452.5 92.5 L455.0 94.7 L457.5 97.0 L460.0 99.3 L460.0 190 Z" opacity=".7"/>
<polyline class="sL" points="10.0,189.7 15.0,189.6 20.0,189.5 25.0,189.5 30.0,189.4 35.0,189.2 40.0,189.1 45.0,189.0 50.0,188.8 55.0,188.6 60.0,188.3 65.0,188.1 70.0,187.8 75.0,187.4 80.0,187.0 85.0,186.6 90.0,186.1 95.0,185.5 100.0,184.9 105.0,184.2 110.0,183.4 115.0,182.6 120.0,181.6 125.0,180.5 130.0,179.4 135.0,178.1 140.0,176.7 145.0,175.2 150.0,173.5 155.0,171.7 160.0,169.8 165.0,167.7 170.0,165.4 175.0,163.0 180.0,160.4 185.0,157.6 190.0,154.7 195.0,151.7 200.0,148.4 205.0,145.0 210.0,141.4 215.0,137.7 220.0,133.9 225.0,129.9 230.0,125.7 235.0,121.5 240.0,117.2 245.0,112.8 250.0,108.3 255.0,103.8 260.0,99.3 265.0,94.7 270.0,90.2 275.0,85.8 280.0,81.4 285.0,77.1 290.0,72.9 295.0,68.9 300.0,65.0 305.0,61.4 310.0,58.0 315.0,54.8 320.0,51.9 325.0,49.3 330.0,47.0 335.0,45.0 340.0,43.4 345.0,42.1 350.0,41.1 355.0,40.6 360.0,40.4 365.0,40.6 370.0,41.1 375.0,42.1 380.0,43.4 385.0,45.0 390.0,47.0 395.0,49.3 400.0,51.9 405.0,54.8 410.0,58.0 415.0,61.4 420.0,65.0 425.0,68.9 430.0,72.9 435.0,77.1 440.0,81.4 445.0,85.8 450.0,90.2 455.0,94.7 460.0,99.3 465.0,103.8 470.0,108.3 475.0,112.8 480.0,117.2 485.0,121.5 490.0,125.7 495.0,129.9 500.0,133.9 505.0,137.7 510.0,141.4 515.0,145.0 520.0,148.4 525.0,151.7 530.0,154.7 535.0,157.6 540.0,160.4 545.0,163.0 550.0,165.4 555.0,167.7 560.0,169.8 565.0,171.7 570.0,173.5 575.0,175.2 580.0,176.7 585.0,178.1 590.0,179.4 595.0,180.5 600.0,181.6 605.0,182.6 610.0,183.4 615.0,184.2 620.0,184.9 625.0,185.5 630.0,186.1 635.0,186.6 640.0,187.0 645.0,187.4 650.0,187.8 655.0,188.1 660.0,188.3 665.0,188.6 670.0,188.8 675.0,189.0 680.0,189.1 685.0,189.2 690.0,189.4 695.0,189.5 700.0,189.5 705.0,189.6 710.0,189.7"/>
<line class="sLm" x1="0" y1="190" x2="720" y2="190"/>
<line class="sLm" x1="60" y1="190" x2="60" y2="196"/>
<text class="sC" x="60" y="210" text-anchor="middle">-3σ</text>
<line class="sLm" x1="160" y1="190" x2="160" y2="196"/>
<text class="sC" x="160" y="210" text-anchor="middle">-2σ</text>
<line class="sLm" x1="260" y1="190" x2="260" y2="196"/>
<text class="sC" x="260" y="210" text-anchor="middle">-1σ</text>
<line class="sLm" x1="360" y1="190" x2="360" y2="196"/>
<text class="sC" x="360" y="210" text-anchor="middle">μ</text>
<line class="sLm" x1="460" y1="190" x2="460" y2="196"/>
<text class="sC" x="460" y="210" text-anchor="middle">+1σ</text>
<line class="sLm" x1="560" y1="190" x2="560" y2="196"/>
<text class="sC" x="560" y="210" text-anchor="middle">+2σ</text>
<line class="sLm" x1="660" y1="190" x2="660" y2="196"/>
<text class="sC" x="660" y="210" text-anchor="middle">+3σ</text>
<text class="sX" x="360" y="120" text-anchor="middle">68%</text>
<text class="sWt" x="205" y="172" text-anchor="middle">95%</text>
<text class="sWt" x="515" y="172" text-anchor="middle">95%</text>
<text class="sC" x="85" y="182" text-anchor="middle">99.7%</text>
<text class="sC" x="635" y="182" text-anchor="middle">99.7%</text>
<text class="sS" x="360" y="236" text-anchor="middle">about 68% of values lie within 1 SD of the mean, 95% within 2 (exactly 1.96), 99.7% within 3</text>
</svg><figcaption>The 68–95–99.7 rule. The 1.96 in every 95% confidence interval comes from here.</figcaption></figure>

## S6.3 Probability and Bayes 🟢 ⭐

- **Conditional probability:** P(A | B) = P(A and B) / P(B).
- **Independence:** P(A and B) = P(A) · P(B), only if knowing one tells you nothing about the other.
- **Bayes' rule:** P(A | B) = P(B | A) · P(A) / P(B).

**The classic question.** A fraud model flags 99% of fraudulent transactions and wrongly flags 2% of genuine ones. 0.5% of transactions are fraud. A transaction is flagged: how likely is it to be fraud?

Think in counts of 100,000 transactions:

| | Fraud (500) | Genuine (99,500) |
|---|---|---|
| Flagged | 495 | 1,990 |
| Not flagged | 5 | 97,510 |

P(fraud | flagged) = 495 / (495 + 1,990) ≈ **20%**. Even an accurate test produces mostly false alarms when the thing is rare. This is **base-rate neglect**, and it's why precision matters in fraud and medical models ([[DS4]]).

<figure class="dia steps"><svg viewBox="0 0 720 260" role="img" aria-label="Natural-frequency tree: of 100,000 transactions, 500 are fraud; 495 of them and 1,990 genuine ones are flagged, so only about 20% of flags are fraud">
<rect class="sB" x="260" y="10" width="200" height="44" rx="8"/><text class="sT" x="360" y="29" text-anchor="middle">100,000 transactions</text><text class="sC" x="360" y="46" text-anchor="middle">every one, flagged or not</text>
<g data-s="2"><line class="sLm" x1="320" y1="54" x2="180" y2="88"/><line class="sLm" x1="400" y1="54" x2="540" y2="88"/><rect class="sR" x="95" y="88" width="170" height="44" rx="8"/><text class="sT" x="180" y="107" text-anchor="middle">500 fraud</text><text class="sC" x="180" y="124" text-anchor="middle">0.5% base rate</text><rect class="sG" x="455" y="88" width="170" height="44" rx="8"/><text class="sT" x="540" y="107" text-anchor="middle">99,500 genuine</text><text class="sC" x="540" y="124" text-anchor="middle">99.5%</text></g>
<g data-s="3"><line class="sLm" x1="150" y1="132" x2="95" y2="170"/><line class="sLm" x1="210" y1="132" x2="255" y2="170"/><line class="sLm" x1="510" y1="132" x2="465" y2="170"/><line class="sLm" x1="570" y1="132" x2="625" y2="170"/><rect class="sW" x="20" y="170" width="150" height="44" rx="8"/><text class="sT" x="95" y="189" text-anchor="middle">495 flagged</text><text class="sC" x="95" y="206" text-anchor="middle">caught: 99%</text><rect class="sB" x="190" y="170" width="130" height="44" rx="8"/><text class="sT" x="255" y="189" text-anchor="middle">5 missed</text><text class="sC" x="255" y="206" text-anchor="middle">1%</text><rect class="sW" x="390" y="170" width="150" height="44" rx="8"/><text class="sT" x="465" y="189" text-anchor="middle">1,990 flagged</text><text class="sC" x="465" y="206" text-anchor="middle">false alarms: 2%</text><rect class="sB" x="550" y="170" width="150" height="44" rx="8"/><text class="sT" x="625" y="189" text-anchor="middle">97,510 clear</text><text class="sC" x="625" y="206" text-anchor="middle">98%</text></g>
<g data-s="4"><rect class="sN" x="14" y="164" width="162" height="56" rx="10" style="stroke:var(--accent);stroke-width:2.5"/><rect class="sN" x="384" y="164" width="162" height="56" rx="10" style="stroke:var(--accent);stroke-width:2.5"/><text class="sM" x="360" y="246" text-anchor="middle">P(fraud | flagged) = 495 / (495 + 1,990) = 495 / 2,485 ≈ 20%</text></g>
</svg><ol class="dia-steps">
<li>Start with a concrete crowd instead of percentages: 100,000 transactions.</li>
<li>Apply the base rate first: only 500 are fraud. This is the number intuition ignores.</li>
<li>Apply the model's error rates to each branch: it catches 495 of the 500 frauds, but 2% of 99,500 genuine transactions is 1,990 false alarms.</li>
<li>Now condition on what you observed, a flag: keep only the two flagged boxes. Fraud is 495 of the 2,485 flags, about 20%. That is Bayes' rule, done with counts.</li>
</ol><figcaption>Bayes' rule with natural frequencies. Rare events plus a small false-positive rate means most alarms are false.</figcaption></figure>

> [!say]
> "Bayes says the chance something is true after a positive result depends heavily on how common it was to begin with. With 0.5% fraud and a 2% false-positive rate, only about one in five flagged transactions is actually fraud, so we'd tune the threshold and add a second check."

## S6.4 Samples, the central limit theorem and standard error 🟢 ⭐

We almost never see the whole population, only a **sample**, and we estimate from it.

> [!term] Central limit theorem (CLT)
> For a large enough sample, the **mean of the sample** is approximately normally distributed around the true mean, whatever the shape of the original data (as long as its variance is finite). That's why normal-based confidence intervals and tests work on skewed data like revenue, given enough data.

> [!term] Standard error (SE)
> How much the sample mean would vary from sample to sample: SE = SD / √n. Quadrupling the sample size halves the standard error. That square root is why precise experiments need many users.

For a proportion *p* (a conversion rate), SE = √(p(1−p)/n).

<figure class="dia anim" data-rest="15"><svg viewBox="0 0 720 270" role="img" aria-label="Animation: averages of samples drawn from a skewed population pile up into a bell-shaped histogram around the true mean">
<rect class="sW" x="31" y="87.6255" width="14.875" height="132.375" rx="1"/>
<rect class="sW" x="47.875" y="116.907" width="14.875" height="103.093" rx="1"/>
<rect class="sW" x="64.75" y="139.711" width="14.875" height="80.2892" rx="1"/>
<rect class="sW" x="81.625" y="157.471" width="14.875" height="62.5293" rx="1"/>
<rect class="sW" x="98.5" y="171.302" width="14.875" height="48.6979" rx="1"/>
<rect class="sW" x="115.375" y="182.074" width="14.875" height="37.9259" rx="1"/>
<rect class="sW" x="132.25" y="190.463" width="14.875" height="29.5368" rx="1"/>
<rect class="sW" x="149.125" y="196.997" width="14.875" height="23.0032" rx="1"/>
<rect class="sW" x="166" y="202.085" width="14.875" height="17.9149" rx="1"/>
<rect class="sW" x="182.875" y="206.048" width="14.875" height="13.9522" rx="1"/>
<rect class="sW" x="199.75" y="209.134" width="14.875" height="10.866" rx="1"/>
<rect class="sW" x="216.625" y="211.538" width="14.875" height="8.46242" rx="1"/>
<rect class="sW" x="233.5" y="213.409" width="14.875" height="6.59054" rx="1"/>
<rect class="sW" x="250.375" y="214.867" width="14.875" height="5.13272" rx="1"/>
<rect class="sW" x="267.25" y="216.003" width="14.875" height="3.99736" rx="1"/>
<rect class="sW" x="284.125" y="216.887" width="14.875" height="3.11315" rx="1"/>
<line class="sLm" x1="30" y1="220" x2="306" y2="220"/>
<text class="sT" x="30" y="40">Population: right-skewed</text>
<text class="sC" x="30" y="58">(time between orders, mean 1)</text>
<text class="sC" x="30" y="240">0</text><text class="sC" x="300" y="240" text-anchor="end">4</text>
<path class="sLm" d="M312 130 C330 130 336 130 352 130" marker-end="url(#ahm)"/>
<text class="sC" x="332" y="120" text-anchor="middle">n = 30</text>
<text class="sT" x="380" y="40">Means of 80 samples of 30</text>
<text class="sC" x="380" y="58">each dot is one sample's average</text>
<circle class="sP" cx="473.3" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0187;0.0531;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0187;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0294;0.0638;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0294;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0400;0.0744;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0400;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0506;0.0850;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0506;0.9625"/></circle>
<circle class="sP" cx="420.0" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0612;0.0956;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0612;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0719;0.1063;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0719;0.9625"/></circle>
<circle class="sP" cx="606.7" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.0825;0.1169;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0825;0.9625"/></circle>
<circle class="sP" cx="606.7" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.0931;0.1275;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0931;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.1038;0.1381;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1038;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.1144;0.1487;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1144;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="198.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;198.9;198.9" keyTimes="0;0.1250;0.1594;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1250;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.1356;0.1700;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1356;0.9625"/></circle>
<circle class="sP" cx="420.0" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.1462;0.1806;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1462;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.1569;0.1912;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1569;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="198.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;198.9;198.9" keyTimes="0;0.1675;0.2019;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1675;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="198.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;198.9;198.9" keyTimes="0;0.1781;0.2125;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1781;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="191.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;191.4;191.4" keyTimes="0;0.1888;0.2231;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1888;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="191.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;191.4;191.4" keyTimes="0;0.1994;0.2338;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1994;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="198.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;198.9;198.9" keyTimes="0;0.2100;0.2444;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2100;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="183.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;183.9;183.9" keyTimes="0;0.2206;0.2550;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2206;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.2313;0.2656;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2313;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="176.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;176.4;176.4" keyTimes="0;0.2419;0.2762;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2419;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="198.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;198.9;198.9" keyTimes="0;0.2525;0.2869;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2525;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="191.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;191.4;191.4" keyTimes="0;0.2631;0.2975;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2631;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="168.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;168.8;168.8" keyTimes="0;0.2737;0.3081;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2737;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="191.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;191.4;191.4" keyTimes="0;0.2844;0.3187;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2844;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="183.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;183.9;183.9" keyTimes="0;0.2950;0.3294;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2950;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="191.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;191.4;191.4" keyTimes="0;0.3056;0.3400;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3056;0.9625"/></circle>
<circle class="sP" cx="633.3" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.3163;0.3506;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3163;0.9625"/></circle>
<circle class="sP" cx="446.7" cy="214.0" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;214.0;214.0" keyTimes="0;0.3269;0.3613;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3269;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="176.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;176.4;176.4" keyTimes="0;0.3375;0.3719;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3375;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="161.3" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;161.3;161.3" keyTimes="0;0.3481;0.3825;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3481;0.9625"/></circle>
<circle class="sP" cx="446.7" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.3588;0.3931;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3588;0.9625"/></circle>
<circle class="sP" cx="633.3" cy="206.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;206.5;206.5" keyTimes="0;0.3694;0.4037;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3694;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="168.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;168.8;168.8" keyTimes="0;0.3800;0.4144;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3800;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="183.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;183.9;183.9" keyTimes="0;0.3906;0.4250;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3906;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="176.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;176.4;176.4" keyTimes="0;0.4012;0.4356;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4012;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="168.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;168.8;168.8" keyTimes="0;0.4119;0.4462;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4119;0.9625"/></circle>
<circle class="sP" cx="606.7" cy="198.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;198.9;198.9" keyTimes="0;0.4225;0.4569;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4225;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="183.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;183.9;183.9" keyTimes="0;0.4331;0.4675;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4331;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="161.3" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;161.3;161.3" keyTimes="0;0.4438;0.4781;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4438;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="153.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;153.8;153.8" keyTimes="0;0.4544;0.4888;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4544;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="176.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;176.4;176.4" keyTimes="0;0.4650;0.4994;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4650;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="168.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;168.8;168.8" keyTimes="0;0.4756;0.5100;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4756;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="161.3" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;161.3;161.3" keyTimes="0;0.4863;0.5206;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4863;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="153.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;153.8;153.8" keyTimes="0;0.4969;0.5312;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4969;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="146.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;146.2;146.2" keyTimes="0;0.5075;0.5419;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5075;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="146.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;146.2;146.2" keyTimes="0;0.5181;0.5525;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5181;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="161.3" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;161.3;161.3" keyTimes="0;0.5288;0.5631;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5288;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="138.7" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;138.7;138.7" keyTimes="0;0.5394;0.5738;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5394;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="153.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;153.8;153.8" keyTimes="0;0.5500;0.5844;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5500;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="146.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;146.2;146.2" keyTimes="0;0.5606;0.5950;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5606;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="131.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;131.2;131.2" keyTimes="0;0.5713;0.6056;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5713;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="123.6" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;123.6;123.6" keyTimes="0;0.5819;0.6163;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5819;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="116.1" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;116.1;116.1" keyTimes="0;0.5925;0.6269;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5925;0.9625"/></circle>
<circle class="sP" cx="606.7" cy="191.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;191.4;191.4" keyTimes="0;0.6031;0.6375;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6031;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="138.7" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;138.7;138.7" keyTimes="0;0.6138;0.6481;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6138;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="108.6" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;108.6;108.6" keyTimes="0;0.6244;0.6588;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6244;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="153.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;153.8;153.8" keyTimes="0;0.6350;0.6694;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6350;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="146.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;146.2;146.2" keyTimes="0;0.6456;0.6800;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6456;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="101.1" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;101.1;101.1" keyTimes="0;0.6563;0.6906;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6563;0.9625"/></circle>
<circle class="sP" cx="606.7" cy="183.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;183.9;183.9" keyTimes="0;0.6669;0.7013;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6669;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="183.9" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;183.9;183.9" keyTimes="0;0.6775;0.7119;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6775;0.9625"/></circle>
<circle class="sP" cx="526.7" cy="93.5" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;93.5;93.5" keyTimes="0;0.6881;0.7225;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6881;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="138.7" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;138.7;138.7" keyTimes="0;0.6988;0.7331;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6988;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="138.7" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;138.7;138.7" keyTimes="0;0.7094;0.7438;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7094;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="131.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;131.2;131.2" keyTimes="0;0.7200;0.7544;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7200;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="176.4" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;176.4;176.4" keyTimes="0;0.7306;0.7650;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7306;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="131.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;131.2;131.2" keyTimes="0;0.7413;0.7756;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7413;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="123.6" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;123.6;123.6" keyTimes="0;0.7519;0.7863;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7519;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="116.1" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;116.1;116.1" keyTimes="0;0.7625;0.7969;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7625;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="108.6" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;108.6;108.6" keyTimes="0;0.7731;0.8075;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7731;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="131.2" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;131.2;131.2" keyTimes="0;0.7838;0.8181;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7838;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="123.6" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;123.6;123.6" keyTimes="0;0.7944;0.8288;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7944;0.9625"/></circle>
<circle class="sP" cx="580.0" cy="101.1" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;101.1;101.1" keyTimes="0;0.8050;0.8394;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8050;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="168.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;168.8;168.8" keyTimes="0;0.8156;0.8500;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8156;0.9625"/></circle>
<circle class="sP" cx="500.0" cy="116.1" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;116.1;116.1" keyTimes="0;0.8263;0.8606;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8263;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="161.3" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;161.3;161.3" keyTimes="0;0.8369;0.8713;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8369;0.9625"/></circle>
<circle class="sP" cx="473.3" cy="153.8" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;153.8;153.8" keyTimes="0;0.8475;0.8819;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8475;0.9625"/></circle>
<circle class="sP" cx="553.3" cy="123.6" r="4" opacity="0"><animate attributeName="cy" dur="16.0s" repeatCount="indefinite" values="70;70;123.6;123.6" keyTimes="0;0.8581;0.8925;1"/><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8581;0.9625"/></circle>
<polyline class="sLg" points="380.0,217.4 382.7,217.3 385.3,217.2 388.0,217.0 390.7,216.8 393.3,216.6 396.0,216.3 398.7,216.1 401.3,215.7 404.0,215.3 406.7,214.9 409.3,214.4 412.0,213.8 414.7,213.2 417.3,212.5 420.0,211.7 422.7,210.8 425.3,209.8 428.0,208.7 430.7,207.4 433.3,206.1 436.0,204.6 438.7,202.9 441.3,201.1 444.0,199.2 446.7,197.0 449.3,194.8 452.0,192.3 454.7,189.7 457.3,186.9 460.0,183.9 462.7,180.7 465.3,177.4 468.0,173.9 470.7,170.3 473.3,166.5 476.0,162.5 478.7,158.5 481.3,154.3 484.0,150.1 486.7,145.8 489.3,141.4 492.0,137.0 494.7,132.7 497.3,128.3 500.0,124.1 502.7,119.9 505.3,115.9 508.0,111.9 510.7,108.2 513.3,104.7 516.0,101.4 518.7,98.4 521.3,95.7 524.0,93.3 526.7,91.2 529.3,89.5 532.0,88.1 534.7,87.2 537.3,86.6 540.0,86.4 542.7,86.6 545.3,87.2 548.0,88.1 550.7,89.5 553.3,91.2 556.0,93.3 558.7,95.7 561.3,98.4 564.0,101.4 566.7,104.7 569.3,108.2 572.0,111.9 574.7,115.9 577.3,119.9 580.0,124.1 582.7,128.3 585.3,132.7 588.0,137.0 590.7,141.4 593.3,145.8 596.0,150.1 598.7,154.3 601.3,158.5 604.0,162.5 606.7,166.5 609.3,170.3 612.0,173.9 614.7,177.4 617.3,180.7 620.0,183.9 622.7,186.9 625.3,189.7 628.0,192.3 630.7,194.8 633.3,197.0 636.0,199.2 638.7,201.1 641.3,202.9 644.0,204.6 646.7,206.1 649.3,207.4 652.0,208.7 654.7,209.8 657.3,210.8 660.0,211.7 662.7,212.5 665.3,213.2 668.0,213.8 670.7,214.4 673.3,214.9 676.0,215.3 678.7,215.7 681.3,216.1 684.0,216.3 686.7,216.6 689.3,216.8 692.0,217.0 694.7,217.2 697.3,217.3 700.0,217.4" stroke-dasharray="5 4"/>
<line class="sLm" x1="380" y1="220" x2="700" y2="220"/>
<text class="sC" x="433.333" y="238" text-anchor="middle">0.6</text>
<text class="sC" x="540" y="238" text-anchor="middle">1.0</text>
<text class="sC" x="646.667" y="238" text-anchor="middle">1.4</text>
<text class="sGt" x="540" y="258" text-anchor="middle">bell-shaped around 1, spread ≈ 1/√30 ≈ 0.18</text>
</svg><figcaption>The central limit theorem, live. The population is far from normal, yet the averages of samples of 30 pile up into a bell curve (dashed) centred on the true mean, with spread SD/√n.</figcaption></figure>

## S6.5 Confidence intervals 🟢 ⭐

A 95% confidence interval for a mean is roughly **estimate ± 1.96 × SE**.

Example: 2,000 visitors, 240 conversions. p̂ = 12%. SE = √(0.12 × 0.88 / 2000) ≈ 0.73 percentage points. 95% CI ≈ 12% ± 1.4 pp = **10.6% to 13.4%**.

**What it means (precisely):** if we repeated the sampling many times and built an interval each time, about 95% of those intervals would contain the true value. **What it doesn't mean:** "there's a 95% probability the true value is in *this* interval". In the frequentist view the true value is fixed, and this interval either contains it or not. (A Bayesian **credible interval** does have that probability reading.)

<figure class="dia anim" data-rest="10"><svg viewBox="0 0 720 272" role="img" aria-label="Animation: twenty 95% confidence intervals from twenty repeated samples; nineteen cover the true rate and one misses">
<line class="sLg" x1="360.0" y1="30" x2="360.0" y2="240" stroke-dasharray="6 4"/>
<text class="sGt" x="360" y="22" text-anchor="middle">true rate 12%</text>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0364;0.9545"/><line class="sL" x1="185.1" y1="40" x2="423.4" y2="40"/><circle class="sP" cx="304.3" cy="40" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0773;0.9545"/><line class="sL" x1="246.1" y1="50" x2="491.1" y2="50"/><circle class="sP" cx="368.6" cy="50" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1182;0.9545"/><line class="sL" x1="327.5" y1="60" x2="581.0" y2="60"/><circle class="sP" cx="454.3" cy="60" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1591;0.9545"/><line class="sL" x1="250.1" y1="70" x2="495.6" y2="70"/><circle class="sP" cx="372.9" cy="70" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2000;0.9545"/><line class="sL" x1="258.3" y1="80" x2="504.6" y2="80"/><circle class="sP" cx="381.4" cy="80" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2409;0.9545"/><line class="sL" x1="246.1" y1="90" x2="491.1" y2="90"/><circle class="sP" cx="368.6" cy="90" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2818;0.9545"/><line class="sL" x1="254.2" y1="100" x2="500.1" y2="100"/><circle class="sP" cx="377.1" cy="100" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3227;0.9545"/><line class="sLr" x1="124.4" y1="110" x2="355.6" y2="110"/><circle class="sPr" cx="240.0" cy="110" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3636;0.9545"/><line class="sL" x1="168.9" y1="120" x2="405.4" y2="120"/><circle class="sP" cx="287.1" cy="120" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4045;0.9545"/><line class="sL" x1="246.1" y1="130" x2="491.1" y2="130"/><circle class="sP" cx="368.6" cy="130" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4455;0.9545"/><line class="sL" x1="282.7" y1="140" x2="531.6" y2="140"/><circle class="sP" cx="407.1" cy="140" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4864;0.9545"/><line class="sL" x1="331.6" y1="150" x2="585.5" y2="150"/><circle class="sP" cx="458.6" cy="150" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5273;0.9545"/><line class="sL" x1="156.7" y1="160" x2="391.8" y2="160"/><circle class="sP" cx="274.3" cy="160" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5682;0.9545"/><line class="sL" x1="258.3" y1="170" x2="504.6" y2="170"/><circle class="sP" cx="381.4" cy="170" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6091;0.9545"/><line class="sL" x1="181.1" y1="180" x2="418.9" y2="180"/><circle class="sP" cx="300.0" cy="180" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6500;0.9545"/><line class="sL" x1="209.5" y1="190" x2="450.5" y2="190"/><circle class="sP" cx="330.0" cy="190" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6909;0.9545"/><line class="sL" x1="319.4" y1="200" x2="572.0" y2="200"/><circle class="sP" cx="445.7" cy="200" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7318;0.9545"/><line class="sL" x1="246.1" y1="210" x2="491.1" y2="210"/><circle class="sP" cx="368.6" cy="210" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7727;0.9545"/><line class="sL" x1="152.7" y1="220" x2="387.3" y2="220"/><circle class="sP" cx="270.0" cy="220" r="3"/></g>
<g opacity="0"><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8136;0.9545"/><line class="sL" x1="168.9" y1="230" x2="405.4" y2="230"/><circle class="sP" cx="287.1" cy="230" r="3"/></g>
<line class="sLm" x1="60" y1="248" x2="660" y2="248"/>
<text class="sC" x="188.571" y="264" text-anchor="middle">10%</text>
<text class="sC" x="360" y="264" text-anchor="middle">12%</text>
<text class="sC" x="531.429" y="264" text-anchor="middle">14%</text>
<text class="sRt" x="700" y="140" text-anchor="end">red: misses</text>
<text class="sRt" x="700" y="158" text-anchor="end">the truth</text>
</svg><figcaption>What "95% confidence" means. Twenty teams each sample 2,000 visitors and build a 95% interval. In this run 19 intervals cover the true rate and one (red) misses. Any single interval either contains the truth or not; the 95% is about the method.</figcaption></figure>

> [!say]
> "Our conversion rate is 12%, and the 95% confidence interval is about 10.6 to 13.4%. In plain terms, the true rate is very plausibly in that range. If we need a narrower range, we need more traffic; four times the users would halve the width."

## S6.6 Hypothesis testing and the p-value 🟢 ⭐

1. **Null hypothesis H₀**: no difference (the new checkout converts the same as the old).
2. **Alternative H₁**: there is a difference.
3. Choose a **significance level α** before looking, usually 0.05.
4. Compute a test statistic and its **p-value**.
5. If p < α, **reject H₀**; otherwise you **fail to reject** it (which is not the same as proving no difference).

> [!term] p-value
> The probability of seeing a result **at least as extreme** as the one observed, **assuming the null hypothesis is true**. A small p-value says "this data would be surprising if there were no effect". It is **not** the probability that the null is true, and it says nothing about how big or important the effect is.

<figure class="dia"><svg viewBox="0 0 720 245" role="img" aria-label="The null distribution with the observed statistic at z = 2.1 and both tails beyond it shaded, totalling a p-value of about 0.036">
<path class="sR" d="M559.5 190 L559.5 173.5 L563.3 174.8 L567.1 176.1 L570.9 177.3 L574.7 178.4 L578.5 179.4 L582.3 180.3 L586.1 181.2 L589.9 182.0 L593.7 182.7 L597.5 183.4 L601.3 184.1 L605.1 184.6 L608.9 185.2 L612.7 185.6 L616.5 186.1 L620.3 186.5 L624.1 186.9 L627.9 187.2 L631.7 187.5 L635.5 187.8 L639.3 188.0 L643.1 188.2 L646.9 188.4 L650.7 188.6 L654.5 188.8 L658.3 188.9 L662.1 189.0 L665.9 189.2 L669.7 189.3 L673.5 189.4 L677.3 189.4 L681.1 189.5 L684.9 189.6 L688.7 189.6 L692.5 189.7 L696.3 189.7 L700.1 189.8 L703.9 189.8 L707.7 189.8 L711.5 189.8 L711.5 190 Z" opacity=".75"/>
<path class="sR" d="M8.5 190 L8.5 189.8 L12.3 189.8 L16.1 189.8 L19.9 189.8 L23.7 189.7 L27.5 189.7 L31.3 189.6 L35.1 189.6 L38.9 189.5 L42.7 189.4 L46.5 189.4 L50.3 189.3 L54.1 189.2 L57.9 189.0 L61.7 188.9 L65.5 188.8 L69.3 188.6 L73.1 188.4 L76.9 188.2 L80.7 188.0 L84.5 187.8 L88.3 187.5 L92.1 187.2 L95.9 186.9 L99.7 186.5 L103.5 186.1 L107.3 185.6 L111.1 185.2 L114.9 184.6 L118.7 184.1 L122.5 183.4 L126.3 182.7 L130.1 182.0 L133.9 181.2 L137.7 180.3 L141.5 179.4 L145.3 178.4 L149.1 177.3 L152.9 176.1 L156.7 174.8 L160.5 173.5 L160.5 190 Z" opacity=".75"/>
<polyline class="sL" points="8.5,189.8 13.5,189.8 18.5,189.8 23.6,189.7 28.6,189.7 33.6,189.6 38.6,189.5 43.6,189.4 48.7,189.3 53.7,189.2 58.7,189.0 63.7,188.8 68.8,188.6 73.8,188.4 78.8,188.1 83.8,187.8 88.8,187.5 93.9,187.0 98.9,186.6 103.9,186.0 108.9,185.4 114.0,184.8 119.0,184.0 124.0,183.2 129.0,182.2 134.0,181.2 139.1,180.0 144.1,178.7 149.1,177.3 154.1,175.7 159.1,174.0 164.2,172.1 169.2,170.1 174.2,167.9 179.2,165.5 184.2,163.0 189.3,160.2 194.3,157.3 199.3,154.2 204.3,150.9 209.4,147.4 214.4,143.8 219.4,140.0 224.4,136.0 229.4,131.8 234.5,127.5 239.5,123.1 244.5,118.5 249.5,113.9 254.6,109.2 259.6,104.4 264.6,99.6 269.6,94.9 274.6,90.1 279.7,85.4 284.7,80.7 289.7,76.2 294.7,71.9 299.7,67.7 304.8,63.7 309.8,59.9 314.8,56.4 319.8,53.2 324.9,50.3 329.9,47.7 334.9,45.5 339.9,43.7 344.9,42.3 350.0,41.2 355.0,40.6 360.0,40.4 365.0,40.6 370.0,41.2 375.1,42.3 380.1,43.7 385.1,45.5 390.1,47.7 395.2,50.3 400.2,53.2 405.2,56.4 410.2,59.9 415.2,63.7 420.3,67.7 425.3,71.9 430.3,76.2 435.3,80.7 440.3,85.4 445.4,90.1 450.4,94.9 455.4,99.6 460.4,104.4 465.4,109.2 470.5,113.9 475.5,118.5 480.5,123.1 485.5,127.5 490.6,131.8 495.6,136.0 500.6,140.0 505.6,143.8 510.6,147.4 515.7,150.9 520.7,154.2 525.7,157.3 530.7,160.2 535.8,163.0 540.8,165.5 545.8,167.9 550.8,170.1 555.8,172.1 560.9,174.0 565.9,175.7 570.9,177.3 575.9,178.7 580.9,180.0 586.0,181.2 591.0,182.2 596.0,183.2 601.0,184.0 606.0,184.8 611.1,185.4 616.1,186.0 621.1,186.6 626.1,187.0 631.2,187.5 636.2,187.8 641.2,188.1 646.2,188.4 651.2,188.6 656.3,188.8 661.3,189.0 666.3,189.2 671.3,189.3 676.4,189.4 681.4,189.5 686.4,189.6 691.4,189.7 696.4,189.7 701.5,189.8 706.5,189.8 711.5,189.8"/>
<line class="sLm" x1="0" y1="190" x2="720" y2="190"/>
<line class="sLw" x1="559.5" y1="60" x2="559.5" y2="196"/>
<text class="sWt" x="565.5" y="58">your result: z = 2.1</text>
<text class="sRt" x="635.5" y="160" text-anchor="middle">1.8%</text>
<text class="sRt" x="84.5" y="160" text-anchor="middle">1.8%</text>
<text class="sS" x="360" y="120" text-anchor="middle">what "no effect" (H₀) would produce</text>
<text class="sS" x="360" y="138" text-anchor="middle">sample after sample</text>
<text class="sC" x="360" y="208" text-anchor="middle">0</text>
<text class="sS" x="360" y="232" text-anchor="middle">two-sided p-value = shaded area ≈ 0.036: results this extreme are rare if H₀ is true</text>
</svg><figcaption>A p-value is an area under the null distribution: the share of "no effect" worlds that would produce data at least as extreme as yours.</figcaption></figure>

| | H₀ actually true | H₀ actually false |
|---|---|---|
| **Reject H₀** | **Type I error** (false positive), probability α | Correct: probability = **power** (1 − β) |
| **Fail to reject** | Correct | **Type II error** (false negative), probability β |

> [!mistake] Three classic misreadings
> - "p = 0.03 means a 3% chance the result is due to luck." No: it's the probability of data this extreme *if* there were no effect.
> - "p = 0.20, so there's no effect." No: the test may just lack power. Look at the confidence interval.
> - "p = 0.0001, so it's a huge effect." No: with millions of users, tiny effects become significant. Report the **effect size** with its CI.

> [!say]
> "The p-value is how surprising our data would be if there were really no difference. Below 5% we treat the difference as real. But I always report the effect size and its confidence interval too, because a statistically significant difference can be too small to matter for the business."

## S6.7 Which test? 🟢 🟡

| Question | Data | Test |
|---|---|---|
| Do two groups' means differ? | Continuous, independent groups | **Welch's t-test** (doesn't assume equal variances; a safe default) |
| Same users before and after? | Continuous, paired | Paired t-test |
| Do two conversion rates differ? | Proportions, large n | Two-proportion **z-test** (or chi-square, equivalent for 2×2) |
| Are two categorical variables related? | Counts in a table | **Chi-square test of independence** (Fisher's exact test for small counts) |
| Do 3+ groups' means differ? | Continuous | **ANOVA** (then post-hoc tests for which pairs) |
| Two groups, heavy skew or outliers, ordinal data | Not normal | **Mann–Whitney U** (rank-based) |
| Is there a linear relationship? | Two continuous variables | Pearson correlation; **Spearman** for monotonic or ranked |

```python
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

# Welch's t-test on order values
t, p = stats.ttest_ind(new_checkout_values, old_checkout_values, equal_var=False)

# Conversion: 260/2000 vs 240/2000
z, p = proportions_ztest(count=[260, 240], nobs=[2000, 2000])

# Chi-square: plan type vs churned
chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
```

<figure class="dia"><svg viewBox="0 0 720 284" role="img" aria-label="Decision tree for choosing a statistical test: a continuous metric leads to ANOVA for three or more groups, a paired t-test for before and after, Welch's t-test for two independent groups and Mann-Whitney U for skewed or ordinal data; a rate leads to a two-proportion z-test; two categorical variables to a chi-square test; two numeric variables to Pearson or Spearman correlation. The conversion example 260 of 2000 against 240 of 2000 gives z of about 0.96 and p of about 0.34">
<rect class="sA" x="260" y="12" width="200" height="36" rx="8"/><text class="sT" x="360" y="35" text-anchor="middle">what are you comparing?</text>
<line class="sLm" x1="360" y1="48" x2="209" y2="82" marker-end="url(#ahm)"/><rect class="sB" x="14" y="84" width="390" height="42" rx="8"/><text class="sT" x="209" y="103" text-anchor="middle">a continuous metric</text><text class="sS" x="209" y="119" text-anchor="middle">order value, latency</text>
<line class="sLm" x1="360" y1="48" x2="456.5" y2="82" marker-end="url(#ahm)"/><rect class="sG" x="410" y="84" width="93" height="42" rx="8"/><text class="sT" x="456.5" y="103" text-anchor="middle">a rate</text><text class="sS" x="456.5" y="119" text-anchor="middle">converted?</text>
<line class="sLm" x1="360" y1="48" x2="555.5" y2="82" marker-end="url(#ahm)"/><rect class="sV" x="509" y="84" width="93" height="42" rx="8"/><text class="sT" x="555.5" y="103" text-anchor="middle">two categories</text><text class="sS" x="555.5" y="119" text-anchor="middle">plan × churned</text>
<line class="sLm" x1="360" y1="48" x2="654.5" y2="82" marker-end="url(#ahm)"/><rect class="sW" x="608" y="84" width="93" height="42" rx="8"/><text class="sT" x="654.5" y="103" text-anchor="middle">two numbers</text><text class="sS" x="654.5" y="119" text-anchor="middle">related?</text>
<line class="sLm" x1="209" y1="126" x2="60.5" y2="202" marker-end="url(#ahm)"/>
<text class="sS" x="60.5" y="196" text-anchor="middle">3+ groups</text>
<rect class="sB" x="14" y="204" width="93" height="44" rx="8"/><text class="sT" x="60.5" y="223" text-anchor="middle">ANOVA</text><text class="sS" x="60.5" y="240" text-anchor="middle">then post-hoc</text>
<line class="sLm" x1="209" y1="126" x2="159.5" y2="202" marker-end="url(#ahm)"/>
<text class="sS" x="159.5" y="170" text-anchor="middle">2, paired</text>
<rect class="sB" x="113" y="204" width="93" height="44" rx="8"/><text class="sT" x="159.5" y="223" text-anchor="middle">paired t-test</text><text class="sS" x="159.5" y="240" text-anchor="middle">before vs after</text>
<line class="sLm" x1="209" y1="126" x2="258.5" y2="202" marker-end="url(#ahm)"/>
<text class="sS" x="258.5" y="170" text-anchor="middle">2, independent</text>
<rect class="sB" x="212" y="204" width="93" height="44" rx="8"/><text class="sT" x="258.5" y="223" text-anchor="middle">Welch's t-test</text><text class="sS" x="258.5" y="240" text-anchor="middle">safe default</text>
<line class="sLm" x1="209" y1="126" x2="357.5" y2="202" marker-end="url(#ahm)"/>
<text class="sS" x="357.5" y="196" text-anchor="middle">skewed, ordinal</text>
<rect class="sB" x="311" y="204" width="93" height="44" rx="8"/><text class="sT" x="357.5" y="223" text-anchor="middle">Mann–Whitney</text><text class="sS" x="357.5" y="240" text-anchor="middle">U test, ranks</text>
<line class="sLm" x1="456.5" y1="126" x2="456.5" y2="202" marker-end="url(#ahm)"/>
<rect class="sG" x="410" y="204" width="93" height="44" rx="8"/><text class="sT" x="456.5" y="223" text-anchor="middle">z-test</text><text class="sS" x="456.5" y="240" text-anchor="middle">two proportions</text>
<line class="sLm" x1="555.5" y1="126" x2="555.5" y2="202" marker-end="url(#ahm)"/>
<rect class="sV" x="509" y="204" width="93" height="44" rx="8"/><text class="sT" x="555.5" y="223" text-anchor="middle">chi-square</text><text class="sS" x="555.5" y="240" text-anchor="middle">Fisher if small</text>
<line class="sLm" x1="654.5" y1="126" x2="654.5" y2="202" marker-end="url(#ahm)"/>
<rect class="sW" x="608" y="204" width="93" height="44" rx="8"/><text class="sT" x="654.5" y="223" text-anchor="middle">Pearson r</text><text class="sS" x="654.5" y="240" text-anchor="middle">Spearman: ranks</text>
<text class="sGt" x="360" y="272" text-anchor="middle">260/2000 vs 240/2000 conversions: z = 0.96, p = 0.34, so no evidence of a difference yet</text>
</svg><figcaption>The table above as a decision tree, with the conversion example from the code computed (SciPy).</figcaption></figure>

> [!story]
> Your road-accident capstone used **chi-square** tests between categorical features and severity, **ANOVA** for numeric features across severity classes, and **VIF** for multicollinearity. That's the answer to "have you used statistical tests on real data?". Say which test, on which variables, and what you did with the result.

## S6.8 Correlation, causation and paradoxes 🟢 ⭐

**Correlation does not imply causation.** Ice-cream sales and drownings both rise in summer; the **confounder** is temperature. In business data, confounders are everywhere: heavy users both see more features *and* churn less.

Ways to get closer to causation: a **randomised experiment** (A/B test) is the gold standard; otherwise quasi-experimental methods ([[DS5]]).

> [!term] Simpson's paradox
> A trend that appears in every subgroup reverses when the groups are combined, because the groups have different sizes or mixes. Example: a new support process resolves more tickets in time for both "simple" and "complex" tickets, yet looks worse overall, because it was given a much higher share of complex tickets. Always ask how the mix differs between groups.

A real example, from a 1986 study of kidney-stone treatments (success rates):

| | Small stones | Large stones | All patients |
|---|---|---|---|
| Treatment A | **93%** (81 / 87) | **73%** (192 / 263) | 78% (273 / 350) |
| Treatment B | 87% (234 / 270) | 69% (55 / 80) | **83%** (289 / 350) |

A wins in both groups yet loses overall, because doctors gave A mostly the hard cases (263 of its 350 patients had large stones). Stone size is the confounder: it drives both the choice of treatment and the outcome.

<figure class="dia steps"><svg viewBox="0 0 720 270" role="img" aria-label="Simpson's paradox in the kidney-stone data: treatment A beats B for small stones, 93 to 87 percent, and for large stones, 73 to 69 percent, but A treated 263 large-stone patients and B only 80, so A's overall rate is pulled down to 78 percent while B's is 83 percent">
<line class="sLm" x1="120" y1="230" x2="640" y2="230"/>
<text class="sS" x="120" y="246" text-anchor="middle">60%</text><line class="sLm" x1="120" y1="40" x2="120" y2="230" opacity=".12"/>
<text class="sS" x="250" y="246" text-anchor="middle">70%</text><line class="sLm" x1="250" y1="40" x2="250" y2="230" opacity=".12"/>
<text class="sS" x="380" y="246" text-anchor="middle">80%</text><line class="sLm" x1="380" y1="40" x2="380" y2="230" opacity=".12"/>
<text class="sS" x="510" y="246" text-anchor="middle">90%</text><line class="sLm" x1="510" y1="40" x2="510" y2="230" opacity=".12"/>
<text class="sS" x="640" y="246" text-anchor="middle">100%</text><line class="sLm" x1="640" y1="40" x2="640" y2="230" opacity=".12"/>
<text class="sS" x="380" y="262" text-anchor="middle">success rate (dot area ∝ number of patients)</text>
<text class="sT" x="60" y="85" text-anchor="middle">treatment A</text>
<text class="sT" x="60" y="175" text-anchor="middle">treatment B</text>
<g data-s="1"><circle class="sPg" cx="550.3" cy="80" r="10.3" opacity=".55"/><text class="sS" x="550.345" y="63.7399" text-anchor="middle">small 93% (n=87)</text><circle class="sPg" cx="466.7" cy="170" r="18.1" opacity=".55"/><text class="sS" x="466.667" y="145.925" text-anchor="middle">small 87% (n=270)</text></g>
<g data-s="2"><circle class="sPw" cx="289.0" cy="80" r="17.8" opacity=".55"/><text class="sS" x="289.049" y="56.161" text-anchor="middle">large 73% (n=263)</text><circle class="sPw" cx="233.8" cy="170" r="9.8" opacity=".55"/><text class="sS" x="233.75" y="154.161" text-anchor="middle">large 69% (n=80)</text></g>
<g data-s="3"><line class="sLr" x1="354" y1="50" x2="354" y2="110" style="stroke-width:3"/><text class="sRt" x="354" y="126" text-anchor="middle">overall 78%</text><line class="sLg" x1="413.429" y1="140" x2="413.429" y2="200" style="stroke-width:3"/><text class="sGt" x="413.429" y="216" text-anchor="middle">overall 83%</text></g>
</svg><ol class="dia-steps">
<li>Small stones: A succeeds 93% of the time, B 87%. A is better.</li>
<li>Large stones: A 73%, B 69%. A is better again. But look at the dot sizes: A treated mostly large stones, B mostly small ones.</li>
<li>Each overall rate is a weighted average of its two dots, pulled towards the bigger one. A is dragged down by its many hard cases: 78% against 83%.</li>
</ol><figcaption>Simpson's paradox as weighted averages: the overall rate sits between each treatment's two subgroup dots, closer to the bigger one.</figcaption></figure>

> [!term] Survivorship bias
> Drawing conclusions only from what "survived". Analysing only customers still active today hides why the others left.

## S6.9 A/B testing from start to finish 🟢 🟡 ⭐

<figure class="dia"><svg viewBox="0 0 720 120" role="img" aria-label="A/B testing steps: hypothesis, metrics, sample size, randomise, run, check, analyse, decide">
<g class="sT" text-anchor="middle">
<rect class="sA" x="10" y="30" width="80" height="54" rx="8"/><text x="50" y="62">Hypothesis</text>
<rect class="sA" x="100" y="30" width="80" height="54" rx="8"/><text x="140" y="62">Metrics</text>
<rect class="sA" x="190" y="30" width="80" height="54" rx="8"/><text x="230" y="55">Sample</text><text x="230" y="72">size</text>
<rect class="sB" x="280" y="30" width="80" height="54" rx="8"/><text x="320" y="62">Randomise</text>
<rect class="sB" x="370" y="30" width="80" height="54" rx="8"/><text x="410" y="55">Run full</text><text x="410" y="72">weeks</text>
<rect class="sW" x="460" y="30" width="80" height="54" rx="8"/><text x="500" y="55">Sanity</text><text x="500" y="72">checks</text>
<rect class="sG" x="550" y="30" width="80" height="54" rx="8"/><text x="590" y="62">Analyse</text>
<rect class="sG" x="640" y="30" width="70" height="54" rx="8"/><text x="675" y="62">Decide</text>
</g>
<text class="sS" x="10" y="110">Everything left of "Randomise" is decided before any data is collected.</text>
</svg><figcaption>The steps of a trustworthy experiment. The left half is planned before launch; peeking and changing plans midway is the most common way experiments go wrong.</figcaption></figure>

**1. Hypothesis.** "Showing delivery fees on the product page (instead of at checkout) will **increase completed orders**, because fewer people abandon at the surprise."

**2. Metrics.**
- **Primary metric**: the one that decides the outcome (orders per visitor).
- **Guardrail metrics**: things that must not get worse (revenue per visitor, page load time, refund rate).
- **Secondary or diagnostic metrics**: help explain *why* (add-to-cart rate, checkout abandonment).

**3. Randomisation unit.** Usually the **user** (so one person always sees the same version), not the page view. Assignment must be random and sticky.

**4. Sample size and duration.** Decide the **minimum detectable effect (MDE)**, the smallest lift worth detecting, then compute the users needed. A good approximation for α = 0.05 (two-sided) and 80% power:

<p class="formula"><b>n per group ≈ 16 · σ² / δ²</b> &nbsp;where σ² is the metric's variance and δ the minimum detectable effect</p>

For a conversion rate, σ² = p(1−p). With a baseline of 10% and an MDE of 1 percentage point: 16 × 0.09 / 0.01² = **14,400 users per group**. Halving the MDE quadruples the sample. Then:

<figure class="dia"><svg viewBox="0 0 720 258" role="img" aria-label="Null and alternative distributions with the rejection threshold, showing alpha, beta and power as areas">
<path class="sG" d="M336.2 200 L336.2 94.9 L342.8 88.9 L349.3 83.1 L355.9 77.6 L362.4 72.4 L369.0 67.6 L375.5 63.4 L382.1 59.6 L388.6 56.5 L395.2 53.9 L401.8 52.1 L408.3 50.9 L414.9 50.4 L421.4 50.6 L428.0 51.6 L434.5 53.2 L441.1 55.5 L447.6 58.5 L454.2 62.0 L460.7 66.1 L467.3 70.7 L473.9 75.7 L480.4 81.1 L487.0 86.8 L493.5 92.8 L500.1 98.9 L506.6 105.1 L513.2 111.3 L519.7 117.6 L526.3 123.7 L532.8 129.8 L539.4 135.7 L546.0 141.3 L552.5 146.7 L559.1 151.9 L565.6 156.7 L572.2 161.3 L578.7 165.5 L585.3 169.4 L591.8 173.0 L598.4 176.3 L605.0 179.3 L611.5 182.0 L618.1 184.4 L624.6 186.6 L631.2 188.5 L637.7 190.2 L644.3 191.7 L650.8 193.0 L657.4 194.1 L664.0 195.0 L670.5 195.9 L677.1 196.6 L683.6 197.2 L690.2 197.7 L696.7 198.1 L703.3 198.5 L709.8 198.7 L716.4 199.0 L722.9 199.2 L729.5 199.4 L729.5 200 Z" opacity=".65"/>
<path class="sW" d="M93.0 200 L93.0 199.5 L97.1 199.5 L101.1 199.4 L105.2 199.3 L109.2 199.2 L113.3 199.1 L117.3 198.9 L121.4 198.8 L125.4 198.6 L129.5 198.4 L133.5 198.2 L137.6 198.0 L141.6 197.7 L145.7 197.4 L149.7 197.1 L153.8 196.7 L157.9 196.3 L161.9 195.8 L166.0 195.3 L170.0 194.8 L174.1 194.2 L178.1 193.5 L182.2 192.8 L186.2 192.0 L190.3 191.1 L194.3 190.2 L198.4 189.1 L202.4 188.0 L206.5 186.9 L210.5 185.6 L214.6 184.2 L218.7 182.7 L222.7 181.1 L226.8 179.4 L230.8 177.6 L234.9 175.7 L238.9 173.7 L243.0 171.5 L247.0 169.2 L251.1 166.8 L255.1 164.3 L259.2 161.7 L263.2 158.9 L267.3 156.1 L271.3 153.1 L275.4 150.0 L279.5 146.7 L283.5 143.4 L287.6 140.0 L291.6 136.5 L295.7 132.9 L299.7 129.3 L303.8 125.5 L307.8 121.8 L311.9 117.9 L315.9 114.1 L320.0 110.2 L324.0 106.4 L328.1 102.5 L332.1 98.7 L336.2 94.9 L336.2 200 Z" opacity=".65"/>
<path class="sR" d="M336.2 200 L336.2 178.1 L341.0 180.2 L345.9 182.1 L350.7 184.0 L355.6 185.6 L360.4 187.1 L365.3 188.5 L370.1 189.8 L375.0 190.9 L379.8 192.0 L384.6 192.9 L389.5 193.8 L394.3 194.5 L399.2 195.2 L404.0 195.8 L408.9 196.3 L413.7 196.8 L418.6 197.2 L423.4 197.6 L428.3 197.9 L433.1 198.2 L437.9 198.5 L442.8 198.7 L447.6 198.9 L452.5 199.1 L457.3 199.2 L462.2 199.3 L467.0 199.4 L471.9 199.5 L476.7 199.6 L481.6 199.7 L486.4 199.7 L491.2 199.8 L496.1 199.8 L500.9 199.8 L505.8 199.9 L510.6 199.9 L515.5 199.9 L520.3 199.9 L525.2 199.9 L530.0 199.9 L530.0 200 Z" opacity=".85"/>
<polyline class="sL" points="2.8,155.0 7.1,151.7 11.5,148.3 15.9,144.7 20.3,141.1 24.7,137.3 29.1,133.4 33.5,129.5 37.9,125.4 42.3,121.3 46.7,117.2 51.1,113.0 55.5,108.8 59.9,104.6 64.3,100.4 68.7,96.3 73.0,92.2 77.4,88.2 81.8,84.3 86.2,80.6 90.6,76.9 95.0,73.5 99.4,70.2 103.8,67.1 108.2,64.2 112.6,61.6 117.0,59.2 121.4,57.0 125.8,55.2 130.2,53.6 134.6,52.4 139.0,51.4 143.3,50.8 147.7,50.4 152.1,50.4 156.5,50.7 160.9,51.4 165.3,52.3 169.7,53.6 174.1,55.1 178.5,57.0 182.9,59.1 187.3,61.5 191.7,64.1 196.1,67.0 200.5,70.1 204.9,73.4 209.3,76.8 213.6,80.5 218.0,84.2 222.4,88.1 226.8,92.1 231.2,96.2 235.6,100.3 240.0,104.5 244.4,108.7 248.8,112.9 253.2,117.1 257.6,121.2 262.0,125.3 266.4,129.4 270.8,133.3 275.2,137.2 279.6,141.0 283.9,144.6 288.3,148.2 292.7,151.6 297.1,154.9 301.5,158.1 305.9,161.1 310.3,164.0 314.7,166.7 319.1,169.3 323.5,171.8 327.9,174.1 332.3,176.3 336.7,178.3 341.1,180.2 345.5,182.0 349.9,183.6 354.2,185.2 358.6,186.6 363.0,187.9 367.4,189.1 371.8,190.2 376.2,191.2 380.6,192.1 385.0,193.0 389.4,193.7 393.8,194.4 398.2,195.1 402.6,195.6 407.0,196.1 411.4,196.6 415.8,197.0 420.2,197.4 424.5,197.7 428.9,198.0 433.3,198.2 437.7,198.5 442.1,198.7 446.5,198.9 450.9,199.0 455.3,199.1 459.7,199.3 464.1,199.4 468.5,199.5 472.9,199.5 477.3,199.6 481.7,199.7 486.1,199.7 490.5,199.8 494.9,199.8 499.2,199.8 503.6,199.9 508.0,199.9 512.4,199.9 516.8,199.9 521.2,199.9 525.6,199.9 530.0,199.9"/>
<polyline class="sLg" points="93.0,199.5 97.5,199.5 102.1,199.4 106.6,199.3 111.2,199.1 115.7,199.0 120.3,198.8 124.8,198.6 129.4,198.4 133.9,198.2 138.5,197.9 143.0,197.6 147.6,197.2 152.1,196.8 156.7,196.4 161.2,195.9 165.7,195.3 170.3,194.7 174.8,194.0 179.4,193.3 183.9,192.4 188.5,191.5 193.0,190.5 197.6,189.4 202.1,188.1 206.7,186.8 211.2,185.4 215.8,183.8 220.3,182.1 224.8,180.2 229.4,178.3 233.9,176.2 238.5,173.9 243.0,171.5 247.6,168.9 252.1,166.2 256.7,163.3 261.2,160.3 265.8,157.2 270.3,153.8 274.9,150.4 279.4,146.8 283.9,143.1 288.5,139.2 293.0,135.3 297.6,131.2 302.1,127.1 306.7,122.8 311.2,118.6 315.8,114.2 320.3,109.9 324.9,105.6 329.4,101.2 334.0,97.0 338.5,92.7 343.1,88.6 347.6,84.6 352.1,80.6 356.7,76.9 361.2,73.3 365.8,69.9 370.3,66.7 374.9,63.8 379.4,61.1 384.0,58.7 388.5,56.5 393.1,54.7 397.6,53.2 402.2,52.0 406.7,51.1 411.2,50.6 415.8,50.4 420.3,50.6 424.9,51.1 429.4,51.9 434.0,53.1 438.5,54.5 443.1,56.4 447.6,58.5 452.2,60.9 456.7,63.5 461.3,66.4 465.8,69.6 470.4,73.0 474.9,76.6 479.4,80.3 484.0,84.2 488.5,88.2 493.1,92.4 497.6,96.6 502.2,100.9 506.7,105.2 511.3,109.5 515.8,113.9 520.4,118.2 524.9,122.5 529.5,126.7 534.0,130.8 538.5,134.9 543.1,138.9 547.6,142.7 552.2,146.5 556.7,150.1 561.3,153.5 565.8,156.9 570.4,160.0 574.9,163.1 579.5,166.0 584.0,168.7 588.6,171.3 593.1,173.7 597.7,176.0 602.2,178.1 606.7,180.1 611.3,181.9 615.8,183.6 620.4,185.2 624.9,186.7 629.5,188.0 634.0,189.3 638.6,190.4 643.1,191.4 647.7,192.4 652.2,193.2 656.8,194.0 661.3,194.7 665.9,195.3 670.4,195.9 674.9,196.4 679.5,196.8 684.0,197.2 688.6,197.6 693.1,197.9 697.7,198.2 702.2,198.4 706.8,198.6 711.3,198.8 715.9,199.0 720.4,199.1 725.0,199.2 729.5,199.4"/>
<line class="sLm" x1="0" y1="200" x2="720" y2="200"/>
<line class="sLm" x1="336.2" y1="40" x2="336.2" y2="206" stroke-dasharray="5 4"/>
<text class="sC" x="336.2" y="34" text-anchor="middle">reject H₀ to the right</text>
<text class="sT" x="150" y="64" text-anchor="middle">H₀: no effect</text>
<text class="sT" x="416" y="64" text-anchor="middle">H₁: true effect δ</text>
<text class="sGt" x="473" y="150" text-anchor="middle">power 80%</text>
<text class="sWt" x="264" y="150" text-anchor="middle">β = 20%</text>
<text class="sRt" x="330.2" y="222" text-anchor="end">α/2 = 2.5% (red) ▸</text>
<text class="sC" x="150" y="222" text-anchor="middle">0</text><text class="sC" x="416" y="222" text-anchor="middle">δ</text>
<text class="sS" x="360" y="246" text-anchor="middle">to get 80% power at α = 0.05, δ must sit (1.96 + 0.84) = 2.8 standard errors from zero</text>
</svg><figcaption>α, β and power as areas. Two groups need 2 × 2.8² ≈ 16 times σ²/δ² users each: that is where the "16σ²/δ²" rule comes from. A smaller δ moves the green curve left, and only more users (a narrower curve) win back the power.</figcaption></figure>

- run for **whole weeks** (at least one, usually two), because behaviour differs between days, and Egyptian traffic patterns around Friday and the weekend can differ sharply from weekdays;
- don't run over unusual periods (Ramadan, Black Friday or White Friday sales, exam season) unless that's what you're testing.

```python
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize
effect = proportion_effectsize(0.11, 0.10)          # Cohen's h for 10% → 11%
n = NormalIndPower().solve_power(effect, alpha=0.05, power=0.8, alternative="two-sided")
print(round(n))                                     # ≈ 14,700 per group
```

(The library's answer is slightly higher than the rule of thumb because it uses the exact variance; both are fine to quote.)

**5. Sanity checks before reading results.**
- **Sample ratio mismatch (SRM):** a 50/50 split that came out 50.8/49.2 on 200,000 users is a chi-square red flag. Something in assignment or logging is broken, and the results can't be trusted.
- Invariant metrics (the share of mobile users, for example) should match between groups.

**6. Analyse:** the effect, its confidence interval and its p-value for the primary metric; then the guardrails; then the segments you **planned** to look at.

**7. Decide:** ship, don't ship, or iterate. Write down the decision and why.

### The pitfalls interviewers probe

| Pitfall | What goes wrong | Fix |
|---|---|---|
| **Peeking** | Checking daily and stopping the first time p < 0.05 inflates false positives well above 5% | Fix the sample size in advance, or use a sequential testing method designed for continuous monitoring |
| **Multiple comparisons** | Test 20 metrics or segments and one will be "significant" by chance | Pre-register the primary metric; correct with Bonferroni (α/k) or control the false discovery rate (Benjamini–Hochberg) |
| **Novelty / primacy effects** | Users click something new because it's new, or resist change at first | Run longer; look at the effect over time and for new vs returning users |
| **Network effects / interference** | Treated users affect control users (a marketplace, a referral feature) | Randomise by cluster: region, city or time |
| **Underpowered test** | "No significant difference" from too few users | Size the test first; report the CI, which shows what effects are still plausible |
| **Wrong unit of analysis** | Randomise by user but analyse per page view, so the observations aren't independent | Analyse at the randomisation unit, or use corrected (delta-method) variance |

> [!say]
> "Before launching I'd fix one primary metric and some guardrails, pick the user as the randomisation unit, and compute the sample size from the smallest lift worth detecting. I'd run whole weeks, check for sample ratio mismatch first, and not stop early just because it looks significant. Then I'd report the lift with its confidence interval, not just the p-value."

> [!sota] Variance reduction
> Large experimentation teams use **CUPED** (controlled-experiment using pre-experiment data), which adjusts each user's metric by their pre-experiment behaviour. It cuts variance and therefore the required sample size substantially. Knowing the name and the idea is a strong mid-level signal; it's covered in [[DS5]].

## S6.10 "Significant but tiny. Do we ship?" 🟡 ⭐

Statistical significance answers "is it real?"; **practical significance** answers "does it matter?". Weigh the effect and its CI against the cost: engineering maintenance, the risk to guardrails, and whether the CI's *lower* bound still beats the cost. A 0.1% lift on a checkout for millions of users can be worth a lot; the same lift on an internal tool is noise.

## S6.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Mean or median for salaries? | Median, because salaries are right-skewed and the mean is pulled up by a few large values. |
| What does standard deviation measure? | The typical distance of values from the mean, in the data's units. |
| What is a p-value? | The probability of results at least this extreme if there were truly no effect. It's not the probability the null is true. |
| What's a 95% confidence interval? | A range built so that, over many repeated samples, 95% of such ranges contain the true value; practically, the plausible range for the effect. |
| Type I vs Type II error? | Type I: a false positive (finding an effect that isn't there). Type II: a false negative (missing a real one). |
| What is statistical power? | The probability of detecting an effect of a given size if it exists; usually targeted at 80%. |
| State the central limit theorem. | Sample means are approximately normal for large samples, whatever the data's shape, which justifies normal-based tests and intervals. |
| How do you choose the sample size for an A/B test? | From the baseline rate, the minimum detectable effect, α and power; roughly 16σ²/δ² per group. |
| Why not stop a test as soon as it's significant? | Repeated peeking inflates the false-positive rate; fix the duration in advance or use sequential methods. |
| What's sample ratio mismatch? | The observed split differs from the planned split more than chance allows, signalling a bug in assignment or logging. |
| Correlation vs causation? | Correlation can come from confounders or chance; causation needs an experiment or a careful causal design. |
| What's Simpson's paradox? | A trend in every subgroup reverses when combined, because the group mix differs. |
| Which test for two conversion rates? | A two-proportion z-test, or chi-square on the 2×2 table. |
| What's a guardrail metric? | A metric that must not get worse, such as revenue, latency or refunds, even if the primary metric improves. |
| The model flags 2% of genuine transactions and fraud is rare. Why are most flags false? | Base rates: false positives from the huge genuine group outnumber true positives from the tiny fraud group. |

## Key takeaways

> [!check]
> - Skewed data: report medians and percentiles alongside means.
> - A p-value is about data given the null, not the null given the data. Always add the effect size and CI.
> - Standard error shrinks with √n: precision is expensive.
> - Plan experiments before launch: one primary metric, guardrails, sample size, whole weeks, no peeking.
> - Check for sample ratio mismatch before trusting any result.

## Sources

- David Diez, Mine Çetinkaya-Rundel and Christopher Barr, [*OpenIntro Statistics*, 4th ed.](https://www.openintro.org/book/os/) (free).
- Ron Kohavi, Diane Tang and Ya Xu, *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* (Cambridge University Press, 2020): SRM, peeking, guardrails, CUPED.
- Alex Deng et al., "Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data" (WSDM 2013), the CUPED paper.
- American Statistical Association, [Statement on p-values (2016)](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf).

- C. R. Charig et al., "Comparison of treatment of renal calculi by open surgery, percutaneous nephrolithotomy, and extracorporeal shockwave lithotripsy", *BMJ* 292 (1986): 879–882, the kidney-stone data in the Simpson's paradox example.
- Gerald van Belle, *Statistical Rules of Thumb*, 2nd ed. (Wiley, 2008), the source of the 16σ²/δ² sample-size rule.
- SciPy: [scipy.stats](https://docs.scipy.org/doc/scipy/reference/stats.html); statsmodels: [power and proportion tests](https://www.statsmodels.org/stable/stats.html).
- Your *AI Journey* Part 15 (Statistics, probability and A/B testing) for derivations and puzzles.
