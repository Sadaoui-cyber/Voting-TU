const { expect } = require("chai");
const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const Voting = artifacts.require("Voting");

contract("Voting", (accounts) => {
  // Déclaration des variables
  const owner = accounts[0];
  const addr1 = accounts[1];
  const addr2 = accounts[2];
  const nonRegistered = accounts[3];
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  const emptyString = "";
  const proposal1 = "Proposal 1";
  const proposal2 = "Proposal 2";
  const invalidProposalId = "999";

  let votingInstance;

  beforeEach(async function () {
    // Déploiement du contrat avant chaque test
    votingInstance = await Voting.new({ from: owner });
  });

  describe("Registration", function () {
    it("should revert when a non-voter tries to access a function with onlyVoters modifier", async () => {
      // Vérification du rejet lorsque quelqu'un qui n'est pas un électeur essaie d'accéder à une fonction avec le modificateur onlyVoters
      await expectRevert(
        votingInstance.addProposal("Proposal 1", { from: nonRegistered }),
        "You're not a voter"
      );
    });

    it("should not allow non-owner to add a voter", async function () {
      // Vérification du rejet lorsque quelqu'un qui n'est pas le propriétaire du contrat essaie d'ajouter un électeur
      await expectRevert(
        votingInstance.addVoter(addr1, { from: addr1 }),
        "Ownable: caller is not the owner"
      );
    });

    it("should not allow adding a voter when registration is closed", async function () {
      // Vérification du rejet lorsque l'ajout d'un électeur est tenté alors que l'enregistrement est fermé
      await votingInstance.startProposalsRegistering({ from: owner });
      await expectRevert(
        votingInstance.addVoter(addr1, { from: owner }),
        "Voters registration is not open yet"
      );
    });

    it("should not allow adding a voter if already registered", async function () {
      // Vérification du rejet lorsque l'ajout d'un électeur déjà enregistré est tenté
      await votingInstance.addVoter(addr1, { from: owner });
      await expectRevert(
        votingInstance.addVoter(addr1, { from: owner }),
        "Already registered"
      );
    });
  });

  describe("Proposals Registration", function () {
    beforeEach(async function () {
      // Configuration initiale pour les tests de l'enregistrement des propositions
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(addr1, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
    });

    it("should not allow a non-registered voter to add a proposal", async function () {
      // Vérification du rejet lorsque quelqu'un qui n'est pas un électeur enregistré essaie d'ajouter une proposition
      await expectRevert(
        votingInstance.addProposal("Proposal 1", { from: nonRegistered }),
        "You're not a voter"
      );
    });

    it("should not allow a non-owner to start proposals registration", async () => {
      const nonRegistered = accounts[3];

      try {
        await votingInstance.startProposalsRegistering({ from: nonRegistered });
        assert.fail("Non-owner was able to start proposals registration");
      } catch (error) {
        assert(
          error.message.includes("Ownable: caller is not the owner"),
          "Unexpected error message"
        );
      }
    });

    it("should not allow adding an empty proposal", async function () {
      // Vérification du rejet lorsqu'une proposition vide est tentée d'être ajoutée
      await expectRevert(
        votingInstance.addProposal("", { from: addr1 }),
        "Vous ne pouvez pas ne rien proposer"
      );
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Configuration initiale pour les tests du vote
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(addr1, { from: owner });
      await votingInstance.addVoter(addr2, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
      await votingInstance.addProposal("Proposal 1", { from: addr1 });
      await votingInstance.addProposal("Proposal 2", { from: addr2 });
      await votingInstance.endProposalsRegistering({ from: owner });
      await votingInstance.startVotingSession({ from: owner });
    });

    it("should not allow voting for a non-existing proposal", async function () {
      // Vérification du rejet lorsqu'un vote est tenté pour une proposition qui n'existe pas
      await expectRevert(
        votingInstance.setVote(999, { from: addr1 }),
        "Proposal not found"
      );
    });

    it("should not allow a voter to vote twice", async function () {
      // Vérification du rejet lorsqu'un électeur essaie de voter deux fois
      await votingInstance.setVote(1, { from: addr1 });
      await expectRevert(
        votingInstance.setVote(1, { from: addr1 }),
        "You have already voted"
      );
    });
  });

  describe("Tallying", function () {
    beforeEach(async function () {
      // Configuration initiale pour les tests du décompte des votes
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(addr1, { from: owner });
      await votingInstance.addVoter(addr2, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
      await votingInstance.addProposal("Proposal 1", { from: addr1 });
      await votingInstance.addProposal("Proposal 2", { from: addr2 });
      await votingInstance.endProposalsRegistering({ from: owner });
      await votingInstance.startVotingSession({ from: owner });
      await votingInstance.setVote(1, { from: addr1 });
      await votingInstance.setVote(2, { from: addr2 });
      await votingInstance.endVotingSession({ from: owner });
    });

    it("should not allow tallying votes when voting session is not ended", async function () {
      // Vérification du rejet lorsque le décompte des votes est tenté alors que la session de vote n'est pas terminée
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(addr1, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
      await votingInstance.endProposalsRegistering({ from: owner });
      await votingInstance.startVotingSession({ from: owner });
      await expectRevert(
        votingInstance.tallyVotes({ from: owner }),
        "Current status is not voting session ended"
      );
    });

    it("should not allow unauthorized modification of the contract after voting session", async function () {
      // Vérification du rejet lorsque des modifications non autorisées du contrat sont tentées après la session de vote
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(addr1, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
      await votingInstance.endProposalsRegistering({ from: owner });
      await votingInstance.startVotingSession({ from: owner });
      await votingInstance.endVotingSession({ from: owner });
      await expectRevert(
        votingInstance.addVoter(addr1, { from: owner }),
        "Voters registration is not open yet"
      );
      await expectRevert(
        votingInstance.setVote(1, { from: addr1 }),
        "Voting session havent started yet"
      );
      await expectRevert(
        votingInstance.addProposal("Proposal 3", { from: addr1 }),
        "Proposals are not allowed yet"
      );
      await expectRevert(
        votingInstance.tallyVotes({ from: addr1 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Workflow 1 Add voter", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("Add voter", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });
    });
  });

  describe("Workflow 2 Start proposals registration", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("Start proposals registration ", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");
    });
  });

  describe("Workflow 3 Add proposals", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("Add Proposals", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });
    });
  });

  describe("Workflow 4 EndProposalsRegistering", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("EndProposalsRegistering", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });

      await votingInstance.endProposalsRegistering({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("2");
    });
  });

  describe("Workflow 5 startVotingSession", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("startVotingSession", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });

      await votingInstance.endProposalsRegistering({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("2");

      await votingInstance.startVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("3");
    });
  });

  describe("Workflow 6 setVote", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("setVote", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });

      await votingInstance.endProposalsRegistering({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("2");

      await votingInstance.startVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("3");

      const receipt5 = await votingInstance.setVote(1, { from: addr1 });
      expectEvent(receipt5, "Voted", { voter: addr1, proposalId: "1" });
      const receipt6 = await votingInstance.setVote(2, { from: addr2 });
      expectEvent(receipt6, "Voted", { voter: addr2, proposalId: "2" });
    });
  });

  describe("Workflow 7 endVotingSession", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("endVotingSession", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });

      await votingInstance.endProposalsRegistering({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("2");

      await votingInstance.startVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("3");

      const receipt5 = await votingInstance.setVote(1, { from: addr1 });
      expectEvent(receipt5, "Voted", { voter: addr1, proposalId: "1" });
      const receipt6 = await votingInstance.setVote(2, { from: addr2 });
      expectEvent(receipt6, "Voted", { voter: addr2, proposalId: "2" });

      await votingInstance.endVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("4");
    });
  });

  describe("Workflow 8 tallyVotes", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("tallyVotes", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });

      await votingInstance.endProposalsRegistering({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("2");

      await votingInstance.startVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("3");

      const receipt5 = await votingInstance.setVote(1, { from: addr1 });
      expectEvent(receipt5, "Voted", { voter: addr1, proposalId: "1" });
      const receipt6 = await votingInstance.setVote(2, { from: addr2 });
      expectEvent(receipt6, "Voted", { voter: addr2, proposalId: "2" });

      await votingInstance.endVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("4");

      const receipt7 = await votingInstance.tallyVotes({ from: owner });
      expectEvent(receipt7, "WorkflowStatusChange", {
        previousStatus: "4",
        newStatus: "5",
      });
      const winningProposalId = await votingInstance.winningProposalID();
      expect(winningProposalId.toString()).to.equal("1");
    });
  });

  describe("Workflow 9 Verify final results", function () {
    beforeEach(async function () {
      votingInstance = await Voting.new({ from: owner });
    });

    it("Verify final results", async function () {
      // Step 2: Register voters
      const receipt1 = await votingInstance.addVoter(addr1, { from: owner });
      expectEvent(receipt1, "VoterRegistered", { voterAddress: addr1 });
      const receipt2 = await votingInstance.addVoter(addr2, { from: owner });
      expectEvent(receipt2, "VoterRegistered", { voterAddress: addr2 });

      await votingInstance.startProposalsRegistering({ from: owner });
      let workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("1");

      const receipt3 = await votingInstance.addProposal("Proposal 1", {
        from: addr1,
      });
      expectEvent(receipt3, "ProposalRegistered", { proposalId: "1" });
      const receipt4 = await votingInstance.addProposal("Proposal 2", {
        from: addr2,
      });
      expectEvent(receipt4, "ProposalRegistered", { proposalId: "2" });

      await votingInstance.endProposalsRegistering({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("2");

      await votingInstance.startVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("3");

      const receipt5 = await votingInstance.setVote(1, { from: addr1 });
      expectEvent(receipt5, "Voted", { voter: addr1, proposalId: "1" });
      const receipt6 = await votingInstance.setVote(2, { from: addr2 });
      expectEvent(receipt6, "Voted", { voter: addr2, proposalId: "2" });

      await votingInstance.endVotingSession({ from: owner });
      workflowStatus = await votingInstance.workflowStatus();
      expect(workflowStatus).to.be.bignumber.equal("4");

      const receipt7 = await votingInstance.tallyVotes({ from: owner });
      expectEvent(receipt7, "WorkflowStatusChange", {
        previousStatus: "4",
        newStatus: "5",
      });
      const winningProposalId = await votingInstance.winningProposalID();
      expect(winningProposalId.toString()).to.equal("1");

      const voter1 = await votingInstance.getVoter(addr1, { from: addr1 });
      expect(voter1.hasVoted).to.equal(true);
      expect(voter1.votedProposalId.toString()).to.equal("1");
      const voter2 = await votingInstance.getVoter(addr2, { from: addr1 });
      expect(voter2.hasVoted).to.equal(true);
      expect(voter2.votedProposalId.toString()).to.equal("2");
      const proposal1 = await votingInstance.getOneProposal(1, { from: addr1 });
      expect(proposal1.voteCount.toString()).to.equal("1");
      const proposal2 = await votingInstance.getOneProposal(2, { from: addr1 });
      expect(proposal2.voteCount.toString()).to.equal("1");
    });
  });
});
