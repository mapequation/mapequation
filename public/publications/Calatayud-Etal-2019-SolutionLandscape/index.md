---
title: "Exploring the solution landscape enables more reliable network community detection"
authors: "Joaquín Calatayud, Rubén Bernardo-Madrid, Magnus Neuman, Alexis Rojas, and Martin Rosvall"
year: 2019
journal: "Phys. Rev. E 100, 052308 (2019)"
doi: "https://doi.org/10.1103/PhysRevE.100.052308"
arxiv: "1905.11230"
links:
  - label: "Code & data"
    href: "https://github.com/mapequation/solution-landscape"
figure:
  caption: "A schematic solution landscape projected into a two-dimensional space with isolines for quality score. White squares and black circles represent two network partition clusters, with partitions distributed based on their partition distances. Large symbols represent cluster centers."
---

To understand how a complex system is organized and functions, researchers often identify communities in the system's network of interactions. Because it is practically impossible to explore all solutions to guarantee the best one, many community-detection algorithms rely on multiple stochastic searches. But for a given combination of network and stochastic algorithm, how many searches are sufficient to find a solution that is good enough? The standard approach is to pick a reasonably large number of searches and select the network partition with the highest quality or derive a consensus solution based on all network partitions. However, if different partitions have similar qualities such that the solution landscape is degenerate, the single best partition may miss relevant information, and a consensus solution may blur complementary communities. Here we address this degeneracy problem with coarse-grained descriptions of the solution landscape. We cluster network partitions based on their similarity and suggest an approach to determine the minimum number of searches required to describe the solution landscape adequately. To make good use of all partitions, we also propose different ways to explore the solution landscape, including a significance clustering procedure. We test these approaches on synthetic and real-world networks, and find that different networks and algorithms require a different number of searches and that exploring the coarse-grained solution landscape can reveal noteworthy complementary solutions and enable more reliable community detection.
