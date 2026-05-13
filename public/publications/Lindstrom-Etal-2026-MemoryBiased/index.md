---
title: "Mapping memory-biased dynamics with compact models reveals overlapping communities in large networks"
authors: "Maja Lindström, Rohit Sahasrabuddhe, Anton Holmgren, Christopher Blöcker, Daniel Edler, Martin Rosvall"
year: 2026
date: "2026-01-23"
journal: "Journal of Physics: Complexity (2026)"
doi: "https://doi.org/10.1088/2632-072X/ae35bb"
arxiv: "2304.05775"
featured: true
links:
  - { label: "Notebooks", href: "https://github.com/mapequation/biased-random-walks" }
  - { label: "Sparse states implementation", href: "https://github.com/mapequation/sparse-biased-states" }
figure:
    caption: "A compact representation of higher-order dynamics reveals overlapping communities. a) A first-order network constrains a memoryless random walk that supports two non-overlapping communities. b) We introduce a second-order model by biasing transitions: arriving along the link (i, j), the random walker at node j is biased to backtrack by a factor 1/p and to move to a node not adjacent to i by a factor 1/q. c) We describe the bias in each physical node with state nodes, where arrows indicate transition probabilities. d) To manage computational complexity, we lump state nodes within each physical node. e) By connecting the lumped state nodes, we construct a compact network representation. f) Mapping the memory-biased random walk on the compact network reveals overlapping communities in the middle node."
---

Many real-world systems, from social networks to protein-protein interactions and species distributions, exhibit overlapping flow-based communities that reflect their functional organisation. However, reliably identifying such overlapping flow-based communities requires higher-order relational data, which are often unavailable. To address this challenge, we capitalise on the flow model underpinning the representation-learning algorithm node2vec and model higher-order flows through memory-biased random walks on first-order networks. Instead of simulating these walks, we model their higher-order dynamic constraints with compact models and control model complexity with an information-theoretic approach. Using the map equation framework, we identify overlapping modules in the resulting higher-order networks. Our compact-model approach proves robust across synthetic benchmark networks, reveals interpretable overlapping communities in empirical networks, and scales to large networks.
