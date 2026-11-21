# Data Scientist — interview prep

*Short answers to the questions data science interviews ask most.*

## Statistics

### Explain a p-value to a product manager.

If the change did nothing, how often would we see a difference at least this big by chance; a small p-value says chance alone is an unlikely explanation, not that the effect is large ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).

### What are type I and type II errors?

A type I error is a false positive (rejecting a true null); a type II error is a false negative; power is one minus the type II error rate ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).

### Why not stop an A/B test as soon as it is significant?

Repeated looks inflate the false-positive rate well beyond the nominal level; fix the sample size in advance or use a sequential method ([Johari et al.: Peeking at A/B tests](https://arxiv.org/abs/1512.04922)).

## Modelling

### What is data leakage? Give an example.

Information that would not be available at prediction time reaching training, such as scaling on the full dataset before splitting or a feature computed after the outcome; prevent it with pipelines fitted inside each fold ([scikit-learn: Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)).

### Bias–variance trade-off?

Simple models underfit (high bias), very flexible ones overfit (high variance); compare training and validation scores to tell which you have ([scikit-learn: Validation curves](https://scikit-learn.org/stable/modules/learning_curve.html)).

### Random forest or gradient boosting?

A random forest averages deep trees built independently and is robust with little tuning; gradient boosting builds shallow trees in sequence and is usually more accurate when tuned ([scikit-learn: Ensembles](https://scikit-learn.org/stable/modules/ensemble.html)).

### How do you handle class imbalance?

Evaluate with precision, recall and the PR curve, use class weights or a tuned threshold, and only then consider resampling inside the training folds ([Saito & Rehmsmeier, 2015](https://doi.org/10.1371/journal.pone.0118432), [scikit-learn: Tuning the decision threshold](https://scikit-learn.org/stable/modules/classification_threshold.html)).

### L1 or L2 regularisation?

L2 (ridge) shrinks all coefficients smoothly; L1 (lasso) can set some exactly to zero, performing feature selection ([scikit-learn: Lasso](https://scikit-learn.org/stable/modules/linear_model.html#lasso)).

## Evaluation

### Which metric would you use for fraud detection?

Precision and recall at the operating threshold and average precision, not accuracy, because fraud is rare ([scikit-learn: Precision, recall and F-measures](https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-f-measure-metrics), [Saito & Rehmsmeier, 2015](https://doi.org/10.1371/journal.pone.0118432)).

### How do you validate a forecasting model?

With time series cross-validation on a rolling origin, compared against naive and seasonal naive benchmarks ([Hyndman & Athanasopoulos: Time series cross-validation](https://otexts.com/fpp3/toolbox.html#sec-tscv), [Simple forecasting methods](https://otexts.com/fpp3/toolbox.html#sec-simple-methods)).

### How do you explain a single prediction?

With SHAP values, which split the prediction minus the baseline into contributions from each feature ([Lundberg & Lee, 2017](https://arxiv.org/abs/1705.07874)).

## Causal questions

### Sales rose after the campaign. Did the campaign cause it?

Not necessarily; without a counterfactual we cannot tell. Use a randomised holdout, or a quasi-experiment such as difference-in-differences against comparable regions ([Holland, 1986](https://doi.org/10.1080/01621459.1986.10478354), [Card & Krueger, 1994](https://www.nber.org/papers/w4509)).

### How can you make an A/B test need fewer users?

Reduce variance, for example with CUPED, which adjusts the metric using each user's pre-experiment behaviour ([Deng et al., 2013](https://doi.org/10.1145/2433396.2433413)).

## Production

### Your model's accuracy dropped in production. What do you check?

Data first: input distributions and pipelines (training–serving skew, schema changes, missing values), then label delay and concept drift, then retrain ([Sculley et al., 2015](https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html), [Breck et al., 2017](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)).

### Batch or real-time scoring?

Batch when decisions are made on a schedule, such as a weekly campaign list; real time when a decision is made per request, such as fraud at payment ([Google for Developers: Static vs. dynamic inference](https://developers.google.com/machine-learning/crash-course/production-ml-systems/static-vs-dynamic-inference)).

## Behavioural

### "Tell me about a model that did not work."

The goal, what you tried, why it failed and what you learned or changed; specific evidence of your own actions is what structured interviews score ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
