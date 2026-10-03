# Segmentation, Anomalies, Text, Embeddings and LLMs — The Data Scientist's Unstructured Toolkit

Not every data-science problem has a label column. Marketing wants customer segments; risk wants unusual transactions flagged; operations wants thousands of Arabic complaints sorted by topic; product wants a search that understands meaning. This module covers the unsupervised and text side of the job from a data scientist's point of view: clustering that the business can use, anomaly detection with alert budgets, text classification from TF-IDF to transformers, embeddings, and using LLMs responsibly inside data-science workflows. *AI Journey* Parts 9, 10, 20 and 21 go deeper on the algorithms; your Emotidect and FinSight work are the stories.

> [!focus]
> **Entry must:** run k-means with scaling and choose k sensibly; profile clusters into named segments; build a TF-IDF + logistic regression text classifier; explain embeddings and cosine similarity.
> **Mid adds:** density-based clustering and its parameters, anomaly detection with an alert budget, Arabic text specifics, fine-tuning a transformer classifier, embedding-based search and clustering, LLM zero-shot classification and extraction with evaluation, and choosing between prompting, fine-tuning and classic models.
> **Most asked:** *How would you segment our customers?* · *How do you choose k?* · *How would you detect fraud without labels?* · *How would you classify customer complaints?* · *What are embeddings?* · *When would you use an LLM instead of a trained classifier?*
> **Time budget:** 3.5 hours.

## DS7.1 Segmentation with clustering 🟢 ⭐

**Rules first:** RFM segments ([[DA1.7]]) are simple, explainable and often enough. Use clustering when you want data-driven groups across many behavioural features.

**k-means**, the default:

1. Choose behaviour features (spend, frequency, recency, category mix, channel usage), **transform** skewed ones (log) and **scale** them, because k-means uses distances.
2. Fit for several k; compare the **elbow** of inertia and the **silhouette** score, but choose k mainly by **usefulness and stability** (can marketing act on 5 segments? on 12?).
3. **Profile** each cluster: mean and median of every feature vs the overall average, size, and value; **name** them ("weekend families", "price-sensitive occasional buyers").
4. Check **stability**: rerun with different seeds and a different month; segments that reshuffle aren't real.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import numpy as np
pipe = make_pipeline(FunctionTransformer(np.log1p), StandardScaler())
Xs = pipe.fit_transform(X[["spend_90d", "orders_90d", "days_since_last", "categories_90d"]])
for k in range(3, 9):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(Xs)
    print(k, round(km.inertia_), round(silhouette_score(Xs, km.labels_, sample_size=20_000, random_state=0), 3))
```

| Algorithm | Finds | Strengths | Watch out |
|---|---|---|---|
| **k-means** | Roughly spherical, similar-sized clusters | Fast, simple, scalable | Must choose k; sensitive to scaling and outliers |
| **DBSCAN / HDBSCAN** | Dense regions of any shape; labels outliers as noise | No k; finds odd shapes; noise detection | Parameters (`min_cluster_size`, `eps`); varying densities (HDBSCAN handles these better) |
| **Gaussian mixture** | Overlapping elliptical clusters with **soft** membership | Probabilities of membership | Assumes Gaussian shapes |
| **Hierarchical (agglomerative)** | A tree of merges | A dendrogram to choose levels | Doesn't scale to huge data |

> [!story]
> Your road-accident capstone used **HDBSCAN** (and Folium maps) to find accident hotspots. That's density-based clustering used for a clear purpose: spatial hotspots of any shape, with sparse points left as noise. Say why HDBSCAN suited it better than k-means: unknown number of hotspots, irregular shapes, noise.

> [!say]
> "I'd start with RFM, because it's explainable, then try k-means on log-transformed, scaled behaviour features. I choose the number of clusters by silhouette and the elbow but mainly by whether the segments are distinct, stable across months and actionable, and I profile and name each one so marketing can use it. If clusters have irregular shapes or I need outliers flagged, HDBSCAN."

## DS7.2 Anomaly detection 🟡 ⭐

When labels are rare or missing (new fraud patterns, sensor faults, data-quality incidents):

| Method | Idea |
|---|---|
| **Rules and robust statistics** | Z-scores on robust estimates (median, MAD), percentiles, business rules (amount > 10× the customer's usual) |
| **Isolation Forest** | Random splits isolate anomalies in fewer steps than normal points |
| **Local Outlier Factor** | Points much less dense than their neighbours |
| **Autoencoders** | High reconstruction error = unusual (*AI Journey* Part 23) |
| **Forecast residuals** | A value far outside the forecast's prediction interval ([[DS6]]) |

**Design around an alert budget:** investigators can review, say, 200 cases a day, so rank by anomaly score and tune for **precision in the top 200**. Feed investigation outcomes back as labels; over time, move to a supervised model trained on them.

## DS7.3 Classical text classification 🟢 ⭐

Before transformers: **TF-IDF features + logistic regression or linear SVM** is fast, explainable and often surprisingly strong, so it's the baseline to beat.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
clf = make_pipeline(
    TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=3, sublinear_tf=True),   # character n-grams cope with dialect and spelling
    LogisticRegression(max_iter=2000, class_weight="balanced"))
clf.fit(train_texts, train_labels)
```

**Arabic specifics** (covered in depth in *AI Journey* Part 10):

- **Normalise** alef forms, taa marbuta/haa and yaa/alef maqsura; remove diacritics and tatweel (ـ).
- **Dialects:** Egyptian Arabic differs from Modern Standard Arabic in vocabulary and spelling; models trained on MSA news underperform on social-media complaints.
- **Arabizi / Franco-Arabic** ("3ayez a2ol en el order ma weselsh"): Latin letters and digits for Arabic sounds, common in Egyptian chats; character n-grams help, as do models trained on social-media text.
- **Code-switching** between Arabic and English within a sentence is normal.

> [!term] TF-IDF
> Term frequency × inverse document frequency: a word's weight in a document grows with how often it appears there and shrinks with how many documents contain it, so distinctive words count more than common ones.

## DS7.4 Embeddings 🟢 🟡 ⭐

> [!term] Embedding
> A dense vector (hundreds of numbers) representing a piece of text (or an image, a product, a user) so that **similar meanings are close together**. Similarity is usually measured with **cosine similarity**. Embeddings power semantic search, clustering of texts, deduplication, recommendations, and retrieval for RAG.

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("intfloat/multilingual-e5-base")              # multilingual, handles Arabic
emb = model.encode(["passage: الطلب وصل متأخر ساعتين", "passage: the order arrived two hours late"], normalize_embeddings=True)
similarity = emb[0] @ emb[1]                                              # cosine similarity (normalised vectors)
```

Uses in data science:

- **Topic discovery:** embed thousands of complaints, cluster the embeddings (HDBSCAN, or the BERTopic library), and have analysts (or an LLM) name each cluster.
- **Features:** embeddings of product descriptions or complaint text as model inputs.
- **Semantic search and deduplication** of tickets, products or documents.

**Choosing a model:** multilingual models (the e5 family, BGE-M3, commercial embedding APIs) handle Arabic and English together; Arabic-specific BERT models (CAMeLBERT, MARBERT, AraBERT) are strong for fine-tuning on Arabic and dialectal text. Benchmark on **your** data; leaderboards (MTEB) are a starting point.

## DS7.5 Fine-tuning a transformer classifier 🟡

When you have a few thousand labelled examples and need higher accuracy than TF-IDF, fine-tune a pre-trained encoder (a BERT-family model) for classification with Hugging Face `transformers`: tokenise, add a classification head, train a few epochs with a small learning rate, evaluate with macro F1 on a held-out set, and compare with the TF-IDF baseline and its cost.

> [!story]
> **Emotidect**, your graduation project, fine-tuned **HuBERT** (a transformer pre-trained on speech) for emotion recognition, trained on the Persian ShEMO corpus and validated on Egyptian-Arabic speech, then defended before British and Egyptian juries. That's transfer learning across languages, the same pattern as fine-tuning a text encoder. Be ready to explain the domain shift (Persian training data, Egyptian test speech) and how you measured it.

## DS7.6 LLMs inside data-science work 🟡 ⭐

Large language models are now a practical tool for text tasks, but they need the same rigour as any model.

| Use | How | Guard rails |
|---|---|---|
| **Zero- or few-shot classification** | Prompt with the label set and a few examples | Evaluate on a labelled sample; fix the label set; constrain output |
| **Structured extraction** | Pull fields (product, issue type, refund amount) into JSON from free text | A JSON schema with validation (Pydantic); handle failures |
| **Labelling assistance** | Pre-label data for humans to correct, then train a cheaper model | Measure LLM–human agreement; humans own the final labels |
| **Summarising clusters or topics** | Name embedding clusters from sample texts | Review names; keep examples |
| **Synthetic data** | Generate examples for rare classes | Check realism; never evaluate on synthetic data alone |

**Choosing an approach:**

| Situation | Choose |
|---|---|
| Little or no labelled data, moderate volume, a fast start | **Prompting an LLM** (zero- or few-shot) |
| Thousands of labels, high volume, tight latency or cost, or data that mustn't leave your environment | **A fine-tuned small model** or TF-IDF baseline, possibly trained on LLM-assisted labels |
| A specialised style or format the LLM keeps getting wrong | **Fine-tune** an LLM (for example with LoRA, *AI Journey* Part 21) |
| Answers must come from your documents | **RAG**: retrieve relevant passages, then generate ([[FS3.8]]) |

> [!say]
> "For classifying Arabic complaints I'd start with a TF-IDF baseline and a quick LLM zero-shot run, both evaluated on a few hundred human-labelled examples. If the LLM is accurate but too expensive at our volume, I'd use it to pre-label data, have the team correct it, and fine-tune a small Arabic model that runs cheaply in-house. Whatever the approach, it's judged on macro F1 on held-out labels, not on how good the outputs look."

> [!story]
> FinSight used LLMs for **structured outputs**: the CFO agent's output was parsed into structured JSON and saved as alerts, and the scenario simulator used Pydantic tool schemas. That's the extraction pattern above, with validation. In a DS interview, add how you'd evaluate it: a set of test cases with expected fields, and an accuracy rate per field.

**Evaluating LLM outputs:** a labelled test set, exact-match or F1 for classification and extraction; for free text, rubric-based human review on a sample, and "LLM-as-judge" only after checking its agreement with humans; track cost and latency per item; re-run the evaluation whenever the prompt or model changes.

> [!lab] Sort 2,000 complaints three ways
> Take a public Arabic or English customer-review dataset (or synthetic complaints you label yourself, a few hundred). (1) TF-IDF + logistic regression; (2) multilingual embeddings + logistic regression; (3) LLM zero-shot with a fixed label set and JSON output. Compare macro F1, cost per 1,000 items and latency in one table, then cluster the embeddings with HDBSCAN to find topics nobody labelled. This one notebook covers most of this module and makes a strong portfolio piece.

## DS7.7 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How would you segment customers? | Start with RFM; then k-means on transformed, scaled behaviour features; profile, name and check stability; choose k for usefulness. |
| How do you choose k in k-means? | Elbow and silhouette as guides, but mainly distinct, stable, actionable segments. |
| Why scale before k-means? | It uses distances, so large-scale features would dominate. |
| k-means vs HDBSCAN? | k-means needs k and finds round clusters; HDBSCAN finds dense clusters of any shape and labels noise. |
| How do you detect anomalies without labels? | Robust statistics, Isolation Forest, LOF or autoencoders, ranked within an alert budget, with outcomes fed back as labels. |
| What's a strong text-classification baseline? | TF-IDF (word or character n-grams) with logistic regression or a linear SVM. |
| What's special about Arabic text? | Normalisation, dialects (Egyptian vs MSA), Arabizi, code-switching. |
| What are embeddings? | Dense vectors where similar meanings are close, compared with cosine similarity. |
| How would you find topics in complaints? | Embed them, cluster the embeddings, then name clusters with analysts or an LLM. |
| LLM prompting vs fine-tuning a small model? | Prompting for a fast start with few labels; a fine-tuned small model for high volume, low cost or data that must stay in-house. |
| How do you evaluate an LLM classifier? | Against a held-out human-labelled set with macro F1, plus cost and latency, re-run on every prompt or model change. |
| What did Emotidect do? | Fine-tuned HuBERT for speech emotion recognition on Persian data and validated on Egyptian-Arabic speech. |

## Key takeaways

> [!check]
> - Segments must be stable, distinct and actionable; scaling and profiling matter more than the algorithm.
> - Anomaly detection is ranked against an alert budget, then becomes supervised as labels arrive.
> - TF-IDF + logistic regression is the text baseline; Arabic needs normalisation and dialect awareness.
> - Embeddings turn text into geometry: search, clustering, features.
> - LLMs are models too: fixed label sets, validated outputs, held-out evaluation, cost tracking.

## Sources

- scikit-learn user guide: [Clustering](https://scikit-learn.org/stable/modules/clustering.html), [Novelty and outlier detection](https://scikit-learn.org/stable/modules/outlier_detection.html), [Text feature extraction](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction).
- Leland McInnes et al., [HDBSCAN documentation](https://hdbscan.readthedocs.io/); Fei Tony Liu et al., "Isolation Forest" (ICDM 2008).
- [Sentence Transformers documentation](https://www.sbert.net/); Liang Wang et al., "Multilingual E5 Text Embeddings" (2024); [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard); [BERTopic](https://maartengr.github.io/BERTopic/).
- Go Inoue et al., "The Interplay of Variant, Size, and Task Type in Arabic Pre-trained Language Models" (CAMeLBERT, 2021); Muhammad Abdul-Mageed et al., "ARBERT & MARBERT" (ACL 2021).
- Hugging Face: [Text classification task guide](https://huggingface.co/docs/transformers/tasks/sequence_classification).
- Your *AI Journey* Parts 9, 10, 20, 21 and 23.
