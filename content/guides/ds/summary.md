# Data Scientist — super summary

## Toolkit

- pandas `groupby` and `merge` cover most data wrangling: split-apply-combine and SQL-style joins ([pandas: Group by](https://pandas.pydata.org/docs/user_guide/groupby.html)).
- Window functions compute per-group features in SQL without collapsing rows ([PostgreSQL: Window functions](https://www.postgresql.org/docs/current/tutorial-window.html)).
- A hypothesis test asks how surprising the data would be if the null hypothesis were true ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).
- The bootstrap estimates a statistic's sampling variability by resampling the data with replacement ([Efron, 1979: Bootstrap methods](https://doi.org/10.1214/aos/1176344552)).

## Framing and features

- Frame the problem before modelling: the prediction, the decision it changes and how success is measured ([Google for Developers: ML problem framing](https://developers.google.com/machine-learning/problem-framing)).
- Data leakage happens when information unavailable at prediction time reaches training; fit every preprocessing step inside the cross-validation folds ([scikit-learn: Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)).
- Pipelines chain preprocessing and the model so they are fitted and applied together ([scikit-learn: Pipelines and composite estimators](https://scikit-learn.org/stable/modules/compose.html)).

## Models and evaluation

- Tree ensembles such as random forests and gradient boosting are strong defaults for tabular data ([scikit-learn: Ensembles](https://scikit-learn.org/stable/modules/ensemble.html)).
- Cross-validation estimates generalisation by training and testing on several splits ([scikit-learn: Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html)).
- On imbalanced data, the precision-recall curve is more informative than the ROC curve ([Saito & Rehmsmeier, 2015](https://doi.org/10.1371/journal.pone.0118432)).
- Calibrated probabilities mean that among cases scored 0.8, about 80% are positive; check with a reliability curve ([scikit-learn: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)).
- Permutation importance measures how much a score drops when one feature is shuffled ([scikit-learn: Permutation feature importance](https://scikit-learn.org/stable/modules/permutation_importance.html)).

## Beyond prediction

- A causal effect compares the outcome with and without treatment for the same unit; only one is ever observed, which is why randomisation matters ([Holland, 1986: Statistics and causal inference](https://doi.org/10.1080/01621459.1986.10478354)).
- Randomised controlled experiments are the standard for measuring the effect of a change online ([Kohavi et al., 2009](https://doi.org/10.1007/s10618-008-0114-1)).
- Forecasts should beat simple benchmarks such as naive and seasonal naive before anything else is trusted ([Hyndman & Athanasopoulos: Some simple forecasting methods](https://otexts.com/fpp3/toolbox.html#sec-simple-methods)).
- TF-IDF weights words that are frequent in a document but rare across documents ([scikit-learn: Tf–idf term weighting](https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting)).
- Sentence embeddings place texts with similar meaning close together, compared with cosine similarity ([Reimers & Gurevych, 2019: Sentence-BERT](https://arxiv.org/abs/1908.10084)).

## Production

- In real ML systems the model code is a small part; data, configuration, serving and monitoring carry most of the technical debt ([Sculley et al., 2015: Hidden technical debt in ML systems](https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html)).
- Production readiness covers tests for data, model, infrastructure and monitoring ([Breck et al., 2017: The ML test score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)).
- Persist the whole fitted pipeline with the model so serving applies the same preprocessing ([scikit-learn: Model persistence](https://scikit-learn.org/stable/model_persistence.html)).

## Interview

- Expect case questions that move from framing to features, model, metric and deployment; structured interviews score each step against job-related criteria ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
