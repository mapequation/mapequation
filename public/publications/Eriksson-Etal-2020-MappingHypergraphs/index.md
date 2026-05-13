---
title: "How choosing random-walk model and network representation matters for flow-based community detection in hypergraphs"
authors: "Anton Eriksson, Daniel Edler, Alexis Rojas, Manlio de Domenico, and Martin Rosvall"
year: 2021
journal: "Comm. Phys. 4, 133 (2021)"
doi: "https://doi.org/10.1038/s42005-021-00634-z"
arxiv: "2101.00656"
links:
  - label: "Code & data"
    href: "https://github.com/mapequation/mapping-hypergraphs"
figure:
  caption: "A schematic hypergraph represented with three types of networks. (a) The schematic hypergraph with weighted hyperedges and hyperedge-dependent node weights. Thin borders for weight 1 and thick borders for weight 3. A lazy random walk on the schematic hypergraph represented on: (b) a bipartite network, (c) a unipartite network, and (d) a multilevel network. The colours indicate optimised module assignments, in (d) for hyperedge-similarity walks."
---

Hypergraphs offer an explicit formalism to describe multibody interactions in complex systems. To connect dynamics and function in systems with these higher-order interactions, network scientists have generalised random-walk models to hypergraphs and studied the multibody effects on flow-based centrality measures. But mapping the large-scale structure of those flows requires effective community detection methods. We derive unipartite, bipartite, and multilayer network representations of hypergraph flows and explore how they and the underlying random-walk model change the number, size, depth, and overlap of identified multilevel communities. These results help researchers choose the appropriate modelling approach when mapping flows on hypergraphs.
