Tests in the running game
===

**Not run (2026-11-10).** Two questions from
[calculator-comparison.md](calculator-comparison.md) could only be proven in the
game: whether a building below 100 % uses less raw material, and whether eco and
item bonuses multiply. Both are decided without a test, from the sources and the
game files, see
[Below 100 % and eco with items](calculator-comparison.md#below-100--and-eco-with-items).
The game had no saves left, and building the setups would take several hours.
Claude cannot play the game: Anno 2070 ignores simulated mouse clicks.

This outline stays for the case that the decision is to be checked later, with
game version 3.0.8051.

Method
---

Compare a warehouse stock over 10 minutes of game time, twice per run. Only the
measured building may change the stock: switch off suppliers and consumers of
the same goods, stop trade routes and do not build during the measurement. Note
the productivity the game displays. Save before the first run and reload it for
each run.

Test 1: raw material below 100 %
---

A Tycoon game with a factory that has one raw material, for example the tool
factory (iron, 30 s cycle), and at least 30 t of iron in stock.

| Run | Setup                                                     |
| --- | --------------------------------------------------------- |
| A   | 100 %                                                     |
| C   | Energy shortage, about 50 % supply; wait until it settles |

If iron per minute drops with the productivity in run C, a slower cycle uses
less raw material, as decided. If it stays as in run A, the decision is wrong.

The senate and eco balance runs of the earlier plan are not needed: senate
effects lower the yield according to the game files, and the eco balance only
acts on farms, which have no raw material.

Test 2: eco balance and items
---

An Eco game with 4 to 6 farms with a short cycle, for example tea plantations,
on one island, and a farm item with at least +25 %.

| Run | Setup                                        |
| --- | -------------------------------------------- |
| A   | Neutral eco balance, no item                 |
| C   | Eco balance of 50 or more (125 %), with item |

Compare the product per minute of run C with run A. The product of eco and item
confirms the decision, their sum contradicts it. The higher the eco balance, the
clearer the difference: at 500 (175 %) and +25 %, about 219 % against 200 %.

Effort
---

Estimated from a new continuous game: test 1 about 1.5 to 2 hours, test 2 about
2 to 4 hours, mostly for getting a farm item.
