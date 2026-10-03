# Part 20 — NLP with RNNs, Hugging Face, and Attention

<!-- nav -->
> [!example] 🧭 Step 19 of 26 · Stage 5 of 7: Deep learning
> ← [Part 19 · Time series & RNNs](19_Sequences_RNNs_and_Time_Series.md) · [Part 21 · Transformers, LLMs, RAG](21_Transformers_LLMs_RAG_and_Agents.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 14** "Natural Language Processing with RNNs and Attention". **Where it sits:** Part 10 covered *classical* NLP (tokenising, TF-IDF, cosine similarity). This part is the bridge: **embeddings → language models → subword tokenizers → pretrained models via Hugging Face → encoder–decoders → attention.** Part 21 then covers transformers and LLMs. **🔭 State of the art** boxes cover 2025–26 practice, including Arabic.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** The bridge from classical NLP to LLMs. Tokenisation, embeddings, fine-tuning with Hugging Face and attention are all asked at mid level.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | What an embedding is; what a tokenizer does; sampling temperature in one sentence. |
> | 🟡 **Mid** | Subword tokenisers (BPE/WordPiece), greedy/beam/top-k/top-p decoding, fine-tuning with the `Trainer`, bidirectional RNNs, the attention idea (queries, keys, values). |
> | 🔴 **Senior** | Encoder–decoder design, tokeniser choice for Arabic, model supply-chain security, evaluation of generation. |
>
> **⭐ Most-asked:** *What is an embedding?* · *BPE vs WordPiece — why subwords?* · *Temperature, top-k and top-p?* · *How would you fine-tune a sentiment model with Hugging Face?* · *What problem did attention solve for seq2seq?*
>
> **⏱ Time:** 3 h  ·  **Short on time?** Read §20.1 (embeddings), §20.2, §20.3, §20.4 (attention).

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 20.1 | Your first language model: a character RNN | 🟡 | Ch. 14 · pp. 526–537 |
> | 20.2 | Tokenization — subwords | 🟡 ⭐ | Ch. 14 · pp. 538–546 |
> | 20.3 | Sentiment analysis, climbing the reuse ladder | 🟡 ⭐ | Ch. 14 · pp. 537–560 |
> | 20.4 | Neural machine translation: encoder–decoder, beam search, attention | 🟡 ⭐ | Ch. 14 · pp. 560–575 |
> | 20.5 | Real-world examples | 🟡 | — |
> | 20.6 | Interview drill — NLP with RNNs | 🟡 | Ch. 14 · p. 575 |
>

---

## 20.1 Your first language model: a character RNN 🟡

> [!info] 📖 Géron Ch. 14 · “Generating Shakespearean Text Using a Character RNN” · pp. 526–537

Karpathy's 2015 blog post, *"The Unreasonable Effectiveness of Recurrent Neural Networks"*, trained an RNN to **predict the next character** of Shakespeare and then generate new text. It learned words, grammar and punctuation from nothing but next-character prediction. That makes it a **language model**, and it is the same objective, at a tiny scale, that trains today's LLMs (next *token* prediction).

### Tokenising at the character level and building windows

```python
vocab = sorted(set(shakespeare_text.lower()))           # 39 characters
char_to_id = {c: i for i, c in enumerate(vocab)}
id_to_char = {i: c for i, c in enumerate(vocab)}
encode = lambda text: torch.tensor([char_to_id[c] for c in text.lower()])

class CharDataset(torch.utils.data.Dataset):
    def __init__(self, text, window_length):
        self.ids, self.L = encode(text), window_length
    def __len__(self):
        return len(self.ids) - self.L
    def __getitem__(self, i):
        return self.ids[i:i + self.L], self.ids[i + 1:i + self.L + 1]   # target = shifted by 1
```

Input "to be or not to b" → target "o be or not to be". It is a seq2seq model where every position predicts the next character. The model can't learn patterns longer than the window (50 characters).

### Embeddings — the most important idea in this part

Token IDs can't be fed in directly: ID 13 isn't "closer" to 14 in meaning. One-hot vectors work but are huge for big vocabularies. **An embedding** is a small, dense, **trainable** vector per category:

```python
embed = nn.Embedding(num_embeddings=5, embedding_dim=3)   # a 5×3 lookup table
embed(torch.tensor([[3, 2], [0, 2]]))                     # rows 3, 2, 0, 2
```

- Mathematically, **one-hot × a bias-free linear layer**, but implemented as a fast row lookup.
- Rule of thumb for the size: ≈ **√(number of categories)** (a tunable hyperparameter).
- Training pulls similar categories together. This is **representation learning**. It works for *any* categorical feature, not just words: `ocean_proximity`, handset model, cell ID, tariff plan (Part 4 §4.10.8 mentioned it for high cardinality).
- **Word2Vec** (Mikolov et al., 2013) learned embeddings by predicting neighbouring words. Synonyms cluster, and directions carry meaning: **King − Man + Woman ≈ Queen**; Madrid − Spain + France ≈ Paris. GloVe (2014) and FastText (2016, subword-aware, good for morphology) followed.
- ⚠️ **Bias:** embeddings can also learn "Man:Doctor :: Woman:Nurse". (Nissim et al., 2019, showed the analogy test exaggerates this.) Fairness needs checking.

### The model, and generating text

![Temperature reshapes the next-token distribution; top-k/top-p cut off the unlikely tail.](figures/fig20_temperature.png)
*Temperature reshapes the next-token distribution; top-k/top-p cut off the unlikely tail.*

```python
class ShakespeareModel(nn.Module):
    def __init__(self, vocab_size, n_layers=2, embed_dim=10, hidden_dim=128, dropout=0.1):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.gru = nn.GRU(embed_dim, hidden_dim, num_layers=n_layers,
                          batch_first=True, dropout=dropout)
        self.output = nn.Linear(hidden_dim, vocab_size)
    def forward(self, X):
        out, _ = self.gru(self.embed(X))
        return self.output(out).permute(0, 2, 1)     # CrossEntropyLoss wants [B, C, T]
```

**Decoding strategies**, which apply to every LLM too:

| Strategy | How | Effect |
|---|---|---|
| **Greedy** | argmax at each step | Repetitive loops ("the state and the state and the…") |
| **Sampling** | `torch.multinomial(softmax(logits))` | Diverse, sometimes incoherent |
| **Temperature T** | softmax(logits / T) | T → 0 approaches greedy (precise); T = 1 is the model's distribution; T ≫ 1 is uniform noise ("we fried Shakespeare" at T = 100) |
| **Top-k** | Sample among the k most likely tokens | Cuts the long tail of nonsense |
| **Top-p (nucleus)** | Sample from the smallest set whose probabilities sum to ≥ p | Adapts to how confident the model is |
| **Beam search** | Keep the k best partial sequences (§20.4) | Best for translation and summarisation, where there is one "correct" output |

```python
def next_char(model, text, temperature=1.0):
    logits = model(encode(text).unsqueeze(0).to(device))[0, :, -1]
    probs = F.softmax(logits / temperature, dim=-1)
    return id_to_char[torch.multinomial(probs, 1).item()]
```

**The "sentiment neuron"** (Radford et al., OpenAI, 2017): a large char-level language model trained *without labels* on reviews had a single neuron that was a state-of-the-art sentiment classifier. Predicting the next character forces a model to understand. That was the insight behind unsupervised pretraining, and then GPT.

---

## 20.2 Tokenization — subwords 🟡 ⭐

> [!info] 📖 Géron Ch. 14 · “Tokenization Using the Hugging Face Tokenizers Library” · pp. 538–546

> [!quote] 💬 Say it in the interview
> “Subword tokenisers (BPE, WordPiece, Unigram) split rare words into frequent pieces, so there are no out-of-vocabulary words and the vocabulary stays around 30–250k tokens.”

Characters make sequences too long. Whole words make vocabularies huge and can't handle new words. **Subword tokenizers** split rare words into frequent pieces: "smartest" → "smart" + "est".

| Tokenizer | How it builds the vocabulary | Pros | Cons | Used by |
|---|---|---|---|---|
| **BPE / Byte-level BPE** (Sennrich et al. 2016; Gage 1994) | Start from characters (or **bytes**), repeatedly **merge the most frequent adjacent pair** | Fast, simple; BBPE never produces `<unk>` (all 256 bytes are in the vocabulary), handles emojis and any script | Occasional awkward splits | **GPT family, Llama, RoBERTa, BLOOM** |
| **WordPiece** (Google, 2016) | Merge the pair maximising freq(AB) / (freq(A)·freq(B)) | Meaningful tokens, shorter sequences | Less robust for multilingual text | **BERT**, DistilBERT, ELECTRA |
| **Unigram LM** (Kudo, 2018) | Start big, **remove** the tokens whose removal hurts the corpus likelihood least | Most meaningful splits; supports **subword regularisation** | Slower | **T5, ALBERT, mBART, XLM-R** (via **SentencePiece**) |

- **SentencePiece** treats text as a raw stream (no pre-tokenisation on spaces), which suits languages without spaces (Chinese) or with rich morphology.
- **Subword regularisation** (sample different segmentations during training) helps **morphologically rich languages, and Géron explicitly lists Arabic**, alongside Finnish, German and Turkish. This matters for Egyptian customer text (Part 10 §10.10).
- **Train your own tokenizer** for domain jargon (medical, legal, telecom product codes), low-resource languages or dialects, or new programming languages. Otherwise **reuse the model's pretrained tokenizer**. A model only works with **its own** tokenizer.

```python
import tokenizers
bpe = tokenizers.Tokenizer(tokenizers.models.BPE(unk_token="<unk>"))
bpe.pre_tokenizer = tokenizers.pre_tokenizers.ByteLevel()      # keeps spaces (Ġ), handles bytes
trainer = tokenizers.trainers.BpeTrainer(vocab_size=1000, special_tokens=["<pad>", "<unk>"])
bpe.train_from_iterator(train_texts, trainer)
enc = bpe.encode("what an awesome movie!")
enc.tokens, enc.ids, enc.offsets                                # offsets help debugging
bpe.enable_padding(pad_id=0, pad_token="<pad>")
bpe.enable_truncation(max_length=500)

import transformers
bert_tok = transformers.AutoTokenizer.from_pretrained("bert-base-uncased")
batch = bert_tok(texts, padding=True, truncation=True, max_length=500, return_tensors="pt")
batch["input_ids"], batch["attention_mask"]    # [CLS]=101 … [SEP]=102; mask 1 = real, 0 = pad
```

**Attention mask:** 1 for real tokens and 0 for padding. Models use it to ignore padding. `lengths = attention_mask.sum(dim=1)`.

---

## 20.3 Sentiment analysis, climbing the reuse ladder 🟡 ⭐

> [!info] 📖 Géron Ch. 14 · “Sentiment Analysis Using Hugging Face Libraries” → “Pipelines” · pp. 537–560

> [!quote] 💬 Say it in the interview
> “For sentiment I climb the reuse ladder: train from scratch → pretrained embeddings → fine-tune a pretrained transformer with the Hugging Face `Trainer`, which usually wins.”

**IMDb** (50,000 reviews, binary) is NLP's MNIST. Géron climbs a ladder of increasing reuse, and it is worth remembering:

| Step | What's pretrained | Validation accuracy |
|---|---|---|
| 1. GRU + trainable embeddings (BERT's tokenizer only) | Tokenizer | ~85% |
| 2. + **packed sequences** (the GRU stops at each sequence's true end instead of reading padding) | Tokenizer | Better use of the signal |
| 3. + **bidirectional GRU** | Tokenizer | Overfits (99% train / 84% validation), so no gain here |
| 4. Frozen **BERT word embeddings** (`nn.Embedding.from_pretrained(..., freeze=True)`) | Static embeddings | Modest gain |
| 5. **Frozen BERT contextual embeddings** + GRU | Whole encoder | **> 88%** |
| 6. BERT **[CLS]** embedding (or `pooler_output`) + one Linear layer | Whole encoder | Simpler, similar |
| 7. **`BertForSequenceClassification` fine-tuned with `Trainer`**, 2 epochs | Whole model | **~90%** (humans ~90%+: many reviews are ambiguous) |
| 8. **`pipeline("sentiment-analysis")`**, already fine-tuned (DistilBERT on SST-2) | Everything | 88.2%, **zero training** |

Key techniques from the ladder:
- **`padding_idx`** in `nn.Embedding` makes the padding vector a non-trainable zero.
- **Packed sequences**: `pack_padded_sequence(emb, lengths.cpu(), batch_first=True, enforce_sorted=False)`.
- **Bidirectional RNN** (`bidirectional=True`): reads left→right and right→left and concatenates. It is needed to disambiguate words using future context ("the **right** arm" / "the **right** to speak"). Concatenate the top layer's two final states: `hidden_states[-2:].permute(1, 0, 2).reshape(-1, 2 * hidden)`. It must **not** be used in a decoder or a forecaster: they must stay causal.
- **Static vs contextual embeddings:** Word2Vec gives "right" one vector. **ELMo** (2018) gave context-dependent vectors from a bidirectional LSTM language model. **ULMFiT** (Howard & Ruder, 2018) showed that fine-tuning a pretrained LSTM language model cut classification errors by **18–24%**, and that **100 labelled examples matched 10,000 from scratch**. *"This paper marked the beginning of a new era in NLP."*
- **BERT's [CLS] token:** pretrained to summarise the sequence for classification, so its final embedding is a ready-made sentence feature.

### Hugging Face's core tools (you will use them daily)

```python
from datasets import load_dataset
from transformers import (AutoTokenizer, AutoModelForSequenceClassification,
                          TrainingArguments, Trainer, DataCollatorWithPadding, pipeline)

ds = load_dataset("imdb")
split = ds["train"].train_test_split(train_size=0.8, seed=42)
tok = AutoTokenizer.from_pretrained("bert-base-uncased")
tokenized = split.map(lambda b: tok(b["text"], truncation=True, max_length=200), batched=True)

model = AutoModelForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=2)
# num_labels=2 → CrossEntropyLoss over 2 logits (softmax, not sigmoid); num_labels=1 → MSE (regression)

args = TrainingArguments(output_dir="my_imdb_model", num_train_epochs=2,
                         per_device_train_batch_size=128, eval_strategy="epoch",
                         save_strategy="epoch", logging_strategy="epoch",
                         load_best_model_at_end=True, metric_for_best_model="accuracy",
                         bf16=True, report_to="none")
def compute_metrics(p):
    return {"accuracy": (p.label_ids == p.predictions.argmax(-1)).mean()}

trainer = Trainer(model, args, train_dataset=tokenized["train"], eval_dataset=tokenized["test"],
                  compute_metrics=compute_metrics, data_collator=DataCollatorWithPadding(tok))
trainer.train()

clf = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
clf(["This was a great movie!"])     # [{'label': 'POSITIVE', 'score': 0.9998}]
```

- A freshly loaded `…ForSequenceClassification` has a **random head**. Géron's untrained model called "This was a great movie!" 65% negative. It must be fine-tuned.
- Passing `labels=` makes the model return `.loss` as well.
- `Trainer` handles checkpoints, early stopping, multiple GPUs, logging (TensorBoard/W&B) and mixed precision (`bf16=True`).
- Pipelines exist for QA, summarisation, NER (token classification), translation, zero-shot classification, image, audio and more (huggingface.co/tasks).
- **NLI** (entailment / contradiction / neutral) is another classic task. NLI models power **zero-shot classification**: "Does this complaint entail 'this is about billing'?"

### Bias, fairness and model-supply-chain security

Géron's experiment: the SST-2 sentiment model rates **"I am from the USA" very positive and "I am from Iraq" very negative** (Thailand positive, Vietnam negative). The bias comes from the pretraining text (war coverage) and is **amplified** by forcing a positive/negative choice. A model with a neutral class mostly removes it.
- Evaluate **per subgroup**, not just on average.
- Run **counterfactual tests**: swap gender, nationality or name and check the prediction doesn't change.
- Even a fair model can be **used unfairly** (for example, applied only to some groups).

**Choosing a Hub model:** filter by task, then language and dataset; prefer reputable publishers; read the model card. ⚠️ **Security:** a downloaded model may contain **executable code** (`trust_remote_code=True` only for authors you trust), **pickled weights** (prefer `safetensors`), leaked training data, or **poisoned weights** that misbehave only on certain triggers.

---

## 20.4 Neural machine translation: encoder–decoder, beam search, attention 🟡 ⭐

> [!info] 📖 Géron Ch. 14 · “An Encoder-Decoder Network for NMT”, “Beam Search”, “Attention Mechanisms” · pp. 560–575

> [!quote] 💬 Say it in the interview
> “Attention lets the decoder look at every encoder state and take a weighted average, with weights learned from query–key similarity. That removed the fixed-size bottleneck of seq2seq.”

### Encoder–decoder with teacher forcing

- The **encoder** reads the English sentence. Its final hidden state initialises the **decoder**.
- **Teacher forcing:** during training, the decoder's input at step t is the **true** previous target token (the target shifted right, starting with `<s>`). This speeds up training dramatically. At inference, it gets **its own previous output** instead. Scheduled sampling (Bengio et al., 2015) gradually switches between the two during training.
- Loss: `nn.CrossEntropyLoss(ignore_index=pad_id)`, so padding positions don't count.
- A **shared BPE tokenizer and embedding** for English and Spanish, since they share many subwords.

```python
class NmtModel(nn.Module):
    def __init__(self, vocab_size, embed_dim=512, hidden_dim=512, n_layers=2, pad_id=0):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=pad_id)
        self.encoder = nn.GRU(embed_dim, hidden_dim, n_layers, batch_first=True)
        self.decoder = nn.GRU(embed_dim, hidden_dim, n_layers, batch_first=True)
        self.output = nn.Linear(hidden_dim, vocab_size)
    def forward(self, pair):
        src = pack_padded_sequence(self.embed(pair.src_token_ids),
                                   pair.src_mask.sum(1).cpu(), batch_first=True,
                                   enforce_sorted=False)
        _, h = self.encoder(src)
        out, _ = self.decoder(self.embed(pair.tgt_token_ids), h)     # teacher forcing
        return self.output(out).permute(0, 2, 1)
```

**Output-layer tricks for big vocabularies:** sampled softmax (training only), **adaptive softmax** (`nn.AdaptiveLogSoftmaxWithLoss`, frequency clusters), and **weight tying** (`self.output.weight = self.embed.weight`: far fewer parameters, often better with little data; used by many LMs).

**Metrics:** **BLEU** (n-gram overlap with reference translations, `torchmetrics.text.BLEUScore`). Also know **chrF** (character n-grams, better for morphologically rich languages such as Arabic) and learned metrics such as **COMET**.

### Beam search

Greedy decoding can't undo an early mistake: "Me **gustan** los…" snowballs into "I like the players". **Beam search** keeps the **k most probable partial translations**, extends each one, and keeps the top k again. The sequence probability is the product of the conditional probabilities (75% × 32% for "Me gusta"). The correct "Me gusta el fútbol" wins at step 4 even though it was second at step 2. In Hugging Face: `model.generate(..., num_beams=3)`; also `do_sample`, `top_k`, `top_p`, `temperature`. Real systems also add a **length normalisation** so the search doesn't favour short outputs.

### Attention: the idea that changed everything

![Attention lets each output token look back at the input tokens it needs (illustrative weights).](figures/fig20_attention_heatmap.png)
*Attention lets each output token look back at the input tokens it needs (illustrative weights).*

The problem: the whole sentence is squeezed into one final hidden state, so long sentences fail ("I like to play with play with the players of the beach"). **Bahdanau et al. (2014)** let the decoder **look back at all encoder outputs** at each step and take a **weighted average** focused on the relevant words. When it outputs "fútbol", it attends to "soccer".

> **context₍ₜ₎ = Σᵢ α₍ₜ,ᵢ₎ · ŷ₍ᵢ₎**,  **α₍ₜ,ᵢ₎ = softmax over i of e₍ₜ,ᵢ₎**

| Score e₍ₜ,ᵢ₎ | Name |
|---|---|
| h₍ₜ₎ᵀ ŷ₍ᵢ₎ | **Dot product** (Luong 2015). Needs equal dimensions; fast; performed best |
| h₍ₜ₎ᵀ W ŷ₍ᵢ₎ | "General" (Luong) |
| vᵀ tanh(W [h₍ₜ₎ ; ŷ₍ᵢ₎]) | **Concatenative / additive** (Bahdanau). Now rarely used |

**The key interpretation: attention is a differentiable dictionary lookup.**
- **Query:** what the decoder is looking for ("I need the noun").
- **Keys:** what each encoder position offers (used to compute similarity).
- **Values:** what each position returns (used in the weighted sum).
- softmax(similarity(query, keys)) gives the weights, and the output is the weighted sum of the values. Keys and values are usually the same tensor, but not always.

```python
def attention(query, key, value):                 # [B,Lq,d], [B,Lk,d], [B,Lk,dv]
    scores = query @ key.transpose(1, 2)          # [B, Lq, Lk]
    weights = torch.softmax(scores, dim=-1)       # each query's weights sum to 1
    return weights @ value                        # [B, Lq, dv]

# In the NMT decoder: concatenate the attention output with the decoder output → Linear
# (the output layer's input size doubles: nn.Linear(2 * hidden_dim, vocab_size))
```

The result: the attention model translates Géron's longest sentence correctly with **greedy decoding**, no beam search needed. **Cost:** n² scores for n tokens (quadratic), which is the long-context problem transformers still fight (Part 21). Google researchers then removed the RNNs entirely and kept only attention and feed-forward layers: ***"Attention Is All You Need"* (2017), the Transformer.**

> [!success] 🔭 State of the art — NLP in 2025–26
> - **Text classification:** fine-tuned encoders (**DeBERTa-v3**, **ModernBERT** (2024, long context), multilingual **XLM-R**; Arabic: **MARBERT, CAMeLBERT, AraBERT**) are still the most accurate *and* cheapest option when you have labels. With few labels: **SetFit** (sentence-transformer few-shot fine-tuning), or **LLM zero/few-shot** classification, often used to **pseudo-label** data for a small fine-tuned model.
> - **Embeddings** for search, RAG and clustering: sentence-transformers and multilingual embedding models (e.g. **multilingual-E5, BGE-M3**). Compare them on the **MTEB** leaderboard, which has multilingual and Arabic subsets.
> - **Translation:** Meta's **NLLB-200** (2022, 200 languages including Egyptian Arabic) and LLMs now rival dedicated NMT for many language pairs. Evaluate with chrF/COMET, and with native-speaker review for dialects.
> - **Tokenizers:** modern LLMs use byte-level BPE with **very large vocabularies** (100k– 200k+), which cuts the number of tokens for non-English text. That matters for Arabic cost and latency, where older tokenizers produced many more tokens per word.

---

## 20.5 Real-world examples 🟡

| Example | Technique | Why it matters |
|---|---|---|
| **Google Neural Machine Translation (2016)** | LSTM encoder–decoder + attention + WordPiece | Big quality jump in Google Translate; WordPiece was born here |
| **Gmail Smart Reply (2015)** | LSTM seq2seq suggesting short replies | Early large-scale deployment of neural sequence models |
| **OpenAI "sentiment neuron" (2017)** | Unsupervised char-level LM | Showed that pretraining learns semantics, paving the way to GPT |
| Customer-support routing and CSAT analysis | Fine-tuned BERT-family classifiers, NLI zero-shot | The #1 NLP use case in enterprises |
| **Telecom (e&-relevant)** | **Arabic/Franco-Arabic complaint routing**; sentiment on social media and app-store reviews; **intent detection** for the WhatsApp or app chatbot; **NER** to extract MSISDNs, bundle names and amounts from tickets; translation of English knowledge-base articles to Arabic for agents | Subword tokenizers with dialect-aware models (MARBERT), SetFit for scarce labels, NLI zero-shot for new categories, bias checks by governorate and language |

---

> [!check] ✅ Key takeaways
> - Embeddings map tokens to dense vectors whose geometry captures meaning.
> - Subword tokenisers (BPE, WordPiece, Unigram) remove out-of-vocabulary problems.
> - Decoding: greedy and beam search for accuracy; temperature / top-k / top-p for diversity.
> - Climb the reuse ladder: pretrained embeddings → fine-tune a pretrained transformer with the Hugging Face `Trainer`.
> - Attention removed the seq2seq bottleneck by letting the decoder look at every encoder state.

## 20.6 Interview drill — NLP with RNNs (Géron Ch. 14 exercises, answered) 🟡

> [!info] 📖 Géron Ch. 14 · Exercises · p. 575

**1. Stateful vs stateless RNN?** Stateless: each batch starts from a zero state, the windows are independent, and they can be shuffled. Stateful: the final state of one batch initialises the next, so it can learn patterns longer than a window, but the batches must be consecutive and non-overlapping (no shuffling), which makes training harder and slower to converge.

**2. Why encoder–decoder rather than plain seq2seq for translation?** A translation may depend on the *whole* source sentence (word order differs; the end can change the start). The encoder reads everything before the decoder writes. Plain seq2seq must emit token t having seen only t source tokens.

**3. Variable-length inputs and outputs?** Inputs: padding + masks (or packed sequences), or bucketing by length. Outputs: an end-of-sequence token (stop generating when EoS is produced), or a known target length. Ignore padding in the loss (`ignore_index`).

**4. What is beam search and why use it? What tool?** Keep the top-k partial sequences at each step, so the model can recover from an early locally-best but globally-bad choice. It gives better translations and summaries. Hugging Face: `generate(num_beams=k)`.

**5. What is attention and how does it help?** A learned, softmax-weighted sum over all encoder outputs, computed at each decoder step (query/key/value). It gives short paths from any input to any output, which fixes the long-sentence bottleneck, and the weights are somewhat interpretable (alignment).

**6. When to use sampled softmax?** When the output vocabulary is large and the full softmax is too slow in training. It approximates using the correct class plus a sample of negatives. It is training-only, since it needs the target.

**More that come up:**
- **"Word2Vec vs BERT embeddings?"** Static (one vector per word, context-independent) vs contextual (depends on the sentence; built by a deep bidirectional transformer).
- **"BPE vs WordPiece vs SentencePiece?"** §20.2. SentencePiece is a library/framework (Unigram or BPE) that works on raw text without pre-tokenisation.
- **"How do you handle out-of-vocabulary words?"** Subword or byte-level tokenisation means nothing is truly out-of-vocabulary.
- **"Explain teacher forcing and exposure bias."** Training on ground-truth previous tokens is fast, but the model never learns to recover from its own mistakes (exposure bias). Scheduled sampling and beam search mitigate this.
- **"Temperature, top-k, top-p?"** §20.1 table.
- **"How would you check an NLP model for bias?"** Subgroup metrics, counterfactual swaps (names, genders, nationalities, dialects), templates, and per-segment error analysis.

---

## Further reading and sources

**Book:** Géron Ch. 14 + notebook (exercise 8: a date-format encoder–decoder; stateful RNN section online).

**Papers:** Mikolov et al. (2013) Word2Vec · Sutskever et al. (2014) Seq2Seq · Cho et al. (2014) · **Bahdanau et al. (2014)** attention · **Luong et al. (2015)** · Sennrich et al. (2016) BPE · Wu et al. (2016) GNMT · Kudo (2018) Unigram/subword regularisation · Kudo & Richardson (2018) SentencePiece · Peters et al. (2018) ELMo · Howard & Ruder (2018) ULMFiT · Radford et al. (2017) sentiment neuron.

**Courses and resources:**
- **Hugging Face LLM Course** (formerly the NLP Course, huggingface.co/learn): free, and the most practical introduction to the tools used here.
- **Stanford CS224N** (NLP with Deep Learning): lecture videos free online.
- **Jay Alammar, *The Illustrated Word2Vec*** and ***Visualizing A Neural Machine Translation Model*** (jalammar.github.io).
- **Karpathy, *The Unreasonable Effectiveness of RNNs*** (2015) and his *makemore* videos.
- **MTEB leaderboard** (embedding models, including Arabic); **CAMeL Lab** tools and models for Arabic NLP (NYU Abu Dhabi).

---

<!-- nav -->
> [!example] 🧭 Step 19 of 26 · Stage 5 of 7: Deep learning
> ← [Part 19 · Time series & RNNs](19_Sequences_RNNs_and_Time_Series.md) · [Part 21 · Transformers, LLMs, RAG](21_Transformers_LLMs_RAG_and_Agents.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
