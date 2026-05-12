---
title: "Maps of sparse Markov chains efficiently reveal community structure in network flows with memory"
authors: "Christian Persson, Ludvig Bohlin, Daniel Edler, and Martin Rosvall"
year: 2016
arxiv: "1606.08328"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Lambiotte-Rosvall-2012-Smart-teleportation
  - Kheirkhahzadeh-Etal-2016-Markovtimes
figure:
  caption: "FIG. 5 Map of citation flows in science modeled by a sparse Markov chain model. The map highlights the most influential research fields in each research area (green circles), citation flows between fields (blue arrows), and how PNAS is represented in multiple research fields (red circles). Orange circles indicate where citation flows through PNAS represented in microbiology and plant science move next, respectively. Circle sizes are proportional to the citation flows and the inner circles represent module flow persistence. The map builds on a sparse Markov chain model based on citation flows through 4.9 million articles published 2007--2012 in the top 10,000 journals of Web of Science."
---

To better understand the flows of ideas or information through social and biological systems, researchers develop maps that reveal important patterns in network flows. In practice, network flow models have implied memoryless first-order Markov chains, but recently researchers have introduced higher-order Markov chain models with memory to capture patterns in multi-step pathways. Higher-order models are particularly important for effectively revealing actual, overlapping community structure, but higher-order Markov chain models suffer from the curse of dimensionality: their vast parameter spaces require exponentially increasing data to avoid overfitting and therefore make mapping inefficient already for moderate-sized systems. To overcome this problem, we introduce an efficient cross-validated mapping approach based on network flows modeled by sparse Markov chains. To illustrate our approach, we present a map of citation flows in science with research fields that overlap in multidisciplinary journals. Compared with currently used categories in science of science studies, the research fields form better units of analysis because the map more effectively captures how ideas flow through science.
