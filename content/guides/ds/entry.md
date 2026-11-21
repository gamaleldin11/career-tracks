# Data Scientist — entry level

*What a junior data science role expects: Python and SQL fluency, sound statistics, a leak-free modelling workflow and honest evaluation.*

## Python and SQL

- Vectorised NumPy and pandas operations are far faster than Python loops over rows ([NumPy: What is NumPy? — vectorization](https://numpy.org/doc/stable/user/whatisnumpy.html)).
- `loc` selects by label and `iloc` by integer position ([pandas: Indexing and selecting data](https://pandas.pydata.org/docs/user_guide/indexing.html)).
- Missing values need an explicit decision: drop, impute or flag ([pandas: Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)).
- Join tables in SQL before pulling data to avoid moving more rows than needed ([PostgreSQL: Joined tables](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)).

## Statistics

- The standard error of a mean shrinks with the square root of the sample size ([NIST/SEMATECH e-Handbook: Confidence limits for the mean](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm)).
- A p-value is the probability of data at least as extreme as observed if the null hypothesis holds, not the probability that the hypothesis is true ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).
- A type I error rejects a true null hypothesis; a type II error fails to reject a false one ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).
- Randomised A/B tests attribute a difference to the change rather than to other factors ([Kohavi et al., 2009](https://doi.org/10.1007/s10618-008-0114-1)).

## Framing

- Start from the decision: what will be done differently with the prediction, and what a good outcome looks like ([Google for Developers: ML problem framing](https://developers.google.com/machine-learning/problem-framing)).
- Compare every model with a simple baseline, such as predicting the majority class or the mean ([scikit-learn: Dummy estimators](https://scikit-learn.org/stable/modules/model_evaluation.html#dummy-estimators)).

## Features and leakage

- Split off a test set before any exploration-driven preprocessing, and fit transformations on training data only ([scikit-learn: Common pitfalls — data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage)).
- `Pipeline` and `ColumnTransformer` apply the right preprocessing to each column type and keep it inside cross-validation ([scikit-learn: ColumnTransformer for heterogeneous data](https://scikit-learn.org/stable/modules/compose.html#column-transformer)).
- One-hot encoding turns categories into 0/1 columns; `handle_unknown='ignore'` copes with categories unseen in training ([scikit-learn: Encoding categorical features](https://scikit-learn.org/stable/modules/preprocessing.html#encoding-categorical-features)).
- Distance-based models such as k-NN and SVMs need scaled features; tree models do not ([scikit-learn: Importance of feature scaling](https://scikit-learn.org/stable/auto_examples/preprocessing/plot_scaling_importance.html)).
- A stratified split keeps the class proportions the same in every fold ([scikit-learn: Cross-validation — stratified k-fold](https://scikit-learn.org/stable/modules/cross_validation.html#stratified-k-fold)).

## Models

- Linear and logistic regression are interpretable baselines; regularisation (L2 ridge, L1 lasso) limits overfitting ([scikit-learn: Linear models](https://scikit-learn.org/stable/modules/linear_model.html)).
- Decision trees split on the feature and threshold that most reduce impurity, and overfit if grown too deep ([scikit-learn: Decision trees](https://scikit-learn.org/stable/modules/tree.html)).
- Random forests average many trees trained on bootstrap samples; gradient boosting adds trees that correct the previous ones' errors ([scikit-learn: Ensembles](https://scikit-learn.org/stable/modules/ensemble.html)).
- Tune hyperparameters with cross-validated search, never on the test set ([scikit-learn: Tuning the hyper-parameters of an estimator](https://scikit-learn.org/stable/modules/grid_search.html)).

## Evaluation

- Precision is the share of predicted positives that are right; recall is the share of actual positives found ([scikit-learn: Precision, recall and F-measures](https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-f-measure-metrics)).
- Accuracy misleads on imbalanced data: always predicting the majority class can look excellent ([scikit-learn: Dummy estimators](https://scikit-learn.org/stable/modules/model_evaluation.html#dummy-estimators)).
- MAE is in the target's units and robust to outliers; RMSE penalises large errors more ([scikit-learn: Regression metrics](https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics)).
- A confusion matrix counts true and false positives and negatives at a chosen threshold ([scikit-learn: Confusion matrix](https://scikit-learn.org/stable/modules/model_evaluation.html#confusion-matrix)).

## Communicating

- Report a metric with its uncertainty, for example a bootstrap confidence interval ([Efron, 1979: Bootstrap methods](https://doi.org/10.1214/aos/1176344552)).
