---
title: "Mapping nonlocal relationships between metadata and network structure with metadata-dependent encoding of random walks"
authors: "Aleix Bassolas, Anton Holmgren, Antoine Marot, Martin Rosvall, Vincenzo Nicosia"
year: 2022
journal: "Sci. Adv. 8, 43 (2022)"
doi: "https://doi.org/10.1126/sciadv.abn7558"
arxiv: "2111.05158"
links:
  - label: "Data"
    href: "https://github.com/mapequation/metadata-informed-community-detection-data"
  - label: "Notebooks"
    href: "https://github.com/mapequation/color-map-equation"
figure:
  caption: "Lazy encoding random walks on a schematic network with metadata. In this case, the random walk always encodes the next step if the target node's metadata is the same as the current node. When the metadata differs, the walker encodes with probability p in [1/3, 1] in a, p in [1/10, 1/3) in b, and p < 1/10 in c. Node shapes represent metadata, and node colors represent optimal partitions. Random walks with labeled circles where they encode and dashed lines where they do not, colored by the currently encoded module."
---

Integrating structural information and metadata, such as gender, social status, or interests, enriches networks and enables a better understanding of the large-scale structure of complex systems. However, existing metadata integration approaches consider only immediately adjacent nodes, thus failing to identify and exploit non-local relations between metadata and network structure, typical of many spatial and social systems. We show how a flow-based community-detection approach can integrate network information and distant metadata, revealing more complex relations. We analyze social and spatial networks using the map equation framework and find that our methodology can detect functional metadata-informed communities in diverse real-world systems. For example, in a mobility network of London, we identify communities that reflect the income distribution, and in a European power-grid network, we identify communities that capture relations between geography and energy prices beyond country borders.
