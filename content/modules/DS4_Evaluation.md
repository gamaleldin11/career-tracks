# Evaluation and Error Analysis — Validation Design, Metrics, Thresholds, Calibration and Explanations

A model is only as good as the evidence that it works. DS interviews test evaluation more than any algorithm: "how did you validate it?", "why PR-AUC?", "how did you pick the threshold?", "are the probabilities trustworthy?", "where does the model fail?". This module covers validation designs that match how a model will be used, the metrics for classification and regression, decisions from costs, calibration, explanations with SHAP, and the error analysis that tells you what to do next. *AI Journey* Part 8 has worked figures for ROC, PR curves and calibration.

> [!focus]
> **Entry must:** explain train, validation and test sets; use cross-validation correctly; read a confusion matrix; define precision, recall, F1 and ROC-AUC; choose MAE vs RMSE; explain why accuracy misleads on imbalanced data.
> **Mid adds:** time-based and grouped validation, PR-AUC vs ROC-AUC, threshold choice from costs, precision@k and lift, calibration, SHAP and permutation importance (and their limits), slice-based error analysis, comparing models with uncertainty.
> **Most asked:** *Precision vs recall?* · *ROC-AUC vs PR-AUC?* · *How do you choose a threshold?* · *What is calibration?* · *How do you validate a time-dependent model?* · *How do you explain a prediction?* · *MAE or RMSE?*
> **Time budget:** 3.5 hours.

## DS4.0 Foundations: scores, thresholds and four outcomes 🟢

Most classifiers don't output "yes" or "no". They output a **score** (often a probability), and a **threshold** turns the score into a decision. Every case then lands in one of four boxes: correctly flagged (**true positive**), wrongly flagged (**false positive**), wrongly passed (**false negative**) or correctly passed (**true negative**).

Moving the threshold doesn't change the model; it trades one kind of error for the other. That single idea explains precision, recall, ROC and PR curves, and threshold choice, which is most of this module.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 236" role="img" aria-label="Score distributions of negatives and positives with a threshold; moving the threshold from 0.35 to 0.5 to 0.65 trades false positives for false negatives, raising precision and lowering recall">
<line class="sLm" x1="40" y1="190" x2="448" y2="190" marker-end="url(#ahm)"/>
<text class="sC" x="40" y="208" text-anchor="middle">0</text>
<text class="sC" x="240" y="208" text-anchor="middle">0.5</text>
<text class="sC" x="440" y="208" text-anchor="middle">1</text>
<text class="sC" x="240" y="226" text-anchor="middle">model score</text>
<polyline class="sLm" points="40.0,183.1 44.0,181.8 48.0,180.3 52.0,178.6 56.0,176.6 60.0,174.4 64.0,172.0 68.0,169.3 72.0,166.4 76.0,163.2 80.0,159.7 84.0,156.0 88.0,152.1 92.0,148.0 96.0,143.7 100.0,139.2 104.0,134.7 108.0,130.1 112.0,125.5 116.0,120.9 120.0,116.5 124.0,112.2 128.0,108.2 132.0,104.5 136.0,101.2 140.0,98.2 144.0,95.8 148.0,93.8 152.0,92.3 156.0,91.5 160.0,91.2 164.0,91.5 168.0,92.3 172.0,93.8 176.0,95.8 180.0,98.2 184.0,101.2 188.0,104.5 192.0,108.2 196.0,112.2 200.0,116.5 204.0,120.9 208.0,125.5 212.0,130.1 216.0,134.7 220.0,139.2 224.0,143.7 228.0,148.0 232.0,152.1 236.0,156.0 240.0,159.7 244.0,163.2 248.0,166.4 252.0,169.3 256.0,172.0 260.0,174.4 264.0,176.6 268.0,178.6 272.0,180.3 276.0,181.8 280.0,183.1 284.0,184.2 288.0,185.2 292.0,186.1 296.0,186.8 300.0,187.4 304.0,187.9 308.0,188.3 312.0,188.6 316.0,188.9 320.0,189.1 324.0,189.3 328.0,189.5 332.0,189.6 336.0,189.7 340.0,189.8 344.0,189.8 348.0,189.9 352.0,189.9 356.0,189.9 360.0,189.9 364.0,190.0 368.0,190.0 372.0,190.0 376.0,190.0 380.0,190.0 384.0,190.0 388.0,190.0 392.0,190.0 396.0,190.0 400.0,190.0 404.0,190.0 408.0,190.0 412.0,190.0 416.0,190.0 420.0,190.0 424.0,190.0 428.0,190.0 432.0,190.0 436.0,190.0 440.0,190.0" fill="none" stroke-width="1.5"/><polyline class="sLg" points="40.0,190.0 44.0,190.0 48.0,190.0 52.0,190.0 56.0,190.0 60.0,190.0 64.0,190.0 68.0,190.0 72.0,190.0 76.0,190.0 80.0,190.0 84.0,190.0 88.0,190.0 92.0,190.0 96.0,189.9 100.0,189.9 104.0,189.9 108.0,189.9 112.0,189.9 116.0,189.8 120.0,189.8 124.0,189.7 128.0,189.7 132.0,189.6 136.0,189.5 140.0,189.4 144.0,189.3 148.0,189.1 152.0,189.0 156.0,188.8 160.0,188.5 164.0,188.2 168.0,187.9 172.0,187.6 176.0,187.2 180.0,186.7 184.0,186.2 188.0,185.7 192.0,185.0 196.0,184.3 200.0,183.6 204.0,182.7 208.0,181.8 212.0,180.8 216.0,179.8 220.0,178.7 224.0,177.5 228.0,176.2 232.0,174.9 236.0,173.5 240.0,172.1 244.0,170.7 248.0,169.2 252.0,167.7 256.0,166.3 260.0,164.8 264.0,163.3 268.0,162.0 272.0,160.6 276.0,159.3 280.0,158.2 284.0,157.1 288.0,156.1 292.0,155.3 296.0,154.6 300.0,154.0 304.0,153.6 308.0,153.4 312.0,153.3 316.0,153.4 320.0,153.6 324.0,154.0 328.0,154.6 332.0,155.3 336.0,156.1 340.0,157.1 344.0,158.2 348.0,159.3 352.0,160.6 356.0,162.0 360.0,163.3 364.0,164.8 368.0,166.3 372.0,167.7 376.0,169.2 380.0,170.7 384.0,172.1 388.0,173.5 392.0,174.9 396.0,176.2 400.0,177.5 404.0,178.7 408.0,179.8 412.0,180.8 416.0,181.8 420.0,182.7 424.0,183.6 428.0,184.3 432.0,185.0 436.0,185.7 440.0,186.2" fill="none" stroke-width="1.5"/>
<text class="sC" x="112" y="83.1851" text-anchor="middle">negatives (700)</text><text class="sGt" x="384" y="143.297" text-anchor="middle">positives (300)</text>
<g data-s="1-1"><polygon class="sN" opacity="1" points="40.0,190.0 40.0,183.1 44.0,181.8 48.0,180.3 52.0,178.6 56.0,176.6 60.0,174.4 64.0,172.0 68.0,169.3 72.0,166.4 76.0,163.2 80.0,159.7 84.0,156.0 88.0,152.1 92.0,148.0 96.0,143.7 100.0,139.2 104.0,134.7 108.0,130.1 112.0,125.5 116.0,120.9 120.0,116.5 124.0,112.2 128.0,108.2 132.0,104.5 136.0,101.2 140.0,98.2 144.0,95.8 148.0,93.8 152.0,92.3 156.0,91.5 160.0,91.2 164.0,91.5 168.0,92.3 172.0,93.8 176.0,95.8 180.0,98.2 180.0,190.0"/><polygon class="sR" opacity="0.55" points="180.0,190.0 180.0,98.2 184.0,101.2 188.0,104.5 192.0,108.2 196.0,112.2 200.0,116.5 204.0,120.9 208.0,125.5 212.0,130.1 216.0,134.7 220.0,139.2 224.0,143.7 228.0,148.0 232.0,152.1 236.0,156.0 240.0,159.7 244.0,163.2 248.0,166.4 252.0,169.3 256.0,172.0 260.0,174.4 264.0,176.6 268.0,178.6 272.0,180.3 276.0,181.8 280.0,183.1 284.0,184.2 288.0,185.2 292.0,186.1 296.0,186.8 300.0,187.4 304.0,187.9 308.0,188.3 312.0,188.6 316.0,188.9 320.0,189.1 324.0,189.3 328.0,189.5 332.0,189.6 336.0,189.7 340.0,189.8 344.0,189.8 348.0,189.9 352.0,189.9 356.0,189.9 360.0,189.9 364.0,190.0 368.0,190.0 372.0,190.0 376.0,190.0 380.0,190.0 384.0,190.0 388.0,190.0 392.0,190.0 396.0,190.0 400.0,190.0 404.0,190.0 408.0,190.0 412.0,190.0 416.0,190.0 420.0,190.0 424.0,190.0 428.0,190.0 432.0,190.0 436.0,190.0 440.0,190.0 440.0,190.0"/><polygon class="sW" opacity="0.6" points="40.0,190.0 40.0,190.0 44.0,190.0 48.0,190.0 52.0,190.0 56.0,190.0 60.0,190.0 64.0,190.0 68.0,190.0 72.0,190.0 76.0,190.0 80.0,190.0 84.0,190.0 88.0,190.0 92.0,190.0 96.0,189.9 100.0,189.9 104.0,189.9 108.0,189.9 112.0,189.9 116.0,189.8 120.0,189.8 124.0,189.7 128.0,189.7 132.0,189.6 136.0,189.5 140.0,189.4 144.0,189.3 148.0,189.1 152.0,189.0 156.0,188.8 160.0,188.5 164.0,188.2 168.0,187.9 172.0,187.6 176.0,187.2 180.0,186.7 180.0,190.0"/><polygon class="sG" opacity="0.6" points="180.0,190.0 180.0,186.7 184.0,186.2 188.0,185.7 192.0,185.0 196.0,184.3 200.0,183.6 204.0,182.7 208.0,181.8 212.0,180.8 216.0,179.8 220.0,178.7 224.0,177.5 228.0,176.2 232.0,174.9 236.0,173.5 240.0,172.1 244.0,170.7 248.0,169.2 252.0,167.7 256.0,166.3 260.0,164.8 264.0,163.3 268.0,162.0 272.0,160.6 276.0,159.3 280.0,158.2 284.0,157.1 288.0,156.1 292.0,155.3 296.0,154.6 300.0,154.0 304.0,153.6 308.0,153.4 312.0,153.3 316.0,153.4 320.0,153.6 324.0,154.0 328.0,154.6 332.0,155.3 336.0,156.1 340.0,157.1 344.0,158.2 348.0,159.3 352.0,160.6 356.0,162.0 360.0,163.3 364.0,164.8 368.0,166.3 372.0,167.7 376.0,169.2 380.0,170.7 384.0,172.1 388.0,173.5 392.0,174.9 396.0,176.2 400.0,177.5 404.0,178.7 408.0,179.8 412.0,180.8 416.0,181.8 420.0,182.7 424.0,183.6 428.0,184.3 432.0,185.0 436.0,185.7 440.0,186.2 440.0,190.0"/><line class="sLr" x1="180" y1="30" x2="180" y2="194" stroke-width="2.5"/><text class="sRt" x="180" y="24" text-anchor="middle">threshold 0.35</text><rect class="sG" x="480" y="40" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="532" y="60" text-anchor="middle">TP</text><text class="sC" x="532" y="78" text-anchor="middle">296</text><rect class="sW" x="590" y="40" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="642" y="60" text-anchor="middle">FN</text><text class="sC" x="642" y="78" text-anchor="middle">4</text><rect class="sR" x="480" y="92" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="532" y="112" text-anchor="middle">FP</text><text class="sC" x="532" y="130" text-anchor="middle">245</text><rect class="sN" x="590" y="92" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="642" y="112" text-anchor="middle">TN</text><text class="sC" x="642" y="130" text-anchor="middle">455</text><text class="sC" x="530" y="34" text-anchor="middle">flagged</text><text class="sC" x="642" y="34" text-anchor="middle">not flagged</text><text class="sT" x="536" y="172" text-anchor="middle">precision 55%</text><text class="sT" x="650" y="172" text-anchor="middle">recall 99%</text></g>
<g data-s="2-2"><polygon class="sN" opacity="1" points="40.0,190.0 40.0,183.1 44.0,181.8 48.0,180.3 52.0,178.6 56.0,176.6 60.0,174.4 64.0,172.0 68.0,169.3 72.0,166.4 76.0,163.2 80.0,159.7 84.0,156.0 88.0,152.1 92.0,148.0 96.0,143.7 100.0,139.2 104.0,134.7 108.0,130.1 112.0,125.5 116.0,120.9 120.0,116.5 124.0,112.2 128.0,108.2 132.0,104.5 136.0,101.2 140.0,98.2 144.0,95.8 148.0,93.8 152.0,92.3 156.0,91.5 160.0,91.2 164.0,91.5 168.0,92.3 172.0,93.8 176.0,95.8 180.0,98.2 184.0,101.2 188.0,104.5 192.0,108.2 196.0,112.2 200.0,116.5 204.0,120.9 208.0,125.5 212.0,130.1 216.0,134.7 220.0,139.2 224.0,143.7 228.0,148.0 232.0,152.1 236.0,156.0 240.0,159.7 240.0,190.0"/><polygon class="sR" opacity="0.55" points="240.0,190.0 240.0,159.7 244.0,163.2 248.0,166.4 252.0,169.3 256.0,172.0 260.0,174.4 264.0,176.6 268.0,178.6 272.0,180.3 276.0,181.8 280.0,183.1 284.0,184.2 288.0,185.2 292.0,186.1 296.0,186.8 300.0,187.4 304.0,187.9 308.0,188.3 312.0,188.6 316.0,188.9 320.0,189.1 324.0,189.3 328.0,189.5 332.0,189.6 336.0,189.7 340.0,189.8 344.0,189.8 348.0,189.9 352.0,189.9 356.0,189.9 360.0,189.9 364.0,190.0 368.0,190.0 372.0,190.0 376.0,190.0 380.0,190.0 384.0,190.0 388.0,190.0 392.0,190.0 396.0,190.0 400.0,190.0 404.0,190.0 408.0,190.0 412.0,190.0 416.0,190.0 420.0,190.0 424.0,190.0 428.0,190.0 432.0,190.0 436.0,190.0 440.0,190.0 440.0,190.0"/><polygon class="sW" opacity="0.6" points="40.0,190.0 40.0,190.0 44.0,190.0 48.0,190.0 52.0,190.0 56.0,190.0 60.0,190.0 64.0,190.0 68.0,190.0 72.0,190.0 76.0,190.0 80.0,190.0 84.0,190.0 88.0,190.0 92.0,190.0 96.0,189.9 100.0,189.9 104.0,189.9 108.0,189.9 112.0,189.9 116.0,189.8 120.0,189.8 124.0,189.7 128.0,189.7 132.0,189.6 136.0,189.5 140.0,189.4 144.0,189.3 148.0,189.1 152.0,189.0 156.0,188.8 160.0,188.5 164.0,188.2 168.0,187.9 172.0,187.6 176.0,187.2 180.0,186.7 184.0,186.2 188.0,185.7 192.0,185.0 196.0,184.3 200.0,183.6 204.0,182.7 208.0,181.8 212.0,180.8 216.0,179.8 220.0,178.7 224.0,177.5 228.0,176.2 232.0,174.9 236.0,173.5 240.0,172.1 240.0,190.0"/><polygon class="sG" opacity="0.6" points="240.0,190.0 240.0,172.1 244.0,170.7 248.0,169.2 252.0,167.7 256.0,166.3 260.0,164.8 264.0,163.3 268.0,162.0 272.0,160.6 276.0,159.3 280.0,158.2 284.0,157.1 288.0,156.1 292.0,155.3 296.0,154.6 300.0,154.0 304.0,153.6 308.0,153.4 312.0,153.3 316.0,153.4 320.0,153.6 324.0,154.0 328.0,154.6 332.0,155.3 336.0,156.1 340.0,157.1 344.0,158.2 348.0,159.3 352.0,160.6 356.0,162.0 360.0,163.3 364.0,164.8 368.0,166.3 372.0,167.7 376.0,169.2 380.0,170.7 384.0,172.1 388.0,173.5 392.0,174.9 396.0,176.2 400.0,177.5 404.0,178.7 408.0,179.8 412.0,180.8 416.0,181.8 420.0,182.7 424.0,183.6 428.0,184.3 432.0,185.0 436.0,185.7 440.0,186.2 440.0,190.0"/><line class="sLr" x1="240" y1="30" x2="240" y2="194" stroke-width="2.5"/><text class="sRt" x="240" y="24" text-anchor="middle">threshold 0.5</text><rect class="sG" x="480" y="40" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="532" y="60" text-anchor="middle">TP</text><text class="sC" x="532" y="78" text-anchor="middle">265</text><rect class="sW" x="590" y="40" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="642" y="60" text-anchor="middle">FN</text><text class="sC" x="642" y="78" text-anchor="middle">35</text><rect class="sR" x="480" y="92" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="532" y="112" text-anchor="middle">FP</text><text class="sC" x="532" y="130" text-anchor="middle">43</text><rect class="sN" x="590" y="92" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="642" y="112" text-anchor="middle">TN</text><text class="sC" x="642" y="130" text-anchor="middle">657</text><text class="sC" x="530" y="34" text-anchor="middle">flagged</text><text class="sC" x="642" y="34" text-anchor="middle">not flagged</text><text class="sT" x="536" y="172" text-anchor="middle">precision 86%</text><text class="sT" x="650" y="172" text-anchor="middle">recall 88%</text></g>
<g data-s="3-3"><polygon class="sN" opacity="1" points="40.0,190.0 40.0,183.1 44.0,181.8 48.0,180.3 52.0,178.6 56.0,176.6 60.0,174.4 64.0,172.0 68.0,169.3 72.0,166.4 76.0,163.2 80.0,159.7 84.0,156.0 88.0,152.1 92.0,148.0 96.0,143.7 100.0,139.2 104.0,134.7 108.0,130.1 112.0,125.5 116.0,120.9 120.0,116.5 124.0,112.2 128.0,108.2 132.0,104.5 136.0,101.2 140.0,98.2 144.0,95.8 148.0,93.8 152.0,92.3 156.0,91.5 160.0,91.2 164.0,91.5 168.0,92.3 172.0,93.8 176.0,95.8 180.0,98.2 184.0,101.2 188.0,104.5 192.0,108.2 196.0,112.2 200.0,116.5 204.0,120.9 208.0,125.5 212.0,130.1 216.0,134.7 220.0,139.2 224.0,143.7 228.0,148.0 232.0,152.1 236.0,156.0 240.0,159.7 244.0,163.2 248.0,166.4 252.0,169.3 256.0,172.0 260.0,174.4 264.0,176.6 268.0,178.6 272.0,180.3 276.0,181.8 280.0,183.1 284.0,184.2 288.0,185.2 292.0,186.1 296.0,186.8 300.0,187.4 300.0,190.0"/><polygon class="sR" opacity="0.55" points="300.0,190.0 300.0,187.4 304.0,187.9 308.0,188.3 312.0,188.6 316.0,188.9 320.0,189.1 324.0,189.3 328.0,189.5 332.0,189.6 336.0,189.7 340.0,189.8 344.0,189.8 348.0,189.9 352.0,189.9 356.0,189.9 360.0,189.9 364.0,190.0 368.0,190.0 372.0,190.0 376.0,190.0 380.0,190.0 384.0,190.0 388.0,190.0 392.0,190.0 396.0,190.0 400.0,190.0 404.0,190.0 408.0,190.0 412.0,190.0 416.0,190.0 420.0,190.0 424.0,190.0 428.0,190.0 432.0,190.0 436.0,190.0 440.0,190.0 440.0,190.0"/><polygon class="sW" opacity="0.6" points="40.0,190.0 40.0,190.0 44.0,190.0 48.0,190.0 52.0,190.0 56.0,190.0 60.0,190.0 64.0,190.0 68.0,190.0 72.0,190.0 76.0,190.0 80.0,190.0 84.0,190.0 88.0,190.0 92.0,190.0 96.0,189.9 100.0,189.9 104.0,189.9 108.0,189.9 112.0,189.9 116.0,189.8 120.0,189.8 124.0,189.7 128.0,189.7 132.0,189.6 136.0,189.5 140.0,189.4 144.0,189.3 148.0,189.1 152.0,189.0 156.0,188.8 160.0,188.5 164.0,188.2 168.0,187.9 172.0,187.6 176.0,187.2 180.0,186.7 184.0,186.2 188.0,185.7 192.0,185.0 196.0,184.3 200.0,183.6 204.0,182.7 208.0,181.8 212.0,180.8 216.0,179.8 220.0,178.7 224.0,177.5 228.0,176.2 232.0,174.9 236.0,173.5 240.0,172.1 244.0,170.7 248.0,169.2 252.0,167.7 256.0,166.3 260.0,164.8 264.0,163.3 268.0,162.0 272.0,160.6 276.0,159.3 280.0,158.2 284.0,157.1 288.0,156.1 292.0,155.3 296.0,154.6 300.0,154.0 300.0,190.0"/><polygon class="sG" opacity="0.6" points="300.0,190.0 300.0,154.0 304.0,153.6 308.0,153.4 312.0,153.3 316.0,153.4 320.0,153.6 324.0,154.0 328.0,154.6 332.0,155.3 336.0,156.1 340.0,157.1 344.0,158.2 348.0,159.3 352.0,160.6 356.0,162.0 360.0,163.3 364.0,164.8 368.0,166.3 372.0,167.7 376.0,169.2 380.0,170.7 384.0,172.1 388.0,173.5 392.0,174.9 396.0,176.2 400.0,177.5 404.0,178.7 408.0,179.8 412.0,180.8 416.0,181.8 420.0,182.7 424.0,183.6 428.0,184.3 432.0,185.0 436.0,185.7 440.0,186.2 440.0,190.0"/><line class="sLr" x1="300" y1="30" x2="300" y2="194" stroke-width="2.5"/><text class="sRt" x="300" y="24" text-anchor="middle">threshold 0.65</text><rect class="sG" x="480" y="40" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="532" y="60" text-anchor="middle">TP</text><text class="sC" x="532" y="78" text-anchor="middle">174</text><rect class="sW" x="590" y="40" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="642" y="60" text-anchor="middle">FN</text><text class="sC" x="642" y="78" text-anchor="middle">126</text><rect class="sR" x="480" y="92" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="532" y="112" text-anchor="middle">FP</text><text class="sC" x="532" y="130" text-anchor="middle">2</text><rect class="sN" x="590" y="92" width="104" height="46" rx="6" opacity=".75"/><text class="sT" x="642" y="112" text-anchor="middle">TN</text><text class="sC" x="642" y="130" text-anchor="middle">698</text><text class="sC" x="530" y="34" text-anchor="middle">flagged</text><text class="sC" x="642" y="34" text-anchor="middle">not flagged</text><text class="sT" x="536" y="172" text-anchor="middle">precision 99%</text><text class="sT" x="650" y="172" text-anchor="middle">recall 58%</text></g>
</svg><ol class="dia-steps">
<li>A model gives each case a <b>score</b>; a threshold turns scores into decisions. At 0.35 almost every positive is flagged (high recall), but so are many negatives: lots of false alarms.</li>
<li>At 0.5 the trade is more balanced. Nothing about the model changed, only the decision rule.</li>
<li>At 0.65 flagged cases are mostly right (high precision), but many positives are missed. Where to stand depends on what each kind of error costs (DS4.4).</li>
</ol><figcaption>Precision, recall and the confusion matrix are all properties of a threshold. Curves like ROC and PR sweep it across every value.</figcaption></figure>

## DS4.1 Train, validation and test 🟢 ⭐

| Set | Purpose | Touched |
|---|---|---|
| **Training** | Fit the model's parameters | Constantly |
| **Validation** (or cross-validation folds) | Choose features, models, hyperparameters, thresholds | Many times |
| **Test** | One honest estimate of future performance | **Once**, at the end |

Every decision made by looking at a set leaks a little information from it, so a test set used repeatedly stops being a test set.

## DS4.2 Validation designs 🟢 🟡 ⭐

**Validate the way the model will be used.**

| Design | How | Use when |
|---|---|---|
| **k-fold** | Split into k folds; train on k−1, validate on 1, rotate | Independent rows, no time order |
| **Stratified k-fold** | Each fold keeps the class proportions | Classification, especially imbalanced |
| **Group k-fold** | All rows of one entity (customer, patient, store) stay in the same fold | Entities appear many times ([[DS2.4]]) |
| **Time-series split / rolling origin** | Train on data up to time t, validate on the next period; move t forward | **Anything predicting the future**: churn, demand, credit |
| **Out-of-time test** | Hold out the most recent period entirely | Final check that performance survives time |
| **Nested CV** | An inner loop for tuning inside an outer loop for evaluation | Small datasets where you need an unbiased estimate after tuning |

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="Rows from three customers split randomly put the same customers in train and test; a group split keeps each customer's rows on one side">
<text class="sRt" x="180" y="20" text-anchor="middle">random rows</text>
<rect class="sA" x="30" y="50" width="26" height="26" rx="4"/><text class="sT" x="43" y="68" text-anchor="middle">A</text>
<rect class="sA" x="240" y="50" width="26" height="26" rx="4"/><text class="sT" x="253" y="68" text-anchor="middle">A</text>
<rect class="sA" x="90" y="50" width="26" height="26" rx="4"/><text class="sT" x="103" y="68" text-anchor="middle">A</text>
<rect class="sA" x="120" y="50" width="26" height="26" rx="4"/><text class="sT" x="133" y="68" text-anchor="middle">A</text>
<rect class="sV" x="30" y="90" width="26" height="26" rx="4"/><text class="sT" x="43" y="108" text-anchor="middle">B</text>
<rect class="sV" x="60" y="90" width="26" height="26" rx="4"/><text class="sT" x="73" y="108" text-anchor="middle">B</text>
<rect class="sV" x="270" y="90" width="26" height="26" rx="4"/><text class="sT" x="283" y="108" text-anchor="middle">B</text>
<rect class="sV" x="120" y="90" width="26" height="26" rx="4"/><text class="sT" x="133" y="108" text-anchor="middle">B</text>
<rect class="sG" x="210" y="130" width="26" height="26" rx="4"/><text class="sT" x="223" y="148" text-anchor="middle">C</text>
<rect class="sG" x="60" y="130" width="26" height="26" rx="4"/><text class="sT" x="73" y="148" text-anchor="middle">C</text>
<rect class="sG" x="90" y="130" width="26" height="26" rx="4"/><text class="sT" x="103" y="148" text-anchor="middle">C</text>
<rect class="sG" x="120" y="130" width="26" height="26" rx="4"/><text class="sT" x="133" y="148" text-anchor="middle">C</text>
<text class="sT" x="90" y="180" text-anchor="middle">train</text><text class="sT" x="270" y="180" text-anchor="middle">test</text>
<line class="sD" x1="180" y1="40" x2="180" y2="166"/>
<text class="sGt" x="540" y="20" text-anchor="middle">group k-fold by customer</text>
<rect class="sA" x="390" y="50" width="26" height="26" rx="4"/><text class="sT" x="403" y="68" text-anchor="middle">A</text>
<rect class="sA" x="420" y="50" width="26" height="26" rx="4"/><text class="sT" x="433" y="68" text-anchor="middle">A</text>
<rect class="sA" x="450" y="50" width="26" height="26" rx="4"/><text class="sT" x="463" y="68" text-anchor="middle">A</text>
<rect class="sA" x="480" y="50" width="26" height="26" rx="4"/><text class="sT" x="493" y="68" text-anchor="middle">A</text>
<rect class="sV" x="390" y="90" width="26" height="26" rx="4"/><text class="sT" x="403" y="108" text-anchor="middle">B</text>
<rect class="sV" x="420" y="90" width="26" height="26" rx="4"/><text class="sT" x="433" y="108" text-anchor="middle">B</text>
<rect class="sV" x="450" y="90" width="26" height="26" rx="4"/><text class="sT" x="463" y="108" text-anchor="middle">B</text>
<rect class="sV" x="480" y="90" width="26" height="26" rx="4"/><text class="sT" x="493" y="108" text-anchor="middle">B</text>
<rect class="sG" x="570" y="130" width="26" height="26" rx="4"/><text class="sT" x="583" y="148" text-anchor="middle">C</text>
<rect class="sG" x="600" y="130" width="26" height="26" rx="4"/><text class="sT" x="613" y="148" text-anchor="middle">C</text>
<rect class="sG" x="630" y="130" width="26" height="26" rx="4"/><text class="sT" x="643" y="148" text-anchor="middle">C</text>
<rect class="sG" x="660" y="130" width="26" height="26" rx="4"/><text class="sT" x="673" y="148" text-anchor="middle">C</text>
<text class="sT" x="450" y="180" text-anchor="middle">train</text><text class="sT" x="630" y="180" text-anchor="middle">test</text>
<line class="sD" x1="540" y1="40" x2="540" y2="166"/>
<text class="sRt" x="180" y="206" text-anchor="middle">the same customers on both sides</text><text class="sGt" x="540" y="206" text-anchor="middle">test customers are truly new</text>
</svg><figcaption>When an entity appears many times, split by entity, or the score measures memory of those customers instead of skill on new ones.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 150" role="img" aria-label="Rolling-origin time series validation folds">
<text class="sS" x="10" y="20">time →</text>
<g>
<rect class="sA" x="80" y="30" width="200" height="18" rx="3"/><rect class="sW" x="280" y="30" width="60" height="18" rx="3"/>
<rect class="sA" x="80" y="56" width="260" height="18" rx="3"/><rect class="sW" x="340" y="56" width="60" height="18" rx="3"/>
<rect class="sA" x="80" y="82" width="320" height="18" rx="3"/><rect class="sW" x="400" y="82" width="60" height="18" rx="3"/>
<rect class="sA" x="80" y="108" width="380" height="18" rx="3"/><rect class="sW" x="460" y="108" width="60" height="18" rx="3"/>
<rect class="sR" x="560" y="30" width="80" height="96" rx="3"/>
</g>
<text class="sS" x="10" y="44">fold 1</text><text class="sS" x="10" y="70">fold 2</text><text class="sS" x="10" y="96">fold 3</text><text class="sS" x="10" y="122">fold 4</text>
<text class="sM" x="600" y="146" text-anchor="middle">final test</text>
<text class="sM" x="200" y="146">train (blue) · validate (amber)</text>
</svg><figcaption>Rolling-origin validation: always train on the past and validate on the next period, then a final out-of-time test.</figcaption></figure>

> [!say]
> "Because the model predicts the future, I validate with rolling time-based folds, always training on the past and scoring the next period, keeping the same customer within one fold, and I hold out the most recent months as a final out-of-time test. A random split would let the model learn from the future and overstate performance."

## DS4.3 Classification metrics 🟢 ⭐

| | Predicted positive | Predicted negative |
|---|---|---|
| **Actually positive** | True positive (TP) | False negative (FN) |
| **Actually negative** | False positive (FP) | True negative (TN) |

| Metric | Formula | Answers |
|---|---|---|
| Accuracy | (TP+TN) ÷ all | Share correct; **misleading under imbalance** |
| **Precision** | TP ÷ (TP+FP) | Of those we flagged, how many were right? |
| **Recall** (sensitivity, TPR) | TP ÷ (TP+FN) | Of the real positives, how many did we catch? |
| Specificity | TN ÷ (TN+FP) | Of the real negatives, how many did we leave alone? |
| **F1** | Harmonic mean of precision and recall | A single balance of the two |
| **ROC-AUC** | Area under the TPR vs FPR curve across thresholds | Probability a random positive is ranked above a random negative |
| **PR-AUC** (average precision) | Area under precision vs recall | Ranking quality **focused on the positives**: better for rare events |
| Log loss | −mean of log of the probability given to the true class | Quality of the **probabilities** themselves |
| Brier score | Mean squared error of probabilities | Probability quality; decomposes into calibration and refinement |
| **Precision@k / recall@k** | Precision or recall among the top k scored | When you can only act on k cases (call 5,000 customers) |
| **Lift / gains** | Positive rate in the top decile ÷ overall rate | "The top 10% has 4× the churn rate" for business audiences |
| **KS statistic** | Max distance between the score distributions of positives and negatives | Credit-scoring convention |

> [!term] ROC-AUC vs PR-AUC
> ROC-AUC uses the false-positive **rate**, whose denominator is all negatives. With 1% positives, even many false alarms barely move it, so ROC-AUC can look excellent while precision is poor. PR-AUC uses **precision**, so it reflects how many alerts are useful. For rare events (fraud, churn in a short window, default), report PR-AUC (and precision at the operating point) alongside ROC-AUC. The PR baseline is the positive rate, not 0.5.

<figure class="dia"><svg viewBox="0 0 720 266" role="img" aria-label="ROC and precision-recall curves for the same model at 2% prevalence: the ROC AUC is high while average precision is much lower">
<text class="sGt" x="155" y="16" text-anchor="middle">ROC: AUC 0.90</text>
<rect class="sN" x="70" y="42" width="170" height="170" rx="0"/>
<line class="sD" x1="70" y1="212" x2="240" y2="42"/>
<polyline class="sL" points="70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,212.0 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.9 70.0,211.8 70.0,211.8 70.0,211.8 70.0,211.8 70.0,211.7 70.0,211.7 70.0,211.7 70.0,211.6 70.0,211.6 70.0,211.6 70.0,211.5 70.0,211.5 70.0,211.4 70.0,211.3 70.0,211.3 70.0,211.2 70.0,211.1 70.0,211.0 70.0,210.9 70.0,210.8 70.0,210.7 70.0,210.6 70.0,210.5 70.0,210.3 70.0,210.2 70.0,210.0 70.0,209.8 70.0,209.6 70.0,209.4 70.0,209.2 70.0,209.0 70.0,208.7 70.0,208.4 70.0,208.1 70.0,207.8 70.0,207.5 70.0,207.1 70.0,206.7 70.0,206.3 70.0,205.9 70.0,205.4 70.0,204.9 70.0,204.4 70.0,203.9 70.0,203.3 70.0,202.7 70.0,202.0 70.0,201.4 70.0,200.6 70.0,199.9 70.0,199.1 70.0,198.3 70.0,197.4 70.0,196.5 70.0,195.5 70.0,194.6 70.1,193.5 70.1,192.4 70.1,191.3 70.1,190.1 70.1,188.9 70.1,187.7 70.1,186.4 70.1,185.0 70.2,183.6 70.2,182.2 70.2,180.7 70.2,179.2 70.3,177.6 70.3,176.0 70.3,174.3 70.4,172.6 70.4,170.9 70.5,169.1 70.5,167.2 70.6,165.4 70.7,163.5 70.8,161.5 70.8,159.5 70.9,157.5 71.1,155.5 71.2,153.4 71.3,151.3 71.5,149.2 71.6,147.0 71.8,144.9 72.0,142.7 72.2,140.5 72.4,138.3 72.7,136.0 72.9,133.8 73.2,131.5 73.5,129.3 73.9,127.0 74.2,124.7 74.6,122.5 75.1,120.2 75.5,118.0 76.0,115.7 76.5,113.5 77.1,111.3 77.7,109.1 78.3,107.0 79.0,104.8 79.8,102.7 80.5,100.6 81.4,98.5 82.2,96.5 83.2,94.5 84.1,92.5 85.2,90.5 86.2,88.6 87.4,86.8 88.6,84.9 89.8,83.1 91.1,81.4 92.5,79.7 93.9,78.0 95.4,76.4 97.0,74.8 98.6,73.3 100.3,71.8 102.0,70.4 103.8,69.0 105.6,67.6 107.5,66.3 109.5,65.1 111.5,63.9 113.6,62.7 115.8,61.6 117.9,60.5 120.2,59.4 122.5,58.5 124.8,57.5 127.1,56.6 129.5,55.7 132.0,54.9 134.5,54.1 137.0,53.4 139.5,52.6 142.0,52.0 144.6,51.3 147.2,50.7 149.8,50.1 152.4,49.6 155.0,49.1 157.6,48.6 160.2,48.1 162.8,47.7 165.4,47.3 168.0,46.9 170.5,46.5 173.0,46.2 175.5,45.9 178.0,45.6 180.5,45.3 182.9,45.0 185.2,44.8 187.5,44.6 189.8,44.4 192.1,44.2 194.2,44.0 196.4,43.8 198.5,43.7 200.5,43.5 202.5,43.4 204.4,43.3 206.2,43.2 208.0,43.1 209.7,43.0 211.4,42.9 213.0,42.8 214.6,42.7 216.1,42.7 217.5,42.6 218.9,42.5 220.2,42.5 221.4,42.4 222.6,42.4 223.8,42.4 224.8,42.3 225.9,42.3 226.8,42.3 227.8,42.2 228.6,42.2 229.5,42.2 230.2,42.2 231.0,42.1 231.7,42.1 232.3,42.1 232.9,42.1 233.5,42.1 234.0,42.1 234.5,42.1 234.9,42.1 235.4,42.1 235.8,42.1 236.1,42.0 236.5,42.0 236.8,42.0 237.1,42.0 237.3,42.0 237.6,42.0 237.8,42.0 238.0,42.0 238.2,42.0 238.4,42.0 238.5,42.0 238.7,42.0 238.8,42.0 238.9,42.0 239.1,42.0 239.2,42.0 239.2,42.0 239.3,42.0 239.4,42.0 239.5,42.0 239.5,42.0 239.6,42.0 239.6,42.0 239.7,42.0 239.7,42.0 239.7,42.0 239.8,42.0 239.8,42.0 239.8,42.0 239.8,42.0 239.9,42.0 239.9,42.0 239.9,42.0 239.9,42.0 239.9,42.0 239.9,42.0 239.9,42.0 239.9,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0 240.0,42.0" fill="none" stroke-width="2.5"/>
<text class="sC" x="155" y="230" text-anchor="middle">false-positive rate</text><text class="sC" x="70" y="36">true-positive rate (recall)</text>
<text class="sWt" x="505" y="16" text-anchor="middle">precision–recall: AP 0.39</text>
<rect class="sN" x="420" y="42" width="170" height="170" rx="0"/>
<line class="sD" x1="420" y1="208.6" x2="590" y2="208.6"/><text class="sC" x="596" y="212.6">base rate 2%</text>
<polyline class="sL" points="420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.0,42.0 420.1,42.0 420.1,42.0 420.1,42.0 420.1,42.0 420.1,42.1 420.1,42.1 420.1,42.1 420.1,42.1 420.1,42.1 420.1,42.1 420.2,42.1 420.2,42.1 420.2,42.1 420.2,42.1 420.3,42.2 420.3,42.2 420.3,42.2 420.4,42.2 420.4,42.2 420.4,42.3 420.5,42.3 420.5,42.3 420.6,42.4 420.7,42.4 420.7,42.5 420.8,42.5 420.9,42.6 421.0,42.6 421.1,42.7 421.2,42.8 421.3,42.8 421.4,42.9 421.5,43.0 421.7,43.1 421.8,43.3 422.0,43.4 422.2,43.5 422.4,43.7 422.6,43.9 422.8,44.0 423.0,44.2 423.3,44.5 423.6,44.7 423.9,45.0 424.2,45.3 424.5,45.6 424.9,45.9 425.3,46.3 425.7,46.7 426.1,47.1 426.6,47.6 427.1,48.1 427.6,48.7 428.1,49.3 428.7,49.9 429.3,50.7 430.0,51.4 430.6,52.2 431.4,53.1 432.1,54.1 432.9,55.1 433.7,56.2 434.6,57.3 435.5,58.6 436.5,59.9 437.4,61.3 438.5,62.8 439.6,64.4 440.7,66.1 441.9,67.8 443.1,69.7 444.3,71.7 445.6,73.7 447.0,75.9 448.4,78.1 449.8,80.4 451.3,82.9 452.8,85.4 454.4,88.0 456.0,90.6 457.7,93.4 459.4,96.2 461.1,99.1 462.9,102.0 464.8,105.0 466.6,108.0 468.5,111.0 470.5,114.0 472.5,117.1 474.5,120.2 476.5,123.2 478.6,126.3 480.7,129.3 482.8,132.3 485.0,135.3 487.1,138.2 489.3,141.1 491.5,143.9 493.7,146.7 496.0,149.3 498.2,152.0 500.5,154.5 502.7,157.0 505.0,159.4 507.3,161.7 509.5,163.9 511.8,166.0 514.0,168.1 516.3,170.1 518.5,172.0 520.7,173.8 522.9,175.6 525.0,177.2 527.2,178.8 529.3,180.4 531.4,181.8 533.5,183.2 535.5,184.5 537.5,185.8 539.5,187.0 541.5,188.1 543.4,189.2 545.2,190.2 547.1,191.2 548.9,192.1 550.6,193.0 552.3,193.8 554.0,194.6 555.6,195.3 557.2,196.0 558.7,196.7 560.2,197.3 561.6,197.9 563.0,198.5 564.4,199.0 565.7,199.5 566.9,200.0 568.1,200.5 569.3,200.9 570.4,201.3 571.5,201.7 572.6,202.1 573.5,202.4 574.5,202.7 575.4,203.1 576.3,203.4 577.1,203.6 577.9,203.9 578.6,204.2 579.4,204.4 580.0,204.6 580.7,204.8 581.3,205.0 581.9,205.2 582.4,205.4 582.9,205.6 583.4,205.8 583.9,205.9 584.3,206.1 584.7,206.2 585.1,206.3 585.5,206.5 585.8,206.6 586.1,206.7 586.4,206.8 586.7,206.9 587.0,207.0 587.2,207.1 587.4,207.2 587.6,207.3 587.8,207.4 588.0,207.4 588.2,207.5 588.3,207.6 588.5,207.6 588.6,207.7 588.7,207.8 588.8,207.8 588.9,207.9 589.0,207.9 589.1,207.9 589.2,208.0 589.3,208.0 589.3,208.1 589.4,208.1 589.5,208.1 589.5,208.2 589.6,208.2 589.6,208.2 589.6,208.3 589.7,208.3 589.7,208.3 589.7,208.3 589.8,208.3 589.8,208.4 589.8,208.4 589.8,208.4 589.9,208.4 589.9,208.4 589.9,208.4 589.9,208.5 589.9,208.5 589.9,208.5 589.9,208.5 589.9,208.5 589.9,208.5 589.9,208.5 590.0,208.5 590.0,208.5 590.0,208.5 590.0,208.5 590.0,208.5 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6 590.0,208.6" fill="none" stroke-width="2.5"/>
<text class="sC" x="505" y="230" text-anchor="middle">recall</text><text class="sC" x="420" y="36">precision</text>
<text class="sS" x="360" y="256" text-anchor="middle">same model, 2% positives: ROC AUC 0.90 looks excellent; average precision is only 0.39</text>
</svg><figcaption>Computed from one score model at 2% prevalence. PR-AUC tells you about the flagged list you'll actually work through.</figcaption></figure>

> [!say]
> "Precision is how many of the flagged cases are real; recall is how many real cases we catch. Which matters more depends on the cost: for fraud blocks I protect precision so good customers aren't blocked; for disease screening I protect recall. With rare positives I report PR-AUC rather than only ROC-AUC, because ROC hides a flood of false positives behind a tiny false-positive rate."

> [!story]
> Your capstone used **F1-macro** because "slight" accidents dominated, so accuracy would have rewarded predicting "slight" for everything (your notes record a dummy model at about 89% accuracy). That's exactly the reasoning interviewers want. Also be ready to say what you'd report if the model were used to dispatch help: **recall on serious and fatal accidents** at an acceptable alert rate.

## DS4.4 Choosing a threshold from costs 🟡 ⭐

A model outputs scores; a **decision** needs a threshold (or a top-k). Choose it from value, not from 0.5:

```python
import numpy as np
benefit_tp, cost_fp, cost_fn = 600.0, 50.0, 0.0      # EGP: saved margin per retained churner; offer cost; (missed churner's loss counted via benefit)
thresholds = np.linspace(0.01, 0.99, 99)
def expected_profit(t):
    pred = proba >= t
    tp = np.sum(pred & (y == 1)); fp = np.sum(pred & (y == 0))
    return tp * benefit_tp * acceptance_rate - (tp + fp) * cost_fp      # only some churners accept the offer
best_t = max(thresholds, key=expected_profit)
```

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Expected campaign profit against the decision threshold, computed with the code above on a synthetic churn set with 10 percent churners, 600 pounds saved per retained churner and a 30 percent acceptance rate: with a 50 pound offer the best threshold is 0.28, well below 0.5, and when the offer cost doubles it moves up to 0.5 and the best profit falls by more than half">
<line class="sLm" x1="70" y1="200" x2="490" y2="200"/><line class="sLm" x1="70" y1="200" x2="70" y2="24"/><line class="sLm" x1="70" y1="136.25" x2="490" y2="136.25" stroke-dasharray="3 3"/>
<text class="sS" x="70" y="216" text-anchor="middle">0</text>
<text class="sS" x="175" y="216" text-anchor="middle">0.25</text>
<text class="sS" x="280" y="216" text-anchor="middle">0.5</text>
<text class="sS" x="385" y="216" text-anchor="middle">0.75</text>
<text class="sS" x="490" y="216" text-anchor="middle">1</text>
<text class="sS" x="280" y="234" text-anchor="middle">threshold on the churn score</text><text class="sS" x="62" y="140.25" text-anchor="end">0</text><text class="sS" x="62" y="56.6215" text-anchor="end">100k</text><text class="sS" x="62" y="204" text-anchor="end">loss</text>
<line class="sLm" x1="70" y1="52.6215" x2="490" y2="52.6215" opacity=".15"/><text class="sS" x="20" y="112" text-anchor="middle" transform="rotate(-90 20 112)">expected profit (EGP)</text>
<polyline class="sLg" points="74.2,200.0 78.4,200.0 82.6,200.0 86.8,200.0 91.0,200.0 95.2,178.4 99.4,155.3 103.6,137.0 107.8,119.6 112.0,106.8 116.2,96.3 120.4,86.4 124.6,78.6 128.8,71.4 133.0,66.3 137.2,62.2 141.4,58.0 145.6,54.6 149.8,51.5 154.0,49.3 158.2,46.8 162.4,44.6 166.6,43.7 170.8,42.3 175.0,41.9 179.2,40.7 183.4,40.3 187.6,39.7 191.8,40.7 196.0,41.5 200.2,41.3 204.4,41.0 208.6,40.3 212.8,40.5 217.0,41.3 221.2,41.7 225.4,41.9 229.6,42.4 233.8,43.1 238.0,43.9 242.2,45.2 246.4,45.8 250.6,45.9 254.8,46.5 259.0,46.9 263.2,47.8 267.4,48.8 271.6,49.5 275.8,50.2 280.0,50.3 284.2,51.9 288.4,52.5 292.6,53.7 296.8,54.9 301.0,56.0 305.2,57.3 309.4,58.6 313.6,60.6 317.8,62.0 322.0,63.6 326.2,64.5 330.4,66.0 334.6,67.1 338.8,69.4 343.0,70.2 347.2,71.9 351.4,73.2 355.6,74.1 359.8,75.8 364.0,77.3 368.2,79.3 372.4,80.8 376.6,82.8 380.8,83.6 385.0,84.9 389.2,86.6 393.4,88.1 397.6,89.8 401.8,91.6 406.0,92.7 410.2,94.4 414.4,95.9 418.6,98.2 422.8,99.9 427.0,101.5 431.2,103.3 435.4,105.6 439.6,107.1 443.8,108.9 448.0,111.0 452.2,112.7 456.4,114.6 460.6,116.3 464.8,118.7 469.0,121.3 473.2,123.8 477.4,127.6 481.6,130.8 485.8,133.5" style="fill:none;stroke-width:2.4"/>
<circle class="sP" cx="187.6" cy="39.7" r="4.5"/>
<polyline class="sLw" points="74.2,200.0 78.4,200.0 82.6,200.0 86.8,200.0 91.0,200.0 95.2,200.0 99.4,200.0 103.6,200.0 107.8,200.0 112.0,200.0 116.2,200.0 120.4,200.0 124.6,200.0 128.8,200.0 133.0,200.0 137.2,200.0 141.4,196.3 145.6,186.1 149.8,175.9 154.0,168.3 158.2,160.5 162.4,153.0 166.6,147.8 170.8,141.6 175.0,137.5 179.2,132.1 183.4,128.3 187.6,124.5 191.8,122.6 196.0,119.9 200.2,116.5 204.4,114.0 208.6,110.8 212.8,108.7 217.0,107.8 221.2,105.3 225.4,103.8 229.6,102.6 233.8,101.5 238.0,101.0 242.2,100.8 246.4,100.2 250.6,98.8 254.8,97.6 259.0,96.9 263.2,96.7 267.4,96.4 271.6,95.8 275.8,95.5 280.0,94.6 284.2,95.3 288.4,95.1 292.6,95.3 296.8,95.4 301.0,95.4 305.2,95.7 309.4,96.3 313.6,97.3 317.8,97.4 322.0,97.9 326.2,98.1 330.4,99.0 334.6,99.0 338.8,100.0 343.0,99.9 347.2,100.7 351.4,101.1 355.6,101.3 359.8,102.2 364.0,102.9 368.2,104.0 372.4,104.8 376.6,105.9 380.8,106.1 385.0,106.7 389.2,107.6 393.4,108.5 397.6,109.3 401.8,110.3 406.0,110.8 410.2,111.7 414.4,112.6 418.6,114.0 422.8,115.0 427.0,115.9 431.2,116.9 435.4,118.3 439.6,119.2 443.8,120.1 448.0,121.4 452.2,122.4 456.4,123.4 460.6,124.3 464.8,125.7 469.0,127.2 473.2,128.7 477.4,131.1 481.6,132.9 485.8,134.6" style="fill:none;stroke-width:2.4"/>
<circle class="sP" cx="280.0" cy="94.6" r="4.5"/>
<line class="sLr" x1="280" y1="30" x2="280" y2="200" stroke-dasharray="5 4"/><text class="sRt" x="284" y="194">the default 0.5</text>
<rect class="sN" x="510" y="30" width="196" height="170" rx="8"/>
<text class="sS" x="608" y="52" text-anchor="middle">20,000 test customers, 10% churn</text>
<text class="sGt" x="608" y="80" text-anchor="middle">offer costs EGP 50</text><text class="sT" x="608" y="98" text-anchor="middle">best threshold 0.28</text><text class="sS" x="608" y="114" text-anchor="middle">profit 115,500 vs 102,750 at 0.5</text>
<text class="sWt" x="608" y="144" text-anchor="middle">offer costs EGP 100</text><text class="sT" x="608" y="162" text-anchor="middle">best threshold 0.50</text><text class="sS" x="608" y="178" text-anchor="middle">profit 49,800 vs 49,800 at 0.5</text>
</svg><figcaption>expected_profit(t) from the code above, evaluated on synthetic churn scores: the best threshold comes from the costs, not from 0.5, and it moves when they change.</figcaption></figure>

Also common: fix the **capacity** (the CRM team can call 5,000 per week, so take the top 5,000), or fix a **constraint** (precision ≥ 90% for automatic fraud blocks) and maximise recall under it. Re-check the threshold whenever base rates or costs change. *AI Journey* Part 8 has the profit-curve figure.

## DS4.5 Calibration 🟡 ⭐

> [!term] Calibration
> A model is calibrated if, among cases given a probability of 0.3, about 30% are actually positive. Rankings (AUC) can be excellent while probabilities are badly off. Boosted trees, random forests, SVMs and anything trained with resampling or class weights are often **miscalibrated**.

**Why it matters:** expected-value decisions (probability × value), risk-based **pricing** in credit and insurance, combining scores across models, and communicating risk to people.

**How to check and fix:** a **reliability diagram** (predicted probability bins vs observed rates) and the Brier score; then calibrate on held-out data with **Platt scaling** (a logistic fit, good for little data) or **isotonic regression** (non-parametric, needs more data), via `CalibratedClassifierCV`.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Reliability diagram: an over-confident model's observed rates are flatter than its predictions, and after calibration the points lie on the diagonal">
<rect class="sN" x="80" y="30" width="180" height="180" rx="0"/><line class="sD" x1="80" y1="210" x2="260" y2="30"/>
<polyline class="sLr" points="89.0,164.6 107.0,154.7 125.0,144.8 143.0,134.9 161.0,124.9 179.0,115.0 197.0,105.1 215.0,95.2 233.0,85.3 251.0,75.4" fill="none" stroke-width="2.5"/><polyline class="sLg" points="89.0,199.4 107.0,179.5 125.0,162.2 143.0,147.0 161.0,131.8 179.0,114.5 197.0,94.5 215.0,73.4 233.0,53.5 251.0,36.2" fill="none" stroke-width="2.5"/>
<circle class="sPr" cx="89.0" cy="164.6" r="3.5"/>
<circle class="sPr" cx="107.0" cy="154.7" r="3.5"/>
<circle class="sPr" cx="125.0" cy="144.8" r="3.5"/>
<circle class="sPr" cx="143.0" cy="134.9" r="3.5"/>
<circle class="sPr" cx="161.0" cy="124.9" r="3.5"/>
<circle class="sPr" cx="179.0" cy="115.0" r="3.5"/>
<circle class="sPr" cx="197.0" cy="105.1" r="3.5"/>
<circle class="sPr" cx="215.0" cy="95.2" r="3.5"/>
<circle class="sPr" cx="233.0" cy="85.3" r="3.5"/>
<circle class="sPr" cx="251.0" cy="75.4" r="3.5"/>
<circle class="sPg" cx="89.0" cy="199.4" r="3.5"/>
<circle class="sPg" cx="107.0" cy="179.5" r="3.5"/>
<circle class="sPg" cx="125.0" cy="162.2" r="3.5"/>
<circle class="sPg" cx="143.0" cy="147.0" r="3.5"/>
<circle class="sPg" cx="161.0" cy="131.8" r="3.5"/>
<circle class="sPg" cx="179.0" cy="114.5" r="3.5"/>
<circle class="sPg" cx="197.0" cy="94.5" r="3.5"/>
<circle class="sPg" cx="215.0" cy="73.4" r="3.5"/>
<circle class="sPg" cx="233.0" cy="53.5" r="3.5"/>
<circle class="sPg" cx="251.0" cy="36.2" r="3.5"/>
<text class="sC" x="170" y="228" text-anchor="middle">predicted probability (bins)</text><text class="sC" x="80" y="22">observed positive rate</text>
<text class="sC" x="310" y="60">diagonal: perfectly calibrated</text><text class="sRt" x="310" y="90">red: over-confident: says 0.9,</text><text class="sRt" x="310" y="108">reality is about 0.72</text>
<text class="sGt" x="310" y="138">green: after isotonic or Platt calibration</text><text class="sGt" x="310" y="156">on held-out data</text>
<text class="sC" x="310" y="190">ranking (AUC) is identical for both lines</text>
</svg><figcaption>A reliability diagram. Calibration changes what the probabilities mean, not the order of the customers.</figcaption></figure>

## DS4.6 Explaining models 🟡 ⭐

| Method | Scope | Answers | Caveat |
|---|---|---|---|
| Coefficients (linear models) | Global | Direction and size per feature | Only with scaled, not-too-correlated features |
| **Permutation importance** | Global | How much validation performance depends on each feature | Correlated features share and hide importance |
| **Partial dependence / ICE plots** | Global / per instance | How predictions change as one feature varies | Assumes the feature can vary independently |
| **SHAP values** | Global **and** local | Each feature's contribution to **this** prediction, relative to the average prediction | Fast and exact for trees (TreeSHAP); still **association, not causation** |

```python
import shap
explainer = shap.TreeExplainer(lgb_model)
sv = explainer(X_valid)
shap.plots.beeswarm(sv)          # global: which features matter, and in which direction
shap.plots.waterfall(sv[0])      # local: why this customer got this score
```

**Reason codes** (credit decisions): the top features pushing a score towards decline, translated into plain language ("high utilisation of existing credit lines").

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="SHAP waterfall for one customer: starting from an average prediction of 0.08, days since recharge, complaints and spend trend push the churn score up, tenure pushes it down, ending at 0.52">
<text class="sC" x="250" y="46" text-anchor="end">average prediction (base)</text><rect class="sN" x="260" y="30" width="51.2" height="22" rx="3"/><text class="sC" x="317.2" y="46">0.08</text>
<text class="sC" x="250" y="78" text-anchor="end">days_since_recharge = 21</text><rect class="sR" x="311.2" y="62" width="140.8" height="22" rx="3"/><text class="sRt" x="458" y="78">+0.22</text>
<line class="sD" x1="452" y1="84" x2="452" y2="92"/>
<text class="sC" x="250" y="108" text-anchor="end">complaints_30d = 3</text><rect class="sR" x="452" y="92" width="96" height="22" rx="3"/><text class="sRt" x="554" y="108">+0.15</text>
<line class="sD" x1="548" y1="114" x2="548" y2="122"/>
<text class="sC" x="250" y="138" text-anchor="end">spend trend = 0.5</text><rect class="sR" x="548" y="122" width="76.8" height="22" rx="3"/><text class="sRt" x="630.8" y="138">+0.12</text>
<line class="sD" x1="625" y1="144" x2="625" y2="152"/>
<text class="sC" x="250" y="168" text-anchor="end">tenure = 2 years</text><rect class="sG" x="586.4" y="152" width="38.4" height="22" rx="3"/><text class="sGt" x="630.8" y="168">-0.06</text>
<line class="sD" x1="586" y1="174" x2="586" y2="182"/>
<text class="sC" x="250" y="198" text-anchor="end">plan = family</text><rect class="sR" x="586.4" y="182" width="6.4" height="22" rx="3"/><text class="sRt" x="598.8" y="198">+0.01</text>
<line class="sD" x1="593" y1="204" x2="593" y2="212"/>
<text class="sT" x="250" y="228" text-anchor="end">this customer</text><rect class="sA" x="260" y="212" width="332.8" height="22" rx="3"/><text class="sT" x="598.8" y="228">0.52</text>
</svg><figcaption>A local explanation: how each feature moved this customer's score away from the average. It explains the model, not the world.</figcaption></figure>

> [!mistake] Reading SHAP as causal
> "Customers with more complaints have higher churn SHAP values" doesn't mean reducing complaints will reduce churn by that amount. SHAP explains the **model**, which learned **correlations**. For "what if we change X?", you need causal methods ([[DS5]]).

> [!story]
> You used **SHAP** in the road-accident capstone. Say what you learned from it and what you'd caution a road-safety official about: the features push predictions, but that doesn't prove that changing a road condition changes outcomes by that much.

## DS4.7 Regression metrics 🟢 ⭐

| Metric | Meaning | Use |
|---|---|---|
| **MAE** | Mean absolute error, in the target's units | Robust to outliers; easy to explain ("off by EGP 120 on average") |
| **RMSE** | Square root of mean squared error | Penalises large errors more; matches a squared-error loss |
| **MAPE** | Mean absolute **percentage** error | Intuitive, but explodes near zero and is asymmetric; avoid for intermittent demand |
| **WAPE** (weighted APE) | Σ\|error\| ÷ Σ\|actual\| | Forecasting across many items; stable with small values |
| **R²** | Share of variance explained | Comparisons on the same data; not a business metric |
| **Pinball (quantile) loss** | Error for a predicted quantile | Prediction intervals, safety stock ([[DS6]]) |

**MAE vs RMSE:** if a few large misses are very costly (under-staffing on a peak day), optimise and report RMSE; if typical error matters and outliers are noisy, MAE.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Two models with the same mean absolute error of 20: model A misses every day by 20, model B is close on four days and misses by 80 once, so its RMSE is much higher">
<text class="sT" x="170" y="22" text-anchor="middle">model A</text>
<line class="sLm" x1="40" y1="170" x2="310" y2="170"/>
<rect class="sB" x="50" y="138" width="40" height="32" rx="3"/><text class="sC" x="70" y="132" text-anchor="middle">20</text>
<rect class="sB" x="102" y="138" width="40" height="32" rx="3"/><text class="sC" x="122" y="132" text-anchor="middle">20</text>
<rect class="sB" x="154" y="138" width="40" height="32" rx="3"/><text class="sC" x="174" y="132" text-anchor="middle">20</text>
<rect class="sB" x="206" y="138" width="40" height="32" rx="3"/><text class="sC" x="226" y="132" text-anchor="middle">20</text>
<rect class="sB" x="258" y="138" width="40" height="32" rx="3"/><text class="sC" x="278" y="132" text-anchor="middle">20</text>
<text class="sT" x="170" y="194" text-anchor="middle">MAE 20 · RMSE 20.0</text>
<text class="sT" x="520" y="22" text-anchor="middle">model B</text>
<line class="sLm" x1="390" y1="170" x2="660" y2="170"/>
<rect class="sB" x="400" y="162" width="40" height="8" rx="3"/><text class="sC" x="420" y="156" text-anchor="middle">5</text>
<rect class="sB" x="452" y="162" width="40" height="8" rx="3"/><text class="sC" x="472" y="156" text-anchor="middle">5</text>
<rect class="sB" x="504" y="162" width="40" height="8" rx="3"/><text class="sC" x="524" y="156" text-anchor="middle">5</text>
<rect class="sB" x="556" y="162" width="40" height="8" rx="3"/><text class="sC" x="576" y="156" text-anchor="middle">5</text>
<rect class="sR" x="608" y="42" width="40" height="128" rx="3"/><text class="sC" x="628" y="36" text-anchor="middle">80</text>
<text class="sT" x="520" y="194" text-anchor="middle">MAE 20 · RMSE 36.1</text>
<text class="sS" x="360" y="220" text-anchor="middle">same MAE; RMSE flags the one big miss, which matters if big misses are expensive</text>
</svg><figcaption>MAE treats every unit of error equally; RMSE squares errors first, so it punishes the rare large miss.</figcaption></figure>

## DS4.8 Error analysis: where does the model fail? 🟡 ⭐

Aggregate metrics hide uneven performance. After choosing a model:

1. **Slice** performance by segment: region, channel, tenure band, device, customer value, new vs existing. A model with good overall AUC can be useless for new customers.
2. **Inspect the worst errors** (largest false positives and false negatives) individually: often they reveal **label problems**, data bugs or a missing feature.
3. **Confusion matrix by class** for multiclass problems: which classes are confused with which?
4. **Check stability over time:** performance by month in the out-of-time period.
5. **Turn findings into actions:** a new feature, better labels, a separate model or rule for a segment, or a documented limitation.

> [!say]
> "After the headline metric, I slice performance by segment and time, because a good average can hide a segment where the model fails, often new customers. Then I read the worst errors one by one; that's usually where label problems or a missing feature show up."

## DS4.9 Is model B really better? 🟡

Two models whose AUC differs by 0.003 may be indistinguishable. Estimate uncertainty: the spread across CV folds, **bootstrap** confidence intervals on the test set, or paired tests on the same folds. Prefer the simpler, more stable or more explainable model when the difference is within noise.

## DS4.10 Fairness checks 🟡

Compare outcomes and errors across groups where it matters (credit, hiring, insurance):

- **Demographic parity:** similar positive-decision rates across groups.
- **Equal opportunity / equalised odds:** similar true-positive (and false-positive) rates across groups.
- **Calibration within groups:** a score of 0.3 means about 30% in every group.

These criteria can't all hold at once when base rates differ, so the choice is a policy decision, documented and reviewed. Tools: Fairlearn, AIF360.

## DS4.11 Offline vs online evaluation 🟢

Offline metrics estimate potential; **online experiments measure impact** ([[S6.9]], [[DA6.4]]). A churn model with better PR-AUC proves its worth only when a randomised holdout shows that contacting its top-k retains more customers (or more margin) than the old rule did.

> [!lab] Evaluate one model like a professional
> Take your best model from [[DS3]]'s lab. Produce: rolling time-based CV scores with spread; ROC and PR curves; a profit curve with the chosen threshold; a reliability diagram before and after isotonic calibration; a SHAP beeswarm and two waterfall explanations; a performance table sliced by two segments; and a five-sentence evaluation summary. That page is what interviewers mean by "how did you evaluate it?".

## DS4.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Why a separate test set? | Every decision based on validation data overfits it slightly; the test set gives one honest final estimate. |
| How do you validate a model that predicts the future? | Rolling time-based splits, entity-grouped where needed, plus an out-of-time test. |
| Precision vs recall? | Of flagged, how many are right vs of real positives, how many we caught. |
| When is accuracy misleading? | With imbalanced classes: predicting the majority class scores highly. |
| ROC-AUC vs PR-AUC? | ROC uses the FP rate (hides false alarms when negatives dominate); PR uses precision, better for rare events. |
| How do you choose a threshold? | Maximise expected value from costs and benefits, or meet a capacity or precision constraint. |
| What is calibration? | Predicted probabilities match observed frequencies; fix with Platt or isotonic on held-out data. |
| What does SHAP tell you? | Each feature's contribution to a prediction relative to the average, globally and locally; not causal. |
| Permutation importance? | The drop in validation performance when a feature is shuffled. |
| MAE vs RMSE? | MAE is robust and in units; RMSE penalises large errors more. |
| Why avoid MAPE for low-volume items? | It explodes near zero and is asymmetric; use WAPE or MAE. |
| What's precision@k? | Precision among the top k scored cases, matching a fixed action capacity. |
| What is error analysis? | Slicing performance by segment and time and inspecting the worst errors to find fixes. |
| How do you know the model created value? | An online experiment with a holdout measuring the business outcome. |

## Key takeaways

> [!check]
> - Validate the way the model will be used: forward in time, grouped by entity, with an out-of-time test.
> - Pick metrics that match the decision: PR-AUC and precision@k for rare events; MAE/WAPE for forecasts.
> - Thresholds come from costs or capacity, not 0.5.
> - Check calibration when probabilities drive decisions.
> - SHAP explains the model, not the world; slice errors to learn what to fix.

## Sources

- scikit-learn user guide: [Model evaluation (metrics)](https://scikit-learn.org/stable/modules/model_evaluation.html), [Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html), [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html), [Tuning the decision threshold](https://scikit-learn.org/stable/modules/classification_threshold.html), [Permutation importance](https://scikit-learn.org/stable/modules/permutation_importance.html), [Partial dependence](https://scikit-learn.org/stable/modules/partial_dependence.html).
- Takaya Saito and Marc Rehmsmeier, "The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets" (*PLOS ONE*, 2015).
- Scott Lundberg and Su-In Lee, "A Unified Approach to Interpreting Model Predictions" (NeurIPS 2017); [SHAP documentation](https://shap.readthedocs.io/).
- Christoph Molnar, [*Interpretable Machine Learning*](https://christophm.github.io/interpretable-ml-book/) (free online).
- Rob Hyndman and George Athanasopoulos, [*Forecasting: Principles and Practice*, 3rd ed.](https://otexts.com/fpp3/), chapter 5 (forecast accuracy measures).
- [Fairlearn](https://fairlearn.org/) documentation on fairness metrics.
- Your *AI Journey* Parts 6 and 8.
