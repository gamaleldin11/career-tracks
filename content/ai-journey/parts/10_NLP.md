# Part 10 — Natural Language Processing

<!-- nav -->
> [!example] 🧭 Step 13 of 26 · Stage 4 of 7: Applied ML
> ← [Part 09 · Unsupervised](09_Unsupervised_PCA_and_Clustering.md) · [Part 11 · Neural networks](11_Neural_Networks.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2026-01-18/NLP_Intro.ipynb` (57 cells)

This session covers **classical NLP** — the pre-transformer toolkit. That is worth stating plainly up front, because it shapes what you have and have not learned.

The pipeline here (clean → tokenise → remove stopwords → lemmatise → vectorise with BoW/TF-IDF → feed to a classifier) was the industry standard from roughly 2000 to 2018. It is now largely superseded by transformer embeddings for accuracy-critical work.

**But it remains genuinely useful**, and not only for historical reasons:

- It is **fast** — milliseconds, no GPU, no model download.
- It is **interpretable** — you can read the coefficients and see which words drove a classification.
- It is a **strong baseline** — TF-IDF plus logistic regression is hard to beat on small, domain-specific datasets, and it is what you should run before reaching for BERT.
- It is what **search engines and retrieval systems** still use underneath (BM25 is a TF-IDF descendant, and every RAG system's hybrid search has a sparse component).

Given that you have a `GenAI` folder on `E:` with RAG labs and LangFlow flows, and a FinSight project calling Claude and OpenAI — the gap between this session and that work is worth understanding precisely. §10.8 covers it.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Customer-care text (complaints, chats, app reviews) is a major telecom data source. In Egypt that means Arabic, Egyptian dialect and Franco-Arabic.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Tokenisation, stop words, stemming vs lemmatisation, bag-of-words, TF-IDF, cosine similarity; build a TF-IDF + logistic regression baseline. |
> | 🟡 **Mid** | Arabic normalisation and dialect issues; char n-grams; when to move to transformers (AraBERT/MARBERT); evaluating text classifiers on imbalanced labels. |
> | 🔴 **Senior** | Designing a multilingual NLP platform: routing, RAG, labelling strategy, privacy of customer text. |
>
> **⭐ Most-asked:** *TF-IDF — what does it measure?* · *Stemming vs lemmatisation?* · *Why cosine similarity rather than Euclidean distance?* · *How would you classify Arabic complaints?* · *When is TF-IDF + logistic regression enough, and when do you need BERT?*
>
> **⏱ Time:** 3 h  ·  **Short on time?** Read §10.6, §10.7, §10.8, §10.10.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 10.1 | The core problem | 🟢 | — |
> | 10.2 | Tokenization | 🟢 ⭐ | Ch. 14 · pp. 538–546 |
> | 10.3 | Stopwords | 🟢 | — |
> | 10.4 | Stemming vs Lemmatization | 🟢 ⭐ | — |
> | 10.5 | The full cleaning pipeline | 🟢 | — |
> | 10.6 | Vectorization | 🟢 ⭐ | — |
> | 10.7 | Cosine similarity | 🟢 ⭐ | — |
> | 10.8 | Where this sits relative to modern NLP | 🟡 ⭐ | Ch. 14, Ch. 15 · pp. 551–560 |
> | 10.9 | The complete classical pipeline | 🟢 | — |
> | 10.10 | NLP at a telecom in Egypt — Arabic, dialect and Franco-Arabic | 🟡 ⭐ | — |
>

---

## 10.1 The core problem 🟢

Models consume numbers. Text is a variable-length sequence of symbols. Every technique in this part is an answer to: **how do I turn a document into a fixed-length numeric vector?**

---

## 10.2 Tokenization 🟢 ⭐

> [!info] 📖 Géron Ch. 14 · “Tokenization Using the Hugging Face Tokenizers Library” · pp. 538–546 (the modern view)

```python
import re, string, nltk
nltk.download('punkt_tab')
from nltk.tokenize import word_tokenize

word_tokenize("I love NLp so much!")
# ['I', 'love', 'NLp', 'so', 'much', '!']
```

**Tokenization** splits text into units. It looks trivial and is not:

- `"don't"` → `["do", "n't"]`, not `["don't"]`
- `"New York"` is one concept, two tokens
- `"U.S.A."` — is the final period a sentence end?
- Chinese and Japanese have no spaces at all
- URLs, emoji, hashtags, code

`str.split()` handles none of this. NLTK's `word_tokenize` uses the trained Punkt model, which is why it needs a download.

<figure class="dia steps"><svg viewBox="0 0 720 210" role="img" aria-label="Tokenization: str.split versus the NLTK word tokenizer on a sentence with a contraction, a price and an abbreviation; then byte-pair encoding trained on low, lower, newest and widest learns the merges e plus s, es plus t, est plus end of word, l plus o and lo plus w, and encodes the unseen word lowest as low and est">
<g data-s="1-1"><text class="sT" x="14" y="30" xml:space="preserve" style="white-space:pre">Don't pay EGP 1,200.50 to the U.S.A. office today!</text><text class="sS" x="14" y="62">str.split()</text><rect class="sW" x="110" y="48" width="47" height="22" rx="4" opacity=".55"/><text class="sS" x="133.5" y="63" text-anchor="middle">Don't</text><rect class="sW" x="161" y="48" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="177.1" y="63" text-anchor="middle">pay</text><rect class="sW" x="197.2" y="48" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="213.3" y="63" text-anchor="middle">EGP</text><rect class="sW" x="233.4" y="48" width="69.2" height="22" rx="4" opacity=".55"/><text class="sS" x="268" y="63" text-anchor="middle">1,200.50</text><rect class="sW" x="306.6" y="48" width="24.8" height="22" rx="4" opacity=".55"/><text class="sS" x="319" y="63" text-anchor="middle">to</text><rect class="sW" x="335.4" y="48" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="351.5" y="63" text-anchor="middle">the</text><rect class="sW" x="371.6" y="48" width="54.4" height="22" rx="4" opacity=".55"/><text class="sS" x="398.8" y="63" text-anchor="middle">U.S.A.</text><rect class="sW" x="430" y="48" width="54.4" height="22" rx="4" opacity=".55"/><text class="sS" x="457.2" y="63" text-anchor="middle">office</text><rect class="sW" x="488.4" y="48" width="54.4" height="22" rx="4" opacity=".55"/><text class="sS" x="515.6" y="63" text-anchor="middle">today!</text><text class="sS" x="14" y="100">NLTK</text><rect class="sG" x="110" y="86" width="24.8" height="22" rx="4" opacity=".55"/><text class="sS" x="122.4" y="101" text-anchor="middle">Do</text><rect class="sG" x="138.8" y="86" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="154.9" y="101" text-anchor="middle">n't</text><rect class="sG" x="175" y="86" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="191.1" y="101" text-anchor="middle">pay</text><rect class="sG" x="211.2" y="86" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="227.3" y="101" text-anchor="middle">EGP</text><rect class="sG" x="247.4" y="86" width="69.2" height="22" rx="4" opacity=".55"/><text class="sS" x="282" y="101" text-anchor="middle">1,200.50</text><rect class="sG" x="320.6" y="86" width="24.8" height="22" rx="4" opacity=".55"/><text class="sS" x="333" y="101" text-anchor="middle">to</text><rect class="sG" x="349.4" y="86" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="365.5" y="101" text-anchor="middle">the</text><rect class="sG" x="385.6" y="86" width="54.4" height="22" rx="4" opacity=".55"/><text class="sS" x="412.8" y="101" text-anchor="middle">U.S.A.</text><rect class="sG" x="444" y="86" width="54.4" height="22" rx="4" opacity=".55"/><text class="sS" x="471.2" y="101" text-anchor="middle">office</text><rect class="sG" x="502.4" y="86" width="47" height="22" rx="4" opacity=".55"/><text class="sS" x="525.9" y="101" text-anchor="middle">today</text><rect class="sG" x="553.4" y="86" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="562.4" y="101" text-anchor="middle">!</text><text class="sS" x="360" y="140" text-anchor="middle">split keeps "today!" glued; NLTK splits n't and the final '!' but keeps U.S.A. and 1,200.50</text></g>
<g data-s="2-2"><text class="sT" x="14" y="24">BPE training corpus, split into characters (_ marks the word end)</text><text class="sS" x="70" y="55" text-anchor="end">×5</text><rect class="sV" x="80" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="55" text-anchor="middle">l</text><rect class="sV" x="102" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="55" text-anchor="middle">o</text><rect class="sV" x="124" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="55" text-anchor="middle">w</text><rect class="sV" x="146" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="55" text-anchor="middle">_</text><text class="sS" x="70" y="85" text-anchor="end">×2</text><rect class="sV" x="80" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="85" text-anchor="middle">l</text><rect class="sV" x="102" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="85" text-anchor="middle">o</text><rect class="sV" x="124" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="85" text-anchor="middle">w</text><rect class="sV" x="146" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="85" text-anchor="middle">e</text><rect class="sV" x="168" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="177" y="85" text-anchor="middle">r</text><rect class="sV" x="190" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="199" y="85" text-anchor="middle">_</text><text class="sS" x="70" y="115" text-anchor="end">×6</text><rect class="sV" x="80" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="115" text-anchor="middle">n</text><rect class="sV" x="102" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="115" text-anchor="middle">e</text><rect class="sV" x="124" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="115" text-anchor="middle">w</text><rect class="sV" x="146" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="115" text-anchor="middle">e</text><rect class="sV" x="168" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="177" y="115" text-anchor="middle">s</text><rect class="sV" x="190" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="199" y="115" text-anchor="middle">t</text><rect class="sV" x="212" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="221" y="115" text-anchor="middle">_</text><text class="sS" x="70" y="145" text-anchor="end">×3</text><rect class="sV" x="80" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="145" text-anchor="middle">w</text><rect class="sV" x="102" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="145" text-anchor="middle">i</text><rect class="sV" x="124" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="145" text-anchor="middle">d</text><rect class="sV" x="146" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="145" text-anchor="middle">e</text><rect class="sV" x="168" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="177" y="145" text-anchor="middle">s</text><rect class="sV" x="190" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="199" y="145" text-anchor="middle">t</text><rect class="sV" x="212" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="221" y="145" text-anchor="middle">_</text><text class="sS" x="560" y="180" text-anchor="middle">count every adjacent pair, weighted by word frequency</text></g>
<g data-s="3-3"><text class="sT" x="14" y="24">after 3 merges</text><text class="sS" x="70" y="55" text-anchor="end">×5</text><rect class="sV" x="80" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="55" text-anchor="middle">l</text><rect class="sV" x="102" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="55" text-anchor="middle">o</text><rect class="sV" x="124" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="55" text-anchor="middle">w</text><rect class="sV" x="146" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="55" text-anchor="middle">_</text><text class="sS" x="70" y="85" text-anchor="end">×2</text><rect class="sV" x="80" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="85" text-anchor="middle">l</text><rect class="sV" x="102" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="85" text-anchor="middle">o</text><rect class="sV" x="124" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="85" text-anchor="middle">w</text><rect class="sV" x="146" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="85" text-anchor="middle">e</text><rect class="sV" x="168" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="177" y="85" text-anchor="middle">r</text><rect class="sV" x="190" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="199" y="85" text-anchor="middle">_</text><text class="sS" x="70" y="115" text-anchor="end">×6</text><rect class="sV" x="80" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="115" text-anchor="middle">n</text><rect class="sV" x="102" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="115" text-anchor="middle">e</text><rect class="sV" x="124" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="115" text-anchor="middle">w</text><rect class="sV" x="146" y="100" width="39.6" height="22" rx="4" opacity=".55"/><text class="sS" x="165.8" y="115" text-anchor="middle">est_</text><text class="sS" x="70" y="145" text-anchor="end">×3</text><rect class="sV" x="80" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="145" text-anchor="middle">w</text><rect class="sV" x="102" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="145" text-anchor="middle">i</text><rect class="sV" x="124" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="145" text-anchor="middle">d</text><rect class="sV" x="146" y="130" width="39.6" height="22" rx="4" opacity=".55"/><text class="sS" x="165.8" y="145" text-anchor="middle">est_</text><text class="sS" x="480" y="54" xml:space="preserve" style="white-space:pre">merge 1: e + s  (9 times)</text><text class="sS" x="480" y="74" xml:space="preserve" style="white-space:pre">merge 2: es + t  (9 times)</text><text class="sS" x="480" y="94" xml:space="preserve" style="white-space:pre">merge 3: est + _  (9 times)</text></g>
<g data-s="4-4"><text class="sT" x="14" y="24">after 5 merges: a vocabulary of subwords</text><text class="sS" x="70" y="55" text-anchor="end">×5</text><rect class="sV" x="80" y="40" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="96.1" y="55" text-anchor="middle">low</text><rect class="sV" x="116.2" y="40" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="125.2" y="55" text-anchor="middle">_</text><text class="sS" x="70" y="85" text-anchor="end">×2</text><rect class="sV" x="80" y="70" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="96.1" y="85" text-anchor="middle">low</text><rect class="sV" x="116.2" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="125.2" y="85" text-anchor="middle">e</text><rect class="sV" x="138.2" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="147.2" y="85" text-anchor="middle">r</text><rect class="sV" x="160.2" y="70" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="169.2" y="85" text-anchor="middle">_</text><text class="sS" x="70" y="115" text-anchor="end">×6</text><rect class="sV" x="80" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="115" text-anchor="middle">n</text><rect class="sV" x="102" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="115" text-anchor="middle">e</text><rect class="sV" x="124" y="100" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="115" text-anchor="middle">w</text><rect class="sV" x="146" y="100" width="39.6" height="22" rx="4" opacity=".55"/><text class="sS" x="165.8" y="115" text-anchor="middle">est_</text><text class="sS" x="70" y="145" text-anchor="end">×3</text><rect class="sV" x="80" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="145" text-anchor="middle">w</text><rect class="sV" x="102" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="145" text-anchor="middle">i</text><rect class="sV" x="124" y="130" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="145" text-anchor="middle">d</text><rect class="sV" x="146" y="130" width="39.6" height="22" rx="4" opacity=".55"/><text class="sS" x="165.8" y="145" text-anchor="middle">est_</text><text class="sS" x="480" y="54" xml:space="preserve" style="white-space:pre">merge 1: e + s  (9 times)</text><text class="sS" x="480" y="74" xml:space="preserve" style="white-space:pre">merge 2: es + t  (9 times)</text><text class="sS" x="480" y="94" xml:space="preserve" style="white-space:pre">merge 3: est + _  (9 times)</text><text class="sS" x="480" y="114" xml:space="preserve" style="white-space:pre">merge 4: l + o  (7 times)</text><text class="sS" x="480" y="134" xml:space="preserve" style="white-space:pre">merge 5: lo + w  (7 times)</text></g>
<g data-s="5-5"><text class="sT" x="14" y="24">encode a word never seen in training: "lowest"</text><rect class="sN" x="80" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="89" y="61" text-anchor="middle">l</text><rect class="sN" x="102" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="111" y="61" text-anchor="middle">o</text><rect class="sN" x="124" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="133" y="61" text-anchor="middle">w</text><rect class="sN" x="146" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="155" y="61" text-anchor="middle">e</text><rect class="sN" x="168" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="177" y="61" text-anchor="middle">s</text><rect class="sN" x="190" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="199" y="61" text-anchor="middle">t</text><rect class="sN" x="212" y="46" width="18" height="22" rx="4" opacity=".55"/><text class="sS" x="221" y="61" text-anchor="middle">_</text><text class="sS" x="300" y="92" text-anchor="middle">apply the merges in the order they were learned</text><line class="sLm" x1="300" y1="100" x2="300" y2="116" marker-end="url(#ahm)"/><rect class="sG" x="80" y="124" width="32.2" height="22" rx="4" opacity=".55"/><text class="sS" x="96.1" y="139" text-anchor="middle">low</text><rect class="sG" x="116.2" y="124" width="39.6" height="22" rx="4" opacity=".55"/><text class="sS" x="136" y="139" text-anchor="middle">est_</text><text class="sGt" x="360" y="176" text-anchor="middle">"lowest" → ['low', 'est_']: no out-of-vocabulary word, ever</text></g>
</svg><ol class="dia-steps">
<li>Word tokenizers make choices that str.split cannot: contractions, punctuation and abbreviations.</li>
<li>Subword tokenizers learn their vocabulary. BPE starts from characters, with each word weighted by its corpus count.</li>
<li>The most frequent adjacent pair is merged into a new symbol, again and again: e+s, then es+t, then est+_ (each seen 9 times).</li>
<li>After l+o and lo+w, frequent words and suffixes have become single tokens.</li>
<li>A new word is encoded by replaying the merges, so it breaks into known pieces instead of becoming <unk>.</li>
</ol><figcaption>From word tokens to subwords: NLTK's tokenizer and a five-merge BPE (Sennrich et al.'s classic toy corpus), both run for real.</figcaption></figure>

📌 **What modern systems do instead:** subword tokenization — **BPE** (GPT), **WordPiece** (BERT), **SentencePiece** (T5, Llama). Instead of a fixed word vocabulary, they learn a vocabulary of frequent character sequences, so `"tokenization"` might become `["token", "ization"]`. This solves the out-of-vocabulary problem entirely — any string can be encoded — and keeps the vocabulary at a manageable ~50k entries. It is also why LLM pricing is per *token* rather than per word, and why token counts do not match word counts.

---

## 10.3 Stopwords 🟢

```python
from nltk.corpus import stopwords
stp = stopwords.words('english')
stp[:15]     # ['i', 'me', 'my', 'myself', 'we', ...]
len(stp)     # 179
```

**Stopwords** are extremely common words — *the, is, at, which* — that carry little topical information. Removing them shrinks the vocabulary and cuts noise.

### ⚠️ The trap the notebook catches, and it is a good one

```python
stop_words = set(stopwords.words('english'))
'the' in stop_words     # True
'not' in stop_words     # True     ← problem

negations = {'not', 'no', 'never'}
stop_words = stop_words - negations
'not' in stop_words     # False
```

**`"not"` is a stopword in the default list.** Remove it and:

> "The food is not good" → `["food", "good"]`

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Applying scikit-learn's English stopword list to reviews: The food was not good becomes food good, the same as The food was good, so 120 labelled reviews collapse into 60 distinct inputs that each carry both labels and no model can exceed 50 percent accuracy; removing not, no and never from the list keeps 120 distinct inputs and a 100 percent ceiling">
<text class="sT" x="14" y="22">scikit-learn's ENGLISH_STOP_WORDS on three reviews</text>
<rect class="sN" x="14" y="34" width="340" height="196" rx="8" opacity=".4"/><text class="sRt" x="184" y="54" text-anchor="middle">default list (318 words)</text>
<text class="sS" x="26" y="82">"The food was not good"</text><text class="sT" x="26" y="98" xml:space="preserve" style="white-space:pre">→ ['food', 'good']</text>
<text class="sS" x="26" y="116">"The food was good"</text><text class="sT" x="26" y="132" xml:space="preserve" style="white-space:pre">→ ['food', 'good']</text>
<text class="sS" x="26" y="150">"The staff was not rude"</text><text class="sT" x="26" y="166" xml:space="preserve" style="white-space:pre">→ ['staff', 'rude']</text>
<text class="sT" x="184" y="190" text-anchor="middle">120 reviews → 60 distinct inputs</text>
<text class="sRt" x="184" y="212" text-anchor="middle">best possible accuracy: 50%</text>
<rect class="sN" x="366" y="34" width="340" height="196" rx="8" opacity=".4"/><text class="sGt" x="536" y="54" text-anchor="middle">minus {not, no, never}</text>
<text class="sS" x="378" y="82">"The food was not good"</text><text class="sT" x="378" y="98" xml:space="preserve" style="white-space:pre">→ ['food', 'not', 'good']</text>
<text class="sS" x="378" y="116">"The food was good"</text><text class="sT" x="378" y="132" xml:space="preserve" style="white-space:pre">→ ['food', 'good']</text>
<text class="sS" x="378" y="150">"The staff was not rude"</text><text class="sT" x="378" y="166" xml:space="preserve" style="white-space:pre">→ ['staff', 'not', 'rude']</text>
<text class="sT" x="536" y="190" text-anchor="middle">120 reviews → 120 distinct inputs</text>
<text class="sGt" x="536" y="212" text-anchor="middle">best possible accuracy: 100%</text>
</svg><figcaption>The negation trap, measured on 120 template reviews: with the default list, a review and its negation become the same input with opposite labels.</figcaption></figure>

The sentiment has been inverted. For a sentiment task this is catastrophic, and it is exactly the sort of silent bug that produces a mediocre model nobody can explain.

The general lesson: **stopword lists are task-dependent.** For topic classification, removing "not" is harmless. For sentiment, negation is the signal. Always inspect the list against your task before applying it.

(Note the elegant `set - set` difference operation — the right data structure for the job.)

**Modern practice:** transformer models do *not* remove stopwords. Attention learns which tokens matter, and "not" is often the most important token in a sentence.

---

## 10.4 Stemming vs Lemmatization 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Stemming chops suffixes by rule; lemmatisation returns the dictionary form using vocabulary and part of speech. For Arabic, light stemming or lemmatisation with CAMeL Tools.”

Both reduce inflected forms to a base, so that `play`, `plays`, `playing` are one feature rather than three.

```python
from nltk.stem import WordNetLemmatizer
nltk.download('wordnet'); nltk.download('omw-1.4')
lemmatizer = WordNetLemmatizer()

from nltk.stem import PorterStemmer
stemmer = PorterStemmer()

words = ['plays', 'studies']
[lemmatizer.lemmatize(w) for w in words]   # ['play', 'study']
[stemmer.stem(w) for w in words]           # ['play', 'studi']
```

Look at `'studi'`. That is the whole distinction:

| | Stemming | Lemmatization |
|---|---|---|
| Method | Chop suffixes by rule | Dictionary lookup (WordNet) |
| Output | May not be a real word (`studi`, `happi`) | Always a real word |
| Speed | Very fast | Slower |
| Needs | Nothing | A lexicon, and ideally a POS tag |

<figure class="dia steps"><svg viewBox="0 0 720 322" role="img" aria-label="Eleven words through the Porter stemmer and the WordNet lemmatizer: regular endings are reduced by both, though studies becomes studi; organization collides with organ and university with universe under stemming; irregular forms such as ran, was, geese and better are untouched or mangled by the stemmer but lemmatized to run, be, goose and good">
<text class="sT" x="300" y="24" text-anchor="middle">word</text><text class="sT" x="452" y="24" text-anchor="middle">PorterStemmer</text><text class="sT" x="604" y="24" text-anchor="middle">WordNetLemmatizer</text>
<g data-s="1"><rect class="sN" x="10" y="36" width="700" height="72" rx="6" opacity=".5"/><text class="sGt" x="20" y="56">regular endings</text><text class="sS" x="20" y="73">both reduce the variants;</text><text class="sS" x="20" y="88">the stem may not be a word</text><text class="sC" x="250" y="58" xml:space="preserve" style="white-space:pre">plays</text><line class="sLm" x1="352" y1="54" x2="398" y2="54" marker-end="url(#ahm)"/><text class="sT" x="452" y="58" text-anchor="middle">play</text><line class="sLm" x1="506" y1="54" x2="548" y2="54" marker-end="url(#ahm)"/><text class="sGt" x="556" y="58">play</text><text class="sC" x="250" y="78" xml:space="preserve" style="white-space:pre">studies</text><line class="sLm" x1="352" y1="74" x2="398" y2="74" marker-end="url(#ahm)"/><text class="sWt" x="452" y="78" text-anchor="middle">studi</text><line class="sLm" x1="506" y1="74" x2="548" y2="74" marker-end="url(#ahm)"/><text class="sGt" x="556" y="78">study</text><text class="sC" x="250" y="98" xml:space="preserve" style="white-space:pre">running</text><line class="sLm" x1="352" y1="94" x2="398" y2="94" marker-end="url(#ahm)"/><text class="sT" x="452" y="98" text-anchor="middle">run</text><line class="sLm" x1="506" y1="94" x2="548" y2="94" marker-end="url(#ahm)"/><text class="sGt" x="556" y="98">run</text><text class="sS" x="656" y="98">pos='v'</text></g>
<g data-s="2"><rect class="sN" x="10" y="116" width="700" height="92" rx="6" opacity=".5"/><text class="sRt" x="20" y="136">over-stemming</text><text class="sS" x="20" y="153">different words collide</text><text class="sS" x="20" y="168">into one feature</text><text class="sC" x="250" y="138" xml:space="preserve" style="white-space:pre">organization</text><line class="sLm" x1="352" y1="134" x2="398" y2="134" marker-end="url(#ahm)"/><text class="sRt" x="452" y="138" text-anchor="middle">organ</text><line class="sLm" x1="506" y1="134" x2="548" y2="134" marker-end="url(#ahm)"/><text class="sGt" x="556" y="138">organization</text><text class="sC" x="250" y="158" xml:space="preserve" style="white-space:pre">organ</text><line class="sLm" x1="352" y1="154" x2="398" y2="154" marker-end="url(#ahm)"/><text class="sRt" x="452" y="158" text-anchor="middle">organ</text><line class="sLm" x1="506" y1="154" x2="548" y2="154" marker-end="url(#ahm)"/><text class="sGt" x="556" y="158">organ</text><text class="sC" x="250" y="178" xml:space="preserve" style="white-space:pre">university</text><line class="sLm" x1="352" y1="174" x2="398" y2="174" marker-end="url(#ahm)"/><text class="sRt" x="452" y="178" text-anchor="middle">univers</text><line class="sLm" x1="506" y1="174" x2="548" y2="174" marker-end="url(#ahm)"/><text class="sGt" x="556" y="178">university</text><text class="sC" x="250" y="198" xml:space="preserve" style="white-space:pre">universe</text><line class="sLm" x1="352" y1="194" x2="398" y2="194" marker-end="url(#ahm)"/><text class="sRt" x="452" y="198" text-anchor="middle">univers</text><line class="sLm" x1="506" y1="194" x2="548" y2="194" marker-end="url(#ahm)"/><text class="sGt" x="556" y="198">universe</text></g>
<g data-s="3"><rect class="sN" x="10" y="216" width="700" height="92" rx="6" opacity=".5"/><text class="sWt" x="20" y="236">irregular forms</text><text class="sS" x="20" y="253">no suffix rule can reach</text><text class="sS" x="20" y="268">the base; a lexicon can</text><text class="sC" x="250" y="238" xml:space="preserve" style="white-space:pre">ran</text><line class="sLm" x1="352" y1="234" x2="398" y2="234" marker-end="url(#ahm)"/><text class="sWt" x="452" y="238" text-anchor="middle">ran</text><line class="sLm" x1="506" y1="234" x2="548" y2="234" marker-end="url(#ahm)"/><text class="sGt" x="556" y="238">run</text><text class="sS" x="656" y="238">pos='v'</text><text class="sC" x="250" y="258" xml:space="preserve" style="white-space:pre">was</text><line class="sLm" x1="352" y1="254" x2="398" y2="254" marker-end="url(#ahm)"/><text class="sWt" x="452" y="258" text-anchor="middle">wa</text><line class="sLm" x1="506" y1="254" x2="548" y2="254" marker-end="url(#ahm)"/><text class="sGt" x="556" y="258">be</text><text class="sS" x="656" y="258">pos='v'</text><text class="sC" x="250" y="278" xml:space="preserve" style="white-space:pre">geese</text><line class="sLm" x1="352" y1="274" x2="398" y2="274" marker-end="url(#ahm)"/><text class="sWt" x="452" y="278" text-anchor="middle">gees</text><line class="sLm" x1="506" y1="274" x2="548" y2="274" marker-end="url(#ahm)"/><text class="sGt" x="556" y="278">goose</text><text class="sC" x="250" y="298" xml:space="preserve" style="white-space:pre">better</text><line class="sLm" x1="352" y1="294" x2="398" y2="294" marker-end="url(#ahm)"/><text class="sWt" x="452" y="298" text-anchor="middle">better</text><line class="sLm" x1="506" y1="294" x2="548" y2="294" marker-end="url(#ahm)"/><text class="sGt" x="556" y="298">good</text><text class="sS" x="656" y="298">pos='a'</text></g>
</svg><ol class="dia-steps">
<li>Regular endings: both methods merge the variants. Porter returns studi, which is not a word but still a consistent feature. running needs pos='v' for WordNet.</li>
<li>Over-stemming: Porter maps organization to organ and university to univers, merging words with different meanings. The lemmatizer keeps them apart.</li>
<li>Irregular forms: ran, was and geese have no suffix to strip. Only a dictionary knows their base forms, and only if it is told the part of speech.</li>
</ol><figcaption>Stems computed with NLTK's PorterStemmer; lemmas are WordNet's, with the part of speech shown where the default noun assumption would fail.</figcaption></figure>

**Which to use.** If a human will read the features (topic modelling, keyword extraction), lemmatize. If only a model will see them and speed matters, stemming is fine — `studi` is a perfectly good feature name as long as it is consistent.

📌 **A subtlety the notebook does not mention:** `WordNetLemmatizer` assumes every word is a **noun** unless told otherwise. So `lemmatize("running")` returns `"running"`, not `"run"`. You must pass the part of speech:

```python
lemmatizer.lemmatize("running", pos='v')   # 'run'
```

Doing this properly requires POS tagging first. It is a real limitation of the naive approach, and one reason spaCy — which tags and lemmatizes in one pass — is preferred in production.

---

## 10.5 The full cleaning pipeline 🟢

```python
text = "The the food is not good! I am loving it :)"

text = text.lower()                                              # 1. lowercase
text = text.translate(str.maketrans("", "", string.punctuation)) # 2. strip punctuation
tokens = word_tokenize(text)                                     # 3. tokenize
tokens = [w for w in tokens if w not in stop_words]              # 4. remove stopwords
lemm_tokens = [lemmatizer.lemmatize(w) for w in tokens]          # 5. lemmatize
```

The order matters. Lowercasing first means `"The"` and `"the"` both match the stopword list. Removing punctuation before tokenizing avoids `"good!"` becoming a distinct token from `"good"`.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 170" role="img" aria-label="A sentence moving through lowercasing, punctuation removal, tokenisation and stopword removal; removing not as a stopword flips the sentence's meaning">
<g data-s="1-1"><text class="sC" x="40" y="60" xml:space="preserve" style="white-space:pre">The the food is not good! I am loving it :)</text><text class="sT" x="360" y="150" text-anchor="middle">raw text</text></g>
<g data-s="2-2"><text class="sC" x="40" y="60" xml:space="preserve" style="white-space:pre">the the food is not good! i am loving it :)</text><text class="sT" x="360" y="150" text-anchor="middle">1. lowercase: "The" and "the" now match</text></g>
<g data-s="3-3"><text class="sC" x="40" y="60" xml:space="preserve" style="white-space:pre">the the food is not good i am loving it </text><text class="sRt" x="360" y="150" text-anchor="middle">2. strip punctuation: the ":)" sentiment signal is gone</text></g>
<g data-s="4-4"><rect class="sB" x="40" y="40" width="43" height="30" rx="6"/><text class="sT" x="61.5" y="60" text-anchor="middle">the</text><rect class="sB" x="89" y="40" width="43" height="30" rx="6"/><text class="sT" x="110.5" y="60" text-anchor="middle">the</text><rect class="sB" x="138" y="40" width="52" height="30" rx="6"/><text class="sT" x="164" y="60" text-anchor="middle">food</text><rect class="sB" x="196" y="40" width="34" height="30" rx="6"/><text class="sT" x="213" y="60" text-anchor="middle">is</text><rect class="sB" x="236" y="40" width="43" height="30" rx="6"/><text class="sT" x="257.5" y="60" text-anchor="middle">not</text><rect class="sB" x="285" y="40" width="52" height="30" rx="6"/><text class="sT" x="311" y="60" text-anchor="middle">good</text><rect class="sB" x="343" y="40" width="25" height="30" rx="6"/><text class="sT" x="355.5" y="60" text-anchor="middle">i</text><rect class="sB" x="374" y="40" width="34" height="30" rx="6"/><text class="sT" x="391" y="60" text-anchor="middle">am</text><rect class="sB" x="414" y="40" width="70" height="30" rx="6"/><text class="sT" x="449" y="60" text-anchor="middle">loving</text><rect class="sB" x="490" y="40" width="34" height="30" rx="6"/><text class="sT" x="507" y="60" text-anchor="middle">it</text><text class="sT" x="360" y="150" text-anchor="middle">3. tokenise into words</text></g>
<g data-s="5-5"><rect class="sR" x="40" y="40" width="43" height="30" rx="6"/><text class="sT" x="61.5" y="60" text-anchor="middle">the</text><rect class="sR" x="89" y="40" width="43" height="30" rx="6"/><text class="sT" x="110.5" y="60" text-anchor="middle">the</text><rect class="sB" x="138" y="40" width="52" height="30" rx="6"/><text class="sT" x="164" y="60" text-anchor="middle">food</text><rect class="sR" x="196" y="40" width="34" height="30" rx="6"/><text class="sT" x="213" y="60" text-anchor="middle">is</text><rect class="sR" x="236" y="40" width="43" height="30" rx="6"/><text class="sT" x="257.5" y="60" text-anchor="middle">not</text><rect class="sB" x="285" y="40" width="52" height="30" rx="6"/><text class="sT" x="311" y="60" text-anchor="middle">good</text><rect class="sR" x="343" y="40" width="25" height="30" rx="6"/><text class="sT" x="355.5" y="60" text-anchor="middle">i</text><rect class="sR" x="374" y="40" width="34" height="30" rx="6"/><text class="sT" x="391" y="60" text-anchor="middle">am</text><rect class="sB" x="414" y="40" width="70" height="30" rx="6"/><text class="sT" x="449" y="60" text-anchor="middle">loving</text><rect class="sR" x="490" y="40" width="34" height="30" rx="6"/><text class="sT" x="507" y="60" text-anchor="middle">it</text><text class="sRt" x="360" y="150" text-anchor="middle">4. remove stopwords: NLTK's list includes "not"</text></g>
<g data-s="6-6"><rect class="sG" x="40" y="40" width="52" height="30" rx="6"/><text class="sT" x="66" y="60" text-anchor="middle">food</text><rect class="sG" x="98" y="40" width="52" height="30" rx="6"/><text class="sT" x="124" y="60" text-anchor="middle">good</text><rect class="sG" x="156" y="40" width="70" height="30" rx="6"/><text class="sT" x="191" y="60" text-anchor="middle">loving</text><text class="sRt" x="360" y="150" text-anchor="middle">"food good loving": the negation has vanished, and the meaning flipped</text></g>
</svg><ol class="dia-steps">
<li>A short review, with mixed case, punctuation and an emoticon.</li>
<li>Lowercasing first means the stopword list catches "The" as well as "the".</li>
<li>Removing punctuation also deletes ":)", a strong sentiment signal. A sentiment pipeline should keep emoticons.</li>
<li>Tokenising splits the string into words.</li>
<li>The standard English stopword list contains "not". Removing it is a classic sentiment-analysis bug.</li>
<li>What's left reads as positive. Every cleaning step is a lossy decision; check what it removes for your task.</li>
</ol><figcaption>The cleaning pipeline, one step at a time, including the trap this part warns about.</figcaption></figure>

`str.maketrans("", "", string.punctuation)` builds a translation table that deletes every punctuation character — a fast, idiomatic way to strip them.

**Each step is a lossy decision, and each should be justified:**

| Step | You lose |
|---|---|
| Lowercasing | `US` (country) vs `us` (pronoun); `Apple` vs `apple` |
| Punctuation removal | `"!!!"` as an intensity signal; emoticons like `:)` |
| Stopword removal | Negation, if you are careless |
| Lemmatization | Tense and number, which sometimes matter |

Note the example sentence contains `:)` — a strong sentiment signal — and step 2 destroys it. For sentiment work you would preserve emoticons deliberately, often by mapping them to tokens like `EMOJI_POSITIVE` before stripping punctuation.

---

## 10.6 Vectorization 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “TF-IDF weights a word by how frequent it is in the document and how rare it is in the corpus. TF-IDF + logistic regression is my first baseline for any text classifier.”

### Bag of Words

```python
from sklearn.feature_extraction.text import CountVectorizer

DOCS = ["THE the FOOD IS GOOd",
        "THE FOOD IS bAD",
        'pizza is amazing']

vectorizer = CountVectorizer(binary=True)
bow = vectorizer.fit_transform(DOCS)

print('Vocab:', vectorizer.get_feature_names_out())
print('shape:', bow.shape)
bow.toarray()
```

**How it works:**

1. Build a vocabulary of every distinct word across all documents.
2. Represent each document as a vector of length |vocab|, where position i is the count of word i.

<figure class="dia"><svg viewBox="0 0 720 202" role="img" aria-label="A bag-of-words matrix: three short documents as rows, seven vocabulary words as columns, with 1 where the document contains the word">
<text class="sM" x="250" y="30" text-anchor="middle">amazing</text>
<text class="sM" x="314" y="30" text-anchor="middle">bad</text>
<text class="sM" x="378" y="30" text-anchor="middle">food</text>
<text class="sM" x="442" y="30" text-anchor="middle">good</text>
<text class="sM" x="506" y="30" text-anchor="middle">is</text>
<text class="sM" x="570" y="30" text-anchor="middle">pizza</text>
<text class="sM" x="634" y="30" text-anchor="middle">the</text>
<text class="sC" x="214" y="66" text-anchor="end">"the the food is good"</text>
<rect class="sN" x="222" y="44" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="250" y="65" text-anchor="middle">0</text>
<rect class="sN" x="286" y="44" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="314" y="65" text-anchor="middle">0</text>
<rect class="sA" x="350" y="44" width="56" height="32" rx="4"/><text class="sT" x="378" y="65" text-anchor="middle">1</text>
<rect class="sA" x="414" y="44" width="56" height="32" rx="4"/><text class="sT" x="442" y="65" text-anchor="middle">1</text>
<rect class="sA" x="478" y="44" width="56" height="32" rx="4"/><text class="sT" x="506" y="65" text-anchor="middle">1</text>
<rect class="sN" x="542" y="44" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="570" y="65" text-anchor="middle">0</text>
<rect class="sA" x="606" y="44" width="56" height="32" rx="4"/><text class="sT" x="634" y="65" text-anchor="middle">1</text>
<text class="sC" x="214" y="106" text-anchor="end">"the food is bad"</text>
<rect class="sN" x="222" y="84" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="250" y="105" text-anchor="middle">0</text>
<rect class="sA" x="286" y="84" width="56" height="32" rx="4"/><text class="sT" x="314" y="105" text-anchor="middle">1</text>
<rect class="sA" x="350" y="84" width="56" height="32" rx="4"/><text class="sT" x="378" y="105" text-anchor="middle">1</text>
<rect class="sN" x="414" y="84" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="442" y="105" text-anchor="middle">0</text>
<rect class="sA" x="478" y="84" width="56" height="32" rx="4"/><text class="sT" x="506" y="105" text-anchor="middle">1</text>
<rect class="sN" x="542" y="84" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="570" y="105" text-anchor="middle">0</text>
<rect class="sA" x="606" y="84" width="56" height="32" rx="4"/><text class="sT" x="634" y="105" text-anchor="middle">1</text>
<text class="sC" x="214" y="146" text-anchor="end">"pizza is amazing"</text>
<rect class="sA" x="222" y="124" width="56" height="32" rx="4"/><text class="sT" x="250" y="145" text-anchor="middle">1</text>
<rect class="sN" x="286" y="124" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="314" y="145" text-anchor="middle">0</text>
<rect class="sN" x="350" y="124" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="378" y="145" text-anchor="middle">0</text>
<rect class="sN" x="414" y="124" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="442" y="145" text-anchor="middle">0</text>
<rect class="sA" x="478" y="124" width="56" height="32" rx="4"/><text class="sT" x="506" y="145" text-anchor="middle">1</text>
<rect class="sA" x="542" y="124" width="56" height="32" rx="4"/><text class="sT" x="570" y="145" text-anchor="middle">1</text>
<rect class="sN" x="606" y="124" width="56" height="32" rx="4" opacity=".5"/><text class="sC" x="634" y="145" text-anchor="middle">0</text>
<text class="sS" x="360" y="190" text-anchor="middle">binary=True: presence only · word order is gone ("dog bites man" = "man bites dog")</text>
</svg><figcaption>Bag of words: one column per vocabulary word, one row per document. Mostly zeros, which is why it is stored as a sparse matrix.</figcaption></figure>

For these three documents the vocabulary is `['amazing', 'bad', 'food', 'good', 'is', 'pizza', 'the']`, and document 1 becomes `[0, 0, 1, 1, 1, 0, 1]`.

`binary=True` records presence (0/1) rather than count — often better for short texts, where a repeated word says little.

Note that `CountVectorizer` lowercases and tokenizes by default, which is why the inconsistent casing in `DOCS` does not matter.

**Why "bag":** the vector has no notion of order. *"dog bites man"* and *"man bites dog"* are identical. That is the fundamental limitation, and it is what n-grams partially address.

### N-grams

```python
ngram_vectorizer = CountVectorizer(ngram_range=(2, 3))
bow_gram = ngram_vectorizer.fit_transform(DOCS)
```

An **n-gram** is a contiguous sequence of n tokens. `ngram_range=(2,3)` extracts bigrams and trigrams: `"the food"`, `"food is"`, `"the food is"`.

This recovers *local* word order. Crucially it makes `"not good"` a single feature, distinct from `"good"` — which is the proper fix for the negation problem, better than editing the stopword list.

**The cost is combinatorial explosion.** A 10,000-word vocabulary has up to 100,000,000 possible bigrams. In practice you constrain it:

```python
CountVectorizer(ngram_range=(1, 2), min_df=5, max_df=0.8, max_features=50000)
```

- `min_df=5` — ignore terms appearing in fewer than 5 documents (noise)
- `max_df=0.8` — ignore terms in more than 80% of documents (de facto stopwords)
- `max_features` — keep only the most frequent N

`ngram_range=(1, 2)` — unigrams *and* bigrams — is the workhorse default.

### TF-IDF

```python
from sklearn.feature_extraction.text import TfidfVectorizer

tfidf = TfidfVectorizer()
x_tfidf = tfidf.fit_transform(DOCS)
print('Vocab:', tfidf.get_feature_names_out())
x_tfidf.toarray()
```

**Term Frequency – Inverse Document Frequency.** The problem with raw counts is that common words dominate every vector. TF-IDF weights each term by how *distinctive* it is:

> **tf-idf(t, d) = tf(t, d) × idf(t)** **idf(t) = log( N / df(t) )**

where `tf` is the term's frequency in this document, `N` is the number of documents, and `df(t)` is how many documents contain the term.

The effect: a word appearing in *every* document has `idf = log(1) = 0` and is zeroed out automatically. A word appearing in one document out of a thousand gets a high weight.

**TF-IDF discovers stopwords for you, from the data.** That is the intuition worth keeping.

(sklearn uses a smoothed variant, `log((1+N)/(1+df)) + 1`, to avoid division by zero, and L2-normalises each row by default so document length does not dominate.)

**Use TF-IDF over raw counts by default.** It is a strict improvement in almost every case.

### The sparse matrix

`bow` and `x_tfidf` are **`scipy.sparse` matrices**, not NumPy arrays — which is why `.toarray()` is needed to view them.

This is not a detail. A 100,000-document corpus with a 50,000-word vocabulary is a 5,000,000,000-cell matrix, of which perhaps 0.1% is non-zero. Dense storage would need 40 GB; sparse storage (values plus coordinates) needs a few hundred megabytes.

**Never call `.toarray()` on a real corpus.** sklearn's linear models, Naive Bayes and SVMs all accept sparse input directly. Tree models generally do not, which is one reason linear models remain the standard choice for text.

---

## 10.7 Cosine similarity 🟢 ⭐

![Cosine similarity compares direction, not length, so a long and a short text on the same topic still match.](figures/fig10_cosine.png)
*Cosine similarity compares direction, not length, so a long and a short text on the same topic still match.*

> [!quote] 💬 Say it in the interview
> “Cosine similarity compares the direction of two vectors, so document length doesn't dominate. It's the standard similarity for TF-IDF and embeddings.”

```python
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

a = np.array([-1, -1])
b = np.array([1, 1])
cosine_similarity(a, b)     # -1.0  (opposite directions)
```

> **cos(θ) = (a · b) / (‖a‖ ‖b‖)**

The dot product from §2.8, normalised by both magnitudes. That normalisation is the whole point:

| Value | Meaning |
|---|---|
| 1 | Same direction — maximally similar |
| 0 | Orthogonal — unrelated |
| −1 | Opposite direction |

(For TF-IDF vectors, which are non-negative, the range is [0, 1] — you never see negatives.)

**Why cosine rather than Euclidean distance?** Because document *length* should not determine similarity. A 50-word review and a 5,000-word essay on the same topic have wildly different vector magnitudes but point in nearly the same direction. Euclidean distance sees them as far apart; cosine sees them as similar.

**This single function is the retrieval half of every RAG system you will build.** Embed the query, embed the documents, rank by cosine similarity, return the top k. The vectors change from sparse TF-IDF to dense transformer embeddings, but the operation is identical.

Uses: document retrieval, duplicate detection, recommendation, semantic search, clustering text.

---

## 10.8 Where this sits relative to modern NLP 🟡 ⭐

> [!info] 📖 Géron Ch. 14 · “Reusing Pretrained Embeddings and Language Models” pp. 551–560; Ch. 15

> [!quote] 💬 Say it in the interview
> “Classical NLP is fast, cheap and interpretable. Transformers win when context and meaning matter, and RAG systems still combine BM25 with embeddings.”

The honest map, since your other work is squarely in the modern half:

| Era | Representation | Captures | Status |
|---|---|---|---|
| **Classical** (this session) | BoW, TF-IDF | Word presence/importance. **No order, no meaning.** | Still the right baseline; still powers sparse retrieval |
| **Static embeddings** (2013–2018) | Word2Vec, GloVe, FastText | Semantic similarity — `king − man + woman ≈ queen` | Largely superseded |
| **Contextual** (2018–) | BERT, sentence-transformers | Meaning *in context* — "bank" differs by sentence | The standard for embeddings/classification |
| **Generative** (2020–) | GPT, Claude, Llama | Generation, reasoning, instruction-following | What your FinSight and GenAI work uses |

**The key limitation this session leaves you with:** TF-IDF has no concept of *meaning*. "car" and "automobile" are entirely unrelated features — orthogonal vectors, cosine similarity 0. Only an embedding model knows they are near-synonyms.

**What carries over unchanged into your RAG and LLM work:**

1. **The vector-similarity retrieval pattern** — §10.7 is exactly what a vector database does.
2. **Chunking and preprocessing decisions** — how you split documents still determines retrieval quality.
3. **Hybrid search** — production RAG systems combine dense embeddings with sparse BM25 (a TF-IDF descendant) because each catches what the other misses. Dense retrieval fails on rare proper nouns and exact codes; sparse retrieval nails them.
4. **The evaluation discipline** — baseline first, measure honestly. Applies identically.

**Practical recommendation:** on a new text-classification task, run TF-IDF + logistic regression *first*. It takes five minutes, needs no GPU, and gives you a number. Only if it is insufficient do you pay for embeddings or fine-tuning. Skipping the baseline is how teams end up running a 7B-parameter model to do something a linear classifier did better.

---

## 10.9 The complete classical pipeline 🟢

The session stops at vectorization. Here is the last mile, using the `Restaurant_Reviews.tsv` and `spam_dataset.csv` files that appear in your `2025-12-14` folder:

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_validate

df = pd.read_csv('Restaurant_Reviews.tsv', sep='\t')
X, y = df['Review'], df['Liked']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words='english')),
    ("clf",   LogisticRegression(max_iter=1000, class_weight='balanced')),
])

pipe.fit(X_train, y_train)
print(classification_report(y_test, pipe.predict(X_test)))
```

Note that **`TfidfVectorizer` is a transformer with a `fit`/`transform` lifecycle**, exactly like `StandardScaler`. It learns the vocabulary and the IDF weights during `fit`. Fitting it on the full corpus before splitting is leakage — the test documents' word frequencies would inform the IDF weights. Putting it in the pipeline makes that impossible.

### Interpretability — the classical method's real advantage

```python
import numpy as np
feature_names = pipe.named_steps['tfidf'].get_feature_names_out()
coefs = pipe.named_steps['clf'].coef_[0]

top_pos = np.argsort(coefs)[-15:]
top_neg = np.argsort(coefs)[:15]
print("Positive:", feature_names[top_pos])
print("Negative:", feature_names[top_neg])
```

Ten lines and you can print the fifteen words that most push a review toward "liked". No transformer gives you that so cheaply. When a stakeholder asks *why* the model flagged something, this is an answer you can put on a slide.

<figure class="dia"><svg viewBox="0 0 720 256" role="img" aria-label="The six most negative and six most positive word weights of a TF-IDF plus logistic regression model trained on twenty short restaurant reviews: words like cold, rude and bland push towards disliked, words like great, delicious and friendly towards liked">
<text class="sM" x="360" y="22" text-anchor="middle">coefficients of a TfidfVectorizer + LogisticRegression pipeline trained on 20 example reviews</text>
<line class="sLm" x1="360" y1="34" x2="360" y2="210"/>
<rect class="sR" x="144.19" y="40" width="215.81" height="20" rx="3" opacity=".75"/><text class="sC" x="136.19" y="55" text-anchor="end">cold</text><text class="sS" x="356" y="55" text-anchor="end">-2.06</text>
<rect class="sR" x="160.647" y="68" width="199.353" height="20" rx="3" opacity=".75"/><text class="sC" x="152.647" y="83" text-anchor="end">slow</text><text class="sS" x="356" y="83" text-anchor="end">-1.90</text>
<rect class="sR" x="164.424" y="96" width="195.576" height="20" rx="3" opacity=".75"/><text class="sC" x="156.424" y="111" text-anchor="end">bland</text><text class="sS" x="356" y="111" text-anchor="end">-1.86</text>
<rect class="sR" x="183.947" y="124" width="176.053" height="20" rx="3" opacity=".75"/><text class="sC" x="175.947" y="139" text-anchor="end">rude</text><text class="sS" x="356" y="139" text-anchor="end">-1.68</text>
<rect class="sR" x="190.555" y="152" width="169.445" height="20" rx="3" opacity=".75"/><text class="sC" x="182.555" y="167" text-anchor="end">terrible</text><text class="sS" x="356" y="167" text-anchor="end">-1.61</text>
<rect class="sR" x="228.699" y="180" width="131.301" height="20" rx="3" opacity=".75"/><text class="sC" x="220.699" y="195" text-anchor="end">dirty</text><text class="sS" x="356" y="195" text-anchor="end">-1.25</text>
<rect class="sG" x="360" y="40" width="250" height="20" rx="3" opacity=".75"/><text class="sC" x="618" y="55">great</text><text class="sS" x="364" y="55">+2.38</text>
<rect class="sG" x="360" y="68" width="228.694" height="20" rx="3" opacity=".75"/><text class="sC" x="596.694" y="83">friendly</text><text class="sS" x="364" y="83">+2.18</text>
<rect class="sG" x="360" y="96" width="162.981" height="20" rx="3" opacity=".75"/><text class="sC" x="530.981" y="111">delicious</text><text class="sS" x="364" y="111">+1.55</text>
<rect class="sG" x="360" y="124" width="153.649" height="20" rx="3" opacity=".75"/><text class="sC" x="521.649" y="139">quick</text><text class="sS" x="364" y="139">+1.46</text>
<rect class="sG" x="360" y="152" width="136.114" height="20" rx="3" opacity=".75"/><text class="sC" x="504.114" y="167">loved</text><text class="sS" x="364" y="167">+1.30</text>
<rect class="sG" x="360" y="180" width="132.499" height="20" rx="3" opacity=".75"/><text class="sC" x="500.499" y="195">amazing</text><text class="sS" x="364" y="195">+1.26</text>
<text class="sRt" x="180" y="222" text-anchor="middle">← pushes towards "disliked"</text><text class="sGt" x="540" y="222" text-anchor="middle">pushes towards "liked" →</text>
<text class="sS" x="360" y="244" text-anchor="middle">each word's weight is readable directly: the reason a classical baseline is easy to explain and to debug</text>
</svg><figcaption>What the interpretability snippet prints, as a picture: the model's strongest words in each direction. Trained on 20 short example reviews written for this figure.</figcaption></figure>

---

## 10.10 NLP at a telecom in Egypt — Arabic, dialect and Franco-Arabic 🟡 ⭐

> [!quote] 💬 Say it in the interview
> “For Egyptian customer text I normalise Arabic letters, handle Franco-Arabic digits, use char n-grams for the baseline, then fine-tune a dialect-aware model such as MARBERT.”

The Géron early-release edition in this folder stops at Chapter 10, before its NLP and transformer chapters. This section adds what a telecom interview in Egypt is likely to probe. (Use-case framing: Part 16 §16.3 #9.)

### Why Arabic customer text is hard

| Challenge | Example | Mitigation |
|---|---|---|
| Egyptian dialect vs MSA | "عايز أغير الباقة" (dialect) vs "أريد تغيير الباقة" (MSA) | Models pretrained on dialectal and social-media Arabic (MARBERT, CAMeLBERT-DA) |
| **Franco-Arabic / Arabizi** | "3ayez a8ayar el ba2a" (numbers stand for letters: 3=ع, 7=ح, 2=ء, 5=خ, 8=غ) | Character n-grams; transliteration normalisation; multilingual models |
| Code-switching | "el internet 3ndy slow gedan" | Character n-grams; XLM-R / multilingual encoders |
| Orthographic variation | أ/إ/آ/ا, ى/ي, ة/ه, elongation "حلوووو", diacritics | **Normalise**: unify alefs, ya, ta-marbuta, strip tatweel and diacritics, collapse repeated letters |
| Rich morphology | Clitics: "وبالباقة" = و + ب + ال + باقة | Segmentation or morphological analysers (CAMeL Tools, Farasa) |
| Short, noisy texts | Tweets, chat, SMS | Robust tokenisation; emojis as features |

```python
import re

def normalize_arabic(text: str) -> str:
    text = re.sub(r"[إأآا]", "ا", text)          # unify alef forms
    text = re.sub(r"ى", "ي", text)               # alef maqsura → ya
    text = re.sub(r"ة", "ه", text)               # ta marbuta → ha
    text = re.sub(r"[ً-ْ]", "", text)  # strip diacritics (tashkeel)
    text = re.sub(r"ـ", "", text)                # strip tatweel
    text = re.sub(r"(.)\1{2,}", r"\1\1", text)   # "حلوووو" → "حلوو"
    return text
```

<figure class="dia"><svg viewBox="0 0 720 392" role="img" aria-label="Arabic normalisation: three alef spellings of internet, two ta marbuta spellings of the bundle, three spellings of excellent with diacritics or tatweel, and three elongated spellings of nice each collapse to one normalised token">
<text class="sM" x="220" y="22" text-anchor="middle">as customers type it</text><text class="sM" x="590" y="22" text-anchor="middle">after normalize_arabic</text>
<rect class="sN" x="150" y="36" width="140" height="22" rx="4"/><text class="sC" x="220" y="52" text-anchor="middle">إنترنت</text>
<line class="sLm" x1="290" y1="47" x2="520" y2="73"/>
<rect class="sN" x="150" y="62" width="140" height="22" rx="4"/><text class="sC" x="220" y="78" text-anchor="middle">أنترنت</text>
<line class="sLm" x1="290" y1="73" x2="520" y2="73"/>
<rect class="sN" x="150" y="88" width="140" height="22" rx="4"/><text class="sC" x="220" y="104" text-anchor="middle">انترنت</text>
<line class="sLm" x1="290" y1="99" x2="520" y2="73"/>
<text class="sS" x="14" y="79">alef forms</text>
<rect class="sG" x="524" y="62" width="132" height="22" rx="4"/><text class="sT" x="590" y="78" text-anchor="middle">انترنت</text>
<rect class="sN" x="150" y="126" width="140" height="22" rx="4"/><text class="sC" x="220" y="142" text-anchor="middle">الباقة</text>
<line class="sLm" x1="290" y1="137" x2="520" y2="150"/>
<rect class="sN" x="150" y="152" width="140" height="22" rx="4"/><text class="sC" x="220" y="168" text-anchor="middle">الباقه</text>
<line class="sLm" x1="290" y1="163" x2="520" y2="150"/>
<text class="sS" x="14" y="156">ta marbuta</text>
<rect class="sG" x="524" y="139" width="132" height="22" rx="4"/><text class="sT" x="590" y="155" text-anchor="middle">الباقه</text>
<rect class="sN" x="150" y="190" width="140" height="22" rx="4"/><text class="sC" x="220" y="206" text-anchor="middle">مُمْتاز</text>
<line class="sLm" x1="290" y1="201" x2="520" y2="227"/>
<rect class="sN" x="150" y="216" width="140" height="22" rx="4"/><text class="sC" x="220" y="232" text-anchor="middle">ممتـــاز</text>
<line class="sLm" x1="290" y1="227" x2="520" y2="227"/>
<rect class="sN" x="150" y="242" width="140" height="22" rx="4"/><text class="sC" x="220" y="258" text-anchor="middle">ممتاز</text>
<line class="sLm" x1="290" y1="253" x2="520" y2="227"/>
<text class="sS" x="14" y="233">diacritics, tatweel</text>
<rect class="sG" x="524" y="216" width="132" height="22" rx="4"/><text class="sT" x="590" y="232" text-anchor="middle">ممتاز</text>
<rect class="sN" x="150" y="280" width="140" height="22" rx="4"/><text class="sC" x="220" y="296" text-anchor="middle">حلوووو</text>
<line class="sLm" x1="290" y1="291" x2="520" y2="317"/>
<rect class="sN" x="150" y="306" width="140" height="22" rx="4"/><text class="sC" x="220" y="322" text-anchor="middle">حلووو</text>
<line class="sLm" x1="290" y1="317" x2="520" y2="317"/>
<rect class="sN" x="150" y="332" width="140" height="22" rx="4"/><text class="sC" x="220" y="348" text-anchor="middle">حلوو</text>
<line class="sLm" x1="290" y1="343" x2="520" y2="317"/>
<text class="sS" x="14" y="323">elongation</text>
<rect class="sG" x="524" y="306" width="132" height="22" rx="4"/><text class="sT" x="590" y="322" text-anchor="middle">حلوو</text>
<text class="sGt" x="360" y="380" text-anchor="middle">11 distinct spellings become 4 tokens, so the model sees one feature where it would have seen many</text>
</svg><figcaption>What the normalize_arabic function above does to real spelling variation. Output computed by running it.</figcaption></figure>

### The recommended ladder

1. **Baseline: `TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5))` + logistic regression or linear SVM.** Character n-grams are robust to dialect spelling, Franco-Arabic and typos. This baseline is often surprisingly strong and fully interpretable (§10.9).

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Franco-Arabic spellings of the word for want compared with 3ayez: word features see zero overlap for any variant, while character n-grams give partial similarity to 3ayz, 3aiez and ayez and almost none to an unrelated word">
<text class="sM" x="14" y="22">similarity of each spelling to "3ayez" (Jaccard over features)</text>
<text class="sS" x="260" y="46" text-anchor="middle">word features</text><text class="sS" x="530" y="46" text-anchor="middle">char_wb n-grams (2–5)</text>
<text class="sT" x="120" y="73" text-anchor="end">3ayez</text>
<rect class="sB" x="140" y="58" width="240" height="20" rx="3"/><text class="sS" x="370" y="73" text-anchor="end">1.00</text>
<rect class="sG" x="410" y="58" width="240" height="20" rx="3"/><text class="sS" x="640" y="73" text-anchor="end">1.00</text>
<text class="sT" x="120" y="103" text-anchor="end">3ayz</text>
<rect class="sB" x="140" y="88" width="1.5" height="20" rx="3"/><text class="sS" x="146" y="103">0.00</text>
<rect class="sG" x="410" y="88" width="67.2" height="20" rx="3"/><text class="sS" x="483.2" y="103">0.28</text>
<text class="sT" x="120" y="133" text-anchor="end">3aiez</text>
<rect class="sB" x="140" y="118" width="1.5" height="20" rx="3"/><text class="sS" x="146" y="133">0.00</text>
<rect class="sG" x="410" y="118" width="48" height="20" rx="3"/><text class="sS" x="464" y="133">0.20</text>
<text class="sT" x="120" y="163" text-anchor="end">ayez</text>
<rect class="sB" x="140" y="148" width="1.5" height="20" rx="3"/><text class="sS" x="146" y="163">0.00</text>
<rect class="sG" x="410" y="148" width="109.091" height="20" rx="3"/><text class="sS" x="525.091" y="163">0.45</text>
<text class="sT" x="120" y="193" text-anchor="end">nefsy</text>
<rect class="sB" x="140" y="178" width="1.5" height="20" rx="3"/><text class="sS" x="146" y="193">0.00</text>
<rect class="sG" x="410" y="178" width="1.5" height="20" rx="3"/><text class="sS" x="416" y="193">0.00</text>
<text class="sS" x="360" y="222" text-anchor="middle">to words, every misspelling is a brand-new token; to character n-grams, it is mostly the same string</text>
</svg><figcaption>Why char_wb n-grams are the right baseline for dialect and Arabizi text. Jaccard similarities computed over the actual n-gram sets.</figcaption></figure>

2. **Fine-tuned Arabic transformer.** AraBERT (MSA-heavy), **MARBERT** (trained on dialectal tweets, a good fit for Egyptian social media), CAMeLBERT variants, or multilingual **XLM-RoBERTa**. Fine-tune with Hugging Face `transformers` on labelled tickets.
3. **LLM zero- or few-shot classification and extraction.** Fast to prototype, but weigh cost per call, latency, consistency, and **data privacy**: customer text must not leave approved environments.

### Typical telecom text tasks and how to evaluate them

| Task | Framing | Metric |
|---|---|---|
| Complaint routing | Multiclass (billing, network, bundle, device, …) | Macro-F1, per-class recall, confusion between similar categories (Part 8 §8.12.9) |
| Urgency / escalation | Binary, imbalanced | Recall at a fixed precision |
| Sentiment | 3-class (neg/neu/pos) | Macro-F1; watch sarcasm and dialect negation |
| Topic discovery | Unsupervised: TF-IDF + NMF/LDA, or embeddings + clustering (Part 9) | Human judgement plus coherence |
| Intent detection (chatbot) | Multiclass with an "out-of-scope" class | Accuracy on in-scope; recall of out-of-scope |
| Call analytics | Speech-to-text (Whisper or Arabic ASR) → the text tasks above | WER for ASR; downstream F1 |

⚠️ **Label quality:** agent-assigned categories are noisy and inconsistent. Estimate inter-annotator agreement (Cohen's κ) on a sample, clean the taxonomy, and consider active learning (Part 9 §9.17) to focus relabelling effort.

### NLP interview questions

- **"TF-IDF vs embeddings?"** TF-IDF: sparse, interpretable, no semantics, a strong baseline. Embeddings: dense, semantic ("internet slow" ≈ "data speed bad"), need more compute. Combine both in hybrid retrieval.
- **"How would you classify Egyptian customer complaints with only 2,000 labelled tickets?"** Normalise the text → char-n-gram TF-IDF + logistic regression baseline → fine-tune MARBERT with stratified CV → active learning to label the most uncertain tickets → evaluate with macro-F1 and a per-class confusion matrix.
- **"What is the difference between stemming and lemmatisation, and does it matter for Arabic?"** §10.4. In Arabic, root-based stemming can over-merge meanings; light stemming (removing affixes) or subword tokenisation is usually better.
- **"What is RAG and when would a telecom use it?"** Retrieve relevant documents (product and tariff terms, troubleshooting guides) with vector or hybrid search, then have an LLM answer grounded in them. Used for agent-assist and customer chatbots. Evaluate retrieval (recall@k) and answer faithfulness separately.

---

> [!check] ✅ Key takeaways
> - Classical pipeline: clean → tokenise → (stop words) → stem/lemmatise → BoW/TF-IDF → classifier.
> - TF-IDF rewards words frequent in a document but rare in the corpus; cosine similarity compares direction.
> - TF-IDF + logistic regression is the baseline to beat, and BM25 still powers hybrid search.
> - Keep negations for sentiment; don't strip stop words before transformers.
> - Egyptian text needs Arabic normalisation, Franco-Arabic handling and char n-grams, then dialect-aware models (MARBERT).
> - Move to transformers when context and meaning matter (Parts 20–21).

## ⚡ Interview quick-fire

Cover the right-hand column and answer out loud first.

| Question | Strong short answer |
|---|---|
| **What is TF-IDF?** | Term frequency × inverse document frequency: a word scores high if it is frequent in *this* document but rare across the corpus. |
| **Stemming vs lemmatisation?** | Stemming chops suffixes with rules (fast, crude: "studies" → "studi"); lemmatisation uses a vocabulary and part of speech to return the dictionary form ("studies" → "study"). |
| **Why remove stop words — and when not to?** | They add noise to bag-of-words models, but negations ("not", "مش") carry sentiment. Don't drop them for sentiment or for transformers. |
| **Bag-of-words weakness?** | It ignores word order and meaning ("not good" ≈ "good not"), and gives huge sparse vectors. Embeddings fix this. |
| **How do you handle Franco-Arabic ("3ayez a2ta3 el net")?** | Normalise the digit-letters (3→ع, 7→ح, 2→ء), use char n-grams, or a model pretrained on dialect and social media (MARBERT). |
| **Baseline for complaint routing?** | TF-IDF (word + char n-grams) + logistic regression with class weights; report macro-F1 per class; then try a fine-tuned Arabic BERT. |

---

## Further reading

- **Speech and Language Processing**, Jurafsky & Martin, 3rd ed. — free drafts at https://web.stanford.edu/~jurafsky/slp3/. **The** NLP textbook. Chapters 2 (regex, tokenization), 4 (Naive Bayes and sentiment), 6 (vector semantics and TF-IDF) cover this session rigorously; later chapters take you to transformers.
- **scikit-learn: Working With Text Data** — https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html — the official tutorial, ending in exactly the pipeline above.
- **spaCy 101** — https://spacy.io/usage/spacy-101 — a faster, more modern alternative to NLTK for production preprocessing (POS tagging, NER, proper lemmatization).
- **The Illustrated Transformer**, Jay Alammar — https://jalammar.github.io/illustrated-transformer/ — the standard visual explanation of the architecture behind everything after 2018. Read this next.
- **sentence-transformers** — https://www.sbert.net/ — the practical library for dense embeddings. `model.encode(texts)` gives you vectors; the cosine similarity from §10.7 works unchanged.
- **"Attention Is All You Need"**, Vaswani et al. (2017) — the original transformer paper. Read it after the Alammar post, not before.
- **BM25** — the sparse retrieval function used in production search. A direct descendant of TF-IDF; worth understanding if you build hybrid RAG.

---

<!-- nav -->
> [!example] 🧭 Step 13 of 26 · Stage 4 of 7: Applied ML
> ← [Part 09 · Unsupervised](09_Unsupervised_PCA_and_Clustering.md) · [Part 11 · Neural networks](11_Neural_Networks.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
