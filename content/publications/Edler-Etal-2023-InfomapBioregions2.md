---
title: "Infomap Bioregions 2 — Exploring the interplay between biogeography and evolution"
authors: "Daniel Edler, Anton Holmgren, Alexis Rojas, Joaquín Calatayud, Martin Rosvall, Alexandre Antonelli"
year: 2023
date: "2023-06-29"
journal: "arXiv:2306.17259 (2023)"
arxiv: "2306.17259"
---

Identifying and understanding the large-scale biodiversity patterns in
time and space is vital for conservation and addressing fundamental
ecological and evolutionary questions. Network-based methods have proven
useful for simplifying and highlighting important structures in species
distribution data. However, current network-based biogeography approaches
cannot exploit the evolutionary information available in phylogenetic data.
We introduce a method for incorporating evolutionary relationships into
species occurrence networks to produce more biologically informative and
robust bioregions. To keep the bipartite network structure where bioregions
are grid cells indirectly connected through shared species, we incorporate
the phylogenetic tree by connecting ancestral nodes to the grid
cells where their descendant species occur. To incorporate the whole tree
without destroying the spatial signal of narrowly distributed species or
ancestral nodes, we weigh tree nodes by the geographic information they
provide. For a more detailed analysis, we enable integration of the
evolutionary relationships at a specific time in the tree. By sweeping through
the phylogenetic tree in time, our method interpolates between finding
bioregions based only on distributional data and finding spatially segregated
clades, uncovering evolutionarily distinct bioregions at different
time slices. We also introduce a way to segregate the connections between
evolutionary branches at a selected time to enable exploration of overlapping
evolutionarily distinct regions. We have implemented these methods
in Infomap Bioregions, an interactive web application that makes it easy
to explore the possibly hierarchical and fuzzy patterns of biodiversity on
different scales in time and space.