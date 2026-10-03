"""Generate every illustration used in the written course.

Run:  python figures/make_figures.py      (from the course folder)
Needs: numpy, matplotlib, scikit-learn, scipy.
All figures are synthetic re-creations drawn for this course (not copied from the book).
"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle

OUT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(42)

# ---------- style ----------
plt.rcParams.update({
    "figure.dpi": 110, "savefig.dpi": 110, "font.size": 10,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.titleweight": "bold", "axes.titlesize": 11,
    "axes.grid": True, "grid.alpha": 0.25,
})
BLUE, ORANGE, GREEN, RED, PURPLE, GREY = "#1f77b4", "#ff7f0e", "#2e7d32", "#c62828", "#6a1b9a", "#607d8b"
LIGHT = {"blue": "#e3f2fd", "green": "#e8f5e9", "amber": "#fff8e1", "red": "#ffebee",
         "purple": "#f3e5f5", "grey": "#eceff1", "teal": "#e0f2f1"}
EDGE = {"blue": "#1565c0", "green": "#2e7d32", "amber": "#f9a825", "red": "#c62828",
        "purple": "#6a1b9a", "grey": "#546e7a", "teal": "#00695c"}


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("saved", name)


def canvas(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, w * 10); ax.set_ylim(0, h * 10)
    ax.axis("off")
    return fig, ax


def box(ax, x, y, w, h, text, color="blue", fs=9, bold=False):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.3,rounding_size=1.2",
                       fc=LIGHT[color], ec=EDGE[color], lw=1.5)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs,
            fontweight="bold" if bold else "normal", wrap=True)


def arrow(ax, x1, y1, x2, y2, text=None, color="#37474f", fs=8, style="-|>"):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                                 mutation_scale=14, lw=1.4, color=color))
    if text:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 1.2, text, ha="center", fontsize=fs,
                color=color, style="italic")


# =====================================================================
# 00 — course map
# =====================================================================
def fig_course_map():
    fig, ax = canvas(13, 8.2)
    ax.set_ylim(-3, 82)
    ax.text(65, 79, "The learning path — stage by stage, left to right; colour = interview level",
            ha="center", fontsize=13, fontweight="bold")
    rows = [
        ("1 Toolkit", [("01 Python", "green"), ("02 NumPy", "green"), ("03 Pandas", "green"), ("12 SQL", "green")]),
        ("2 Data & stats", [("04 Cleaning &|preprocessing", "green"), ("05 EDA &|visualisation", "green"), ("15 Statistics &|A/B testing", "green")]),
        ("3 Classical ML", [("06 ML|foundations", "green"), ("07 Regression", "green"), ("08 Classification", "green"), ("08B Trees &|ensembles", "amber"), ("09 Unsupervised", "amber")]),
        ("4 Applied ML", [("10 NLP (classical|+ Arabic)", "amber"), ("11 Neural nets|(PyTorch)", "amber"), ("13 Capstone", "green")]),
        ("5 Deep learning", [("17 Training|DNNs", "amber"), ("18 CNNs", "amber"), ("19 Time series|& RNNs", "amber"), ("20 NLP +|attention", "amber")]),
        ("6 Modern AI", [("21 Transformers,|LLMs, RAG", "amber"), ("22 ViT &|multimodal", "red"), ("23 Generative|models", "red"), ("24 RL &|bandits", "red")]),
        ("7 Interview", [("25 SOTA|roadmap", "green"), ("14 Gaps &|next steps", "green"), ("16 Interview hub|(e&, telecom)", "green")]),
    ]
    rows = [(lab, [(t.replace("|", chr(10)), c) for t, c in items]) for lab, items in rows]
    y = 68
    for label, items in rows:
        ax.text(2, y + 3, label, fontsize=10, fontweight="bold", color="#37474f", va="center")
        x = 20
        for i, (t, c) in enumerate(items):
            box(ax, x, y, 18, 6.5, t, c, fs=8.5)
            if i < len(items) - 1:
                arrow(ax, x + 18.6, y + 3.25, x + 21.4, y + 3.25)
            x += 22
        y -= 10.5
    for c, t, xx in [("green", "Entry — must know", 20), ("amber", "Mid — expected", 50),
                     ("red", "Senior — know the idea", 80)]:
        box(ax, xx, -1.5, 28, 4.5, t, c, fs=9, bold=True)
    save(fig, "fig00_course_map.png")


# =====================================================================
# 02 / 03 — NumPy broadcasting, pandas groupby
# =====================================================================
def fig_broadcasting():
    fig, ax = canvas(10, 3.6)
    def grid(x0, y0, arr, color, ghost=None):
        r, c = arr.shape
        for i in range(r):
            for j in range(c):
                g = ghost is not None and ghost[i, j]
                ax.add_patch(Rectangle((x0 + j * 5, y0 - i * 5), 5, 5, fc=LIGHT[color] if not g else "white",
                                       ec=EDGE[color], lw=1.2, ls="--" if g else "-"))
                ax.text(x0 + j * 5 + 2.5, y0 - i * 5 + 2.5, str(arr[i, j]), ha="center", va="center",
                        fontsize=9, color="#9e9e9e" if g else "black")
    A = np.array([[1, 2, 3], [4, 5, 6]])
    b = np.array([[10, 20, 30], [10, 20, 30]])
    ghost = np.array([[0, 0, 0], [1, 1, 1]], bool)
    grid(3, 22, A, "blue"); ax.text(10.5, 30, "A  shape (2, 3)", ha="center", fontsize=9)
    ax.text(21, 20, "+", fontsize=18, ha="center", va="center")
    grid(25, 22, b, "amber", ghost); ax.text(32.5, 30, "b  shape (3,) → stretched to (2, 3)", ha="center", fontsize=9)
    ax.text(45, 20, "=", fontsize=18, ha="center", va="center")
    grid(50, 22, A + b, "green"); ax.text(57.5, 30, "result (2, 3)", ha="center", fontsize=9)
    ax.text(68, 22, "Rule: compare shapes from the RIGHT.\nEach pair of dimensions must be\nequal, or one of them must be 1.\n\n(2,3) + (3,)   ✓\n(2,3) + (2,)   ✗  → reshape to (2,1)",
            fontsize=9, va="center", family="monospace")
    ax.text(3, 3, "Dashed cells are virtual copies — NumPy never allocates them (no memory cost).", fontsize=8.5, style="italic")
    save(fig, "fig02_broadcasting.png")


def fig_groupby():
    fig, ax = canvas(11, 4.2)
    rows = [("Cairo", 120), ("Giza", 80), ("Cairo", 100), ("Alex", 60), ("Giza", 70), ("Alex", 90)]
    def table(x0, y0, rs, color, title):
        ax.text(x0 + 10, y0 + 4, title, ha="center", fontsize=9, fontweight="bold")
        for i, (k, v) in enumerate(rs):
            ax.add_patch(Rectangle((x0, y0 - i * 4), 12, 4, fc=LIGHT[color], ec=EDGE[color]))
            ax.add_patch(Rectangle((x0 + 12, y0 - i * 4), 8, 4, fc="white", ec=EDGE[color]))
            ax.text(x0 + 6, y0 - i * 4 + 2, k, ha="center", va="center", fontsize=8.5)
            ax.text(x0 + 16, y0 - i * 4 + 2, str(v), ha="center", va="center", fontsize=8.5)
    table(2, 30, rows, "grey", "df  (region, arpu)")
    colors = {"Cairo": "blue", "Giza": "amber", "Alex": "green"}
    y = 36
    for k in ["Alex", "Cairo", "Giza"]:
        sub = [r for r in rows if r[0] == k]
        table(38, y - 4, sub, colors[k], "")
        y -= 13
    ax.text(48, 38, "SPLIT", ha="center", fontweight="bold", color=EDGE["blue"])
    arrow(ax, 23, 22, 36, 22)
    table(78, 26, [("Alex", 75), ("Cairo", 110), ("Giza", 75)], "purple", "APPLY mean → COMBINE")
    arrow(ax, 60, 22, 76, 22, "mean()")
    ax.text(2, 1, "df.groupby('region')['arpu'].mean()   ≡   SELECT region, AVG(arpu) FROM df GROUP BY region",
            family="monospace", fontsize=8.5)
    save(fig, "fig03_groupby.png")


# =====================================================================
# 04 — leakage-free pipeline, scalers
# =====================================================================
def fig_leakage():
    fig, ax = canvas(11, 4.4)
    box(ax, 2, 20, 16, 10, "Raw data", "grey", bold=True)
    arrow(ax, 18.5, 25, 23, 33); arrow(ax, 18.5, 25, 23, 15)
    box(ax, 23, 29, 16, 8, "Train set", "blue", bold=True)
    box(ax, 23, 11, 16, 8, "Validation /\nTest set", "amber", bold=True)
    box(ax, 46, 29, 22, 8, "fit()\nlearn mean, σ, categories,\nimputation values…", "green")
    arrow(ax, 39.5, 33, 45.5, 33)
    box(ax, 76, 29, 22, 8, "transform(train)\n→ train the model", "green")
    arrow(ax, 68.5, 33, 75.5, 33)
    box(ax, 76, 11, 22, 8, "transform(test)\nusing TRAIN statistics", "amber")
    arrow(ax, 39.5, 15, 75.5, 15, "never fit on this", color=RED)
    arrow(ax, 57, 28.5, 80, 19.5, "reuse the fitted object", color=GREEN)
    ax.text(55, 3, "Leakage = any statistic computed with validation/test rows. Pipeline + cross_val_score prevents it automatically.",
            ha="center", fontsize=9, style="italic", color=RED)
    save(fig, "fig04_leakage_pipeline.png")


def fig_scalers():
    x = rng.lognormal(mean=3, sigma=0.8, size=3000)       # e.g. monthly data usage (GB)
    fig, axs = plt.subplots(1, 4, figsize=(13, 2.8))
    variants = [("Raw (right-skewed)", x),
                ("StandardScaler  (x−μ)/σ", (x - x.mean()) / x.std()),
                ("MinMaxScaler → [0, 1]", (x - x.min()) / (x.max() - x.min())),
                ("log1p then Standard", (np.log1p(x) - np.log1p(x).mean()) / np.log1p(x).std())]
    for ax, (t, v), c in zip(axs, variants, [GREY, BLUE, ORANGE, GREEN]):
        ax.hist(v, bins=50, color=c, alpha=0.85)
        ax.set_title(t, fontsize=9.5); ax.set_yticks([])
    fig.suptitle("Scaling changes the range — only a transform (log, Box-Cox) changes the shape", fontweight="bold", y=1.04)
    save(fig, "fig04_scalers.png")


# =====================================================================
# 05 — chart chooser
# =====================================================================
def fig_chart_gallery():
    fig, axs = plt.subplots(2, 4, figsize=(13, 5.6))
    axs = axs.ravel()
    d = rng.normal(50, 12, 600)
    axs[0].hist(d, bins=30, color=BLUE); axs[0].set_title("Histogram\n“How is one number distributed?”")
    groups = [rng.normal(m, s, 200) for m, s in [(40, 8), (55, 12), (48, 5)]]
    axs[1].boxplot(groups, tick_labels=["Prepaid", "Postpaid", "B2B"]); axs[1].set_title("Box plot\n“Compare distributions across groups”")
    xx = rng.uniform(0, 10, 200); yy = 3 * xx + rng.normal(0, 4, 200)
    axs[2].scatter(xx, yy, s=10, alpha=0.6, color=PURPLE); axs[2].set_title("Scatter\n“Do two numbers move together?”")
    axs[3].bar(["Data", "Voice", "SMS", "Roaming"], [62, 21, 5, 12], color=ORANGE); axs[3].set_title("Bar\n“Compare a number across categories”")
    t = np.arange(120); s = 100 + 0.4 * t + 10 * np.sin(2 * np.pi * t / 30) + rng.normal(0, 3, 120)
    axs[4].plot(t, s, color=GREEN); axs[4].set_title("Line\n“How does it change over time?”")
    c = np.corrcoef(rng.normal(size=(5, 100)) + np.array([[1], [1], [0], [0], [0]]) * rng.normal(size=100))
    im = axs[5].imshow(c, cmap="RdBu_r", vmin=-1, vmax=1); axs[5].set_title("Heatmap\n“Correlations between many features”")
    axs[5].set_xticks([]); axs[5].set_yticks([]); fig.colorbar(im, ax=axs[5], fraction=0.046)
    axs[6].bar([0, 1], [0.27, 0.12], color=[RED, GREEN], tick_label=["Month-to-month", "2-year"])
    axs[6].set_title("Rate by category\n“Churn rate per contract type”")
    for g, col in zip(groups, [BLUE, ORANGE, GREEN]):
        axs[7].hist(g, bins=30, alpha=0.5, color=col, density=True)
    axs[7].set_title("Overlaid densities\n“Does the target shift a feature?”")
    for a in axs: a.tick_params(labelsize=8)
    fig.suptitle("Pick the chart from the QUESTION, not from the data", fontweight="bold", y=1.02)
    fig.tight_layout()
    save(fig, "fig05_chart_gallery.png")


# =====================================================================
# 06 — gradient descent, bias–variance, k-fold, confusion matrix
# =====================================================================
def fig_gd_lr():
    f = lambda w: (w - 2) ** 2 + 1
    g = lambda w: 2 * (w - 2)
    ws = np.linspace(-1.5, 5.5, 200)
    fig, axs = plt.subplots(1, 3, figsize=(13, 3.4))
    for ax, lr, t in zip(axs, [0.05, 0.3, 1.02], ["η too small — slow", "η just right — converges", "η too large — diverges"]):
        ax.plot(ws, f(ws), color=GREY)
        w = -1.0; path = [w]
        for _ in range(10):
            w = w - lr * g(w); path.append(w)
        path = np.array(path)
        path = path[np.abs(path) < 8]
        ax.plot(path, f(path), "o-", color=RED if lr > 1 else (GREEN if lr == 0.3 else ORANGE), ms=4)
        ax.set_title(t); ax.set_xlabel("parameter θ"); ax.set_ylabel("cost J(θ)"); ax.set_ylim(0, 22)
    fig.suptitle("Gradient descent: θ ← θ − η·∇J(θ)   (the learning rate η is the #1 hyperparameter)", fontweight="bold", y=1.04)
    save(fig, "fig06_gd_learning_rates.png")


def fig_bias_variance():
    from sklearn.preprocessing import PolynomialFeatures
    from sklearn.linear_model import LinearRegression
    from sklearn.pipeline import make_pipeline
    x = np.sort(rng.uniform(0, 1, 25)); y = np.sin(2 * np.pi * x) + rng.normal(0, 0.25, 25)
    xt = np.linspace(0, 1, 300)
    fig, axs = plt.subplots(1, 4, figsize=(15, 3.4))
    for ax, d, t, c in zip(axs[:3], [1, 4, 15], ["Degree 1 — UNDERFIT\n(high bias)", "Degree 4 — good fit",
                                                  "Degree 15 — OVERFIT\n(high variance)"], [ORANGE, GREEN, RED]):
        m = make_pipeline(PolynomialFeatures(d), LinearRegression()).fit(x[:, None], y)
        ax.scatter(x, y, s=14, color=GREY); ax.plot(xt, m.predict(xt[:, None]), color=c, lw=2)
        ax.plot(xt, np.sin(2 * np.pi * xt), "--", color="black", lw=0.8, alpha=0.5)
        ax.set_ylim(-2, 2); ax.set_title(t)
    comp = np.linspace(0, 1, 100)
    bias2 = 1.2 * (1 - comp) ** 2 + 0.02; var = 1.1 * comp ** 3 + 0.02
    axs[3].plot(comp, bias2, label="bias²", color=ORANGE); axs[3].plot(comp, var, label="variance", color=PURPLE)
    axs[3].plot(comp, bias2 + var + 0.1, label="total error", color=RED, lw=2.5)
    axs[3].axvline(comp[np.argmin(bias2 + var)], ls=":", color=GREEN); axs[3].text(comp[np.argmin(bias2 + var)] + 0.02, 1.1, "sweet\nspot", color=GREEN)
    axs[3].set_xlabel("model complexity →"); axs[3].set_title("The bias–variance trade-off"); axs[3].legend(fontsize=8)
    axs[3].set_yticks([])
    save(fig, "fig06_bias_variance.png")


def fig_kfold():
    fig, ax = canvas(11, 3.8)
    k = 5
    for i in range(k):
        for j in range(k):
            val = i == j
            ax.add_patch(Rectangle((12 + j * 13, 30 - i * 6), 13, 5, fc=LIGHT["amber"] if val else LIGHT["blue"],
                                   ec=EDGE["amber"] if val else EDGE["blue"]))
            ax.text(12 + j * 13 + 6.5, 30 - i * 6 + 2.5, "validate" if val else "train", ha="center", va="center", fontsize=8)
        ax.text(10, 30 - i * 6 + 2.5, f"Fold {i+1}", ha="right", va="center", fontsize=9)
        ax.text(80, 30 - i * 6 + 2.5, f"score₍{i+1}₎", va="center", fontsize=9)
    ax.text(92, 20, "report\nmean ± std\nof 5 scores", ha="center", va="center", fontsize=10, fontweight="bold", color=GREEN)
    ax.add_patch(Rectangle((12, 1), 65, 4, fc=LIGHT["red"], ec=EDGE["red"]))
    ax.text(44.5, 3, "TEST SET — locked away, used ONCE at the very end", ha="center", va="center", fontsize=9, color=RED, fontweight="bold")
    save(fig, "fig06_kfold.png")


def fig_confusion():
    fig, ax = canvas(11, 5)
    cells = [((20, 24), "TN\ntrue negative", "green"), ((42, 24), "FP  (Type I)\nfalse alarm", "red"),
             ((20, 8), "FN  (Type II)\nmissed positive", "red"), ((42, 8), "TP\ntrue positive", "green")]
    for (x, y), t, c in cells:
        box(ax, x, y, 20, 13, t, c, fs=10, bold=True)
    ax.text(41, 42, "Predicted", ha="center", fontweight="bold"); ax.text(30, 38.5, "Negative", ha="center"); ax.text(52, 38.5, "Positive", ha="center")
    ax.text(8, 22, "Actual", rotation=90, va="center", fontweight="bold"); ax.text(15, 30, "Neg", ha="center"); ax.text(15, 14, "Pos", ha="center")
    txt = ("Precision = TP / (TP + FP)\n   “When I say churn, am I right?”\n\n"
           "Recall = TP / (TP + FN)\n   “Of all churners, how many did I catch?”\n\n"
           "F1 = 2·P·R / (P + R)\n\nFPR = FP / (FP + TN)  → x-axis of ROC\n\n"
           "Accuracy = (TP + TN) / all\n   misleading when classes are imbalanced")
    ax.text(70, 24, txt, va="center", fontsize=9.5, family="monospace")
    save(fig, "fig06_confusion_matrix.png")


# =====================================================================
# 07 — learning curves, regularisation paths, early stopping
# =====================================================================
def fig_learning_curves():
    from sklearn.model_selection import learning_curve
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import PolynomialFeatures
    from sklearn.pipeline import make_pipeline
    X = 6 * rng.random((300, 1)) - 3; y = 0.5 * X[:, 0] ** 2 + X[:, 0] + 2 + rng.normal(0, 1, 300)
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.6), sharey=True)
    for ax, (d, t) in zip(axs, [(1, "Linear model → UNDERFITS\n(both curves high & close: add features / complexity)"),
                               (10, "Degree-10 polynomial → OVERFITS\n(gap between curves: more data / regularise)")]):
        sizes, tr, va = learning_curve(make_pipeline(PolynomialFeatures(d), LinearRegression()), X, y,
                                       train_sizes=np.linspace(0.02, 1, 30), cv=5, scoring="neg_root_mean_squared_error")
        ax.plot(sizes, -tr.mean(1), "o-", ms=3, color=BLUE, label="training error")
        ax.plot(sizes, -va.mean(1), "o-", ms=3, color=RED, label="validation error")
        ax.set_ylim(0, 3); ax.set_xlabel("training-set size"); ax.set_title(t, fontsize=10); ax.legend()
    axs[0].set_ylabel("RMSE")
    save(fig, "fig07_learning_curves.png")


def fig_reg_paths():
    from sklearn.linear_model import Ridge, Lasso
    from sklearn.datasets import make_regression
    X, y = make_regression(n_samples=200, n_features=8, n_informative=4, noise=15, random_state=0)
    alphas = np.logspace(-2, 3.5, 60)
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.6))
    for ax, M, t in zip(axs, [Ridge, Lasso], ["Ridge (ℓ2) — shrinks all coefficients smoothly",
                                              "Lasso (ℓ1) — drives some coefficients to exactly 0\n(automatic feature selection)"]):
        coefs = np.array([M(alpha=a, max_iter=20000).fit(X, y).coef_ for a in alphas])
        ax.plot(alphas, coefs); ax.set_xscale("log"); ax.set_xlabel("regularisation strength α →"); ax.set_title(t, fontsize=10)
        ax.axhline(0, color="black", lw=0.6)
    axs[0].set_ylabel("coefficient value")
    save(fig, "fig07_regularization_paths.png")


def fig_early_stopping():
    ep = np.arange(1, 101)
    train = 1.6 * np.exp(-ep / 18) + 0.1 + rng.normal(0, 0.01, 100)
    val = 1.6 * np.exp(-ep / 18) + 0.25 + 0.00012 * (ep - 30).clip(0) ** 2 + rng.normal(0, 0.02, 100)
    best = int(np.argmin(val))
    fig, ax = plt.subplots(figsize=(8, 3.4))
    ax.plot(ep, train, color=BLUE, label="training loss"); ax.plot(ep, val, color=RED, label="validation loss")
    ax.axvline(ep[best], ls="--", color=GREEN); ax.annotate("best epoch → stop here,\nrestore these weights",
                                                           (ep[best], val[best]), (ep[best] + 10, 1.0),
                                                           arrowprops=dict(arrowstyle="->", color=GREEN), color=GREEN)
    ax.axvspan(ep[best] + 10, 100, color=LIGHT["red"], alpha=0.6); ax.text(ep[best] + 30, 1.4, "overfitting zone\n(patience ran out)", color=RED)
    ax.set_xlabel("epoch"); ax.set_ylabel("loss"); ax.legend(loc="upper right"); ax.set_title("Early stopping — Hinton's “beautiful free lunch”")
    save(fig, "fig07_early_stopping.png")


# =====================================================================
# 08 — sigmoid, PR/ROC, calibration
# =====================================================================
def fig_sigmoid():
    z = np.linspace(-8, 8, 300)
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.4))
    axs[0].plot(z, 1 / (1 + np.exp(-z)), color=BLUE, lw=2)
    axs[0].axhline(0.5, ls="--", color=GREY); axs[0].axvline(0, ls=":", color=GREY)
    axs[0].set_title("Sigmoid σ(z) = 1 / (1 + e^(−z))\nz = θᵀx (the log-odds)"); axs[0].set_xlabel("z"); axs[0].set_ylabel("P(y = 1)")
    p = np.linspace(0.001, 0.999, 300)
    axs[1].plot(p, -np.log(p), color=GREEN, lw=2, label="true label y=1:  −log(p)")
    axs[1].plot(p, -np.log(1 - p), color=RED, lw=2, label="true label y=0:  −log(1−p)")
    axs[1].set_ylim(0, 5); axs[1].set_xlabel("predicted probability p"); axs[1].set_ylabel("loss")
    axs[1].set_title("Log loss punishes confident mistakes hard"); axs[1].legend(fontsize=8)
    save(fig, "fig08_sigmoid_logloss.png")


def _clf_data():
    from sklearn.datasets import make_classification
    from sklearn.model_selection import train_test_split
    X, y = make_classification(n_samples=6000, n_features=12, n_informative=6, weights=[0.9, 0.1],
                               class_sep=0.9, n_clusters_per_class=1, random_state=7)
    return train_test_split(X, y, test_size=0.4, random_state=0, stratify=y)


def fig_pr_roc():
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import precision_recall_curve, roc_curve, roc_auc_score, average_precision_score
    Xtr, Xte, ytr, yte = _clf_data()
    lr = LogisticRegression(max_iter=2000).fit(Xtr, ytr); rf = RandomForestClassifier(300, random_state=0, n_jobs=-1).fit(Xtr, ytr)
    fig, axs = plt.subplots(1, 3, figsize=(15, 3.8))
    s = rf.predict_proba(Xte)[:, 1]
    P, R, T = precision_recall_curve(yte, s)
    axs[0].plot(T, P[:-1], color=BLUE, label="precision"); axs[0].plot(T, R[:-1], color=GREEN, label="recall")
    axs[0].axvline(0.5, ls=":", color=GREY); axs[0].text(0.51, 0.05, "default 0.5", color=GREY, fontsize=8)
    axs[0].set_xlabel("decision threshold"); axs[0].set_title("Moving the threshold trades\nprecision against recall"); axs[0].legend()
    for m, name, c in [(lr, "Logistic", ORANGE), (rf, "Random forest", BLUE)]:
        sc = m.predict_proba(Xte)[:, 1]
        f, t, _ = roc_curve(yte, sc); axs[1].plot(f, t, color=c, label=f"{name}  AUC={roc_auc_score(yte, sc):.2f}")
        p, r, _ = precision_recall_curve(yte, sc); axs[2].plot(r, p, color=c, label=f"{name}  AP={average_precision_score(yte, sc):.2f}")
    axs[1].plot([0, 1], [0, 1], "--", color=GREY, label="random  AUC=0.50"); axs[1].set_xlabel("False positive rate"); axs[1].set_ylabel("True positive rate (recall)")
    axs[1].set_title("ROC curve"); axs[1].legend(fontsize=8)
    axs[2].axhline(yte.mean(), ls="--", color=GREY, label=f"random  AP={yte.mean():.2f} (= positive rate)")
    axs[2].set_xlabel("Recall"); axs[2].set_ylabel("Precision"); axs[2].set_title("Precision–Recall curve\n(prefer this when positives are rare)"); axs[2].legend(fontsize=8)
    save(fig, "fig08_threshold_roc_pr.png")


def fig_calibration():
    from sklearn.calibration import calibration_curve
    from sklearn.naive_bayes import GaussianNB
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    Xtr, Xte, ytr, yte = _clf_data()
    fig, ax = plt.subplots(figsize=(6.2, 4.2))
    ax.plot([0, 1], [0, 1], "--", color=GREY, label="perfectly calibrated")
    for m, n, c in [(LogisticRegression(max_iter=2000), "Logistic regression", ORANGE),
                    (RandomForestClassifier(300, random_state=0, n_jobs=-1), "Random forest", BLUE),
                    (GaussianNB(), "Naive Bayes", RED)]:
        pr = m.fit(Xtr, ytr).predict_proba(Xte)[:, 1]
        fp, mp = calibration_curve(yte, pr, n_bins=10, strategy="quantile")
        ax.plot(mp, fp, "o-", ms=4, color=c, label=n)
    ax.set_xlabel("mean predicted probability"); ax.set_ylabel("observed fraction of positives")
    ax.set_title("Reliability diagram — is “70%” really 70%?"); ax.legend(fontsize=8)
    save(fig, "fig08_calibration.png")


# =====================================================================
# 08B — trees & ensembles
# =====================================================================
def _boundary(ax, model, X, y, title):
    xx, yy = np.meshgrid(np.linspace(X[:, 0].min() - .5, X[:, 0].max() + .5, 300),
                         np.linspace(X[:, 1].min() - .5, X[:, 1].max() + .5, 300))
    Z = model.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    ax.contourf(xx, yy, Z, alpha=0.25, cmap="coolwarm")
    ax.scatter(X[:, 0], X[:, 1], c=y, cmap="coolwarm", s=10, edgecolor="k", linewidth=0.2)
    ax.set_title(title, fontsize=9.5); ax.set_xticks([]); ax.set_yticks([])


def fig_trees():
    from sklearn.datasets import make_moons
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
    X, y = make_moons(n_samples=300, noise=0.3, random_state=42)
    Xt, yt = make_moons(n_samples=2000, noise=0.3, random_state=43)
    models = [(DecisionTreeClassifier(random_state=42), "Single tree, no limits"),
              (DecisionTreeClassifier(min_samples_leaf=5, random_state=42), "Tree, min_samples_leaf=5"),
              (RandomForestClassifier(500, random_state=42, n_jobs=-1), "Random forest (500 trees)"),
              (HistGradientBoostingClassifier(max_iter=100, random_state=42), "Gradient boosting (HGB)")]
    fig, axs = plt.subplots(1, 4, figsize=(15, 3.5))
    for ax, (m, t) in zip(axs, models):
        m.fit(X, y); _boundary(ax, m, X, y, f"{t}\ntest acc = {m.score(Xt, yt):.3f}")
    fig.suptitle("Regularising a tree, then averaging many (bagging) or chaining them (boosting)", fontweight="bold", y=1.05)
    save(fig, "fig08B_tree_ensembles.png")


def fig_boosting_stages():
    from sklearn.tree import DecisionTreeRegressor
    X = rng.random((120, 1)) - 0.5; y = 3 * X[:, 0] ** 2 + 0.05 * rng.normal(size=120)
    xt = np.linspace(-0.5, 0.5, 300)[:, None]
    fig, axs = plt.subplots(2, 3, figsize=(13, 5.4), sharex=True)
    resid = y.copy(); trees = []
    for i in range(3):
        t = DecisionTreeRegressor(max_depth=2, random_state=42).fit(X, resid); trees.append(t)
        axs[0, i].scatter(X, resid, s=8, color=GREY); axs[0, i].plot(xt, t.predict(xt), color=GREEN, lw=2)
        axs[0, i].set_title(f"Tree {i+1} fits the {'target' if i == 0 else 'residuals'}", fontsize=9.5)
        ens = sum(tr.predict(xt) for tr in trees)
        axs[1, i].scatter(X, y, s=8, color=GREY); axs[1, i].plot(xt, ens, color=RED, lw=2)
        axs[1, i].set_title(f"Ensemble after {i+1} tree{'s' if i else ''}", fontsize=9.5)
        resid = resid - t.predict(X)
    fig.suptitle("Gradient boosting = each new tree corrects the errors (residuals) of the ensemble so far", fontweight="bold")
    fig.tight_layout()
    save(fig, "fig08B_boosting_stages.png")


# =====================================================================
# 09 — PCA, k-means diagnostics, clustering comparison
# =====================================================================
def fig_pca():
    from sklearn.decomposition import PCA
    from sklearn.datasets import load_digits
    X = rng.multivariate_normal([0, 0], [[3, 2.4], [2.4, 2.4]], 300)
    p = PCA().fit(X)
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.9))
    axs[0].scatter(X[:, 0], X[:, 1], s=8, alpha=0.5, color=GREY)
    for v, l, c, n in zip(p.components_, p.explained_variance_, [RED, BLUE], ["PC1", "PC2"]):
        axs[0].annotate("", xy=v * 2 * np.sqrt(l), xytext=(0, 0), arrowprops=dict(arrowstyle="->", lw=2.5, color=c))
        axs[0].text(*(v * 2.3 * np.sqrt(l)), f"{n}: {p.explained_variance_ratio_[0 if n=='PC1' else 1]:.0%} of variance", color=c, fontweight="bold")
    axs[0].set_aspect("equal"); axs[0].set_title("PCA finds the axes of maximum variance")
    d = PCA().fit(load_digits().data)
    cum = np.cumsum(d.explained_variance_ratio_); k = int(np.argmax(cum >= 0.95)) + 1
    axs[1].plot(np.arange(1, 65), cum, color=BLUE, lw=2); axs[1].axhline(0.95, ls="--", color=GREY)
    axs[1].axvline(k, ls="--", color=RED); axs[1].text(k + 1, 0.6, f"{k} components keep 95%\n(of 64 pixels)", color=RED)
    axs[1].set_xlabel("number of components"); axs[1].set_ylabel("cumulative explained variance"); axs[1].set_title("Choosing d: the explained-variance curve (digits)")
    save(fig, "fig09_pca.png")


def fig_kmeans_k():
    from sklearn.datasets import make_blobs
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    X, _ = make_blobs(n_samples=1000, centers=[[0.2, 2.3], [-1.5, 2.3], [-2.8, 1.8], [-2.8, 2.8], [-2.8, 1.3]],
                      cluster_std=[0.4, 0.3, 0.1, 0.1, 0.1], random_state=7)
    ks = range(2, 10); inert, sil = [], []
    for k in ks:
        km = KMeans(k, n_init=10, random_state=42).fit(X); inert.append(km.inertia_); sil.append(silhouette_score(X, km.labels_))
    fig, axs = plt.subplots(1, 3, figsize=(15, 3.6))
    km = KMeans(5, n_init=10, random_state=42).fit(X)
    axs[0].scatter(X[:, 0], X[:, 1], c=km.labels_, s=6, cmap="tab10"); axs[0].scatter(*km.cluster_centers_.T, marker="x", s=80, c="k")
    axs[0].set_title("K-Means, k = 5 (× = centroids)")
    axs[1].plot(list(ks), inert, "o-", color=BLUE); axs[1].set_xlabel("k"); axs[1].set_title("Elbow: inertia always falls with k\n(look for the bend — often ambiguous)")
    axs[2].plot(list(ks), sil, "o-", color=GREEN); axs[2].set_xlabel("k"); axs[2].set_title("Silhouette score — higher is better\n(more reliable than the elbow)")
    axs[2].axvline(list(ks)[int(np.argmax(sil))], ls="--", color=RED)
    save(fig, "fig09_kmeans_choose_k.png")


def fig_cluster_compare():
    from sklearn.datasets import make_moons, make_blobs
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.mixture import GaussianMixture
    Xm, _ = make_moons(400, noise=0.06, random_state=1)
    Xb, _ = make_blobs(400, centers=3, cluster_std=[1.0, 2.2, 0.5], random_state=170)
    Xb = Xb @ np.array([[0.6, -0.6], [-0.4, 0.8]])
    fig, axs = plt.subplots(2, 3, figsize=(13, 7))
    for r, X, eps in [(0, Xm, 0.2), (1, Xb, 0.45)]:
        for c, (m, n) in enumerate([(KMeans(2 if r == 0 else 3, n_init=10, random_state=0), "K-Means"),
                                    (DBSCAN(eps=eps, min_samples=5), "DBSCAN"),
                                    (GaussianMixture(2 if r == 0 else 3, random_state=0), "Gaussian mixture")]):
            lab = m.fit_predict(X)
            axs[r, c].scatter(X[:, 0], X[:, 1], c=lab, s=6, cmap="tab10"); axs[r, c].set_xticks([]); axs[r, c].set_yticks([])
            axs[r, c].set_title(n + (" (grey = noise: −1)" if n == "DBSCAN" else ""))
    axs[0, 0].set_ylabel("non-convex shapes", fontweight="bold"); axs[1, 0].set_ylabel("stretched blobs, different sizes", fontweight="bold")
    fig.suptitle("No clustering algorithm wins everywhere — match the algorithm to the cluster shape", fontweight="bold")
    fig.tight_layout()
    save(fig, "fig09_clustering_compare.png")


# =====================================================================
# 10 — TF-IDF / cosine
# =====================================================================
def fig_cosine():
    fig, ax = plt.subplots(figsize=(6.5, 4.2))
    vecs = {"“cancel my data bundle”": (4, 1), "“stop the internet package”": (3.5, 1.6), "“recharge 50 EGP credit”": (1, 3.8)}
    cols = [BLUE, GREEN, ORANGE]
    for (n, v), c in zip(vecs.items(), cols):
        ax.annotate("", xy=v, xytext=(0, 0), arrowprops=dict(arrowstyle="->", lw=2.4, color=c)); ax.text(v[0] + 0.1, v[1] + 0.05, n, color=c, fontsize=9)
    ax.set_xlim(0, 6.5); ax.set_ylim(0, 4.5); ax.set_xlabel("dimension ‘cancel/stop’"); ax.set_ylabel("dimension ‘top-up’")
    ax.set_title("Cosine similarity = angle between vectors\nsmall angle → similar meaning (length ignored)")
    ax.text(3.2, 0.3, "cos ≈ 0.97 (similar)", color=GREEN); ax.text(0.2, 4.1, "cos ≈ 0.45 (different intent)", color=ORANGE)
    save(fig, "fig10_cosine.png")


# =====================================================================
# 11 / 17 — activations, MLP, vanishing gradients, dropout, LR schedules
# =====================================================================
def fig_activations():
    z = np.linspace(-4, 4, 400)
    from scipy.special import erf
    acts = {"sigmoid": 1 / (1 + np.exp(-z)), "tanh": np.tanh(z), "ReLU": np.maximum(0, z),
            "Leaky ReLU (α=0.1)": np.where(z > 0, z, 0.1 * z), "ELU": np.where(z > 0, z, np.exp(z) - 1),
            "GELU": 0.5 * z * (1 + erf(z / np.sqrt(2))), "SiLU / Swish": z / (1 + np.exp(-z))}
    fig, axs = plt.subplots(1, 2, figsize=(13, 3.9))
    for (n, v), c in zip(acts.items(), plt.cm.tab10.colors):
        axs[0].plot(z, v, label=n, lw=2, color=c)
        axs[1].plot(z, np.gradient(v, z), label=n, lw=2, color=c)
    axs[0].set_ylim(-1.5, 4); axs[0].set_title("Activation functions"); axs[0].legend(fontsize=8)
    axs[1].set_ylim(-0.2, 1.3); axs[1].set_title("Their derivatives — sigmoid's max is 0.25\n→ gradients shrink layer after layer (vanishing)")
    for a in axs: a.axhline(0, color="k", lw=0.5); a.axvline(0, color="k", lw=0.5)
    save(fig, "fig11_activations.png")


def fig_mlp():
    fig, ax = canvas(10, 4.6)
    layers = [4, 6, 6, 3]; xs = [10, 35, 60, 85]; names = ["input layer\n(features)", "hidden 1\nReLU", "hidden 2\nReLU", "output\nsoftmax"]
    pos = []
    for n, x in zip(layers, xs):
        ys = np.linspace(40, 8, n) if n > 1 else [24]
        pos.append([(x, y) for y in ys])
    for a, b in zip(pos[:-1], pos[1:]):
        for p in a:
            for q in b:
                ax.plot([p[0], q[0]], [p[1], q[1]], color="#b0bec5", lw=0.6, zorder=1)
    for ps, c in zip(pos, [BLUE, GREEN, GREEN, ORANGE]):
        for p in ps: ax.add_patch(Circle(p, 2.2, fc="white", ec=c, lw=2, zorder=2))
    for x, n in zip(xs, names): ax.text(x, 1, n, ha="center", fontsize=9)
    ax.text(47, 45, "forward pass: h = ReLU(W·x + b)  →  prediction  →  loss", ha="center", fontsize=9, color=BLUE)
    ax.text(47, -3.5, "backward pass (backprop): chain rule sends ∂loss/∂W from right to left; optimizer updates W", ha="center", fontsize=9, color=RED)
    save(fig, "fig11_mlp.png")


def fig_vanishing():
    L = np.arange(1, 21)
    fig, ax = plt.subplots(figsize=(8, 3.4))
    for f, n, c in [(0.25, "sigmoid (max slope 0.25)", RED), (0.6, "tanh-ish (≈0.6)", ORANGE), (1.0, "ReLU + He init (≈1)", GREEN), (1.4, "bad init (>1) → exploding", PURPLE)]:
        ax.plot(L, f ** L, "o-", ms=3, label=n, color=c)
    ax.set_yscale("log"); ax.set_xlabel("layers back from the output"); ax.set_ylabel("gradient scale (log)")
    ax.set_title("Why deep nets were hard to train before 2010: gradients multiply layer by layer"); ax.legend(fontsize=8)
    save(fig, "fig17_vanishing_gradients.png")


def fig_dropout():
    fig, axs = plt.subplots(1, 2, figsize=(11, 3.6))
    for ax, drop, t in zip(axs, [False, True], ["Training step t (all neurons)", "Training step t+1 — dropout p = 0.5\n(random neurons switched off)"]):
        ax.axis("off"); ax.set_xlim(0, 100); ax.set_ylim(0, 50)
        xs = [10, 40, 70, 95]; layers = [4, 5, 5, 2]
        mask = [np.zeros(n, bool) for n in layers]
        if drop:
            mask[1] = np.array([0, 1, 0, 1, 0], bool); mask[2] = np.array([1, 0, 0, 1, 0], bool)
        pos = [[(x, y) for y in np.linspace(45, 5, n)] for n, x in zip(layers, xs)]
        for i in range(3):
            for a, pa in enumerate(pos[i]):
                for b, pb in enumerate(pos[i + 1]):
                    if not (mask[i][a] or mask[i + 1][b]):
                        ax.plot([pa[0], pb[0]], [pa[1], pb[1]], color="#b0bec5", lw=0.6)
        for i, ps in enumerate(pos):
            for j, p in enumerate(ps):
                d = mask[i][j]
                ax.add_patch(Circle(p, 2.6, fc="#eeeeee" if d else "white", ec=GREY if d else BLUE, lw=2, ls="--" if d else "-"))
                if d: ax.text(*p, "×", ha="center", va="center", color=RED, fontsize=12)
        ax.set_title(t, fontsize=10)
    fig.suptitle("Dropout: every step trains a different thinned network → an implicit ensemble. Off at inference (model.eval()).", fontsize=10, fontweight="bold")
    save(fig, "fig17_dropout.png")


def fig_lr_schedules():
    T = 1000; t = np.arange(T); lr0 = 1e-3
    warm = 60
    sched = {
        "constant": np.full(T, lr0),
        "exponential decay": lr0 * 0.1 ** (t / T),
        "cosine annealing": lr0 * 0.5 * (1 + np.cos(np.pi * t / T)),
        "warm-up + cosine (LLM default)": np.where(t < warm, lr0 * t / warm, lr0 * 0.5 * (1 + np.cos(np.pi * (t - warm) / (T - warm)))),
        "1cycle": np.where(t < T * 0.45, lr0 / 10 + (lr0 - lr0 / 10) * t / (T * 0.45),
                           np.where(t < T * 0.9, lr0 - (lr0 - lr0 / 10) * (t - T * 0.45) / (T * 0.45), lr0 / 10 * (1 - (t - T * 0.9) / (T * 0.1)) + 1e-6)),
        "WSD (warm-up–stable–decay)": np.where(t < warm, lr0 * t / warm, np.where(t < 0.8 * T, lr0, lr0 * (1 - (t - 0.8 * T) / (0.2 * T)))),
    }
    fig, ax = plt.subplots(figsize=(10, 3.6))
    for (n, v), c in zip(sched.items(), plt.cm.tab10.colors):
        ax.plot(t, v, label=n, lw=2, color=c)
    ax.set_xlabel("training step"); ax.set_ylabel("learning rate"); ax.set_title("Learning-rate schedules"); ax.legend(fontsize=8, ncol=2)
    save(fig, "fig17_lr_schedules.png")


# =====================================================================
# 12 — SQL joins
# =====================================================================
def fig_joins():
    fig, axs = plt.subplots(1, 4, figsize=(13, 3))
    from matplotlib.patches import Circle as C
    for ax, (n, fillL, fillM, fillR) in zip(axs, [("INNER JOIN", 0, 1, 0), ("LEFT JOIN", 1, 1, 0),
                                                   ("FULL OUTER JOIN", 1, 1, 1), ("LEFT ANTI JOIN\n(LEFT … WHERE r.key IS NULL)", 1, 0, 0)]):
        ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off"); ax.set_aspect("equal")
        xx, yy = np.meshgrid(np.linspace(0, 10, 400), np.linspace(0, 6, 240))
        inL = (xx - 4) ** 2 + (yy - 3) ** 2 < 4; inR = (xx - 6.2) ** 2 + (yy - 3) ** 2 < 4
        Z = np.zeros_like(xx)
        Z[inL & ~inR] = fillL; Z[inL & inR] = fillM; Z[inR & ~inL] = fillR
        ax.imshow(np.where(Z > 0, 1, np.nan), extent=(0, 10, 0, 6), origin="lower", cmap="Blues", vmin=0, vmax=2, alpha=0.8)
        ax.add_patch(C((4, 3), 2, fill=False, lw=1.5)); ax.add_patch(C((6.2, 3), 2, fill=False, lw=1.5))
        ax.text(2.6, 5.4, "customers", fontsize=8); ax.text(6.6, 5.4, "payments", fontsize=8)
        ax.set_title(n, fontsize=9.5)
    fig.suptitle("Joins as sets. Interview trap: a one-to-many join multiplies rows (fan-out) → wrong SUM/AVG", fontsize=10, fontweight="bold", y=1.05)
    save(fig, "fig12_sql_joins.png")


# =====================================================================
# 13 — capstone pipeline
# =====================================================================
def fig_capstone():
    fig, ax = canvas(13, 3.4)
    steps = [("Brief &\nsuccess metric", "grey"), ("Profile\n(reusable fn)", "blue"), ("Feature\nengineering", "blue"), ("EDA +\nstat tests", "blue"),
             ("Stratified split\n+ Pipeline", "green"), ("Dummy baseline\n→ models (CV)", "green"), ("SMOTE inside\nCV folds", "amber"),
             ("Test once,\nexplain (SHAP)", "amber"), ("Save artifacts\n+ report", "purple")]
    x = 2
    for i, (t, c) in enumerate(steps):
        box(ax, x, 12, 12, 10, t, c, fs=8)
        if i < len(steps) - 1: arrow(ax, x + 12.4, 17, x + 14.2, 17)
        x += 14.3
    ax.text(65, 3, "The “industrial” template — reuse it for any tabular classification take-home", ha="center", fontsize=9.5, style="italic")
    save(fig, "fig13_capstone_pipeline.png")


# =====================================================================
# 15 — statistics
# =====================================================================
def fig_clt():
    fig, axs = plt.subplots(1, 4, figsize=(15, 3.2))
    pop = rng.exponential(2, 200000)
    axs[0].hist(pop, bins=80, color=GREY, density=True); axs[0].set_title("Population: skewed\n(e.g. call durations)")
    for ax, n in zip(axs[1:], [2, 10, 50]):
        means = rng.choice(pop, (20000, n)).mean(1)
        ax.hist(means, bins=60, color=BLUE, density=True, alpha=0.8)
        xs = np.linspace(means.min(), means.max(), 200)
        from scipy.stats import norm
        ax.plot(xs, norm.pdf(xs, 2, 2 / np.sqrt(n)), color=RED, lw=2)
        ax.set_title(f"Means of samples of n = {n}\nSE = σ/√n = {2/np.sqrt(n):.2f}")
    fig.suptitle("Central Limit Theorem: sample means become Normal, whatever the population's shape", fontweight="bold", y=1.06)
    save(fig, "fig15_clt.png")


def fig_hypothesis():
    from scipy.stats import norm
    x = np.linspace(-4, 7, 600); crit = norm.ppf(0.975); eff = 2.8
    fig, ax = plt.subplots(figsize=(11, 3.8))
    ax.plot(x, norm.pdf(x), color=BLUE, lw=2, label="H₀ true (no effect)"); ax.plot(x, norm.pdf(x, eff), color=GREEN, lw=2, label="H₁ true (real effect)")
    ax.fill_between(x, norm.pdf(x), where=x > crit, color=RED, alpha=0.5, label="α: false positive (Type I), 2.5% per tail")
    ax.fill_between(x, norm.pdf(x), where=x < -crit, color=RED, alpha=0.5)
    ax.fill_between(x, norm.pdf(x, eff), where=x < crit, color=ORANGE, alpha=0.35, label="β: missed effect (Type II)")
    ax.fill_between(x, norm.pdf(x, eff), where=x > crit, color=GREEN, alpha=0.2, label=f"power = 1 − β ≈ {1 - norm.cdf(crit, eff):.0%}")
    ax.axvline(crit, ls="--", color="k"); ax.text(crit + 0.05, 0.42, "critical value\n(reject H₀ to the right)", fontsize=8)
    ax.set_yticks([]); ax.set_xlabel("test statistic (z)"); ax.legend(fontsize=8, loc="upper right")
    ax.set_title("Hypothesis testing in one picture: α, β, power. Bigger sample → narrower curves → more power")
    save(fig, "fig15_hypothesis_power.png")


def fig_ab_flow():
    fig, ax = canvas(13, 3.6)
    steps = [("1. Business goal\n& ONE primary metric", "grey"), ("2. Hypothesis +\nguardrail metrics", "blue"), ("3. Unit of\nrandomisation", "blue"),
             ("4. Power analysis\n→ sample size, duration", "green"), ("5. Run — no peeking;\ncheck SRM", "amber"), ("6. Analyse: test,\nCI, segments", "amber"),
             ("7. Decide: ship?\npractical significance", "purple")]
    x = 2
    for i, (t, c) in enumerate(steps):
        box(ax, x, 14, 16, 12, t, c, fs=8.5)
        if i < len(steps) - 1: arrow(ax, x + 16.4, 20, x + 18.2, 20)
        x += 18.3
    ax.text(65, 4, "Pitfalls interviewers probe: peeking, multiple metrics, novelty effect, network effects, Simpson's paradox, SRM",
            ha="center", fontsize=9, color=RED, style="italic")
    save(fig, "fig15_ab_test_flow.png")


# =====================================================================
# 16 — interview loop & levels
# =====================================================================
def fig_interview_loop():
    fig, ax = canvas(13, 4.4)
    stages = [("Recruiter / HR\nscreen", "grey", "motivation, salary,\nnotice period"),
              ("Online test\n(HackerRank)", "blue", "Python + SQL\n+ ML MCQ"),
              ("Technical 1\nML & stats", "green", "concepts, metrics,\nbias–variance, A/B"),
              ("Technical 2\ncase / take-home", "amber", "churn / NBO case,\npresent results"),
              ("Hiring manager\n+ behavioural", "purple", "STAR stories,\nstakeholders"),
              ("Offer", "green", "negotiate on\ntotal package")]
    x = 2
    for i, (t, c, sub) in enumerate(stages):
        box(ax, x, 22, 17, 12, t, c, fs=9, bold=True)
        ax.text(x + 8.5, 15, sub, ha="center", va="center", fontsize=8, color="#37474f")
        if i < len(stages) - 1: arrow(ax, x + 17.4, 28, x + 20.6, 28)
        x += 21.3
    ax.text(65, 4, "Typical multinational DS loop (varies by team). Entry roles stress the first three; mid adds the case; senior adds system design & leadership.",
            ha="center", fontsize=9, style="italic")
    save(fig, "fig16_interview_loop.png")


def fig_levels():
    cats = ["Python /\npandas", "SQL", "Statistics\n& A/B", "Classical\nML", "Deep\nlearning", "LLMs /\nGenAI", "MLOps /\ndeployment", "Business &\ncommunication"]
    lv = {"Entry (0–2 yrs)": [3, 3, 2.5, 3, 1.5, 1.5, 1, 2], "Mid (2–5 yrs)": [4, 4, 3.5, 4, 3, 3, 3, 3.5], "Senior (5+ yrs)": [4.5, 4.5, 4.5, 4.5, 4, 4, 4.5, 5]}
    ang = np.linspace(0, 2 * np.pi, len(cats), endpoint=False).tolist(); ang += ang[:1]
    fig = plt.figure(figsize=(6.8, 6.2)); ax = plt.subplot(111, polar=True)
    for (n, v), c in zip(lv.items(), [GREEN, ORANGE, RED]):
        v = v + v[:1]; ax.plot(ang, v, color=c, lw=2, label=n); ax.fill(ang, v, color=c, alpha=0.08)
    ax.set_xticks(ang[:-1]); ax.set_xticklabels(cats, fontsize=8.5); ax.set_yticks([1, 2, 3, 4, 5]); ax.set_yticklabels(["aware", "basic", "solid", "strong", "expert"], fontsize=7)
    ax.set_ylim(0, 5); ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1), fontsize=8)
    ax.set_title("What depth is expected at each level\n(data scientist, telecom / multinational)", fontweight="bold", pad=20)
    save(fig, "fig16_level_expectations.png")


# =====================================================================
# 18 — convolution, IoU
# =====================================================================
def fig_convolution():
    fig, axs = plt.subplots(1, 4, figsize=(15, 3.6))
    img = np.zeros((7, 7)); img[:4, 3:] = 1
    k = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
    out = np.array([[np.sum(img[i:i + 3, j:j + 3] * k) for j in range(5)] for i in range(5)])
    axs[0].imshow(img, cmap="Greys_r"); axs[0].add_patch(Rectangle((0.5, -0.5), 3, 3, fill=False, ec=RED, lw=3))
    axs[0].set_title("Input 7×7 (vertical edge)\nred = 3×3 receptive field")
    axs[1].imshow(k, cmap="coolwarm")
    for i in range(3):
        for j in range(3): axs[1].text(j, i, k[i, j], ha="center", va="center", fontsize=12)
    axs[1].set_title("Filter / kernel 3×3\n(learned weights)")
    axs[2].imshow(out, cmap="viridis")
    for i in range(5):
        for j in range(5): axs[2].text(j, i, int(out[i, j]), ha="center", va="center", color="w", fontsize=9)
    axs[2].set_title("Feature map 5×5\n(stride 1, 'valid' padding)")
    pooled = out.reshape(5, 5)[:4, :4].reshape(2, 2, 2, 2).max(axis=(1, 3))
    axs[3].imshow(pooled, cmap="viridis")
    for i in range(2):
        for j in range(2): axs[3].text(j, i, int(pooled[i, j]), ha="center", va="center", color="w", fontsize=12)
    axs[3].set_title("2×2 max pooling\n(downsample, some invariance)")
    for a in axs: a.set_xticks([]); a.set_yticks([]); a.grid(False)
    fig.suptitle("Output size = ⌊(n + 2p − f) / s⌋ + 1     params per conv layer = (f·f·C_in + 1)·C_out", fontweight="bold", y=1.04)
    save(fig, "fig18_convolution.png")


def fig_iou():
    fig, axs = plt.subplots(1, 3, figsize=(12, 3.4))
    for ax, (dx, dy), in zip(axs, [(0.5, 0.4), (1.5, 1.0), (2.5, 2.2)]):
        ax.set_xlim(0, 8); ax.set_ylim(0, 6); ax.set_aspect("equal"); ax.set_xticks([]); ax.set_yticks([])
        g = (1.5, 1.2, 4, 3); p = (1.5 + dx, 1.2 + dy, 4, 3)
        ax.add_patch(Rectangle(g[:2], g[2], g[3], fill=False, ec=GREEN, lw=2.5)); ax.add_patch(Rectangle(p[:2], p[2], p[3], fill=False, ec=RED, lw=2.5, ls="--"))
        ix = max(0, min(g[0] + g[2], p[0] + p[2]) - max(g[0], p[0])); iy = max(0, min(g[1] + g[3], p[1] + p[3]) - max(g[1], p[1]))
        inter = ix * iy; iou = inter / (2 * 12 - inter)
        ax.add_patch(Rectangle((max(g[0], p[0]), max(g[1], p[1])), ix, iy, fc=ORANGE, alpha=0.4))
        ax.set_title(f"IoU = {iou:.2f}  → {'✓ TP at 0.5' if iou >= 0.5 else '✗ FP at 0.5'}")
    fig.suptitle("Intersection over Union = overlap / union   (green = ground truth, red = prediction)", fontweight="bold", y=1.04)
    save(fig, "fig18_iou.png")


# =====================================================================
# 19 — time series, RNN
# =====================================================================
def fig_timeseries():
    t = np.arange(0, 7 * 20)
    trend = 1000 + 3 * t; season = 180 * np.isin(t % 7, [4, 5]) * -1 + 60 * np.sin(2 * np.pi * t / 7)
    y = trend + season + rng.normal(0, 40, len(t))
    fig, axs = plt.subplots(1, 2, figsize=(14, 3.6))
    axs[0].plot(t, y, color=BLUE, lw=1.2); axs[0].plot(t, trend, "--", color=RED, label="trend")
    axs[0].set_title("Daily traffic of a cell: trend + weekly seasonality + noise"); axs[0].legend(); axs[0].set_xlabel("day")
    split = 120; h = 20
    axs[1].plot(t[:split], y[:split], color=BLUE, label="history"); axs[1].plot(t[split:], y[split:], color="k", label="actual")
    axs[1].plot(t[split:], y[split - 7:split - 7 + h], color=ORANGE, lw=2, label="seasonal naive (same day last week)")
    axs[1].plot(t[split:], np.full(h, y[split - 1]), color=GREY, ls=":", label="naive (last value)")
    axs[1].axvline(split, color=GREY, lw=0.8); axs[1].set_xlim(80, 140); axs[1].legend(fontsize=8)
    axs[1].set_title("Always beat the seasonal-naive baseline first\n(time-ordered split: train on past, test on future)")
    save(fig, "fig19_timeseries.png")


def fig_rnn():
    fig, ax = canvas(12, 3.6)
    box(ax, 2, 12, 10, 10, "RNN\ncell", "blue", bold=True)
    ax.annotate("", xy=(12.5, 21), xytext=(12.5, 13), arrowprops=dict(arrowstyle="->", connectionstyle="arc3,rad=-1.2", lw=1.5))
    ax.text(16, 17, "h", fontsize=10); ax.text(20, 17, "=  unrolled through time  →", fontsize=10, va="center")
    for i in range(4):
        x = 48 + i * 18
        box(ax, x, 12, 10, 10, f"cell\nt={i+1}", "blue")
        arrow(ax, x + 5, 3, x + 5, 11.5); ax.text(x + 5, 0.5, f"x₍{i+1}₎", ha="center")
        arrow(ax, x + 5, 22.5, x + 5, 31); ax.text(x + 5, 32.5, f"ŷ₍{i+1}₎", ha="center")
        if i < 3: arrow(ax, x + 10.5, 17, x + 17.5, 17, f"h₍{i+1}₎")
    ax.text(60, -3.5, "Same weights at every step. Backprop through time multiplies gradients → vanishing → LSTM/GRU gates, or attention.", ha="center", fontsize=8.5, style="italic")
    save(fig, "fig19_rnn_unrolled.png")


# =====================================================================
# 20 — decoding, attention
# =====================================================================
def fig_temperature():
    logits = np.array([3.0, 2.2, 1.5, 0.8, 0.2, -0.5, -1.0])
    words = ["bundle", "package", "plan", "offer", "SIM", "pizza", "zebra"]
    fig, axs = plt.subplots(1, 3, figsize=(14, 3.2), sharey=True)
    for ax, T in zip(axs, [0.3, 1.0, 2.0]):
        p = np.exp(logits / T); p /= p.sum()
        ax.bar(words, p, color=[BLUE] * 5 + [RED] * 2); ax.set_title(f"temperature T = {T}" + ("  (near-greedy)" if T < 1 else ("  (more random)" if T > 1 else "")))
        ax.tick_params(axis="x", rotation=45)
    axs[0].set_ylabel("P(next token)")
    fig.suptitle("“Cancel my data …” — softmax(logits / T). Top-p/top-k then cut off the red tail.", fontweight="bold", y=1.05)
    save(fig, "fig20_temperature.png")


def fig_attention():
    src = ["I", "want", "to", "cancel", "my", "bundle", "<eos>"]
    tgt = ["عايز", "ألغي", "الباقة", "بتاعتي"]
    tgt_lat = ["3ayez (want)", "alghi (cancel)", "el-ba2a (the bundle)", "beta3ti (my)"]
    A = np.array([[0.15, 0.7, 0.05, 0.03, 0.02, 0.03, 0.02], [0.05, 0.05, 0.15, 0.65, 0.03, 0.05, 0.02],
                  [0.02, 0.02, 0.02, 0.06, 0.08, 0.78, 0.02], [0.2, 0.02, 0.01, 0.02, 0.7, 0.03, 0.02]])
    fig, ax = plt.subplots(figsize=(8, 3.6))
    ax.imshow(A, cmap="Blues"); ax.set_xticks(range(len(src))); ax.set_xticklabels(src)
    ax.set_yticks(range(len(tgt))); ax.set_yticklabels(tgt_lat); ax.grid(False)
    for i in range(A.shape[0]):
        for j in range(A.shape[1]): ax.text(j, i, f"{A[i,j]:.2f}", ha="center", va="center", fontsize=7.5, color="w" if A[i, j] > .5 else "k")
    ax.set_title("Attention weights (illustrative): each output word looks at the input words it needs\n(note ‘my’ is attended last — word order differs between languages)", fontsize=9.5)
    save(fig, "fig20_attention_heatmap.png")


# =====================================================================
# 21 — transformer, RAG, LLM training stages
# =====================================================================
def fig_transformer():
    fig, ax = canvas(9, 7.2)
    box(ax, 30, 2, 30, 6, "Token embeddings + positional info", "grey", fs=9)
    arrow(ax, 45, 8.5, 45, 12)
    ax.add_patch(FancyBboxPatch((22, 12), 46, 44, boxstyle="round,pad=0.4", fc="#fafafa", ec=GREY, ls="--"))
    ax.text(70, 34, "× N layers\n(12 in BERT-base,\n32–120+ in LLMs)", fontsize=9, color=GREY, va="center")
    box(ax, 30, 14, 30, 7, "Multi-head self-attention\n(causal mask in decoders)", "blue", fs=9)
    box(ax, 30, 25, 30, 5, "Add & LayerNorm (residual)", "amber", fs=9)
    box(ax, 30, 34, 30, 7, "Feed-forward MLP\n(4× wider, GELU / SwiGLU)", "green", fs=9)
    box(ax, 30, 45, 30, 5, "Add & LayerNorm (residual)", "amber", fs=9)
    for a, b in [(21.5, 24.5), (30.5, 33.5), (41.5, 44.5)]: arrow(ax, 45, a, 45, b)
    arrow(ax, 45, 56.5, 45, 60)
    box(ax, 26, 60, 38, 6, "Linear + softmax → next-token probabilities", "purple", fs=9)
    ax.text(70, 17, "Attention(Q,K,V) =" + chr(10) + "softmax(QKᵀ/√dₖ)·V", fontsize=9, family="monospace", color=BLUE)
    save(fig, "fig21_transformer_block.png")


def fig_rag():
    fig, ax = canvas(13, 5)
    ax.text(3, 46, "OFFLINE — indexing", fontweight="bold", color=EDGE["blue"])
    for i, (t, c) in enumerate([("Docs: tariffs,\nFAQs, policies", "grey"), ("Clean + chunk\n(300–800 tokens)", "blue"), ("Embed chunks\n(e.g. multilingual-e5)", "blue"), ("Vector DB +\nBM25 index", "blue")]):
        box(ax, 3 + i * 26, 32, 20, 10, t, c, fs=8.5)
        if i < 3: arrow(ax, 23.5 + i * 26, 37, 28.5 + i * 26, 37)
    ax.text(3, 24, "ONLINE — each question", fontweight="bold", color=EDGE["green"])
    for i, (t, c) in enumerate([("User question\n(Arabic / English)", "grey"), ("Hybrid retrieve\ntop-k chunks", "green"), ("Rerank\n(cross-encoder)", "green"),
                                ("LLM answers using\nONLY the context + cites", "amber"), ("Guardrails +\nlog + evaluate", "purple")]):
        box(ax, 3 + i * 25.5, 8, 20, 11, t, c, fs=8.5)
        if i < 4: arrow(ax, 23.5 + i * 25.5, 13.5, 28 + i * 25.5, 13.5)
    arrow(ax, 94, 31.5, 38, 19.5, "search", color=GREEN)
    save(fig, "fig21_rag_pipeline.png")


def fig_llm_stages():
    fig, ax = canvas(13, 3.4)
    st = [("1. Pretraining", "grey", "next-token prediction\non trillions of tokens\n→ knowledge"),
          ("2. SFT", "blue", "instruction–answer pairs\n→ format & following"),
          ("3. Preference tuning", "green", "RLHF (reward model + PPO)\nor DPO → helpful, harmless"),
          ("4. RL for reasoning", "amber", "verifiable rewards (GRPO)\n→ long chain-of-thought"),
          ("5. Deploy", "purple", "RAG, tools/agents, guardrails,\nquantise, evaluate")]
    for i, (t, c, s) in enumerate(st):
        box(ax, 2 + i * 26, 18, 21, 9, t, c, fs=9.5, bold=True)
        ax.text(12.5 + i * 26, 9, s, ha="center", va="center", fontsize=8)
        if i < 4: arrow(ax, 23.5 + i * 26, 22.5, 27.5 + i * 26, 22.5)
    save(fig, "fig21_llm_training_stages.png")


# =====================================================================
# 22 — ViT patches, CLIP
# =====================================================================
def fig_vit():
    fig, axs = plt.subplots(1, 3, figsize=(13, 3.6), gridspec_kw={"width_ratios": [1, 1, 2]})
    yy, xx = np.mgrid[0:64, 0:64]
    img = np.sin(xx / 7) + np.cos(yy / 9) + ((xx - 32) ** 2 + (yy - 32) ** 2 < 300)
    axs[0].imshow(img, cmap="viridis"); axs[0].set_title("Image 224×224\n(shown 64×64)")
    axs[1].imshow(img, cmap="viridis")
    for v in range(0, 65, 16): axs[1].axhline(v - .5, color="w", lw=2); axs[1].axvline(v - .5, color="w", lw=2)
    axs[1].set_title("Split into 16×16 patches\n→ 14×14 = 196 patches")
    for a in axs[:2]: a.set_xticks([]); a.set_yticks([]); a.grid(False)
    ax = axs[2]; ax.axis("off"); ax.set_xlim(0, 100); ax.set_ylim(0, 40)
    ax.add_patch(Rectangle((2, 15), 7, 10, fc=LIGHT["red"], ec=RED)); ax.text(5.5, 20, "CLS", ha="center", va="center", fontsize=7)
    for i in range(8):
        ax.add_patch(Rectangle((11 + i * 8, 15), 7, 10, fc=LIGHT["blue"], ec=BLUE)); ax.text(14.5 + i * 8, 20, f"p{i+1}", ha="center", va="center", fontsize=7)
    ax.text(80, 20, "… p196", va="center", fontsize=8)
    ax.text(45, 30, "flatten each patch → linear projection → + position embedding", ha="center", fontsize=8.5)
    ax.text(45, 8, "→ standard Transformer encoder → CLS output → class", ha="center", fontsize=8.5, color=RED)
    ax.set_title("“An image is worth 16×16 words”", fontsize=10)
    save(fig, "fig22_vit_patches.png")


def fig_clip():
    txt = ["a photo of a dog", "a cell tower", "a SIM card", "a phone bill"]
    img = ["🐶 img", "📡 img", "💳 img", "🧾 img"]
    S = np.array([[0.31, 0.12, 0.10, 0.08], [0.11, 0.29, 0.13, 0.09], [0.09, 0.12, 0.30, 0.15], [0.08, 0.10, 0.14, 0.28]])
    fig, ax = plt.subplots(figsize=(6.4, 4.4))
    ax.imshow(S, cmap="Greens"); ax.set_xticks(range(4)); ax.set_xticklabels(txt, rotation=20, fontsize=8.5)
    ax.set_yticks(range(4)); ax.set_yticklabels(["image 1 (dog)", "image 2 (tower)", "image 3 (SIM)", "image 4 (bill)"], fontsize=8.5); ax.grid(False)
    for i in range(4):
        for j in range(4): ax.text(j, i, f"{S[i,j]:.2f}", ha="center", va="center", fontsize=9, fontweight="bold" if i == j else "normal")
    ax.set_title("CLIP: cosine similarity of image and text embeddings\ntraining pushes the diagonal up, everything else down", fontsize=9.5)
    save(fig, "fig22_clip_matrix.png")


# =====================================================================
# 23 — autoencoder, diffusion
# =====================================================================
def fig_autoencoder():
    fig, ax = canvas(12, 4)
    sizes = [30, 20, 10, 4, 10, 20, 30]; xs = [10, 22, 34, 50, 66, 78, 90]
    cols = ["blue", "blue", "blue", "red", "green", "green", "green"]
    for s, x, c in zip(sizes, xs, cols):
        ax.add_patch(Rectangle((x - 3, 20 - s / 2 * 0.6), 6, s * 0.6, fc=LIGHT[c], ec=EDGE[c], lw=1.5))
    ax.text(22, 1, "ENCODER\ncompress", ha="center", fontweight="bold", color=EDGE["blue"])
    ax.text(50, 1, "latent code z\n(bottleneck)", ha="center", fontweight="bold", color=EDGE["red"])
    ax.text(78, 1, "DECODER\nreconstruct", ha="center", fontweight="bold", color=EDGE["green"])
    ax.text(10, 33, "input x", ha="center"); ax.text(90, 33, "x̂ ≈ x", ha="center")
    ax.text(50, 36, "loss = ‖x − x̂‖²   → anomaly score: large reconstruction error = unusual", ha="center", fontsize=9, color=RED)
    save(fig, "fig23_autoencoder.png")


def fig_diffusion():
    T = 1000; beta = np.linspace(1e-4, 0.02, T); abar = np.cumprod(1 - beta)
    s = 0.008; tt = np.arange(T + 1); f = np.cos((tt / T + s) / (1 + s) * np.pi / 2) ** 2; abar_cos = (f / f[0])[1:]
    fig, axs = plt.subplots(1, 6, figsize=(16, 3), gridspec_kw={"width_ratios": [3, 1, 1, 1, 1, 1]})
    axs[0].plot(abar, label="linear β (DDPM)", color=BLUE); axs[0].plot(abar_cos, label="cosine (improved DDPM)", color=ORANGE)
    axs[0].set_xlabel("step t"); axs[0].set_ylabel("ᾱₜ (signal kept)"); axs[0].legend(fontsize=8); axs[0].set_title("Noise schedule")
    yy, xx = np.mgrid[0:48, 0:48]; x0 = (((xx - 24) ** 2 + (yy - 24) ** 2) < 180).astype(float) * 2 - 1
    for ax, t in zip(axs[1:], [0, 100, 300, 600, 999]):
        a = abar[t]; xt = np.sqrt(a) * x0 + np.sqrt(1 - a) * rng.normal(size=x0.shape)
        ax.imshow(xt, cmap="gray"); ax.set_title(f"t = {t}"); ax.set_xticks([]); ax.set_yticks([]); ax.grid(False)
    fig.suptitle("Forward diffusion adds noise: xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε.   The model learns to predict ε, then generation runs right → left.", fontweight="bold", y=1.06)
    save(fig, "fig23_diffusion.png")


# =====================================================================
# 24 — RL loop, discounting, bandits
# =====================================================================
def fig_rl_loop():
    fig, ax = canvas(10, 3.6)
    box(ax, 5, 12, 22, 12, "AGENT\npolicy π(a|s)", "blue", fs=10, bold=True)
    box(ax, 70, 12, 26, 12, "ENVIRONMENT\n(game, network, customers)", "green", fs=10, bold=True)
    ax.add_patch(FancyArrowPatch((27, 22), (70, 22), connectionstyle="arc3,rad=-0.25", arrowstyle="-|>", mutation_scale=15, lw=1.6))
    ax.add_patch(FancyArrowPatch((70, 14), (27, 14), connectionstyle="arc3,rad=-0.25", arrowstyle="-|>", mutation_scale=15, lw=1.6))
    ax.text(48, 31, "action aₜ", ha="center"); ax.text(48, 3, "next state sₜ₊₁ , reward rₜ₊₁", ha="center")
    save(fig, "fig24_rl_loop.png")


def fig_discount():
    n = np.arange(0, 100)
    fig, ax = plt.subplots(figsize=(8, 3.2))
    for g, c in zip([0.5, 0.9, 0.95, 0.99], [RED, ORANGE, GREEN, BLUE]):
        half = np.log(0.5) / np.log(g)
        ax.plot(n, g ** n, color=c, lw=2, label=f"γ = {g}  (half-life ≈ {half:.0f} steps)")
    ax.set_xlabel("steps into the future"); ax.set_ylabel("weight γⁿ"); ax.legend(fontsize=8); ax.set_title("The discount factor sets how far ahead the agent “cares”")
    save(fig, "fig24_discount.png")


def fig_bandit():
    rates = np.array([0.04, 0.05, 0.07]); N = 20000; best = rates.max()
    def run(policy):
        w = np.zeros(3); l = np.zeros(3); regret = np.zeros(N); r2 = np.random.default_rng(1)
        for t in range(N):
            if policy == "ab":
                a = t % 3 if t < 15000 else int(np.argmax(w / np.maximum(w + l, 1)))
            elif policy == "eps":
                a = r2.integers(3) if r2.random() < 0.1 else int(np.argmax((w + 1) / (w + l + 2)))
            else:
                a = int(np.argmax(r2.beta(w + 1, l + 1)))
            rew = r2.random() < rates[a]; w[a] += rew; l[a] += 1 - rew
            regret[t] = best - rates[a]
        return np.cumsum(regret)
    fig, ax = plt.subplots(figsize=(8.5, 3.6))
    for p, n, c in [("ab", "A/B/C test (equal split for 15k users, then ship the winner)", ORANGE), ("eps", "ε-greedy (ε = 0.1)", BLUE), ("ts", "Thompson sampling", GREEN)]:
        ax.plot(run(p), label=n, color=c, lw=2)
    ax.set_xlabel("customers shown an offer"); ax.set_ylabel("cumulative regret\n(expected acceptances lost)"); ax.legend(fontsize=8)
    ax.set_title("Bandits cut the cost of experimenting — three bundles with 4%, 5%, 7% take-up")
    save(fig, "fig24_bandit_regret.png")


# =====================================================================
# 25 — SOTA ladder
# =====================================================================
def fig_sota_ladder():
    fig, ax = canvas(13, 5.2)
    rungs = [("Data + SQL + stats", "green", "pandas, SQL windows, CIs, A/B tests"),
             ("Classical ML", "green", "pipelines, CV, metrics, GBMs, SHAP"),
             ("Deep learning basics", "amber", "PyTorch loop, init, optimisers, regularisation"),
             ("Architectures", "amber", "CNN → RNN → attention → Transformer"),
             ("Foundation models", "red", "BERT/GPT, ViT/CLIP, diffusion, TimesFM"),
             ("Applied GenAI (2025–26)", "red", "RAG, agents + MCP, LoRA, reasoning models, evals")]
    for i, (t, c, s) in enumerate(rungs):
        x = 4 + i * 15; y = 3 + i * 7.5
        box(ax, x, y, 26, 6, t, c, fs=9, bold=True)
        ax.text(x + 28, y + 3, s, va="center", fontsize=8.5, color="#37474f")
    ax.text(4, 49, "Every rung stands on the one below — interviews test the bottom rungs hardest", fontweight="bold", fontsize=10.5)
    save(fig, "fig25_sota_ladder.png")


if __name__ == "__main__":
    for fn in [fig_course_map, fig_broadcasting, fig_groupby, fig_leakage, fig_scalers, fig_chart_gallery,
               fig_gd_lr, fig_bias_variance, fig_kfold, fig_confusion, fig_learning_curves, fig_reg_paths,
               fig_early_stopping, fig_sigmoid, fig_pr_roc, fig_calibration, fig_trees, fig_boosting_stages,
               fig_pca, fig_kmeans_k, fig_cluster_compare, fig_cosine, fig_activations, fig_mlp, fig_vanishing,
               fig_dropout, fig_lr_schedules, fig_joins, fig_capstone, fig_clt, fig_hypothesis, fig_ab_flow,
               fig_interview_loop, fig_levels, fig_convolution, fig_iou, fig_timeseries, fig_rnn, fig_temperature,
               fig_attention, fig_transformer, fig_rag, fig_llm_stages, fig_vit, fig_clip, fig_autoencoder,
               fig_diffusion, fig_rl_loop, fig_discount, fig_bandit, fig_sota_ladder]:
        fn()
