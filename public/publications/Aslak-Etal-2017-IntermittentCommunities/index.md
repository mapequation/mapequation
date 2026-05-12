---
title: "Constrained information flows in temporal networks reveal intermittent communities"
authors: "Ulf Aslak, Martin Rosvall, and Sune Lehmann"
year: 2018
journal: "Phys. Rev. E 97, 062312 (2018)"
doi: "https://doi.org/10.1103/PhysRevE.97.062312"
arxiv: "1711.07649"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Domenico-Etal-2015-Multiplex
  - Kawamoto-Etal-2015-Resolutionlimit
  - Edler-Etal-2017-MappingHigherOrder
figure:
  caption: "FIG. 1 Going beyond standard methods makes it possible to take advantage of richer interaction data. (a) Standard methods shoehorn interaction data about a complex system into an often unweighted and undirected network, which limits what regularities can be detected. (b) Modeling and mapping higher-order network flows can break this detectability limit."
---

Many real-world networks are representations of dynamic systems with interactions that change over time, often in uncoordinated ways and at irregular intervals. For example, university students connect in intermittent groups that repeatedly form and dissolve based on multiple factors, including their lectures, interests, and friends. Such dynamic systems can be represented as multilayer networks where each layer represents a snapshot of the temporal network. In this representation, it is crucial that the links between layers accurately capture real dependencies between those layers. Often, however, these dependencies are unknown. Therefore, current methods connect layers based on simplistic assumptions that cannot capture node-level layer dependencies. For example, connecting every node to itself in other layers with the same weight can wipe out essential dependencies between intermittent groups, making it difficult or even impossible to identify them. In this paper, we present a principled approach to estimating node-level layer dependencies based on the network structure within each layer. We implement our node-level coupling method in the community detection framework Infomap and demonstrate its performance compared to current methods on synthetic and real temporal networks. We show that our approach more effectively constrains information inside multilayer communities so that Infomap can better recover planted groups in multilayer benchmark networks that represent multiple modes with different groups and better identify intermittent communities in real temporal contact networks. These results suggest that node-level layer coupling can improve the modeling of information spreading in temporal networks and better capture their dynamic community structure.
