---
title: "Efficient community detection of network flows for varying Markov times and bipartite networks"
authors: "Masoumeh Kheirkhahzadeh, Andrea Lancichinetti, and Martin Rosvall"
year: 2016
journal: "Phys. Rev. E 93, 032309 (2016)"
doi: "http://dx.doi.org/10.1103/PhysRevE.93.032309"
arxiv: "1511.01540"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Esquivel-Rosvall-2011-Overlapping
  - Lambiotte-Rosvall-2012-Smart-teleportation
  - Kawamoto-Etal-2015-Resolutionlimit
figure:
  caption: "FIG. 1 The Markov time sets the scale of the flow modules. A schematic Sierpinski network with hierarchically nested modules, and the code length for different partitions indicated in the network as a function of the Markov time. The partition with the shortest code length for a given Markov time is highlighted."
---

Community detection of network flows conventionally assumes one-step dynamics on the links. For sparse networks and interest in large-scale structures, longer timescales may be more appropriate. Oppositely, for large networks and interest in small-scale structures, shorter timescales may be better. However, current methods for analyzing networks at different timescales require expensive and often infeasible network reconstructions. To overcome this problem, we introduce a method that takes advantage of the inner-workings of the map equation and evades the reconstruction step. This makes it possible to efficiently analyze large networks at different Markov times with no extra overhead cost. The method also evades the costly unipartite projection for identifying flow modules in bipartite networks.
