// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/RaidClub.sol";

interface Vm {
    function prank(address caller) external;
    function deal(address who, uint256 newBalance) external;
    function expectRevert(bytes4 selector) external;
}

contract RaidClubTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    RaidClub private raidClub;

    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    function setUp() public {
        raidClub = new RaidClub(address(this));
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testRegisterSeedsStarterProfile() public {
        vm.prank(alice);
        raidClub.register();

        (
            bool registered,
            uint32 level,
            uint32 xp,
            uint32 xpToNext,
            uint32 maxHp,
            uint32 maxEnergy,
            uint32 energy,
            uint32 tickets,
            uint64 coins,
            uint32 streak,
            uint64 totalLootValue,
            uint16 weaponPower,
            uint16 charmPower,
            uint16 relicPower
        ) = raidClub.getProfile(alice);

        assertTrue(registered, "profile should be registered");
        assertEq(level, 1, "starter level");
        assertEq(xp, 0, "starter xp");
        assertEq(xpToNext, 120, "starter xp threshold");
        assertEq(maxHp, 100, "starter max hp");
        assertEq(maxEnergy, 100, "starter max energy");
        assertEq(energy, 100, "starter energy");
        assertEq(tickets, 2, "starter tickets");
        assertEq(coins, 0, "starter coins");
        assertEq(streak, 0, "starter streak");
        assertEq(totalLootValue, 0, "starter loot");
        assertEq(weaponPower, 4, "starter weapon");
        assertEq(charmPower, 2, "starter charm");
        assertEq(relicPower, 0, "starter relic");
    }

    function testBuyTicketsRequiresExactPayment() public {
        vm.prank(alice);
        raidClub.register();

        uint256 ticketPrice = raidClub.TICKET_PRICE();
        vm.prank(alice);
        raidClub.buyTickets{value: ticketPrice}(1);

        (, , , , , , , uint32 tickets, , , , , , ) = raidClub.getProfile(alice);
        assertEq(tickets, 3, "ticket purchase should increment");

        vm.expectRevert(RaidClub.IncorrectTicketPayment.selector);
        vm.prank(alice);
        raidClub.buyTickets{value: 1}(1);
    }

    function testRaidLifecycleSettlesRewards() public {
        vm.prank(alice);
        raidClub.register();

        vm.prank(alice);
        raidClub.startRaid(uint8(RaidClub.RaidType.ReefRun));

        vm.prank(alice);
        raidClub.performAction(uint8(RaidClub.ActionType.Attack));
        vm.prank(alice);
        raidClub.performAction(uint8(RaidClub.ActionType.Special));
        vm.prank(alice);
        raidClub.performAction(uint8(RaidClub.ActionType.Attack));

        (bool active, , , , , , ) = raidClub.getActiveSession(alice);
        assertTrue(!active, "session should settle");

        (
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
        ) = raidClub.getLastOutcome(alice);

        assertTrue(exists, "outcome should exist");
        assertTrue(won, "player should win");
        assertEq(raidType, uint8(RaidClub.RaidType.ReefRun), "outcome raid type");
        assertTrue(coins >= 22, "reward coins should be set");
        assertEq(xp, 30, "reward xp");
        assertTrue(slot <= 2, "slot should be valid");
        assertTrue(power >= 7, "power should reflect victory loot");
        assertTrue(rarity <= 3, "rarity should be bounded");
        assertTrue(score > 0, "score should update");
        assertTrue(totalLootValue >= coins, "loot value should include coins");

        (
            bool registered,
            uint32 level,
            uint32 currentXp,
            uint32 xpToNext,
            uint32 maxHp,
            uint32 maxEnergy,
            uint32 energy,
            uint32 tickets,
            uint64 bankedCoins,
            uint32 streak,
            uint64 updatedLootValue,
            uint16 weaponPower,
            uint16 charmPower,
            uint16 relicPower
        ) = raidClub.getProfile(alice);

        assertTrue(registered, "profile should stay registered");
        assertEq(level, 1, "level remains one after first run");
        assertEq(currentXp, 30, "profile xp should update");
        assertEq(xpToNext, 120, "xp threshold should remain stable");
        assertEq(maxHp, 100, "max hp should remain stable");
        assertEq(maxEnergy, 100, "max energy should remain stable");
        assertEq(energy, 100, "energy should reset after settlement");
        assertEq(tickets, 1, "raid should consume a ticket");
        assertEq(streak, 1, "streak should increment");
        assertEq(updatedLootValue, totalLootValue, "loot value should match outcome");
        assertEq(bankedCoins, coins, "profile coins should match outcome");
        assertTrue(uint256(weaponPower) + uint256(charmPower) + uint256(relicPower) >= 6, "gear score should not regress");
    }

    function testCannotStartSecondRaidWhileActive() public {
        vm.prank(alice);
        raidClub.register();

        vm.prank(alice);
        raidClub.startRaid(uint8(RaidClub.RaidType.ReefRun));

        vm.expectRevert(RaidClub.RaidAlreadyActive.selector);
        vm.prank(alice);
        raidClub.startRaid(uint8(RaidClub.RaidType.ReefRun));
    }

    function testLeaderboardOrdersHigherScoringRaiderFirst() public {
        vm.prank(alice);
        raidClub.register();
        vm.prank(bob);
        raidClub.register();

        vm.prank(alice);
        raidClub.startRaid(uint8(RaidClub.RaidType.ReefRun));
        vm.prank(alice);
        raidClub.performAction(uint8(RaidClub.ActionType.Attack));
        vm.prank(alice);
        raidClub.performAction(uint8(RaidClub.ActionType.Special));
        vm.prank(alice);
        raidClub.performAction(uint8(RaidClub.ActionType.Attack));

        (address[] memory players, , , , uint64[] memory scores) = raidClub.getLeaderboard();
        assertEq(players.length, 2, "two registered players should be tracked");
        assertEq(players[0], alice, "winning player should be first");
        assertTrue(scores[0] > scores[1], "winner should have higher score");
    }

    function assertEq(uint256 left, uint256 right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertEq(address left, address right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertTrue(bool value, string memory message) internal pure {
        require(value, message);
    }
}
