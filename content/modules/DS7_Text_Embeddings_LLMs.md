# Segmentation, Anomalies, Text, Embeddings and LLMs — The Data Scientist's Unstructured Toolkit

Not every data-science problem has a label column. Marketing wants customer segments; risk wants unusual transactions flagged; operations wants thousands of Arabic complaints sorted by topic; product wants a search that understands meaning. This module covers the unsupervised and text side of the job from a data scientist's point of view: clustering that the business can use, anomaly detection with alert budgets, text classification from TF-IDF to transformers, embeddings, and using LLMs responsibly inside data-science workflows. *AI Journey* Parts 9, 10, 20 and 21 go deeper on the algorithms; your Emotidect and FinSight work are the stories.

> [!focus]
> **Entry must:** run k-means with scaling and choose k sensibly; profile clusters into named segments; build a TF-IDF + logistic regression text classifier; explain embeddings and cosine similarity.
> **Mid adds:** density-based clustering and its parameters, anomaly detection with an alert budget, Arabic text specifics, fine-tuning a transformer classifier, embedding-based search and clustering, LLM zero-shot classification and extraction with evaluation, and choosing between prompting, fine-tuning and classic models.
> **Most asked:** *How would you segment our customers?* · *How do you choose k?* · *How would you detect fraud without labels?* · *How would you classify customer complaints?* · *What are embeddings?* · *When would you use an LLM instead of a trained classifier?*
> **Time budget:** 3.5 hours.

## DS7.0 Foundations: everything becomes a point in space 🟢

Clustering, anomaly detection and embeddings share one idea: represent each customer, transaction or sentence as a **vector** (a list of numbers), so it becomes a **point** in a space where **distance means difference**.

- Similar customers sit close together, so natural groups appear as **clusters**.
- An unusual transaction sits far from everything else: an **anomaly**.
- A sentence **embedding** places texts with similar meaning near each other, whatever the wording or language.

The catch is that distance depends on units. Spend in pounds (thousands) swamps order counts (single digits) unless features are **scaled** first.

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="Three customers plotted in raw units, where spend in pounds dominates distance so A looks closest to B, and after scaling, where A is clearly closest to C">
<text class="sRt" x="180" y="20" text-anchor="middle">raw units: pounds swamp orders</text><text class="sGt" x="540" y="20" text-anchor="middle">scaled: both features count</text>
<rect class="sN" x="30" y="34" width="300" height="150" rx="6"/><rect class="sN" x="390" y="34" width="300" height="150" rx="6"/>
<circle class="sP" cx="74" cy="170" r="7"/><text class="sT" x="74" y="157.52" text-anchor="middle">A</text>
<circle class="sP" cx="98" cy="166" r="7"/><text class="sT" x="98" y="153.68" text-anchor="middle">B</text>
<circle class="sP" cx="290" cy="169" r="7"/><text class="sT" x="290" y="157.28" text-anchor="middle">C</text>
<text class="sC" x="180" y="100" text-anchor="middle">orders barely move the points</text>
<circle class="sPg" cx="416" cy="156" r="7"/><text class="sT" x="428" y="160.4">A</text>
<circle class="sPg" cx="422" cy="48" r="7"/><text class="sT" x="434" y="51.6">B</text>
<circle class="sPg" cx="470" cy="150" r="7"/><text class="sT" x="482" y="153.6">C</text>
<line class="sLg" x1="416" y1="156.4" x2="470" y2="149.6" stroke-dasharray="4 3"/><line class="sLm" x1="416" y1="156.4" x2="422" y2="47.6" stroke-dasharray="4 3"/>
<text class="sRt" x="180" y="206" text-anchor="middle">A–B 100 · A–C 900 → A "resembles" B</text><text class="sGt" x="540" y="206" text-anchor="middle">A–B 3.2 · A–C 0.5 → A resembles C</text>
<text class="sC" x="360" y="230" text-anchor="middle">A: EGP 5,000, 2 orders · B: EGP 5,100, 18 orders · C: EGP 5,900, 3 orders</text>
</svg><figcaption>Distance-based methods see whatever units you hand them. Standardise first, or the biggest-numbered column decides everything.</figcaption></figure>

## DS7.1 Segmentation with clustering 🟢 ⭐

**Rules first:** RFM segments ([[DA1.7]]) are simple, explainable and often enough. Use clustering when you want data-driven groups across many behavioural features.

**k-means**, the default:

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 262" role="img" aria-label="k-means iterations on thirty points: random centroids, assignment to the nearest centroid, centroids moving to the mean of their points, and convergence into three clusters">
<rect class="sN" x="14" y="14" width="692" height="220" rx="8"/>
<g data-s="1-1"><circle class="sP" cx="175" cy="119" r="5" opacity=".45"/><circle class="sP" cx="126" cy="71" r="5" opacity=".45"/><circle class="sP" cx="162" cy="128" r="5" opacity=".45"/><circle class="sP" cx="164" cy="65" r="5" opacity=".45"/><circle class="sP" cx="127" cy="89" r="5" opacity=".45"/><circle class="sP" cx="181" cy="90" r="5" opacity=".45"/><circle class="sP" cx="140" cy="86" r="5" opacity=".45"/><circle class="sP" cx="156" cy="75" r="5" opacity=".45"/><circle class="sP" cx="151" cy="96" r="5" opacity=".45"/><circle class="sP" cx="202" cy="89" r="5" opacity=".45"/><circle class="sP" cx="361" cy="148" r="5" opacity=".45"/><circle class="sP" cx="358" cy="174" r="5" opacity=".45"/><circle class="sP" cx="314" cy="170" r="5" opacity=".45"/><circle class="sP" cx="359" cy="164" r="5" opacity=".45"/><circle class="sP" cx="363" cy="204" r="5" opacity=".45"/><circle class="sP" cx="382" cy="206" r="5" opacity=".45"/><circle class="sP" cx="291" cy="178" r="5" opacity=".45"/><circle class="sP" cx="310" cy="191" r="5" opacity=".45"/><circle class="sP" cx="333" cy="176" r="5" opacity=".45"/><circle class="sP" cx="346" cy="158" r="5" opacity=".45"/><circle class="sP" cx="524" cy="85" r="5" opacity=".45"/><circle class="sP" cx="586" cy="91" r="5" opacity=".45"/><circle class="sP" cx="522" cy="63" r="5" opacity=".45"/><circle class="sP" cx="475" cy="83" r="5" opacity=".45"/><circle class="sP" cx="546" cy="117" r="5" opacity=".45"/><circle class="sP" cx="530" cy="87" r="5" opacity=".45"/><circle class="sP" cx="579" cy="79" r="5" opacity=".45"/><circle class="sP" cx="494" cy="111" r="5" opacity=".45"/><circle class="sP" cx="490" cy="107" r="5" opacity=".45"/><circle class="sP" cx="552" cy="99" r="5" opacity=".45"/><rect class="sA" x="91" y="191" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="100" y="205" text-anchor="middle">×</text><rect class="sV" x="131" y="181" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="140" y="195" text-anchor="middle">×</text><rect class="sG" x="591" y="191" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="600" y="205" text-anchor="middle">×</text><text class="sT" x="360" y="252" text-anchor="middle">start: 3 random centroids</text></g>
<g data-s="2-2"><circle class="sPv" cx="175" cy="119" r="5"/><circle class="sPv" cx="126" cy="71" r="5"/><circle class="sPv" cx="162" cy="128" r="5"/><circle class="sPv" cx="164" cy="65" r="5"/><circle class="sPv" cx="127" cy="89" r="5"/><circle class="sPv" cx="181" cy="90" r="5"/><circle class="sPv" cx="140" cy="86" r="5"/><circle class="sPv" cx="156" cy="75" r="5"/><circle class="sPv" cx="151" cy="96" r="5"/><circle class="sPv" cx="202" cy="89" r="5"/><circle class="sPv" cx="361" cy="148" r="5"/><circle class="sPv" cx="358" cy="174" r="5"/><circle class="sPv" cx="314" cy="170" r="5"/><circle class="sPv" cx="359" cy="164" r="5"/><circle class="sPv" cx="363" cy="204" r="5"/><circle class="sPg" cx="382" cy="206" r="5"/><circle class="sPv" cx="291" cy="178" r="5"/><circle class="sPv" cx="310" cy="191" r="5"/><circle class="sPv" cx="333" cy="176" r="5"/><circle class="sPv" cx="346" cy="158" r="5"/><circle class="sPg" cx="524" cy="85" r="5"/><circle class="sPg" cx="586" cy="91" r="5"/><circle class="sPg" cx="522" cy="63" r="5"/><circle class="sPg" cx="475" cy="83" r="5"/><circle class="sPg" cx="546" cy="117" r="5"/><circle class="sPg" cx="530" cy="87" r="5"/><circle class="sPg" cx="579" cy="79" r="5"/><circle class="sPg" cx="494" cy="111" r="5"/><circle class="sPg" cx="490" cy="107" r="5"/><circle class="sPg" cx="552" cy="99" r="5"/><rect class="sA" x="91" y="191" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="100" y="205" text-anchor="middle">×</text><rect class="sV" x="131" y="181" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="140" y="195" text-anchor="middle">×</text><rect class="sG" x="591" y="191" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="600" y="205" text-anchor="middle">×</text><text class="sT" x="360" y="252" text-anchor="middle">assign each point to the nearest centroid</text></g>
<g data-s="3-3"><circle class="sPv" cx="175" cy="119" r="5"/><circle class="sPv" cx="126" cy="71" r="5"/><circle class="sPv" cx="162" cy="128" r="5"/><circle class="sPv" cx="164" cy="65" r="5"/><circle class="sPv" cx="127" cy="89" r="5"/><circle class="sPv" cx="181" cy="90" r="5"/><circle class="sPv" cx="140" cy="86" r="5"/><circle class="sPv" cx="156" cy="75" r="5"/><circle class="sPv" cx="151" cy="96" r="5"/><circle class="sPv" cx="202" cy="89" r="5"/><circle class="sPv" cx="361" cy="148" r="5"/><circle class="sPv" cx="358" cy="174" r="5"/><circle class="sPv" cx="314" cy="170" r="5"/><circle class="sPv" cx="359" cy="164" r="5"/><circle class="sPv" cx="363" cy="204" r="5"/><circle class="sPg" cx="382" cy="206" r="5"/><circle class="sPv" cx="291" cy="178" r="5"/><circle class="sPv" cx="310" cy="191" r="5"/><circle class="sPv" cx="333" cy="176" r="5"/><circle class="sPv" cx="346" cy="158" r="5"/><circle class="sPg" cx="524" cy="85" r="5"/><circle class="sPg" cx="586" cy="91" r="5"/><circle class="sPg" cx="522" cy="63" r="5"/><circle class="sPg" cx="475" cy="83" r="5"/><circle class="sPg" cx="546" cy="117" r="5"/><circle class="sPg" cx="530" cy="87" r="5"/><circle class="sPg" cx="579" cy="79" r="5"/><circle class="sPg" cx="494" cy="111" r="5"/><circle class="sPg" cx="490" cy="107" r="5"/><circle class="sPg" cx="552" cy="99" r="5"/><rect class="sA" x="91" y="191" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="100" y="205" text-anchor="middle">×</text><rect class="sV" x="234.098" y="121.139" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="243.098" y="135.139" text-anchor="middle">×</text><rect class="sG" x="507.373" y="93.4838" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="516.373" y="107.484" text-anchor="middle">×</text><text class="sT" x="360" y="252" text-anchor="middle">move each centroid to its points' mean</text></g>
<g data-s="4-4"><circle class="sPv" cx="175" cy="119" r="5"/><circle class="sPv" cx="126" cy="71" r="5"/><circle class="sPv" cx="162" cy="128" r="5"/><circle class="sPv" cx="164" cy="65" r="5"/><circle class="sP" cx="127" cy="89" r="5"/><circle class="sPv" cx="181" cy="90" r="5"/><circle class="sPv" cx="140" cy="86" r="5"/><circle class="sPv" cx="156" cy="75" r="5"/><circle class="sPv" cx="151" cy="96" r="5"/><circle class="sPv" cx="202" cy="89" r="5"/><circle class="sPv" cx="361" cy="148" r="5"/><circle class="sPv" cx="358" cy="174" r="5"/><circle class="sPv" cx="314" cy="170" r="5"/><circle class="sPv" cx="359" cy="164" r="5"/><circle class="sPv" cx="363" cy="204" r="5"/><circle class="sPv" cx="382" cy="206" r="5"/><circle class="sPv" cx="291" cy="178" r="5"/><circle class="sPv" cx="310" cy="191" r="5"/><circle class="sPv" cx="333" cy="176" r="5"/><circle class="sPv" cx="346" cy="158" r="5"/><circle class="sPg" cx="524" cy="85" r="5"/><circle class="sPg" cx="586" cy="91" r="5"/><circle class="sPg" cx="522" cy="63" r="5"/><circle class="sPg" cx="475" cy="83" r="5"/><circle class="sPg" cx="546" cy="117" r="5"/><circle class="sPg" cx="530" cy="87" r="5"/><circle class="sPg" cx="579" cy="79" r="5"/><circle class="sPg" cx="494" cy="111" r="5"/><circle class="sPg" cx="490" cy="107" r="5"/><circle class="sPg" cx="552" cy="99" r="5"/><rect class="sA" x="91" y="191" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="100" y="205" text-anchor="middle">×</text><rect class="sV" x="234.098" y="121.139" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="243.098" y="135.139" text-anchor="middle">×</text><rect class="sG" x="507.373" y="93.4838" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="516.373" y="107.484" text-anchor="middle">×</text><text class="sT" x="360" y="252" text-anchor="middle">reassign</text></g>
<g data-s="5-5"><circle class="sP" cx="175" cy="119" r="5"/><circle class="sP" cx="126" cy="71" r="5"/><circle class="sP" cx="162" cy="128" r="5"/><circle class="sP" cx="164" cy="65" r="5"/><circle class="sP" cx="127" cy="89" r="5"/><circle class="sP" cx="181" cy="90" r="5"/><circle class="sP" cx="140" cy="86" r="5"/><circle class="sP" cx="156" cy="75" r="5"/><circle class="sP" cx="151" cy="96" r="5"/><circle class="sP" cx="202" cy="89" r="5"/><circle class="sPv" cx="361" cy="148" r="5"/><circle class="sPv" cx="358" cy="174" r="5"/><circle class="sPv" cx="314" cy="170" r="5"/><circle class="sPv" cx="359" cy="164" r="5"/><circle class="sPv" cx="363" cy="204" r="5"/><circle class="sPv" cx="382" cy="206" r="5"/><circle class="sPv" cx="291" cy="178" r="5"/><circle class="sPv" cx="310" cy="191" r="5"/><circle class="sPv" cx="333" cy="176" r="5"/><circle class="sPv" cx="346" cy="158" r="5"/><circle class="sPg" cx="524" cy="85" r="5"/><circle class="sPg" cx="586" cy="91" r="5"/><circle class="sPg" cx="522" cy="63" r="5"/><circle class="sPg" cx="475" cy="83" r="5"/><circle class="sPg" cx="546" cy="117" r="5"/><circle class="sPg" cx="530" cy="87" r="5"/><circle class="sPg" cx="579" cy="79" r="5"/><circle class="sPg" cx="494" cy="111" r="5"/><circle class="sPg" cx="490" cy="107" r="5"/><circle class="sPg" cx="552" cy="99" r="5"/><rect class="sA" x="149.311" y="81.9745" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="158.311" y="95.9745" text-anchor="middle">×</text><rect class="sV" x="332.769" y="167.854" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="341.769" y="181.854" text-anchor="middle">×</text><rect class="sG" x="520.817" y="83.167" width="18" height="18" rx="3" style="stroke-width:3"/><text class="sT" x="529.817" y="97.167" text-anchor="middle">×</text><text class="sT" x="360" y="252" text-anchor="middle">converged: nothing changes any more</text></g>
</svg><ol class="dia-steps">
<li>Pick k = 3 and drop three centroids, here deliberately badly placed.</li>
<li>Assign every point to its nearest centroid. Two centroids share one corner, so the groups are poor.</li>
<li>Move each centroid to the mean of the points assigned to it.</li>
<li>Reassign with the new centroids. Points change sides; the groups get better.</li>
<li>Repeat until assignments stop changing. Different starts can end differently, which is why libraries run several (<code>n_init</code>).</li>
</ol><figcaption>k-means is two steps on repeat: assign to the nearest centre, move each centre to its points. Computed for this figure from real iterations.</figcaption></figure>

1. Choose behaviour features (spend, frequency, recency, category mix, channel usage), **transform** skewed ones (log) and **scale** them, because k-means uses distances.
2. Fit for several k; compare the **elbow** of inertia and the **silhouette** score, but choose k mainly by **usefulness and stability** (can marketing act on 5 segments? on 12?).
3. **Profile** each cluster: mean and median of every feature vs the overall average, size, and value; **name** them ("weekend families", "price-sensitive occasional buyers").
4. Check **stability**: rerun with different seeds and a different month; segments that reshuffle aren't real.

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="Choosing k: inertia drops steeply until k equals 4 and then flattens, and the silhouette score peaks at k equals 4">
<text class="sT" x="186" y="22" text-anchor="middle">inertia (lower = tighter)</text>
<line class="sLm" x1="60" y1="180" x2="330" y2="180" marker-end="url(#ahm)"/><line class="sLm" x1="60" y1="180" x2="60" y2="30" marker-end="url(#ahm)"/>
<polyline class="sL" points="60.0,40.0 96.0,103.0 132.0,140.8 168.0,160.4 204.0,163.2 240.0,165.3 276.0,166.7 312.0,167.7" fill="none" stroke-width="2.2"/>
<circle class="sP" cx="60" cy="40" r="4"/>
<circle class="sP" cx="96" cy="103" r="4"/>
<circle class="sP" cx="132" cy="141" r="4"/>
<circle class="sP" cx="168" cy="160" r="4"/>
<circle class="sP" cx="204" cy="163" r="4"/>
<circle class="sP" cx="240" cy="165" r="4"/>
<circle class="sP" cx="276" cy="167" r="4"/>
<circle class="sP" cx="312" cy="168" r="4"/>
<text class="sC" x="60" y="198" text-anchor="middle">1</text>
<text class="sC" x="96" y="198" text-anchor="middle">2</text>
<text class="sC" x="132" y="198" text-anchor="middle">3</text>
<text class="sC" x="168" y="198" text-anchor="middle">4</text>
<text class="sC" x="204" y="198" text-anchor="middle">5</text>
<text class="sC" x="240" y="198" text-anchor="middle">6</text>
<text class="sC" x="276" y="198" text-anchor="middle">7</text>
<text class="sC" x="312" y="198" text-anchor="middle">8</text>
<circle class="sPw" cx="168" cy="160" r="9" opacity=".6"/><text class="sWt" x="180" y="150.4">k = 4</text>
<text class="sC" x="186" y="216" text-anchor="middle">number of clusters k</text>
<text class="sT" x="536" y="22" text-anchor="middle">silhouette (higher = clearer)</text>
<line class="sLm" x1="410" y1="180" x2="680" y2="180" marker-end="url(#ahm)"/><line class="sLm" x1="410" y1="180" x2="410" y2="30" marker-end="url(#ahm)"/>
<polyline class="sLg" points="446.0,101.2 482.0,78.5 518.0,64.5 554.0,89.0 590.0,97.8 626.0,104.8 662.0,110.0" fill="none" stroke-width="2.2"/>
<circle class="sPg" cx="446" cy="101" r="4"/>
<circle class="sPg" cx="482" cy="79" r="4"/>
<circle class="sPg" cx="518" cy="64" r="4"/>
<circle class="sPg" cx="554" cy="89" r="4"/>
<circle class="sPg" cx="590" cy="98" r="4"/>
<circle class="sPg" cx="626" cy="105" r="4"/>
<circle class="sPg" cx="662" cy="110" r="4"/>
<text class="sC" x="410" y="198" text-anchor="middle">1</text>
<text class="sC" x="446" y="198" text-anchor="middle">2</text>
<text class="sC" x="482" y="198" text-anchor="middle">3</text>
<text class="sC" x="518" y="198" text-anchor="middle">4</text>
<text class="sC" x="554" y="198" text-anchor="middle">5</text>
<text class="sC" x="590" y="198" text-anchor="middle">6</text>
<text class="sC" x="626" y="198" text-anchor="middle">7</text>
<text class="sC" x="662" y="198" text-anchor="middle">8</text>
<circle class="sPw" cx="518" cy="64" r="9" opacity=".6"/><text class="sWt" x="530" y="54.5">k = 4</text>
<text class="sC" x="536" y="216" text-anchor="middle">number of clusters k</text>
</svg><figcaption>The elbow and the silhouette point at k = 4 here. The final choice still belongs to the people who must act on the segments.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Isolation forest intuition: two random cuts isolate an outlying point while points in the dense cluster need many more cuts">
<rect class="sN" x="40" y="30" width="300" height="180" rx="6"/>
<circle class="sP" cx="200" cy="186" r="3.5"/>
<circle class="sP" cx="221" cy="155" r="3.5"/>
<circle class="sP" cx="208" cy="138" r="3.5"/>
<circle class="sP" cx="209" cy="130" r="3.5"/>
<circle class="sP" cx="170" cy="111" r="3.5"/>
<circle class="sP" cx="159" cy="137" r="3.5"/>
<circle class="sP" cx="209" cy="169" r="3.5"/>
<circle class="sP" cx="207" cy="139" r="3.5"/>
<circle class="sP" cx="212" cy="132" r="3.5"/>
<circle class="sP" cx="140" cy="156" r="3.5"/>
<circle class="sP" cx="180" cy="137" r="3.5"/>
<circle class="sP" cx="185" cy="198" r="3.5"/>
<circle class="sP" cx="226" cy="142" r="3.5"/>
<circle class="sP" cx="160" cy="153" r="3.5"/>
<circle class="sP" cx="167" cy="159" r="3.5"/>
<circle class="sP" cx="149" cy="130" r="3.5"/>
<circle class="sP" cx="220" cy="113" r="3.5"/>
<circle class="sP" cx="196" cy="136" r="3.5"/>
<circle class="sP" cx="221" cy="122" r="3.5"/>
<circle class="sP" cx="213" cy="180" r="3.5"/>
<circle class="sP" cx="150" cy="113" r="3.5"/>
<circle class="sP" cx="207" cy="118" r="3.5"/>
<circle class="sP" cx="154" cy="165" r="3.5"/>
<circle class="sP" cx="221" cy="158" r="3.5"/>
<circle class="sP" cx="225" cy="149" r="3.5"/>
<circle class="sP" cx="170" cy="79" r="3.5"/>
<circle class="sP" cx="208" cy="108" r="3.5"/>
<circle class="sP" cx="195" cy="142" r="3.5"/>
<circle class="sP" cx="157" cy="125" r="3.5"/>
<circle class="sP" cx="245" cy="151" r="3.5"/>
<circle class="sP" cx="147" cy="128" r="3.5"/>
<circle class="sP" cx="194" cy="146" r="3.5"/>
<circle class="sP" cx="216" cy="132" r="3.5"/>
<circle class="sP" cx="187" cy="153" r="3.5"/>
<circle class="sP" cx="152" cy="159" r="3.5"/>
<circle class="sP" cx="203" cy="121" r="3.5"/>
<circle class="sP" cx="177" cy="138" r="3.5"/>
<circle class="sP" cx="151" cy="79" r="3.5"/>
<circle class="sP" cx="204" cy="166" r="3.5"/>
<circle class="sP" cx="189" cy="133" r="3.5"/>
<circle class="sPr" cx="310" cy="54" r="6"/>
<line class="sLw" x1="278" y1="30" x2="278" y2="210" stroke-width="2"/><text class="sWt" x="272" y="204" text-anchor="end">1</text>
<line class="sLw" x1="278" y1="90" x2="340" y2="90" stroke-width="2"/><text class="sWt" x="334" y="106" text-anchor="end">2</text>
<text class="sC" x="190" y="232" text-anchor="middle">random cuts on random features</text>
<text class="sRt" x="380" y="60">the outlier is alone after 2 random cuts</text><text class="sC" x="380" y="84">a typical point needs about 8</text>
<text class="sC" x="380" y="124">average path length over many random</text><text class="sC" x="380" y="142">trees → anomaly score</text>
<text class="sGt" x="380" y="182">then review the top-scored cases</text><text class="sGt" x="380" y="200">within the alert budget</text>
</svg><figcaption>Isolation Forest: anomalies are easy to separate. No labels needed, which is why it suits new kinds of fraud and data faults.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 198" role="img" aria-label="TF-IDF weights for three short complaints: common words like the and order get low weights, distinctive words like cold and refund get high weights">
<text class="sT" x="300" y="30" text-anchor="middle">the</text>
<text class="sT" x="384" y="30" text-anchor="middle">order</text>
<text class="sT" x="468" y="30" text-anchor="middle">late</text>
<text class="sT" x="552" y="30" text-anchor="middle">refund</text>
<text class="sT" x="636" y="30" text-anchor="middle">cold</text>
<text class="sC" x="250" y="65" text-anchor="end">"the order is late"</text>
<rect class="sG" x="260" y="42" width="80" height="34" rx="4" opacity="0.59"/><text class="sC" x="300" y="64" text-anchor="middle">0.52</text>
<rect class="sG" x="344" y="42" width="80" height="34" rx="4" opacity="0.59"/><text class="sC" x="384" y="64" text-anchor="middle">0.52</text>
<rect class="sG" x="428" y="42" width="80" height="34" rx="4" opacity="0.72"/><text class="sC" x="468" y="64" text-anchor="middle">0.67</text>
<rect class="sN" x="512" y="42" width="80" height="34" rx="4"/><text class="sC" x="552" y="64" text-anchor="middle">·</text>
<rect class="sN" x="596" y="42" width="80" height="34" rx="4"/><text class="sC" x="636" y="64" text-anchor="middle">·</text>
<text class="sC" x="250" y="105" text-anchor="end">"the order arrived cold"</text>
<rect class="sG" x="260" y="82" width="80" height="34" rx="4" opacity="0.54"/><text class="sC" x="300" y="104" text-anchor="middle">0.45</text>
<rect class="sG" x="344" y="82" width="80" height="34" rx="4" opacity="0.54"/><text class="sC" x="384" y="104" text-anchor="middle">0.45</text>
<rect class="sN" x="428" y="82" width="80" height="34" rx="4"/><text class="sC" x="468" y="104" text-anchor="middle">·</text>
<rect class="sN" x="512" y="82" width="80" height="34" rx="4"/><text class="sC" x="552" y="104" text-anchor="middle">·</text>
<rect class="sG" x="596" y="82" width="80" height="34" rx="4" opacity="0.80"/><text class="sC" x="636" y="104" text-anchor="middle">0.77</text>
<text class="sC" x="250" y="145" text-anchor="end">"refund the late order"</text>
<rect class="sG" x="260" y="122" width="80" height="34" rx="4" opacity="0.48"/><text class="sC" x="300" y="144" text-anchor="middle">0.39</text>
<rect class="sG" x="344" y="122" width="80" height="34" rx="4" opacity="0.48"/><text class="sC" x="384" y="144" text-anchor="middle">0.39</text>
<rect class="sG" x="428" y="122" width="80" height="34" rx="4" opacity="0.58"/><text class="sC" x="468" y="144" text-anchor="middle">0.50</text>
<rect class="sG" x="512" y="122" width="80" height="34" rx="4" opacity="0.71"/><text class="sC" x="552" y="144" text-anchor="middle">0.66</text>
<rect class="sN" x="596" y="122" width="80" height="34" rx="4"/><text class="sC" x="636" y="144" text-anchor="middle">·</text>
<text class="sS" x="360" y="186" text-anchor="middle">"the" and "order" appear everywhere, so they weigh little; "cold" and "refund" are distinctive</text>
</svg><figcaption>TF-IDF turns each text into a weighted word-count vector. Computed here with scikit-learn's smoothed formula and length normalisation.</figcaption></figure>

## DS7.4 Embeddings 🟢 🟡 ⭐

> [!term] Embedding
> A dense vector (hundreds of numbers) representing a piece of text (or an image, a product, a user) so that **similar meanings are close together**. Similarity is usually measured with **cosine similarity**. Embeddings power semantic search, clustering of texts, deduplication, recommendations, and retrieval for RAG.

<figure class="dia"><svg viewBox="0 0 720 260" role="img" aria-label="Complaints in Arabic, English and Arabizi placed in an embedding space, where messages about a missing order, about refunds and about good service each sit close together">
<rect class="sN" x="14" y="14" width="692" height="210" rx="10"/>
<rect class="sA" x="60" y="50" width="158.4" height="26" rx="13"/><text class="sC" x="139.2" y="68" text-anchor="middle">my order never arrived</text>
<rect class="sA" x="110" y="90" width="93.6" height="26" rx="13"/><text class="sC" x="156.8" y="108" text-anchor="middle">الأوردر موصلش</text>
<rect class="sA" x="40" y="130" width="237.6" height="26" rx="13"/><text class="sC" x="158.8" y="148" text-anchor="middle">3ayez a2ol en el order ma weselsh</text>
<rect class="sW" x="420" y="40" width="144" height="26" rx="13"/><text class="sC" x="492" y="58" text-anchor="middle">I want my money back</text>
<rect class="sW" x="480" y="82" width="72" height="26" rx="13"/><text class="sC" x="516" y="100" text-anchor="middle">عايز فلوسي</text>
<rect class="sW" x="430" y="124" width="115.2" height="26" rx="13"/><text class="sC" x="487.6" y="142" text-anchor="middle">please refund me</text>
<rect class="sG" x="300" y="170" width="151.2" height="26" rx="13"/><text class="sC" x="375.6" y="188" text-anchor="middle">great service, thanks</text>
<rect class="sG" x="480" y="186" width="79.2" height="26" rx="13"/><text class="sC" x="519.6" y="204" text-anchor="middle">خدمة ممتازة</text>
<text class="sS" x="360" y="248" text-anchor="middle">close together = similar meaning, across Arabic, English and Arabizi (cosine similarity)</text>
</svg><figcaption>A 2-D sketch of a space with hundreds of dimensions. Clustering these points is how topic discovery works.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="Decision flow for using LLMs in data-science text tasks: if answers must come from your documents, use RAG; otherwise, with thousands of labels, high volume, tight latency or cost or private data, train a small model, possibly on LLM-assisted labels; otherwise prompt an LLM zero- or few-shot, and fine-tune it with LoRA if it keeps getting the format wrong; every path is evaluated on held-out human labels with macro F1, cost and latency">
<rect class="sA" x="230" y="12" width="260" height="40" rx="20" opacity=".8"/><text class="sT" x="360" y="29" text-anchor="middle">must answers come from</text><text class="sS" x="360" y="45" text-anchor="middle">your own documents?</text>
<line class="sLm" x1="490" y1="32" x2="556" y2="32" marker-end="url(#ahm)"/><text class="sGt" x="523" y="26" text-anchor="middle">yes</text><rect class="sV" x="558" y="10" width="148" height="44" rx="8"/><text class="sT" x="632" y="29" text-anchor="middle">RAG</text><text class="sS" x="632" y="45" text-anchor="middle">retrieve, then generate</text>
<line class="sLm" x1="360" y1="52" x2="360" y2="78" marker-end="url(#ahm)"/><text class="sS" x="370" y="70">no</text>
<rect class="sA" x="210" y="80" width="300" height="40" rx="20" opacity=".8"/><text class="sT" x="360" y="97" text-anchor="middle">thousands of labels, high volume, tight</text><text class="sS" x="360" y="113" text-anchor="middle">latency or cost, or private data?</text>
<line class="sLm" x1="510" y1="100" x2="556" y2="100" marker-end="url(#ahm)"/><text class="sGt" x="533" y="94" text-anchor="middle">yes</text><rect class="sG" x="558" y="78" width="148" height="44" rx="8"/><text class="sT" x="632" y="97" text-anchor="middle">small model</text><text class="sS" x="632" y="113" text-anchor="middle">TF-IDF or fine-tuned</text>
<line class="sLm" x1="210" y1="100" x2="162" y2="100" marker-end="url(#ahm)"/><text class="sS" x="186" y="94" text-anchor="middle">no</text><rect class="sB" x="14" y="78" width="146" height="44" rx="8"/><text class="sT" x="87" y="97" text-anchor="middle">prompt an LLM</text><text class="sS" x="87" y="113" text-anchor="middle">zero- or few-shot</text>
<line class="sLm" x1="87" y1="124" x2="87" y2="150" marker-end="url(#ahm)"/><rect class="sA" x="14" y="152" width="146" height="40" rx="20" opacity=".8"/><text class="sT" x="87" y="169" text-anchor="middle">keeps getting the</text><text class="sS" x="87" y="185" text-anchor="middle">format or style wrong?</text>
<line class="sLm" x1="160" y1="172" x2="206" y2="172" marker-end="url(#ahm)"/><text class="sGt" x="183" y="166" text-anchor="middle">yes</text><rect class="sW" x="208" y="150" width="170" height="44" rx="8"/><text class="sT" x="293" y="169" text-anchor="middle">fine-tune the LLM</text><text class="sS" x="293" y="185" text-anchor="middle">LoRA (AI Journey 21)</text>
<line class="sLm" x1="632" y1="124" x2="632" y2="150" marker-end="url(#ahm)"/><rect class="sN" x="530" y="150" width="176" height="44" rx="8"/><text class="sT" x="618" y="169" text-anchor="middle">LLM pre-labels,</text><text class="sS" x="618" y="185" text-anchor="middle">humans correct, then train</text>
<rect class="sN" x="14" y="210" width="692" height="34" rx="8"/><text class="sGt" x="360" y="232" text-anchor="middle">every branch ends the same way: a held-out human-labelled set, macro F1, cost and latency per item</text>
</svg><figcaption>The "choosing an approach" table above as a decision flow.</figcaption></figure>

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
