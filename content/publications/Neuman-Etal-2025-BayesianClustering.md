---
title: "Reliable data clustering with Bayesian community detection"
authors: "Magnus Neuman, Jelena Smiljanić, Martin Rosvall"
year: 2025
date: "2025-10-16"
journal: "arXiv:2510.15013 (2025)"
arxiv: "2510.15013"
---

From neuroscience and genomics to systems biology and ecology, researchers rely on clustering similarity data to uncover modular structure. Yet widely used clustering methods, such as hierarchical clustering, k-means, and WGCNA, lack principled model selection, leaving them susceptible to noise. A common workaround sparsifies a correlation matrix representation to remove noise before clustering, but this extra step introduces arbitrary thresholds that can distort the structure and lead to unreliable results. To detect reliable clusters, we capitalize on recent advances in network science to unite sparsification and clustering with principled model selection. We test two Bayesian community detection methods, the Degree-Corrected Stochastic Block Model and the Regularized Map Equation, both grounded in the Minimum Description Length principle for model selection. In synthetic data, they outperform traditional approaches, detecting planted clusters under high-noise conditions and with fewer samples. Compared to WGCNA on gene co-expression data, the Regularized Map Equation identifies more robust and functionally coherent gene modules. Our results establish Bayesian community detection as a principled and noise-resistant framework for uncovering modular structure in high-dimensional data across fields.
