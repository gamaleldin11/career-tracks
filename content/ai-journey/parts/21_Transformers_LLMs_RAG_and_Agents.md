# Part 21 — Transformers, LLMs, Chatbots, RAG and Agents

<!-- nav -->
> [!example] 🧭 Step 20 of 26 · Stage 6 of 7: Modern AI
> ← [Part 20 · NLP + attention](20_NLP_RNNs_HuggingFace_and_Attention.md) · [Part 22 · ViT & multimodal](22_Vision_and_Multimodal_Transformers.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 15** "Transformers for Natural Language Processing and Chatbots". Chapter 17 ("Speeding Up Transformers") is **published online only** (homl.info); its key topics are covered in §21.9 from current practice. **🔭 State of the art** boxes and §21.10 bring everything up to 2025–26.

**Why this part matters for you:** you already build with LLMs (FinSight, your GenAI work). Interviewers now expect data scientists to explain *how* transformers work, when to fine-tune vs prompt vs retrieve, and how to evaluate and deploy LLM systems safely. Telecoms are among the heaviest enterprise adopters (customer-care assistants, agent assist, network-operations copilots).

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** In 2025–26 almost every DS interview includes GenAI questions. e& runs LLM assistants, so RAG and evaluation are asked even for entry roles.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Encoder vs decoder models (BERT vs GPT); what an LLM does (next-token prediction); prompting; what RAG is and why it reduces hallucination. |
> | 🟡 **Mid** | Self-attention mechanics; the training stages (pretraining → SFT → RLHF/DPO); LoRA; a RAG design (chunking, embeddings, hybrid search, reranking, evaluation); guardrails. |
> | 🔴 **Senior** | Serving cost and latency (KV cache, quantisation, vLLM), agents and MCP, an LLM evaluation strategy, security (prompt injection), build vs buy. |
>
> **⭐ Most-asked:** *Explain self-attention.* · *BERT vs GPT?* · *Design a RAG chatbot for e& tariffs in Arabic and English.* · *Fine-tuning vs RAG vs prompting?* · *How do you evaluate an LLM application?*
>
> **⏱ Time:** 6 h  ·  **Short on time?** Read §21.1 (skim the code), §21.2, §21.5, §21.7, §21.12.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 21.1 | The Transformer (Vaswani et al., 2017): "Attention Is All You Need" | 🟡 ⭐ | Ch. 15 · pp. 581–594 |
> | 21.2 | The three families of transformers | 🟢 ⭐ | Ch. 15 · pp. 577–581 |
> | 21.3 | Encoder-only models: BERT and its family | 🟡 | Ch. 15 · pp. 594–609 |
> | 21.4 | Decoder-only models: GPT and scaling | 🟡 | Ch. 15 · pp. 609–621 |
> | 21.5 | From base model to chatbot | 🟡 ⭐ | Ch. 15 · pp. 621–633 |
> | 21.6 | From a chatbot model to a chatbot system | 🟡 | Ch. 15 · pp. 633–639 |
> | 21.7 | Retrieval-Augmented Generation (RAG) — the enterprise workhorse | 🟢 ⭐ | Ch. 15 · pp. 633–639 |
> | 21.8 | Encoder–decoder models (T5, BART) | 🟡 | Ch. 15 · pp. 639–641 |
> | 21.9 | Making transformers fast and cheap | 🔴 | Ch. 17, online chapter (homl.info) — speeding up transformers |
> | 21.10 | 🔭 The LLM landscape and practices in 2025–26 | 🟡 | — |
> | 21.11 | Real-world examples | 🟡 | — |
> | 21.12 | Interview drill — transformers and LLMs | 🟡 ⭐ | Ch. 15 · p. 641 |
>

---

## 21.1 The Transformer (Vaswani et al., 2017): "Attention Is All You Need" 🟡 ⭐

> [!info] 📖 Géron Ch. 15 · “Attention Is All You Need” → “Building an English-to-Spanish Transformer” · pp. 581–594

![One transformer layer. LLMs stack dozens of them.](figures/fig21_transformer_block.png)
*One transformer layer. LLMs stack dozens of them.*

> [!quote] 💬 Say it in the interview
> “Self-attention: each token builds a query, key and value; the weights are softmax(QKᵀ/√d_k), and the output is the weighted sum of values. Multiple heads attend to different relations in parallel.”

An **encoder–decoder with no recurrence and no convolutions**: just **multi-head attention + feed-forward layers + residual connections + layer norm**, plus **positional encodings**. Why it won:
- **Parallel** across all positions (RNNs are sequential), so training is faster and scales across GPUs.
- **Short paths between any two tokens**, which captures long-range dependencies.
- Fewer gradient problems than RNNs.
- **It scales.** The original had ~65M parameters; models reached 1.6 trillion by 2021.

It is used exactly like Part 20's encoder–decoder: the encoder reads the source and outputs **contextualised embeddings**; the decoder generates one token at a time (starting from `<s>`), attending to the encoder output. In training, the whole target is fed at once (teacher forcing) with a causal mask.

### The components (Géron's Figure 15-3, in words)

**Encoder block** (×N; N = 6 originally): **self-attention** (each token attends to every token in its own sentence; "like" becomes verb-"like") → add & norm → **position-wise feed-forward** (Linear d → 4d → ReLU → Linear 4d → d, an "inverted bottleneck") → add & norm. The shape stays [batch, length, d_model] throughout, so representations are gradually *transformed*.

**Decoder block** (×N): **masked (causal) self-attention** (a token can't see future tokens, or it would cheat) → **cross-attention** (queries from the decoder; keys and values from the encoder's final output) → feed-forward. Each sub-layer has a residual connection and layer norm.

**Output:** a Linear layer to vocabulary logits (softmax is implicit in `CrossEntropyLoss`).

### Positional encodings

Attention is **permutation-invariant**. Without position information, "dog bites man" = "man bites dog".
- **Learned absolute embeddings:** add row i of a trainable matrix to token i (GPT-2, BERT).
- **Sinusoidal** (the original paper): fixed sin/cos at different frequencies.
- **Relative / rotary:** **RoPE** (rotary position embeddings, rotating queries and keys by position-dependent angles; used by **Llama, Mistral, Qwen** and most modern LLMs; extendable to longer contexts), **ALiBi** (a linear distance bias on attention scores), relative position bias (T5), and DeBERTa's disentangled attention.

```python
class PositionalEmbedding(nn.Module):
    def __init__(self, max_length, embed_dim, dropout=0.1):
        super().__init__()
        self.pos_embed = nn.Parameter(torch.randn(max_length, embed_dim) * 0.02)
        self.dropout = nn.Dropout(dropout)
    def forward(self, X):                           # X: [B, L, d]
        return self.dropout(X + self.pos_embed[:X.size(1)])   # broadcast over the batch
```

### Scaled dot-product attention (Equation 15-1)

> **Attention(Q, K, V) = softmax( QKᵀ / √d_k ) · V**

- QKᵀ is an [L_q × L_k] matrix of similarity scores, **quadratic in sequence length**: the context-window problem.
- **Why ÷ √d_k?** Dot products of d_k-dimensional vectors grow with d_k. Large scores saturate the softmax (near one-hot), giving tiny gradients. Scaling keeps the variance ~1 and training stable.
- **Masking:** set the disallowed scores to **−∞** before the softmax, so their weights become exactly 0 and the rest still sum to 1. A **causal mask** is True above the diagonal (`torch.triu(full, diagonal=1)`); a **key-padding mask** marks the pad tokens.
- PyTorch: `F.scaled_dot_product_attention(q, k, v, attn_mask=…, is_causal=…)`. It is fused and uses FlashAttention kernels when available.

### Multi-head attention (MHA)

A token's representation encodes many things at once (meaning, part of speech, tense, position). **Multiple heads** each project Q, K and V into a smaller subspace (d_head = d_model / h), so each head can "query" a different aspect. The heads' outputs are concatenated and mixed by an output projection.

```python
class MultiheadAttention(nn.Module):
    def __init__(self, embed_dim, num_heads, dropout=0.1):
        super().__init__()
        self.h, self.d = num_heads, embed_dim // num_heads
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)
        self.dropout = nn.Dropout(dropout)
    def split_heads(self, X):                                 # [B, L, h·d] → [B, h, L, d]
        return X.view(X.size(0), X.size(1), self.h, self.d).transpose(1, 2)
    def forward(self, query, key, value, attn_mask=None, key_padding_mask=None):
        q = self.split_heads(self.q_proj(query))
        k = self.split_heads(self.k_proj(key))
        v = self.split_heads(self.v_proj(value))
        scores = q @ k.transpose(2, 3) / self.d ** 0.5        # [B, h, Lq, Lk]
        if attn_mask is not None:
            scores = scores.masked_fill(attn_mask, -torch.inf)
        if key_padding_mask is not None:
            scores = scores.masked_fill(key_padding_mask[:, None, None, :], -torch.inf)
        weights = scores.softmax(dim=-1)
        Z = (self.dropout(weights) @ v).transpose(1, 2)       # [B, Lq, h, d]
        return self.out_proj(Z.reshape(Z.size(0), Z.size(1), -1)), weights
```

**Self-attention vs cross-attention:** in self-attention Q, K and V all come from the same sequence. In cross-attention Q comes from the decoder and K = V = the encoder outputs. Géron notes that interpretability of what heads really do is an active research area (e.g. Anthropic's interpretability work).

### An English→Spanish Transformer in ~20 lines

```python
class NmtTransformer(nn.Module):
    def __init__(self, vocab_size, max_length, embed_dim=512, pad_id=0,
                 num_heads=8, num_layers=6, dropout=0.1):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=pad_id)
        self.pos_embed = PositionalEmbedding(max_length, embed_dim, dropout)
        self.transformer = nn.Transformer(embed_dim, num_heads, num_layers, num_layers,
                                          batch_first=True)
        self.output = nn.Linear(embed_dim, vocab_size)
    def forward(self, pair):
        src = self.pos_embed(self.embed(pair.src_token_ids))
        tgt = self.pos_embed(self.embed(pair.tgt_token_ids))
        L = pair.tgt_token_ids.size(1)
        causal = torch.triu(torch.full((L, L), True, device=tgt.device), diagonal=1)
        out = self.transformer(src, tgt,
                               src_key_padding_mask=~pair.src_mask.bool(),
                               memory_key_padding_mask=~pair.src_mask.bool(),
                               tgt_mask=causal, tgt_is_causal=True,
                               tgt_key_padding_mask=~pair.tgt_mask.bool())
        return self.output(out).permute(0, 2, 1)
```

Even a tiny version (d = 128, 4 heads, 2 layers, 20 epochs) translates Géron's long beach sentence correctly. Free GPU memory between experiments with `del model; gc.collect(); torch.cuda.empty_cache()`.

---

## 21.2 The three families of transformers 🟢 ⭐

> [!info] 📖 Géron Ch. 15 · introduction · pp. 577–581

> [!quote] 💬 Say it in the interview
> “Encoder-only models (BERT) understand text — classification, NER, embeddings. Decoder-only models (GPT, Llama) generate. Encoder–decoders (T5, BART) map text to text, as in translation.”

| Family | Attention | Pretraining objective | Best at | Examples |
|---|---|---|---|---|
| **Encoder-only** | Bidirectional | Masked LM (fill in blanks) | **Understanding:** classification, NER, extractive QA, **embeddings**, search, reranking | BERT, RoBERTa, DistilBERT, ALBERT, ELECTRA, DeBERTa, ModernBERT |
| **Decoder-only** | Causal | **Next-token prediction** | **Generation:** chat, code, reasoning, few-shot anything | GPT family, Llama, Mistral, Qwen, Gemma, DeepSeek, Claude (proprietary) |
| **Encoder–decoder** | Bidirectional encoder + causal decoder with cross-attention | Span corruption / denoising | **Sequence transduction:** translation, summarisation | T5, mT5, FLAN-T5, BART, mBART, Whisper (speech) |

**Why decoders generate faster than encoders:** causal attention means earlier tokens' keys and values never change, so they can be **cached** (the KV cache, §21.9) and only the new token is computed. Bidirectional encoders would have to recompute everything for each new token.

---

## 21.3 Encoder-only models: BERT and its family 🟡

> [!info] 📖 Géron Ch. 15 · “Encoder-Only Transformers for NLU” · pp. 594–609

**BERT** (Devlin et al., 2018): the Transformer encoder, bigger (base: 12 blocks, 12 heads, d = 768; large: 24 / 16 / 1024), with **pre-LN** (normalise *before* each sub-layer; more stable than the original post-LN), **segment embeddings** for sentence pairs (with `[SEP]`), and a max length of 512 tokens.

**Pretraining:**
- **Masked language modelling (MLM)**, a "cloze" task: 15% of tokens are selected. Of those, **80% become [MASK], 10% become a random token, and 10% stay unchanged**, so the model can't rely on [MASK] always being present (it never appears at fine-tuning time) and has to attend to the token at the predicted position. The loss is computed only on the selected tokens.
- **Next-sentence prediction (NSP)** on the **[CLS]** token. It was later found to help little and was dropped by most successors. Mean-pooling the token embeddings gives better sentence embeddings than [CLS].
- Trained for ~4 days on 16 TPUs over Wikipedia + BooksCorpus. **Géron's lesson: don't pretrain from scratch unless you must.** Start from a checkpoint close to your domain and continue MLM pretraining on your corpus ("domain-adaptive pretraining") if needed.

```python
from transformers import BertConfig, BertForMaskedLM, DataCollatorForLanguageModeling
config = BertConfig(vocab_size=tok.vocab_size, hidden_size=128, num_hidden_layers=2,
                    num_attention_heads=4, intermediate_size=512,
                    max_position_embeddings=128)
model = BertForMaskedLM(config)
collator = DataCollatorForLanguageModeling(tok, mlm=True, mlm_probability=0.15)  # dynamic masking
```

**Fine-tuning patterns:**

| Task | Head | Example |
|---|---|---|
| Sentence classification | Linear on [CLS] (or pooled) | Sentiment, complaint category, spam |
| Sentence-pair classification | Same, with both sentences separated by [SEP] | NLI, paraphrase (QQP/MRPC), QNLI |
| Token classification | Linear on every token | **NER** (MSISDNs, bundle names, dates), POS tagging |
| Multiple-choice QA | One score per (question, answer) pair → softmax | Exams, form filling |
| **Extractive QA** | Two scores per token (start, end); pick the max start+end with i ≤ j | SQuAD; "find the answer in this contract" |

The BERT authors found that adding the MLM loss during fine-tuning stabilises training. Lower learning rates for lower layers and brief freezing help (Part 17 §17.2).

### Sentence embeddings, semantic search and vector databases

Cross-encoding N sentences pairwise costs O(N²) BERT calls. **Sentence-BERT (SBERT)** instead encodes each text **once** into an embedding and compares with **cosine similarity**: hours become seconds.

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")     # small, fast, good (English)
emb = model.encode(["She's shopping", "She bought some shoes", "She's working"],
                   convert_to_tensor=True)
model.similarity(emb, emb)          # 0.63 shopping↔shoes > 0.58 shopping↔working
```

Uses:
- **Semantic search:** embed documents or chunks once and the query at runtime, then retrieve the top-k.
- **Clustering:** embeddings → UMAP/PCA → K-Means or HDBSCAN (Parts 9 and 10) for topic discovery in complaints.
- **Reranking** an existing keyword search.
- **Vector databases:** Pinecone, Weaviate, Qdrant, Milvus, Chroma, or **pgvector** in PostgreSQL and vector search in SQL Server, MongoDB or Elasticsearch.

### BERT's descendants

| Model | Year | Key idea |
|---|---|---|
| **RoBERTa** (Meta) | 2019 | More data, longer training, **dynamic masking**, no NSP. Better across the board |
| **DistilBERT** (HF) | 2019 | **Knowledge distillation:** 40% smaller, 60% faster, ~97% of BERT's performance |
| **ALBERT** (Google) | 2019 | **Shared weights across layers** (smaller, not faster) + **factorised embeddings** (30k×128 + 128×1024 ≈ 4M instead of 30M) + sentence-order prediction |
| **ELECTRA** (Google) | 2020 | **Replaced-token detection**: a small generator corrupts tokens and the discriminator flags every token as original or replaced. Learns from all tokens, so it is more sample-efficient |
| **DeBERTa / v3** (Microsoft) | 2021 | **Disentangled attention** (content and relative position separate); v3 adds ELECTRA-style training. Still a top NLU choice |
| Domain models | — | ClinicalBERT, SciBERT, PubMedBERT, **FinBERT**, GraphCodeBERT, Twitter-RoBERTa, legal models; multilingual (mBERT, XLM-R); **Arabic** (AraBERT, MARBERT, CAMeLBERT) |
| Compressed | — | TinyBERT, MobileBERT, MiniLM, DistilRoBERTa |
| **Adapters** | — | Freeze the base model; train small inserted modules (Chapter 17 online; LoRA in §21.9) |

**Knowledge distillation, precisely:** the student learns from the teacher's **soft targets**. Both softmaxes are softened with **temperature T ≈ 2** during training, which exposes Hinton's **"dark knowledge"**: "I feel [MASK]" gives great 72% / good 27% / bad 0.5% at T = 1, but ≈ 60% / 36% / 5% at T = 2, which teaches that "bad" is plausible. DistilBERT's loss = 5·distillation + 2·MLM + 1·cosine similarity of hidden states.

---

## 21.4 Decoder-only models: GPT and scaling 🟡

> [!info] 📖 Géron Ch. 15 · “Decoder-Only Transformers” → “Mistral-7B” · pp. 609–621

**GPT-1** (Radford et al., 2018): the decoder without cross-attention; 12 layers, d = 768, 12 heads, **117M parameters**; ~7,000 books; **next-token prediction (NTP)** on 512-token sequences (no padding or special tokens needed). Fine-tuned with a head on the **last token's** embedding for classification, entailment (texts joined with a delimiter), similarity and multiple choice. It beat the state of the art on many tasks. (Build one with `nn.TransformerEncoder` + a causal mask, since `nn.TransformerDecoder` includes cross-attention.)

**GPT-2** (2019): up to **1.5B parameters**, 48 layers, a 1,024-token context, trained on **WebText** (8M web pages linked from well-rated Reddit posts). The headline was **zero-shot learning**: prompt formats alone ("Q: … A:", "TL;DR:", few translation pairs) perform tasks it was never trained for, and ZSL improved **log-linearly with model size**. OpenAI initially withheld the largest model, citing misuse. That was its last open-weight release until **GPT-OSS (August 2025)**.

**GPT-3** (Brown et al., 2020): **175B parameters**. Its paper formalised **in-context learning (ICL)**: put zero, one or a few examples in the prompt (ZSL/OSL/FSL) and the model generalises without any weight update.

**Scaling laws** (beyond the chapter; interviewers like these): loss falls as a **power law** in parameters, data and compute (Kaplan et al., 2020). **Chinchilla** (Hoffmann et al., 2022) showed many models were *under-trained*: the compute-optimal point is roughly **~20 training tokens per parameter**. Today's models are often trained far beyond that (trillions of tokens) because inference-efficient smaller models are worth the extra training.

### Generating text with Hugging Face

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
tok = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2", device_map="auto", dtype="auto")

def generate(model, tok, prompt, max_new_tokens=50, **kw):
    inputs = tok(prompt, return_tensors="pt").to(model.device)
    out = model.generate(**inputs, max_new_tokens=max_new_tokens,
                         pad_token_id=tok.eos_token_id, **kw)
    return tok.decode(out[0], skip_special_tokens=True)

generate(model, tok, "Scientists found a talking unicorn today.", do_sample=True, top_p=0.6)
```

- Greedy decoding (the default) loops. Use `do_sample=True` with `temperature`, `top_k`, **`top_p` (preferred: it adapts to confidence)**, and `num_beams` for beam search.
- `device_map="auto"` places or shards the model across GPUs. `dtype="auto"` picks bf16/fp16.
- Decoders pad on the **left** in batched generation.
- **Few-shot template example:** "Capital city of France = Paris\nCapital city of {country} =". GPT-2 gets the UK and Mexico right but says **Toronto for Canada** (a common human misconception it absorbed), repeats the country when unsure (~30%), and answers "Paris" for non-countries (over-anchoring on the one example). **Mistral-7B** gets almost all of them right, and its few "mistakes" are defensible (Vatican → Rome). Scale matters.

**Using gated models securely** (Géron's steps, good practice for any API key): accept the licence on the Hub; create a **fine-grained, read-only token** scoped to the needed repositories; store it in a **secrets manager** (Colab secrets, environment variables, a key vault), never in code; rotate and revoke it. (Your `.env` pattern from Part 11.)

---

## 21.5 From base model to chatbot 🟡 ⭐

> [!info] 📖 Géron Ch. 15 · “Turning an LLM into a Chatbot”, “SFT and RLHF”, “DPO”, “TRL” · pp. 621–633

![How a chat or reasoning model is built, stage by stage.](figures/fig21_llm_training_stages.png)
*How a chat or reasoning model is built, stage by stage.*

> [!quote] 💬 Say it in the interview
> “A chatbot is built in stages: pretraining for knowledge, SFT for instruction following, then preference tuning (RLHF or DPO) for helpfulness and safety.”

A **base model** only *continues* text. Ask Mistral-7B "List some places I should visit in Paris." and it writes more of a forum post. Three levers turn it into an assistant: **prompting**, **fine-tuning** and **system design**.

### Prompt engineering — the techniques to name

| Technique | Idea |
|---|---|
| **Role and context** | "You are a friendly telecom support expert…", with audience, constraints and output format |
| **Few-shot examples** | Show 2–5 input→output pairs (ICL) |
| **Role tags** | "Me:/Bob:", "User:/Assistant:", or the model's **chat template** |
| **Prompt chaining** | Split a task into steps (outline → check → write) and feed outputs forward |
| **Chain-of-thought (CoT)** | "Think step by step", or show worked reasoning. Improves reasoning reliability |
| **Self-consistency (CoT-SC)** | Sample several reasoning paths and take the majority answer |
| **Tree-of-thoughts (ToT)** | Branch, evaluate, explore and backtrack. Strong but costly |
| **Multi-agent debate / self-refine** | Models critique and improve answers |
| **RAG** | Inject retrieved, trusted context to reduce **hallucinations** (§21.7) |
| **Automatic prompt optimisation** | Search or learn prompts (e.g. prompt tuning with learned soft tokens; DSPy-style optimisers) |

Géron's "Bob" chatbot shows the limits of prompting alone: it loops (five identical jokes), gives unhelpfully terse answers ("mix flour, sugar, butter, eggs"), and is **unsafe** ("how to rob a bank" → "wear a mask"). It is also vulnerable to **jailbreaks** and **training-data extraction attacks**. Prompting isn't enough; you need alignment fine-tuning.

### Fine-tuning for chat: SFT, then preference optimisation

```
Pretraining (NTP on trillions of tokens) ──► BASE model (e.g. Mistral-7B)
  ──► SFT on instructions & dialogues ──► instruct/chat model
  ──► RLHF or DPO on human preferences ──► helpful, harmless ASSISTANT (e.g. Mistral-7B-Instruct)
  ──► deploy in a SYSTEM: orchestrator + tools + RAG + memory + guardrails
```

**1. Supervised fine-tuning (SFT):** curated conversations, Q&A, code, maths, role-play and **safety refusals**, trained with ordinary next-token loss, usually with **loss masking** (only the answer tokens count). InstructGPT (OpenAI, January 2022) introduced SFT + RLHF.

**2a. RLHF** (Christiano et al., 2017; InstructGPT, 2022):
- Humans **rank** model answers → train a **reward model**.
- Optimise the LLM with **PPO** (Part 24) to maximise reward, with a **KL penalty** to stay close to the SFT model. Otherwise it **reward-hacks** (exploits the reward model and forgets useful pretrained behaviour).
- Effective but unstable and fiddly (four models in memory: policy, reference, reward, value).

**2b. DPO — Direct Preference Optimization** (Rafailov et al., 2023): the same preference data (prompt, **chosen**, **rejected**), with **no reward model and no RL**:

> **J(θ) = −log σ( β · [ (log π_θ(y_c|x) − log π_ref(y_c|x)) − (log π_θ(y_r|x) − log π_ref(y_r|x)) ] )**

Raise the chosen answer's likelihood *relative to a frozen reference model*, lower the rejected one's. β (0.1–0.5) controls how far the model may drift from the reference. It is simpler, stabler and data-efficient, and it is contrastive learning.

```python
def dpo_loss(model, ref_model, tok, full_chosen, full_rejected, beta=0.1):
    p_c, p_r = seq_logprob(model, tok, full_chosen), seq_logprob(model, tok, full_rejected)
    with torch.no_grad():                                   # the reference is frozen
        r_c, r_r = seq_logprob(ref_model, tok, full_chosen), seq_logprob(ref_model, tok, full_rejected)
    return -F.logsigmoid(beta * ((p_c - r_c) - (p_r - r_r))).mean()
# seq_logprob: sum of log-probs of each next token (log_softmax + gather, or −cross_entropy
# with reduction="none"), masking padding. log p(xy) works because log p(x) cancels.
```

**With the TRL library** (Hugging Face):

```python
from trl import SFTTrainer, SFTConfig, DPOTrainer, DPOConfig
sft = SFTTrainer("gpt2", train_dataset=alpaca_formatted,
                 args=SFTConfig(output_dir="sft", max_length=512, learning_rate=5e-5))
sft.train(); sft.model.save_pretrained("sft")
dpo = DPOTrainer("sft", train_dataset=load_dataset("Anthropic/hh-rlhf", split="train"),
                 args=DPOConfig(output_dir="dpo", learning_rate=2e-5),
                 processing_class=tok)
dpo.train()
```

- Datasets: **Alpaca** (52k single-turn instructions generated by text-davinci-003), **OpenAssistant/oasst1** (multi-turn), **Anthropic/hh-rlhf** (chosen/rejected pairs for helpful and harmless behaviour).
- **Chat formats and role tags** differ by model (ChatML `<|user|>…<|end|>`, "Human:/Assistant:", Llama's own tags). **Always use `tokenizer.apply_chat_template( messages, add_generation_prompt=True)`** rather than hand-formatting. A wrong template silently degrades a chat model.
- Géron's comparison: Mistral-7B-Instruct tells 5 *different* jokes, gives a detailed cookie recipe, and refuses the bank robbery.

> [!success] 🔭 State of the art — post-training (2025–26).
> - **Reasoning models:** trained with **reinforcement learning on verifiable rewards** (maths answers, code tests) to produce long chains of thought before answering. OpenAI's **o1** (September 2024) popularised them. **DeepSeek-R1** (January 2025, open weights) showed RL with **GRPO** (group relative policy optimisation, no value model) can elicit strong reasoning, and distilled that ability into small models. Most frontier labs now ship "thinking" modes with a controllable reasoning budget.
> - Preference optimisation variants beyond DPO (IPO, KTO, ORPO, SimPO), and **RLAIF / Constitutional AI** (AI feedback guided by written principles, Anthropic 2022).
> - **Synthetic data** (generated and filtered by strong models) is now a major part of SFT datasets.

---

## 21.6 From a chatbot model to a chatbot system 🟡

> [!info] 📖 Géron Ch. 15 · “From a Chatbot Model to a Full Chatbot System”, “Model Context Protocol” · pp. 633–639

A production assistant is a **system**: UI/app/API + an **orchestrator** that coordinates the model and **tools**.

| Tool | How it works |
|---|---|
| **Calculator / code interpreter** | Orchestrator detects maths or the model emits a tool call; the tool computes; the result is injected. LLMs are unreliable at arithmetic |
| **Web search / fetch** | Search, fetch, chunk, pick the relevant chunks by embedding similarity, inject with sources |
| **RAG over private data** | Knowledge base, PDFs, SQL databases → vector search → grounded, cited answers (§21.7) |
| **Memory** | Store user facts or preferences ("call me Alice") and inject them in later sessions, or retrieve relevant memories by similarity |
| **Agentic behaviour** | The model **plans** multi-step tasks, calls tools, observes, re-plans ("deep research") |
| **Function calling / tool use** | The model is fine-tuned to emit structured calls (`{"tool": "weather", "location": "Paris"}`); the orchestrator executes them |

**Structured generation:** to guarantee valid JSON or schema output, **constrain decoding** so that only tokens consistent with the grammar or schema can be sampled (a custom `LogitsProcessor` that sets invalid logits to −∞; the libraries **Outlines**, **Guidance**; many APIs offer native "structured outputs" / JSON-schema modes).

### Model Context Protocol (MCP)

An **open standard proposed by Anthropic** (2024) for connecting AI applications to tools and data. The **MCP host** (your app or orchestrator) runs **MCP clients** that hold **long-lived, stateful, bidirectional** connections to **MCP servers** (filesystem, email, calendar, databases, weather, GitHub…).

Why not just REST? MCP includes **AI-friendly discovery**: servers describe their functions, parameters and resources in rich text, so the LLM can work out how to use a new tool from the description. There is also **capability negotiation** (the client declares, for example, image display or streaming support). Adding a capability becomes: register the server and tell the model it exists.

⚠️ **Human in the loop.** Géron recalls **Stanislav Petrov** (1983), who judged a Soviet missile alert to be a false alarm. Keep humans in charge of consequential actions (refunds, line suspensions, credit decisions).

**Libraries and tools:** **LangChain** (chains and components), **LangGraph** (stateful, long-running agent workflows), **smolagents** (Hugging Face agents), **Haystack** (RAG/QA pipelines), **LlamaIndex** (ingest, index and query your data). Local LLMs: **Ollama** (CLI + API server), **LM Studio** (GUI), **text-generation-webui**; all largely built on **llama.cpp** (Part 17 §17.7).

---

## 21.7 Retrieval-Augmented Generation (RAG) — the enterprise workhorse 🟢 ⭐

> [!info] 📖 Géron Ch. 15 · “From a Chatbot Model to a Full Chatbot System” · pp. 633–639 (RAG is extended here beyond the book)

![A production RAG pipeline: offline indexing plus online retrieval, generation and guardrails.](figures/fig21_rag_pipeline.png)
*A production RAG pipeline: offline indexing plus online retrieval, generation and guardrails.*

> [!quote] 💬 Say it in the interview
> “RAG retrieves relevant chunks from our documents and puts them in the prompt, so answers are grounded, current and citable. The hard parts are chunking, retrieval quality (hybrid + reranking) and evaluation.”

RAG (Lewis et al., 2020) grounds answers in **your** documents, reducing hallucination and allowing **citations**, **up-to-date knowledge** and **access control** without retraining.

```
INGEST:  docs (PDF/HTML/DB) → clean → CHUNK (e.g. 300–800 tokens, overlap, keep headings)
         → EMBED (multilingual model) → store vectors + metadata (source, date, ACL)
QUERY:   user question → (rewrite/expand) → embed → RETRIEVE top-k (dense + BM25 hybrid)
         → RERANK (cross-encoder) → build prompt with chunks + instructions to cite
         → LLM answer → (guardrails, citation check) → user
```

**Design decisions interviewers ask about:**
- **Chunking:** too small loses context; too large dilutes relevance and wastes tokens. Use structure-aware chunks (sections, tables).
- **Hybrid retrieval:** dense embeddings for meaning + **BM25** for exact terms (tariff codes, product names, error codes). Part 10 §10.8 predicted this.
- **Reranking** with a cross-encoder boosts precision at small k.
- **Metadata filters** (language, date, product, **user permissions**).
- **Evaluation**, measured separately:
  - Retrieval: **recall@k / MRR / nDCG** on a labelled question set.
  - Generation: **faithfulness/groundedness** (is every claim supported by the retrieved context?), answer relevance, citation accuracy.
  - Tools: **RAGAS**, TruLens, **LLM-as-a-judge** (calibrated against human labels).
- **Failure modes:** a retrieval miss (the answer isn't in the top-k), stale documents, conflicting sources, prompt injection *inside documents*, over-long contexts ("lost in the middle").
- **RAG vs fine-tuning:** use **RAG for knowledge** (facts that change: tariffs, policies) and **fine-tuning for behaviour/format/style** (tone, output schema, domain phrasing). Often combine them.

---

## 21.8 Encoder–decoder models (T5, BART) 🟡

> [!info] 📖 Géron Ch. 15 · “Encoder-Decoder Models” · pp. 639–641

| Model | Idea | Variants / use |
|---|---|---|
| **T5** (Raffel et al., 2019) | **"Text-to-text" for every task** ("translate English to Spanish: …", "summarize: …", "classify: …"); pretrained with **span corruption** (mask contiguous spans) | **mT5** (100+ languages), ByT5 (byte-level, no tokenizer), **FLAN-T5** (instruction-tuned, strong zero/few-shot), UL2 / FLAN-UL2 (mixed objectives) |
| **BART** (Meta, 2020) | A denoising autoencoder (masking, deletion, infilling, sentence shuffling) | Strong for **summarisation**; mBART is multilingual |

Encoder–decoders remain strong for translation and summarisation at a given size, and are common in vision (detection), multimodal models (Part 22) and speech (**Whisper**).

---

## 21.9 Making transformers fast and cheap (Chapter 17 topics, online) 🔴

> [!info] 📖 Géron Ch. 17 · online chapter (homl.info) — speeding up transformers

| Technique | What it does | Where you meet it |
|---|---|---|
| **KV cache** | Store past keys and values in decoding; each new token costs O(L) instead of recomputing everything | Every LLM server. Memory grows with context × batch |
| **FlashAttention** (Dao et al., 2022→) | IO-aware exact attention: tiles in fast on-chip SRAM, never materialises the L×L matrix. Much faster and uses far less memory | Built into PyTorch SDPA and inference engines |
| **Multi-query / grouped-query attention (MQA/GQA)** | Heads share K/V projections, so the KV cache shrinks by up to h× | Llama 2/3, Mistral |
| **Sliding-window / sparse attention** | Attend to a local window (+ global tokens) instead of all tokens | Mistral, Longformer, BigBird |
| **Long-context position tricks** | RoPE scaling (NTK, YaRN) to extend context | 128k–1M+ token contexts |
| **Mixture of Experts (MoE)** | Many FFN "experts"; a router activates only a few per token, so total parameters ≫ active parameters | Mixtral, DeepSeek-V3, many frontier models |
| **Speculative decoding** | A small draft model proposes tokens; the big model verifies several at once | 2–3× faster generation with no quality change |
| **Continuous batching + PagedAttention** | Server-side batching of variable requests; the KV cache managed like OS pages | **vLLM**, TGI, SGLang, TensorRT-LLM |
| **Quantisation** | 8/4-bit weights (GPTQ, AWQ, NF4, GGUF) | Part 17 §17.7 |
| **Distillation** | Small student from a big teacher (DistilBERT; distilled reasoning models) | Deploying cheaply |
| **PEFT: LoRA / QLoRA / adapters** | Freeze the base; learn a **low-rank update** ΔW = B·A (rank r ≪ d) in attention and FFN layers. Train ~0.1–1% of the parameters; swap adapters per task | The default way to fine-tune LLMs |
| **Sequence packing** | Concatenate several short training examples into one full-length sequence (with attention masks so they don't see each other) instead of padding | Far less compute wasted on padding in SFT |
| **Gradient accumulation** | Sum gradients over k micro-batches before each optimiser step | A large effective batch size on small GPUs |
| **Parallelism** | **Data parallel** (DDP: a model copy per GPU), **FSDP / ZeRO** (shard parameters, gradients and optimiser states), **tensor parallel** (split matrices across GPUs), **pipeline parallel** (split layers) | Training and serving models that don't fit on one GPU |
| **Approximate / linear attention** | Low-rank or kernel approximations of softmax attention (Linformer, Performer) | Mostly research; exact FlashAttention usually wins in practice |

```python
from peft import LoraConfig, get_peft_model
config = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, task_type="CAUSAL_LM",
                    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"])
model = get_peft_model(base_model, config)     # add a 4-bit base (BitsAndBytesConfig) = QLoRA
model.print_trainable_parameters()             # e.g. "trainable params: 0.2% of all"
```

**State-space models** (Mamba and others, in Géron's online SSM chapter) offer linear-time alternatives for very long sequences. Hybrids combine them with attention (Part 19 §19.6).

---

## 21.10 🔭 The LLM landscape and practices in 2025–26 🟡

- **Model choice is a trade-off** between quality, latency, cost, context length, privacy, licence and language coverage. Options:
  - **Proprietary APIs** (OpenAI GPT, Anthropic Claude, Google Gemini).
  - **Open-weight models** (Meta **Llama**, Alibaba **Qwen**, **DeepSeek**, **Mistral**, Google **Gemma**, OpenAI **GPT-OSS**, Ai2 **OLMo** (fully open: data and code)).
  - Watch licences: some "open" models restrict commercial use.
- **Arabic and regional LLMs:** **Jais** (UAE, Inception/MBZUAI/Cerebras, 2023), **Falcon** (UAE, TII), **ALLaM** (Saudi SDAIA), **Fanar** (Qatar). Multilingual models (Qwen, Llama, Gemma, GPT, Claude) are also increasingly strong in Arabic. **Always evaluate on *Egyptian* dialect and Franco-Arabic samples from your own domain**, since MSA benchmarks overstate dialect performance.
- **Agents in production:** tool-using agents for support, coding and analytics; MCP for integration; **evaluation harnesses** and **observability** (traces of prompts, tool calls, costs; e.g. LangSmith, Langfuse, Arize Phoenix).
- **LLM evaluation:** public benchmarks (MMLU-style knowledge, maths, coding, and multilingual/Arabic sets) are a starting point only. Build **task-specific eval sets** with graded examples, use **LLM-as-judge** with rubrics (validated against humans), and run A/B tests with real users (Part 15).
- **Security and safety:** the **OWASP Top 10 for LLM Applications** (prompt injection, including *indirect* injection via retrieved documents or web pages; sensitive information disclosure; excessive agency; insecure output handling; supply chain). Mitigations: least-privilege tools, human approval for actions, output validation, guardrail models, PII redaction, audit logs.
- **Governance:** data residency and privacy laws (e.g. **Egypt's Personal Data Protection Law No. 151 of 2020**), sector regulators (NTRA), and model risk management for customer-facing AI. Keep customer data inside approved environments; prefer self-hosted or regionally hosted models for sensitive workloads.

---

## 21.11 Real-world examples 🟡

| Example | Technique | Lesson |
|---|---|---|
| **Google Search + BERT (2019)** | Encoder understanding of queries | Better understanding of long, conversational queries |
| **ChatGPT (Nov 2022)** | GPT-3.5 + SFT + RLHF + chat product | ~1M users in 5 days, 100M monthly users in ~2 months (Géron) |
| **Google's LaMDA** | Chatbot kept internal | Reputational and safety risk shaped who launched first |
| **GitHub Copilot** | Code LLM in the IDE | Tool integration and latency matter as much as the model |
| **Klarna AI assistant (2024)** | LLM customer-service assistant | The company reported it handled the work of hundreds of agents; also a reminder to measure quality and customer satisfaction, not just deflection |
| **Air Canada chatbot ruling (2024)** | A chatbot gave wrong refund-policy information | A tribunal held the airline responsible, so **grounding (RAG) and guardrails are legal necessities** |
| **Morgan Stanley wealth assistant** | RAG over internal research | Enterprise RAG with evaluation before rollout |
| **Telecom (e&-relevant)** | **Customer-care assistant** (Arabic/English, WhatsApp/app) answering tariff, bundle and roaming questions via RAG over product docs, with **tool calls** to check balance or bundle status (read-only) and hand-off to humans; **agent-assist** (suggested replies, ticket summaries, next-best-action); **network-ops copilot** (text-to-SQL over KPI tables, alarm summarisation, runbook retrieval); **B2B pre-sales assistant** for e& enterprise solutions; **contract and RFP analysis** (extraction, comparison) | RAG + tools + MCP, evaluation on dialect data, PII protection, human approval for account-changing actions, cost and latency budgets |

---

> [!check] ✅ Key takeaways
> - Self-attention: softmax(QKᵀ/√dₖ)·V, in several heads, stacked with MLPs, residuals and layer norm.
> - Encoder-only (BERT) understands, decoder-only (GPT) generates, encoder–decoder (T5) maps text to text.
> - Chat models are built by pretraining → SFT → preference tuning (RLHF/DPO) → RL for reasoning.
> - RAG grounds answers in your documents; quality hinges on chunking, hybrid retrieval, reranking and evaluation.
> - Choose prompting → RAG → fine-tuning (LoRA) in that order of cost.
> - Serving cost is about memory: KV cache, quantisation, batching (vLLM).

## 21.12 Interview drill — transformers and LLMs (Géron Ch. 15 exercises, answered) 🟡 ⭐

> [!info] 📖 Géron Ch. 15 · Exercises · p. 641

**1. The most important layer in the Transformer, and its purpose?** Multi-head attention. It lets each token gather information from all other relevant tokens (self-attention), or the decoder look up encoder outputs (cross-attention), across several learned subspaces in parallel.

**2. Why positional encodings?** Attention and FFNs are permutation-invariant, so without position information word order is lost. Encodings inject absolute (learned, sinusoidal) or relative (RoPE, ALiBi) position.

**3. What is each family best at?** Encoder-only: understanding and embeddings (classification, NER, extractive QA, search). Decoder-only: generation, chat, code, few-shot everything. Encoder–decoder: transduction (translation, summarisation, speech to text).

**4. The main technique used to pretrain BERT?** Masked language modelling (15% of tokens: 80% [MASK], 10% random, 10% unchanged). NSP was the secondary task, later dropped.

**5. Four BERT variants and their benefits?** RoBERTa (more data, dynamic masking, no NSP, so better); DistilBERT (distilled: 40% smaller, 60% faster, ~97% of the quality); ALBERT (shared layers + factorised embeddings, so much smaller); ELECTRA (replaced-token detection, so sample-efficient); DeBERTa (disentangled attention, top NLU).

**6. The main task for pretraining GPT models?** Next-token prediction (causal language modelling).

**7. `do_sample`, `top_k`, `top_p`, `temperature`, `num_beams`?** Sampling instead of greedy; sample only from the k most likely tokens; sample from the smallest set with cumulative probability ≥ p; flatten (>1) or sharpen (<1) the distribution; beam-search width.

**8. What is prompt engineering? Five techniques?** Designing inputs to reliably get the desired behaviour: role or context, few-shot examples, explicit output format, prompt chaining, chain-of-thought (+ self-consistency), tree-of-thoughts, self-refine, RAG context injection.

**9. Steps to build a chatbot from a pretrained decoder?** SFT on instructions and dialogues (with loss masking) → preference optimisation (RLHF with PPO, or DPO) → deploy in a system with an orchestrator, chat template, tools (RAG, search, calculator, memory), guardrails, monitoring. Or start from an instruct model.

**10. How does a chatbot use tools?** Either the orchestrator detects the need and injects tool results into the prompt, or the model is fine-tuned to emit structured tool calls that the orchestrator executes, feeding the results back for the final answer.

**11. What is MCP for?** A standard protocol for connecting LLM applications to tools and data sources through servers, with stateful connections and self-describing capabilities, so tools are plug-and-play across apps.

**Frequently asked beyond the book:**
- **"Explain self-attention to a non-technical manager."** Each word looks at all the other words and decides which ones help it understand its meaning in this sentence, like highlighting the relevant parts of a document before answering.
- **"Why √d_k?"** It keeps the dot-product variance stable, so the softmax doesn't saturate and gradients don't vanish.
- **"Complexity of attention, and how to handle long documents?"** O(L²) time and memory. FlashAttention, sparse or sliding windows, chunking + RAG, long-context models, summarise-then-answer.
- **"Fine-tune or RAG or prompt?"** Prompt first (cheapest). **RAG for knowledge that changes or must be cited.** **Fine-tune (LoRA) for consistent format, style or domain behaviour**, or to shrink to a smaller model. Combine as needed.
- **"How do you evaluate an LLM feature?"** A task-specific test set with rubrics; automatic metrics (exact match, F1, faithfulness) plus LLM-as-judge validated against humans; red-teaming for safety; online A/B tests with business KPIs (resolution rate, CSAT, handle time) and guardrail metrics.
- **"How do you reduce hallucinations?"** RAG with citations, instructions to say "I don't know", constrained outputs, verification or tool use for facts and maths, lower temperature, post-hoc groundedness checks.
- **"What is prompt injection and how do you defend against it?"** Malicious instructions in user input or retrieved content that override the system's intent. Defences: privilege separation, never give the model more authority than the user, treat retrieved content as data, validate outputs, human approval for actions, detection classifiers.
- **"LoRA in one sentence?"** Freeze the pretrained weights and learn a low-rank update BA for selected matrices, cutting trainable parameters and memory by orders of magnitude with near full-fine-tuning quality.
- **"KV cache?"** Caching the keys and values of past tokens during autoregressive decoding, so each new token only needs attention against the cache: it trades memory for speed.

---

## Further reading and sources

**Book:** Géron Ch. 15 + notebook; **Chapter 17 "Speeding Up Transformers" and the SSM chapter at https://homl.info**. Exercises 12–15: fine-tune BERT on IMDb, GPT-2 on Shakespeare, SBERT movie search, a movie-expert chatbot with RAG.

**Papers:** Vaswani et al. (2017) · Devlin et al. (2018) BERT · Radford et al. (2018,
2019) GPT-1/2 · Brown et al. (2020) GPT-3 · Raffel et al. (2019) T5 · Lewis et al. (2019) BART · Reimers & Gurevych (2019) SBERT · Sanh et al. (2019) DistilBERT · Clark et al. (2020) ELECTRA · He et al. (2021) DeBERTa · Kaplan et al. (2020) and Hoffmann et al. (2022, Chinchilla) scaling laws · Wei et al. (2022) CoT · Ouyang et al. (2022) InstructGPT · Rafailov et al. (2023) DPO · Lewis et al. (2020) RAG · Hu et al. (2021) **LoRA** · Dettmers et al. (2023) QLoRA · Dao et al. (2022) FlashAttention · Su et al. (2021) RoPE · DeepSeek-AI (2025) **DeepSeek-R1**.

**Courses and guides:**
- **Andrej Karpathy, "Let's build GPT: from scratch, in code"** and "Let's reproduce GPT-2" (YouTube), plus **nanoGPT**. The best way to truly understand a decoder.
- **Jay Alammar, *The Illustrated Transformer*** and ***The Illustrated GPT-2***.
- **Hugging Face LLM Course**, and the **TRL** and **PEFT** documentation.
- **Sebastian Raschka, *Build a Large Language Model (From Scratch)*** (Manning, 2024).
- **Chip Huyen, *AI Engineering*** (O'Reilly, 2025): evaluation, RAG, agents, deployment of foundation-model applications; ideal next to this part.
- **Anthropic and OpenAI prompt-engineering guides**; the **Model Context Protocol docs** (modelcontextprotocol.io).
- **OWASP Top 10 for LLM Applications**.

---

<!-- nav -->
> [!example] 🧭 Step 20 of 26 · Stage 6 of 7: Modern AI
> ← [Part 20 · NLP + attention](20_NLP_RNNs_HuggingFace_and_Attention.md) · [Part 22 · ViT & multimodal](22_Vision_and_Multimodal_Transformers.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
