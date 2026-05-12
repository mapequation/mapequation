---
title: "Ranking and clustering of nodes in networks with smart teleportation"
authors: "Renaud Lambiotte and Martin Rosvall"
year: 2012
journal: "Phys. Rev. E 85, 056107 (2012)"
doi: "http://dx.doi.org/10.1103/PhysRevE.85.056107"
arxiv: "1112.5252"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
figure:
  caption: "FIG. 1 Common and smart teleportation in networks. (a) Recorded node teleportation is the commonly used tele- portation scheme. Both steps along links and teleportation steps contribute to node visit rates for ranking and transition rates for clustering, and nodes are the targets of teleportation. (b) In recorded link teleportation, all steps contribute and links are the targets of teleportation. (c) In unrecorded node teleportation, only steps along links (solid lines and filled circles) contribute, and not those due to teleportation (dashed line and open circle). (d) In unrecorded link teleportation, only steps along links contribute and links are the targets of teleportation."
---

Random teleportation is a necessary evil for ranking and clustering directed networks based on random walks. Teleportation enables ergodic solutions, but the solutions must necessarily depend on the exact implementation and parametrization of the teleportation. For example, in the commonly used PageRank algorithm, the teleportation rate must trade off a heavily biased solution with a uniform solution. Here we show that teleportation to links rather than nodes enables a much smoother trade-off and effectively more robust results. We also show that, by not recording the teleportation steps of the random walker, we can further reduce the effect of teleportation with dramatic effects on clustering.
