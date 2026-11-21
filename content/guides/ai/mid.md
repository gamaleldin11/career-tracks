# AI Engineer — mid level

*What a mid-level role adds: training deep networks well, ensembles and unsupervised learning, NLP and sequence models, and building LLM systems: transformers, RAG, fine-tuning, agents and serving.*

## Training deep networks

- He initialisation keeps activation variance stable in ReLU networks ([He et al., 2015: Delving deep into rectifiers](https://arxiv.org/abs/1502.01852)).
- Batch normalisation normalises each feature over the batch; layer normalisation normalises over the features of each example and suits transformers ([Ioffe & Szegedy, 2015: Batch normalization](https://arxiv.org/abs/1502.03167), [Ba et al., 2016: Layer normalization](https://arxiv.org/abs/1607.06450)).
- Mixed precision runs most operations in 16-bit floats for speed and memory while keeping precision where it matters ([PyTorch: Automatic mixed precision](https://docs.pytorch.org/docs/stable/amp.html)).
- Save and load the `state_dict` rather than the whole model object ([PyTorch: Saving and loading models](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html)).
- Random search beats grid search when only a few hyperparameters matter ([Bergstra & Bengio, 2012](https://www.jmlr.org/papers/v13/bergstra12a.html)).

## Ensembles and unsupervised learning

- Bagging trains models on bootstrap samples and averages them; boosting trains them in sequence on the previous errors ([scikit-learn: Ensembles](https://scikit-learn.org/stable/modules/ensemble.html)).
- Isolation forests flag anomalies as points that random splits isolate quickly ([scikit-learn: Isolation forest](https://scikit-learn.org/stable/modules/outlier_detection.html#isolation-forest)).
- Hierarchical clustering builds a tree of merges that can be cut at any level ([scikit-learn: Hierarchical clustering](https://scikit-learn.org/stable/modules/clustering.html#hierarchical-clustering)).

## Sequences and NLP

- TF-IDF turns text into weighted word counts that a linear model can classify ([scikit-learn: Text feature extraction](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)).
- Byte-pair encoding builds a subword vocabulary that covers rare words ([Sennrich et al., 2015: Subword units](https://arxiv.org/abs/1508.07909)).
- BERT pre-trains a bidirectional encoder with masked-language modelling, then fine-tunes it per task ([Devlin et al., 2018: BERT](https://arxiv.org/abs/1810.04805)).
- Evaluate time-series models on a rolling origin, never with a random split ([Hyndman & Athanasopoulos: Time series cross-validation](https://otexts.com/fpp3/toolbox.html#sec-tscv)).

## Transformers and LLMs

- Self-attention lets every token weigh every other token; scaled dot-product attention divides by the square root of the key dimension ([Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)).
- Compute-optimal training scales parameters and training tokens equally: double the model, double the tokens; Chinchilla used 70B parameters and 1.4T tokens ([Hoffmann et al., 2022: Chinchilla](https://arxiv.org/abs/2203.15556)).
- Direct preference optimisation aligns a model to preferences without training a separate reward model ([Rafailov et al., 2023: DPO](https://arxiv.org/abs/2305.18290)).
- QLoRA fine-tunes LoRA adapters on top of a 4-bit quantised base model to save memory ([Dettmers et al., 2023: QLoRA](https://arxiv.org/abs/2305.14314)).
- FlashAttention computes exact attention with fewer memory reads and writes ([Dao et al., 2022: FlashAttention](https://arxiv.org/abs/2205.14135)).

## Retrieval and agents

- BM25 ranks documents by term frequency and inverse document frequency with length normalisation ([Robertson & Zaragoza, 2009: BM25 and beyond](https://doi.org/10.1561/1500000019)).
- HNSW graphs give fast approximate nearest-neighbour search over embeddings ([Malkov & Yashunin, 2016: HNSW](https://arxiv.org/abs/1603.09320)).
- Sentence embeddings compared by cosine similarity power semantic search ([Reimers & Gurevych, 2019: Sentence-BERT](https://arxiv.org/abs/1908.10084)).
- Evaluate RAG retrieval and generation separately, for example context relevance and answer faithfulness ([Es et al., 2023: RAGAS](https://arxiv.org/abs/2309.15217)).
- ReAct-style agents alternate reasoning steps with tool calls and observations ([Yao et al., 2022: ReAct](https://arxiv.org/abs/2210.03629)).
- MCP defines how servers expose tools, resources and prompts to AI applications ([Model Context Protocol: Specification](https://modelcontextprotocol.io/specification/latest)).
- Limit what an agent's tools can do and require approval for high-impact actions, because excessive agency is a listed LLM risk ([OWASP: Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)).

## Serving

- 8-bit quantisation can run large models with little loss in quality ([Dettmers et al., 2022: LLM.int8()](https://arxiv.org/abs/2208.07339)).
- Paged key–value cache management raises serving throughput by batching more requests ([Kwon et al., 2023: vLLM](https://arxiv.org/abs/2309.06180)).
- Contrastive image–text pre-training enables zero-shot image classification from text prompts ([Radford et al., 2021: CLIP](https://arxiv.org/abs/2103.00020)).
