---
title: "Similarity-based Link Prediction from Modular Compression of Network Flows"
authors: "Christopher Blöcker, Jelena Smiljanić, Ingo Scholtes, Martin Rosvall"
year: 2022
journal: "Proceedings of Machine Learning Research, PMLR 198:52:1-52:18 (2022)"
doi: "https://proceedings.mlr.press/v198/blocker22a.html"
arxiv: "2208.14220"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Rosvall-Bergstrom-2011-Multilevel
  - Lambiotte-Rosvall-2012-Smart-teleportation
  - Domenico-Etal-2015-Multiplex
  - Kawamoto-Etal-2015-Resolutionlimit
  - Kheirkhahzadeh-Etal-2016-Markovtimes
  - Edler-Etal-2017-Bioregions
  - Edler-Etal-2017-MappingHigherOrder
  - Aslak-Etal-2017-IntermittentCommunities
  - Emmons-Etal-2019-MetaDataMapEquation
  - Blocker-Etal-2020-BipartiteMapEquation
  - Smiljanic-Etal-2020-BayesianMapEquation
  - Eriksson-Etal-2020-MappingHypergraphs
  - Farage-Etal-2021-Ecological-Networks
  - Smiljanic-Etal-2021-MappingIncomplete
  - Bassolas-Etal-2021-MetadataInformed
  - Blocker-Etal-2022-MapEquationCentrality
pdf: "https://proceedings.mlr.press/v198/blocker22a/blocker22a.pdf"
links:
  - { label: "Code & data", href: "https://github.com/mapequation/map-equation-similarity" }
figure:
  caption: "FIG. Map equation coding principles. Left: An example network with nine nodes, ten links, and two communities, A and B, indicated by colours. Each random-walker step is encoded by one codeword for intra-module transitions, or three codewords for inter-module transitions. Codewords are shown next to nodes in colours, their length in bits in the information-theoretic limit in black. Module entry and exit codewords are shown to the left and right of the coloured arrows, respectively. The black trace shows a possible section of a random walk with its encoding and theoretical length at the bottom. Right: The corresponding coding tree. Links are annotated with transition rates to calculate similarities in the information-theoretic limit. Each coding tree path corresponds to a network link, which may or may not exist. The coder remembers the random walker's module but not the most recently visited node. Describing the intra-module transition from node 5 to 3 requires -log2(3/12) = 2 bits. The inter-module transition from node 5 to 7 requires three steps and -log2(1/12 · 1/2 · 2/10) ≈ 6.9 bits."
---

Node similarity scores are a foundation for machine learning in graphs for clustering, node classification, anomaly detection, and link prediction with applications in biological systems, information networks, and recommender systems. Recent works on link prediction use vector space embeddings to calculate node similarities in undirected networks with good performance. Still, they have several disadvantages: limited interpretability, need for hyperparameter tuning, manual model fitting through dimensionality reduction, and poor performance from symmetric similarities in directed link prediction. We propose MapSim, an information-theoretic measure to assess node similarities based on modular compression of network flows. Unlike vector space embeddings, MapSim represents nodes in a discrete, non-metric space of communities and yields asymmetric similarities in an unsupervised fashion. We compare MapSim on a link prediction task to popular embedding-based algorithms across 47 networks and find that MapSim's average performance across all networks is more than 7% higher than its closest competitor, outperforming all embedding methods in 11 of the 47 networks. Our method demonstrates the potential of compression-based approaches in graph representation learning, with promising applications in other graph learning tasks.
