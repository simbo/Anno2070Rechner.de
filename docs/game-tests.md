Tests in the running game
===

Two questions from [calculator-comparison.md](calculator-comparison.md) can only
be answered in the game. This is the guide for answering them on the Windows PC
with game version 3.0.8051. Nothing in the calculator changes before the results
are in.

Method
---

All measurements compare a warehouse stock over time:

1. Start a continuous game with a save at the start, so that each run is the
   same. Pause is not needed, but keep the normal game speed.
2. Build a small, separate production on its own island, with its own warehouse:
   one factory and only as many suppliers as needed. No other building may use
   the same goods.
3. Fill the warehouse with enough raw material for the whole measurement, and
   switch off the supply buildings, so that only the factory changes the stock.
4. Note both stocks, wait exactly 10 minutes of game time on a clock, and note
   them again. Repeat once. Differences below one production cycle are noise.
5. Write down the productivity the game displays for the building.

A good factory is one with a short cycle and one raw material. Report the
building, its displayed productivity, and the raw material used and the product
made per minute.

Test 1: raw materials below 100 %
---

The question is whether a building below 100 % uses less raw material per
minute, and whether that depends on the kind of penalty. Our chain treats every
penalty like a lower yield: at 50 % it shows twice the buildings and twice the
raw materials.

| Run | Setup                                        | Kind of penalty |
| --- | -------------------------------------------- | --------------- |
| A   | No effect, 100 %                             | Reference       |
| B   | A senate effect with `ProductionCount` -10 % | Lower yield     |
| C   | Energy shortage on the island                | Slower cycle    |
| D   | A farm with a poor eco balance               | Slower cycle    |

The effects with a lower yield in `data/config/features/items.xml` are
`Senate002TechItemB`, `Senate004TechItemB` (-5 %), `Senate008TechItemB`,
`Senate010TechItemB`, `Senate016EcoItemB` and `Senate020TechItemB`. Run D needs
a farm chain, for example a farm feeding a factory.

| Result in the run                             | Means                                                         |
| --------------------------------------------- | ------------------------------------------------------------- |
| Raw material per minute as in A, less product | Lower yield: the chain is right for this penalty              |
| Raw material and product both lower           | Slower cycle: the chain shows too many raw material buildings |

Test 2: eco balance and items together
---

The wiki and the DOE readme say that the bonuses multiply, while the game
displays their sum: a farm shown at 200 % (175 % eco balance, +25 % item) would
really deliver 219 %.

| Run | Setup                                             | Displayed | Sum says | Product says |
| --- | ------------------------------------------------- | --------- | -------- | ------------ |
| A   | Farm with neutral eco balance, no item            | 100 %     | 100 %    | 100 %        |
| B   | The same farm with a good eco balance             | Note it   | As shown | As shown     |
| C   | The same farm with a good eco balance and an item | Note it   | As shown | Eco × item   |

Compare the product per minute of run C with run A. As a farm has no raw
material, the warehouse stock of its product is enough. An item with +25 % or
more makes the difference clearly measurable.

Reporting
---

For each run: building, displayed productivity, and raw material and product per
minute, with both repetitions. These results go into
[calculator-comparison.md](calculator-comparison.md#productivity-and-raw-materials),
and how to handle them is decided afterwards.
