// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SmartJobsEscrow
/// @notice ETH escrow for SmartJobs jobs with downward freelancer bidding.
/// @dev The backend never holds funds. Clients fund this contract directly, and
/// frontend wallets call lifecycle functions that the backend only records.
contract SmartJobsEscrow {
    enum EscrowStatus {
        None,
        Funded,
        Locked,
        ReleaseRequested,
        Released,
        Refunded,
        Disputed,
        Cancelled
    }

    struct Escrow {
        address payable client;
        address payable freelancer;
        uint256 amount;
        uint256 bidAmount;
        EscrowStatus status;
        string jobId;
        string disputeReason;
        uint64 createdAt;
        uint64 updatedAt;
    }

    mapping(bytes32 => Escrow) private escrows;

    event EscrowCreated(
        bytes32 indexed escrowId,
        string jobId,
        address indexed client,
        uint256 amount
    );
    event EscrowLocked(
        bytes32 indexed escrowId,
        address indexed freelancer,
        uint256 bidAmount
    );
    event ReleaseRequested(bytes32 indexed escrowId);
    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed freelancer,
        uint256 paidToFreelancer,
        uint256 refundedToClient
    );
    event EscrowRefunded(bytes32 indexed escrowId, uint256 amount);
    event EscrowDisputed(bytes32 indexed escrowId, string reason);
    event EscrowCancelled(bytes32 indexed escrowId, uint256 amount);

    error EscrowAlreadyExists(bytes32 escrowId);
    error EscrowNotFound(bytes32 escrowId);
    error InvalidStatus(EscrowStatus currentStatus);
    error InvalidAmount();
    error InvalidFreelancer();
    error Unauthorized();
    error TransferFailed();

    modifier existingEscrow(bytes32 escrowId) {
        if (escrows[escrowId].status == EscrowStatus.None) {
            revert EscrowNotFound(escrowId);
        }
        _;
    }

    modifier onlyClient(bytes32 escrowId) {
        if (msg.sender != escrows[escrowId].client) {
            revert Unauthorized();
        }
        _;
    }

    modifier onlyFreelancer(bytes32 escrowId) {
        if (msg.sender != escrows[escrowId].freelancer) {
            revert Unauthorized();
        }
        _;
    }

    function createEscrow(
        bytes32 escrowId,
        string calldata jobId
    ) external payable {
        if (escrows[escrowId].status != EscrowStatus.None) {
            revert EscrowAlreadyExists(escrowId);
        }

        if (msg.value == 0) {
            revert InvalidAmount();
        }

        uint64 nowTimestamp = uint64(block.timestamp);

        escrows[escrowId] = Escrow({
            client: payable(msg.sender),
            freelancer: payable(address(0)),
            amount: msg.value,
            bidAmount: 0,
            status: EscrowStatus.Funded,
            jobId: jobId,
            disputeReason: "",
            createdAt: nowTimestamp,
            updatedAt: nowTimestamp
        });

        emit EscrowCreated(escrowId, jobId, msg.sender, msg.value);
    }

    function lockEscrow(
        bytes32 escrowId,
        address payable freelancer,
        uint256 bidAmount
    ) external existingEscrow(escrowId) onlyClient(escrowId) {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.status != EscrowStatus.Funded) {
            revert InvalidStatus(escrow.status);
        }

        if (freelancer == address(0) || freelancer == escrow.client) {
            revert InvalidFreelancer();
        }

        if (bidAmount == 0 || bidAmount > escrow.amount) {
            revert InvalidAmount();
        }

        escrow.freelancer = freelancer;
        escrow.bidAmount = bidAmount;
        escrow.status = EscrowStatus.Locked;
        escrow.updatedAt = uint64(block.timestamp);

        emit EscrowLocked(escrowId, freelancer, bidAmount);
    }

    function requestRelease(
        bytes32 escrowId
    ) external existingEscrow(escrowId) onlyFreelancer(escrowId) {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.status != EscrowStatus.Locked) {
            revert InvalidStatus(escrow.status);
        }

        escrow.status = EscrowStatus.ReleaseRequested;
        escrow.updatedAt = uint64(block.timestamp);

        emit ReleaseRequested(escrowId);
    }

    function release(
        bytes32 escrowId
    ) external existingEscrow(escrowId) onlyClient(escrowId) {
        Escrow storage escrow = escrows[escrowId];

        if (
            escrow.status != EscrowStatus.Locked &&
            escrow.status != EscrowStatus.ReleaseRequested
        ) {
            revert InvalidStatus(escrow.status);
        }

        uint256 freelancerPayment = escrow.bidAmount;
        uint256 clientRefund = escrow.amount - freelancerPayment;
        address payable freelancer = escrow.freelancer;
        address payable client = escrow.client;

        escrow.status = EscrowStatus.Released;
        escrow.updatedAt = uint64(block.timestamp);

        _sendEth(freelancer, freelancerPayment);

        if (clientRefund > 0) {
            _sendEth(client, clientRefund);
        }

        emit EscrowReleased(
            escrowId,
            freelancer,
            freelancerPayment,
            clientRefund
        );
    }

    function refund(
        bytes32 escrowId
    ) external existingEscrow(escrowId) onlyClient(escrowId) {
        Escrow storage escrow = escrows[escrowId];

        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.Locked &&
            escrow.status != EscrowStatus.ReleaseRequested &&
            escrow.status != EscrowStatus.Disputed
        ) {
            revert InvalidStatus(escrow.status);
        }

        uint256 refundAmount = escrow.amount;
        address payable client = escrow.client;

        escrow.status = EscrowStatus.Refunded;
        escrow.updatedAt = uint64(block.timestamp);

        _sendEth(client, refundAmount);

        emit EscrowRefunded(escrowId, refundAmount);
    }

    function openDispute(
        bytes32 escrowId,
        string calldata reason
    ) external existingEscrow(escrowId) {
        Escrow storage escrow = escrows[escrowId];

        if (msg.sender != escrow.client && msg.sender != escrow.freelancer) {
            revert Unauthorized();
        }

        if (
            escrow.status != EscrowStatus.Locked &&
            escrow.status != EscrowStatus.ReleaseRequested
        ) {
            revert InvalidStatus(escrow.status);
        }

        escrow.status = EscrowStatus.Disputed;
        escrow.disputeReason = reason;
        escrow.updatedAt = uint64(block.timestamp);

        emit EscrowDisputed(escrowId, reason);
    }

    function cancel(
        bytes32 escrowId
    ) external existingEscrow(escrowId) onlyClient(escrowId) {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.status != EscrowStatus.Funded) {
            revert InvalidStatus(escrow.status);
        }

        uint256 refundAmount = escrow.amount;
        address payable client = escrow.client;

        escrow.status = EscrowStatus.Cancelled;
        escrow.updatedAt = uint64(block.timestamp);

        _sendEth(client, refundAmount);

        emit EscrowCancelled(escrowId, refundAmount);
    }

    function getEscrow(
        bytes32 escrowId
    ) external view existingEscrow(escrowId) returns (Escrow memory) {
        return escrows[escrowId];
    }

    function _sendEth(address payable recipient, uint256 amount) private {
        (bool success, ) = recipient.call{value: amount}("");

        if (!success) {
            revert TransferFailed();
        }
    }
}
