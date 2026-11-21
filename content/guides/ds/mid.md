# Data Scientist — mid level

*What a mid-level role adds: causal inference, forecasting, text and embeddings, careful evaluation and models that survive production.*

## Evaluation in depth

- Use the precision-recall curve and average precision when positives are rare ([Saito & Rehmsmeier, 2015](https://doi.org/10.1371/journal.pone.0118432)).
- Choose the decision threshold from the costs of false positives and false negatives, not the default 0.5 ([scikit-learn: Tuning the decision threshold](https://scikit-learn.org/stable/modules/classification_threshold.html)).
- Calibrate probabilities with isotonic or sigmoid calibration when decisions depend on their values ([scikit-learn: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)).
- Time-ordered data needs time-ordered validation; `TimeSeriesSplit` never trains on the future ([scikit-learn: Time series split](https://scikit-learn.org/stable/modules/cross_validation.html#time-series-split)).
- Impurity-based importances favour high-cardinality features; permutation importance on held-out data is more reliable ([scikit-learn: Permutation feature importance](https://scikit-learn.org/stable/modules/permutation_importance.html)).
- SHAP values attribute a single prediction to features using Shapley values from game theory ([Lundberg & Lee, 2017: A unified approach to interpreting model predictions](https://arxiv.org/abs/1705.07874)).
- Random search finds good hyperparameters more efficiently than grid search when only a few of them matter ([Bergstra & Bengio, 2012: Random search for hyper-parameter optimization](https://www.jmlr.org/papers/v13/bergstra12a.html)).
- Target encoding replaces a category with a smoothed mean of the target, using cross-fitting to avoid leakage ([scikit-learn: Target encoder](https://scikit-learn.org/stable/modules/preprocessing.html#target-encoder)).
- XGBoost made gradient-boosted trees fast and scalable with regularisation and sparsity-aware splits ([Chen & Guestrin, 2016: XGBoost](https://arxiv.org/abs/1603.02754)).

## Causal inference

- The potential-outcomes framework defines a causal effect as the difference between outcomes with and without treatment for the same unit ([Rubin, 1974](https://doi.org/10.1037/h0037350)).
- Because only one potential outcome is observed per unit, causal effects are estimated for groups, ideally under randomisation ([Holland, 1986](https://doi.org/10.1080/01621459.1986.10478354)).
- CUPED reduces the variance of experiment metrics using pre-experiment data ([Deng et al., 2013](https://doi.org/10.1145/2433396.2433413)).
- Regression discontinuity compares units just above and just below an eligibility cutoff ([Thistlethwaite & Campbell, 1960](https://doi.org/10.1037/h0044319)).
- Difference-in-differences compares the change over time in a treated group with the change in a control group ([Card & Krueger, 1994: Minimum wages and employment](https://www.nber.org/papers/w4509)).
- Check the sample ratio before reading any experiment's results ([Fabijan et al., 2019](https://doi.org/10.1145/3292500.3330722)).

## Forecasting

- Evaluate forecasts on a rolling origin (time series cross-validation), not a random split ([Hyndman & Athanasopoulos: Time series cross-validation](https://otexts.com/fpp3/toolbox.html#sec-tscv)).
- Scaled errors such as MASE compare accuracy across series with different scales ([Hyndman & Athanasopoulos: Evaluating point forecast accuracy](https://otexts.com/fpp3/toolbox.html#sec-accuracy)).
- Report prediction intervals, which widen with the horizon ([Hyndman & Athanasopoulos: Prediction intervals](https://otexts.com/fpp3/toolbox.html#sec-prediction-intervals)).
- Holidays that move between dates each year, such as Easter, are modelled with dummy variables marking the periods they fall in ([Hyndman & Athanasopoulos: Useful predictors](https://otexts.com/fpp3/regression.html#sec-useful-predictors)).

## Text, embeddings and LLMs

- Word embeddings learned from context place related words near each other ([Mikolov et al., 2013: Efficient estimation of word representations](https://arxiv.org/abs/1301.3781)).
- The Transformer architecture relies on attention instead of recurrence and underlies modern language models ([Vaswani et al., 2017: Attention is all you need](https://arxiv.org/abs/1706.03762)).
- Retrieval-augmented generation conditions a language model on documents retrieved for each query ([Lewis et al., 2020: Retrieval-augmented generation](https://arxiv.org/abs/2005.11401)).
- Sentence-BERT produces sentence embeddings that can be compared with cosine similarity for search and clustering ([Reimers & Gurevych, 2019](https://arxiv.org/abs/1908.10084)).

## Production

- Training–serving skew and silent data dependencies are common sources of ML failures ([Sculley et al., 2015](https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html)).
- Monitor input distributions and prediction distributions, and model quality once labels arrive ([Breck et al., 2017: The ML test score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)).
- A model registry versions models and tracks which version is in each stage ([MLflow: Model Registry](https://mlflow.org/docs/latest/ml/model-registry/)).
- Pickled scikit-learn models should be loaded with the same library versions they were saved with ([scikit-learn: Model persistence](https://scikit-learn.org/stable/model_persistence.html)).
