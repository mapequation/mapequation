---
title: "Compressing regularized dynamics improves link prediction with the map equation in sparse networks"
authors: "Maja Lindström, Christopher Blöcker, Tommy Löfstedt, Martin Rosvall"
year: 2025
date: "2025-05-22"
journal: "Physical Review E 111, 054314 (2025)"
doi: "https://doi.org/10.1103/PhysRevE.111.054314"
arxiv: "2410.08777"
featured: true
figure:
    caption: "A communication game on a network. The black line illustrates a possible path of a random walk on the network, with colors representing different modules. (a) An example network with 7 nodes and 10 links. Link widths correspond to their weights, shown next to each link. (b) A one-level partition with all nodes grouped into the same module, and seven unique codewords. The sequence of codewords below the network describes the random walk (23 bits). (c) A two-level partition where nodes are divided into two modules with reusable codewords. Arrows show codewords for entering and exiting modules. The random walker’s path can now be communicated more efficiently (22 bits)."
---

Predicting future interactions or novel links in networks is an indispensable tool across diverse domains, including genetic research, online social networks, and recommendation systems. Among the numerous techniques developed for link prediction, those leveraging the networks' community structure have proven highly effective. For example, the recently proposed MapSim predicts links based on a similarity measure derived from the code structure of the map equation, a community-detection objective function that operates on network flows. However, the standard map equation assumes complete observations and typically identifies many small modules in networks where the nodes connect through only a few links. This aspect can degrade MapSim's performance on sparse networks. To overcome this limitation, we propose to incorporate a global regularization method based on a Bayesian estimate of the transition rates along with three local regularization methods. The regularized versions of the map equation compensate for incomplete observations and mitigate spurious community fragmentation in sparse networks. The regularized methods outperform standard MapSim and several state-of-the-art embedding methods in highly sparse networks. The principled global method requires no hyperparameter tuning and runs at least an order of magnitude faster than the embedding methods.
