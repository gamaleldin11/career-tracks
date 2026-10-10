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

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Scree and cumulative explained variance for PCA on the scaled digits data: the first components carry the most variance, and the cumulative curve reaches 80 percent at 21 components, 95 percent at 40 and 99 percent at about 54">
<rect class="sB" x="56.5" y="97.7117" width="7" height="102.288" rx="1"/>
<rect class="sB" x="65.3889" y="118.731" width="7" height="81.269" rx="1"/>
<rect class="sB" x="74.2778" y="128.222" width="7" height="71.7775" rx="1"/>
<rect class="sB" x="83.1667" y="144.764" width="7" height="55.2365" rx="1"/>
<rect class="sB" x="92.0556" y="158.689" width="7" height="41.3113" rx="1"/>
<rect class="sB" x="100.944" y="164.18" width="7" height="35.82" rx="1"/>
<rect class="sB" x="109.833" y="166.492" width="7" height="33.5077" rx="1"/>
<rect class="sB" x="118.722" y="171.19" width="7" height="28.8097" rx="1"/>
<rect class="sB" x="127.611" y="174.515" width="7" height="25.4849" rx="1"/>
<rect class="sB" x="136.5" y="175.078" width="7" height="24.922" rx="1"/>
<rect class="sB" x="145.389" y="176.355" width="7" height="23.6453" rx="1"/>
<rect class="sB" x="154.278" y="178.095" width="7" height="21.905" rx="1"/>
<rect class="sB" x="163.167" y="180.66" width="7" height="19.3401" rx="1"/>
<rect class="sB" x="172.056" y="181.069" width="7" height="18.931" rx="1"/>
<rect class="sB" x="180.944" y="181.596" width="7" height="18.4045" rx="1"/>
<rect class="sB" x="189.833" y="183.73" width="7" height="16.2704" rx="1"/>
<rect class="sB" x="198.722" y="184.908" width="7" height="15.0922" rx="1"/>
<rect class="sB" x="207.611" y="186.076" width="7" height="13.9236" rx="1"/>
<rect class="sB" x="216.5" y="186.43" width="7" height="13.5699" rx="1"/>
<rect class="sB" x="225.389" y="187.342" width="7" height="12.6581" rx="1"/>
<rect class="sB" x="234.278" y="188.542" width="7" height="11.4577" rx="1"/>
<rect class="sB" x="243.167" y="189.189" width="7" height="10.8114" rx="1"/>
<rect class="sB" x="252.056" y="190.09" width="7" height="9.90962" rx="1"/>
<rect class="sB" x="260.944" y="191.01" width="7" height="8.99" rx="1"/>
<rect class="sB" x="269.833" y="191.71" width="7" height="8.29019" rx="1"/>
<rect class="sB" x="278.722" y="191.971" width="7" height="8.02875" rx="1"/>
<rect class="sB" x="287.611" y="192.664" width="7" height="7.33562" rx="1"/>
<rect class="sB" x="296.5" y="192.889" width="7" height="7.11146" rx="1"/>
<rect class="sB" x="305.389" y="193.22" width="7" height="6.78039" rx="1"/>
<rect class="sB" x="314.278" y="193.655" width="7" height="6.34501" rx="1"/>
<rect class="sB" x="323.167" y="193.833" width="7" height="6.16745" rx="1"/>
<rect class="sB" x="332.056" y="194.119" width="7" height="5.88125" rx="1"/>
<rect class="sB" x="340.944" y="194.442" width="7" height="5.55822" rx="1"/>
<rect class="sB" x="349.833" y="194.553" width="7" height="5.44674" rx="1"/>
<rect class="sB" x="358.722" y="194.973" width="7" height="5.02676" rx="1"/>
<rect class="sB" x="367.611" y="195.145" width="7" height="4.85488" rx="1"/>
<rect class="sB" x="376.5" y="195.549" width="7" height="4.45091" rx="1"/>
<rect class="sB" x="385.389" y="195.905" width="7" height="4.09536" rx="1"/>
<rect class="sB" x="394.278" y="196.143" width="7" height="3.85661" rx="1"/>
<rect class="sB" x="403.167" y="196.403" width="7" height="3.59688" rx="1"/>
<rect class="sB" x="412.056" y="196.549" width="7" height="3.45145" rx="1"/>
<rect class="sB" x="420.944" y="196.625" width="7" height="3.37522" rx="1"/>
<rect class="sB" x="429.833" y="196.97" width="7" height="3.03019" rx="1"/>
<rect class="sB" x="438.722" y="197.103" width="7" height="2.89669" rx="1"/>
<rect class="sB" x="447.611" y="197.213" width="7" height="2.7866" rx="1"/>
<rect class="sB" x="456.5" y="197.356" width="7" height="2.64377" rx="1"/>
<rect class="sB" x="465.389" y="197.547" width="7" height="2.45289" rx="1"/>
<rect class="sB" x="474.278" y="197.65" width="7" height="2.35016" rx="1"/>
<rect class="sB" x="483.167" y="197.797" width="7" height="2.20299" rx="1"/>
<rect class="sB" x="492.056" y="198.007" width="7" height="1.99311" rx="1"/>
<rect class="sB" x="500.944" y="198.145" width="7" height="1.85518" rx="1"/>
<rect class="sB" x="509.833" y="198.269" width="7" height="1.73058" rx="1"/>
<rect class="sB" x="518.722" y="198.338" width="7" height="1.66186" rx="1"/>
<rect class="sB" x="527.611" y="198.442" width="7" height="1.55821" rx="1"/>
<rect class="sB" x="536.5" y="198.572" width="7" height="1.42754" rx="1"/>
<rect class="sB" x="545.389" y="198.629" width="7" height="1.37051" rx="1"/>
<rect class="sB" x="554.278" y="198.744" width="7" height="1.25598" rx="1"/>
<rect class="sB" x="563.167" y="198.851" width="7" height="1.14851" rx="1"/>
<rect class="sB" x="572.056" y="198.937" width="7" height="1.06336" rx="1"/>
<rect class="sB" x="580.944" y="199.119" width="7" height="0.881414" rx="1"/>
<rect class="sB" x="589.833" y="199.298" width="7" height="0.701548" rx="1"/>
<rect class="sB" x="598.722" y="200" width="7" height="0" rx="1"/>
<rect class="sB" x="607.611" y="200" width="7" height="0" rx="1"/>
<rect class="sB" x="616.5" y="200" width="7" height="0" rx="1"/>
<polyline class="sLg" points="60.0,179.5 68.9,163.3 77.8,148.9 86.7,137.9 95.6,129.6 104.4,122.5 113.3,115.8 122.2,110.0 131.1,104.9 140.0,99.9 148.9,95.2 157.8,90.8 166.7,86.9 175.6,83.2 184.4,79.5 193.3,76.2 202.2,73.2 211.1,70.4 220.0,67.7 228.9,65.2 237.8,62.9 246.7,60.7 255.6,58.7 264.4,56.9 273.3,55.3 282.2,53.7 291.1,52.2 300.0,50.8 308.9,49.4 317.8,48.2 326.7,46.9 335.6,45.7 344.4,44.6 353.3,43.5 362.2,42.5 371.1,41.6 380.0,40.7 388.9,39.9 397.8,39.1 406.7,38.4 415.6,37.7 424.4,37.0 433.3,36.4 442.2,35.8 451.1,35.3 460.0,34.7 468.9,34.2 477.8,33.8 486.7,33.3 495.6,32.9 504.4,32.6 513.3,32.2 522.2,31.9 531.1,31.6 540.0,31.3 548.9,31.0 557.8,30.8 566.7,30.5 575.6,30.3 584.4,30.1 593.3,30.0 602.2,30.0 611.1,30.0 620.0,30.0" style="stroke-width:2.4"/>
<line class="sLm" x1="60" y1="200" x2="624" y2="200"/><line class="sLm" x1="60" y1="200" x2="60" y2="26"/>
<text class="sS" x="54" y="204" text-anchor="end">0%</text>
<text class="sS" x="54" y="119" text-anchor="end">50%</text>
<text class="sS" x="54" y="34" text-anchor="end">100%</text>
<text class="sS" x="60" y="216" text-anchor="middle">1</text>
<text class="sS" x="140" y="216" text-anchor="middle">10</text>
<text class="sS" x="228.889" y="216" text-anchor="middle">20</text>
<text class="sS" x="317.778" y="216" text-anchor="middle">30</text>
<text class="sS" x="406.667" y="216" text-anchor="middle">40</text>
<text class="sS" x="495.556" y="216" text-anchor="middle">50</text>
<text class="sS" x="620" y="216" text-anchor="middle">64</text>
<text class="sC" x="340" y="234" text-anchor="middle">number of components k (of 64)</text>
<circle class="sPg" cx="237.8" cy="62.9" r="4"/><text class="sC" x="237.778" y="53.8751" text-anchor="middle">80% → k=21</text>
<circle class="sPg" cx="326.7" cy="46.9" r="4"/><text class="sC" x="326.667" y="37.9211" text-anchor="middle">90% → k=31</text>
<circle class="sPg" cx="406.7" cy="38.4" r="4"/><text class="sGt" x="406.667" y="29.3676" text-anchor="middle">95% → k=40</text>
<circle class="sPg" cx="531.1" cy="31.6" r="4"/><text class="sC" x="531.111" y="22.5698" text-anchor="middle">99% → k=54</text>
<text class="sGt" x="636" y="60">cumulative</text><text class="sS" x="636" y="76">(green line)</text><text class="sS" x="636" y="160">bars: each PC</text><text class="sS" x="636" y="176">share × 5</text>
</svg><figcaption>The digits data, computed with scikit-learn: no clear elbow, so a variance threshold is the practical choice.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 236" role="img" aria-label="The digits data projected onto its first two principal components, with each digit's average position labelled: some digits form separate regions while others overlap heavily, with only about 22 percent of the variance kept">
<circle class="sPw" cx="359.6" cy="118.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="188.2" cy="146.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="304.7" cy="154.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="353.3" cy="108.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="291.4" cy="137.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="307.9" cy="145.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="384.6" cy="123.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="392.1" cy="120.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="302.8" cy="127.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="274.5" cy="192.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="322.7" cy="114.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="290.9" cy="138.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="272.5" cy="180.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="326.6" cy="128.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="372.8" cy="159.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="258.0" cy="146.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="325.3" cy="152.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="266.1" cy="169.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="316.4" cy="123.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="166.3" cy="144.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="224.0" cy="116.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="368.9" cy="148.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="272.9" cy="114.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="297.9" cy="113.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="336.7" cy="138.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="166.4" cy="145.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="302.3" cy="150.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="316.4" cy="152.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="389.0" cy="114.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="349.6" cy="132.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="263.6" cy="126.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="180.9" cy="144.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="318.2" cy="139.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="376.7" cy="151.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="350.5" cy="165.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="246.2" cy="181.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="368.7" cy="152.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="177.3" cy="159.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="260.2" cy="103.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="261.5" cy="104.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="438.5" cy="143.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="271.4" cy="128.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="248.6" cy="86.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="331.3" cy="183.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="299.5" cy="107.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="259.5" cy="152.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="210.5" cy="146.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="341.8" cy="163.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="251.8" cy="169.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="269.5" cy="136.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="370.2" cy="175.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="273.1" cy="190.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="158.5" cy="82.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="339.6" cy="154.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="314.1" cy="133.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="196.9" cy="135.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="421.3" cy="119.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="257.3" cy="187.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="408.1" cy="155.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="263.1" cy="180.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="309.9" cy="95.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="298.2" cy="117.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="340.8" cy="124.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="360.7" cy="110.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="405.1" cy="178.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="371.6" cy="123.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="211.6" cy="159.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="317.9" cy="129.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="143.6" cy="153.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="139.4" cy="159.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="407.2" cy="148.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="262.8" cy="145.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="299.5" cy="132.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="291.1" cy="137.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="358.7" cy="116.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="327.2" cy="114.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="273.0" cy="129.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="231.6" cy="175.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="208.5" cy="105.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="249.4" cy="178.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="281.9" cy="131.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="234.8" cy="81.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="266.1" cy="135.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="419.3" cy="146.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="367.9" cy="154.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="402.5" cy="131.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="263.1" cy="171.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="173.1" cy="121.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="253.8" cy="174.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="268.9" cy="98.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="301.5" cy="129.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="329.7" cy="137.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="319.0" cy="154.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="291.5" cy="135.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="231.7" cy="79.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="326.6" cy="121.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="239.9" cy="129.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="205.1" cy="107.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="170.2" cy="154.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="144.6" cy="157.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="257.4" cy="162.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="356.2" cy="115.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="333.4" cy="150.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="478.7" cy="149.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="305.2" cy="115.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="345.7" cy="111.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="259.6" cy="116.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="323.4" cy="163.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="307.1" cy="158.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="249.0" cy="206.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="296.4" cy="123.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="226.6" cy="144.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="245.2" cy="117.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="379.1" cy="124.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="192.3" cy="66.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="298.6" cy="137.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="265.9" cy="190.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="330.5" cy="152.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="116.4" cy="24.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="329.7" cy="146.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="340.9" cy="152.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="351.0" cy="143.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="380.9" cy="174.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="309.6" cy="159.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="248.6" cy="129.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="330.2" cy="136.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="194.7" cy="108.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="235.2" cy="151.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="250.3" cy="189.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="340.1" cy="155.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="178.5" cy="147.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="327.1" cy="148.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="406.3" cy="164.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="346.5" cy="130.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="172.3" cy="153.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="314.6" cy="137.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="384.8" cy="153.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="388.1" cy="110.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="338.5" cy="166.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="365.0" cy="108.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="283.7" cy="212.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="328.1" cy="107.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="323.2" cy="137.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="354.0" cy="148.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="394.4" cy="150.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="406.2" cy="141.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="155.8" cy="37.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="233.8" cy="116.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="342.5" cy="120.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="269.0" cy="185.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="268.2" cy="193.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="366.9" cy="117.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="376.6" cy="134.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="200.6" cy="143.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="289.0" cy="123.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="261.2" cy="98.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="287.7" cy="139.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="222.7" cy="161.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="323.1" cy="157.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="262.1" cy="161.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="338.7" cy="113.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="158.1" cy="174.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="247.7" cy="167.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="265.3" cy="145.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="255.4" cy="152.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="196.1" cy="137.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="263.8" cy="159.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="200.2" cy="141.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="262.6" cy="177.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="287.6" cy="100.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="305.6" cy="128.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="214.5" cy="88.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="195.7" cy="174.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="170.3" cy="87.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="307.1" cy="152.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="249.9" cy="72.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="225.7" cy="130.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="280.0" cy="170.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="308.6" cy="150.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="159.4" cy="140.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="271.5" cy="193.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="339.3" cy="136.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="187.8" cy="146.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="324.1" cy="108.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="278.4" cy="189.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="397.3" cy="141.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="249.5" cy="100.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="402.6" cy="155.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="397.7" cy="103.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="367.8" cy="136.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="255.6" cy="197.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="184.1" cy="147.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="259.7" cy="127.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="342.7" cy="140.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="216.0" cy="144.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="218.0" cy="143.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="225.0" cy="76.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="368.3" cy="126.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="286.6" cy="107.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="362.7" cy="136.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="283.9" cy="126.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="309.5" cy="127.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="407.2" cy="95.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="265.5" cy="144.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="414.0" cy="134.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="247.8" cy="152.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="357.8" cy="138.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="197.1" cy="126.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="289.0" cy="136.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="308.8" cy="127.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="339.1" cy="155.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="306.9" cy="127.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="258.7" cy="188.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="347.7" cy="137.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="266.1" cy="190.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="386.0" cy="150.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="122.9" cy="156.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="182.1" cy="125.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="145.8" cy="161.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="259.9" cy="176.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="294.1" cy="197.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="251.4" cy="192.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="301.9" cy="97.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="314.7" cy="116.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="339.8" cy="100.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="360.8" cy="138.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="316.9" cy="102.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="265.1" cy="121.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="380.0" cy="157.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="238.7" cy="128.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="335.3" cy="128.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="240.3" cy="152.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="170.6" cy="143.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="260.6" cy="137.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="337.4" cy="104.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="278.6" cy="168.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="300.2" cy="159.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="398.8" cy="139.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="283.3" cy="94.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="388.6" cy="146.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="348.7" cy="142.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="390.8" cy="125.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="181.2" cy="144.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="349.8" cy="123.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="222.8" cy="162.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="243.8" cy="156.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="383.7" cy="160.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="296.0" cy="109.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="272.6" cy="153.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="278.9" cy="133.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="356.5" cy="156.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="227.5" cy="163.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="383.1" cy="115.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="307.1" cy="102.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="423.9" cy="132.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="213.2" cy="145.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="265.1" cy="151.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="341.5" cy="151.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="346.6" cy="110.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="370.8" cy="154.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="328.0" cy="111.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="252.0" cy="193.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="247.3" cy="157.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="312.7" cy="164.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="214.1" cy="105.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="197.5" cy="147.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="242.7" cy="183.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="343.0" cy="132.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="406.4" cy="145.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="360.4" cy="95.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="350.4" cy="154.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="174.0" cy="152.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="249.0" cy="149.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="362.0" cy="134.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="345.2" cy="181.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="365.7" cy="116.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="347.3" cy="153.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="404.8" cy="150.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="270.1" cy="180.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="125.0" cy="160.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="302.1" cy="116.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="404.4" cy="146.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="321.9" cy="123.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="251.5" cy="170.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="307.3" cy="128.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="335.2" cy="135.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="217.6" cy="154.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="212.2" cy="148.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="379.0" cy="131.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="362.2" cy="112.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="356.8" cy="125.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="261.5" cy="175.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="252.8" cy="112.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="342.5" cy="120.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="240.3" cy="180.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="480.0" cy="132.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="222.9" cy="170.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="311.2" cy="134.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="249.5" cy="139.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="411.6" cy="108.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="371.6" cy="160.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="455.7" cy="156.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="457.5" cy="159.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="408.0" cy="172.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="257.8" cy="192.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="324.6" cy="151.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="275.1" cy="87.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="451.2" cy="149.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="367.6" cy="134.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="387.5" cy="111.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="325.5" cy="150.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="247.1" cy="124.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="317.3" cy="104.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="389.5" cy="149.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="307.3" cy="132.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="369.7" cy="148.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="349.0" cy="147.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="153.9" cy="153.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="273.2" cy="178.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="322.3" cy="130.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="334.2" cy="124.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="303.0" cy="148.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="140.2" cy="177.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="334.7" cy="124.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="346.8" cy="167.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="301.8" cy="118.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="352.9" cy="146.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="154.7" cy="173.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="283.4" cy="123.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="261.7" cy="130.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="266.4" cy="172.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="358.2" cy="163.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="246.3" cy="85.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="339.9" cy="98.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="190.1" cy="166.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="318.4" cy="136.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="241.3" cy="149.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="388.0" cy="172.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="388.9" cy="145.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="298.7" cy="151.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="395.3" cy="146.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="393.0" cy="114.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="231.5" cy="122.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="315.6" cy="149.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="397.0" cy="143.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="332.1" cy="129.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="179.5" cy="145.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="354.3" cy="156.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="313.9" cy="145.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="169.0" cy="143.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="349.3" cy="106.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="341.9" cy="113.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="270.4" cy="169.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="389.8" cy="106.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="270.6" cy="159.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="315.0" cy="158.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="364.7" cy="181.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="187.3" cy="143.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="265.8" cy="158.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="360.1" cy="173.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="305.6" cy="187.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="157.8" cy="146.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="449.6" cy="143.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="411.2" cy="140.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="232.7" cy="86.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="242.1" cy="153.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="463.5" cy="147.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="251.4" cy="171.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="379.4" cy="153.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="361.0" cy="153.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="429.8" cy="156.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="349.5" cy="159.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="303.5" cy="76.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="330.3" cy="125.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="216.6" cy="95.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="307.0" cy="125.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="431.8" cy="143.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="302.0" cy="140.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="222.2" cy="132.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="283.3" cy="194.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="276.6" cy="127.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="344.6" cy="143.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="310.6" cy="130.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="250.4" cy="159.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="296.3" cy="115.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="203.7" cy="143.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="227.5" cy="76.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="296.7" cy="188.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="268.6" cy="204.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="436.3" cy="125.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="377.0" cy="138.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="241.3" cy="181.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="274.9" cy="175.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="417.0" cy="96.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="219.2" cy="144.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="303.3" cy="146.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="230.4" cy="169.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="306.5" cy="101.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="183.3" cy="150.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="274.2" cy="193.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="277.0" cy="192.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="407.3" cy="110.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="320.4" cy="122.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="181.9" cy="44.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="261.2" cy="99.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="383.7" cy="137.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="306.8" cy="129.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="285.7" cy="112.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="134.7" cy="64.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="243.6" cy="182.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="297.3" cy="136.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="326.6" cy="146.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="317.4" cy="146.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="315.9" cy="115.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="189.6" cy="142.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="247.9" cy="185.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="293.0" cy="117.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="229.0" cy="126.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="360.3" cy="181.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="411.6" cy="145.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="250.6" cy="158.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="326.1" cy="148.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="287.4" cy="193.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="262.9" cy="110.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="270.8" cy="186.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="294.5" cy="110.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="307.7" cy="141.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="263.6" cy="169.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="323.0" cy="188.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="351.0" cy="177.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="346.0" cy="138.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="275.7" cy="156.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="292.5" cy="135.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="362.8" cy="143.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="272.8" cy="193.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="159.1" cy="148.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="273.7" cy="195.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="365.3" cy="154.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="246.8" cy="156.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="309.9" cy="102.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="270.0" cy="201.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="88.1" cy="89.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="302.4" cy="137.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="182.8" cy="125.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="254.0" cy="186.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="358.9" cy="128.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="256.9" cy="158.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="272.9" cy="195.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="323.6" cy="141.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="296.9" cy="177.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="291.4" cy="106.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="277.7" cy="87.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="345.7" cy="126.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="343.2" cy="166.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="176.5" cy="147.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="310.2" cy="126.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="308.4" cy="134.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="237.4" cy="141.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="240.0" cy="183.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="279.3" cy="173.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="339.8" cy="126.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="286.4" cy="160.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="193.0" cy="122.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="297.4" cy="147.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="456.9" cy="149.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="356.5" cy="95.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="325.5" cy="137.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="354.4" cy="132.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="353.5" cy="116.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="377.6" cy="105.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="283.9" cy="127.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="296.4" cy="132.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="277.7" cy="134.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="248.2" cy="162.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="292.6" cy="128.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="232.9" cy="177.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="377.0" cy="151.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="252.4" cy="156.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="291.4" cy="191.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="244.6" cy="99.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="359.1" cy="137.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="385.5" cy="149.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="260.4" cy="172.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="372.0" cy="158.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="313.7" cy="128.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="312.0" cy="148.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="314.8" cy="122.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="229.8" cy="148.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="361.6" cy="138.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="266.3" cy="188.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="443.1" cy="107.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="271.4" cy="163.5" r="2.2" opacity=".55"/>
<circle class="sPv" cx="148.8" cy="164.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="365.6" cy="116.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="223.9" cy="78.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="249.1" cy="152.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="307.7" cy="132.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="409.4" cy="157.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="417.5" cy="152.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="248.7" cy="148.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="350.3" cy="130.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="386.9" cy="113.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="165.9" cy="174.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="256.3" cy="168.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="276.5" cy="183.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="287.3" cy="123.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="396.4" cy="122.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="274.3" cy="191.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="191.8" cy="60.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="312.6" cy="150.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="266.5" cy="181.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="290.1" cy="95.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="250.6" cy="166.2" r="2.2" opacity=".55"/>
<circle class="sPr" cx="310.8" cy="96.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="304.9" cy="148.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="346.5" cy="135.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="369.1" cy="148.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="348.4" cy="123.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="381.9" cy="137.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="327.1" cy="160.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="387.3" cy="148.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="203.6" cy="84.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="335.0" cy="150.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="306.3" cy="130.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="365.9" cy="130.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="294.8" cy="151.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="268.2" cy="179.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="351.1" cy="137.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="310.7" cy="130.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="231.3" cy="129.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="380.8" cy="143.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="367.8" cy="112.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="322.7" cy="103.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="291.7" cy="140.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="229.6" cy="129.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="236.4" cy="130.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="255.1" cy="96.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="331.1" cy="160.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="310.2" cy="147.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="218.2" cy="107.7" r="2.2" opacity=".55"/>
<circle class="sPr" cx="304.4" cy="109.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="320.6" cy="150.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="270.5" cy="191.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="204.0" cy="102.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="283.0" cy="113.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="109.6" cy="148.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="298.4" cy="178.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="368.9" cy="95.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="273.8" cy="176.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="327.7" cy="140.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="284.2" cy="159.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="400.8" cy="113.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="270.0" cy="144.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="405.8" cy="175.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="251.6" cy="166.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="359.7" cy="117.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="396.8" cy="139.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="253.4" cy="175.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="348.2" cy="133.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="287.6" cy="146.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="359.3" cy="157.6" r="2.2" opacity=".55"/>
<circle class="sP" cx="308.5" cy="117.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="320.7" cy="126.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="383.7" cy="103.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="238.5" cy="176.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="235.7" cy="188.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="154.8" cy="165.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="373.9" cy="98.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="167.8" cy="158.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="342.8" cy="132.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="372.2" cy="132.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="381.6" cy="147.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="264.1" cy="189.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="303.7" cy="131.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="359.1" cy="118.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="240.8" cy="154.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="266.7" cy="193.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="279.9" cy="187.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="332.4" cy="154.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="373.8" cy="150.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="107.7" cy="103.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="354.5" cy="131.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="325.8" cy="114.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="305.2" cy="64.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="153.9" cy="148.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="301.1" cy="130.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="272.2" cy="193.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="387.5" cy="147.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="343.3" cy="139.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="337.1" cy="99.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="270.8" cy="145.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="267.3" cy="193.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="335.8" cy="133.4" r="2.2" opacity=".55"/>
<circle class="sPr" cx="311.5" cy="98.8" r="2.2" opacity=".55"/>
<circle class="sPr" cx="390.5" cy="147.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="194.9" cy="144.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="298.8" cy="145.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="406.1" cy="121.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="234.4" cy="125.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="297.8" cy="125.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="258.9" cy="182.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="421.0" cy="150.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="341.8" cy="161.0" r="2.2" opacity=".55"/>
<circle class="sPv" cx="346.7" cy="125.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="243.7" cy="138.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="262.2" cy="190.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="272.2" cy="162.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="338.9" cy="123.7" r="2.2" opacity=".55"/>
<circle class="sPv" cx="327.8" cy="159.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="298.3" cy="134.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="339.3" cy="167.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="322.8" cy="117.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="291.3" cy="137.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="284.8" cy="141.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="245.6" cy="111.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="415.3" cy="151.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="273.5" cy="135.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="356.5" cy="141.7" r="2.2" opacity=".55"/>
<circle class="sP" cx="213.4" cy="169.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="309.9" cy="126.8" r="2.2" opacity=".55"/>
<circle class="sPv" cx="141.3" cy="104.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="365.1" cy="119.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="234.8" cy="159.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="358.2" cy="143.2" r="2.2" opacity=".55"/>
<circle class="sPg" cx="272.4" cy="209.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="336.0" cy="170.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="260.2" cy="160.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="184.2" cy="169.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="331.2" cy="122.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="364.0" cy="142.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="187.5" cy="102.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="272.3" cy="185.2" r="2.2" opacity=".55"/>
<circle class="sPw" cx="304.2" cy="125.5" r="2.2" opacity=".55"/>
<circle class="sPr" cx="330.4" cy="134.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="267.0" cy="167.6" r="2.2" opacity=".55"/>
<circle class="sPr" cx="251.5" cy="68.0" r="2.2" opacity=".55"/>
<circle class="sPw" cx="294.6" cy="132.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="278.4" cy="149.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="359.9" cy="148.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="267.5" cy="129.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="287.2" cy="110.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="325.1" cy="138.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="404.3" cy="162.0" r="2.2" opacity=".55"/>
<circle class="sP" cx="338.0" cy="127.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="254.8" cy="116.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="245.3" cy="183.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="255.8" cy="144.5" r="2.2" opacity=".55"/>
<circle class="sPw" cx="362.1" cy="161.4" r="2.2" opacity=".55"/>
<circle class="sP" cx="328.9" cy="122.1" r="2.2" opacity=".55"/>
<circle class="sPg" cx="249.3" cy="116.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="263.7" cy="159.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="313.9" cy="149.4" r="2.2" opacity=".55"/>
<circle class="sPg" cx="292.9" cy="210.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="270.0" cy="161.6" r="2.2" opacity=".55"/>
<circle class="sPv" cx="190.2" cy="150.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="252.4" cy="157.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="323.0" cy="109.9" r="2.2" opacity=".55"/>
<circle class="sPg" cx="302.7" cy="146.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="323.0" cy="155.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="240.7" cy="163.3" r="2.2" opacity=".55"/>
<circle class="sPg" cx="261.4" cy="190.6" r="2.2" opacity=".55"/>
<circle class="sPg" cx="263.0" cy="193.7" r="2.2" opacity=".55"/>
<circle class="sPw" cx="311.7" cy="147.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="347.9" cy="140.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="181.0" cy="124.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="414.2" cy="144.2" r="2.2" opacity=".55"/>
<circle class="sPv" cx="211.1" cy="149.3" r="2.2" opacity=".55"/>
<circle class="sPv" cx="317.1" cy="137.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="106.6" cy="122.3" r="2.2" opacity=".55"/>
<circle class="sP" cx="305.2" cy="144.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="305.9" cy="133.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="322.1" cy="144.1" r="2.2" opacity=".55"/>
<circle class="sPr" cx="259.0" cy="73.9" r="2.2" opacity=".55"/>
<circle class="sPv" cx="177.4" cy="125.1" r="2.2" opacity=".55"/>
<circle class="sPv" cx="202.9" cy="161.6" r="2.2" opacity=".55"/>
<circle class="sPw" cx="388.1" cy="138.2" r="2.2" opacity=".55"/>
<circle class="sP" cx="281.0" cy="182.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="227.5" cy="169.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="296.0" cy="134.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="375.7" cy="124.8" r="2.2" opacity=".55"/>
<circle class="sPw" cx="297.1" cy="140.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="314.2" cy="122.9" r="2.2" opacity=".55"/>
<circle class="sP" cx="262.7" cy="140.5" r="2.2" opacity=".55"/>
<circle class="sPg" cx="280.6" cy="151.7" r="2.2" opacity=".55"/>
<circle class="sPg" cx="283.9" cy="131.9" r="2.2" opacity=".55"/>
<circle class="sPw" cx="388.5" cy="135.1" r="2.2" opacity=".55"/>
<circle class="sP" cx="264.2" cy="167.3" r="2.2" opacity=".55"/>
<circle class="sPw" cx="354.7" cy="172.8" r="2.2" opacity=".55"/>
<circle class="sPg" cx="271.1" cy="191.0" r="2.2" opacity=".55"/>
<circle class="sPr" cx="266.5" cy="89.3" r="2.2" opacity=".55"/>
<circle class="sPr" cx="440.0" cy="161.9" r="2.2" opacity=".55"/>
<circle class="sPr" cx="414.7" cy="172.1" r="2.2" opacity=".55"/>
<circle class="sPw" cx="310.6" cy="122.5" r="2.2" opacity=".55"/>
<circle class="sP" cx="261.5" cy="173.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="252.6" cy="172.4" r="2.2" opacity=".55"/>
<circle class="sPv" cx="282.3" cy="99.8" r="2.2" opacity=".55"/>
<circle class="sP" cx="283.0" cy="122.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="277.7" cy="198.4" r="2.2" opacity=".55"/>
<circle class="sPw" cx="390.6" cy="119.0" r="2.2" opacity=".55"/>
<circle class="sPg" cx="275.8" cy="179.9" r="2.2" opacity=".55"/>
<rect class="sN" x="246.322" y="152.946" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="256.322" y="167.946" text-anchor="middle">0</text>
<rect class="sN" x="276.396" y="124.224" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="286.396" y="139.224" text-anchor="middle">1</text>
<rect class="sN" x="383.26" y="138.068" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="393.26" y="153.068" text-anchor="middle">2</text>
<rect class="sN" x="358.995" y="122.073" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="368.995" y="137.073" text-anchor="middle">3</text>
<rect class="sN" x="168.287" y="134.09" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="178.287" y="149.09" text-anchor="middle">4</text>
<rect class="sN" x="322.635" y="118.43" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="332.635" y="133.43" text-anchor="middle">5</text>
<rect class="sN" x="254.806" y="175.851" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="264.806" y="190.851" text-anchor="middle">6</text>
<rect class="sN" x="267.27" y="84.418" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="277.27" y="99.418" text-anchor="middle">7</text>
<rect class="sN" x="304.201" y="145.456" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="314.201" y="160.456" text-anchor="middle">8</text>
<rect class="sN" x="305.57" y="125.209" width="20" height="20" rx="10" style="fill:var(--bg)"/><text class="sT" x="315.57" y="140.209" text-anchor="middle">9</text>
<rect class="sN" x="500" y="30" width="206" height="180" rx="8"/>
<text class="sT" x="603" y="54" text-anchor="middle">PC1 + PC2 keep 22%</text><text class="sC" x="603" y="80" text-anchor="middle">of the variance, yet</text><text class="sC" x="603" y="98" text-anchor="middle">4, 6, 7 and 2 sit apart</text>
<text class="sC" x="603" y="128" text-anchor="middle">while 1, 5, 8 and 9</text><text class="sC" x="603" y="146" text-anchor="middle">crowd the centre</text>
<text class="sS" x="603" y="180" text-anchor="middle">labels used only to colour</text><text class="sS" x="603" y="196" text-anchor="middle">700 of 1,797 points shown</text>
</svg><figcaption>The 2-D shadow of a 64-dimensional dataset. Computed with scikit-learn; numbers mark each digit's centre.</figcaption></figure>

### Reconstruction

```python
X_reconstructed = pca_95.inverse_transform(Z_95)
```

`inverse_transform` projects back into the original 64-dimensional space. It is **approximate** — the discarded 5% of variance is gone permanently. Reconstructing the digit images and viewing them side by side with the originals is the best possible demonstration of what "5% information loss" looks like: slightly blurrier digits, still perfectly readable.

<figure class="dia"><svg viewBox="0 0 720 188" role="img" aria-label="One handwritten 3 from the digits data reconstructed from 2, 10, 21, 40 and all 64 principal components: a rough outline at 2, sharper at 10 and 21, and almost identical to the original at 40">
<rect class="sB" x="20" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.05"/>
<rect class="sB" x="46" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.57"/>
<rect class="sB" x="59" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.92"/>
<rect class="sB" x="72" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.68"/>
<rect class="sB" x="85" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.27"/>
<rect class="sB" x="98" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="111" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="20" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.27"/>
<rect class="sB" x="46" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.88"/>
<rect class="sB" x="59" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.69"/>
<rect class="sB" x="72" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.66"/>
<rect class="sB" x="85" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.48"/>
<rect class="sB" x="98" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="111" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="20" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.26"/>
<rect class="sB" x="46" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.59"/>
<rect class="sB" x="59" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.33"/>
<rect class="sB" x="72" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.59"/>
<rect class="sB" x="85" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.41"/>
<rect class="sB" x="98" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="111" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="20" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.10"/>
<rect class="sB" x="46" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.39"/>
<rect class="sB" x="59" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.61"/>
<rect class="sB" x="72" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.73"/>
<rect class="sB" x="85" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.29"/>
<rect class="sB" x="98" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="111" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="20" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="46" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.23"/>
<rect class="sB" x="59" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.54"/>
<rect class="sB" x="72" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.59"/>
<rect class="sB" x="85" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.37"/>
<rect class="sB" x="98" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.11"/>
<rect class="sB" x="111" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="20" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="46" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.31"/>
<rect class="sB" x="59" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.39"/>
<rect class="sB" x="72" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.30"/>
<rect class="sB" x="85" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.43"/>
<rect class="sB" x="98" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.29"/>
<rect class="sB" x="111" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="20" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="46" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.64"/>
<rect class="sB" x="59" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.64"/>
<rect class="sB" x="72" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.49"/>
<rect class="sB" x="85" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.69"/>
<rect class="sB" x="98" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.41"/>
<rect class="sB" x="111" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.03"/>
<rect class="sB" x="20" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="33" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.04"/>
<rect class="sB" x="46" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.59"/>
<rect class="sB" x="59" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.92"/>
<rect class="sB" x="72" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.82"/>
<rect class="sB" x="85" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.62"/>
<rect class="sB" x="98" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.26"/>
<rect class="sB" x="111" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<text class="sT" x="72" y="22" text-anchor="middle">k = 2</text><text class="sS" x="72" y="148" text-anchor="middle">22% variance</text>
<rect class="sB" x="160" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.05"/>
<rect class="sB" x="186" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.50"/>
<rect class="sB" x="199" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.74"/>
<rect class="sB" x="212" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.74"/>
<rect class="sB" x="225" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.31"/>
<rect class="sB" x="238" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="251" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="160" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.29"/>
<rect class="sB" x="186" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.69"/>
<rect class="sB" x="199" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.49"/>
<rect class="sB" x="212" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.74"/>
<rect class="sB" x="225" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.50"/>
<rect class="sB" x="238" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="251" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="160" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.21"/>
<rect class="sB" x="186" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.36"/>
<rect class="sB" x="199" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.43"/>
<rect class="sB" x="212" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.80"/>
<rect class="sB" x="225" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.42"/>
<rect class="sB" x="238" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="251" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="160" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="186" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.33"/>
<rect class="sB" x="199" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.90"/>
<rect class="sB" x="212" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.98"/>
<rect class="sB" x="225" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.38"/>
<rect class="sB" x="238" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="251" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="160" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="186" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.15"/>
<rect class="sB" x="199" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.56"/>
<rect class="sB" x="212" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.63"/>
<rect class="sB" x="225" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.62"/>
<rect class="sB" x="238" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.15"/>
<rect class="sB" x="251" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="160" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="186" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.14"/>
<rect class="sB" x="199" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.19"/>
<rect class="sB" x="212" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.09"/>
<rect class="sB" x="225" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.64"/>
<rect class="sB" x="238" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.46"/>
<rect class="sB" x="251" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="160" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="186" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.51"/>
<rect class="sB" x="199" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.32"/>
<rect class="sB" x="212" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.32"/>
<rect class="sB" x="225" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.90"/>
<rect class="sB" x="238" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.53"/>
<rect class="sB" x="251" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="160" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="173" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.04"/>
<rect class="sB" x="186" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.53"/>
<rect class="sB" x="199" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.72"/>
<rect class="sB" x="212" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.98"/>
<rect class="sB" x="225" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.84"/>
<rect class="sB" x="238" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.22"/>
<rect class="sB" x="251" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<text class="sT" x="212" y="22" text-anchor="middle">k = 10</text><text class="sS" x="212" y="148" text-anchor="middle">59% variance</text>
<rect class="sB" x="300" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="326" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.53"/>
<rect class="sB" x="339" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.83"/>
<rect class="sB" x="352" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.77"/>
<rect class="sB" x="365" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.22"/>
<rect class="sB" x="378" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="391" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="300" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.26"/>
<rect class="sB" x="326" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.64"/>
<rect class="sB" x="339" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.49"/>
<rect class="sB" x="352" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.80"/>
<rect class="sB" x="365" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.28"/>
<rect class="sB" x="378" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="391" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="300" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.12"/>
<rect class="sB" x="326" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.17"/>
<rect class="sB" x="339" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.47"/>
<rect class="sB" x="352" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.89"/>
<rect class="sB" x="365" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.08"/>
<rect class="sB" x="378" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="391" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="300" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="326" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.16"/>
<rect class="sB" x="339" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.83"/>
<rect class="sB" x="352" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.86"/>
<rect class="sB" x="365" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.12"/>
<rect class="sB" x="378" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="391" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="300" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="326" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="339" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.30"/>
<rect class="sB" x="352" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.50"/>
<rect class="sB" x="365" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.63"/>
<rect class="sB" x="378" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.21"/>
<rect class="sB" x="391" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="300" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="326" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="339" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.07"/>
<rect class="sB" x="352" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.07"/>
<rect class="sB" x="365" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.65"/>
<rect class="sB" x="378" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.51"/>
<rect class="sB" x="391" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="300" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="326" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.35"/>
<rect class="sB" x="339" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.26"/>
<rect class="sB" x="352" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.43"/>
<rect class="sB" x="365" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.86"/>
<rect class="sB" x="378" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.44"/>
<rect class="sB" x="391" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="300" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="313" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="326" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.56"/>
<rect class="sB" x="339" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.86"/>
<rect class="sB" x="352" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:1.00"/>
<rect class="sB" x="365" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.62"/>
<rect class="sB" x="378" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.08"/>
<rect class="sB" x="391" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<text class="sT" x="352" y="22" text-anchor="middle">k = 21</text><text class="sS" x="352" y="148" text-anchor="middle">81% variance</text>
<rect class="sB" x="440" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="466" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.51"/>
<rect class="sB" x="479" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.87"/>
<rect class="sB" x="492" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="505" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.07"/>
<rect class="sB" x="518" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="531" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="440" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.39"/>
<rect class="sB" x="466" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.62"/>
<rect class="sB" x="479" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.47"/>
<rect class="sB" x="492" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.89"/>
<rect class="sB" x="505" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.24"/>
<rect class="sB" x="518" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="531" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="440" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.22"/>
<rect class="sB" x="466" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.08"/>
<rect class="sB" x="479" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.61"/>
<rect class="sB" x="492" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.93"/>
<rect class="sB" x="505" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="518" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.01"/>
<rect class="sB" x="531" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="440" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="466" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.18"/>
<rect class="sB" x="479" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.92"/>
<rect class="sB" x="492" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.76"/>
<rect class="sB" x="505" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="518" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.04"/>
<rect class="sB" x="531" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="440" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="466" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="479" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.14"/>
<rect class="sB" x="492" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.62"/>
<rect class="sB" x="505" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.70"/>
<rect class="sB" x="518" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="531" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="440" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="466" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.02"/>
<rect class="sB" x="479" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="492" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.11"/>
<rect class="sB" x="505" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.84"/>
<rect class="sB" x="518" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.54"/>
<rect class="sB" x="531" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="440" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="466" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.46"/>
<rect class="sB" x="479" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.29"/>
<rect class="sB" x="492" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.30"/>
<rect class="sB" x="505" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.73"/>
<rect class="sB" x="518" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.52"/>
<rect class="sB" x="531" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="440" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="453" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="466" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.58"/>
<rect class="sB" x="479" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.84"/>
<rect class="sB" x="492" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.90"/>
<rect class="sB" x="505" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.52"/>
<rect class="sB" x="518" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.09"/>
<rect class="sB" x="531" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<text class="sT" x="492" y="22" text-anchor="middle">k = 40</text><text class="sGt" x="492" y="148" text-anchor="middle">95% variance</text>
<rect class="sB" x="580" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="606" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.44"/>
<rect class="sB" x="619" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.94"/>
<rect class="sB" x="632" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="645" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="658" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="671" y="30" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.50"/>
<rect class="sB" x="606" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="619" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.38"/>
<rect class="sB" x="632" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.94"/>
<rect class="sB" x="645" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.25"/>
<rect class="sB" x="658" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="671" y="43" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.12"/>
<rect class="sB" x="606" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="619" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="632" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="645" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="658" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="671" y="56" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="606" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.13"/>
<rect class="sB" x="619" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.94"/>
<rect class="sB" x="632" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.69"/>
<rect class="sB" x="645" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="658" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="671" y="69" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="606" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="619" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="632" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.75"/>
<rect class="sB" x="645" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.75"/>
<rect class="sB" x="658" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="671" y="82" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="606" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="619" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="632" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.06"/>
<rect class="sB" x="645" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.62"/>
<rect class="sB" x="658" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.50"/>
<rect class="sB" x="671" y="95" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="606" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.50"/>
<rect class="sB" x="619" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.25"/>
<rect class="sB" x="632" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.31"/>
<rect class="sB" x="645" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.87"/>
<rect class="sB" x="658" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.56"/>
<rect class="sB" x="671" y="108" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="580" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="593" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="606" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.44"/>
<rect class="sB" x="619" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="632" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.81"/>
<rect class="sB" x="645" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.56"/>
<rect class="sB" x="658" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<rect class="sB" x="671" y="121" width="12" height="12" rx="1" style="fill:var(--ink);opacity:0.00"/>
<text class="sT" x="632" y="22" text-anchor="middle">k = 64 (all)</text><text class="sGt" x="632" y="148" text-anchor="middle">100% variance</text>
<text class="sS" x="360" y="176" text-anchor="middle">one "3" rebuilt with inverse_transform: the mean digit plus 2 directions gives a rough outline; detail returns as k grows</text>
</svg><figcaption>What "keep 95% of the variance" looks like on an actual image. Computed with scikit-learn.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 236" role="img" aria-label="Twelve points in three loose groups and their ward-linkage dendrogram: points merge within groups at small distances, the three groups merge at much larger ones, and a cut below the two tallest links gives three clusters">
<circle class="sP" cx="58.8" cy="178.7" r="5"/>
<circle class="sP" cx="90.9" cy="173.1" r="5"/>
<circle class="sP" cx="93.3" cy="155.0" r="5"/>
<circle class="sP" cx="58.6" cy="152.2" r="5"/>
<circle class="sPg" cx="190.8" cy="126.2" r="5"/>
<circle class="sPg" cx="214.2" cy="162.0" r="5"/>
<circle class="sPg" cx="204.9" cy="151.7" r="5"/>
<circle class="sPg" cx="207.1" cy="135.7" r="5"/>
<circle class="sPw" cx="152.0" cy="52.7" r="5"/>
<circle class="sPw" cx="153.8" cy="77.8" r="5"/>
<circle class="sPw" cx="115.8" cy="96.6" r="5"/>
<circle class="sPw" cx="146.3" cy="65.9" r="5"/>
<text class="sS" x="65.8166" y="173.737">0</text>
<text class="sS" x="97.9333" y="185.128">1</text>
<text class="sS" x="100.251" y="150.02">2</text>
<text class="sS" x="65.5938" y="147.168">3</text>
<text class="sS" x="197.85" y="121.187">4</text>
<text class="sS" x="221.158" y="156.997">5</text>
<text class="sS" x="197.88" y="146.743" text-anchor="end">6</text>
<text class="sS" x="214.133" y="130.718">7</text>
<text class="sS" x="159.045" y="47.7487">8</text>
<text class="sS" x="160.829" y="72.7506">9</text>
<text class="sS" x="122.837" y="91.5567">10</text>
<text class="sS" x="139.271" y="60.936" text-anchor="end">11</text>
<rect class="sN" x="30" y="26" width="250" height="186" rx="8" style="fill:none"/><text class="sT" x="155" y="20" text-anchor="middle">12 points</text>
<polyline class="sL" points="320.0,210.0 320.0,195.8 353.6,195.8 353.6,210.0" style="fill:none"/>
<polyline class="sL" points="387.3,210.0 387.3,189.2 420.9,189.2 420.9,210.0" style="fill:none"/>
<polyline class="sL" points="336.8,195.8 336.8,181.4 404.1,181.4 404.1,189.2" style="fill:none"/>
<polyline class="sL" points="454.5,210.0 454.5,200.2 488.2,200.2 488.2,210.0" style="fill:none"/>
<polyline class="sL" points="521.8,210.0 521.8,197.7 555.5,197.7 555.5,210.0" style="fill:none"/>
<polyline class="sL" points="471.4,200.2 471.4,180.0 538.6,180.0 538.6,197.7" style="fill:none"/>
<polyline class="sL" points="656.4,210.0 656.4,199.7 690.0,199.7 690.0,210.0" style="fill:none"/>
<polyline class="sL" points="622.7,210.0 622.7,192.7 673.2,192.7 673.2,199.7" style="fill:none"/>
<polyline class="sL" points="589.1,210.0 589.1,170.6 648.0,170.6 648.0,192.7" style="fill:none"/>
<polyline class="sL" points="505.0,180.0 505.0,76.3 618.5,76.3 618.5,170.6" style="fill:none"/>
<polyline class="sL" points="370.5,181.4 370.5,40.0 561.8,40.0 561.8,76.3" style="fill:none"/>
<text class="sS" x="320" y="224" text-anchor="middle">1</text>
<text class="sS" x="353.636" y="224" text-anchor="middle">2</text>
<text class="sS" x="387.273" y="224" text-anchor="middle">0</text>
<text class="sS" x="420.909" y="224" text-anchor="middle">3</text>
<text class="sS" x="454.545" y="224" text-anchor="middle">5</text>
<text class="sS" x="488.182" y="224" text-anchor="middle">6</text>
<text class="sS" x="521.818" y="224" text-anchor="middle">4</text>
<text class="sS" x="555.455" y="224" text-anchor="middle">7</text>
<text class="sS" x="589.091" y="224" text-anchor="middle">10</text>
<text class="sS" x="622.727" y="224" text-anchor="middle">8</text>
<text class="sS" x="656.364" y="224" text-anchor="middle">9</text>
<text class="sS" x="690" y="224" text-anchor="middle">11</text>
<line class="sLr" x1="316" y1="123.442" x2="700" y2="123.442" stroke-dasharray="6 4"/><text class="sRt" x="700" y="117.442" text-anchor="end">cut here → 3 clusters</text>
<text class="sT" x="505" y="20" text-anchor="middle">dendrogram (ward linkage)</text><text class="sS" x="326" y="40">merge distance</text>
</svg><figcaption>Reading a dendrogram: the long vertical lines are the expensive merges, so cut just below them. Computed with SciPy.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="Two curves against the number of dimensions: the share of random points lying within 0.001 of a border rises towards 86 percent at 1,000 dimensions, and the average distance between random points grows like the square root of d over 6">
<text class="sT" x="195" y="22" text-anchor="middle">share of points near a border</text><text class="sC" x="195" y="38" text-anchor="middle">(within 0.001 of an edge)</text>
<line class="sLm" x1="70" y1="200" x2="330" y2="200" marker-end="url(#ahm)"/><line class="sLm" x1="70" y1="200" x2="70" y2="50" marker-end="url(#ahm)"/>
<polyline class="sLr" points="70.0,199.7 95.1,199.4 109.8,199.2 128.2,198.6 153.3,197.2 178.4,194.5 211.6,186.7 236.7,174.6 276.4,136.8 320.0,78.9" fill="none" stroke-width="2.5"/>
<text class="sC" x="70" y="216" text-anchor="middle">1</text>
<text class="sC" x="153.333" y="216" text-anchor="middle">10</text>
<text class="sC" x="236.667" y="216" text-anchor="middle">100</text>
<text class="sC" x="320" y="216" text-anchor="middle">1000</text>
<text class="sC" x="64" y="64" text-anchor="end">100%</text><text class="sC" x="64" y="204" text-anchor="end">0</text>
<text class="sRt" x="316" y="70.909" text-anchor="end">86% at 1,000-D</text>
<text class="sT" x="530" y="22" text-anchor="middle">average distance between</text><text class="sC" x="530" y="38" text-anchor="middle">two random points (unit cube)</text>
<line class="sLm" x1="410" y1="200" x2="670" y2="200" marker-end="url(#ahm)"/><line class="sLm" x1="410" y1="200" x2="410" y2="50" marker-end="url(#ahm)"/>
<polyline class="sLw" points="410.0,195.6 435.1,193.8 449.8,192.4 468.2,190.2 493.3,186.1 518.4,180.3 551.6,168.9 576.7,156.0 616.4,123.9 660.0,61.0" fill="none" stroke-width="2.5"/>
<text class="sC" x="410" y="216" text-anchor="middle">1</text>
<text class="sC" x="493.333" y="216" text-anchor="middle">10</text>
<text class="sC" x="576.667" y="216" text-anchor="middle">100</text>
<text class="sC" x="660" y="216" text-anchor="middle">1000</text>
<text class="sWt" x="656" y="52.9698" text-anchor="end">≈ 12.9 at 1,000-D</text>
<text class="sS" x="360" y="240" text-anchor="middle">number of dimensions (log scale) · everything is far from everything, and near some edge</text>
</svg><figcaption>The curse of dimensionality, computed: 1 − 0.998ᵈ of points sit near a border, and typical distances grow like √(d/6).</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="The same 2-D cloud projected onto its first principal component, which keeps most of the variance with short residuals, and onto another axis, which keeps far less with long residuals">
<rect class="sN" x="14" y="30" width="332" height="176" rx="8"/><text class="sGt" x="180" y="22" text-anchor="middle">onto PC1: the widest shadow</text>
<line class="sLg" x1="50.5491" y1="195.779" x2="309.451" y2="44.2209"/>
<line class="sD" x1="117.626" y1="179.088" x2="107.783" y2="162.275"/>
<circle class="sP" cx="117.6" cy="179.1" r="3"/>
<circle class="sPg" cx="107.8" cy="162.3" r="2.6"/>
<line class="sD" x1="230.381" y1="137.802" x2="209.761" y2="102.578"/>
<circle class="sP" cx="230.4" cy="137.8" r="3"/>
<circle class="sPg" cx="209.8" cy="102.6" r="2.6"/>
<line class="sD" x1="184.988" y1="163.224" x2="164.87" y2="128.857"/>
<circle class="sP" cx="185.0" cy="163.2" r="3"/>
<circle class="sPg" cx="164.9" cy="128.9" r="2.6"/>
<line class="sD" x1="231.826" y1="85.073" x2="233.827" y2="88.4905"/>
<circle class="sP" cx="231.8" cy="85.1" r="3"/>
<circle class="sPg" cx="233.8" cy="88.5" r="2.6"/>
<line class="sD" x1="252.342" y1="87.9243" x2="247.864" y2="80.2733"/>
<circle class="sP" cx="252.3" cy="87.9" r="3"/>
<circle class="sPg" cx="247.9" cy="80.3" r="2.6"/>
<line class="sD" x1="197.273" y1="115.181" x2="194.966" y2="111.239"/>
<circle class="sP" cx="197.3" cy="115.2" r="3"/>
<circle class="sPg" cx="195.0" cy="111.2" r="2.6"/>
<line class="sD" x1="130.4" y1="144.828" x2="132.234" y2="147.961"/>
<circle class="sP" cx="130.4" cy="144.8" r="3"/>
<circle class="sPg" cx="132.2" cy="148.0" r="2.6"/>
<line class="sD" x1="106.141" y1="169.226" x2="103.529" y2="164.765"/>
<circle class="sP" cx="106.1" cy="169.2" r="3"/>
<circle class="sPg" cx="103.5" cy="164.8" r="2.6"/>
<line class="sD" x1="210.722" y1="100.279" x2="211.479" y2="101.573"/>
<circle class="sP" cx="210.7" cy="100.3" r="3"/>
<circle class="sPg" cx="211.5" cy="101.6" r="2.6"/>
<line class="sD" x1="130.184" y1="102.466" x2="150.543" y2="137.244"/>
<circle class="sP" cx="130.2" cy="102.5" r="3"/>
<circle class="sPg" cx="150.5" cy="137.2" r="2.6"/>
<line class="sD" x1="181.136" y1="130.753" x2="176.158" y2="122.249"/>
<circle class="sP" cx="181.1" cy="130.8" r="3"/>
<circle class="sPg" cx="176.2" cy="122.2" r="2.6"/>
<line class="sD" x1="186.179" y1="126.51" x2="181.764" y2="118.967"/>
<circle class="sP" cx="186.2" cy="126.5" r="3"/>
<circle class="sPg" cx="181.8" cy="119.0" r="2.6"/>
<line class="sD" x1="154.437" y1="141.249" x2="151.697" y2="136.568"/>
<circle class="sP" cx="154.4" cy="141.2" r="3"/>
<circle class="sPg" cx="151.7" cy="136.6" r="2.6"/>
<line class="sD" x1="284.678" y1="58.3067" x2="284.859" y2="58.6165"/>
<circle class="sP" cx="284.7" cy="58.3" r="3"/>
<circle class="sPg" cx="284.9" cy="58.6" r="2.6"/>
<line class="sD" x1="176.293" y1="107.339" x2="182.759" y2="118.385"/>
<circle class="sP" cx="176.3" cy="107.3" r="3"/>
<circle class="sPg" cx="182.8" cy="118.4" r="2.6"/>
<line class="sD" x1="286.43" y1="62.4136" x2="284.374" y2="58.9008"/>
<circle class="sP" cx="286.4" cy="62.4" r="3"/>
<circle class="sPg" cx="284.4" cy="58.9" r="2.6"/>
<line class="sD" x1="115.78" y1="104.855" x2="138.773" y2="144.134"/>
<circle class="sP" cx="115.8" cy="104.9" r="3"/>
<circle class="sPg" cx="138.8" cy="144.1" r="2.6"/>
<line class="sD" x1="95.0338" y1="175.899" x2="92.3478" y2="171.311"/>
<circle class="sP" cx="95.0" cy="175.9" r="3"/>
<circle class="sPg" cx="92.3" cy="171.3" r="2.6"/>
<line class="sD" x1="189.04" y1="66.5287" x2="210.046" y2="102.412"/>
<circle class="sP" cx="189.0" cy="66.5" r="3"/>
<circle class="sPg" cx="210.0" cy="102.4" r="2.6"/>
<line class="sD" x1="141.831" y1="191.709" x2="120.309" y2="154.943"/>
<circle class="sP" cx="141.8" cy="191.7" r="3"/>
<circle class="sPg" cx="120.3" cy="154.9" r="2.6"/>
<line class="sD" x1="213.997" y1="110.426" x2="209.494" y2="102.734"/>
<circle class="sP" cx="214.0" cy="110.4" r="3"/>
<circle class="sPg" cx="209.5" cy="102.7" r="2.6"/>
<line class="sD" x1="147.003" y1="128.675" x2="151.642" y2="136.6"/>
<circle class="sP" cx="147.0" cy="128.7" r="3"/>
<circle class="sPg" cx="151.6" cy="136.6" r="2.6"/>
<line class="sD" x1="182.409" y1="111.773" x2="185.381" y2="116.85"/>
<circle class="sP" cx="182.4" cy="111.8" r="3"/>
<circle class="sPg" cx="185.4" cy="116.9" r="2.6"/>
<line class="sD" x1="137.131" y1="117.165" x2="149.308" y2="137.967"/>
<circle class="sP" cx="137.1" cy="117.2" r="3"/>
<circle class="sPg" cx="149.3" cy="138.0" r="2.6"/>
<line class="sD" x1="255.757" y1="74.8087" x2="256.125" y2="75.4374"/>
<circle class="sP" cx="255.8" cy="74.8" r="3"/>
<circle class="sPg" cx="256.1" cy="75.4" r="2.6"/>
<line class="sD" x1="140.983" y1="126.496" x2="148.108" y2="138.669"/>
<circle class="sP" cx="141.0" cy="126.5" r="3"/>
<circle class="sPg" cx="148.1" cy="138.7" r="2.6"/>
<text class="sGt" x="24" y="48">keeps 88% of the variance</text>
<rect class="sN" x="374" y="30" width="332" height="176" rx="8"/><text class="sRt" x="540" y="22" text-anchor="middle">onto another axis</text>
<line class="sLr" x1="554.525" y1="200" x2="525.475" y2="40"/>
<line class="sD" x1="477.626" y1="179.088" x2="548.395" y2="166.239"/>
<circle class="sP" cx="477.6" cy="179.1" r="3"/>
<circle class="sPr" cx="548.4" cy="166.2" r="2.6"/>
<line class="sD" x1="590.381" y1="137.802" x2="544.737" y2="146.09"/>
<circle class="sP" cx="590.4" cy="137.8" r="3"/>
<circle class="sPr" cx="544.7" cy="146.1" r="2.6"/>
<line class="sD" x1="544.988" y1="163.224" x2="547.757" y2="162.721"/>
<circle class="sP" cx="545.0" cy="163.2" r="3"/>
<circle class="sPr" cx="547.8" cy="162.7" r="2.6"/>
<line class="sD" x1="591.826" y1="85.073" x2="535.515" y2="95.297"/>
<circle class="sP" cx="591.8" cy="85.1" r="3"/>
<circle class="sPr" cx="535.5" cy="95.3" r="2.6"/>
<line class="sD" x1="612.342" y1="87.9243" x2="536.671" y2="101.663"/>
<circle class="sP" cx="612.3" cy="87.9" r="3"/>
<circle class="sPr" cx="536.7" cy="101.7" r="2.6"/>
<line class="sD" x1="557.273" y1="115.181" x2="539.704" y2="118.371"/>
<circle class="sP" cx="557.3" cy="115.2" r="3"/>
<circle class="sPr" cx="539.7" cy="118.4" r="2.6"/>
<line class="sD" x1="490.4" y1="144.828" x2="542.781" y2="135.318"/>
<circle class="sP" cx="490.4" cy="144.8" r="3"/>
<circle class="sPr" cx="542.8" cy="135.3" r="2.6"/>
<line class="sD" x1="466.141" y1="169.226" x2="546.295" y2="154.673"/>
<circle class="sP" cx="466.1" cy="169.2" r="3"/>
<circle class="sPr" cx="546.3" cy="154.7" r="2.6"/>
<line class="sD" x1="570.722" y1="100.279" x2="537.514" y2="106.308"/>
<circle class="sP" cx="570.7" cy="100.3" r="3"/>
<circle class="sPr" cx="537.5" cy="106.3" r="2.6"/>
<line class="sD" x1="490.184" y1="102.466" x2="535.328" y2="94.2692"/>
<circle class="sP" cx="490.2" cy="102.5" r="3"/>
<circle class="sPr" cx="535.3" cy="94.3" r="2.6"/>
<line class="sD" x1="541.136" y1="130.753" x2="541.926" y2="130.61"/>
<circle class="sP" cx="541.1" cy="130.8" r="3"/>
<circle class="sPr" cx="541.9" cy="130.6" r="2.6"/>
<line class="sD" x1="546.179" y1="126.51" x2="541.342" y2="127.389"/>
<circle class="sP" cx="546.2" cy="126.5" r="3"/>
<circle class="sPr" cx="541.3" cy="127.4" r="2.6"/>
<line class="sD" x1="514.437" y1="141.249" x2="542.919" y2="136.078"/>
<circle class="sP" cx="514.4" cy="141.2" r="3"/>
<circle class="sPr" cx="542.9" cy="136.1" r="2.6"/>
<line class="sD" x1="644.678" y1="58.3067" x2="532.497" y2="78.6746"/>
<circle class="sP" cx="644.7" cy="58.3" r="3"/>
<circle class="sPr" cx="532.5" cy="78.7" r="2.6"/>
<line class="sD" x1="536.293" y1="107.339" x2="537.656" y2="107.092"/>
<circle class="sP" cx="536.3" cy="107.3" r="3"/>
<circle class="sPr" cx="537.7" cy="107.1" r="2.6"/>
<line class="sD" x1="646.43" y1="62.4136" x2="533.275" y2="82.9585"/>
<circle class="sP" cx="646.4" cy="62.4" r="3"/>
<circle class="sPr" cx="533.3" cy="83.0" r="2.6"/>
<line class="sD" x1="475.78" y1="104.855" x2="535.289" y2="94.0506"/>
<circle class="sP" cx="475.8" cy="104.9" r="3"/>
<circle class="sPr" cx="535.3" cy="94.1" r="2.6"/>
<line class="sD" x1="455.034" y1="175.899" x2="547.114" y2="159.181"/>
<circle class="sP" cx="455.0" cy="175.9" r="3"/>
<circle class="sPr" cx="547.1" cy="159.2" r="2.6"/>
<line class="sD" x1="549.04" y1="66.5287" x2="530.89" y2="69.8241"/>
<circle class="sP" cx="549.0" cy="66.5" r="3"/>
<circle class="sPr" cx="530.9" cy="69.8" r="2.6"/>
<line class="sD" x1="501.831" y1="191.709" x2="551.386" y2="182.711"/>
<circle class="sP" cx="501.8" cy="191.7" r="3"/>
<circle class="sPr" cx="551.4" cy="182.7" r="2.6"/>
<line class="sD" x1="573.997" y1="110.426" x2="539.402" y2="116.707"/>
<circle class="sP" cx="574.0" cy="110.4" r="3"/>
<circle class="sPr" cx="539.4" cy="116.7" r="2.6"/>
<line class="sD" x1="507.003" y1="128.675" x2="540.472" y2="122.598"/>
<circle class="sP" cx="507.0" cy="128.7" r="3"/>
<circle class="sPr" cx="540.5" cy="122.6" r="2.6"/>
<line class="sD" x1="542.409" y1="111.773" x2="538.631" y2="112.459"/>
<circle class="sP" cx="542.4" cy="111.8" r="3"/>
<circle class="sPr" cx="538.6" cy="112.5" r="2.6"/>
<line class="sD" x1="497.131" y1="117.165" x2="538.134" y2="109.72"/>
<circle class="sP" cx="497.1" cy="117.2" r="3"/>
<circle class="sPr" cx="538.1" cy="109.7" r="2.6"/>
<line class="sD" x1="615.757" y1="74.8087" x2="534.474" y2="89.5666"/>
<circle class="sP" cx="615.8" cy="74.8" r="3"/>
<circle class="sPr" cx="534.5" cy="89.6" r="2.6"/>
<line class="sD" x1="500.983" y1="126.496" x2="539.897" y2="119.431"/>
<circle class="sP" cx="501.0" cy="126.5" r="3"/>
<circle class="sPr" cx="539.9" cy="119.4" r="2.6"/>
<text class="sRt" x="384" y="198">keeps 21% of the variance</text>
<text class="sS" x="360" y="226" text-anchor="middle">the dashed residuals are the reconstruction error: maximising kept variance and minimising them are the same problem</text>
</svg><figcaption>Why PCA maximises variance: the projection that spreads the points most is the one that moves them least. Computed.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Three large groups and one small tight group of 12 points: with k equal 4, k-means merges the small group into a large cluster even though there are four groups; only at k equal 10 does it get a cluster of its own">
<rect class="sN" x="20" y="30" width="320" height="170" rx="0" style="fill:none"/><text class="sT" x="180" y="22" text-anchor="middle">k = 4</text>
<circle class="sPg" cx="103.6" cy="144.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.8" cy="149.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="104.0" cy="151.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="81.9" cy="156.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.5" cy="158.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="96.8" cy="157.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="42.4" cy="176.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.9" cy="152.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="89.1" cy="130.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="86.4" cy="174.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="72.1" cy="162.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="94.7" cy="153.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="108.5" cy="144.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="111.3" cy="160.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="115.0" cy="154.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.7" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.7" cy="160.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="63.7" cy="151.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="80.5" cy="145.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="89.8" cy="172.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="112.2" cy="152.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.3" cy="146.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="105.6" cy="149.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="94.8" cy="157.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="93.9" cy="154.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="83.6" cy="144.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="121.0" cy="150.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="131.7" cy="155.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="92.8" cy="144.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="82.4" cy="149.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="127.1" cy="172.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="147.6" cy="166.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="79.9" cy="160.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="88.6" cy="151.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="90.3" cy="165.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="74.8" cy="137.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="106.9" cy="159.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="102.3" cy="168.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="75.5" cy="165.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="73.2" cy="152.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.7" cy="157.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="110.7" cy="146.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="84.8" cy="156.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="96.1" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.2" cy="168.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="106.5" cy="152.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.3" cy="168.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="65.6" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="115.9" cy="186.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="118.9" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="133.2" cy="130.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="83.2" cy="154.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="77.3" cy="158.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="91.9" cy="161.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="87.9" cy="157.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="90.8" cy="145.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="83.4" cy="160.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="73.8" cy="163.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="88.7" cy="178.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="68.4" cy="145.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="98.6" cy="156.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="132.9" cy="161.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="89.6" cy="150.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="101.6" cy="163.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="79.3" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="79.4" cy="147.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.5" cy="170.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.6" cy="165.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="47.5" cy="117.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="113.9" cy="155.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="113.8" cy="159.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="78.5" cy="149.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="68.8" cy="157.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="99.5" cy="145.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="81.0" cy="146.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="84.8" cy="156.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="99.4" cy="158.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="103.1" cy="143.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="84.0" cy="164.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="68.6" cy="155.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="95.0" cy="162.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="92.2" cy="166.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="86.3" cy="143.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="106.1" cy="170.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="106.4" cy="135.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="74.7" cy="147.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.7" cy="147.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.6" cy="144.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="113.5" cy="149.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="113.2" cy="167.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="110.2" cy="142.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.4" cy="140.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="105.8" cy="145.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.9" cy="138.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="107.0" cy="142.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="99.0" cy="136.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="78.6" cy="156.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="108.3" cy="163.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="94.4" cy="157.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.4" cy="151.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="69.2" cy="161.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="64.7" cy="147.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="120.3" cy="166.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="72.8" cy="158.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.0" cy="163.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="93.9" cy="153.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="102.9" cy="158.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="102.4" cy="149.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="131.5" cy="152.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="108.4" cy="154.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.6" cy="162.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.0" cy="150.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="114.4" cy="129.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.4" cy="160.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.6" cy="132.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="132.0" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="88.3" cy="151.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="92.7" cy="152.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="96.5" cy="172.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="99.9" cy="151.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="91.9" cy="148.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="147.7" cy="155.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="94.0" cy="164.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="118.9" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="107.9" cy="179.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="69.3" cy="128.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="72.6" cy="141.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="108.4" cy="151.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="130.1" cy="169.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="112.8" cy="151.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="115.6" cy="147.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="142.5" cy="163.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="67.0" cy="178.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.1" cy="147.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="108.0" cy="132.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.1" cy="142.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="94.9" cy="141.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="99.2" cy="140.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="81.3" cy="172.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="112.7" cy="151.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="82.0" cy="143.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="86.0" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.3" cy="176.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="110.4" cy="144.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="60.5" cy="169.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="110.5" cy="158.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="82.6" cy="144.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="75.5" cy="153.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="90.0" cy="171.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.7" cy="139.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="79.6" cy="146.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="102.9" cy="132.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="68.4" cy="160.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="96.9" cy="171.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="91.8" cy="145.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="131.0" cy="145.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="79.8" cy="148.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="133.5" cy="157.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="59.0" cy="159.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="87.1" cy="158.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="104.7" cy="147.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="82.1" cy="171.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.7" cy="142.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="75.3" cy="160.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="68.0" cy="160.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="91.9" cy="179.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="55.0" cy="153.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="119.9" cy="155.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="88.3" cy="171.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="86.2" cy="144.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="77.9" cy="148.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="101.8" cy="137.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="113.5" cy="187.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="106.0" cy="142.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="82.0" cy="170.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.7" cy="162.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="86.0" cy="151.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="50.5" cy="130.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="127.9" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="73.6" cy="151.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="115.7" cy="134.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="80.8" cy="165.1" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="116.3" cy="143.6" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="102.2" cy="161.4" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="102.0" cy="167.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="93.1" cy="162.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="115.7" cy="147.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="70.7" cy="159.0" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="120.6" cy="150.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="100.5" cy="171.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="85.5" cy="159.7" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="79.9" cy="145.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="76.5" cy="175.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="81.4" cy="172.2" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="89.3" cy="180.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="91.3" cy="136.9" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="83.1" cy="165.5" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="94.7" cy="135.8" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="97.4" cy="138.3" r="2.2" opacity="0.5"/>
<circle class="sPg" cx="73.1" cy="175.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="213.7" cy="136.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="250.6" cy="130.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="242.5" cy="110.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="218.6" cy="130.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="208.2" cy="135.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="227.3" cy="126.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="253.8" cy="138.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="235.1" cy="134.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="239.5" cy="117.1" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="235.5" cy="148.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="201.1" cy="116.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="243.8" cy="116.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="230.1" cy="164.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="250.5" cy="117.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="231.5" cy="117.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="317.5" cy="135.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="247.0" cy="127.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="230.6" cy="113.9" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="206.6" cy="148.9" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="235.8" cy="146.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="198.4" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="225.0" cy="110.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="211.9" cy="104.0" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="221.8" cy="141.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="231.2" cy="164.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="203.3" cy="126.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="255.9" cy="159.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="228.3" cy="122.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="222.4" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="197.5" cy="135.0" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="233.2" cy="140.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="220.4" cy="109.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="234.1" cy="144.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="220.0" cy="146.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="232.1" cy="129.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="248.3" cy="135.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="248.5" cy="127.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="250.4" cy="135.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="237.8" cy="141.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="230.6" cy="109.0" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="218.5" cy="145.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="249.6" cy="151.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="224.1" cy="140.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="200.5" cy="148.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="245.2" cy="130.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="212.2" cy="148.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="255.5" cy="121.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="206.5" cy="104.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="221.7" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="173.6" cy="135.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="234.5" cy="123.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="169.9" cy="150.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="223.2" cy="125.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="196.3" cy="161.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="229.3" cy="139.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="289.0" cy="136.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="224.0" cy="143.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="245.2" cy="121.9" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="276.5" cy="138.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="262.9" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="222.7" cy="168.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="236.7" cy="127.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="252.1" cy="146.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="210.0" cy="132.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="217.2" cy="122.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="194.9" cy="121.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="261.8" cy="108.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="215.9" cy="141.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="227.0" cy="154.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="211.5" cy="141.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="223.3" cy="150.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="261.9" cy="143.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="221.7" cy="123.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="226.9" cy="128.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="227.4" cy="140.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="221.5" cy="134.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="265.4" cy="147.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="226.2" cy="129.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="220.5" cy="116.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="240.5" cy="133.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="238.9" cy="126.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="213.7" cy="122.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="221.8" cy="134.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="247.9" cy="133.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="261.8" cy="137.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="226.1" cy="148.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="240.4" cy="139.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="271.4" cy="144.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="189.8" cy="156.9" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="243.4" cy="146.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="209.0" cy="123.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="237.3" cy="106.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="250.7" cy="138.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="198.2" cy="141.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="210.3" cy="135.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="288.4" cy="160.1" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="230.3" cy="150.1" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="212.8" cy="141.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="226.3" cy="125.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="201.4" cy="157.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="222.2" cy="144.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="203.4" cy="127.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="237.4" cy="142.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="244.1" cy="133.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="245.1" cy="108.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="224.0" cy="123.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="242.1" cy="142.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="239.2" cy="101.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="238.2" cy="153.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="242.9" cy="149.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="202.8" cy="125.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="228.4" cy="131.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="185.8" cy="153.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="242.7" cy="117.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="278.5" cy="125.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="247.6" cy="136.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="241.3" cy="128.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="215.9" cy="119.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="230.0" cy="136.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="234.1" cy="117.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="270.6" cy="149.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="196.1" cy="167.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="247.1" cy="141.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="270.5" cy="123.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="248.8" cy="114.1" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="230.0" cy="139.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="235.5" cy="139.0" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="229.5" cy="142.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="259.0" cy="124.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="242.1" cy="136.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="239.9" cy="130.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="229.2" cy="128.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="240.6" cy="120.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="184.4" cy="152.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="206.7" cy="117.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="270.2" cy="131.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="226.8" cy="124.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="219.3" cy="122.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="231.8" cy="122.3" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="241.3" cy="142.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="257.0" cy="102.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="220.1" cy="126.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="214.4" cy="125.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="246.9" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="231.2" cy="148.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="258.5" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="198.7" cy="130.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="193.5" cy="115.9" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="201.3" cy="148.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="194.8" cy="138.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="240.8" cy="133.7" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="255.6" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="304.3" cy="145.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="210.4" cy="138.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="226.0" cy="131.1" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="220.0" cy="145.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="228.9" cy="127.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="234.8" cy="124.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="222.7" cy="151.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="231.6" cy="168.8" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="224.0" cy="159.6" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="245.1" cy="143.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="244.7" cy="114.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="234.7" cy="125.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="280.5" cy="123.4" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="254.8" cy="147.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="214.0" cy="131.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="249.8" cy="134.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="204.7" cy="147.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="206.4" cy="134.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="193.8" cy="118.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="230.6" cy="135.9" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="216.2" cy="146.2" r="2.2" opacity="0.5"/>
<circle class="sPv" cx="262.7" cy="147.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="211.6" cy="130.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="171.1" cy="56.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="190.4" cy="85.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="204.7" cy="63.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="175.1" cy="63.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="184.7" cy="73.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="164.7" cy="71.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="166.5" cy="76.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="132.6" cy="82.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="150.4" cy="52.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="175.4" cy="79.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.0" cy="55.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="147.0" cy="68.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="166.5" cy="72.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="177.7" cy="56.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="189.0" cy="56.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="192.7" cy="77.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="219.2" cy="68.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="143.5" cy="76.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="170.5" cy="54.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="185.2" cy="86.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="160.2" cy="66.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="179.9" cy="65.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="188.3" cy="83.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="159.7" cy="84.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="182.3" cy="80.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="156.5" cy="64.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="161.6" cy="76.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="168.6" cy="65.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="167.6" cy="92.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="144.2" cy="59.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="149.5" cy="71.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="188.2" cy="59.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="181.7" cy="61.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.3" cy="67.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="186.5" cy="81.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="137.2" cy="80.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="189.1" cy="83.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="190.6" cy="41.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="152.7" cy="90.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="144.2" cy="74.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="172.6" cy="76.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="166.1" cy="68.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="124.8" cy="84.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="154.8" cy="63.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="155.5" cy="75.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="185.9" cy="64.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="203.4" cy="79.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="188.3" cy="100.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="142.7" cy="61.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="130.7" cy="87.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="138.9" cy="96.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="196.8" cy="41.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="191.4" cy="56.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="153.6" cy="93.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="125.5" cy="72.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="190.9" cy="62.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="187.4" cy="78.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.9" cy="87.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="159.5" cy="57.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="153.3" cy="72.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="159.7" cy="62.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="200.1" cy="81.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.2" cy="82.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="155.0" cy="67.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="148.6" cy="66.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="128.9" cy="63.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="176.1" cy="84.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="145.8" cy="63.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="164.9" cy="53.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="156.8" cy="53.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="187.6" cy="40.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="160.5" cy="55.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="174.9" cy="73.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="141.7" cy="83.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="173.2" cy="64.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.7" cy="71.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.0" cy="73.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="152.1" cy="58.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="205.5" cy="55.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="174.3" cy="64.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="143.0" cy="55.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="156.9" cy="88.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.0" cy="54.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.6" cy="76.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="150.7" cy="73.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="159.1" cy="74.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="167.8" cy="83.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="183.0" cy="68.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="149.3" cy="49.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="169.1" cy="71.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="174.9" cy="84.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="177.4" cy="71.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="168.4" cy="83.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="148.1" cy="63.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="138.2" cy="49.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="202.7" cy="63.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="146.8" cy="69.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="179.3" cy="72.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="149.4" cy="74.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="202.7" cy="83.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="143.1" cy="69.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="197.0" cy="84.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="171.6" cy="70.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="152.3" cy="65.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="153.8" cy="87.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="172.0" cy="75.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="190.1" cy="76.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="135.9" cy="64.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="188.3" cy="54.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="189.1" cy="61.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="161.7" cy="77.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="174.5" cy="77.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="161.3" cy="62.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="145.7" cy="64.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="204.9" cy="69.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="166.2" cy="52.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="167.9" cy="73.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="203.5" cy="81.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="188.6" cy="74.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="163.3" cy="88.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="171.9" cy="72.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="182.7" cy="68.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="166.1" cy="72.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="151.8" cy="84.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.3" cy="66.5" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="160.0" cy="64.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="180.1" cy="67.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="131.6" cy="49.8" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="200.7" cy="58.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="178.8" cy="35.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.7" cy="71.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="146.0" cy="88.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="192.3" cy="62.6" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="186.4" cy="67.7" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.0" cy="93.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="157.3" cy="74.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="135.2" cy="64.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="185.4" cy="58.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="173.0" cy="89.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.3" cy="78.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="183.3" cy="84.4" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="156.1" cy="63.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.0" cy="94.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="135.8" cy="69.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="160.3" cy="63.3" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="170.4" cy="59.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="148.2" cy="75.2" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="152.1" cy="67.0" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="155.7" cy="86.9" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="165.7" cy="69.1" r="2.2" opacity="0.5"/>
<circle class="sPw" cx="262.5" cy="61.2" r="3.6" opacity="1"/>
<circle class="sPw" cx="257.4" cy="62.8" r="3.6" opacity="1"/>
<circle class="sPw" cx="253.0" cy="69.3" r="3.6" opacity="1"/>
<circle class="sPw" cx="255.5" cy="66.8" r="3.6" opacity="1"/>
<circle class="sPw" cx="269.6" cy="59.0" r="3.6" opacity="1"/>
<circle class="sPw" cx="262.5" cy="65.2" r="3.6" opacity="1"/>
<circle class="sPw" cx="267.0" cy="68.7" r="3.6" opacity="1"/>
<circle class="sPw" cx="250.6" cy="65.9" r="3.6" opacity="1"/>
<circle class="sPw" cx="251.9" cy="63.2" r="3.6" opacity="1"/>
<circle class="sPw" cx="257.6" cy="57.9" r="3.6" opacity="1"/>
<circle class="sPw" cx="261.7" cy="60.0" r="3.6" opacity="1"/>
<circle class="sPw" cx="258.8" cy="64.0" r="3.6" opacity="1"/>
<circle class="sL" cx="256.7" cy="63.6" r="13" style="fill:none;stroke-dasharray:3 2"/>
<text class="sRt" x="180" y="218" text-anchor="middle">12 distinct points swallowed by a big cluster</text>
<rect class="sN" x="370" y="30" width="320" height="170" rx="0" style="fill:none"/><text class="sT" x="530" y="22" text-anchor="middle">k = 10</text>
<circle class="sP" cx="453.6" cy="144.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.8" cy="149.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="454.0" cy="151.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="431.9" cy="156.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.5" cy="158.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="446.8" cy="157.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="392.4" cy="176.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.9" cy="152.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="439.1" cy="130.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="436.4" cy="174.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="422.1" cy="162.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="444.7" cy="153.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="458.5" cy="144.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="461.3" cy="160.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="465.0" cy="154.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.7" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.7" cy="160.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="413.7" cy="151.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="430.5" cy="145.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="439.8" cy="172.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="462.2" cy="152.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.3" cy="146.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="455.6" cy="149.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="444.8" cy="157.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="443.9" cy="154.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="433.6" cy="144.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="471.0" cy="150.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="481.7" cy="155.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="442.8" cy="144.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="432.4" cy="149.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="477.1" cy="172.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="497.6" cy="166.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="429.9" cy="160.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="438.6" cy="151.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="440.3" cy="165.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="424.8" cy="137.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="456.9" cy="159.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="452.3" cy="168.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="425.5" cy="165.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="423.2" cy="152.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.7" cy="157.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="460.7" cy="146.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="434.8" cy="156.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="446.1" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.2" cy="168.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="456.5" cy="152.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.3" cy="168.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="415.6" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="465.9" cy="186.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="468.9" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="483.2" cy="130.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="433.2" cy="154.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="427.3" cy="158.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="441.9" cy="161.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="437.9" cy="157.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="440.8" cy="145.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="433.4" cy="160.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="423.8" cy="163.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="438.7" cy="178.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="418.4" cy="145.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="448.6" cy="156.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="482.9" cy="161.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="439.6" cy="150.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="451.6" cy="163.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="429.3" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="429.4" cy="147.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.5" cy="170.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.6" cy="165.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="397.5" cy="117.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="463.9" cy="155.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="463.8" cy="159.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="428.5" cy="149.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="418.8" cy="157.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="449.5" cy="145.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="431.0" cy="146.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="434.8" cy="156.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="449.4" cy="158.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="453.1" cy="143.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="434.0" cy="164.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="418.6" cy="155.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="445.0" cy="162.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="442.2" cy="166.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="436.3" cy="143.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="456.1" cy="170.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="456.4" cy="135.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="424.7" cy="147.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.7" cy="147.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.6" cy="144.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="463.5" cy="149.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="463.2" cy="167.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="460.2" cy="142.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.4" cy="140.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="455.8" cy="145.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.9" cy="138.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="457.0" cy="142.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="449.0" cy="136.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="428.6" cy="156.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="458.3" cy="163.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="444.4" cy="157.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.4" cy="151.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="419.2" cy="161.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="414.7" cy="147.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="470.3" cy="166.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="422.8" cy="158.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.0" cy="163.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="443.9" cy="153.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="452.9" cy="158.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="452.4" cy="149.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="481.5" cy="152.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="458.4" cy="154.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.6" cy="162.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.0" cy="150.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="464.4" cy="129.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.4" cy="160.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.6" cy="132.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="482.0" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="438.3" cy="151.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="442.7" cy="152.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="446.5" cy="172.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="449.9" cy="151.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="441.9" cy="148.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="497.7" cy="155.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="444.0" cy="164.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="468.9" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="457.9" cy="179.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="419.3" cy="128.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="422.6" cy="141.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="458.4" cy="151.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="480.1" cy="169.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="462.8" cy="151.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="465.6" cy="147.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="492.5" cy="163.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="417.0" cy="178.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.1" cy="147.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="458.0" cy="132.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.1" cy="142.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="444.9" cy="141.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="449.2" cy="140.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="431.3" cy="172.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="462.7" cy="151.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="432.0" cy="143.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="436.0" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.3" cy="176.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="460.4" cy="144.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="410.5" cy="169.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="460.5" cy="158.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="432.6" cy="144.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="425.5" cy="153.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="440.0" cy="171.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.7" cy="139.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="429.6" cy="146.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="452.9" cy="132.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="418.4" cy="160.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="446.9" cy="171.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="441.8" cy="145.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="481.0" cy="145.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="429.8" cy="148.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="483.5" cy="157.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="409.0" cy="159.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="437.1" cy="158.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="454.7" cy="147.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="432.1" cy="171.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.7" cy="142.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="425.3" cy="160.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="418.0" cy="160.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="441.9" cy="179.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="405.0" cy="153.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="469.9" cy="155.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="438.3" cy="171.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="436.2" cy="144.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="427.9" cy="148.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="451.8" cy="137.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="463.5" cy="187.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="456.0" cy="142.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="432.0" cy="170.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.7" cy="162.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="436.0" cy="151.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="400.5" cy="130.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="477.9" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="423.6" cy="151.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="465.7" cy="134.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="430.8" cy="165.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="466.3" cy="143.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="452.2" cy="161.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="452.0" cy="167.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="443.1" cy="162.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="465.7" cy="147.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="420.7" cy="159.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="470.6" cy="150.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="450.5" cy="171.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="435.5" cy="159.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="429.9" cy="145.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="426.5" cy="175.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="431.4" cy="172.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="439.3" cy="180.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="441.3" cy="136.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="433.1" cy="165.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="444.7" cy="135.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="447.4" cy="138.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="423.1" cy="175.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="563.7" cy="136.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="600.6" cy="130.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="592.5" cy="110.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="568.6" cy="130.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="558.2" cy="135.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="577.3" cy="126.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="603.8" cy="138.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="585.1" cy="134.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="589.5" cy="117.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="585.5" cy="148.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="551.1" cy="116.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="593.8" cy="116.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.1" cy="164.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="600.5" cy="117.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="581.5" cy="117.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="667.5" cy="135.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="597.0" cy="127.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.6" cy="113.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="556.6" cy="148.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="585.8" cy="146.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="548.4" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="575.0" cy="110.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="561.9" cy="104.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="571.8" cy="141.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="581.2" cy="164.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="553.3" cy="126.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="605.9" cy="159.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="578.3" cy="122.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="572.4" cy="151.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="547.5" cy="135.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="583.2" cy="140.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="570.4" cy="109.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="584.1" cy="144.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="570.0" cy="146.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="582.1" cy="129.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="598.3" cy="135.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="598.5" cy="127.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="600.4" cy="135.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="587.8" cy="141.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.6" cy="109.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="568.5" cy="145.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="599.6" cy="151.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="574.1" cy="140.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="550.5" cy="148.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="595.2" cy="130.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="562.2" cy="148.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="605.5" cy="121.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="556.5" cy="104.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="571.7" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="523.6" cy="135.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="584.5" cy="123.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="519.9" cy="150.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="573.2" cy="125.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="546.3" cy="161.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="579.3" cy="139.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="639.0" cy="136.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="574.0" cy="143.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="595.2" cy="121.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="626.5" cy="138.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="612.9" cy="153.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="572.7" cy="168.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="586.7" cy="127.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="602.1" cy="146.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="560.0" cy="132.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="567.2" cy="122.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="544.9" cy="121.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="611.8" cy="108.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="565.9" cy="141.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="577.0" cy="154.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="561.5" cy="141.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="573.3" cy="150.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="611.9" cy="143.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="571.7" cy="123.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="576.9" cy="128.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="577.4" cy="140.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="571.5" cy="134.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="615.4" cy="147.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="576.2" cy="129.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="570.5" cy="116.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="590.5" cy="133.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="588.9" cy="126.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="563.7" cy="122.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="571.8" cy="134.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="597.9" cy="133.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="611.8" cy="137.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="576.1" cy="148.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="590.4" cy="139.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="621.4" cy="144.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="539.8" cy="156.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="593.4" cy="146.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="559.0" cy="123.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="587.3" cy="106.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="600.7" cy="138.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="548.2" cy="141.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="560.3" cy="135.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="638.4" cy="160.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.3" cy="150.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="562.8" cy="141.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="576.3" cy="125.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="551.4" cy="157.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="572.2" cy="144.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="553.4" cy="127.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="587.4" cy="142.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="594.1" cy="133.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="595.1" cy="108.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="574.0" cy="123.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="592.1" cy="142.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="589.2" cy="101.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="588.2" cy="153.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="592.9" cy="149.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="552.8" cy="125.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="578.4" cy="131.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="535.8" cy="153.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="592.7" cy="117.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="628.5" cy="125.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="597.6" cy="136.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="591.3" cy="128.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="565.9" cy="119.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.0" cy="136.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="584.1" cy="117.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="620.6" cy="149.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="546.1" cy="167.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="597.1" cy="141.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="620.5" cy="123.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="598.8" cy="114.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.0" cy="139.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="585.5" cy="139.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="579.5" cy="142.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="609.0" cy="124.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="592.1" cy="136.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="589.9" cy="130.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="579.2" cy="128.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="590.6" cy="120.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="534.4" cy="152.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="556.7" cy="117.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="620.2" cy="131.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="576.8" cy="124.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="569.3" cy="122.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="581.8" cy="122.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="591.3" cy="142.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="607.0" cy="102.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="570.1" cy="126.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="564.4" cy="125.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="596.9" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="581.2" cy="148.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="608.5" cy="137.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="548.7" cy="130.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="543.5" cy="115.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="551.3" cy="148.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="544.8" cy="138.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="590.8" cy="133.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="605.6" cy="152.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="654.3" cy="145.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="560.4" cy="138.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="576.0" cy="131.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="570.0" cy="145.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="578.9" cy="127.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="584.8" cy="124.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="572.7" cy="151.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="581.6" cy="168.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="574.0" cy="159.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="595.1" cy="143.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="594.7" cy="114.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="584.7" cy="125.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="630.5" cy="123.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="604.8" cy="147.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="564.0" cy="131.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="599.8" cy="134.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="554.7" cy="147.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="556.4" cy="134.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="543.8" cy="118.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="580.6" cy="135.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="566.2" cy="146.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="612.7" cy="147.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="561.6" cy="130.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="521.1" cy="56.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="540.4" cy="85.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="554.7" cy="63.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="525.1" cy="63.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="534.7" cy="73.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="514.7" cy="71.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="516.5" cy="76.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="482.6" cy="82.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="500.4" cy="52.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="525.4" cy="79.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.0" cy="55.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="497.0" cy="68.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="516.5" cy="72.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="527.7" cy="56.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="539.0" cy="56.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="542.7" cy="77.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="569.2" cy="68.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="493.5" cy="76.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="520.5" cy="54.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="535.2" cy="86.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="510.2" cy="66.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="529.9" cy="65.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="538.3" cy="83.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="509.7" cy="84.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="532.3" cy="80.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="506.5" cy="64.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="511.6" cy="76.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="518.6" cy="65.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="517.6" cy="92.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="494.2" cy="59.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="499.5" cy="71.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="538.2" cy="59.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="531.7" cy="61.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.3" cy="67.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="536.5" cy="81.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="487.2" cy="80.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="539.1" cy="83.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="540.6" cy="41.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="502.7" cy="90.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="494.2" cy="74.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="522.6" cy="76.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="516.1" cy="68.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="474.8" cy="84.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="504.8" cy="63.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="505.5" cy="75.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="535.9" cy="64.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="553.4" cy="79.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="538.3" cy="100.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="492.7" cy="61.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="480.7" cy="87.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="488.9" cy="96.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="546.8" cy="41.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="541.4" cy="56.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="503.6" cy="93.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="475.5" cy="72.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="540.9" cy="62.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="537.4" cy="78.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.9" cy="87.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="509.5" cy="57.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="503.3" cy="72.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="509.7" cy="62.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="550.1" cy="81.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.2" cy="82.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="505.0" cy="67.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="498.6" cy="66.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="478.9" cy="63.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="526.1" cy="84.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="495.8" cy="63.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="514.9" cy="53.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="506.8" cy="53.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="537.6" cy="40.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="510.5" cy="55.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="524.9" cy="73.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="491.7" cy="83.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="523.2" cy="64.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.7" cy="71.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.0" cy="73.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="502.1" cy="58.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="555.5" cy="55.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="524.3" cy="64.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="493.0" cy="55.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="506.9" cy="88.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.0" cy="54.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.6" cy="76.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="500.7" cy="73.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="509.1" cy="74.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="517.8" cy="83.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="533.0" cy="68.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="499.3" cy="49.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="519.1" cy="71.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="524.9" cy="84.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="527.4" cy="71.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="518.4" cy="83.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="498.1" cy="63.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="488.2" cy="49.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="552.7" cy="63.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="496.8" cy="69.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="529.3" cy="72.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="499.4" cy="74.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="552.7" cy="83.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="493.1" cy="69.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="547.0" cy="84.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="521.6" cy="70.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="502.3" cy="65.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="503.8" cy="87.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="522.0" cy="75.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="540.1" cy="76.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="485.9" cy="64.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="538.3" cy="54.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="539.1" cy="61.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="511.7" cy="77.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="524.5" cy="77.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="511.3" cy="62.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="495.7" cy="64.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="554.9" cy="69.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="516.2" cy="52.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="517.9" cy="73.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="553.5" cy="81.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="538.6" cy="74.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="513.3" cy="88.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="521.9" cy="72.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="532.7" cy="68.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="516.1" cy="72.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="501.8" cy="84.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.3" cy="66.5" r="2.2" opacity="0.5"/>
<circle class="sP" cx="510.0" cy="64.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="530.1" cy="67.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="481.6" cy="49.8" r="2.2" opacity="0.5"/>
<circle class="sP" cx="550.7" cy="58.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="528.8" cy="35.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.7" cy="71.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="496.0" cy="88.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="542.3" cy="62.6" r="2.2" opacity="0.5"/>
<circle class="sP" cx="536.4" cy="67.7" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.0" cy="93.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="507.3" cy="74.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="485.2" cy="64.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="535.4" cy="58.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="523.0" cy="89.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.3" cy="78.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="533.3" cy="84.4" r="2.2" opacity="0.5"/>
<circle class="sP" cx="506.1" cy="63.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.0" cy="94.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="485.8" cy="69.1" r="2.2" opacity="0.5"/>
<circle class="sP" cx="510.3" cy="63.3" r="2.2" opacity="0.5"/>
<circle class="sP" cx="520.4" cy="59.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="498.2" cy="75.2" r="2.2" opacity="0.5"/>
<circle class="sP" cx="502.1" cy="67.0" r="2.2" opacity="0.5"/>
<circle class="sP" cx="505.7" cy="86.9" r="2.2" opacity="0.5"/>
<circle class="sP" cx="515.7" cy="69.1" r="2.2" opacity="0.5"/>
<circle class="sPr" cx="612.5" cy="61.2" r="3.6" opacity="1"/>
<circle class="sPr" cx="607.4" cy="62.8" r="3.6" opacity="1"/>
<circle class="sPr" cx="603.0" cy="69.3" r="3.6" opacity="1"/>
<circle class="sPr" cx="605.5" cy="66.8" r="3.6" opacity="1"/>
<circle class="sPr" cx="619.6" cy="59.0" r="3.6" opacity="1"/>
<circle class="sPr" cx="612.5" cy="65.2" r="3.6" opacity="1"/>
<circle class="sPr" cx="617.0" cy="68.7" r="3.6" opacity="1"/>
<circle class="sPr" cx="600.6" cy="65.9" r="3.6" opacity="1"/>
<circle class="sPr" cx="601.9" cy="63.2" r="3.6" opacity="1"/>
<circle class="sPr" cx="607.6" cy="57.9" r="3.6" opacity="1"/>
<circle class="sPr" cx="611.7" cy="60.0" r="3.6" opacity="1"/>
<circle class="sPr" cx="608.8" cy="64.0" r="3.6" opacity="1"/>
<circle class="sL" cx="606.7" cy="63.6" r="13" style="fill:none;stroke-dasharray:3 2"/>
<text class="sGt" x="530" y="218" text-anchor="middle">12 distinct points get their own cluster</text>
<text class="sS" x="360" y="238" text-anchor="middle">k-means favours similar-sized clusters: here the 12 points only get their own cluster at k = 10</text>
</svg><figcaption>The ladybug effect from Géron's image-segmentation example, on 2-D points: computed with scikit-learn. In the right panel only the small group's cluster is coloured.</figcaption></figure>

**6. Semi-supervised learning** (label propagation). Géron's digits experiment is worth knowing by its numbers:

| Strategy (only 50 labels) | Test accuracy |
|---|---|
| Logistic regression on 50 **random** labelled images | 75.8% |
| Cluster into 50, label the **50 images closest to the centroids** | **83.4%** |
| **Propagate** each representative's label to its whole cluster | 87.2% |
| Propagate only to the **50% of points closest to each centroid** (drop outliers) | **88.4%** (propagated labels 98.9% correct) |
| Reference: all 1,400 true labels | 90.9% |

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Test accuracy on digits with only 50 labels: 75.8 percent with random labels, 83.4 with representative labels, 87.2 after propagating to whole clusters and 88.4 after propagating to the closest half, against 90.9 with all labels">
<text class="sC" x="210" y="47" text-anchor="end">50 random labels</text><rect class="sN" x="220" y="30" width="106.72" height="24" rx="4" opacity=".8"/><text class="sT" x="332.72" y="47">75.8%</text>
<text class="sC" x="210" y="81" text-anchor="end">50 representative labels</text><rect class="sB" x="220" y="64" width="246.56" height="24" rx="4" opacity=".8"/><text class="sT" x="472.56" y="81">83.4%</text>
<text class="sC" x="210" y="115" text-anchor="end">propagate to whole cluster</text><rect class="sB" x="220" y="98" width="316.48" height="24" rx="4" opacity=".8"/><text class="sT" x="542.48" y="115">87.2%</text>
<text class="sC" x="210" y="149" text-anchor="end">propagate to closest 50%</text><rect class="sG" x="220" y="132" width="338.56" height="24" rx="4" opacity=".8"/><text class="sT" x="564.56" y="149">88.4%</text>
<text class="sC" x="210" y="183" text-anchor="end">all 1,400 labels</text><rect class="sA" x="220" y="166" width="384.56" height="24" rx="4" opacity=".8"/><text class="sT" x="610.56" y="183">90.9%</text>
<text class="sGt" x="450" y="210" text-anchor="middle">same 50 human labels, chosen and spread more cleverly: from 75.8% to 88.4%</text>
</svg><figcaption>Géron's semi-supervised results from the table, as bars: which 50 images get labelled matters as much as how many.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="A Gaussian mixture fitted to 200 one-dimensional points from two overlapping groups: the mixture density follows the histogram, and the responsibility curves show each point's probability of belonging to each component, shared near the overlap">
<line class="sLm" x1="60" y1="120" x2="660" y2="120"/><line class="sLm" x1="60" y1="220" x2="660" y2="220"/>
<text class="sM" x="14" y="30">density</text><text class="sM" x="14" y="136">responsibility</text>
<rect class="sN" x="60" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<rect class="sN" x="81.4286" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<rect class="sN" x="102.857" y="117.613" width="20.4286" height="2.3871" rx="0" opacity=".6"/>
<rect class="sN" x="124.286" y="108.065" width="20.4286" height="11.9355" rx="0" opacity=".6"/>
<rect class="sN" x="145.714" y="96.129" width="20.4286" height="23.871" rx="0" opacity=".6"/>
<rect class="sN" x="167.143" y="86.5806" width="20.4286" height="33.4194" rx="0" opacity=".6"/>
<rect class="sN" x="188.571" y="55.5484" width="20.4286" height="64.4516" rx="0" opacity=".6"/>
<rect class="sN" x="210" y="46" width="20.4286" height="74" rx="0" opacity=".6"/>
<rect class="sN" x="231.429" y="77.0323" width="20.4286" height="42.9677" rx="0" opacity=".6"/>
<rect class="sN" x="252.857" y="93.7419" width="20.4286" height="26.2581" rx="0" opacity=".6"/>
<rect class="sN" x="274.286" y="105.677" width="20.4286" height="14.3226" rx="0" opacity=".6"/>
<rect class="sN" x="295.714" y="103.29" width="20.4286" height="16.7097" rx="0" opacity=".6"/>
<rect class="sN" x="317.143" y="110.452" width="20.4286" height="9.54839" rx="0" opacity=".6"/>
<rect class="sN" x="338.571" y="100.903" width="20.4286" height="19.0968" rx="0" opacity=".6"/>
<rect class="sN" x="360" y="96.129" width="20.4286" height="23.871" rx="0" opacity=".6"/>
<rect class="sN" x="381.429" y="91.3548" width="20.4286" height="28.6452" rx="0" opacity=".6"/>
<rect class="sN" x="402.857" y="98.5161" width="20.4286" height="21.4839" rx="0" opacity=".6"/>
<rect class="sN" x="424.286" y="108.065" width="20.4286" height="11.9355" rx="0" opacity=".6"/>
<rect class="sN" x="445.714" y="103.29" width="20.4286" height="16.7097" rx="0" opacity=".6"/>
<rect class="sN" x="467.143" y="105.677" width="20.4286" height="14.3226" rx="0" opacity=".6"/>
<rect class="sN" x="488.571" y="108.065" width="20.4286" height="11.9355" rx="0" opacity=".6"/>
<rect class="sN" x="510" y="112.839" width="20.4286" height="7.16129" rx="0" opacity=".6"/>
<rect class="sN" x="531.429" y="117.613" width="20.4286" height="2.3871" rx="0" opacity=".6"/>
<rect class="sN" x="552.857" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<rect class="sN" x="574.286" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<rect class="sN" x="595.714" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<rect class="sN" x="617.143" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<rect class="sN" x="638.571" y="120" width="20.4286" height="0" rx="0" opacity=".6"/>
<polyline class="sLv" points="60.0,120.0 63.0,119.9 66.0,119.9 69.0,119.9 72.1,119.9 75.1,119.8 78.1,119.8 81.1,119.7 84.1,119.6 87.1,119.5 90.2,119.4 93.2,119.2 96.2,119.0 99.2,118.8 102.2,118.5 105.2,118.2 108.2,117.7 111.3,117.2 114.3,116.6 117.3,115.9 120.3,115.1 123.3,114.2 126.3,113.1 129.3,111.8 132.4,110.4 135.4,108.8 138.4,107.0 141.4,105.0 144.4,102.8 147.4,100.4 150.5,97.7 153.5,94.9 156.5,91.9 159.5,88.7 162.5,85.4 165.5,81.9 168.5,78.3 171.6,74.6 174.6,70.9 177.6,67.2 180.6,63.6 183.6,60.1 186.6,56.7 189.6,53.5 192.7,50.5 195.7,47.9 198.7,45.5 201.7,43.6 204.7,42.0 207.7,40.9 210.8,40.2 213.8,40.0 216.8,40.2 219.8,40.9 222.8,42.1 225.8,43.6 228.8,45.5 231.9,47.8 234.9,50.5 237.9,53.3 240.9,56.4 243.9,59.7 246.9,63.1 249.9,66.6 253.0,70.1 256.0,73.6 259.0,77.0 262.0,80.3 265.0,83.5 268.0,86.5 271.1,89.3 274.1,91.9 277.1,94.3 280.1,96.5 283.1,98.4 286.1,100.1 289.1,101.6 292.2,102.8 295.2,103.8 298.2,104.6 301.2,105.2 304.2,105.6 307.2,105.9 310.3,106.0 313.3,105.9 316.3,105.7 319.3,105.4 322.3,105.0 325.3,104.5 328.3,104.0 331.4,103.4 334.4,102.7 337.4,102.0 340.4,101.2 343.4,100.4 346.4,99.6 349.4,98.8 352.5,98.0 355.5,97.2 358.5,96.4 361.5,95.6 364.5,94.9 367.5,94.1 370.6,93.5 373.6,92.8 376.6,92.2 379.6,91.7 382.6,91.2 385.6,90.7 388.6,90.3 391.7,90.0 394.7,89.8 397.7,89.6 400.7,89.5 403.7,89.4 406.7,89.4 409.7,89.5 412.8,89.7 415.8,89.9 418.8,90.2 421.8,90.5 424.8,90.9 427.8,91.4 430.9,91.9 433.9,92.5 436.9,93.1 439.9,93.8 442.9,94.5 445.9,95.3 448.9,96.0 452.0,96.8 455.0,97.7 458.0,98.5 461.0,99.4 464.0,100.3 467.0,101.2 470.1,102.0 473.1,102.9 476.1,103.8 479.1,104.6 482.1,105.5 485.1,106.3 488.1,107.1 491.2,107.9 494.2,108.7 497.2,109.5 500.2,110.2 503.2,110.9 506.2,111.5 509.2,112.2 512.3,112.8 515.3,113.3 518.3,113.9 521.3,114.4 524.3,114.8 527.3,115.3 530.4,115.7 533.4,116.1 536.4,116.5 539.4,116.8 542.4,117.1 545.4,117.4 548.4,117.7 551.5,117.9 554.5,118.1 557.5,118.3 560.5,118.5 563.5,118.7 566.5,118.8 569.5,119.0 572.6,119.1 575.6,119.2 578.6,119.3 581.6,119.4 584.6,119.5 587.6,119.5 590.7,119.6 593.7,119.6 596.7,119.7 599.7,119.7 602.7,119.8 605.7,119.8 608.7,119.8 611.8,119.9 614.8,119.9 617.8,119.9 620.8,119.9 623.8,119.9 626.8,119.9 629.8,119.9 632.9,120.0 635.9,120.0 638.9,120.0 641.9,120.0 644.9,120.0 647.9,120.0 651.0,120.0 654.0,120.0 657.0,120.0 660.0,120.0" style="stroke-width:2.2"/>
<polyline class="sLg" points="60.0,140.0 63.0,140.0 66.0,140.0 69.0,140.0 72.1,140.0 75.1,140.0 78.1,140.0 81.1,140.0 84.1,140.0 87.1,140.0 90.2,140.0 93.2,140.0 96.2,140.0 99.2,140.0 102.2,140.0 105.2,140.0 108.2,140.0 111.3,140.0 114.3,140.0 117.3,140.0 120.3,140.0 123.3,140.0 126.3,140.0 129.3,140.0 132.4,140.0 135.4,140.0 138.4,140.0 141.4,140.0 144.4,140.0 147.4,140.0 150.5,140.0 153.5,140.0 156.5,140.0 159.5,140.0 162.5,140.0 165.5,140.1 168.5,140.1 171.6,140.1 174.6,140.1 177.6,140.1 180.6,140.1 183.6,140.1 186.6,140.1 189.6,140.1 192.7,140.1 195.7,140.2 198.7,140.2 201.7,140.2 204.7,140.2 207.7,140.3 210.8,140.3 213.8,140.3 216.8,140.4 219.8,140.4 222.8,140.5 225.8,140.6 228.8,140.7 231.9,140.8 234.9,141.0 237.9,141.2 240.9,141.4 243.9,141.7 246.9,142.0 249.9,142.4 253.0,142.8 256.0,143.4 259.0,144.1 262.0,145.0 265.0,146.0 268.0,147.2 271.1,148.7 274.1,150.5 277.1,152.7 280.1,155.2 283.1,158.2 286.1,161.6 289.1,165.4 292.2,169.7 295.2,174.3 298.2,179.1 301.2,184.0 304.2,188.8 307.2,193.5 310.3,197.8 313.3,201.7 316.3,205.2 319.3,208.2 322.3,210.6 325.3,212.7 328.3,214.3 331.4,215.7 334.4,216.7 337.4,217.5 340.4,218.1 343.4,218.6 346.4,219.0 349.4,219.2 352.5,219.4 355.5,219.6 358.5,219.7 361.5,219.8 364.5,219.8 367.5,219.9 370.6,219.9 373.6,219.9 376.6,220.0 379.6,220.0 382.6,220.0 385.6,220.0 388.6,220.0 391.7,220.0 394.7,220.0 397.7,220.0 400.7,220.0 403.7,220.0 406.7,220.0 409.7,220.0 412.8,220.0 415.8,220.0 418.8,220.0 421.8,220.0 424.8,220.0 427.8,220.0 430.9,220.0 433.9,220.0 436.9,220.0 439.9,220.0 442.9,220.0 445.9,220.0 448.9,220.0 452.0,220.0 455.0,220.0 458.0,220.0 461.0,220.0 464.0,220.0 467.0,220.0 470.1,220.0 473.1,220.0 476.1,220.0 479.1,220.0 482.1,220.0 485.1,220.0 488.1,220.0 491.2,220.0 494.2,220.0 497.2,220.0 500.2,220.0 503.2,220.0 506.2,220.0 509.2,220.0 512.3,220.0 515.3,220.0 518.3,220.0 521.3,220.0 524.3,220.0 527.3,220.0 530.4,220.0 533.4,220.0 536.4,220.0 539.4,220.0 542.4,220.0 545.4,220.0 548.4,220.0 551.5,220.0 554.5,220.0 557.5,220.0 560.5,220.0 563.5,220.0 566.5,220.0 569.5,220.0 572.6,220.0 575.6,220.0 578.6,220.0 581.6,220.0 584.6,220.0 587.6,220.0 590.7,220.0 593.7,220.0 596.7,220.0 599.7,220.0 602.7,220.0 605.7,220.0 608.7,220.0 611.8,220.0 614.8,220.0 617.8,220.0 620.8,220.0 623.8,220.0 626.8,220.0 629.8,220.0 632.9,220.0 635.9,220.0 638.9,220.0 641.9,220.0 644.9,220.0 647.9,220.0 651.0,220.0 654.0,220.0 657.0,220.0 660.0,220.0" style="stroke-width:2.4"/>
<polyline class="sLw" points="60.0,220.0 63.0,220.0 66.0,220.0 69.0,220.0 72.1,220.0 75.1,220.0 78.1,220.0 81.1,220.0 84.1,220.0 87.1,220.0 90.2,220.0 93.2,220.0 96.2,220.0 99.2,220.0 102.2,220.0 105.2,220.0 108.2,220.0 111.3,220.0 114.3,220.0 117.3,220.0 120.3,220.0 123.3,220.0 126.3,220.0 129.3,220.0 132.4,220.0 135.4,220.0 138.4,220.0 141.4,220.0 144.4,220.0 147.4,220.0 150.5,220.0 153.5,220.0 156.5,220.0 159.5,220.0 162.5,220.0 165.5,219.9 168.5,219.9 171.6,219.9 174.6,219.9 177.6,219.9 180.6,219.9 183.6,219.9 186.6,219.9 189.6,219.9 192.7,219.9 195.7,219.8 198.7,219.8 201.7,219.8 204.7,219.8 207.7,219.7 210.8,219.7 213.8,219.7 216.8,219.6 219.8,219.6 222.8,219.5 225.8,219.4 228.8,219.3 231.9,219.2 234.9,219.0 237.9,218.8 240.9,218.6 243.9,218.3 246.9,218.0 249.9,217.6 253.0,217.2 256.0,216.6 259.0,215.9 262.0,215.0 265.0,214.0 268.0,212.8 271.1,211.3 274.1,209.5 277.1,207.3 280.1,204.8 283.1,201.8 286.1,198.4 289.1,194.6 292.2,190.3 295.2,185.7 298.2,180.9 301.2,176.0 304.2,171.2 307.2,166.5 310.3,162.2 313.3,158.3 316.3,154.8 319.3,151.8 322.3,149.4 325.3,147.3 328.3,145.7 331.4,144.3 334.4,143.3 337.4,142.5 340.4,141.9 343.4,141.4 346.4,141.0 349.4,140.8 352.5,140.6 355.5,140.4 358.5,140.3 361.5,140.2 364.5,140.2 367.5,140.1 370.6,140.1 373.6,140.1 376.6,140.0 379.6,140.0 382.6,140.0 385.6,140.0 388.6,140.0 391.7,140.0 394.7,140.0 397.7,140.0 400.7,140.0 403.7,140.0 406.7,140.0 409.7,140.0 412.8,140.0 415.8,140.0 418.8,140.0 421.8,140.0 424.8,140.0 427.8,140.0 430.9,140.0 433.9,140.0 436.9,140.0 439.9,140.0 442.9,140.0 445.9,140.0 448.9,140.0 452.0,140.0 455.0,140.0 458.0,140.0 461.0,140.0 464.0,140.0 467.0,140.0 470.1,140.0 473.1,140.0 476.1,140.0 479.1,140.0 482.1,140.0 485.1,140.0 488.1,140.0 491.2,140.0 494.2,140.0 497.2,140.0 500.2,140.0 503.2,140.0 506.2,140.0 509.2,140.0 512.3,140.0 515.3,140.0 518.3,140.0 521.3,140.0 524.3,140.0 527.3,140.0 530.4,140.0 533.4,140.0 536.4,140.0 539.4,140.0 542.4,140.0 545.4,140.0 548.4,140.0 551.5,140.0 554.5,140.0 557.5,140.0 560.5,140.0 563.5,140.0 566.5,140.0 569.5,140.0 572.6,140.0 575.6,140.0 578.6,140.0 581.6,140.0 584.6,140.0 587.6,140.0 590.7,140.0 593.7,140.0 596.7,140.0 599.7,140.0 602.7,140.0 605.7,140.0 608.7,140.0 611.8,140.0 614.8,140.0 617.8,140.0 620.8,140.0 623.8,140.0 626.8,140.0 629.8,140.0 632.9,140.0 635.9,140.0 638.9,140.0 641.9,140.0 644.9,140.0 647.9,140.0 651.0,140.0 654.0,140.0 657.0,140.0 660.0,140.0" style="stroke-width:2.4"/>
<line class="sD" x1="306.316" y1="136" x2="306.316" y2="220"/><circle class="sPg" cx="306.3" cy="192.1" r="5"/><circle class="sPw" cx="306.3" cy="167.9" r="5"/>
<text class="sC" x="298.316" y="172" text-anchor="end">x = 3.4: 35% A, 65% B</text>
<text class="sGt" x="680" y="60" text-anchor="end">A: φ 0.62, μ 1.9</text><text class="sWt" x="680" y="78" text-anchor="end">B: φ 0.38, μ 5.0</text>
<text class="sS" x="360" y="240" text-anchor="middle">k-means would give x = 3.4 a single hard label; a GMM keeps the uncertainty, and the fitted weights recover the 60 / 40 mix</text>
</svg><figcaption>Soft clustering with a GMM, computed with scikit-learn: responsibilities are the E-step's output.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 256" role="img" aria-label="Random axis-aligned splits isolating one point: an outlier far from the cloud is isolated after a few splits, a point in the middle of the cloud needs many; averaged over 300 random trees the outlier's path is much shorter">
<rect class="sN" x="20" y="34" width="320" height="170" rx="0" style="fill:none"/><text class="sRt" x="180" y="24" text-anchor="middle">isolating the outlier</text>
<line class="sLv" x1="31.6948" y1="56.4375" x2="328.305" y2="56.4375" opacity=".7"/>
<line class="sLv" x1="31.6948" y1="41.2481" x2="328.305" y2="41.2481" opacity=".7"/>
<circle class="sP" cx="152.2" cy="137.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="117.0" cy="197.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="246.4" cy="85.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="122.2" cy="97.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="157.6" cy="138.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="198.4" cy="131.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="122.0" cy="146.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="167.8" cy="124.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="173.1" cy="140.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="148.6" cy="149.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="190.4" cy="115.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="160.5" cy="108.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="82.1" cy="97.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="261.5" cy="172.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="40.1" cy="168.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="190.4" cy="117.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="204.2" cy="98.9" r="2.6" opacity="0.5"/>
<circle class="sP" cx="153.5" cy="112.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="131.3" cy="94.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="75.1" cy="134.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="155.4" cy="65.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="96.5" cy="155.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="108.3" cy="91.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="127.4" cy="80.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="31.7" cy="86.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="201.7" cy="165.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="150.2" cy="83.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="146.3" cy="90.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="280.1" cy="112.9" r="2.6" opacity="0.5"/>
<circle class="sP" cx="124.8" cy="145.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="179.1" cy="127.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="130.7" cy="124.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="179.2" cy="154.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="51.7" cy="197.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="211.3" cy="119.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="229.5" cy="121.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="97.8" cy="106.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="136.7" cy="160.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="89.4" cy="66.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="161.9" cy="108.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="125.0" cy="143.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="193.3" cy="124.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="96.8" cy="125.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="88.2" cy="115.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="207.2" cy="147.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="224.7" cy="142.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="150.2" cy="147.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="128.2" cy="120.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="115.8" cy="143.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="101.6" cy="147.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="49.4" cy="129.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="164.6" cy="93.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="179.0" cy="44.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="159.8" cy="135.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="250.6" cy="154.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="197.8" cy="151.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="161.9" cy="183.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="193.8" cy="126.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="84.6" cy="69.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="185.9" cy="120.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="97.6" cy="122.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="131.6" cy="98.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="187.9" cy="142.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="109.1" cy="138.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="62.3" cy="140.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="135.8" cy="99.9" r="2.6" opacity="0.5"/>
<circle class="sP" cx="218.4" cy="146.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="173.4" cy="135.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="262.5" cy="123.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="170.6" cy="150.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="93.8" cy="115.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="118.7" cy="110.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="49.9" cy="100.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="88.6" cy="67.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="124.3" cy="87.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="59.6" cy="108.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="89.3" cy="136.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="142.6" cy="131.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="156.6" cy="98.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="179.4" cy="124.2" r="2.6" opacity="0.5"/>
<circle class="sPr" cx="328.3" cy="40.2" r="5" opacity="1"/>
<text class="sGt" x="180" y="224" text-anchor="middle">this tree: 2 splits · average over 300 trees: 3.1</text>
<rect class="sN" x="370" y="34" width="320" height="170" rx="0" style="fill:none"/><text class="sC" x="530" y="24" text-anchor="middle">isolating a central point</text>
<line class="sLv" x1="381.695" y1="56.4375" x2="678.305" y2="56.4375" opacity=".7"/>
<line class="sLv" x1="381.695" y1="94.9311" x2="678.305" y2="94.9311" opacity=".7"/>
<line class="sLv" x1="381.695" y1="167.512" x2="678.305" y2="167.512" opacity=".7"/>
<line class="sLv" x1="600.889" y1="167.512" x2="600.889" y2="94.9311" opacity=".7"/>
<line class="sLv" x1="381.695" y1="109.306" x2="600.889" y2="109.306" opacity=".7"/>
<line class="sLv" x1="559.791" y1="167.512" x2="559.791" y2="109.306" opacity=".7"/>
<line class="sLv" x1="447.21" y1="167.512" x2="447.21" y2="109.306" opacity=".7"/>
<line class="sLv" x1="478.121" y1="167.512" x2="478.121" y2="109.306" opacity=".7"/>
<line class="sLv" x1="478.121" y1="142.122" x2="559.791" y2="142.122" opacity=".7"/>
<line class="sLv" x1="513.592" y1="142.122" x2="513.592" y2="109.306" opacity=".7"/>
<line class="sLv" x1="478.121" y1="112.72" x2="513.592" y2="112.72" opacity=".7"/>
<line class="sLv" x1="478.121" y1="123.89" x2="513.592" y2="123.89" opacity=".7"/>
<line class="sLv" x1="478.121" y1="124.92" x2="513.592" y2="124.92" opacity=".7"/>
<circle class="sP" cx="502.2" cy="137.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="467.0" cy="197.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="596.4" cy="85.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="472.2" cy="97.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="507.6" cy="138.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="548.4" cy="131.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="472.0" cy="146.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="517.8" cy="124.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="523.1" cy="140.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="498.6" cy="149.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="540.4" cy="115.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="510.5" cy="108.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="432.1" cy="97.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="611.5" cy="172.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="390.1" cy="168.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="540.4" cy="117.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="554.2" cy="98.9" r="2.6" opacity="0.5"/>
<circle class="sP" cx="503.5" cy="112.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="481.3" cy="94.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="425.1" cy="134.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="505.4" cy="65.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="446.5" cy="155.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="458.3" cy="91.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="477.4" cy="80.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="381.7" cy="86.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="551.7" cy="165.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="500.2" cy="83.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="496.3" cy="90.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="630.1" cy="112.9" r="2.6" opacity="0.5"/>
<circle class="sP" cx="474.8" cy="145.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="529.1" cy="127.6" r="2.6" opacity="0.5"/>
<circle class="sPr" cx="480.7" cy="124.8" r="5" opacity="1"/>
<circle class="sP" cx="529.2" cy="154.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="401.7" cy="197.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="561.3" cy="119.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="579.5" cy="121.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="447.8" cy="106.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="486.7" cy="160.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="439.4" cy="66.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="511.9" cy="108.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="475.0" cy="143.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="543.3" cy="124.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="446.8" cy="125.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="438.2" cy="115.5" r="2.6" opacity="0.5"/>
<circle class="sP" cx="557.2" cy="147.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="574.7" cy="142.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="500.2" cy="147.6" r="2.6" opacity="0.5"/>
<circle class="sP" cx="478.2" cy="120.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="465.8" cy="143.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="451.6" cy="147.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="399.4" cy="129.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="514.6" cy="93.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="529.0" cy="44.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="509.8" cy="135.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="600.6" cy="154.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="547.8" cy="151.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="511.9" cy="183.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="543.8" cy="126.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="434.6" cy="69.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="535.9" cy="120.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="447.6" cy="122.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="481.6" cy="98.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="537.9" cy="142.3" r="2.6" opacity="0.5"/>
<circle class="sP" cx="459.1" cy="138.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="412.3" cy="140.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="485.8" cy="99.9" r="2.6" opacity="0.5"/>
<circle class="sP" cx="568.4" cy="146.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="523.4" cy="135.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="612.5" cy="123.0" r="2.6" opacity="0.5"/>
<circle class="sP" cx="520.6" cy="150.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="443.8" cy="115.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="468.7" cy="110.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="399.9" cy="100.8" r="2.6" opacity="0.5"/>
<circle class="sP" cx="438.6" cy="67.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="474.3" cy="87.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="409.6" cy="108.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="439.3" cy="136.7" r="2.6" opacity="0.5"/>
<circle class="sP" cx="492.6" cy="131.4" r="2.6" opacity="0.5"/>
<circle class="sP" cx="506.6" cy="98.1" r="2.6" opacity="0.5"/>
<circle class="sP" cx="529.4" cy="124.2" r="2.6" opacity="0.5"/>
<circle class="sP" cx="678.3" cy="40.2" r="2.6" opacity="0.5"/>
<text class="sC" x="530" y="224" text-anchor="middle">this tree: 13 splits · average over 300 trees: 10.4</text>
<text class="sS" x="360" y="244" text-anchor="middle">short average path = easy to isolate = anomalous; that path length is what score_samples turns into a score</text>
</svg><figcaption>The Isolation Forest idea, computed: anomalies are the points that random cuts separate quickly.</figcaption></figure>

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
