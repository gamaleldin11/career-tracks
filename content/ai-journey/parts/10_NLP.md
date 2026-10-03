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

### The recommended ladder

1. **Baseline: `TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5))` + logistic regression or linear SVM.** Character n-grams are robust to dialect spelling, Franco-Arabic and typos. This baseline is often surprisingly strong and fully interpretable (§10.9).
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
