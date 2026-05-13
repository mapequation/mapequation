---
title: "Memory in network flows and its effects on spreading dynamics and community detection"
authors: "Martin Rosvall, Alcides V. Esquivel, Andrea Lancichinetti, Jevin D. West, and Renaud Lambiotte"
year: 2014
journal: "Nature Comm. 5, 4630 (2014)"
doi: "http://dx.doi.org/10.1038/ncomms5630"
arxiv: "1305.4807"
links:
  - { label: "Data", href: "https://bitbucket.org/mapequation/memory-network-data/wiki/Home" }
figure:
  caption: "First-order Markov dynamics distort real constraints on flow. (a) In a first-order Markov approach, we model passengers’ travel to a city to be proportional to the observed volume of traffic to that city, and irrespective of where the passengers come from. (b) In a second-order Markov model, passengers’ travel to a city is still proportional to the traffic volume, but also dependent on where the passengers come from. In this example, out-and-back traffic to Chicago only dominates overtransfer traffic when second-order Markov dynamics are taken into account. (c,d) Journal citation flow shows the same memory effect. Citation flow from four different journals to PNAS is mostly shown to return to the same journal or continue to a related journal only when second-order Markov dynamics are taken into account. The percentages represent the relative return flow."
---

Random walks on networks is the standard tool for modelling spreading processes in social and biological systems. This first-order Markov approach is used in conventional community detection, ranking and spreading analysis, although it ignores a potentially important feature of the dynamics: where flow moves to may depend on where it comes from. Here we analyse pathways from different systems, and although we only observe marginal consequences for disease spreading, we show that ignoring the effects of second-order Markov dynamics has important consequences for community detection, ranking and information spreading. For example, capturing dynamics with a second-order Markov model allows us to reveal actual travel patterns in air traffic and to uncover multidisciplinary journals in scientific communication. These findings were achieved only by using more available data and making no additional assumptions, and therefore suggest that accounting for higher-order memory in network flows can help us better understand how real systems are organized and function.
