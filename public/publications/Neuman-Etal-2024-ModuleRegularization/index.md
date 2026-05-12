---
title: "Module-based regularization improves Gaussian graphical models when observing noisy data"
authors: "Magnus Neuman, Joaquín Calatayud, Viktor Tasselius, Martin Rosvall"
year: 2024
date: "2024-04-17"
journal: "Applied Network Science 9, 8 (2024)"
doi: "https://doi.org/10.1007/s41109-024-00618-2"
arxiv: "2303.16796"
cites:
  - Rosvall-Bergstrom-2008-Maps-of-information-flow
  - Rosvall-Axelsson-Bergstrom-2009-Map-equation
  - Kheirkhahzadeh-Etal-2016-Markovtimes
  - Edler-Etal-2017-Bioregions
  - Edler-Etal-2017-MappingHigherOrder
  - Aslak-Etal-2017-IntermittentCommunities
  - Calatayud-Etal-2019-SolutionLandscape
  - Neuman-Etal-2022-CrossValidation
---

Inferring relations from correlational data allows researchers across the sciences to uncover complex connections between variables for insights into the underlying mechanisms. The researchers often represent inferred relations using Gaussian graphical models, requiring regularization to sparsify the models. Acknowledging that the modular structure of the inferred network is often studied, we suggest module-based regularization to balance under- and overfitting. Compared with the graphical lasso, a standard approach using the Gaussian log-likelihood for estimating the regularization strength, this approach better recovers and infers modular structure in noisy synthetic and real data. The module-based regularization technique improves the usefulness of Gaussian graphical models in the many applications where they are employed.
