# AI Engineer — super summary

## Toolkit

- NumPy broadcasting applies operations to arrays of different shapes without copying data, when trailing dimensions are equal or one of them is 1 ([NumPy: Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)).
- pandas handles tabular data with labelled rows and columns; `groupby` splits rows into groups, applies a function and combines the results ([pandas: Group by](https://pandas.pydata.org/docs/user_guide/groupby.html)).
- Fit preprocessing on training data only, inside a pipeline, to avoid leakage ([scikit-learn: Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)).

## Classical machine learning

- Cross-validation estimates how a model generalises by rotating which part of the data is held out ([scikit-learn: Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html)).
- Gradient-boosted trees are strong on tabular data; XGBoost made them fast and scalable ([Chen & Guestrin, 2016: XGBoost](https://arxiv.org/abs/1603.02754)).
- PCA projects data onto the directions of greatest variance ([scikit-learn: PCA](https://scikit-learn.org/stable/modules/decomposition.html#pca)).
- Choose metrics that match the cost of errors; on rare positives use precision and recall, not accuracy ([scikit-learn: Metrics and scoring](https://scikit-learn.org/stable/modules/model_evaluation.html)).

## Deep learning

- Neural networks learn by backpropagation: gradients of the loss flow backward through the layers ([Rumelhart, Hinton & Williams, 1986](https://doi.org/10.1038/323533a0)).
- PyTorch's autograd records operations on tensors and computes gradients automatically ([PyTorch: Autograd mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html)).
- Adam adapts each parameter's learning rate using running estimates of the gradient's moments ([Kingma & Ba, 2014: Adam](https://arxiv.org/abs/1412.6980)).
- Residual connections let very deep networks train by adding each block's input to its output ([He et al., 2015: Deep residual learning](https://arxiv.org/abs/1512.03385)).
- LSTMs carry information across long sequences through gated memory cells ([Hochreiter & Schmidhuber, 1997: LSTM](https://doi.org/10.1162/neco.1997.9.8.1735)).

## Modern AI

- The Transformer replaces recurrence with self-attention and underlies today's language models ([Vaswani et al., 2017: Attention is all you need](https://arxiv.org/abs/1706.03762)).
- Large language models can perform new tasks from instructions and a few examples in the prompt ([Brown et al., 2020: Language models are few-shot learners](https://arxiv.org/abs/2005.14165)).
- Instruction tuning with human feedback makes models follow instructions more helpfully ([Ouyang et al., 2022: InstructGPT](https://arxiv.org/abs/2203.02155)).
- Retrieval-augmented generation grounds answers in documents retrieved for each question ([Lewis et al., 2020: RAG](https://arxiv.org/abs/2005.11401)).
- LoRA fine-tunes a large model by training small low-rank matrices beside frozen weights ([Hu et al., 2021: LoRA](https://arxiv.org/abs/2106.09685)).
- Agents interleave reasoning with tool calls and observations ([Yao et al., 2022: ReAct](https://arxiv.org/abs/2210.03629)).
- Vision Transformers apply the same architecture to image patches ([Dosovitskiy et al., 2020: ViT](https://arxiv.org/abs/2010.11929)).
- Diffusion models generate data by learning to reverse a gradual noising process ([Ho et al., 2020: DDPM](https://arxiv.org/abs/2006.11239)).
- Reinforcement learning learns behaviour from rewards through interaction with an environment ([Sutton & Barto: Reinforcement Learning, 2nd ed.](http://incompleteideas.net/book/the-book-2nd.html)).

## System design and security

- Prompt injection, where crafted input overrides an application's instructions, tops the OWASP list of LLM application risks ([OWASP: Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)).
- The Model Context Protocol standardises how applications give models access to tools and data ([Model Context Protocol: Specification](https://modelcontextprotocol.io/specification/latest)).
- PagedAttention manages the key–value cache in pages, letting servers batch many more requests ([Kwon et al., 2023: vLLM](https://arxiv.org/abs/2309.06180)).

## Interview

- AI engineering interviews mix ML fundamentals, LLM system design and behavioural questions; structured interviews score each answer against job-related criteria ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
