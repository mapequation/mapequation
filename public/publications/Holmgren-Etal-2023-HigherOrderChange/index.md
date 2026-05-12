---
title: "Mapping change in higher-order networks with multilevel and overlapping communities"
authors: "Anton Holmgren, Daniel Edler, Martin Rosvall"
year: 2023
date: "2023-06-26"
journal: "Applied Network Science 8, 42 (2023)"
doi: "https://doi.org/10.1007/s41109-023-00565-4"
arxiv: "2303.00622"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Lambiotte-Rosvall-2012-Smart-teleportation
  - Persson-Etal-2016-SparseMarkovMaps
  - Edler-Etal-2017-Bioregions
  - Edler-Etal-2017-MappingHigherOrder
  - Farage-Etal-2021-Ecological-Networks
  - Neuman-Etal-2022-CrossValidation
  - Blocker-Etal-2022-MapEquationCentrality
  - Blocker-Etal-2022-MapEquationSimilarity
links:
  - { label: "Alluvial app", href: "https://github.com/mapequation/alluvial" }
  - { label: "Notebooks", href: "https://github.com/mapequation/mapping-change-2" }
  - { label: "Multilevel significance clustering", href: "https://github.com/mapequation/multilevel-significance-clustering" }
---

New network models of complex systems use layers, state nodes, or hyperedges to capture higher-order interactions and dynamics. Simplifying how the higher-order networks change over time or depending on the network model would be easy with alluvial diagrams, which visualize community splits and merges between networks. However, alluvial diagrams were developed for networks with regular nodes assigned to non-overlapping flat communities. How should they be defined for nodes in layers, state nodes, or hyperedges? How can they depict multilevel, overlapping communities? Here we generalize alluvial diagrams to map change in higher-order networks and provide an interactive tool for anyone to generate alluvial diagrams. We use the alluvial generator to illustrate the effect of modeling network flows with memory in a citation network, distinguishing multidisciplinary from field-specific journals.
