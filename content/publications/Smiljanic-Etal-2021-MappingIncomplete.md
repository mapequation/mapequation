---
title: "Mapping flows on weighted and directed networks with incomplete observations"
authors: "Jelena Smiljanić, Christopher Blöcker, Daniel Edler, Martin Rosvall"
year: 2021
journal: "J. Comp. Net. 9, 6 (2021)"
doi: "https://doi.org/10.1093/comnet/cnab044"
arxiv: "2106.14798"
figure:
  caption: "FIG. A schematic weighted network with complete and missing link observations. (a) A complete network with accurate network flows and inferred communities. (b) Missing link observations introduce inaccuracies. (c) A standard teleportation scheme cannot overcome the inaccuracies. (d) Regularized network flows with an empirical Bayes estimate of the transition rates using the relaxed continuous configuration model recovers the complete network’s community structure. Light background areas indicate optimal community assignments. The width of the light blue lines represents teleportation weight. The size of the light blue node centres indicates teleportation probability. The dashed black lines show sample trajectories of random walks. We omit link directions in this example for simplicity."
---

Detecting significant community structure in networks with incomplete observations is challenging because the evidence for specific solutions fades away with missing data. For example, recent research shows that flow-based community detection methods can highlight spurious communities in sparse undirected and unweighted networks with missing links. Current Bayesian approaches developed to overcome this problem do not work for incomplete observations in weighted and directed networks that describe network flows. To overcome this gap, we extend the idea behind the Bayesian estimate of the map equation for unweighted and undirected networks to enable more robust community detection in weighted and directed networks. We derive an empirical Bayes estimate of the transitions rates that can incorporate metadata information and show how an efficient implementation in the community-detection method Infomap provides more reliable communities even with a significant fraction of data missing.
