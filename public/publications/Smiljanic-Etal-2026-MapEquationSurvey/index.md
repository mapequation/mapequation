---
featured: true
title: "Community Detection with the Map Equation and Infomap: Theory and Applications"
authors: "Jelena Smiljanić, Christopher Blöcker, Anton Holmgren, Daniel Edler, Magnus Neuman, Martin Rosvall"
year: 2026
date: "2026-02-03"
category: Tutorial
journal: "ACM Computing Surveys 58(7), 1-34 (2026)"
doi: "https://doi.org/10.1145/3779648"
arxiv: "2311.04036"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Rosvall-Bergstrom-2010-Mapping-change
  - Rosvall-Bergstrom-2011-Multilevel
  - Lambiotte-Rosvall-2012-Smart-teleportation
  - Bohlin-Etal-2014-MapEquationFramework
  - Rosvall-Etal-2014-Memory
  - Domenico-Etal-2015-Multiplex
  - Kawamoto-Etal-2015-Resolutionlimit
  - Kheirkhahzadeh-Etal-2016-Markovtimes
  - Persson-Etal-2016-SparseMarkovMaps
  - Edler-Etal-2017-Bioregions
  - Edler-Etal-2017-MappingHigherOrder
  - Aslak-Etal-2017-IntermittentCommunities
  - Calatayud-Etal-2019-SolutionLandscape
  - Emmons-Etal-2019-MetaDataMapEquation
  - Blocker-Etal-2020-BipartiteMapEquation
  - Smiljanic-Etal-2020-BayesianMapEquation
  - Eriksson-Etal-2020-MappingHypergraphs
  - Eriksson-Etal-2021-FlowBasedHypergraphs
  - Farage-Etal-2021-Ecological-Networks
  - Smiljanic-Etal-2021-MappingIncomplete
  - Edler-Etal-2022-VariableMarkov
  - Neuman-Etal-2022-CrossValidation
  - Bassolas-Etal-2021-MetadataInformed
  - Blocker-Etal-2022-MapEquationCentrality
  - Blocker-Etal-2022-MapEquationSimilarity
  - Kirkley-Etal-2023-ModalNetworks
  - Holmgren-Etal-2023-HigherOrderChange
  - Neuman-Etal-2024-ModuleRegularization
  - Lindstrom-Etal-2025-LinkPrediction
  - Neuman-Etal-2025-BayesianClustering
  - Lindstrom-Etal-2026-MemoryBiased
links:
  - { label: "Tutorial notebooks", href: "https://github.com/mapequation/infomap-tutorial-notebooks" }
figure:
    caption: "Modeling and mapping flow with the map equation framework. Given complex system data, the
researcher first selects an appropriate network representation (left column) based on the type of interactions:
Pairwise interactions can be represented with weighted and directed networks, where link strength and direction
capture interaction frequency and orientation. Multi-mode interactions call for multilayer networks, where
nodes are replicated across layers representing different times, contexts, or modes. Multi-step interactions are
captured with memory networks, where physical nodes (large circles) are associated with state nodes (smaller
circles) that retain information about interaction sequences. Multi-body interactions among more than two
nodes are naturally represented by hypergraphs, where hyperedges connect multiple nodes simultaneously.
Next, a random walk model approximates real-world flow (middle column). Finally, minimizing the map
equation reveals flow modules where a random walker remains for extended periods (right column). Because
network flows reflect the systems’ function, flow modules reveal the systems’ functional components."
---

Real-world networks have a complex topology comprising many elements often structured into communities. Revealing these communities helps researchers uncover the organizational and functional structure of the system that the network represents. However, detecting community structures in complex networks requires selecting a community detection method among a multitude of alternatives with different network representations, community interpretations, and underlying mechanisms. This tutorial focuses on a popular community detection method called the map equation and its search algorithm Infomap. The map equation framework for community detection describes communities by analyzing dynamic processes on the network. Thanks to its flexibility, the map equation provides extensions that can incorporate various assumptions about network structure and dynamics. To help decide if the map equation is a suitable community detection method for a given complex system and problem at hand — and which variant to choose — we review the map equation's theoretical framework and guide users in applying the map equation to various research problems.
