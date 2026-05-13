---
title: "Mapping flows on bipartite networks"
authors: "Christopher Blöcker, Martin Rosvall"
year: 2020
journal: "Phys. Rev. E 102, 052305 (2020)"
doi: "https://doi.org/10.1103/PhysRevE.102.052305"
arxiv: "2007.01666"
figure:
  caption: "Graphical representation of the code books for the standard map equation and the bipartite map equation with α=0.1 in an unweighted example network where colors indicate modules. Block width corresponds to code word usage rate and block height to code-book entropy, a block's contribution to the map equation is its area. Letters in the blocks indicate which nodes they refer to, and e stands for module exits. The horizontal gray bars show the contributions at index and module level. (a) The example network with color-coded modules. (b) The standard map equation calculates the code length as 2.61 bits. (c) Using node-type information worth I = 0.47 bits, the bipartite map equation with mixed node-type memory improves the compression by 0.65 bits to 1.96 bits."
---

Mapping network flows provides insight into the organization of networks, but even though many real-networks are bipartite, no method for mapping flows takes advantage of the bipartite structure. What do we miss by discarding this information and how can we use it to understand the structure of bipartite networks better? The map equation models network flows with a random walk and exploits the information-theoretic duality between compression and finding regularities to detect communities in networks. However, it does not use the fact that random walks in bipartite networks alternate between node types, information worth 1 bit. To make some or all of this information available to the map equation, we developed a coding scheme that remembers node types at different rates. We explored the community landscape of bipartite real-world networks from no node-type information to full node-type information and found that using node types at a higher rate generally leads to deeper community hierarchies and a higher resolution. The corresponding compression of network flows exceeds the amount of extra information provided. Consequently, taking advantage of the bipartite structure increases the resolution and reveals more network regularities.
