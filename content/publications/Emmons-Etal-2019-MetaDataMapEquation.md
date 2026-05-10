---
title: "Map equation with metadata: Varying the role of attributes in community detection"
authors: "Scott Emmons and Peter J. Mucha"
year: 2019
journal: "Phys. Rev. E 100, 022301 (2019)"
doi: "https://doi.org/10.1103/PhysRevE.100.022301"
arxiv: "1810.10433"
figure:
  caption: "FIG. 1 (a,d) Illustrating how our formulation of the content map equation extends the traditional map equation. (a) An example random walk on a weighted, undirected network. The thickness of each edge corresponds to its weight. (d) Introducing four discrete metadata values, depicted by shape, to the nodes of the network. Our extension of the traditional map equation with the content map equation additionally encodes the metadata value at each step of the random walk by introducing metadata codebooks."
---

Much of the community detection literature studies structural communities, communities defined solely by the connectivity patterns of the network. Often networks contain additional metadata which can inform community detection such as the grade and gender of students in a high school social network. In this work, we introduce a tuning parameter to the content map equation that allows users of the Infomap community detection algorithm to control the metadata’s relative importance for identifying network structure. On synthetic networks, we show that our algorithm can overcome the structural detectability limit when the metadata are well aligned with community structure. On real-world networks, we show how our algorithm can achieve greater mutual information with the metadata at a cost in the traditional map equation. Our tuning parameter, like the focusing knob of a microscope, allows users to “zoom in” and “zoom out” on communities with varying levels of focus on the metadata.
