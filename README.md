# Voting Contract

Ce projet contient un contrat de vote écrit en Solidity pour une application de vote. Le contrat permet d'enregistrer des votants, d'ajouter des propositions, de voter pour une proposition et de décompter les votes.

## Dépendances

Ce projet utilise les bibliothèques suivantes :

- [Chai](https://www.chaijs.com/) : une bibliothèque d'assertions pour les tests en JavaScript.
- [OpenZeppelin Test Helpers](https://github.com/OpenZeppelin/openzeppelin-test-helpers) : une bibliothèque de fonctions d'assistance pour les tests de contrats Ethereum.

Le code fourni est un contrat de vote implémenté en Solidity, qui est un langage de programmation utilisé pour écrire des contrats intelligents sur la plateforme Ethereum. Voici une explication du code en 20 lignes :

1. Les deux premières lignes importent les bibliothèques nécessaires pour effectuer les tests du contrat de vote.
2. La ligne `const Voting = artifacts.require("Voting");` charge le contrat Voting à partir des artefacts du contrat.
3. Le bloc `contract("Voting", (accounts) => { ... })` définit un bloc de tests pour le contrat Voting, en utilisant les comptes Ethereum disponibles.
4. Les variables `owner`, `addr1`, `addr2`, `nonRegistered`, `emptyAddress`, `emptyString`, `proposal1`, `proposal2` et `invalidProposalId` sont déclarées pour stocker les adresses des comptes Ethereum et d'autres valeurs utilisées dans les tests.
5. La variable `votingInstance` est déclarée pour stocker une instance du contrat Voting déployé pour chaque test.
6. La fonction `beforeEach` est exécutée avant chaque test et elle déploie une nouvelle instance du contrat Voting.
7. Le bloc `describe("Registration", function () { ... })` contient des tests relatifs à l'enregistrement des votants.
8. Le premier test vérifie que le contrat rejette l'accès à une fonction avec le modificateur `onlyVoters` pour un non-votant.
9. Le deuxième test vérifie que le contrat rejette l'ajout d'un votant par un compte qui n'est pas le propriétaire du contrat.
10. Le troisième test vérifie que le contrat rejette l'ajout d'un votant lorsque l'enregistrement est fermé.
11. Le quatrième test vérifie que le contrat rejette l'ajout d'un votant déjà enregistré.
12. Le bloc `describe("Proposals Registration", function () { ... })` contient des tests relatifs à l'enregistrement des propositions.
13. La fonction `beforeEach` dans ce bloc configure l'état initial pour les tests d'enregistrement des propositions.
14. Le premier test vérifie que le contrat rejette l'ajout d'une proposition par un non-votant enregistré.
15. Le deuxième test vérifie que le contrat rejette le démarrage de l'enregistrement des propositions par un compte qui n'est pas le propriétaire du contrat.
16. Le troisième test vérifie que le contrat rejette l'ajout d'une proposition vide.
17. Le bloc `describe("Voting", function () { ... })` contient des tests relatifs au processus de vote.
18. La fonction `beforeEach` dans ce bloc configure l'état initial pour les tests de vote.
19. Le premier test vérifie que le contrat rejette un vote pour une proposition qui n'existe pas.
20. Le deuxième test vérifie que le contrat rejette un électeur qui vote deux fois.

Les blocs `describe("Tallying", function () { ... })` et `describe("Workflow", function () { ... })` contiennent des tests supplémentaires pour le décompte des votes et le flux de travail du contrat de vote, respectivement.

