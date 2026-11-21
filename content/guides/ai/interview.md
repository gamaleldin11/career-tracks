# AI Engineer — interview prep

*Short answers to the questions AI and ML engineering interviews ask most, from fundamentals to LLM systems.*

## Fundamentals

### What is overfitting and how do you detect it?

The model fits noise in the training data, so training performance is much better than validation performance; detect it with cross-validation and learning curves, reduce it with regularisation, more data or a simpler model ([scikit-learn: Validation curves](https://scikit-learn.org/stable/modules/learning_curve.html)).

### What is data leakage?

Information unavailable at prediction time reaching training, for example preprocessing fitted on the full dataset; keep every fitted step inside a pipeline ([scikit-learn: Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)).

### Precision or recall?

Precision when false positives are costly, recall when missing a positive is costly; pick the threshold from those costs ([scikit-learn: Tuning the decision threshold](https://scikit-learn.org/stable/modules/classification_threshold.html)).

### What does broadcasting do in NumPy?

It applies an operation to arrays of different shapes by stretching dimensions of size 1, without copying data ([NumPy: Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)).

## Deep learning

### Explain backpropagation in one minute.

A forward pass computes the loss; the chain rule then gives the gradient of the loss with respect to every weight, layer by layer backwards; the optimiser moves each weight against its gradient ([Rumelhart, Hinton & Williams, 1986](https://doi.org/10.1038/323533a0), [PyTorch: Autograd mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html)).

### Why do residual connections help?

They let gradients and signals pass through identity paths, so very deep networks can train ([He et al., 2015: Deep residual learning](https://arxiv.org/abs/1512.03385)).

### Batch norm or layer norm?

Batch norm normalises across the batch and suits CNNs; layer norm normalises within each example, independent of batch size, and is standard in transformers ([Ioffe & Szegedy, 2015](https://arxiv.org/abs/1502.03167), [Ba et al., 2016](https://arxiv.org/abs/1607.06450)).

### Why does dropout behave differently at inference?

Dropout only drops units in training; `model.eval()` switches it off so every unit is used ([Srivastava et al., 2014: Dropout](https://jmlr.org/papers/v15/srivastava14a.html), [PyTorch: Module.eval](https://docs.pytorch.org/docs/stable/generated/torch.nn.Module.html#torch.nn.Module.eval)).

## Transformers and LLMs

### How does self-attention work?

Each token produces a query, a key and a value; attention weights are the softmax of query–key dot products divided by the square root of the key dimension, and the output is the weighted sum of values ([Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)).

### Encoder-only, decoder-only or encoder–decoder?

Encoders such as BERT read the whole input bidirectionally and suit classification and embeddings; decoders such as GPT generate left to right; encoder–decoders map one sequence to another ([Devlin et al., 2018: BERT](https://arxiv.org/abs/1810.04805), [Brown et al., 2020](https://arxiv.org/abs/2005.14165)).

### RAG or fine-tuning?

RAG when the model needs current or private facts it can cite; fine-tuning (often LoRA) when it needs a new behaviour, format or style ([Lewis et al., 2020: RAG](https://arxiv.org/abs/2005.11401), [Hu et al., 2021: LoRA](https://arxiv.org/abs/2106.09685)).

### Why does LoRA use so little memory?

It freezes the original weights and trains two small low-rank matrices per adapted layer, so only a tiny fraction of parameters and their optimiser state are trained ([Hu et al., 2021: LoRA](https://arxiv.org/abs/2106.09685)).

### Your RAG system gives wrong answers. How do you debug it?

Check retrieval first (are the right chunks in the top results?), then generation (is the answer faithful to the retrieved context?); measure each separately ([Es et al., 2023: RAGAS](https://arxiv.org/abs/2309.15217)).

### Keyword or vector search?

It depends on the queries: BM25 matches exact terms such as codes and names, while embeddings match meaning, so paraphrases still find the document ([Robertson & Zaragoza, 2009: BM25](https://doi.org/10.1561/1500000019), [Reimers & Gurevych, 2019](https://arxiv.org/abs/1908.10084)).

## Systems and safety

### What is prompt injection and how do you mitigate it?

Input that overrides the application's instructions, directly or through retrieved content; mitigate with least-privilege tools, separation of trusted and untrusted content, output validation and human approval for risky actions ([OWASP: Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)).

### How would you serve an LLM cheaply?

Quantise the weights, batch requests, and manage the key–value cache efficiently, for example with paged attention ([Dettmers et al., 2022: LLM.int8()](https://arxiv.org/abs/2208.07339), [Kwon et al., 2023: vLLM](https://arxiv.org/abs/2309.06180)).

### How do agents use tools?

The model chooses an action, the application runs the tool and returns the observation, and the loop continues until done; protocols such as MCP standardise the tool interface ([Yao et al., 2022: ReAct](https://arxiv.org/abs/2210.03629), [Model Context Protocol: Specification](https://modelcontextprotocol.io/specification/latest)).

## Behavioural

### "Tell me about an ML project you are proud of."

The problem, the data, your modelling choices and their trade-offs, the metric that improved and what you would do differently; structured interviews look for specific evidence of your own work ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
