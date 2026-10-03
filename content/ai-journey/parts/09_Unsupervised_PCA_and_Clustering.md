# Part 9 — Unsupervised Learning: PCA and Clustering

<!-- nav -->
> [!example] 🧭 Step 12 of 26 · Stage 3 of 7: Classical ML
> ← [Part 08B · Trees & ensembles](08B_Trees_and_Ensembles.md) · [Part 10 · NLP & Arabic](10_NLP.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2026-01-11/PCA_Reference_Notebook_Digits.ipynb` (20 cells), `college_clustering_kmeans_hierarchical.ipynb` (19 cells), `College_Data.csv` **Lecture:** Lect 13

No labels. No `y`. The task is to find structure in `X` alone — which raises the question the clustering notebook confronts immediately:

> In clustering, there is no single 'accuracy'. We use **internal metrics** (e.g., inertia, silhouette).

Without ground truth there is nothing to be right about. You evaluate structure by its own coherence, and by whether it means anything to a human.

---

# PART A — PCA (Principal Component Analysis)

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Customer segmentation and anomaly detection are everyday telecom tasks, and PCA and K-Means are standard interview topics.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | PCA intuition (variance, components, explained-variance ratio), K-Means (algorithm, choosing k, scaling), hierarchical clustering, silhouette score. |
> | 🟡 **Mid** | Curse of dimensionality; DBSCAN and GMMs, and when each wins; t-SNE/UMAP for visualisation only; anomaly detection (Isolation Forest, GMM density); semi-supervised labelling. |
> | 🔴 **Senior** | Segmentation that drives business action, stability of clusters over time, embeddings + clustering at scale. |
>
> **⭐ Most-asked:** *How does K-Means work, and how do you choose k?* · *What does PCA do, and when should you not use it?* · *K-Means vs DBSCAN vs GMM?* · *Why scale before PCA/K-Means?* · *How would you detect anomalous cells or fraudulent SIMs?*
>
> **⏱ Time:** 4 h  ·  **Short on time?** Read §9.2, §9.7, §9.13, §9.18, §9.20, §9.21.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 9.1 | The problem PCA solves | 🟢 | Ch. 7 · pp. 227–236 |
> | 9.2 | What it actually does | 🟢 ⭐ | — |
> | 9.3 | The code, step by step | 🟢 | — |
> | 9.4 | When to use PCA | 🟢 ⭐ | — |
> | 9.5 | What PCA costs you | 🟢 | — |
> | 9.6 | The problem | 🟢 | — |
> | 9.7 | K-Means | 🟢 ⭐ | Ch. 8 · pp. 249–259 |
> | 9.8 | Hierarchical clustering | 🟢 | — |
> | 9.9 | Comparing and saving | 🟢 | — |
> | 9.10 | Where these get used together | 🟢 | — |
> | 9.11 | The curse of dimensionality — with numbers | 🟡 | Ch. 7 · pp. 222–223 |
> | 9.12 | Two approaches: projection vs manifold learning | 🟡 | Ch. 7 · pp. 223–227 |
> | 9.13 | PCA — the details interviewers probe | 🟡 ⭐ | Ch. 7 · pp. 227–236 |
> | 9.14 | Random projection | 🔴 | Ch. 7 · pp. 236–239 |
> | 9.15 | Manifold learning and visualisation methods | 🟡 | Ch. 7 · pp. 239–242 |
> | 9.16 | K-Means — Géron's additional details | 🟡 | Ch. 8 · pp. 249–259 |
> | 9.17 | Clustering applications from the book | 🟡 | Ch. 8 · pp. 259–265 |
> | 9.18 | DBSCAN, HDBSCAN and the rest | 🟡 ⭐ | Ch. 8 · pp. 265–269 |
> | 9.19 | Gaussian Mixture Models (GMM) | 🟡 | Ch. 8 · pp. 269–279 |
> | 9.20 | Anomaly and novelty detection — the full toolbox | 🟡 ⭐ | Ch. 8 · pp. 274–280 |
> | 9.21 | Interview drill — unsupervised learning | 🟢 ⭐ | Ch. 7, Ch. 8 · p. 242, p. 280 |
> | 9.22 | Real-world examples — unsupervised learning at work | 🟡 | — |
>

---

## 9.1 The problem PCA solves 🟢

> [!info] 📖 Géron Ch. 7 · “PCA” · pp. 227–236

You have 64 features (an 8×8 digit image). You cannot plot 64 dimensions. Many of those features are redundant — corner pixels are almost always blank, adjacent pixels are highly correlated. Some are pure noise.

**PCA finds a smaller set of new axes that retain as much of the variation as possible.**

The notebook's own summary:

> 1) PCA finds new axes (PCs) that maximize variance, in decreasing order.
> 2) `explained_variance_ratio_` tells how much variance each PC captures.
> 3) Use cumulative explained variance to choose k (e.g., 95%).
> 4) PCA projection is reversible approximately via `inverse_transform`.
> 5) Scaling is often necessary before PCA.

## 9.2 What it actually does 🟢 ⭐

![PCA rotates the data onto the directions of maximum variance; the cumulative curve tells you how many components to keep.](figures/fig09_pca.png)
*PCA rotates the data onto the directions of maximum variance; the cumulative curve tells you how many components to keep.*

> [!quote] 💬 Say it in the interview
> “PCA finds orthogonal directions of maximum variance and projects the data onto the top ones. I scale first and keep enough components for ~95% of the variance.”

Geometrically: imagine your data as a cloud of points. PCA asks, *along which direction is the cloud most spread out?* That direction is **PC1**. Then: *among directions perpendicular to PC1, which has the most spread?* That is **PC2**. And so on.

The result is a new coordinate system, rotated to align with the data's own axes of variation. Three properties follow:

1. **The components are orthogonal** — mutually perpendicular, hence uncorrelated. PCA output has zero multicollinearity by construction.
2. **They are ordered by variance** — PC1 captures the most, PC2 the next most, and so on.
3. **Keeping the first k gives the best possible k-dimensional linear approximation** of the data, in a least-squares sense.

Mathematically it is the eigendecomposition of the covariance matrix — the eigenvectors are the principal components, the eigenvalues are the variance along each. In practice sklearn uses SVD, which is numerically better behaved. This is the "linear algebra will be useful later" promissory note from Part 2 being redeemed.

**Why variance?** The working assumption is that a direction along which the data varies a lot carries information, and a direction along which everything is nearly constant does not. This is usually right and occasionally wrong — see §9.5.

## 9.3 The code, step by step 🟢

```python
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

digits = load_digits()
X = digits.data      # (1797, 64)
y = digits.target    # labels — used ONLY for colouring the plot
```

Note the comment in the notebook: *"we use them only for visualization (coloring)"*. PCA never sees `y`. That is what makes it unsupervised.

### Scale first

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

> PCA is based on variance. If features have different scales, PCA can be biased.

**This is not optional and it is not a style choice.** PCA maximises variance, and variance has units. A feature measured in metres has 1,000,000× the variance of the same feature in millimetres. Without standardisation, PC1 is simply whichever feature happens to use the largest units.

(The exception: when all features are already in the same natural units — as pixel intensities arguably are — some practitioners skip it. The notebook scales anyway, which is the safer default.)

### Fit with all components, inspect the variance

```python
pca_full = PCA()
Z_full = pca_full.fit_transform(X_scaled)

explained_ratio  = pca_full.explained_variance_ratio_
cumulative_ratio = np.cumsum(explained_ratio)

print("Cumulative variance at 10 comps:", cumulative_ratio[9])
```

`explained_variance_ratio_` is the fraction of total variance each component captures. It sums to 1 across all components. The cumulative sum answers "how much do I keep if I stop at k?"

### The scree plot

```python
plt.plot(np.arange(1, len(explained_ratio) + 1), explained_ratio, marker="o")
plt.xlabel("Principal Component"); plt.ylabel("Explained Variance Ratio")
plt.title("Scree Plot")

plt.plot(np.arange(1, len(cumulative_ratio) + 1), cumulative_ratio)
```

> - Scree plot helps you see where variance drops.
> - Cumulative plot helps you pick k such that you capture (e.g.) 90% or 95% variance.

Two ways to choose k, and you should look at both:

- **The elbow** — the point on the scree plot where the curve flattens. Components after the elbow add little. Subjective but often obvious.
- **A variance threshold** — the smallest k reaching 90% or 95%. Objective, and the more common choice in practice.

### Choosing k programmatically

```python
def find_k_for_variance(cum_var: np.ndarray, target: float) -> int:
    # returns smallest k such that cum_var[k-1] >= target
    return int(np.argmax(cum_var >= target) + 1)

for target in [0.80, 0.90, 0.95, 0.99]:
    k = find_k_for_variance(cumulative_ratio, target)
    print(f"Target={target:.2f} -> k={k}, cumulative={cumulative_ratio[k-1]:.4f}")
```

A neat idiom: `np.argmax` on a boolean array returns the index of the **first `True`**, because `True` is the maximum value. That is the smallest k meeting the threshold.

For the digits dataset, 95% of the variance sits in roughly 40 of the 64 components — a modest reduction. On datasets with more redundancy the ratio is far more dramatic.

### Letting sklearn do it

```python
pca_95 = PCA(n_components=0.95, random_state=42)
Z_95 = pca_95.fit_transform(X_scaled)

print("Selected components (k):", pca_95.n_components_)
print("Captured variance:", np.sum(pca_95.explained_variance_ratio_))
```

> scikit-learn allows setting `n_components` as a float between (0,1): `PCA(n_components=0.95)` chooses the smallest number of components that capture **95%** variance.

A genuinely useful API detail: an **integer** means "give me exactly this many components", a **float in (0,1)** means "give me however many I need to reach this variance". The second form is usually what you want, because it adapts to the dataset.

### Visualising in 2D

```python
pca_2 = PCA(n_components=2, random_state=42)
Z_2 = pca_2.fit_transform(X_scaled)

print("Variance captured by 2 PCs:", pca_2.explained_variance_ratio_.sum())

plt.scatter(Z_2[:, 0], Z_2[:, 1], c=y, s=15)
plt.xlabel("PC1"); plt.ylabel("PC2")
```

Two components capture only ~22% of the variance in the digits data, yet the plot still shows visible clustering by digit. That is the honest lesson: **a 2-D PCA plot is for intuition, not for conclusions.** You are looking at a shadow of a 64-dimensional object.

### Reconstruction

```python
X_reconstructed = pca_95.inverse_transform(Z_95)
```

`inverse_transform` projects back into the original 64-dimensional space. It is **approximate** — the discarded 5% of variance is gone permanently. Reconstructing the digit images and viewing them side by side with the originals is the best possible demonstration of what "5% information loss" looks like: slightly blurrier digits, still perfectly readable.

This is also, in essence, lossy compression.

## 9.4 When to use PCA 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “I use PCA for compression, visualisation, de-noising or collinear features — not when I need interpretable features, and not before tree models, which don't need it.”

| Use case | Why |
|---|---|
| **Visualisation** | 2 or 3 components to see high-dimensional data |
| **Speed** | Fewer features → faster training |
| **Fighting the curse of dimensionality** | Directly helps KNN and clustering |
| **Removing multicollinearity** | Components are orthogonal by construction |
| **Denoising** | Low-variance components are often noise; dropping them cleans the data |

## 9.5 What PCA costs you 🟢

**1. Interpretability, almost entirely.** PC1 is a linear combination of all 64 original features — "0.13 × pixel_1 + 0.07 × pixel_2 − …". You can no longer say "age was the most important feature". For a model that must be explained to a regulator, this is disqualifying.

**2. It is linear.** PCA can only find linear structure. Data lying on a curved manifold (a Swiss roll) defeats it. Non-linear alternatives: **t-SNE** and **UMAP** for visualisation, kernel PCA and autoencoders for reduction.

⚠️ t-SNE and UMAP are for *looking*, not for feature engineering — distances between clusters in a t-SNE plot are not meaningful, and cluster sizes are arbitrary.

**3. Variance is not the same as usefulness.** PCA is unsupervised: it does not know what you are predicting. It is entirely possible for the most predictive direction to be a low-variance one, in which case PCA discards exactly the signal you needed. If your goal is supervised, consider supervised alternatives (LDA, or just feature selection) before reaching for PCA.

**4. It must live inside your pipeline.** `PCA` is a transformer with learned parameters (the components). Fitting it on the full dataset before splitting is leakage, same as any scaler.

---

# PART B — CLUSTERING

## 9.6 The problem 🟢

Group similar observations without knowing what the groups are. The College dataset has 777 US universities with features like enrolment, tuition, graduation rate — and no labels. Are there natural types of institution?

The notebook's own plan:

> 1. Load data + quick checks
> 2. Data cleaning (duplicates, missing values, dtypes)
> 3. EDA
> 4. Preprocessing pipeline (impute + optional outlier clipping + scaling + one-hot)
> 5. K-Means clustering (random init) + evaluation (Elbow, Silhouette)
> 6. K-Means++ clustering (smart init) + evaluation
> 7. Cluster interpretation (profile clusters)
> 8. Hierarchical clustering (dendrogram + Agglomerative)
> 9. Compare methods + save artifacts

Note that steps 1–4 are identical to every supervised notebook. **The preparation does not change just because the task did.**

```python
print("Duplicate rows:", df.duplicated().sum())
# Duplicates can bias clustering by repeating some points.
# Clustering algorithms typically cannot accept NaN.
df.drop(columns=['University'])   # a name/identifier, not a measurement
```

Both comments matter. Duplicated rows act as weights, silently pulling centroids toward themselves. And unlike some tree models, K-Means cannot tolerate a single NaN.

## 9.7 K-Means 🟢 ⭐

> [!info] 📖 Géron Ch. 8 · “k-Means Clustering” · pp. 249–259

![Choosing k: the elbow is often ambiguous — the silhouette score is more reliable.](figures/fig09_kmeans_choose_k.png)
*Choosing k: the elbow is often ambiguous — the silhouette score is more reliable.*

> [!quote] 💬 Say it in the interview
> “K-Means alternates assigning points to the nearest centroid and moving centroids to the mean. I scale features, use k-means++, and choose k with the silhouette score plus business sense.”

### The algorithm

1. Choose k, the number of clusters.
2. Initialise k centroids.
3. **Assign** each point to its nearest centroid.
4. **Update** each centroid to the mean of the points assigned to it.
5. Repeat 3–4 until assignments stop changing.

This is **Lloyd's algorithm**, and it is a special case of Expectation-Maximisation.

**What it optimises** — *inertia*, also called within-cluster sum of squares:

> **inertia = Σ_clusters Σ_points ‖x − centroid‖²**

Minimise the total squared distance from every point to its own centroid.

### K-Means++ — why initialisation matters

Random initialisation can place two centroids in the same natural cluster, and the algorithm has no way to recover — it converges to a poor local optimum. Run it again with a different seed and you get a different answer.

**K-Means++** picks initial centroids probabilistically, favouring points far from those already chosen. It costs one extra pass and gives markedly better, more stable results.

It is sklearn's default (`init='k-means++'`), which is why the notebook contrasts it with explicit `init='random'`.

`n_init=10` (also default) runs the whole thing ten times with different initialisations and keeps the lowest-inertia result — belt and braces.

### Choosing k, method 1: the elbow

```python
Ks = range(2, 11)
inertias = []
for k in Ks:
    km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
    km.fit(X)
    inertias.append(km.inertia_)

plt.plot(Ks, inertias, marker='o')
plt.xlabel('k'); plt.ylabel('Inertia')
```

Inertia falls monotonically as k rises — at k = n it reaches zero, with every point its own cluster. So you cannot minimise it; you look for the **elbow**, where the rate of improvement drops sharply.

The elbow is often ambiguous. Which is why:

### Choosing k, method 2: silhouette

```python
from sklearn.metrics import silhouette_score

sil = []
for k in Ks:
    km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
    labels = km.fit_predict(X)
    sil.append(silhouette_score(X, labels))
```

For each point, the silhouette coefficient is:

> **s = (b − a) / max(a, b)**

where **a** is the mean distance to other points in its *own* cluster (cohesion) and **b** is the mean distance to points in the *nearest other* cluster (separation).

| s | Meaning |
|---|---|
| ≈ +1 | Well inside its cluster, far from others |
| ≈ 0 | On the boundary between two clusters |
| ≈ −1 | Probably assigned to the wrong cluster |

`silhouette_score` averages over all points. **Unlike inertia, it does not monotonically improve with k**, so you can genuinely maximise it. That makes it the better selection criterion, and it is why the notebook uses it for the final choice.

Real silhouette scores on messy data are often 0.2–0.4. Do not expect 0.9.

📌 Also worth knowing: `silhouette_samples` gives the per-point values, from which you can draw a **silhouette plot** — one horizontal bar per point, grouped by cluster. It reveals clusters that are thin, or that contain many negative-silhouette points, which the average hides.

### Interpreting the clusters — the step that gives the analysis meaning

```python
df['cluster'] = cluster_labels_km
profile = df.groupby('cluster').mean()
```

**This is the actual deliverable.** "Cluster 2" is a meaningless label until you look at its profile and can say: *"Cluster 2 is small, expensive, private colleges with high graduation rates."*

Do this every time. An unlabelled clustering that nobody has characterised has produced no knowledge.

### Visualising with PCA

```python
pca = PCA(n_components=2, random_state=RANDOM_STATE)
X_2d = pca.fit_transform(X)
plt.scatter(X_2d[:, 0], X_2d[:, 1], c=cluster_labels_km)
```

> Important: PCA plot is for intuition, not for judging final performance.

The notebook's own caveat, and it is correct. Clusters that overlap in a 2-D projection may be perfectly separated in the full space. Judge by silhouette, not by the picture.

### K-Means' assumptions — and when it fails

K-Means implicitly assumes clusters are:

1. **Spherical** — because it uses Euclidean distance from a centre.
2. **Similarly sized** — large clusters get split, small ones absorbed.
3. **Similarly dense**.
4. **Convex** — it cannot find crescent or ring shapes.

And you must specify k in advance.

When these fail, alternatives:

| Algorithm | Handles |
|---|---|
| **DBSCAN** | Arbitrary shapes, automatic cluster count, explicit noise points. Needs `eps` and `min_samples`. |
| **HDBSCAN** | DBSCAN with varying density; fewer parameters. **Used in the capstone's spatial extension.** |
| **Gaussian Mixture Models** | Elliptical clusters, soft (probabilistic) assignments |

⚠️ **K-Means requires scaling**, for exactly the reason KNN does — it is distance-based.

## 9.8 Hierarchical clustering 🟢

```python
from scipy.cluster.hierarchy import dendrogram, linkage
from sklearn.cluster import AgglomerativeClustering

Z = linkage(X, method='ward')
dendrogram(Z)
```

> Hierarchical clustering builds a tree of clusters (a dendrogram). Common linkage methods:
> - `'ward'` (minimizes within-cluster variance; works best with Euclidean distances)
> - `'complete'`, `'average'`, `'single'`

**Agglomerative (bottom-up):** every point starts as its own cluster; the two closest clusters merge; repeat until one cluster remains. The merge history is the dendrogram.

**Linkage** defines the distance between two *clusters*:

| Method | Distance between clusters | Character |
|---|---|---|
| **single** | Closest pair of points | Finds long chains; sensitive to noise |
| **complete** | Farthest pair | Compact, roughly equal-diameter clusters |
| **average** | Mean of all pairwise distances | A compromise |
| **ward** | Increase in total within-cluster variance | **Usually best**; K-Means-like results |

### Reading a dendrogram

The y-axis is the distance at which two clusters merged. **A tall vertical line means two very dissimilar groups were merged** — so cutting the tree just below the tallest jump is a principled way to choose k.

```python
sil_h = []
for k in Ks:
    agg = AgglomerativeClustering(n_clusters=k, linkage='ward')
    labels_h = agg.fit_predict(X)
    sil_h.append(silhouette_score(X, labels_h))
```

### The two advantages over K-Means

1. **You do not have to choose k in advance** — you build the whole tree and cut it wherever you like, after looking.
2. **The hierarchy is itself informative.** It shows nested structure: two clusters that merge early are more similar than two that merge late.

### The two disadvantages

1. **O(n³) time and O(n²) memory** in the naive implementation. Above ~10,000 points it becomes impractical. K-Means is roughly linear.
2. **Merges are irreversible.** A bad early merge cannot be undone — the same greedy limitation as decision trees.

## 9.9 Comparing and saving 🟢

```python
sil_km      = silhouette_score(X, cluster_labels_km)
sil_h_final = silhouette_score(X, cluster_labels_h)

print("Silhouette (K-Means++):", round(sil_km, 4))
print("Silhouette (Hierarchical):", round(sil_h_final, 4))
```

```python
joblib.dump(preprocess, "artifacts_clustering/preprocess.joblib")
joblib.dump(kmeans,     "artifacts_clustering/kmeans.joblib")
```

> Note: `AgglomerativeClustering` has no `predict()` in sklearn, so it [cannot be applied to new data]

**An important practical asymmetry.** K-Means learns k centroids; a new point is assigned to the nearest one — that is `predict()`. Hierarchical clustering learns no such parameters; the clustering exists only for the points it was fitted on. To assign a new point you must re-run the whole thing.

So: **use hierarchical clustering for analysis, K-Means for anything that has to run in production.**

```python
preprocess_loaded = joblib.load("artifacts_clustering/preprocess.joblib")
kmeans_loaded     = joblib.load("artifacts_clustering/kmeans.joblib")
# new raw rows (same schema) -> transform -> predict cluster
```

The same inference contract as the supervised parts.

---

## 9.10 Where these get used together 🟢

The capstone (Part 13) uses both ideas in an "advanced extension":

> Accidents are **spatial events**. We can discover: **hotspots** (high-density accident zones), **noise/outliers** (isolated accidents). […] Output: A new feature `cluster_id` that can be used later in classification.

**Clustering as feature engineering.** Run HDBSCAN on latitude/longitude, get a `cluster_id`, feed it into the supervised model as a categorical feature. The unsupervised step discovers "this accident happened in a known hotspot", which no single raw column encodes.

HDBSCAN is chosen over K-Means there for good reasons the notebook states — it handles varying densities, finds the cluster count itself, and labels sparse points as noise rather than forcing them into a group. All three matter for geographic data.

---

# PART C — GOING DEEPER WITH GÉRON (Ch. 7 & 8)

> [!note] 📘 From the book
> Sections 9.11–9.20 add material from Géron's *Hands-On Machine Learning* (2025), Chapter 7 "Dimensionality Reduction" and Chapter 8 "Unsupervised Learning Techniques". Géron quotes Yann LeCun: *"if intelligence was a cake, unsupervised learning would be the cake, supervised learning would be the icing on the cake, and reinforcement learning would be the cherry."* Most real data, including most telecom data, is unlabelled.

## 9.11 The curse of dimensionality — with numbers 🟡

> [!info] 📖 Géron Ch. 7 · “The Curse of Dimensionality” · pp. 222–223

High-dimensional space defies intuition. Géron's figures:

| Fact | 2-D | High-D |
|---|---|---|
| Chance a random point in a unit hypercube is within 0.001 of a border | ~0.4% | **> 99.999999%** at 10,000-D. Almost every point is "extreme" in some dimension |
| Average distance between two random points in a unit hypercube | ~0.52 (square), ~0.66 (cube) | **≈ 408** at 1,000,000-D (≈ √(n/6)) |

Consequences:
- **Data becomes sparse.** Training instances are far from each other, so distance- and similarity-based methods (KNN, K-Means) degrade.
- **New instances are far from every training instance**, so predictions become large extrapolations and are less reliable.
- **Models fit noise more easily**, so regularisation matters more.
- The number of samples needed to keep a fixed density **grows exponentially** with the number of dimensions. With just 100 features in [0, 1], keeping points within 0.1 of each other on average would need more samples than there are atoms in the observable universe.

Géron's joke: *"anyone you know is probably an extremist in at least one dimension"*.

## 9.12 Two approaches: projection vs manifold learning 🟡

> [!info] 📖 Géron Ch. 7 · “Main Approaches for Dimensionality Reduction” · pp. 223–227

**Projection.** Real data is rarely spread uniformly. Many features are nearly constant or highly correlated, so the data lies near a **lower-dimensional subspace**. Project onto that subspace (a plane in 3-D, say) and you get new coordinates z₁, z₂. PCA and random projection work this way.

**Manifold learning.** Sometimes the subspace **twists** (the Swiss roll). Projecting by dropping a coordinate squashes the layers together; what you want is to *unroll* it. A **d-dimensional manifold** is a shape that *locally* looks like a d-dimensional hyperplane but is bent inside n-D space. The **manifold hypothesis** says most real high-dimensional data lies near a much lower-dimensional manifold. MNIST digits are a tiny, constrained subset of all possible 784-pixel images. LLE, Isomap, t-SNE and UMAP model the manifold.

⚠️ **The hidden second assumption:** that the task becomes *simpler* in the manifold's coordinates. Often true, not always. Géron's counter-example: a decision boundary at x₁ = 5 is a simple plane in 3-D but becomes four disconnected segments after unrolling. **Dimensionality reduction speeds up training but does not always improve accuracy.** It helps most when the dataset is small relative to the number of features, noisy, or full of redundant (correlated) features.

Géron also warns that *"some models, such as neural networks, can handle high-dimensional data efficiently and learn to reduce its dimensionality"* themselves. An extra PCA step does not always help.

## 9.13 PCA — the details interviewers probe 🟡 ⭐

> [!info] 📖 Géron Ch. 7 · “PCA” → “Incremental PCA” · pp. 227–236

> [!quote] 💬 Say it in the interview
> “PCA maximises preserved variance, equivalent to minimising reconstruction error; components come from the SVD of the centred data. Incremental or randomised PCA handles big data.”

### Why maximise variance?

Two equivalent justifications:
1. The axis with the most variance **loses the least information** when you project. Géron's analogy: your shadow on the ground at noon is a blob; on a wall at sunrise it looks like you.
2. It is the axis that **minimises the mean squared distance** between the data and its projection. PCA is the best low-rank approximation in the least-squares sense (Pearson, 1901).

### The mechanics, from scratch

```python
import numpy as np

X_centered = X - X.mean(axis=0)           # PCA assumes centred data
U, s, Vt = np.linalg.svd(X_centered)      # SVD: X = U Σ Vᵀ
c1, c2 = Vt[0], Vt[1]                     # rows of Vᵀ = principal components (unit vectors)

W2 = Vt[:2].T                             # first d = 2 columns of V
X2D = X_centered @ W2                     # projection:  X_d-proj = X · W_d
```

- The **principal components** are the columns of **V** (rows of Vᵀ), ordered by variance.
- Explained variance of component i = **sᵢ² / (m − 1)**. The ratio divides by the total.
- **Equivalently:** the PCs are the **eigenvectors of the covariance matrix** XᵀX/(m−1), and the eigenvalues are the variances. SVD is the numerically preferred route.
- **Reconstruction:** X_recovered = X_d-proj · W_dᵀ (then add the mean back). The mean squared difference from the original is the **reconstruction error**.

⚠️ Géron's warning: **a PC's sign (direction) is not stable.** Perturb the data slightly and a component can flip, or two components with similar variance can rotate or swap. If PCA feeds a downstream model, **refit the model whenever you refit the PCA**.

### In scikit-learn

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X2D = pca.fit_transform(X)               # centres automatically
pca.components_                          # = W_dᵀ, one row per PC
pca.explained_variance_ratio_            # e.g. [0.82, 0.11] → the 3rd PC holds ~7%
```

**Choosing d:**
1. **A variance threshold**: `PCA(n_components=0.95)`. On MNIST this keeps **154 of 784** dimensions: under 20% of the size for 5% of the variance.
2. **The elbow** of the cumulative explained-variance curve (about 100 for MNIST).
3. **2 or 3** for visualisation.
4. **Tune d as a hyperparameter** when PCA feeds a supervised model:

```python
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline

clf = make_pipeline(PCA(random_state=42), RandomForestClassifier(random_state=42))
param_distrib = {"pca__n_components": np.arange(10, 80),
                 "randomforestclassifier__n_estimators": np.arange(50, 500)}
rnd_search = RandomizedSearchCV(clf, param_distrib, n_iter=10, cv=3, random_state=42)
rnd_search.fit(X_train[:1000], y_train[:1000])
# best: ~57 components for a Random Forest; a linear SGDClassifier needs ~70
```

A more powerful downstream model needs fewer components. Also weigh the **size and speed** of the final model against accuracy.

### PCA variants — which one when

| Variant | How | Complexity | When |
|---|---|---|---|
| Full SVD (`svd_solver="full"`) | Exact | O(m·n²) + O(n³) | Small or medium data where precision matters |
| **Randomized PCA** (`svd_solver="randomized"`) | Stochastic approximation of the first d PCs | **O(m·d²) + O(d³)** | d ≪ n. Chosen automatically when max(m, n) > 500 and d < 80% of min(m, n) |
| `"covariance_eigh"` | Eigendecomposition of the covariance matrix | Very fast | Few features (n < 1,000) and m > 10n. Auto-selected there |
| **Incremental PCA** (`IncrementalPCA`) | `partial_fit` on mini-batches, or `fit` on an `np.memmap` | — | Data doesn't fit in memory; streaming data |
| **Random projection** | Multiply by a random matrix | Almost free to "train" | Tens of thousands to millions of features (text, genomics); very sparse data |

```python
from sklearn.decomposition import IncrementalPCA
inc_pca = IncrementalPCA(n_components=154)
for X_batch in np.array_split(X_train, 100):
    inc_pca.partial_fit(X_batch)
X_reduced = inc_pca.transform(X_train)
```

## 9.14 Random projection 🔴

> [!info] 📖 Géron Ch. 7 · “Random Projection” · pp. 236–239

A **random** linear projection preserves pairwise distances surprisingly well. This is the **Johnson–Lindenstrauss lemma**. The target dimension that keeps squared distances within ±ε with high probability depends only on **m and ε, not on n**:

> **d ≥ 4 log(m) / (ε²/2 − ε³/3)**

```python
from sklearn.random_projection import (johnson_lindenstrauss_min_dim,
                                       GaussianRandomProjection,
                                       SparseRandomProjection)
johnson_lindenstrauss_min_dim(5_000, eps=0.1)       # → 7,300 (from 20,000 features)
srp = SparseRandomProjection(eps=0.1, random_state=42)
X_reduced = srp.fit_transform(X)                    # fit only needs X's shape
```

- `SparseRandomProjection` is **usually preferred**: about 25 MB instead of 1.2 GB for the random matrix in Géron's example, ~50% faster, keeps sparse input sparse, and loses almost no quality. Its default density is 1/√n.
- It loses a bit more signal than PCA. The trade-off is training speed versus quality.
- The same idea underlies **locality-sensitive hashing (LSH)**, used for near-duplicate detection and similarity search. Géron notes that fruit flies do something similar in their olfactory system.

## 9.15 Manifold learning and visualisation methods 🟡

> [!info] 📖 Géron Ch. 7 · “LLE”, “Other Dimensionality Reduction Techniques” · pp. 239–242

| Method | Preserves | Notes |
|---|---|---|
| **LLE** (Locally Linear Embedding) | Each point's linear reconstruction from its k neighbours | Step 1: find weights ŵᵢⱼ that best reconstruct each xᵢ from its neighbours (rows sum to 1). Step 2: find low-D zᵢ that are reconstructed by the *same* weights. Unrolls Swiss rolls well. **O(m²)** in the last step, so small/medium data only |
| **MDS** | All pairwise distances | Keeps global shape |
| **Isomap** | **Geodesic** distances along a k-NN graph | Best for smooth manifolds with one global structure |
| **t-SNE** | Neighbourhoods: similar points stay close, dissimilar ones apart | **Visualisation only.** Amplifies clusters; global distances and cluster sizes are meaningless; not a preprocessing step |
| **UMAP** (`umap-learn`) | Local *and* more global structure | Scales better than t-SNE. Good for visualising millions of points |
| **LDA** (Linear Discriminant Analysis) | Class separation (it is **supervised**) | Projects onto the most discriminative axes. A good reduction before a classifier |

**PCA vs LDA**, a classic question: PCA is unsupervised and maximises total variance. LDA is supervised and maximises between-class separation relative to within-class spread. It gives at most K − 1 components for K classes.

## 9.16 K-Means — Géron's additional details 🟡

> [!info] 📖 Géron Ch. 8 · “k-Means”, “Limits of k-Means” · pp. 249–259

**Hard vs soft clustering.** `predict` gives the nearest centroid. `kmeans.transform(X)` gives the **distance to every centroid**, a k-dimensional representation. That is a cheap **non-linear dimensionality reduction**, or a set of features for another model (Part 4 §4.10.11's `ClusterSimilarity`). The decision regions form a **Voronoi tessellation**.

**Convergence:** guaranteed, because inertia never increases in either step, though possibly to a **local optimum** that depends on initialisation. Complexity is usually linear in m, k and n when the data has cluster structure.

**Initialisation:**
- Pass known centroids with `init=np.array([...])`.
- **`n_init`** runs several initialisations and keeps the lowest **inertia**. Note that `kmeans.score(X)` returns **−inertia** ("greater is better").
- **k-means++** (Arthur & Vassilvitskii, 2006): pick the first centroid at random, then each next one with probability ∝ **D(x)²**, the squared distance to the nearest centroid already chosen. That spreads the centroids out, *"just like spreading out fishing boats"*. sklearn's default is **greedy k-means++** with `n_init=1` by default.

**Faster variants:**
- `algorithm="elkan"` uses the triangle inequality to skip distance computations. Sometimes faster, sometimes slower.
- **`MiniBatchKMeans`** moves centroids a little per mini-batch. Much faster; handles data that doesn't fit in memory (memmap or `partial_fit`); inertia slightly worse.

**Choosing k, Géron's refinement:** inertia always falls as k grows (k = 8 beats k = 5 on inertia even though 5 is right), so use the elbow only as a coarse guide. The **silhouette score** is better, and the **silhouette diagram** (one "knife" per cluster, height = cluster size, width = sorted coefficients) is better still. In Géron's example k = 4 has a slightly higher mean silhouette, but k = 5 gives clusters of **similar sizes with most points past the mean line**, so he picks 5.

**Limits:** k-means needs several runs and a specified k, and handles **clusters of different sizes, densities or non-spherical shapes** badly. On elongated ellipsoidal blobs it cuts clusters wrongly, and the *lower*-inertia solution can be the worse one. Use **GMMs** for ellipsoids and **DBSCAN/HDBSCAN** for arbitrary shapes. **Always scale first.**

## 9.17 Clustering applications from the book 🟡

> [!info] 📖 Géron Ch. 8 · “Image Segmentation”, “Semi-Supervised Learning” · pp. 259–265

**1. Customer segmentation**, the one you'll discuss in a telecom interview. Cluster on behaviour (usage mix, recharge cadence, ARPU, tenure, channel use), then **profile each cluster** and give it a business name ("heavy-data youth pre-paid", "voice-only rural seniors", "multi-line SME"). The segments drive offers, pricing and recommendations.

**2. Data analysis:** cluster first, then analyse each cluster separately.

**3. Dimensionality reduction and feature engineering:** cluster affinities as features (Géron's housing `ClusterSimilarity`).

**4. Anomaly detection:** low affinity to every cluster, e.g. a user with an unusual number of requests per second.

**5. Image segmentation** (colour quantisation):

```python
X = image.reshape(-1, 3)                               # one row per pixel, RGB
kmeans = KMeans(n_clusters=8, random_state=42).fit(X)
segmented = kmeans.cluster_centers_[kmeans.labels_].reshape(image.shape)
```

With fewer than 8 clusters, the small red ladybug loses its own colour cluster. **K-means prefers clusters of similar sizes**, so small but distinct groups get absorbed. In business terms, a small high-value segment can disappear inside a big one.

**6. Semi-supervised learning** (label propagation). Géron's digits experiment is worth knowing by its numbers:

| Strategy (only 50 labels) | Test accuracy |
|---|---|
| Logistic regression on 50 **random** labelled images | 75.8% |
| Cluster into 50, label the **50 images closest to the centroids** | **83.4%** |
| **Propagate** each representative's label to its whole cluster | 87.2% |
| Propagate only to the **50% of points closest to each centroid** (drop outliers) | **88.4%** (propagated labels 98.9% correct) |
| Reference: all 1,400 true labels | 90.9% |

```python
k = 50
kmeans = KMeans(n_clusters=k, random_state=42)
X_digits_dist = kmeans.fit_transform(X_train)
representative_idx = X_digits_dist.argmin(axis=0)       # closest image to each centroid
X_representative = X_train[representative_idx]
# ... a human labels these 50 → y_representative
y_train_propagated = np.empty(len(X_train), dtype=np.int64)
for i in range(k):
    y_train_propagated[kmeans.labels_ == i] = y_representative[i]
```

**Lesson: labelling *representative* instances beats labelling random ones.** Built-in tools: `LabelSpreading`, `LabelPropagation` and `SelfTrainingClassifier` in `sklearn.semi_supervised`.

**Telecom application:** the fraud team has confirmed only 300 SIM-box cases. Cluster suspicious-traffic profiles, have analysts label cluster representatives, and propagate the labels. You get a far larger training set for a supervised detector at the same analyst cost.

**7. Active learning** (uncertainty sampling): train on the current labels, send the instances the model is **least sure** about to a human expert, repeat until the gain is no longer worth the labelling effort. Other strategies: the largest expected model change, or disagreement between different models. Useful whenever labels need experts: fraud analysts, network engineers, credit officers.

## 9.18 DBSCAN, HDBSCAN and the rest 🟡 ⭐

> [!info] 📖 Géron Ch. 8 · “DBSCAN”, “Other Clustering Algorithms” · pp. 265–269

![Match the algorithm to the cluster shape: density-based (DBSCAN) for odd shapes, GMM for stretched ellipses.](figures/fig09_clustering_compare.png)
*Match the algorithm to the cluster shape: density-based (DBSCAN) for odd shapes, GMM for stretched ellipses.*

> [!quote] 💬 Say it in the interview
> “DBSCAN groups dense regions and labels sparse points as noise, so it finds odd-shaped clusters without choosing k — but it struggles when densities vary. GMMs fit ellipses and give soft assignments.”

**DBSCAN** defines clusters as **continuous regions of high density**:
- For each point, count the neighbours within distance **ε** (`eps`).
- **≥ `min_samples`** neighbours (including itself) makes it a **core instance**.
- Every point in a core instance's neighbourhood joins its cluster. Chains of core instances form one cluster.
- Points that are neither core nor near a core are **anomalies** (label **−1**).

```python
from sklearn.cluster import DBSCAN
dbscan = DBSCAN(eps=0.2, min_samples=5).fit(X)   # eps=0.05 → 7 clusters + many anomalies
dbscan.labels_, dbscan.core_sample_indices_, dbscan.components_
```

- **Arbitrary shapes, any number of clusters, robust to outliers, only 2 hyperparameters.**
- `eps` matters a lot: 0.05 fragments the moons, 0.2 separates them perfectly. A k-distance plot (sorted distance to the k-th neighbour) helps you choose it.
- It struggles with **varying densities** and with clusters that have no low-density gap around them. Complexity is roughly **O(m²n)** in the worst case.
- **No `predict()`.** Train a classifier on the core samples instead, and use `kneighbors()` distances to mark far-away new points as anomalies:

```python
from sklearn.neighbors import KNeighborsClassifier
core = dbscan.core_sample_indices_
knn = KNeighborsClassifier(n_neighbors=50).fit(dbscan.components_, dbscan.labels_[core])
y_dist, y_idx = knn.kneighbors(X_new, n_neighbors=1)
y_pred = dbscan.labels_[core][y_idx]
y_pred[y_dist > 0.2] = -1                          # too far from any cluster → anomaly
```

**`sklearn.cluster.HDBSCAN`** (built into sklearn now) is often better for **varying densities**. It is what the capstone used.

Other algorithms to recognise by name:

| Algorithm | Key idea | Scales? |
|---|---|---|
| Agglomerative | Bottom-up merging into a tree; any distance | Only with a sparse **connectivity matrix** (`kneighbors_graph`) |
| **BIRCH** | A compact tree summary built in one pass | **Yes**, for very large data with fewer than ~20 features |
| Mean-shift | Shift circles toward local density maxima; one parameter (bandwidth) | No, O(m²n). Chops clusters with internal density variation |
| Affinity propagation | Points "vote" for exemplars; k is found automatically | No, O(m²) |
| Spectral clustering | Embed the similarity matrix, then k-means | No. Good for complex shapes and graph cuts (e.g. communities in call graphs) |

**Exercise answer:** which scale to large data? **K-Means / MiniBatchKMeans and BIRCH.** Which look for high-density regions? **DBSCAN, HDBSCAN and mean-shift.**

## 9.19 Gaussian Mixture Models (GMM) 🟡

> [!info] 📖 Géron Ch. 8 · “Gaussian Mixtures” → “Bayesian GMMs” · pp. 269–279

A **probabilistic, generative** model. Each instance is assumed to come from one of k Gaussian distributions, chosen with probability **φ⁽ʲ⁾** (the cluster weight). Given the cluster, x ~ 𝒩(**μ⁽ʲ⁾**, **Σ⁽ʲ⁾**). Each cluster is an **ellipsoid** with its own size, shape, density and orientation, which is exactly where k-means fails.

```python
from sklearn.mixture import GaussianMixture
gm = GaussianMixture(n_components=3, n_init=10, random_state=42).fit(X)
gm.weights_, gm.means_, gm.covariances_       # ≈ true 0.4 / 0.4 / 0.2 weights recovered
gm.converged_, gm.n_iter_
gm.predict(X)            # hard clustering
gm.predict_proba(X)      # soft clustering: "responsibilities"
gm.sample(6)             # generate new instances (it's generative)
gm.score_samples(X)      # log of the probability DENSITY at each point
```

**Expectation-Maximisation (EM)**, a generalisation of k-means:
- **E-step:** compute each cluster's **responsibility** for each instance (the probability that it generated the instance), given the current parameters.
- **M-step:** update each cluster's weight, mean and covariance using *all* instances, weighted by responsibility.
- Like k-means it can converge to a poor local optimum. **Set `n_init` > 1**, because the default is 1.

**Constraining the covariance** (fewer parameters, easier convergence in high dimensions or with few instances):

| `covariance_type` | Clusters can be | Complexity |
|---|---|---|
| `"full"` (default) | Any ellipsoid, each with its own shape and orientation | O(kmn² + kn³) |
| `"tied"` | All share the same ellipsoid | O(kmn² + kn³) |
| `"diag"` | Any size, but axes aligned with the features | O(kmn) |
| `"spherical"` | Round, different radii | O(kmn) |

**Anomaly detection with a GMM:** flag the lowest-density points. If about 2% of products are defective, set the threshold at the 2nd percentile of density:

```python
densities = gm.score_samples(X)
density_threshold = np.percentile(densities, 2)
anomalies = X[densities < density_threshold]
```

Too many false alarms → lower the threshold. Too many misses → raise it. This is the precision/recall trade-off again. Because the GMM fits the outliers too, it helps to fit, remove the most extreme points, and refit. Or use robust covariance (`EllipticEnvelope`).

**Choosing k for a GMM.** Inertia and silhouette are unreliable for non-spherical or unequal clusters. Use an **information criterion** and pick the minimum:

> **BIC = log(m)·p − 2 log(L̂)**   **AIC = 2p − 2 log(L̂)**

p = number of learned parameters, L̂ = maximised likelihood. Both reward fit and penalise complexity. **BIC penalises parameters more, so it picks simpler models**, especially on large datasets. `gm.bic(X)`, `gm.aic(X)`.

Or let the model decide: **`BayesianGaussianMixture(n_components=10)`** pushes the weights of unnecessary clusters to ≈ 0 (it found `[0.4, 0.21, 0.39, 0, 0, …]`).

⚠️ GMMs look for ellipsoids. On the two moons, a Bayesian GMM finds **eight** ellipsoids instead of two crescents. The density estimate is still usable for anomaly detection.

### Probability vs likelihood (a common interview question)

- **Probability:** how plausible an *outcome x* is, **given fixed parameters θ**. The PDF f(x; θ) is a function of x and integrates to 1 over x.
- **Likelihood:** how plausible *parameters θ* are, **given an observed x**. ℒ(θ | x) = f(x; θ) viewed as a function of θ. **It is not a probability distribution** and need not integrate to 1.
- **MLE:** choose the θ that maximises the likelihood, in practice the **log-likelihood**, because logs turn the product over independent samples into a sum.
- **MAP:** maximise ℒ(θ | x)·g(θ) with a prior g. It is **a regularised MLE**. Ridge is MAP with a Gaussian prior on the weights; Lasso is MAP with a Laplace prior.

## 9.20 Anomaly and novelty detection — the full toolbox 🟡 ⭐

> [!info] 📖 Géron Ch. 8 · “GMMs for Anomaly Detection”, “Other Algorithms for Anomaly and Novelty Detection” · pp. 274–280

> [!quote] 💬 Say it in the interview
> “For anomalies I start with robust statistics or Isolation Forest, try GMM density or autoencoders for complex patterns, and validate against labelled incidents with precision@k.”

| Algorithm | Idea | Best for |
|---|---|---|
| GMM density | Low density = anomaly | Ellipsoidal normal data |
| **Fast-MCD** (`EllipticEnvelope`) | Robustly fit one Gaussian, ignoring likely outliers | Cleaning a dataset; unimodal data |
| **Isolation Forest** | Random trees with random splits; **anomalies get isolated in fewer splits** (shorter average path) | **High-dimensional, large data. The go-to first choice** |
| **Local Outlier Factor (LOF)** | Compare a point's local density with its neighbours' | Anomalies in clusters of varying density |
| **One-class SVM** | Separate the data from the origin in kernel space, so a tight region encloses normal points | **Novelty** detection on a clean training set; high-D but not large-m |
| **PCA reconstruction error** | Anomalies reconstruct badly from the top PCs | Simple, fast baseline; also autoencoders |
| DBSCAN / HDBSCAN | Label −1 = noise | Spatial and behavioural data |

**Anomaly vs novelty detection:** anomaly (outlier) detection assumes the training data may be **contaminated** and is often used to clean it. Novelty detection assumes a **clean** training set and flags new points unlike anything seen.

```python
from sklearn.ensemble import IsolationForest
iso = IsolationForest(n_estimators=300, contamination=0.01, random_state=42)
iso.fit(X_train)                       # unsupervised: no y
scores = -iso.score_samples(X_new)     # higher = more anomalous
flags = iso.predict(X_new)             # -1 anomaly, 1 normal
```

**Telecom anomaly use cases to mention:**
- **SIM-box / interconnect bypass fraud:** SIMs with many outgoing international-looking calls, almost no incoming calls or SMS, no data use, fixed location, and high IMEI switching.
- **Wangiri (one-ring) fraud** and **IRSF** (International Revenue Share Fraud): bursts of calls to premium international ranges.
- **Subscription fraud:** new accounts with synthetic identities and immediate high usage.
- **Network KPI anomalies:** a cell's drop-call rate or throughput deviating from its own seasonal baseline. Model it per cell and per hour-of-week; do not use one global threshold.
- **Revenue assurance:** usage records (CDRs) that don't match billed amounts.

In practice: start with rules and Isolation Forest, have analysts review the top-scored cases, collect those labels, and graduate to a supervised model. That is semi-supervised and active learning (§9.17) in a production loop.

---

> [!check] ✅ Key takeaways
> - PCA projects onto directions of maximum variance; scale first and keep ~95% explained variance.
> - K-Means needs scaled features and a chosen k (silhouette > elbow); it assumes round, similar-sized clusters.
> - DBSCAN finds arbitrary shapes and noise without k; GMMs fit ellipses and give soft assignments and densities.
> - t-SNE/UMAP are for visualisation, not features for a model.
> - Anomaly detection: Isolation Forest, GMM density, robust statistics — validate against known incidents.
> - Clustering can create labels cheaply (label representatives, then propagate).

## 9.21 Interview drill — unsupervised learning (Géron Ch. 7–8 exercises, answered) 🟢 ⭐

> [!info] 📖 Géron Ch. 7 · Exercises p. 242; Ch. 8 · Exercises p. 280

**1. Motivations for reducing dimensionality, and drawbacks?** Faster training, less memory, sometimes better performance (noise and redundancy removed), visualisation, and defence against the curse of dimensionality. Drawbacks: information loss, extra pipeline complexity, and harder interpretation (PCs mix features).

**2. What is the curse of dimensionality?** Many problems that don't exist in low dimensions: sparse data, distances becoming uninformative, a much higher risk of overfitting, and exponentially more data needed.

**3. Can the reduction be reversed?** Approximately, for methods with an inverse (PCA's `inverse_transform`; random projection via the pseudo-inverse). Some information is permanently lost. t-SNE and LLE have no inverse.

**4. Can PCA reduce a highly non-linear dataset?** It can remove useless dimensions, but on a twisted manifold (the Swiss roll) projection squashes the structure. Use manifold learning, kernel PCA or autoencoders.

**5. PCA with 95% variance on 1,000-D data: how many dimensions remain?** It depends on the data. From 1 (points almost on a line) to about 950 (nearly random data with no redundancy). Plot the cumulative variance.

**6. When to use regular, incremental, randomized PCA or random projection?** Regular: data fits in memory. Incremental: it doesn't, or data streams in. Randomized: you want d ≪ n quickly. Random projection: very high n (tens of thousands of features or more) or sparse data.

**7. How do you evaluate a dimensionality-reduction algorithm?** By reconstruction error (if it has an inverse), or by the downstream model's performance with vs without it.

**8. Does chaining two reduction algorithms make sense?** Yes. A common pattern is PCA or random projection to remove useless dimensions quickly, then a slower manifold method (LLE, t-SNE) on the reduced data.

**9. Define clustering and name a few algorithms.** Grouping similar instances without labels: K-Means, DBSCAN/HDBSCAN, agglomerative, BIRCH, mean-shift, affinity propagation, spectral, GMM.

**10. Main applications of clustering?** Segmentation, data analysis, dimensionality reduction and feature engineering, anomaly detection, semi-supervised learning, search engines, image segmentation.

**11. Two ways to choose k in k-means?** The elbow of inertia versus k, and the silhouette score or silhouette diagram. (Business constraints too: marketing can run five campaigns, not 23.)

**12. What is label propagation, and why?** Copy the few known labels to similar unlabelled instances (e.g. within the same cluster) to enlarge the training set cheaply.

**13. Two scalable clustering algorithms, and two density-based ones?** Scalable: k-means/MiniBatchKMeans, BIRCH. Density-based: DBSCAN, mean-shift (and HDBSCAN).

**14. A use case for active learning, and how to do it?** Whenever labels are expensive (fraud review, defect inspection, complaint categorisation). Train, send the most uncertain cases to experts, add their labels, retrain.

**15. Anomaly vs novelty detection?** See §9.20: a contaminated training set versus a clean one.

**16. What is a Gaussian mixture and what is it for?** A probabilistic model assuming the data comes from k Gaussians with unknown parameters. Uses: density estimation, soft clustering of ellipsoidal clusters, anomaly detection, and generating samples.

**17. Two ways to choose the number of GMM components?** Minimise BIC or AIC, or use a `BayesianGaussianMixture` that zeroes out unnecessary components.

**More that often come up:**

- **"K-Means vs GMM?"** K-Means gives hard assignments and assumes spherical, equal-variance clusters. It is a limiting case of a GMM with tied spherical covariances and hard assignments. A GMM gives soft probabilities and ellipsoids, and is generative.
- **"How do you validate a customer segmentation with no labels?"** Internal metrics (silhouette, Davies-Bouldin), **stability** (re-run on bootstrap samples and check segment membership with the adjusted Rand index), **business separability** (do segments differ meaningfully on KPIs not used for clustering, such as churn rate and campaign response?), and **actionability** (can marketing act on each one?).
- **"Why scale before k-means or PCA?"** Both depend on distances or variances, so an unscaled large-unit feature dominates.
- **"How many principal components to keep?"** Enough for ~90–99% of the variance, the elbow, or whatever maximises downstream CV performance.

---

## 9.22 Real-world examples — unsupervised learning at work 🟡

- **Customer segmentation at telcos:** K-Means/GMM on scaled usage (voice, data, social-app share, roaming, recharge frequency) → named personas like "data-hungry youth", "voice-only seniors", "roaming business travellers" that drive bundle design. The success test is **business actionability**, not only the silhouette score.
- **Network KPI anomaly detection:** Isolation Forest / robust PCA reconstruction error on cell KPIs (drop rate, PRB utilisation, throughput) flags degraded cells before customer complaints spike (Part 16 §16.3 #7, Part 23 for autoencoders).
- **Fraud rings:** DBSCAN on device/SIM/IMEI features and graph clustering find groups of accounts behaving alike (SIM-box farms).
- **Geo-clustering for site planning:** DBSCAN/HDBSCAN on customer locations and dropped-call hotspots suggests where new sites or small cells help most.
- **Embeddings + clustering (modern):** customer-care messages are embedded with a multilingual/Arabic sentence encoder, reduced with UMAP and clustered with HDBSCAN (the **BERTopic** recipe) to discover new complaint topics automatically (Parts 10, 21).
- **Semi-supervised labelling:** cluster, label the few representative examples near each centroid, propagate labels (§9.17, Géron's digits experiment) — how teams bootstrap classifiers cheaply.

---

## Further reading

- **StatQuest: PCA, step-by-step** — the standard recommendation; it builds the eigendecomposition intuition without the algebra.
- **3Blue1Brown, *Essence of Linear Algebra*** — episodes on eigenvectors and change of basis. PCA is *only* a change of basis, and this makes that click.
- **setosa.io/ev** — an interactive PCA visualisation; drag the data and watch the components move.
- **scikit-learn: Clustering §2.3** — https://scikit-learn.org/stable/modules/clustering.html. The comparison figure at the top of that page, showing how each algorithm handles moons, circles and blobs, is the single most useful image in the docs.
- **scikit-learn: Decomposition §2.5** — https://scikit-learn.org/stable/modules/decomposition.html
- **ISLR Chapter 12** — unsupervised learning, PCA and clustering.
- **"How to Use t-SNE Effectively"**, Wattenberg et al., *Distill* — https://distill.pub/2016/misread-tsne/ — essential before you trust any t-SNE plot.
- **HDBSCAN docs** — https://hdbscan.readthedocs.io/ — the "How HDBSCAN Works" page is excellent.

---

<!-- nav -->
> [!example] 🧭 Step 12 of 26 · Stage 3 of 7: Classical ML
> ← [Part 08B · Trees & ensembles](08B_Trees_and_Ensembles.md) · [Part 10 · NLP & Arabic](10_NLP.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
