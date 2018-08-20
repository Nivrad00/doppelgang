# DoppelGang

A Dsicord bot game that you can play with your friends!

**Setup**

The person who initiates the game is made the party leader, who is able to start rounds and end games. Other players join the game, with a minimum of 3 players and some undecided maximum. 
Once a round begins, each player is asked via PM to set a preference for doppelganger or adventurer. If they don't respond, their preference is set to doppelganger.
One player out of those who prefer being the doppelganger, or one person at random if no one prefers being the doppelganger, is chosen as the doppelganger. The rest become adventurers. Each player is also assigned a color. 
Each player is told their role and color and given simple directions on how to play their role. The doppelganger is additionally told every other player's color.
The bot creates a group channel that is read-only and contains every player, then sends a message that the round has begun.

**Gameplay**

The players send messages to the bot via PM, and the bot delivers those message anonymously to the group channel, using the sender's assigned color.
The goal of the adventurers is to figure out which player is the doppelganger, then vote to kill them. The goal of the doppelganger is to survive by successfully impersonating an adventurer.
There may be a limit on the rate of players' messages due to bot rate limiting. There may also be multiple bots.
The round lasts a set amount of time, which may scale with the number of players. Players can also end a round early with a near-unanimous vote.
After the round ends, each player is prompted to vote to kill a single other player, and the person who receives the most votes is killed. If the doppelganger is killed, the adventurers win. If an adventurer is killed, the doppelganger wins. A tie results in the doppelganger winning.

**Currently implemented:** Starting/ending games, command handling, basic menu commands, parties, party leader, starting rounds