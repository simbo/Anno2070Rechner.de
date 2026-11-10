Calculator comparison
===

Prepares a comparison of Anno2070Rechner.de with other Anno 2070 calculators:
which ones exist, what they support, and how their results differ. The main
question is whether our calculator is right for the base game, which game
version each calculator reflects, and what it takes to keep ours useful. Deep
Ocean is only looked at as far as it explains differences; supporting it is not
planned.

**State:** the comparison with other calculators and the check against the game
files of version 3.0.8051 are done, see
[Comparison results](#comparison-results) and
[What the game files show](#what-the-game-files-show). The game data has since
been updated to `patch8.rda`, so the results below describe the state before
that. The two game mechanics that only a test in the game could prove are
decided without one, see
[Below 100 % and eco with items](#below-100--and-eco-with-items).

First findings
---

### What the game files show

Checked against the files of game version 3.0.8051 (Ubisoft Connect), which
contain all patch states. The later archives overwrite the earlier ones;
`patch9.rda` only holds texts, so `patch8.rda` is the final state of the game
data.

**Our data is from before the first patch.** Every value of our 149 buildings
and all demands equal `Data1.rda`, dated September 2011, not `patch1.rda` as
[game-data.md](game-data.md) says. Our import was correct, but the source files
were older than recorded. These values were already replaced in `patch1.rda`
(October 2011), before the game's release. So they were probably never part of a
released game version.

**The demand question is settled.** 12 values of 7 goods are too high, and the
game's values have been constant since `patch1.rda`:

| Good (kg per 100 residents and minute) | Level      | Ours | Game | Ours is higher by |
| -------------------------------------- | ---------- | ---- | ---- | ----------------- |
| Pasta dishes                           | Engineers  | 200  | 150  | 33 %              |
| Pasta dishes                           | Executives | 125  | 110  | 14 %              |
| Bio drinks                             | Engineers  | 185  | 150  | 23 %              |
| Bio drinks                             | Executives | 200  | 110  | 82 %              |
| Plastics                               | Employees  | 350  | 300  | 17 %              |
| Plastics                               | Engineers  | 250  | 200  | 25 %              |
| Plastics                               | Executives | 160  | 120  | 33 %              |
| Luxury meals                           | Engineers  | 130  | 120  | 8 %               |
| Champagne                              | Engineers  | 185  | 120  | 54 %              |
| Champagne                              | Executives | 125  | 90   | 39 %              |
| Jewelry                                | Executives | 250  | 200  | 25 %              |
| Pharmaceuticals                        | Executives | 200  | 175  | 14 %              |

`addon_01_assets.xml` has the same values for Ecos and Tycoons, so Deep Ocean
does not change them either. The classic mode of i-dont-think.so therefore uses
outdated values, despite its stated version 2.0. An April 2012 forum post had
already noticed the difference for jewelry and pharmaceuticals
([thread](<https://web.archive.org/web/20130101041512/http://forums-de.ubi.com:80/showthread.php/118567-Anno-2070-(-Tiefsee)-Warenrechner-Forums>)).

**Other differences to the final game data**, listed value by value in
[game-data.md](game-data.md#update-to-the-final-game-data):

| Value                | Buildings                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Production time      | Sawmill 45 s to 60 s; uranium black smoker miner 20 s to 60 s                                                                                          |
| Active maintenance   | Functional food factory 50 to 40; coffee plantation 70 to 40; energy drink factory 90 to 60                                                            |
| Inactive maintenance | The same three, and the gold, copper, uranium and iron black smoker buildings, which had no value                                                      |
| Build cost           | River sewage treatment plant                                                                                                                           |
| Not production       | Warehouses, depots, deep sea and underwater warehouses, harbor defense turret, clearance terminal, harbor depot, leisure center, corporate headquarter |

**Unchanged:** all other production times, all raw material needs, residents per
house and ascension rates. The patches add no production building to the base
game.

### What changed between versions

| Archive      | File date  | Likely game version | Relevant change                                                                                      |
| ------------ | ---------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `Data1.rda`  | 2011-09-29 | Base data, **ours** | Starting point                                                                                       |
| `patch1.rda` | 2011-10-31 | Before release      | Lower demand values; lower maintenance for three Tech buildings; costs of several other buildings    |
| `patch2.rda` | 2011-11-21 | 1.01                | No change for our buildings                                                                          |
| `patch3.rda` | 2011-12-07 | 1.02                | Underwater warehouse                                                                                 |
| `patch4.rda` | 2012-01-19 | 1.03                | River sewage treatment plant; inactive maintenance of the black smoker buildings                     |
| `patch5.rda` | 2012-03-12 | 1.04                | Sawmill and uranium miner slower, confirmed for the sawmill by the patch notes; a few building costs |
| `patch6.rda` | 2012-04-20 | 1.05                | No change for our buildings                                                                          |
| `patch7.rda` | 2012-08-02 | 1.06                | Leisure center, corporate headquarter; no effect on calculations                                     |
| `patch8.rda` | 2012-08-14 | 2.0 or later        | No change for our buildings                                                                          |
| `patch9.rda` | Not read   | 3.x                 | Texts only                                                                                           |

Assigning archives to game versions is inferred from the file dates and the
[patch notes on annoinfo.de](https://www.annoinfo.de/Anno_2070/patchnotes.html).
The notes mention none of the demand changes.

### The expansion changes the Tech demands

`addon_01_assets.xml` of the installed game adds Geniuses and four goods and
shifts the Tech demands. Ecos and Tycoons stay as in the base game:

| Good (kg per 100 residents and minute) | Base game: assistants, researchers | Deep Ocean: assistants, researchers, geniuses |
| -------------------------------------- | ---------------------------------- | --------------------------------------------- |
| Fish                                   | 250, 250                           | 250, 250, 125                                 |
| Functional food                        | 335, 265                           | 335, 225, 80                                  |
| Functional drinks                      | 415, 340                           | 415, 170, 80                                  |
| Immunity drugs                         | None                               | None, 200, 150                                |
| Neuroimplants                          | None                               | None, 100, 100                                |
| Laboratory instruments                 | None                               | None, None, 300                               |
| Bionic suits                           | None                               | None, None, 45                                |

Supporting the expansion is therefore more than adding a level, which is one
reason why it stays out of scope. The electronics recycler also exists only in
the add-on data.

### The expansion fork was not found

- The three GitHub forks (`Neshura87`, `Rindula`, `0pupentium`) have no commits
  of their own and end at our commit `471591c` from March 2012.
- [Issue #1 "Addon Rechner"](https://github.com/simbo/Anno2070Rechner.de/issues/1)
  from October 2012 is still open. Its author `computerkrieger` only refers to a
  private message in the Ubisoft forum saying the work is done. That forum is
  gone, and the account has no public repositories.
- Archived pages 1 and 2 of our
  [forum thread](https://web.archive.org/web/2013/http://forums-de.ubi.com:80/showthread.php/116678-Tool-Anno2070Rechner-de-Bedarfsrechner-Produktionsketten-Datenbank-Forums)
  do not mention the author. Page 3 of 3 is not archived.
- A GitHub code search for `anno2070rechner` finds no copy of the site.

So the hosted version remains unknown. It may still be among the candidates
below under a different name.

Comparison results
---

Measured on 2026-11-08 against the current state of the branch `static-rebuild`.
Nothing is decided by this section unless stated.

### Summary

- Our formulas agree with the other calculators. Population, demand, building
  counts and rounding only differ where the data differs.
- Our demand data is outdated and verifiably too high: 12 values of 7 goods, so
  we suggest up to 82 % more buildings for these goods.
- Our handling of productivity in chains is taken as correct for items, see
  [Productivity and raw materials](#productivity-and-raw-materials). Below 100 %
  our chains showed too many raw material buildings, which is fixed, and eco and
  item bonuses multiply, see
  [Below 100 % and eco with items](#below-100--and-eco-with-items).
- We lead with chains, alternatives, costs, database, languages and links.
  Others lead with Deep Ocean, exact fractions, senate bonus, materials and
  planning.

### How it was tested

| Calculators                                  | How                                                                       | Scope                               |
| -------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| Ours                                         | Calculation modules in the browser; the page itself for a mixed city      | 63 scenarios, 240 house cases       |
| atspace, i-dont-think.so, odegroot           | Their unchanged pages on a local copy, driven by script                   | 63 scenarios, up to 480 house cases |
| The4thLaw                                    | Same; it has no house calculation                                         | 63 scenarios                        |
| A.R.R.C. without mods                        | Live, by hand-paced requests                                              | 17 scenarios, chains, houses        |
| nightport                                    | Live, by hand-paced requests; whole buildings only, one level per faction | 16 scenarios                        |
| DOE Calculator, Universal Calculator         | Values read from the files, formulas not recalculated, no macros run      | Data only                           |
| fkarg, spike-rabbit, brunopp, Anno Assistant | Source code read, not run                                                 | Data and formulas only              |

One scenario gives up to 17 goods, so each client calculator delivers 1071
values. Scenarios cover every level of every faction with 100, 1000, 1337 and
5000 residents, mixed cities, values around whole buildings, productivity from
50 % to 300 %, and the Eco information channel. House cases cover 12 totals from
1 to 1000 with every highest level, with and without living space and senate
bonus.

The results of the local copies were spot-checked against all four live pages
and were identical. Raw results and scripts are kept outside this repository, in
`Anno2070Rechner-verify/calculator-comparison`. The game files are in
`Anno2070Rechner-export/game-files-latest`.

A.R.R.C. was also checked for all 15 chains with production steps and in
English; the English results equal the German ones. Our numbers are identical in
German and English apart from the decimal sign. The other calculators have only
one language.

**Could not be covered:**

- The Deep Ocean Calculator v1.0 cannot be downloaded (403), and the Production
  Calculator v1.0 link is gone (404).
- The iOS app is paid, and the Anno Assistant and the minimal Warenrechner need
  Windows, so they were judged by their pages, data and code.
- The Anno 2070 FanApp and the Android version of brunopp could not be found.

### Data state of each source

Compared with the final game data. "Not included" means the source has no such
value.

| Source                  | Eco and Tycoon demand | Tech demand | Sawmill      | State                               |
| ----------------------- | --------------------- | ----------- | ------------ | ----------------------------------- |
| Anno2070Rechner.de      | Outdated              | Classic     | 45 s, old    | Before `patch1.rda`                 |
| i-dont-think.so classic | Outdated              | Classic     | Not included | Before `patch1.rda` for these goods |
| Anno Assistant          | Current               | Classic     | Not included | Current for demands                 |
| odegroot.nl             | Current               | Classic     | 45 s, old    | Before `patch5.rda`                 |
| Universal Calculator    | Current               | Classic     | 45 s, old    | Before `patch5.rda`                 |
| spike-rabbit            | Current               | Deep Ocean  | 45 s, old    | Mixed                               |
| DOE Calculator          | Current               | Both        | 60 s         | Current                             |
| brunopp                 | Current               | Deep Ocean  | 60 s         | Current                             |
| i-dont-think.so DO      | Current               | Deep Ocean  | Not included | Current for demands                 |
| atspace, The4thLaw      | Current               | Deep Ocean  | Not included | Current for demands                 |
| fkarg                   | Current               | Deep Ocean  | Not included | Current for demands                 |
| A.R.R.C. without mods   | Current               | Deep Ocean  | Not read     | Current for demands                 |
| nightport               | Current               | Deep Ocean  | Not included | Current for demands                 |

For the base game, only the DOE Calculator has current demands and production
times, in its classic mode. Nobody but us shows maintenance and build costs
along with a whole chain except A.R.R.C., whose values were not compared.

### Calculations

Number of values that differ from the final game data, using our formulas as the
expected calculation:

| Calculator              | Values | Differ | Reason                                                                   |
| ----------------------- | ------ | ------ | ------------------------------------------------------------------------ |
| Anno2070Rechner.de      | 1071   | 132    | Outdated demand values                                                   |
| i-dont-think.so classic | 1071   | 134    | 132 outdated demand values, 2 rounded constants                          |
| i-dont-think.so DO      | 1071   | 29     | 28 Deep Ocean Tech values, 1 rounded constant                            |
| atspace                 | 1071   | 29     | 28 Deep Ocean Tech values, 1 rounded constant                            |
| The4thLaw               | 1071   | 35     | 28 Deep Ocean Tech values, 1 rounded constant, 6 without the Eco channel |
| odegroot.nl             | 1071   | 6      | Without the Eco channel                                                  |
| A.R.R.C. without mods   | 289    | 4      | Deep Ocean Tech values                                                   |
| nightport               | 72     | 1      | One count rounded down, whole buildings only                             |

Population from houses, without senate bonus:

| Calculator            | Cases | Same as ours | Reason for differences                        |
| --------------------- | ----- | ------------ | --------------------------------------------- |
| atspace               | 240   | 240          |                                               |
| odegroot.nl           | 240   | 240          |                                               |
| i-dont-think.so       | 240   | 131          | Tech upgrade bug and rounding of living space |
| A.R.R.C. without mods | 3     | 3            |                                               |

| Result compared with ours       | Same                                                                                                                                        | Different                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demand and exact building count | All calculators, once the demand table above is taken into account                                                                          | Only the data. Rounded constants cause differences below 0.05 buildings. Deep Ocean tech values cause the Tech differences                                                                                                                               |
| Rounding up to whole buildings  | A.R.R.C. in all cases, nightport in 71 of 72 values                                                                                         | nightport shows 3 health food buildings for an exact 3.05. The others show fractions by default, some with a whole-number option                                                                                                                         |
| Productivity of a good          | atspace, i-dont-think.so, odegroot, The4thLaw, A.R.R.C.                                                                                     | nightport has input fields on its chain pages, but recalculating returned an empty page in both attempts                                                                                                                                                 |
| Eco information channel, −15 %  | atspace, i-dont-think.so; the game files confirm −15 % on the lifestyle category                                                            | odegroot, The4thLaw, A.R.R.C. and nightport do not offer it                                                                                                                                                                                              |
| Distribution of houses          | atspace, odegroot, A.R.R.C., nightport in tested cases                                                                                      | i-dont-think.so sends 80 % instead of 60 % of Tech houses up, because it uses the Tycoon ratio: a bug, as the game files say 60 %. brunopp, from its code, rounds up where we round down                                                                 |
| Living space, +12 %             | atspace, odegroot, A.R.R.C., brunopp: rounded down per house. The game files set +12 % for all levels, their rounding is not stated there   | i-dont-think.so rounds the total: 2 worker houses give 17 instead of 16. nightport gives 538 instead of 512 employees, and 2016 instead of 1980 researchers                                                                                              |
| Senate ascension bonus          | Not offered by us. The game files confirm +5 % for Engineers and Lab Assistants                                                             | atspace and i-dont-think.so agree without living space for Ecos and Tycoons; otherwise they differ through the points above                                                                                                                              |
| Chain ratios                    | atspace, fkarg and odegroot's raw material rates in all chains; A.R.R.C. in all 15 chains. Our raw material needs equal the final game data | Beamer plant: 1.125 and 0.5625 with us and A.R.R.C., 1.124 and 0.562 at atspace, fkarg and The4thLaw. The4thLaw has 0.5 instead of 0.75 manganese for pharmaceuticals, and 1 instead of 0.5 coal mines for jewelry, which the game data does not support |
| Productivity along a chain      | atspace, i-dont-think.so, fkarg, A.R.R.C.                                                                                                   | odegroot and The4thLaw keep the raw material demand when a building's productivity changes, which is taken as wrong. Ours and the others reduce it, which is taken as correct for bonuses                                                                |
| Electronics recycler            | Not in our data, and in the game files only in the add-on                                                                                   | Calculators with Deep Ocean data offer it as an alternative in chains                                                                                                                                                                                    |

Fish is one total with us and one value per faction elsewhere, for example 31
against 14, 16 and 2 buildings. Both are valid, but the sum of the rounded
values is higher.

The effect of the data is large at the top levels. For the mixed test city, we
show 4 pasta buildings against 3.13, 3.51 bio drink buildings against 2.51 and
7.36 plastic factories against 6.09.

### Productivity and raw materials

**Decision (2026-11-08):** Raw material demand falling with a building's
productivity bonus is taken as correct, as ours, atspace, i-dont-think.so,
A.R.R.C. and fkarg calculate it. Keeping it constant, as odegroot and The4thLaw
do, is taken as wrong. This rests on the sources below, none of them official;
it has not been tested in the game.

- The [Anno wiki](https://anno2070.fandom.com/wiki/Production) says items raise
  the yield of a production cycle while the building keeps its resource
  consumption. The ecobalance instead changes the rate of output, on farms. It
  marks the combination as tested.
- A
  [2012 AnnoZone answer](https://www.annozone.de/forum/thread/13349-produktivitaetssteigerung/)
  says the same: 4 communicator factories at 125 % still need 4 chip factories,
  as the same raw materials give more product.
- A
  [2016 Steam thread](https://steamcommunity.com/app/48240/discussions/0/282992562606031173/)
  agrees for end-of-chain buildings.
- [Players in a 2013 Steam thread](https://steamcommunity.com/app/48240/discussions/0/828935672546505721/)
  disagree with each other, some assuming a faster use of resources. None of
  them had measured it.

With +25 %, a chain therefore needs fewer buildings for the same output, and
their raw material need shrinks with them.

The
[DOE Calculator](https://www.dropbox.com/s/0qzznufb6njvacg/Anno2070-DOE-Calculator-v0.8.zip)
readme describes the same model in detail. The game files fit it: in
`items.xml`, 44 items raise and 6 lower `ProductionCount`, the output per cycle,
and none changes raw material needs. One caveat is the field description of
`RawNeeded1`, "needed amount of first raw material to produce 1t", which could
also be read as per ton of output. The files therefore support the decision but
do not prove it.

### Below 100 % and eco with items

**Decision (2026-11-10):** Two further assumptions are taken as correct without
a test in the game. A test was planned in [game-tests.md](game-tests.md) and
dropped, because building the setups in the game would take hours and the
sources already agree.

All of this rests on one model, which the DOE readme and the wiki describe and
the game files support: a building's output per minute is its rate of cycles
times its yield per cycle. Items and some senate effects change the yield
(`ProductionCount` in `items.xml`), while the eco balance and an energy shortage
change the rate. Raw materials are used per cycle.

- **Below 100 %, a slower cycle uses less raw material.** A building slowed down
  by an energy shortage or, on farms, a poor eco balance uses its raw materials
  more slowly too, so the chain needs no more raw material for the same output.
  For this speaks:
  - The DOE readme says so, and DOE is the only calculator that distinguishes
    the cases.
  - In `properties.xml` of `patch8.rda`, an energy shortage lowers productivity
    down to 25 % (`ShortageMaxProductivityFactor`) and explicitly lengthens the
    production time up to 500 % (`ShortageMaxProductionTimeFactor`) once the
    supply falls to 30 % (`MaxEffectLevel`).
  - The eco balance changes the fertility of farms (`FertilityCorruption`), not
    a yield. Farms have no raw materials, so for raw materials only the energy
    shortage matters.
  - The [Production](https://anno2070.fandom.com/wiki/Production) page of the
    Anno wiki describes the same model of rate and yield, but does not say which
    of the two an energy shortage changes.

  A web search on 2026-11-10 in the Anno wiki, AnnoZone, the Ubisoft forum,
  Steam and GameFAQs found no further source on raw material use under an energy
  shortage, neither for nor against. The sources only say that productivity
  falls in proportion to the energy deficit. All calculators except DOE
  calculate like ours, but none of them explains why.

  Lower yields also exist: items that lower `ProductionCount` by 5 or 10 % and
  senate effects. With them the raw material need per building stays the same.
  They are rare and small, so treating everything below 100 % as a slower cycle,
  as DOE does, is the closer approximation.

- **Eco balance and items multiply.** A farm shown at 200 % (175 % eco, +25 %
  item) delivers 175 % × 125 % ≈ 219 %. For this speaks:
  - The wiki and the DOE readme both say so; the wiki marks it as tested.
  - The model above: the eco balance changes the rate, the item the yield per
    cycle, in separate fields of the game files.
  - The eco curve in `properties.xml` (`EcoFertility`) reaches 125 % at an eco
    balance of 50 and 175 % at 500, so the difference is only relevant for Eco
    farms with a high eco balance.

### What the calculator does with it

1. **Below 100 %: changed (2026-11-10).** `getCommodityChain()` in
   [commodity-chain.ts](../src/models/commodity-chain.ts) used to derive the raw
   material need from the number of buildings, so a building at 50 % needed
   twice the raw materials. Now only the part of the productivity above 100 %
   reduces the raw material need; below 100 % it stays as at 100 %. Building
   counts are unchanged. This deliberately deviates from the old site and from
   all other calculators except DOE. Separate inputs for rate and yield would be
   exact for the rare yield penalties, but are not worth new inputs, URL
   parameters and saved-game fields.
2. **Eco and items: no change (decided 2026-11-10).** Farms have no raw
   materials, so only the number of farms is affected: whoever enters the sum
   shown in the game gets up to about 9 % too many farms. The calculator itself
   computes correctly with the productivity entered, so it stays as it is,
   without a hint.

### Feature overview

✓ supported, ~ partly, ✗ not supported. Tested for ours, atspace,
i-dont-think.so, A.R.R.C., nightport, odegroot and The4thLaw; taken from code or
documents for fkarg and DOE.

| Feature                            | Ours | atspace | i-dont-think | A.R.R.C. | nightport | odegroot | The4thLaw | fkarg | DOE |
| ---------------------------------- | ---- | ------- | ------------ | -------- | --------- | -------- | --------- | ----- | --- |
| Classic game data                  | ~    | ✗       | ✓            | ~        | ✗         | ✓        | ✗         | ✗     | ✓   |
| Deep Ocean                         | ✗    | ✓       | ✓            | ✓        | ✓         | ✗        | ✓         | ✓     | ✓   |
| Game version stated                | ~    | ~       | ✓            | ~        | ✗         | ✗        | ✗         | ✗     | ✓   |
| Input: residents per level         | ✓    | ✓       | ✓            | ✓        | ~         | ✓        | ✓         | ✓     | ✗   |
| Input: houses per level            | ✓    | ✗       | ✓            | ✓        | ~         | ✓        | ✗         | ✓     | ✓   |
| Distribution from total houses     | ✓    | ✓       | ✓            | ✓        | ✓         | ✓        | ✗         | ✓     | ✓   |
| Living space bonus                 | ✓    | ✓       | ✓            | ✓        | ✓         | ✓        | ✗         | ✓     | ✓   |
| Eco information channel            | ✓    | ✓       | ✓            | ✗        | ✗         | ✗        | ✗         | ✓     | ✓   |
| Senate ascension bonus             | ✗    | ✓       | ✓            | ✗        | ✗         | ✗        | ✗         | ✓     | ✓   |
| Productivity per good              | ✓    | ✓       | ✓            | ✓        | ~         | ✓        | ✓         | ✓     | ✓   |
| Change all productivities at once  | ✗    | ✓       | ✗            | ✗        | ✗         | ✗        | ✗         | ✓     | ~   |
| Demand in tons per minute          | ✓    | ✗       | ✗            | ✗        | ✗         | ✓        | ✗         | ✓     | ✓   |
| Exact fractions of buildings       | ✗    | ✓       | ✓            | ~        | ✗         | ✓        | ✓         | ✓     | ✓   |
| Efficiency of each building        | ✓    | ✗       | ✗            | ✓        | ✗         | ✗        | ✗         | ✗     | ✗   |
| Production chain                   | ✓    | ~       | ~            | ✓        | ~         | ✓        | ~         | ✓     | ~   |
| Choosing alternatives              | ✓    | ~       | ~            | ✓        | ✗         | ✗        | ✗         | ~     | ~   |
| Productivity inside a chain        | ✓    | ✓       | ✓            | ✓        | ~         | ✓        | ✓         | ✓     | ✓   |
| Raw materials follow bonuses       | ✓    | ✓       | ✓            | ✓        | ✗         | ✗        | ✗         | ✓     | ✓   |
| Any building, count or target      | ✓    | ✗       | ✗            | ✓        | ✗         | ✗        | ✗         | ✗     | ✗   |
| Build cost and maintenance         | ✓    | ✗       | ✗            | ✓        | ✗         | ✗        | ✗         | ✓     | ✗   |
| Totals across a chain              | ✓    | ✗       | ✗            | ~        | ✗         | ✗        | ✓         | ✓     | ~   |
| Building materials calculation     | ~    | ✗       | ✓            | ~        | ✗         | ✗        | ✗         | ✓     | ✓   |
| Building database and search       | ✓    | ✗       | ✗            | ~        | ✗         | ✗        | ✗         | ✗     | ~   |
| Owned buildings, islands, planning | ✗    | ✗       | ✗            | ✗        | ✗         | ✗        | ✗         | ✓     | ✗   |
| Military calculation               | ✗    | ✗       | ✗            | ✗        | ✗         | ✗        | ✗         | ✗     | ✓   |
| True productivity calculation      | ✗    | ✗       | ✗            | ✗        | ✗         | ✗        | ✗         | ✗     | ✓   |
| Inputs saved                       | ✓    | ✗       | ✓            | ~        | ✗         | ✗        | ✓         | ✓     | ✓   |
| Named presets or cities            | ✗    | ✗       | ✓            | ✗        | ✗         | ✗        | ✓         | ✗     | ✗   |
| Shareable links                    | ~    | ✗       | ✗            | ✗        | ✗         | ✗        | ✗         | ✗     | ✗   |
| German and English                 | ✓    | ✗       | ✗            | ✓        | ✗         | ✗        | ✗         | ✗     | ✗   |
| Layout for phones                  | ✗    | ✗       | ✗            | ✗        | ✗         | ✗        | ✓         | ~     | ✗   |
| Offline use                        | ✗    | ✓       | ✗            | ✗        | ✗         | ✗        | ✗         | ✓     | ✓   |
| Open source                        | ✓    | ✗       | ✗            | ✗        | ✗         | ~        | ✓         | ~     | ✗   |

Other tools, judged by their code, data or store pages only:

| Tool                  | Input                 | Chains                 | Other features                                         | Deep Ocean |
| --------------------- | --------------------- | ---------------------- | ------------------------------------------------------ | ---------- |
| iOS app               | Inhabitants or houses | Yes, with alternatives | Owned buildings, saved results, building wiki, DE/EN   | Yes        |
| Anno Assistant        | Population            | Yes                    | Layouts, production comparison, saved configuration    | No         |
| brunopp               | Houses, inhabitants   | Yes                    | Productivity, living space, phone layout               | Yes        |
| spike-rabbit          | Population            | Yes                    | Unfinished, no hosted version                          | Yes        |
| Universal Calculator  | Houses                | Yes                    | Materials, combined production across chains           | No         |
| codepowered           | Building efficiency   | No                     | Net production per good, choice of game version, saves | Yes        |
| Warenrechner ohne GUI | Population            | No                     | Offline program, source code in the forum              | No         |

### Shared features compared

- **Input:** We accept houses or residents per level for all factions at once
  and keep them in sync. nightport takes one level per faction and works
  backwards from it, which no one else does. The4thLaw only takes residents.
- **Results:** We show whole buildings with their efficiency, which answers "how
  many do I build and how busy are they". Most others show fractions, which is
  more precise for planning but needs rounding by the reader.
- **Chains:** Ours and A.R.R.C. are the most complete, with costs and selectable
  alternatives per level. Ours also sums up a chain and shares it by link.
  The4thLaw sums all chains into one requirement list, which ours does not do.
- **Saving:** We save automatically but only one state. i-dont-think.so and
  The4thLaw offer named presets or cities. A.R.R.C. keeps its inputs in the
  server session.
- **Reference data:** Our database with search has no real equivalent. A.R.R.C.
  has data sheets, and DOE has rate tables.

### Proposed changes

Follows from the game files, to be done before `v2.0.0`:

1. Update the 12 demand values, the two production times, and the maintenance
   and build costs to `patch8.rda`, and correct the source in
   [game-data.md](game-data.md). Done.
2. Reduce the raw material need of chains below 100 % productivity. Decided
   without a game test and done, see
   [What the calculator does with it](#what-the-calculator-does-with-it).
3. Name the game version on the site. Done.
4. Handle multiplying eco and item bonuses on farms. Decided: no change, see
   [What the calculator does with it](#what-the-calculator-does-with-it).

Worth considering independently of the data, left for later in
[rebuild-plan.md](rebuild-plan.md#later):

5. Show exact fractions as well, for example in a tooltip.
6. Add a global productivity control.
7. Add the senate ascension bonus.
8. Add a total across all chains.

The rebuild decided against shareable links for the population calculator, whose
plain URL has to open the current state as a bookmark. Saved games in the
browser took their place, with export and import.

Not a proposal: Deep Ocean stays out of scope.

Candidates
---

Availability as of 2026-11-08. "DO" means Deep Ocean. Unless stated otherwise,
the descriptions come from the tools' own pages, not from running them.

### Online calculators

| Calculator                                                                   | DO  | Game version / data                                                                        | Notes                                                                                            |
| ---------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [Anno2070Rechner.de](https://anno2070rechner.de/) (ours)                     | No  | `Data1.rda`, before the first patch                                                        | Population, chains with alternatives, database                                                   |
| [i-dont-think.so](http://i-dont-think.so/anno2070/) v2.0                     | Yes | Claims v2.0; its classic mode has outdated demands                                         | Presets, building materials, maximum-upgrade calculation; based on atspace                       |
| [anno2070.atspace.eu](http://anno2070.atspace.eu/) v1.01, by arbogli         | Yes | Not stated                                                                                 | Houses or inhabitants, senate bonus, chain totals scale with the parent; offline download        |
| [A.R.R.C. Warenrechner](https://anno2170-arrc.de/index.php?sub=warenrechner) | Yes | Per its news up to mod update 2.071; game v3.00.8051 tested 2023                           | Belongs to a mod, with a mode without mods; chains, alternatives, classic and add-on data sheets |
| [nightport.de](http://anno2070.nightport.de/anno2070_warenrechner.php), 2014 | Yes | Not stated                                                                                 | Residents or houses, goods demand by faction including Geniuses; server-side                     |
| [odegroot.nl](https://odegroot.nl/anno2070/calculator.html), by Grilse       | No  | Current demands, production times before `patch5.rda`; the Anno wiki calls it out of date  | Open data extraction behind it; productivity bonus                                               |
| [The4thLaw anno-calculators](https://the4thlaw.github.io/anno-calculators/)  | Yes | Current demands from wiki data, maintained until at least June 2026; deep links return 404 | Several Anno games; 2070 assets exist in the repository; AGPL, data CC-BY-SA                     |
| [codepowered annocalc](https://www.codepowered.com/annocalc/)                | Yes | Selectable: patch 1, 1.05, 1.06, DO                                                        | Building rates and net production only, but useful for tracing changes between versions          |

### Source code without a confirmed hosted version

| Project                                                                                   | DO  | Last change | Notes                                                                             |
| ----------------------------------------------------------------------------------------- | --- | ----------- | --------------------------------------------------------------------------------- |
| [fkarg/anno2070_calculator](https://github.com/fkarg/anno2070_calculator)                 | Yes | 2026-08     | React rebuild of atspace with tested calculations, islands and growth planning    |
| [spike-rabbit/Anno2070CalculatorNg](https://github.com/spike-rabbit/Anno2070CalculatorNg) | Yes | 2018-10     | Angular, includes add-on game data, marked "under construction" in its old README |
| [brunopp/Anno-2070-Utility](https://github.com/brunopp/Anno-2070-Utility)                 | Yes | 2014-08     | Extracts from game files; demo unreachable, Android version mentioned             |

### Apps and desktop programs

| Tool                                                                                                                | DO      | Last change | Notes                                                       |
| ------------------------------------------------------------------------------------------------------------------- | ------- | ----------- | ----------------------------------------------------------- |
| [Warenrechner für Anno 2070](https://apps.apple.com/de/app/warenrechner-f%C3%BCr-anno-2070/id504578852) (iOS, paid) | Yes     | 2019-04     | Owned buildings, chains, building wiki                      |
| [Anno 2070 Assistant](https://sourceforge.net/projects/a2070asst/) (Windows)                                        | Unknown | 2014-03     | Population, supply, chains, layouts; `dannydd88` has a fork |
| [Warenrechner ohne GUI](https://www.annozone.de/annopool/file/956-anno-2070-warenrechner-ohne-gui/) (Windows)       | No      | 2012-02     | Minimal offline tool                                        |
| Anno 2070 FanApp (Android)                                                                                          | Unknown | Unknown     | Only known from a Steam discussion                          |

### Spreadsheets

Listed on the [Anno wiki](https://anno2070.fandom.com/wiki/Calculators) or in
forums.

| Spreadsheet                                                                                                                                              | DO  | Notes                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------------------------- |
| [DOE Calculator v0.8](https://www.dropbox.com/s/0qzznufb6njvacg/Anno2070-DOE-Calculator-v0.8.zip), Saiko Kila                                            | Yes | Game v2, with and without DO; needs, materials, population, military |
| [Deep Ocean Calculator v1.0](https://www.dropbox.com/s/i6n7jcpag05g9v4/Anno%202070%20Deep%20Ocean%20-%20Calculator%20v1.0.xlsx), boiledburbur            | Yes | Excel                                                                |
| [Warenrechner](<https://web.archive.org/web/2013/http://forums-de.ubi.com:80/showthread.php/118567-Anno-2070-(-Tiefsee)-Warenrechner-Forums>), Den101992 | Yes | Long version history, faction modifiers; download links may be gone  |
| [Universal Calculator 0.6](http://www.mediafire.com/?frd4h7cv881kuc5), ZalmanW                                                                           | No  | Population, consumables and materials                                |
| Production Calculator v1.0, Acke87, download link gone (404)                                                                                             | No  | Link on the wiki, not checked                                        |

### No longer reachable

- `2070.anno1404-rechner.de` by Markus Schönbein: no response, archived until
  2023 as version 0.2 alpha without Geniuses.
- `s331885455.online.de`, "Online-Warenrechner v2.0" by Tycoon-Marcel: server
  error, archived until 2016.
- `msprogramme.de`: reported as gone in the AnnoZone forum.

Plan for the comparison
---

Steps 1 to 6 are done, except for the two game tests in step 6, see
[Comparison results](#comparison-results). Step 7 is open.

All of this happens before `v2.0.0`, against the current state of the rebuild.
The focus is on steps 1 to 5, which compare the calculators with each other and
do not need the game. They show who agrees with whom, not who is right; that
only follows from the real game data in step 6.

### 1. Settle who takes part

Check the candidates marked as unknown or open above, then fix the participants:

| Group                  | Calculators                                                          | Compared by                  |
| ---------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Running online         | i-dont-think.so, atspace, A.R.R.C. without mods, nightport, odegroot | Data, scenarios and features |
| To be checked first    | The4thLaw, if it covers Anno 2070 in usable form                     | Data, scenarios and features |
| Source code only       | fkarg, spike-rabbit, brunopp                                         | Reading data and formulas    |
| Reference only         | codepowered                                                          | Production rates per version |
| Apps, programs, tables | All others that can still be obtained for free                       | Features; scenarios if easy  |

Base game values come first. Calculators with a classic mode are compared in
that mode. Those with only Deep Ocean data are still compared for the Eco and
Tycoon goods, with that noted, because a difference can come from the game
version.

### 2. Compare the data

One table per value type, with one column per source and version: demands,
residents per house, ascension rates, production rates, raw materials, build
costs, maintenance, energy and eco balance. Sources with readable data are
compared directly: i-dont-think.so, atspace, A.R.R.C., odegroot, fkarg,
spike-rabbit, brunopp and The4thLaw.

This completes [What changed between versions](#what-changed-between-versions)
and [Data state of each source](#data-state-of-each-source).

### 3. Compare the calculations

Run the same scenarios in every calculator that accepts them and record the
input, version and output:

| Scenario              | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| One level at a time   | Isolates demand values, one faction and level per run   |
| Mixed city            | All factions and levels together                        |
| Round building counts | Rounding: exact fractions just above and below a whole  |
| Productivity          | 50 %, 100 %, 200 %, at the top of a chain and mid-chain |
| Bonuses               | +12 % living space, ascension bonus, Eco channel        |
| Houses to inhabitants | Distribution over levels from a number of houses        |
| Alternatives          | Recycler and metal converter in place of normal chains  |
| Shared raw materials  | Demand adding up across chains                          |

Each difference gets exactly one cause:

- **Data:** other values or another game version
- **Formula:** another calculation
- **Rounding:** same calculation, other display or rounding
- **Scope:** not supported, for example Deep Ocean
- **Bug:** contradicts the calculator's own stated data or method

Differences below the displayed precision are ignored. Scripts may read public
data files, but forms on third-party sites are filled in by hand and in
moderation. Spreadsheets are compared if they open without macros.

### 4. Compare the features

One matrix, with supported, partial or not supported per calculator, tested
rather than taken from descriptions:

- **Game coverage:** classic, Deep Ocean, patch state stated, mods
- **Input:** inhabitants, houses, highest level, bonuses, global and individual
  productivity
- **Output:** demand, buildings, efficiency, overproduction, maintenance,
  energy, eco balance, build costs
- **Chains:** visual chain, alternatives, totals across chains, raw materials
- **Planning:** owned buildings, several islands, growth targets
- **Reference:** building database, search, layouts
- **Use:** languages, saved inputs, shareable links, offline use, mobile layout,
  open source, license, maintenance

### 5. Write down the result

Tables and conclusions go into this document, with date and version. Captured
pages and raw outputs stay outside the repository like the rebuild's reference
data. The result is a list of proposed changes; each becomes a decision in
[rebuild-plan.md](rebuild-plan.md) only when agreed.

No data or code from other calculators is copied into this repository without
checking its license, since most state none and The4thLaw's AGPL and CC-BY-SA
would not fit this project's MIT license.

### 6. Check against the real game data

Done for the data, see [What the game files show](#what-the-game-files-show).
The tests in the running game were dropped, see
[Below 100 % and eco with items](#below-100--and-eco-with-items).

### 7. Fix what has to be fixed

Only now, and still before `v2.0.0`, the agreed changes are made, see
[Proposed changes](#proposed-changes) and
[rebuild-plan.md](rebuild-plan.md#next-steps).

Open questions
---

- Does the author remember the name or domain of the expansion fork, for example
  from old e-mail or forum notifications?
- Should A.R.R.C. be compared only in its mode without mods? That is the
  assumption here, since the mod is a different game balance.

<!-- cspell:ignore Acke arbogli Beamer Neuroimplants brunopp dont fkarg für Kila Markus odegroot ohne Saiko Schönbein Tiefsee Warenrechner Zalman -->
