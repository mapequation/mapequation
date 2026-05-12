---
title: "Reliable data clustering with Bayesian community detection"
authors: "Magnus Neuman, Jelena Smiljanić, Martin Rosvall"
year: 2025
date: "2025-10-16"
arxiv: "2510.15013"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Kawamoto-Etal-2015-Resolutionlimit
  - Kheirkhahzadeh-Etal-2016-Markovtimes
  - Edler-Etal-2017-Bioregions
  - Edler-Etal-2017-MappingHigherOrder
  - Aslak-Etal-2017-IntermittentCommunities
  - Calatayud-Etal-2019-SolutionLandscape
  - Emmons-Etal-2019-MetaDataMapEquation
  - Blocker-Etal-2020-BipartiteMapEquation
  - Smiljanic-Etal-2020-BayesianMapEquation
  - Eriksson-Etal-2020-MappingHypergraphs
  - Farage-Etal-2021-Ecological-Networks
  - Neuman-Etal-2022-CrossValidation
  - Blocker-Etal-2022-MapEquationCentrality
  - Blocker-Etal-2022-MapEquationSimilarity
  - Kirkley-Etal-2023-ModalNetworks
  - Holmgren-Etal-2023-HigherOrderChange
  - Lindstrom-Etal-2025-LinkPrediction
  - Smiljanic-Etal-2026-MapEquationSurvey
---

From neuroscience and genomics to systems biology and ecology, researchers rely on clustering similarity data to uncover modular structure. Yet widely used clustering methods, such as hierarchical clustering, k-means, and WGCNA, lack principled model selection, leaving them susceptible to noise. A common workaround sparsifies a correlation matrix representation to remove noise before clustering, but this extra step introduces arbitrary thresholds that can distort the structure and lead to unreliable results. To detect reliable clusters, we capitalize on recent advances in network science to unite sparsification and clustering with principled model selection. We test two Bayesian community detection methods, the Degree-Corrected Stochastic Block Model and the Regularized Map Equation, both grounded in the Minimum Description Length principle for model selection. In synthetic data, they outperform traditional approaches, detecting planted clusters under high-noise conditions and with fewer samples. Compared to WGCNA on gene co-expression data, the Regularized Map Equation identifies more robust and functionally coherent gene modules. Our results establish Bayesian community detection as a principled and noise-resistant framework for uncovering modular structure in high-dimensional data across fields.
