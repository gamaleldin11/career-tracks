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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 226" role="img" aria-label="Scaled dot-product attention for the token bank: dot products with every key, scaled and softmaxed into weights, a weighted sum of values dominated by river, and the causal mask used by decoders">
<rect class="sB" x="110" y="20" width="80" height="28" rx="6"/><text class="sT" x="150" y="39" text-anchor="middle">the</text>
<rect class="sA" x="220" y="20" width="80" height="28" rx="6"/><text class="sT" x="260" y="39" text-anchor="middle">bank</text>
<rect class="sB" x="330" y="20" width="80" height="28" rx="6"/><text class="sT" x="370" y="39" text-anchor="middle">of</text>
<rect class="sB" x="440" y="20" width="80" height="28" rx="6"/><text class="sT" x="480" y="39" text-anchor="middle">the</text>
<rect class="sB" x="550" y="20" width="80" height="28" rx="6"/><text class="sT" x="590" y="39" text-anchor="middle">river</text>
<text class="sC" x="80" y="39" text-anchor="end">tokens</text>
<g data-s="1-1"><text class="sC" x="360" y="76" text-anchor="middle">each token makes a query q, a key k and a value v (learned projections)</text><text class="sM" x="150" y="112" text-anchor="middle">q · k · v</text><text class="sM" x="260" y="112" text-anchor="middle">q · k · v</text><text class="sM" x="370" y="112" text-anchor="middle">q · k · v</text><text class="sM" x="480" y="112" text-anchor="middle">q · k · v</text><text class="sM" x="590" y="112" text-anchor="middle">q · k · v</text><text class="sGt" x="260" y="134" text-anchor="middle">query: "bank"</text></g>
<g data-s="2-2"><text class="sC" x="80" y="120" text-anchor="end">q(bank) · k</text><rect class="sV" x="128" y="145.385" width="44" height="4.61538" rx="3"/><text class="sC" x="150" y="139.385" text-anchor="middle">0.2</text><rect class="sV" x="238" y="103.846" width="44" height="46.1538" rx="3"/><text class="sC" x="260" y="97.8462" text-anchor="middle">2.0</text><rect class="sV" x="348" y="147.692" width="44" height="2.30769" rx="3"/><text class="sC" x="370" y="141.692" text-anchor="middle">0.1</text><rect class="sV" x="458" y="145.385" width="44" height="4.61538" rx="3"/><text class="sC" x="480" y="139.385" text-anchor="middle">0.2</text><rect class="sV" x="568" y="90" width="44" height="60" rx="3"/><text class="sC" x="590" y="84" text-anchor="middle">2.6</text><line class="sLm" x1="100" y1="150" x2="680" y2="150"/><text class="sC" x="360" y="176" text-anchor="middle">dot products: how relevant is each token to "bank"?</text></g>
<g data-s="3-3"><text class="sC" x="80" y="120" text-anchor="end">softmax(÷√d)</text><rect class="sG" x="128" y="131.928" width="44" height="18.0717" rx="3"/><text class="sC" x="150" y="125.928" text-anchor="middle">0.11</text><rect class="sG" x="238" y="105.551" width="44" height="44.4491" rx="3"/><text class="sC" x="260" y="99.5509" text-anchor="middle">0.28</text><rect class="sG" x="348" y="132.81" width="44" height="17.1903" rx="3"/><text class="sC" x="370" y="126.81" text-anchor="middle">0.11</text><rect class="sG" x="458" y="131.928" width="44" height="18.0717" rx="3"/><text class="sC" x="480" y="125.928" text-anchor="middle">0.11</text><rect class="sG" x="568" y="90" width="44" height="60" rx="3"/><text class="sC" x="590" y="84" text-anchor="middle">0.38</text><line class="sLm" x1="100" y1="150" x2="680" y2="150"/><text class="sC" x="360" y="176" text-anchor="middle">divide by √4 = 2, softmax: weights sum to 1</text></g>
<g data-s="4-4"><text class="sC" x="80" y="120" text-anchor="end">weights</text><rect class="sG" x="128" y="131.928" width="44" height="18.0717" rx="3"/><text class="sC" x="150" y="125.928" text-anchor="middle">0.11</text><rect class="sG" x="238" y="105.551" width="44" height="44.4491" rx="3"/><text class="sC" x="260" y="99.5509" text-anchor="middle">0.28</text><rect class="sG" x="348" y="132.81" width="44" height="17.1903" rx="3"/><text class="sC" x="370" y="126.81" text-anchor="middle">0.11</text><rect class="sG" x="458" y="131.928" width="44" height="18.0717" rx="3"/><text class="sC" x="480" y="125.928" text-anchor="middle">0.11</text><rect class="sG" x="568" y="90" width="44" height="60" rx="3"/><text class="sC" x="590" y="84" text-anchor="middle">0.38</text><line class="sLm" x1="100" y1="150" x2="680" y2="150"/><rect class="sA" x="200" y="186" width="320" height="30" rx="6"/><text class="sC" x="360" y="206" text-anchor="middle">output(bank) = 0.28·v(bank) + 0.38·v(river) + …</text></g>
<g data-s="5-5"><text class="sC" x="360" y="76" text-anchor="middle">causal mask (decoders): token i may only look at tokens ≤ i</text><rect class="sG" x="260" y="90" width="24" height="20" rx="2"/><rect class="sR" x="286" y="90" width="24" height="20" rx="2" opacity=".35"/><rect class="sR" x="312" y="90" width="24" height="20" rx="2" opacity=".35"/><rect class="sR" x="338" y="90" width="24" height="20" rx="2" opacity=".35"/><rect class="sR" x="364" y="90" width="24" height="20" rx="2" opacity=".35"/><rect class="sG" x="260" y="112" width="24" height="20" rx="2"/><rect class="sG" x="286" y="112" width="24" height="20" rx="2"/><rect class="sR" x="312" y="112" width="24" height="20" rx="2" opacity=".35"/><rect class="sR" x="338" y="112" width="24" height="20" rx="2" opacity=".35"/><rect class="sR" x="364" y="112" width="24" height="20" rx="2" opacity=".35"/><rect class="sG" x="260" y="134" width="24" height="20" rx="2"/><rect class="sG" x="286" y="134" width="24" height="20" rx="2"/><rect class="sG" x="312" y="134" width="24" height="20" rx="2"/><rect class="sR" x="338" y="134" width="24" height="20" rx="2" opacity=".35"/><rect class="sR" x="364" y="134" width="24" height="20" rx="2" opacity=".35"/><rect class="sG" x="260" y="156" width="24" height="20" rx="2"/><rect class="sG" x="286" y="156" width="24" height="20" rx="2"/><rect class="sG" x="312" y="156" width="24" height="20" rx="2"/><rect class="sG" x="338" y="156" width="24" height="20" rx="2"/><rect class="sR" x="364" y="156" width="24" height="20" rx="2" opacity=".35"/><rect class="sG" x="260" y="178" width="24" height="20" rx="2"/><rect class="sG" x="286" y="178" width="24" height="20" rx="2"/><rect class="sG" x="312" y="178" width="24" height="20" rx="2"/><rect class="sG" x="338" y="178" width="24" height="20" rx="2"/><rect class="sG" x="364" y="178" width="24" height="20" rx="2"/><text class="sC" x="250" y="104" text-anchor="end">query</text><text class="sC" x="395" y="214" text-anchor="middle">keys (red = −∞ before softmax → weight 0)</text></g>
</svg><ol class="dia-steps">
<li>Every token is projected into three vectors: a <b>query</b> (what am I looking for?), a <b>key</b> (what do I offer?) and a <b>value</b> (what I pass on). Follow the query of "bank".</li>
<li>Its query is compared with every key by a dot product. "river" scores highest: this is the bank of a river, not a money bank.</li>
<li>Scores are divided by √d<sub>k</sub> (here 2) to keep the softmax from saturating, then softmaxed into weights that sum to 1. Computed values: river 0.38, bank 0.28.</li>
<li>The new representation of "bank" is the weighted sum of all values: mostly itself and "river". Context has been mixed in.</li>
<li>In a decoder, a causal mask sets scores for future tokens to −∞, so after the softmax their weight is exactly 0. Each head does all of this in parallel, with its own projections.</li>
</ol><figcaption>One attention head for one query, with real numbers. Attention(Q, K, V) = softmax(QKᵀ/√d<sub>k</sub>) V does this for every token at once.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Attention patterns of the three transformer families: encoder-only models attend in all directions, decoder-only models use a causal lower-triangular pattern, and encoder-decoders add cross-attention from the decoder to the encoder">
<text class="sT" x="120" y="22" text-anchor="middle">encoder-only (BERT)</text><text class="sC" x="120" y="40" text-anchor="middle">every token sees every token</text>
<rect class="sA" x="48" y="56" width="22" height="22" rx="2"/>
<rect class="sA" x="72" y="56" width="22" height="22" rx="2"/>
<rect class="sA" x="96" y="56" width="22" height="22" rx="2"/>
<rect class="sA" x="120" y="56" width="22" height="22" rx="2"/>
<rect class="sA" x="144" y="56" width="22" height="22" rx="2"/>
<rect class="sA" x="168" y="56" width="22" height="22" rx="2"/>
<rect class="sA" x="48" y="80" width="22" height="22" rx="2"/>
<rect class="sA" x="72" y="80" width="22" height="22" rx="2"/>
<rect class="sA" x="96" y="80" width="22" height="22" rx="2"/>
<rect class="sA" x="120" y="80" width="22" height="22" rx="2"/>
<rect class="sA" x="144" y="80" width="22" height="22" rx="2"/>
<rect class="sA" x="168" y="80" width="22" height="22" rx="2"/>
<rect class="sA" x="48" y="104" width="22" height="22" rx="2"/>
<rect class="sA" x="72" y="104" width="22" height="22" rx="2"/>
<rect class="sA" x="96" y="104" width="22" height="22" rx="2"/>
<rect class="sA" x="120" y="104" width="22" height="22" rx="2"/>
<rect class="sA" x="144" y="104" width="22" height="22" rx="2"/>
<rect class="sA" x="168" y="104" width="22" height="22" rx="2"/>
<rect class="sA" x="48" y="128" width="22" height="22" rx="2"/>
<rect class="sA" x="72" y="128" width="22" height="22" rx="2"/>
<rect class="sA" x="96" y="128" width="22" height="22" rx="2"/>
<rect class="sA" x="120" y="128" width="22" height="22" rx="2"/>
<rect class="sA" x="144" y="128" width="22" height="22" rx="2"/>
<rect class="sA" x="168" y="128" width="22" height="22" rx="2"/>
<rect class="sA" x="48" y="152" width="22" height="22" rx="2"/>
<rect class="sA" x="72" y="152" width="22" height="22" rx="2"/>
<rect class="sA" x="96" y="152" width="22" height="22" rx="2"/>
<rect class="sA" x="120" y="152" width="22" height="22" rx="2"/>
<rect class="sA" x="144" y="152" width="22" height="22" rx="2"/>
<rect class="sA" x="168" y="152" width="22" height="22" rx="2"/>
<rect class="sA" x="48" y="176" width="22" height="22" rx="2"/>
<rect class="sA" x="72" y="176" width="22" height="22" rx="2"/>
<rect class="sA" x="96" y="176" width="22" height="22" rx="2"/>
<rect class="sA" x="120" y="176" width="22" height="22" rx="2"/>
<rect class="sA" x="144" y="176" width="22" height="22" rx="2"/>
<rect class="sA" x="168" y="176" width="22" height="22" rx="2"/>
<text class="sC" x="120" y="214" text-anchor="middle">understanding, embeddings</text>
<text class="sT" x="356" y="22" text-anchor="middle">decoder-only (GPT)</text><text class="sC" x="356" y="40" text-anchor="middle">each token sees only the past</text>
<rect class="sG" x="284" y="56" width="22" height="22" rx="2"/>
<rect class="sN" x="308" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="332" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="356" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="380" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="404" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="284" y="80" width="22" height="22" rx="2"/>
<rect class="sG" x="308" y="80" width="22" height="22" rx="2"/>
<rect class="sN" x="332" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="356" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="380" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="404" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="284" y="104" width="22" height="22" rx="2"/>
<rect class="sG" x="308" y="104" width="22" height="22" rx="2"/>
<rect class="sG" x="332" y="104" width="22" height="22" rx="2"/>
<rect class="sN" x="356" y="104" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="380" y="104" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="404" y="104" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="284" y="128" width="22" height="22" rx="2"/>
<rect class="sG" x="308" y="128" width="22" height="22" rx="2"/>
<rect class="sG" x="332" y="128" width="22" height="22" rx="2"/>
<rect class="sG" x="356" y="128" width="22" height="22" rx="2"/>
<rect class="sN" x="380" y="128" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="404" y="128" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="284" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="308" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="332" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="356" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="380" y="152" width="22" height="22" rx="2"/>
<rect class="sN" x="404" y="152" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="284" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="308" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="332" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="356" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="380" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="404" y="176" width="22" height="22" rx="2"/>
<text class="sC" x="356" y="214" text-anchor="middle">generation, chat, code</text>
<text class="sT" x="592" y="22" text-anchor="middle">encoder–decoder (T5)</text><text class="sC" x="592" y="40" text-anchor="middle">decoder: causal + cross-attention</text>
<rect class="sG" x="520" y="56" width="22" height="22" rx="2"/>
<rect class="sN" x="544" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="568" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="592" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="616" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="640" y="56" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="520" y="80" width="22" height="22" rx="2"/>
<rect class="sG" x="544" y="80" width="22" height="22" rx="2"/>
<rect class="sN" x="568" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="592" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="616" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="640" y="80" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="520" y="104" width="22" height="22" rx="2"/>
<rect class="sG" x="544" y="104" width="22" height="22" rx="2"/>
<rect class="sG" x="568" y="104" width="22" height="22" rx="2"/>
<rect class="sN" x="592" y="104" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="616" y="104" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="640" y="104" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="520" y="128" width="22" height="22" rx="2"/>
<rect class="sG" x="544" y="128" width="22" height="22" rx="2"/>
<rect class="sG" x="568" y="128" width="22" height="22" rx="2"/>
<rect class="sG" x="592" y="128" width="22" height="22" rx="2"/>
<rect class="sN" x="616" y="128" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sN" x="640" y="128" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="520" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="544" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="568" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="592" y="152" width="22" height="22" rx="2"/>
<rect class="sG" x="616" y="152" width="22" height="22" rx="2"/>
<rect class="sN" x="640" y="152" width="22" height="22" rx="2" opacity=".4"/>
<rect class="sG" x="520" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="544" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="568" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="592" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="616" y="176" width="22" height="22" rx="2"/>
<rect class="sG" x="640" y="176" width="22" height="22" rx="2"/>
<text class="sC" x="592" y="214" text-anchor="middle">+ cross-attention: every decoder</text><text class="sC" x="592" y="230" text-anchor="middle">token reads all encoder outputs</text>
</svg><figcaption>The families differ mainly in who may attend to whom. Rows are queries, columns are keys.</figcaption></figure>

**Why decoders generate faster than encoders:** causal attention means earlier tokens' keys and values never change, so they can be **cached** (the KV cache, §21.9) and only the new token is computed. Bidirectional encoders would have to recompute everything for each new token.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 190" role="img" aria-label="Autoregressive decoding: after the prompt Cairo is the, the model generates capital, of, Egypt one token at a time, reusing cached keys and values of earlier tokens and computing only the newest">
<rect class="sB" x="40" y="40" width="90" height="30" rx="6"/><text class="sT" x="85" y="60" text-anchor="middle">Cairo</text>
<rect class="sB" x="140" y="40" width="90" height="30" rx="6"/><text class="sT" x="185" y="60" text-anchor="middle">is</text>
<rect class="sB" x="240" y="40" width="90" height="30" rx="6"/><text class="sT" x="285" y="60" text-anchor="middle">the</text>
<text class="sC" x="40" y="28">prompt</text>
<g data-s="1"><rect class="sG" x="340" y="40" width="90" height="30" rx="6"/><text class="sT" x="385" y="60" text-anchor="middle">capital</text><line class="sLg" x1="285" y1="100" x2="385" y2="76" marker-end="url(#ahg)"/></g>
<g data-s="1-1"><rect class="sV" x="40" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="85" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="140" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="185" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="240" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="285" y="125" text-anchor="middle">K,V cached</text><rect class="sW" x="340" y="110" width="90" height="22" rx="4"/><text class="sC" x="385" y="125" text-anchor="middle">compute new</text><text class="sC" x="360" y="170" text-anchor="middle">step 1: only the newest token is computed; 3 earlier tokens are reused from the cache</text></g>
<g data-s="2"><rect class="sG" x="440" y="40" width="90" height="30" rx="6"/><text class="sT" x="485" y="60" text-anchor="middle">of</text><line class="sLg" x1="385" y1="100" x2="485" y2="76" marker-end="url(#ahg)"/></g>
<g data-s="2-2"><rect class="sV" x="40" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="85" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="140" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="185" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="240" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="285" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="340" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="385" y="125" text-anchor="middle">K,V cached</text><rect class="sW" x="440" y="110" width="90" height="22" rx="4"/><text class="sC" x="485" y="125" text-anchor="middle">compute new</text><text class="sC" x="360" y="170" text-anchor="middle">step 2: only the newest token is computed; 4 earlier tokens are reused from the cache</text></g>
<g data-s="3"><rect class="sG" x="540" y="40" width="90" height="30" rx="6"/><text class="sT" x="585" y="60" text-anchor="middle">Egypt</text><line class="sLg" x1="485" y1="100" x2="585" y2="76" marker-end="url(#ahg)"/></g>
<g data-s="3-3"><rect class="sV" x="40" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="85" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="140" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="185" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="240" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="285" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="340" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="385" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="440" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="485" y="125" text-anchor="middle">K,V cached</text><rect class="sW" x="540" y="110" width="90" height="22" rx="4"/><text class="sC" x="585" y="125" text-anchor="middle">compute new</text><text class="sC" x="360" y="170" text-anchor="middle">step 3: only the newest token is computed; 5 earlier tokens are reused from the cache</text></g>
<g data-s="4-4"><rect class="sV" x="40" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="85" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="140" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="185" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="240" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="285" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="340" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="385" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="440" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="485" y="125" text-anchor="middle">K,V cached</text><rect class="sV" x="540" y="110" width="90" height="22" rx="4" opacity=".7"/><text class="sC" x="585" y="125" text-anchor="middle">K,V cached</text><text class="sWt" x="360" y="170" text-anchor="middle">the cache grows with every token: long contexts cost memory, not just compute</text></g>
</svg><ol class="dia-steps">
<li>Generation is one token at a time. After the prompt, the model predicts "capital"; the keys and values of the prompt tokens are stored in the KV cache.</li>
<li>"capital" is appended and becomes input. Only its keys and values are new; everything before is read from the cache.</li>
<li>Again for "Egypt". Without the cache, each step would recompute attention over the whole sequence from scratch.</li>
<li>The price: cache memory grows with sequence length × layers × heads. That's why serving long contexts is a memory problem (GQA, PagedAttention, quantised caches).</li>
</ol><figcaption>Why decoder-only models serve efficiently, and why their cost is dominated by KV-cache memory.</figcaption></figure>

---

## 21.3 Encoder-only models: BERT and its family 🟡

> [!info] 📖 Géron Ch. 15 · “Encoder-Only Transformers for NLU” · pp. 594–609

**BERT** (Devlin et al., 2018): the Transformer encoder, bigger (base: 12 blocks, 12 heads, d = 768; large: 24 / 16 / 1024), with **pre-LN** (normalise *before* each sub-layer; more stable than the original post-LN), **segment embeddings** for sentence pairs (with `[SEP]`), and a max length of 512 tokens.

**Pretraining:**
- **Masked language modelling (MLM)**, a "cloze" task: 15% of tokens are selected. Of those, **80% become [MASK], 10% become a random token, and 10% stay unchanged**, so the model can't rely on [MASK] always being present (it never appears at fine-tuning time) and has to attend to the token at the predicted position. The loss is computed only on the selected tokens.
- **Next-sentence prediction (NSP)** on the **[CLS]** token. It was later found to help little and was dropped by most successors. Mean-pooling the token embeddings gives better sentence embeddings than [CLS].
- Trained for ~4 days on 16 TPUs over Wikipedia + BooksCorpus. **Géron's lesson: don't pretrain from scratch unless you must.** Start from a checkpoint close to your domain and continue MLM pretraining on your corpus ("domain-adaptive pretraining") if needed.

<figure class="dia steps"><svg viewBox="0 0 720 256" role="img" aria-label="Masked language modelling: of the selected tokens, internet becomes [MASK], slow becomes a random word and cairo stays unchanged; the encoder reads the whole sentence in both directions and is trained to predict the original word only at the selected positions">
<rect class="sN" x="18" y="30" width="58" height="26" rx="4"/><text class="sC" x="47" y="47" text-anchor="middle">[CLS]</text>
<rect class="sN" x="81" y="30" width="58" height="26" rx="4"/><text class="sC" x="110" y="47" text-anchor="middle">my</text>
<rect class="sN" x="144" y="30" width="58" height="26" rx="4"/><text class="sC" x="173" y="47" text-anchor="middle">internet</text>
<rect class="sN" x="207" y="30" width="58" height="26" rx="4"/><text class="sC" x="236" y="47" text-anchor="middle">is</text>
<rect class="sN" x="270" y="30" width="58" height="26" rx="4"/><text class="sC" x="299" y="47" text-anchor="middle">very</text>
<rect class="sN" x="333" y="30" width="58" height="26" rx="4"/><text class="sC" x="362" y="47" text-anchor="middle">slow</text>
<rect class="sN" x="396" y="30" width="58" height="26" rx="4"/><text class="sC" x="425" y="47" text-anchor="middle">in</text>
<rect class="sN" x="459" y="30" width="58" height="26" rx="4"/><text class="sC" x="488" y="47" text-anchor="middle">cairo</text>
<rect class="sN" x="522" y="30" width="58" height="26" rx="4"/><text class="sC" x="551" y="47" text-anchor="middle">since</text>
<rect class="sN" x="585" y="30" width="58" height="26" rx="4"/><text class="sC" x="614" y="47" text-anchor="middle">monday</text>
<rect class="sN" x="648" y="30" width="58" height="26" rx="4"/><text class="sC" x="677" y="47" text-anchor="middle">[SEP]</text>
<g data-s="1"><rect class="sA" x="142" y="28" width="62" height="30" rx="5" style="fill:none;stroke-width:2"/><rect class="sA" x="331" y="28" width="62" height="30" rx="5" style="fill:none;stroke-width:2"/><rect class="sA" x="457" y="28" width="62" height="30" rx="5" style="fill:none;stroke-width:2"/><text class="sM" x="14" y="18">selected (15% of tokens in practice; 3 here)</text></g>
<g data-s="2"><line class="sLm" x1="173" y1="60" x2="173" y2="92" marker-end="url(#ahm)"/><rect class="sW" x="144" y="96" width="58" height="26" rx="4"/><text class="sC" x="173" y="113" text-anchor="middle">[MASK]</text><text class="sS" x="173" y="136" text-anchor="middle">80%: [MASK]</text></g>
<g data-s="2"><line class="sLm" x1="362" y1="60" x2="362" y2="92" marker-end="url(#ahm)"/><rect class="sR" x="333" y="96" width="58" height="26" rx="4"/><text class="sC" x="362" y="113" text-anchor="middle">banana</text><text class="sS" x="362" y="136" text-anchor="middle">10%: random</text></g>
<g data-s="2"><line class="sLm" x1="488" y1="60" x2="488" y2="92" marker-end="url(#ahm)"/><rect class="sV" x="459" y="96" width="58" height="26" rx="4"/><text class="sC" x="488" y="113" text-anchor="middle">cairo</text><text class="sS" x="488" y="136" text-anchor="middle">10%: unchanged</text></g>
<g data-s="3"><rect class="sB" x="18" y="150" width="684" height="34" rx="6"/><text class="sT" x="360" y="172" text-anchor="middle">Transformer encoder: every position attends to every other, left and right</text></g>
<g data-s="4"><line class="sLg" x1="173" y1="184" x2="173" y2="204" marker-end="url(#ahg)"/><text class="sGt" x="173" y="220" text-anchor="middle">predict "internet"</text></g>
<g data-s="4"><line class="sLg" x1="362" y1="184" x2="362" y2="204" marker-end="url(#ahg)"/><text class="sGt" x="362" y="220" text-anchor="middle">predict "slow"</text></g>
<g data-s="4"><line class="sLg" x1="488" y1="184" x2="488" y2="204" marker-end="url(#ahg)"/><text class="sGt" x="488" y="220" text-anchor="middle">predict "cairo"</text></g>
<g data-s="4"><text class="sS" x="360" y="244" text-anchor="middle">loss on these 3 positions only; the other 8 are context</text></g>
</svg><ol class="dia-steps">
<li>15% of the tokens are selected for prediction (three in this short sentence).</li>
<li>Of the selected tokens, 80% become [MASK], 10% a random token, 10% stay as they are, so the model cannot learn that only [MASK] positions matter. [MASK] never appears at fine-tuning time.</li>
<li>The encoder reads the corrupted sentence with full bidirectional attention: "slow" can use "cairo" and "monday" as context.</li>
<li>The training loss is cross-entropy for the original token, at the selected positions only.</li>
</ol><figcaption>BERT's pretraining task, a fill-in-the-blanks exam over billions of sentences.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="One pretrained BERT encoder with different heads: a sentence head on the [CLS] token outputs one class, a token head labels every token for named-entity recognition, and a question-answering head scores start and end positions of an answer span">
<rect class="sN" x="120" y="186" width="66" height="24" rx="4"/><text class="sC" x="153" y="203" text-anchor="middle">[CLS]</text>
<line class="sLm" x1="153" y1="186" x2="153" y2="168"/>
<rect class="sN" x="188" y="186" width="66" height="24" rx="4"/><text class="sC" x="221" y="203" text-anchor="middle">recharge</text>
<line class="sLm" x1="221" y1="186" x2="221" y2="168"/>
<rect class="sN" x="256" y="186" width="66" height="24" rx="4"/><text class="sC" x="289" y="203" text-anchor="middle">50</text>
<line class="sLm" x1="289" y1="186" x2="289" y2="168"/>
<rect class="sN" x="324" y="186" width="66" height="24" rx="4"/><text class="sC" x="357" y="203" text-anchor="middle">EGP</text>
<line class="sLm" x1="357" y1="186" x2="357" y2="168"/>
<rect class="sN" x="392" y="186" width="66" height="24" rx="4"/><text class="sC" x="425" y="203" text-anchor="middle">on</text>
<line class="sLm" x1="425" y1="186" x2="425" y2="168"/>
<rect class="sN" x="460" y="186" width="66" height="24" rx="4"/><text class="sC" x="493" y="203" text-anchor="middle">0100…</text>
<line class="sLm" x1="493" y1="186" x2="493" y2="168"/>
<rect class="sN" x="528" y="186" width="66" height="24" rx="4"/><text class="sC" x="561" y="203" text-anchor="middle">[SEP]</text>
<line class="sLm" x1="561" y1="186" x2="561" y2="168"/>
<rect class="sB" x="120" y="130" width="472" height="38" rx="6"/><text class="sT" x="356" y="154" text-anchor="middle">pretrained BERT encoder (shared)</text>
<text class="sM" x="14" y="202">input</text><text class="sM" x="14" y="154">body</text>
<line class="sLm" x1="153" y1="130" x2="153" y2="112"/>
<line class="sLm" x1="221" y1="130" x2="221" y2="112"/>
<line class="sLm" x1="289" y1="130" x2="289" y2="112"/>
<line class="sLm" x1="357" y1="130" x2="357" y2="112"/>
<line class="sLm" x1="425" y1="130" x2="425" y2="112"/>
<line class="sLm" x1="493" y1="130" x2="493" y2="112"/>
<line class="sLm" x1="561" y1="130" x2="561" y2="112"/>
<rect class="sA" x="120" y="76" width="66" height="30" rx="5"/><text class="sC" x="153" y="96" text-anchor="middle">class</text><text class="sM" x="14" y="70">sentence head:</text><text class="sS" x="14" y="86">one label</text>
<line class="sLm" x1="153" y1="76" x2="153" y2="60" marker-end="url(#ahm)"/><text class="sGt" x="153" y="52" text-anchor="middle">"top-up"</text>
<rect class="sV" x="190" y="76" width="62" height="30" rx="5"/><text class="sS" x="221" y="96" text-anchor="middle">O</text>
<rect class="sV" x="258" y="76" width="62" height="30" rx="5"/><text class="sS" x="289" y="96" text-anchor="middle">B-AMT</text>
<rect class="sV" x="326" y="76" width="62" height="30" rx="5"/><text class="sS" x="357" y="96" text-anchor="middle">I-AMT</text>
<rect class="sV" x="394" y="76" width="62" height="30" rx="5"/><text class="sS" x="425" y="96" text-anchor="middle">O</text>
<rect class="sV" x="462" y="76" width="62" height="30" rx="5"/><text class="sS" x="493" y="96" text-anchor="middle">B-MSISDN</text>
<text class="sGt" x="357" y="52" text-anchor="middle">token head: a label per token (NER)</text>
<rect class="sG" x="612" y="76" width="94" height="30" rx="5"/><text class="sS" x="659" y="96" text-anchor="middle">start · end</text><line class="sLm" x1="612" y1="100" x2="592" y2="136"/>
<text class="sGt" x="659" y="52" text-anchor="middle">QA head: span</text>
<text class="sS" x="360" y="236" text-anchor="middle">fine-tuning trains a tiny new head and nudges the encoder; the expensive pretraining is reused</text>
</svg><figcaption>The same encoder, three jobs: what changes is the small layer on top and which positions it reads.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 336" role="img" aria-label="Published model sizes against training tokens on log axes with the compute-optimal line of 20 tokens per parameter: GPT-3 and Gopher sit far below it at about 2 and 1 tokens per parameter, Chinchilla sits on it at 20, Llama 2 70B slightly above at about 29, and Llama 3 trains 70B and 8B models on 15 trillion tokens, about 214 and 1,875 tokens per parameter">
<line class="sLm" x1="70" y1="220" x2="680" y2="220"/><line class="sLm" x1="70" y1="220" x2="70" y2="24"/>
<text class="sS" x="70" y="236" text-anchor="middle">1B</text><line class="sLm" x1="70" y1="24" x2="70" y2="220" opacity=".12"/>
<text class="sS" x="273.333" y="236" text-anchor="middle">10B</text><line class="sLm" x1="273.333" y1="24" x2="273.333" y2="220" opacity=".12"/>
<text class="sS" x="476.667" y="236" text-anchor="middle">100B</text><line class="sLm" x1="476.667" y1="24" x2="476.667" y2="220" opacity=".12"/>
<text class="sS" x="680" y="236" text-anchor="middle">1T</text><line class="sLm" x1="680" y1="24" x2="680" y2="220" opacity=".12"/>
<text class="sS" x="62" y="224" text-anchor="end">100B</text><line class="sLm" x1="70" y1="220" x2="680" y2="220" opacity=".12"/>
<text class="sS" x="62" y="148" text-anchor="end">1T</text><line class="sLm" x1="70" y1="144" x2="680" y2="144" opacity=".12"/>
<text class="sS" x="62" y="72" text-anchor="end">10T</text><line class="sLm" x1="70" y1="68" x2="680" y2="68" opacity=".12"/>
<text class="sS" x="375" y="252" text-anchor="middle">parameters N</text><text class="sS" x="20" y="122" text-anchor="middle" transform="rotate(-90 20 122)">training tokens D</text>
<line class="sLg" x1="212.124" y1="220" x2="680" y2="45.1217" stroke-dasharray="6 4" style="stroke-width:2"/>
<text class="sGt" x="543.876" y="90.2434">D = 20 N</text>
<circle class="sP" cx="526.1" cy="183.7" r="5"/><text class="sS" x="518.084" y="173.739" text-anchor="end">GPT-3 (2020): 2 tok/param</text>
<circle class="sP" cx="567.6" cy="183.7" r="5"/><text class="sS" x="559.589" y="201.739" text-anchor="end">Gopher (2021): 1 tok/param</text>
<circle class="sP" cx="445.2" cy="132.9" r="5"/><text class="sS" x="437.17" y="136.894" text-anchor="end">Chinchilla (2022): 20 tok/param</text>
<circle class="sP" cx="445.2" cy="121.1" r="5"/><text class="sS" x="453.17" y="125.122">Llama 2 70B (2023): 29 tok/param</text>
<circle class="sP" cx="445.2" cy="54.6" r="5"/><text class="sS" x="453.17" y="58.6171">Llama 3 70B (2024): 214 tok/param</text>
<circle class="sP" cx="253.6" cy="54.6" r="5"/><text class="sS" x="245.628" y="58.6171" text-anchor="end">Llama 3 8B (2024): 1875 tok/param</text>
<rect class="sN" x="14" y="266" width="692" height="62" rx="8"/>
<text class="sT" x="24" y="286">compute ≈ 6 · N · D FLOPs</text>
<text class="sS" x="24" y="304">Gopher 5.0e+23 vs Chinchilla 5.9e+23 FLOPs: a similar budget, 4× fewer</text><text class="sGt" x="24" y="320">parameters and 4.7× more data, and Chinchilla won.</text>
<text class="sS" x="696" y="304" text-anchor="end">Llama 3 goes far past 20×: extra training</text><text class="sWt" x="696" y="320" text-anchor="end">buys a smaller model that is cheaper to serve</text>
</svg><figcaption>Under-trained, compute-optimal, then deliberately over-trained: published parameter and token counts against the Chinchilla rule of thumb.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 248" role="img" aria-label="Animation: an agent loop where the LLM plans and emits a tool call, the orchestrator executes it and returns an observation, the LLM re-plans, and a human approves the consequential refund">
<rect class="sB" x="14" y="90" width="120" height="50" rx="8"/><text class="sT" x="74" y="113" text-anchor="middle">user goal</text><text class="sC" x="74" y="129" text-anchor="middle">"refund order 881"</text>
<line class="sL" x1="134" y1="115" x2="196" y2="115" marker-end="url(#ah)"/><rect class="sA" x="200" y="80" width="150" height="70" rx="8"/><text class="sT" x="275" y="113" text-anchor="middle">LLM</text><text class="sC" x="275" y="129" text-anchor="middle">plan · pick a tool</text>
<line class="sL" x1="350" y1="100" x2="436" y2="60" marker-end="url(#ah)"/><rect class="sV" x="440" y="30" width="150" height="50" rx="8"/><text class="sT" x="515" y="53" text-anchor="middle">tool call</text><text class="sC" x="515" y="69" text-anchor="middle">get_order(881)</text>
<line class="sLm" x1="590" y1="55" x2="640" y2="55"/><line class="sLm" x1="640" y1="55" x2="640" y2="160"/><line class="sLm" x1="640" y1="160" x2="594" y2="160" marker-end="url(#ahm)"/>
<rect class="sG" x="440" y="135" width="150" height="50" rx="8"/><text class="sT" x="515" y="158" text-anchor="middle">observation</text><text class="sC" x="515" y="174" text-anchor="middle">paid, 1,200 EGP</text><line class="sLg" x1="440" y1="160" x2="354" y2="130" marker-end="url(#ahg)"/>
<line class="sLw" x1="275" y1="150" x2="275" y2="196" marker-end="url(#ahw)"/><rect class="sW" x="190" y="198" width="170" height="40" rx="8"/><text class="sT" x="275" y="223" text-anchor="middle">human approves refund</text>
<text class="sC" x="648" y="110">your code</text><text class="sC" x="648" y="126">runs it</text>
<circle class="sP" r="5"><animateMotion dur="5s" repeatCount="indefinite" path="M134 115 H200 M350 100 L440 60 M590 55 H640 V160 H590 M440 160 L354 130"/></circle>
<text class="sC" x="520" y="226" text-anchor="middle">loop until done; consequential actions need a person</text>
</svg><figcaption>An agent is an LLM in a loop with tools. The model proposes; your code executes, validates and asks for approval.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="A hybrid retrieval funnel: from 120,000 chunks, BM25 and dense search each return 50, merged to about 80 candidates, reranked by a cross-encoder to the top 5, which go into the prompt">
<rect class="sN" x="14" y="16" width="692" height="36" rx="6"/><text class="sT" x="360" y="32" text-anchor="middle">120,000 chunks</text><text class="sC" x="360" y="47" text-anchor="middle">the indexed knowledge base</text>
<rect class="sB" x="100" y="60" width="520" height="36" rx="6"/><text class="sT" x="360" y="76" text-anchor="middle">BM25 top 50 + dense top 50</text><text class="sC" x="360" y="91" text-anchor="middle">exact terms + meaning</text>
<rect class="sV" x="170" y="104" width="380" height="36" rx="6"/><text class="sT" x="360" y="120" text-anchor="middle">≈ 80 unique candidates</text><text class="sC" x="360" y="135" text-anchor="middle">merged (reciprocal rank fusion)</text>
<rect class="sA" x="240" y="148" width="240" height="36" rx="6"/><text class="sT" x="360" y="164" text-anchor="middle">cross-encoder rerank → top 5</text><text class="sC" x="360" y="179" text-anchor="middle">precise, slower, small k</text>
<rect class="sG" x="180" y="192" width="360" height="36" rx="6"/><text class="sT" x="360" y="208" text-anchor="middle">prompt: question + 5 chunks + rules</text><text class="sC" x="360" y="223" text-anchor="middle">answer with citations</text>
<text class="sC" x="14" y="244">measure retrieval (recall@k) and generation (faithfulness) separately</text>
</svg><figcaption>Recall first, precision second: cheap retrievers cast a wide net, an expensive reranker picks the few that enter the prompt.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="KV cache memory for a batch of eight requests on a Llama-3-8B-shaped model in fp16: with 32 key-value heads it grows from 8 GiB at 2k tokens to 512 GiB at 128k; grouped-query attention with 8 key-value heads needs a quarter of that">
<text class="sM" x="14" y="22">KV cache for a batch of 8 requests, Llama-3-8B shape, fp16</text>
<text class="sT" x="130" y="62" text-anchor="end">2k tokens</text>
<rect class="sR" x="140" y="40" width="215.487" height="15" rx="3" opacity=".75"/><text class="sS" x="361.487" y="52">8.0 GiB</text>
<rect class="sG" x="140" y="58" width="147.315" height="15" rx="3" opacity=".75"/><text class="sS" x="293.315" y="70">2.0 GiB</text>
<text class="sT" x="130" y="106" text-anchor="end">8k tokens</text>
<rect class="sR" x="140" y="84" width="283.658" height="15" rx="3" opacity=".75"/><text class="sS" x="429.658" y="96">32 GiB</text>
<rect class="sG" x="140" y="102" width="215.487" height="15" rx="3" opacity=".75"/><text class="sS" x="361.487" y="114">8.0 GiB</text>
<text class="sT" x="130" y="150" text-anchor="end">32k tokens</text>
<rect class="sR" x="140" y="128" width="351.829" height="15" rx="3" opacity=".75"/><text class="sS" x="497.829" y="140">128 GiB</text>
<rect class="sG" x="140" y="146" width="283.658" height="15" rx="3" opacity=".75"/><text class="sS" x="429.658" y="158">32 GiB</text>
<text class="sT" x="130" y="194" text-anchor="end">128k tokens</text>
<rect class="sR" x="140" y="172" width="420" height="15" rx="3" opacity=".75"/><text class="sS" x="566" y="184">512 GiB</text>
<rect class="sG" x="140" y="190" width="351.829" height="15" rx="3" opacity=".75"/><text class="sS" x="497.829" y="202">128 GiB</text>
<rect class="sR" x="14" y="222" width="12" height="10" rx="2" opacity=".75"/><text class="sS" x="32" y="231">multi-head attention</text><rect class="sG" x="180" y="222" width="12" height="10" rx="2" opacity=".75"/><text class="sS" x="198" y="231">grouped-query attention</text>
<text class="sC" x="706" y="231" text-anchor="end">per token: 512 KiB vs 128 KiB</text>
</svg><figcaption>Why GQA and paged KV caches matter: cache size = 2 × layers × KV heads × head dim × bytes × tokens × batch. Computed; bars on a log scale.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="LoRA keeps a 4096 by 4096 weight matrix frozen and learns two thin matrices, 4096 by 16 and 16 by 4096, whose product is a low-rank update: about 131 thousand trainable parameters instead of 16.8 million, under one percent">
<rect class="sB" x="30" y="40" width="170" height="170" rx="4"/><text class="sT" x="115" y="120" text-anchor="middle">W (frozen)</text><text class="sC" x="115" y="140" text-anchor="middle">4096 × 4096</text><text class="sS" x="115" y="160" text-anchor="middle">16.8 M params</text>
<text class="sT" x="222" y="130" text-anchor="middle">+</text>
<rect class="sG" x="244" y="40" width="14" height="170" rx="3"/><text class="sT" x="251" y="226" text-anchor="middle">B</text><text class="sS" x="251" y="32" text-anchor="middle">4096×16</text>
<text class="sT" x="272" y="130" text-anchor="middle">·</text>
<rect class="sG" x="286" y="118" width="170" height="14" rx="3"/><text class="sS" x="371" y="110" text-anchor="middle">A: 16×4096</text>
<text class="sGt" x="371" y="160" text-anchor="middle">ΔW = B·A, rank 16</text><text class="sGt" x="371" y="178" text-anchor="middle">131,072 trainable params</text>
<rect class="sN" x="490" y="50" width="216" height="140" rx="8"/>
<text class="sT" x="598" y="74" text-anchor="middle">per 4096×4096 projection</text>
<text class="sRt" x="598" y="102" text-anchor="middle">full fine-tune: 16.8 M</text><text class="sGt" x="598" y="124" text-anchor="middle">LoRA r = 16: 131 k</text>
<text class="sC" x="598" y="150" text-anchor="middle">0.78% of the weights</text><text class="sS" x="598" y="172" text-anchor="middle">adapter files are megabytes</text>
</svg><figcaption>LoRA in shapes: the update is the product of two thin matrices, so it trains well under 1% of each projection. Computed.</figcaption></figure>

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
