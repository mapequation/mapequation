---
title: "Map Equation Centrality: A Community-Aware Centrality Score Based on the Map Equation"
authors: "Christopher Blöcker, Juan Carlos Nieves, Martin Rosvall"
year: 2022
date: "2022-07-16"
journal: "Appl Netw Sci 7, 56 (2022)"
doi: "https://doi.org/10.1007/s41109-022-00477-9"
arxiv: "2201.12590"
links:
  - label: "Code & data"
    href: "https://github.com/mapequation/map-equation-centrality"
figure:
  caption: "Two options for describing a random walk when a node is silenced, with the silenced node shown as a ring. (a) Using the same code as before: when the random walker visits the silenced node, the sender does not use the corresponding node-visit codeword. (b) Designing a new code: the silenced node does not receive a codeword and visits to that node cannot be encoded. However, the sender communicates module entries through the silenced node."
---

To measure node importance, network scientists employ centrality scores that typically take a microscopic or macroscopic perspective, relying on node features or global network structure. However, traditional centrality measures such as degree centrality, betweenness centrality, or PageRank neglect the community structure found in real-world networks. To study node importance based on network flows from a mesoscopic perspective, we analytically derive a community-aware information-theoretic centrality score based on network flow and the coding principles behind the map equation: map equation centrality. Map equation centrality measures how much further we can compress the network's modular description by not coding for random walker transitions to the respective node, using an adapted coding scheme and determining node importance from a network flow-based point of view. The information-theoretic centrality measure can be determined from a node's local network context alone because changes to the coding scheme only affect other nodes in the same module. Map equation centrality is agnostic to the chosen network flow model and allows researchers to select the model that best reflects the dynamics of the process under study. Applied to synthetic networks, we highlight how our approach enables a more fine-grained differentiation between nodes than node-local or network-global measures. Predicting influential nodes for two different dynamical processes on real-world networks with traditional and other community-aware centrality measures, we find that activating nodes based on map equation centrality scores tends to create the largest cascades in a linear threshold model.
