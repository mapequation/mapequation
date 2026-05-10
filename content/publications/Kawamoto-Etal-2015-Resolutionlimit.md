---
title: "Estimating the resolution limit of the map equation in community detection"
authors: "Tatsuro Kawamoto and Martin Rosvall"
year: 2015
journal: "Phys Rev E 91, 012809 (2015)"
doi: "http://dx.doi.org/10.1103/PhysRevE.91.012809"
arxiv: "1402.4385"
figure:
  caption: "FIG. 3 Detected sizes of modules for each Sierpinski triangle of different size l with the two-level method (circular points) and the multilevel method (cross points). For example, the two-level method detects modules of 3 links and 12 links when the hierarchy of the Sierpinski triangle is three. The Sierpinski triangles up to three levels are illustrated at the top."
---

A community detection algorithm is considered to have a resolution limit if the scale of the smallest modules that can be resolved depends on the size of the analyzed subnetwork. The resolution limit is known to prevent some community detection algorithms from accurately identifying the modular structure of a network. In fact, any global objective function for measuring the quality of a two-level assignment of nodes into modules must have some sort of resolution limit or an external resolution parameter. However, it is yet unknown how the resolution limit affects the so-called map equation, which is known to be an efficient objective function for community detection. We derive an analytical estimate and conclude that the resolution limit of the map equation is set by the total number of links between modules instead of the total number of links in the full network as for modularity. This mechanism makes the resolution limit much less restrictive for the map equation than for modularity; in practice, it is orders of magnitudes smaller. Furthermore, we argue that the effect of the resolution limit often results from shoehorning multilevel modular structures into two-level descriptions. As we show, the hierarchical map equation effectively eliminates the resolution limit for networks with nested multilevel modular structures.
