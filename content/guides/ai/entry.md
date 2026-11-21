# AI Engineer — entry level

*What a junior AI or ML engineering role expects: Python, NumPy and pandas, SQL, statistics, the classical ML workflow, and how to call and evaluate a model.*

## Python, NumPy and pandas

- List comprehensions and generators build sequences concisely; generators produce items lazily ([Python tutorial: List comprehensions](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions)).
- A default argument value is evaluated once, so a mutable default such as `[]` is shared between calls ([Python tutorial: Default argument values](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)).
- NumPy arrays hold one data type in contiguous memory, which makes vectorised operations fast ([NumPy: The N-dimensional array](https://numpy.org/doc/stable/reference/arrays.ndarray.html)).
- Broadcasting stretches dimensions of size 1 to match ([NumPy: Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)).
- Boolean masks filter pandas rows; combine conditions with `&` and `|` and parenthesise each one ([pandas: Boolean indexing](https://pandas.pydata.org/docs/user_guide/indexing.html#boolean-indexing)).
- The `category` dtype stores repeated strings compactly ([pandas: Categorical data](https://pandas.pydata.org/docs/user_guide/categorical.html)).

## SQL

- Join, filter, group and window in SQL before pulling data into Python ([PostgreSQL: Window functions tutorial](https://www.postgresql.org/docs/current/tutorial-window.html)).

## Data preparation

- Decide per column how to handle missing values, then impute with statistics learned from training data ([scikit-learn: Imputation of missing values](https://scikit-learn.org/stable/modules/impute.html)).
- Scale features for distance- and gradient-based models ([scikit-learn: Preprocessing data](https://scikit-learn.org/stable/modules/preprocessing.html)).
- Encode categories with one-hot encoding fitted on training data ([scikit-learn: Encoding categorical features](https://scikit-learn.org/stable/modules/preprocessing.html#encoding-categorical-features)).
- A box plot shows the quartiles and values far from them, a quick check for outliers ([NIST/SEMATECH e-Handbook: Box plot](https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm)).

## Statistics

- Confidence intervals and hypothesis tests quantify uncertainty from samples ([NIST/SEMATECH e-Handbook: Hypothesis testing](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm)).
- Randomised experiments are the standard way to show a change causes an effect ([Kohavi et al., 2009](https://doi.org/10.1007/s10618-008-0114-1)).

## Classical ML

- Split data into training and test sets, and tune on validation folds, never on the test set ([scikit-learn: Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html)).
- Linear regression minimises squared error; regularisation adds a penalty on coefficient size ([scikit-learn: Linear models](https://scikit-learn.org/stable/modules/linear_model.html)).
- Logistic regression predicts class probabilities ([scikit-learn: Logistic regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)).
- k-means groups points by distance to cluster centres and needs the number of clusters in advance ([scikit-learn: K-means](https://scikit-learn.org/stable/modules/clustering.html#k-means)).
- Report precision, recall and F1 for classification, and MAE or RMSE for regression ([scikit-learn: Metrics and scoring](https://scikit-learn.org/stable/modules/model_evaluation.html)).
- Save the whole fitted pipeline so serving applies identical preprocessing ([scikit-learn: Model persistence](https://scikit-learn.org/stable/model_persistence.html)).

## Neural network basics

- A network is layers of weighted sums and non-linear activations trained by gradient descent ([PyTorch: Build the neural network](https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html)).
- A PyTorch training loop runs forward, computes the loss, calls `backward()`, steps the optimiser and zeroes the gradients ([PyTorch: Optimizing model parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)).
- Call `model.eval()` before inference so layers such as dropout and batch norm behave correctly ([PyTorch: Module.eval](https://docs.pytorch.org/docs/stable/generated/torch.nn.Module.html#torch.nn.Module.eval)).
- Dropout randomly switches off units during training to reduce overfitting ([Srivastava et al., 2014: Dropout](https://jmlr.org/papers/v15/srivastava14a.html)).

## Working with LLMs

- Models read text as tokens; tokenizers such as byte-pair encoding split words into subword units ([Hugging Face: Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary)).
- Retrieval-augmented generation retrieves relevant documents and passes them to the model with the question ([Lewis et al., 2020: RAG](https://arxiv.org/abs/2005.11401)).
- Treat model output as untrusted input and guard against prompt injection ([OWASP: Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)).
