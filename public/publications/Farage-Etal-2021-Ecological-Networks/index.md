---
title: "Identifying flow modules in ecological networks using Infomap"
authors: "Carmel Farage, Daniel Edler, Anna Eklöf, Martin Rosvall, and Shai Pilosof"
year: 2021
journal: "Methods Ecol Evol. 2021;12:778-786"
doi: "https://doi.org/10.1111/2041-210X.13569"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Rosvall-Etal-2014-Memory
  - Domenico-Etal-2015-Multiplex
  - Kawamoto-Etal-2015-Resolutionlimit
  - Kheirkhahzadeh-Etal-2016-Markovtimes
  - Edler-Etal-2017-Bioregions
  - Edler-Etal-2017-MappingHigherOrder
  - Peixoto-Rosvall-2017-DynamicCommunityStructures
  - Aslak-Etal-2017-IntermittentCommunities
  - Calatayud-Etal-2019-SolutionLandscape
  - Blocker-Etal-2020-BipartiteMapEquation
  - Smiljanic-Etal-2020-BayesianMapEquation
links:
  - { label: "bioRxiv:2020.04.14", href: "https://www.biorxiv.org/content/10.1101/2020.04.14.040519v2.full" }
figure:
  caption: "FIG. 5 Structure as a function of increasing global relax rate. (a) Variation in the number of modules. (b) Distribution of module persistence (i.e. the number of layers throughout which a module exists). Boxplots represent the range, 95% quantiles and median (black line). The average is marked with red points and line. As expected, module persistence increases with increasing relax rate. (c) Species flexibility: The bars depict the percentage of species appearing in different numbers of modules."
---

Analysing how species interact in modules is a fundamental problem in network ecology. Theory shows that a modular network structure can reveal underlying dynamic ecological and evolutionary processes, influence dynamics that operate on the network and affect the stability of the ecological system. Although many ecological networks describe flows, such as biomass flows in food webs or disease transmission, most modularity analyses have ignored network flows, which can hinder our understanding of the interplay between structure and dynamics. Here we present Infomap, an established method based on network flows to the field of ecological networks. Infomap is a flexible tool that can identify modules in virtually any type of ecological network and is particularly useful for directed, weighted and multilayer networks. We illustrate how Infomap works on all these network types. We also provide a fully documented repository with additional ecological examples. Finally, to help researchers to analyse their networks with Infomap, we introduce the open-source R package infomapecology. Analysing flow-based modularity is useful across ecology and transcends to other biological and non-biological disciplines. A dynamic approach for detecting modu- lar structure has strong potential to provide new insights into the organisation of ecological networks.
