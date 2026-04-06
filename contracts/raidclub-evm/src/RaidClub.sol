// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RaidClub {
    uint256 public constant TICKET_PRICE = 0.002 ether;
    uint8 public constant LEADERBOARD_LIMIT = 10;

    enum RaidType {
        ReefRun,
        ForgeSurge,
        EclipseAltar
    }

    enum ActionType {
        Attack,
        Guard,
        Special,
        Recover
    }

    struct Profile {
        bool registered;
        uint32 level;
        uint32 xp;
        uint32 xpToNext;
        uint32 maxHp;
        uint32 maxEnergy;
        uint32 energy;
        uint32 tickets;
        uint64 coins;
        uint32 winStreak;
        uint64 totalLootValue;
        uint16 weaponPower;
        uint16 charmPower;
        uint16 relicPower;
    }

    struct Session {
        bool active;
        uint8 raidType;
        uint8 turn;
        uint8 actionsUsed;
        uint32 enemyHp;
        uint32 enemyMaxHp;
        uint32 playerHp;
    }

    struct Outcome {
        bool exists;
        bool won;
        uint8 raidType;
        uint64 coins;
        uint32 xp;
        uint8 slot;
        uint16 power;
        uint8 rarity;
        uint64 score;
        uint64 totalLootValue;
    }

    error AlreadyRegistered();
    error NotRegistered();
    error InvalidRaidType();
    error InvalidActionType();
    error RaidAlreadyActive();
    error RaidNotActive();
    error NotEnoughTickets();
    error IncorrectTicketPayment();
    error InvalidTicketQuantity();
    error NotTreasury();
    error TreasuryTransferFailed();

    event ProfileRegistered(address indexed player);
    event TicketsPurchased(address indexed player, uint32 quantity, uint256 paid);
    event RaidStarted(address indexed player, uint8 indexed raidType);
    event RaidActionResolved(address indexed player, uint8 indexed actionType, uint32 enemyHp, uint32 playerHp, uint8 turn);
    event RaidSettled(address indexed player, bool won, uint64 coins, uint32 xp, uint8 slot, uint16 power, uint8 rarity, uint64 score);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    address public immutable treasury;

    mapping(address => Profile) private profiles;
    mapping(address => Session) private sessions;
    mapping(address => Outcome) private outcomes;

    address[] private leaderboard;

    constructor(address treasury_) {
        treasury = treasury_ == address(0) ? msg.sender : treasury_;
    }

    function register() external {
        Profile storage profile = profiles[msg.sender];
        if (profile.registered) revert AlreadyRegistered();

        profile.registered = true;
        profile.level = 1;
        profile.xpToNext = 120;
        profile.maxHp = 100;
        profile.maxEnergy = 100;
        profile.energy = 100;
        profile.tickets = 2;
        profile.weaponPower = 4;
        profile.charmPower = 2;

        _updateLeaderboard(msg.sender);
        emit ProfileRegistered(msg.sender);
    }

    function buyTickets(uint32 quantity) external payable {
        Profile storage profile = _requireProfile(msg.sender);
        if (quantity == 0) revert InvalidTicketQuantity();

        uint256 expectedPayment = uint256(quantity) * TICKET_PRICE;
        if (msg.value != expectedPayment) revert IncorrectTicketPayment();

        profile.tickets += quantity;
        emit TicketsPurchased(msg.sender, quantity, msg.value);
    }

    function startRaid(uint8 raidType_) external {
        Profile storage profile = _requireProfile(msg.sender);
        if (sessions[msg.sender].active) revert RaidAlreadyActive();
        if (raidType_ > uint8(RaidType.EclipseAltar)) revert InvalidRaidType();
        if (profile.tickets == 0) revert NotEnoughTickets();

        uint32 maxEnergy = profile.maxEnergy;
        uint32 energyCost = _energyCost(raidType_);
        if (profile.energy < energyCost) {
            profile.energy = maxEnergy;
        }

        profile.energy -= energyCost;
        profile.tickets -= 1;

        uint32 enemyMaxHp = _enemyHp(raidType_);
        sessions[msg.sender] = Session({
            active: true,
            raidType: raidType_,
            turn: 1,
            actionsUsed: 0,
            enemyHp: enemyMaxHp,
            enemyMaxHp: enemyMaxHp,
            playerHp: profile.maxHp
        });

        emit RaidStarted(msg.sender, raidType_);
    }

    function performAction(uint8 actionType_) external {
        Profile storage profile = _requireProfile(msg.sender);
        Session storage session = sessions[msg.sender];

        if (!session.active) revert RaidNotActive();
        if (actionType_ > uint8(ActionType.Recover)) revert InvalidActionType();

        uint32 gearBonus = _gearBonus(profile);
        uint32 actionPower = _actionPower(actionType_, gearBonus);
        uint32 healAmount = actionType_ == uint8(ActionType.Recover) ? 12 + (gearBonus / 6) : 0;
        uint32 enemyDamage = _enemyDamage(session.raidType, session.turn, actionType_);

        session.actionsUsed += 1;
        session.turn += 1;
        session.enemyHp = actionPower >= session.enemyHp ? 0 : session.enemyHp - actionPower;

        uint32 adjustedPlayerHp = session.playerHp;
        if (enemyDamage >= adjustedPlayerHp + healAmount) {
            adjustedPlayerHp = 0;
        } else {
            adjustedPlayerHp = adjustedPlayerHp + healAmount - enemyDamage;
        }
        if (adjustedPlayerHp > profile.maxHp) {
            adjustedPlayerHp = profile.maxHp;
        }
        session.playerHp = adjustedPlayerHp;

        bool won = session.enemyHp == 0;
        bool lost = !won && (session.playerHp == 0 || session.actionsUsed >= 5);

        if (!won && !lost) {
            emit RaidActionResolved(msg.sender, actionType_, session.enemyHp, session.playerHp, session.turn);
            return;
        }

        _settleRaid(profile, session, won);
    }

    function withdrawTreasury(uint256 amount, address payable to) external {
        if (msg.sender != treasury) revert NotTreasury();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TreasuryTransferFailed();

        emit TreasuryWithdrawn(to, amount);
    }

    function getProfile(address player)
        external
        view
        returns (
            bool registered,
            uint32 level,
            uint32 xp,
            uint32 xpToNext,
            uint32 maxHp,
            uint32 maxEnergy,
            uint32 energy,
            uint32 tickets,
            uint64 coins,
            uint32 winStreak,
            uint64 totalLootValue,
            uint16 weaponPower,
            uint16 charmPower,
            uint16 relicPower
        )
    {
        Profile memory profile = profiles[player];
        return (
            profile.registered,
            profile.level,
            profile.xp,
            profile.xpToNext,
            profile.maxHp,
            profile.maxEnergy,
            profile.energy,
            profile.tickets,
            profile.coins,
            profile.winStreak,
            profile.totalLootValue,
            profile.weaponPower,
            profile.charmPower,
            profile.relicPower
        );
    }

    function getActiveSession(address player)
        external
        view
        returns (
            bool active,
            uint8 raidType,
            uint8 turn,
            uint8 actionsUsed,
            uint32 enemyHp,
            uint32 enemyMaxHp,
            uint32 playerHp
        )
    {
        Session memory session = sessions[player];
        return (
            session.active,
            session.raidType,
            session.turn,
            session.actionsUsed,
            session.enemyHp,
            session.enemyMaxHp,
            session.playerHp
        );
    }

    function getLastOutcome(address player)
        external
        view
        returns (
            bool exists,
            bool won,
            uint8 raidType,
            uint64 coins,
            uint32 xp,
            uint8 slot,
            uint16 power,
            uint8 rarity,
            uint64 score,
            uint64 totalLootValue
        )
    {
        Outcome memory outcome = outcomes[player];
        return (
            outcome.exists,
            outcome.won,
            outcome.raidType,
            outcome.coins,
            outcome.xp,
            outcome.slot,
            outcome.power,
            outcome.rarity,
            outcome.score,
            outcome.totalLootValue
        );
    }

    function getLeaderboard()
        external
        view
        returns (
            address[] memory players,
            uint32[] memory levels,
            uint32[] memory streaks,
            uint64[] memory totalLootValues,
            uint64[] memory scores
        )
    {
        uint256 length = leaderboard.length;
        players = new address[](length);
        levels = new uint32[](length);
        streaks = new uint32[](length);
        totalLootValues = new uint64[](length);
        scores = new uint64[](length);

        for (uint256 index = 0; index < length; index++) {
            address player = leaderboard[index];
            Profile memory profile = profiles[player];

            players[index] = player;
            levels[index] = profile.level;
            streaks[index] = profile.winStreak;
            totalLootValues[index] = profile.totalLootValue;
            scores[index] = _score(profile);
        }
    }

    function _settleRaid(Profile storage profile, Session storage session, bool won) private {
        uint64 coins = won ? _coinReward(session.raidType, session.actionsUsed) : 0;
        uint32 xp = won ? _xpReward(session.raidType) : _consolationXp(session.raidType);
        uint8 slot = 0;
        uint16 power = 0;
        uint8 rarity = 0;

        profile.coins += coins;
        _applyProgression(profile, xp);

        if (won) {
            profile.winStreak += 1;
            (slot, power, rarity) = _rollLoot(msg.sender, session.raidType, session.actionsUsed, profile.level);
            _equipIfBetter(profile, slot, power);
            profile.totalLootValue += coins + uint64(power) * 6;
        } else {
            profile.winStreak = 0;
            profile.totalLootValue += coins;
        }

        profile.energy = profile.maxEnergy;

        uint64 score = _score(profile);
        outcomes[msg.sender] = Outcome({
            exists: true,
            won: won,
            raidType: session.raidType,
            coins: coins,
            xp: xp,
            slot: slot,
            power: power,
            rarity: rarity,
            score: score,
            totalLootValue: profile.totalLootValue
        });

        delete sessions[msg.sender];
        _updateLeaderboard(msg.sender);

        emit RaidSettled(msg.sender, won, coins, xp, slot, power, rarity, score);
    }

    function _applyProgression(Profile storage profile, uint32 xpGained) private {
        profile.xp += xpGained;
        while (profile.xp >= profile.xpToNext) {
            profile.xp -= profile.xpToNext;
            profile.level += 1;
            profile.xpToNext = uint32((uint256(profile.xpToNext) * 118) / 100);
        }
    }

    function _equipIfBetter(Profile storage profile, uint8 slot, uint16 power) private {
        if (slot == 0 && power > profile.weaponPower) {
            profile.weaponPower = power;
        } else if (slot == 1 && power > profile.charmPower) {
            profile.charmPower = power;
        } else if (slot == 2 && power > profile.relicPower) {
            profile.relicPower = power;
        }
    }

    function _rollLoot(address player, uint8 raidType_, uint8 actionsUsed, uint32 level)
        private
        view
        returns (uint8 slot, uint16 power, uint8 rarity)
    {
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.number, player, raidType_, actionsUsed, level)
            )
        );

        uint16 basePower = raidType_ == uint8(RaidType.EclipseAltar)
            ? 12
            : raidType_ == uint8(RaidType.ForgeSurge)
                ? 8
                : 4;
        uint16 efficiencyPower = uint16(6 - actionsUsed);
        uint16 variance = uint16((seed >> 8) % 5);

        slot = uint8(seed % 3);
        power = basePower + variance + efficiencyPower;

        if (power >= 16) {
            rarity = 3;
        } else if (power >= 11) {
            rarity = 2;
        } else if (power >= 7) {
            rarity = 1;
        }
    }

    function _requireProfile(address player) private view returns (Profile storage profile) {
        profile = profiles[player];
        if (!profile.registered) revert NotRegistered();
    }

    function _enemyHp(uint8 raidType_) private pure returns (uint32) {
        if (raidType_ == uint8(RaidType.ReefRun)) return 52;
        if (raidType_ == uint8(RaidType.ForgeSurge)) return 80;
        if (raidType_ == uint8(RaidType.EclipseAltar)) return 104;
        revert InvalidRaidType();
    }

    function _energyCost(uint8 raidType_) private pure returns (uint32) {
        if (raidType_ == uint8(RaidType.ReefRun)) return 12;
        if (raidType_ == uint8(RaidType.ForgeSurge)) return 18;
        if (raidType_ == uint8(RaidType.EclipseAltar)) return 24;
        revert InvalidRaidType();
    }

    function _xpReward(uint8 raidType_) private pure returns (uint32) {
        if (raidType_ == uint8(RaidType.ReefRun)) return 30;
        if (raidType_ == uint8(RaidType.ForgeSurge)) return 48;
        if (raidType_ == uint8(RaidType.EclipseAltar)) return 78;
        revert InvalidRaidType();
    }

    function _consolationXp(uint8 raidType_) private pure returns (uint32) {
        uint32 reward = _xpReward(raidType_) / 4;
        return reward > 8 ? reward : 8;
    }

    function _coinReward(uint8 raidType_, uint8 actionsUsed) private pure returns (uint64) {
        uint64 minReward = raidType_ == uint8(RaidType.EclipseAltar)
            ? 64
            : raidType_ == uint8(RaidType.ForgeSurge)
                ? 34
                : 22;
        uint64 maxReward = raidType_ == uint8(RaidType.EclipseAltar)
            ? 92
            : raidType_ == uint8(RaidType.ForgeSurge)
                ? 56
                : 36;
        uint64 efficiencyBonus = uint64(6 - actionsUsed) * 3;
        uint64 reward = minReward + efficiencyBonus;

        return reward > maxReward ? maxReward : reward;
    }

    function _gearBonus(Profile storage profile) private view returns (uint32) {
        return uint32(profile.weaponPower) + (uint32(profile.charmPower) / 2) + uint32(profile.relicPower);
    }

    function _actionPower(uint8 actionType_, uint32 gearBonus) private pure returns (uint32) {
        if (actionType_ == uint8(ActionType.Attack)) return 16 + (gearBonus / 3);
        if (actionType_ == uint8(ActionType.Guard)) return 10 + (gearBonus / 5);
        if (actionType_ == uint8(ActionType.Special)) return 24 + (gearBonus / 2);
        if (actionType_ == uint8(ActionType.Recover)) return 8;
        revert InvalidActionType();
    }

    function _enemyDamage(uint8 raidType_, uint8 turn, uint8 actionType_) private pure returns (uint32) {
        uint32 baseDamage = raidType_ == uint8(RaidType.EclipseAltar)
            ? 18
            : raidType_ == uint8(RaidType.ForgeSurge)
                ? 12
                : 8;

        uint32 damage = baseDamage + uint32(turn) * 2;

        if (actionType_ == uint8(ActionType.Guard)) {
            damage = damage > 7 ? damage - 7 : 0;
        }
        if (actionType_ == uint8(ActionType.Recover)) {
            damage = damage > 2 ? damage - 2 : 0;
        }

        return damage < 4 ? 4 : damage;
    }

    function _score(Profile memory profile) private pure returns (uint64) {
        return uint64(profile.level) * 220 + uint64(profile.winStreak) * 30 + profile.totalLootValue;
    }

    function _updateLeaderboard(address player) private {
        uint256 existingIndex = type(uint256).max;
        uint64 playerScore = _score(profiles[player]);

        for (uint256 index = 0; index < leaderboard.length; index++) {
            if (leaderboard[index] == player) {
                existingIndex = index;
                break;
            }
        }

        if (existingIndex == type(uint256).max) {
            if (leaderboard.length < LEADERBOARD_LIMIT) {
                leaderboard.push(player);
            } else {
                uint256 lowestIndex = 0;
                uint64 lowestScore = _score(profiles[leaderboard[0]]);

                for (uint256 index = 1; index < leaderboard.length; index++) {
                    uint64 candidateScore = _score(profiles[leaderboard[index]]);
                    if (candidateScore < lowestScore) {
                        lowestScore = candidateScore;
                        lowestIndex = index;
                    }
                }

                if (playerScore <= lowestScore) {
                    return;
                }

                leaderboard[lowestIndex] = player;
            }
        }

        uint256 length = leaderboard.length;
        for (uint256 outer = 1; outer < length; outer++) {
            address key = leaderboard[outer];
            uint256 inner = outer;

            while (inner > 0 && _score(profiles[leaderboard[inner - 1]]) < _score(profiles[key])) {
                leaderboard[inner] = leaderboard[inner - 1];
                inner--;
            }

            leaderboard[inner] = key;
        }
    }
}
