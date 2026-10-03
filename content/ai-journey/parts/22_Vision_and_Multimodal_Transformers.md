# Part 22 — Vision and Multimodal Transformers

<!-- nav -->
> [!example] 🧭 Step 21 of 26 · Stage 6 of 7: Modern AI
> ← [Part 21 · Transformers, LLMs, RAG](21_Transformers_LLMs_RAG_and_Agents.md) · [Part 23 · Generative models](23_Generative_Models_Autoencoders_GANs_Diffusion.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 16** "Vision and Multimodal Transformers". Builds on Part 18 (CNNs) and Part 21 (transformers). **🔭 State of the art** boxes cover 2025–26 vision-language models.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Mostly senior or specialist, but vision-language models now power document AI (bills, IDs, contracts), a realistic telecom use case.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Know that images can be split into patches and fed to a transformer (ViT), and that CLIP matches images to text. |
> | 🟡 **Mid** | ViT vs CNN trade-offs (data needs, inductive bias); how CLIP's contrastive training enables zero-shot classification; using a VLM for extraction. |
> | 🔴 **Senior** | Self-supervised pretraining (DINO/MAE), fusion architectures, evaluating and deploying VLMs. |
>
> **⭐ Most-asked:** *How does a Vision Transformer process an image?* · *ViT vs CNN — when would you pick each?* · *How does CLIP do zero-shot classification?* · *How would you extract fields from scanned bills?*
>
> **⏱ Time:** 2 h  ·  **Short on time?** Read §22.1, §22.3 (CLIP), §22.4.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 22.1 | From CNNs with attention to pure vision transformers | 🟡 | Ch. 16 · pp. 645–652 |
> | 22.2 | Making ViTs data-efficient and dense-prediction-ready | 🔴 | Ch. 16 · pp. 652–663 |
> | 22.3 | Multimodal learning — fusion and alignment | 🔴 | Ch. 16 · pp. 663–691 |
> | 22.4 | Real-world examples | 🟡 | — |
> | 22.5 | Interview drill — vision and multimodal transformers | 🔴 | Ch. 16 · p. 691 |
>

---

## 22.1 From CNNs with attention to pure vision transformers 🟡

> [!info] 📖 Géron Ch. 16 · “Vision Transformers” → “The Original ViT” · pp. 645–652

![ViT: an image becomes a sequence of patch tokens.](figures/fig22_vit_patches.png)
*ViT: an image becomes a sequence of patch tokens.*

**Ancestors:**
- **Visual attention for captioning** ("Show, Attend and Tell", Xu et al., 2015): a CNN produces feature maps, and an RNN decoder with attention generates the caption, looking at the Frisbee region when it writes "Frisbee".
- **Explainability:** attention maps show what the model looked at. Géron recalls Ribeiro et al.'s (2016, **LIME**) *husky vs wolf* case: the classifier had learned "snow ⇒ wolf". Explanations expose shortcut learning. Explainability can also be a **legal requirement** (loan decisions).
- **DETR** (Carion et al., Meta, 2020): CNN features → **transformer encoder–decoder** → a *set* of box predictions, matched to the ground truth with the Hungarian algorithm. No anchors, no NMS: end-to-end detection.

### The original ViT — "An Image Is Worth 16×16 Words" (Dosovitskiy et al., Google, 2020)

1. Chop a 224×224 image into **14×14 = 196 patches** of 16×16×3 = 768 values.
2. **Linearly project** each patch to the model dimension. These are "patch tokens".
3. Prepend a learnable **[CLS] token** and add learnable **positional embeddings**.
4. Run a standard **transformer encoder**, then a classification head on [CLS] (BERT-style).

It beat the state of the art on ImageNet, but needed **~300 million extra training images**. Why? **Inductive bias:** CNNs *assume* locality and translation equivariance; ViTs must *learn* them from data. More built-in assumptions mean less data needed if the assumptions are right, and worse results if they are wrong.

```python
class PatchEmbedding(nn.Module):
    def __init__(self, in_channels, embed_dim, patch_size=16):
        super().__init__()
        # a conv with kernel = stride = patch size ≡ patchify + flatten + linear
        self.conv2d = nn.Conv2d(in_channels, embed_dim,
                                kernel_size=patch_size, stride=patch_size)
    def forward(self, X):
        X = self.conv2d(X)                   # [B, E, H/16, W/16]
        return X.flatten(2).transpose(1, 2)  # [B, L=196, E]

class ViT(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_channels=3, num_classes=1000,
                 embed_dim=768, depth=12, num_heads=12, ff_dim=3072, dropout=0.1):
        super().__init__()
        self.patch_embed = PatchEmbedding(in_channels, embed_dim, patch_size)
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim) * 0.02)
        L = (img_size // patch_size) ** 2
        self.pos_embed = nn.Parameter(torch.randn(1, L + 1, embed_dim) * 0.02)
        self.dropout = nn.Dropout(dropout)
        layer = nn.TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout,
                                           activation="gelu", batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, num_layers=depth)
        self.norm, self.head = nn.LayerNorm(embed_dim), nn.Linear(embed_dim, num_classes)
    def forward(self, X):
        Z = self.patch_embed(X)
        Z = torch.cat([self.cls_token.expand(Z.size(0), -1, -1), Z], dim=1) + self.pos_embed
        Z = self.encoder(self.dropout(Z))
        return self.head(self.norm(Z[:, 0]))       # the [CLS] output
```

**In practice, fine-tune a pretrained ViT** (Hugging Face):

```python
from transformers import ViTForImageClassification, AutoImageProcessor, Trainer, TrainingArguments
from datasets import load_dataset

pets = load_dataset("timm/oxford-iiit-pet")                        # 37 breeds, ~7k images
model_id = "google/vit-base-patch16-224-in21k"                     # pretrained on ImageNet-21k (14M imgs)
model = ViTForImageClassification.from_pretrained(model_id, num_labels=37)   # new head
processor = AutoImageProcessor.from_pretrained(model_id, use_fast=True)

def collate(batch):
    inputs = processor([ex["image"] for ex in batch], return_tensors="pt", do_convert_rgb=True)
    inputs["labels"] = torch.tensor([ex["label"] for ex in batch])
    return inputs

args = TrainingArguments("my_pets_vit", per_device_train_batch_size=16, num_train_epochs=3,
                         eval_strategy="epoch", remove_unused_columns=False)  # keep "image"!
Trainer(model=model, args=args, data_collator=collate,
        train_dataset=pets["train"], eval_dataset=pets["test"]).train()
# ≈ 91.8% after 3 epochs; ~93–95% with augmentation (close to the state of the art)
```

- `do_convert_rgb=True` handles RGBA images in the dataset.
- `remove_unused_columns=False` is needed, or the Trainer drops the "image" column before your collator sees it.

---

## 22.2 Making ViTs data-efficient and dense-prediction-ready 🔴

> [!info] 📖 Géron Ch. 16 · “DeiT”, “PVT”, “Swin”, “DINO”, “Other Major Vision Models” · pp. 652–663

| Model | Year | Key idea | Good for |
|---|---|---|---|
| **DeiT** (Meta) | Dec 2020 | ViT + **distillation token** learning from a frozen CNN teacher's soft targets (the class head uses hard labels). Competitive on **ImageNet alone**, no extra data | Data-efficient ViTs. Fine-tuned DeiT reaches ~94.4% on the pets data in 3 epochs |
| **PVT** (Pyramid ViT) | Feb 2021 | **Hierarchical** (multi-scale feature maps like a CNN: 4×4 then 2×2 patches), with **spatial-reduction attention** (keys and values downsampled, queries not: 3,072 × 48 instead of 3,072² scores, 64× cheaper) | Detection and segmentation backbones |
| **Swin Transformer** (Microsoft) | Mar 2021 | **Window attention** (each patch attends within a 7×7 window) + **shifted windows** every other layer so information crosses windows; cost **linear in image area** (784×49 vs 784² scores). Swin v2 (Nov 2021) scaled it further | A general-purpose vision backbone, including high-resolution images |
| **DINO** (Meta) | Apr 2021 | **Self-distillation with no labels**: the student matches a **momentum (EMA) teacher** across different augmentations and crops. **Centering + sharpening** prevent collapse | **Label-free features.** Attention maps segment objects unsupervised. Nearest-class-mean gives 78.3% on ImageNet |
| **DINOv2** (Meta) | Apr 2023 | Bigger curated data; strong **per-patch** features | A **frozen foundation backbone** for classification, retrieval, depth and segmentation |
| **BEiT** | Jun 2021 | **Masked image modelling** (BERT for images): predict the dVAE tokens of masked patches | Pretraining |
| **MAE** (He et al.) | Nov 2021 | Mask **75%** of patches; a large encoder sees only the visible ones and a light decoder reconstructs pixels. Cheap and scalable | Pretraining at scale |
| Model soups | 2022 | **Average the weights** of several fine-tuned models: ensemble-like gains at no inference cost | Squeezing out accuracy |
| EVA / EVA-02 | 2022–23 | Large MAE-style pretrained ViTs; EVA-02-L (304M) ≈ 90% ImageNet top-1 | Foundation backbones |
| **I-JEPA / V-JEPA** (LeCun, Meta) | 2023–25 | Predict the **embeddings** (not pixels) of masked regions from visible context; EMA teacher | Semantic, efficient self-supervised learning; video world models |
| Scaling ViTs (Google) | 2021 | 2B-parameter ViT at 90.4% top-1; a small ViT reached 84.8% with **10 images per class** | Scaling rules |

**Efficient and specialised ViTs to recognise by name:**
- Mobile: MobileViT, EfficientFormer, EfficientViT, TinyViT.
- Backbones: Twins, FocalNet, MaxViT, InternImage.
- Segmentation: **Mask2Former**, OneFormer, SEEM, **SAM**/MobileSAM.
- Detection: ViTDet, **RT-DETR**.
- Video: TimeSformer, **VideoMAE**.
- Speed-ups: token merging (ToMe), token pruning, early exiting.

> [!success] 🔭 State of the art — which vision backbone in 2025–26?
> For most applied problems: (1) **frozen DINOv2 (or a CLIP/SigLIP encoder) + a small head** as a strong, cheap baseline; (2) fine-tune a **ConvNeXt, EfficientNetV2 or Swin/ViT** from `timm` or Hugging Face if you have labels; (3) CNNs remain the best latency/accuracy choice on edge devices. Choose by data size, latency and the task (classification vs dense prediction).

---

## 22.3 Multimodal learning — fusion and alignment 🔴

> [!info] 📖 Géron Ch. 16 · “Multimodal Transformers” → “Other Multimodal Models” · pp. 663–691

![CLIP's contrastive objective: matching image–text pairs on the diagonal.](figures/fig22_clip_matrix.png)
*CLIP's contrastive objective: matching image–text pairs on the diagonal.*

Humans combine modalities (lip movements + voice; words + eye-rolls = irony). Modalities are **heterogeneous**: continuous or discrete, temporal or spatial, high or low resolution.

- **Fusion:** combining modalities into a shared representation (sum, concatenation, fusion encoders, cross-attention).
- **Alignment:** discovering correspondences between modalities: word timestamps in audio, **visual grounding** ("the dog next to the tree" → a region).

Tasks: captioning, image/video search, **visual question answering (VQA)**, speech-to-text, text-to-speech, **document understanding**, embodied AI and robotics.

**Why transformers fit:** any modality can be chopped into **tokens** (words, patches, audio frames, video clips), and **attention** handles both intra- and cross-modal patterns.

### Milestone models — one line each (Géron's exercise 10)

| Model | Year | One-line idea |
|---|---|---|
| **VideoBERT** (Google) | 2019 | BERT over text + **video tokens** (S3D clip features quantised by **hierarchical k-means** into 12⁴ = 20,736 "visual words"); MLM + linguistic–visual alignment; zero-shot action recognition with "now let me show you how to [MASK] the [MASK]" |
| **ViLBERT** | 2019 | **Dual-stream**: separate text (BERT) and image-region (Faster R-CNN) encoders joined by **co-attention** (each stream's queries attend to the other's keys and values) |
| **CLIP** (OpenAI) | 2021 | **Dual encoders trained contrastively** on **400M image–caption pairs** (batch 32,768): matching pairs pulled together, others pushed apart. Enables **zero-shot classification and cross-modal search** |
| **DALL·E** (OpenAI) | 2021 | A GPT-like model generating **dVAE image tokens** after text tokens. DALL·E 2 (2022): CLIP embedding → diffusion decoder. DALL·E 3 (2023): closed; the prompt is rewritten by GPT-4 |
| **Perceiver** (DeepMind) | 2021 | A modality-agnostic architecture: a **short sequence of latent tokens** cross-attends to raw inputs (pixels, audio samples), so cost is **linear** in input size (the **latent bottleneck**) |
| **Perceiver IO** | 2021 | Adds **output query tokens** that cross-attend to the latents: any output structure (classification, MLM, optical flow, even StarCraft II). Linear in inputs *and* outputs |
| **Flamingo** (DeepMind) | 2022 | Connects a **frozen vision encoder + frozen LLM** via a Perceiver **Resampler** and **gated cross-attention** layers (tanh gates initialised closed); **few-shot visual dialogue** on interleaved image–text |
| **BLIP / BLIP-2** (Salesforce) | 2022–23 | BLIP: **CapFilt** bootstraps a clean dataset (a captioner adds captions, a filter removes noisy ones). BLIP-2: a **Q-Former** (BERT + cross-attention + learned queries) trained with ITM/ITC/LM objectives bridges a frozen ViT and a frozen LLM. Beats Flamingo with a much smaller model |

### CLIP in detail — the single most useful multimodal model to understand

**Training (InfoNCE contrastive loss):**
1. Encode m images and m captions; project both to the same dimension; **ℓ₂-normalise**.
2. Compute the m×m **cosine-similarity matrix**; divide by a **learned temperature**.
3. Row i should "classify" caption i, and column i should classify image i: a **cross-entropy over rows and columns** with the diagonal as targets.
4. Mismatched pairs are pushed toward similarity **≈ 0 (orthogonal), not −1**, since unrelated high-dimensional vectors are nearly orthogonal (Part 9 §9.11).
5. **Large batches** mean many negatives. That was key to CLIP's quality.

**Results:** zero-shot CLIP beat a **linear probe on ResNet-50 features on ~60% of the datasets** tested, including ImageNet, and set a state of the art on Stanford Cars (web images are full of cars). It is **weak on specialised domains** (satellite, medical) and **robust to distribution shifts**.

```python
from transformers import pipeline, CLIPProcessor, CLIPModel
clip = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
clip("https://homl.info/ladybug", candidate_labels=["cricket", "ladybug", "spider"],
     hypothesis_template="This is a photo of a {}.")      # ladybug 99.7%

# Embeddings for search / retrieval:
proc = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
inputs = proc(text=captions, images=[image], return_tensors="pt", padding=True)
out = model(**inputs)
sims = out.image_embeds @ out.text_embeds.T        # already L2-normalised → cosine
probs = (sims * model.logit_scale.exp()).softmax(dim=1)
```

**Uses:** zero-shot classification (prompt templates matter: "a photo of a {}"); **image search by text or image** (embed a photo library, index it with FAISS or a vector DB); duplicate detection; content moderation; guiding generation (DALL·E 2, Stable Diffusion's text encoder). **OpenCLIP** is an open replication with training code.

### Other notable multimodal models (Géron's overview)

LayoutLM (documents: text + layout + image) · GLIP (grounded detection) · Stable Diffusion (text-to-image; Part 23) · OFA, CoCa, PaLI → **PaliGemma** · Kosmos · PaLM-E and **RT-2** (vision-language-action for robots) · **LLaVA** (open visual chat) · ImageBind (6 modalities) · **SeamlessM4T** (speech and text translation, ~100 languages) · **Qwen-VL → Qwen2-VL → Qwen3-Omni** (open, video and audio) · Fuyu · EMO (talking-head video from audio) · GLaMM (text + segmentation masks) · LaViDa (diffusion VLMs). **Commercial:** GPT-4.x/5, Gemini 2.5, Claude 4 and Veo/Sora (video), used via apps or APIs:

```python
from google import genai
client = genai.Client(api_key=api_key)                     # load from a secrets manager
photo = client.files.upload(file="my_cats_photo.jpg")
resp = client.models.generate_content(model="gemini-2.5-flash",
                                      contents=[photo, "What animal and how many? Format: [animal, number]"])
resp.text                                                  # "[cat, 2]"
```

> [!success] 🔭 State of the art — multimodal (2025–26).
> - **Vision-language models (VLMs)** are now standard in frontier and open models (Qwen-VL, Llama vision variants, Gemma 3, InternVL, and GPT/Gemini/Claude). The typical recipe: **a ViT encoder (often SigLIP/CLIP-style) → a projector → an LLM**, trained on interleaved image–text and instruction data.
> - **Document AI:** VLMs increasingly replace OCR + rules for invoices, IDs, forms and screenshots (chart and table understanding).
> - **Speech:** Whisper-style ASR (multilingual, including Arabic) and speech-native ("omni") models that listen and talk in real time.
> - **Embodied AI:** vision-language-action models (RT-2 lineage) for robotics.
> - **Evaluation:** VQA/document benchmarks plus your own domain test sets; hallucinated visual details are the most common failure.

---

## 22.4 Real-world examples 🟡

| Example | Technique |
|---|---|
| **Visual search** ("search your photos for 'beach at sunset'"; retail search by photo) | CLIP-style embeddings + vector index |
| **Content moderation** at social platforms | CLIP/VLM zero-shot plus fine-tuned classifiers |
| **Accessibility:** automatic alt-text and image descriptions for blind users | Captioning VLMs (BLIP-2, GPT/Gemini/Claude vision) |
| **Document processing:** invoices, receipts, KYC documents | LayoutLM → modern VLMs + validation rules |
| **Medical imaging research** (Med-Flamingo, domain CLIPs) | Domain-adapted multimodal models, always with clinical validation |
| **Telecom (e&-relevant)** | **KYC and SIM-registration document checks** (ID extraction + face match + liveness, with strict privacy); **field-engineering photo QA** (VLM checks installation photos against a checklist: "Is the antenna label visible? Is cabling secured?"); **visual troubleshooting in customer care** (customer uploads a router-LED photo → VLM + RAG suggests fixes); **retail-store analytics**; **invoice and contract ingestion** for enterprise billing; **multilingual speech analytics** of call recordings (ASR → sentiment and topic, Part 20) |

---

> [!check] ✅ Key takeaways
> - ViT turns an image into a sequence of patch tokens and applies a transformer encoder.
> - ViTs need more data or better training (DeiT, DINO, MAE) than CNNs, which have built-in locality.
> - CLIP aligns image and text embeddings contrastively → zero-shot classification by text prompts.
> - Vision-language models now power document AI (bills, IDs, contracts).

## 22.5 Interview drill — vision and multimodal transformers (Géron Ch. 16 exercises, answered) 🔴

> [!info] 📖 Géron Ch. 16 · Exercises · p. 691

**1. Describe the original ViT. Why does it matter?** Split the image into 16×16 patches, project them linearly, add [CLS] and positional embeddings, run a transformer encoder, and classify from [CLS]. It showed that a *generic* transformer, with no convolutions, can match or beat CNNs given enough data. That unified vision with NLP architectures and enabled multimodal models.

**2. What are plain (non-hierarchical) ViTs best for, and what are their limits?** Image classification and global representations (and as VLM encoders). Limits: quadratic cost in the number of patches (high resolution is expensive), no multi-scale feature maps (weaker for detection and segmentation), and data hunger (weak inductive biases).

**3. DeiT's main innovation, and does it generalise?** A distillation token trained on a teacher's (CNN's) soft predictions alongside the normal class token. It makes ViTs data-efficient on ImageNet alone. Yes: knowledge distillation from a strong teacher, possibly of a different architecture, applies broadly.

**4. Examples of hierarchical ViTs and their uses?** PVT, Swin (v2), Twins, MaxViT, FocalNet. They produce multi-scale feature maps, so they suit dense prediction: detection, segmentation, depth.

**5. How do PVT and Swin reduce cost on high-resolution images?** PVT uses spatial- reduction attention (downsampled keys and values). Swin restricts attention to local windows (linear in image area) and shifts windows between layers so information still propagates.

**6. How does DINO work? What changed in DINOv2? When to use it?** Self-distillation: a student matches an EMA teacher across different augmented views, with centering and sharpening to prevent collapse. No labels needed. DINOv2 uses a larger curated dataset and strong per-patch features. Use it as a frozen general-purpose backbone when labels are scarce, or for retrieval, clustering and dense tasks.

**7. The objective of JEPA, and how it works?** Learn semantic representations by predicting the *embeddings* of masked parts of the input from the visible context, with an EMA teacher encoder, rather than reconstructing pixels. It is efficient and focuses on meaning, not detail.

**8. What is a multimodal model? Five tasks?** A model that processes or produces several modalities. Captioning, VQA, text-to-image generation, speech recognition or translation, visual grounding, document understanding, video QA.

**9. Fusion and alignment? Why transformers?** Fusion = combining modality information into joint representations. Alignment = finding correspondences between elements across modalities. Transformers tokenise any modality, and (cross-)attention naturally fuses and aligns sequences.

**10. One line each:** see the table in §22.3.

**11. Perceiver IO: double both the input and output length. How much more compute?** About 2× (it is linear in both, thanks to the fixed-size latent bottleneck), versus ~4× for a standard quadratic transformer.

**More that come up:**
- **"Build image search for a product catalogue."** Embed catalogue images with CLIP or DINOv2; index them with FAISS or a vector DB; embed text or image queries; return the nearest neighbours; add metadata filters and a reranker; evaluate recall@k on labelled queries.
- **"Zero-shot CLIP vs a fine-tuned CNN?"** CLIP needs no labels and handles open vocabularies, but is weaker on niche domains. Fine-tuning wins when you have labelled in-domain data. A linear probe on CLIP or DINOv2 features is a strong middle ground.
- **"Why do ViTs need more data than CNNs?"** Fewer inductive biases: they must learn locality and translation invariance from data. Pretraining (supervised or self-supervised) or distillation compensates.

---

## Further reading and sources

**Book:** Géron Ch. 16 + notebook (exercises 12–14: fine-tune a ViT on Food-101 vs zero-shot CLIP; a **CLIP photo search engine** with FAISS; BLIP-2 captioning of your photos. All are great portfolio pieces). Short links for every model: homl.info/<name>.

**Papers:** Xu et al. (2015) Show, Attend and Tell · Ribeiro et al. (2016) LIME · Carion et al. (2020) DETR · Dosovitskiy et al. (2020) ViT · Touvron et al. (2020) DeiT · Wang et al. (2021) PVT · Liu et al. (2021) Swin · Caron et al. (2021) DINO · Oquab et al. (2023) DINOv2 · Bao et al. (2021) BEiT · He et al. (2021) MAE · Radford et al. (2021) **CLIP** · Ramesh et al. (2021, 2022) DALL·E 1/2 · Jaegle et al. (2021) Perceiver / Perceiver IO · Alayrac et al. (2022) Flamingo · Li et al. (2022, 2023) BLIP / BLIP-2 · Liu et al. (2023) LLaVA · Kirillov et al. (2023) SAM.

**Resources:** Hugging Face **Computer Vision Course** and model docs (ViT, CLIP, BLIP-2, SigLIP, PaliGemma, Qwen-VL) · **timm** · **OpenCLIP** · **FAISS** (similarity search) · Lilian Weng's blog posts on contrastive learning and generalised visual language models.

---

<!-- nav -->
> [!example] 🧭 Step 21 of 26 · Stage 6 of 7: Modern AI
> ← [Part 21 · Transformers, LLMs, RAG](21_Transformers_LLMs_RAG_and_Agents.md) · [Part 23 · Generative models](23_Generative_Models_Autoencoders_GANs_Diffusion.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
