---
title: "Mapping higher-order network flows in memory and multilayer networks with Infomap"
authors: "Daniel Edler, Ludvig Bohlin, and Martin Rosvall"
year: 2017
journal: "Algorithms 10, 112 (2017)"
doi: "http://dx.doi.org/10.3390/a10040112"
arxiv: "1706.04792"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Rosvall-Bergstrom-2011-Multilevel
  - Lambiotte-Rosvall-2012-Smart-teleportation
  - Rosvall-Etal-2014-Memory
  - Domenico-Etal-2015-Multiplex
  - Kawamoto-Etal-2015-Resolutionlimit
  - Persson-Etal-2016-SparseMarkovMaps
  - Edler-Etal-2017-Bioregions
figure:
  caption: "FIG. 1 Going beyond standard methods makes it possible to take advantage of richer interaction data. (a) Standard methods shoehorn interaction data about a complex system into an often unweighted and undirected network, which limits what regularities can be detected. (b) Modeling and mapping higher-order network flows can break this detectability limit."
---

Comprehending complex systems by simplifying and highlighting important dynamical patterns requires modeling and mapping higher-order network flows. However, complex systems come in many forms and demand a range of representations, including memory and multilayer networks, which in turn call for versatile community-detection algorithms to reveal important modular regularities in the flows. Here we show that various forms of higher-order network flows can be represented in a unified way with networks that distinguish physical nodes for representing a complex system’s objects from state nodes for describing flows between the objects. Moreover, these so-called sparse memory networks allow the information-theoretic community detection method known as the map equation to identify overlapping and nested flow modules in data from a range of different higher-order interactions such as multistep, multi-source, and temporal data. We derive the map equation applied to sparse memory networks and describe its search algorithm Infomap, which can exploit the flexibility of sparse memory networks. Together they provide a general solution to reveal overlapping modular patterns in higher-order flows through complex systems.
