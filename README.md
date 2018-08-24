# DoppelGang

Your party has been infiltrated by a shapeshifting doppelganger! Can you figure out who's who before it's too late?
A Discord bot game for 3-6 players.

**Permissions**
DoppelGang requires the Manage Channels and Manage Roles permissions, and the ability to send DMs to the players.

**Overview**
During a round of DoppelGang, players communicate anonymously with each other by sending the bot DMs, which are transferred anonymously to the gameplay channel. Each player is identified only by the color of their messages. One player is the doppelganger, and the rest are adventurers. The adventurers must figure out which player is the doppelganger, then collectively vote to kill them. The doppelganger's goal is to survive by impersonating one of the adventurers, tricking them into killing one of their own.

**Setup**
Players can join and leave the game using the "leave" and "join" commands. Once the party leader starts the round with the "ready" command, each player is asked via DM to set a preference for doppelganger or adventurer. The bot automatically assigns the players their roles and colors, then creates the gameplay channel and starts the round.

**Gameplay**
Rounds last for ten minutes, during which the players can discuss with each other. The players can vote to end a round early at any time by sending "vote end" to the bot. After the round ends, each player is prompted via DM to enter the color of the player they want to kill. If the doppelganger receives the most votes, they are killed and the adventurers win. If any of the adventures receive the most votes, the doppelganger wins. A tie also results in the doppelganger winning.

**Protip:** Press CTRL/CMD + K on Discord to quickly switch between your DM and the gameplay channel.