Game data: origin and extraction
===

How the game data and icons of Anno2070Rechner.de were obtained, written down
for the record. The site itself does not need any of this to run. It is only
useful if the data ever has to be extracted from the game again.

The original importer is `inc/class-gamedata.php` (`GameData::readFromXml()` and
`GameData::saveToDb()`) together with `tpl/rda-import.php`. Both remain in the
Git history after the PHP application is removed.

Source files
---

The data was first extracted around December 2011 to February 2012 from the game
files of Anno 2070 (Ubisoft / Related Designs). The game stores its files in
`.rda` archives, which were unpacked with a third-party RDA tool. Which tool was
used is not recorded.

The importer names `patch1.rda` as the source, but the values it imported came
from `Data1.rda`, dated September 2011. In November 2026 the values were updated
to `patch8.rda`, the final state of the game data, see
[Update to the final game data](#update-to-the-final-game-data). The paths below
are as the importer recorded them.

| File in the archive                          | Used for                          |
| -------------------------------------------- | --------------------------------- |
| `patch1.rda/data/config/game/assets.xml`     | Buildings, costs, production      |
| `patch1.rda/data/config/game/properties.xml` | Product GUIDs, population demands |
| `patch1.rda/data/config/game/icons.xml`      | Icon of every GUID                |
| `eng0.rda/data/loca/eng/txt/guids.txt`       | English names                     |
| `eng0.rda/data/loca/eng/txt/icons.txt`       | English names (products)          |
| `ger0.rda/data/loca/ger/txt/guids.txt`       | German names                      |
| `ger0.rda/data/loca/ger/txt/icons.txt`       | German names (products)           |

`templates.xml` from the same folder was unpacked as well but not used.

What was taken from where
---

### Names

The localization files are UTF-16LE text with one `GUID=Text` entry per line.
The importer dropped the NUL bytes and split each line at the first `=`.
`guids.txt` and `icons.txt` were merged per language.

### Products

Products are referenced by name in `assets.xml` (for example `Fish`). The
importer mapped names to GUIDs through
`//DefaultValues/GUIBalancing/ProductIconGUID/<Name>/icon` in `properties.xml`.

Three pseudo products were added for buildings without a real product:

| GUID    | Meaning     | Used by                                                            |
| ------- | ----------- | ------------------------------------------------------------------ |
| 2503003 | Forest      | Buildings with `WareProduction/SpecialProductIcon = Forest`        |
| 2600078 | Eco balance | Buildings with a positive `MaintenanceCost/ActiveEcoEffect`        |
| 2600012 | Energy      | Buildings with a positive `MaintenanceCost/ActiveEnergyProduction` |

### Buildings

All assets under
`/AssetList/Groups/Group[Name="Objects"]/Groups/Group[Name="Buildings"]/Groups/Group`,
in the groups `tycoons`, `ecos`, `techs` and `others`, sorted by their
`Template`:

| Templates                                                                                               | Stored as                                               |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `FarmBuilding`, `FactoryBuilding`, `SimpleProductionBuilding`, `LinkedObjectProductionBuilding`         | Production building                                     |
| `ResidenceBuilding`                                                                                     | Residence (with `MinResidentCount`, `MaxResidentCount`) |
| `PublicBuilding`, `SupportBuilding`, `Warehouse`, `Harbour`, `MilitaryBuilding`, `Monument` and similar | Other building                                          |
| `FarmfieldLinkedObject`, `Ark`, `SimpleBlocking`, `SimpleObject`                                        | Ignored                                                 |

GUID 10239 was excluded by hand (`GameData::$guid_blacklist`).

Values per building:

| Value               | Source in `Values`                                                                              | Unit                                |
| ------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| Build cost credits  | `BuildCost/ResourceCost/Credits`                                                                | Credits                             |
| Build cost products | `BuildCost/ProductCost/<Product>`                                                               | kg (shown as t)                     |
| Maintenance         | `MaintenanceCost/ActiveCost`, `InactiveCost`                                                    | Credits                             |
| Eco balance         | `MaintenanceCost/ActiveEcoEffect`, `InactiveEcoEffect`                                          | 4096 = 1 point                      |
| Energy              | `MaintenanceCost/ActiveEnergyCost`, `InactiveEnergyCost` (production: `ActiveEnergyProduction`) | 4096 = 1 point                      |
| Hit points, level   | `Hitpoints/MaxHitpoints`, `Building/BuildingLevel`                                              |                                     |
| Product             | `WareProduction/Product`                                                                        |                                     |
| Production cycle    | `WareProduction/ProductionTime`, `ProductionCount`                                              | ms, kg (defaults 20000 ms, 1000 kg) |
| Raw materials       | `Factory/RawMaterial1`, `RawNeeded1`, `RawMaterial2`, `RawNeeded2`                              | kg per cycle (default 1000 kg)      |

Tons per minute are derived from these values:
`production_count / 1000 × 60000 / production_time`. For energy and eco
buildings the active energy or eco value divided by 4096 is used instead.

### Population demands

`//DefaultValues/Balancing/DemandAmount` in `properties.xml`, per resident level
(`Ecos1` to `Ecos4`, `Tycoons1` to `Tycoons4`, `Techs1`, `Techs2`) and product.
According to the game's own description the value is "kg goods that 100
Residents demand in one minute". The calculator therefore uses
`residents / 100 × amount / 1000` tons per minute.

The display order of the demands was set by hand (`GameData::$demands_order`).
The number of residents per house (8, 15, 25, 40 and 5, 30) is not taken from
the game data but written into `js/population-calculator.js`.

### Icons

`icons.xml` maps every GUID to an icon atlas and a position in it (`IconFileID`,
`IconIndex`). The importer stored this as the file name
`icon_<IconFileID>_<IconIndex>.png`. All icons in use come from atlas 27.

The icons were cut out of the game's icon atlases and saved in four sizes (16,
24, 32 and 46 px) under `img/icons/<size>/`. How this was done is not recorded.
The interface images in `img/` were made for the site, partly from game artwork.

Later game versions
---

The final game version checked is 3.0.8051 (Ubisoft Connect). It was unpacked
with RDA Explorer 1.4.0.0; the unpacked files are kept privately outside this
repository, in `Anno2070Rechner-export/game-files-latest`.

The game reads `Data1.rda` and then `patch1.rda` to `patch9.rda`, later archives
overwriting earlier ones. `assets.xml` and `properties.xml` exist in `Data1.rda`
and `patch1.rda` to `patch8.rda`, and `patch9.rda` only holds texts, so
`patch8.rda` is the final state of the base game. Deep Ocean has its data in
`addondata/config/balancing/addon_01_assets.xml` of `addon1.rda`. Downloadable
content is in `data/config/dlc_01` to `dlc_04`.

Item effects are in `data/config/features/items.xml`, and information channels
in `data/config/features/features.xml`.

Update to the final game data
---

In November 2026 these values were changed from `Data1.rda` to `patch8.rda`. Raw
material needs, all other production times, residents per house and ascension
rates were already the same. The base game has no additional production
buildings. See
[calculator-comparison.md](calculator-comparison.md#what-changed-between-versions)
for the version in which each change was made. The update was applied by a
script kept outside this repository, which also checked every old value.

Demands in kilograms per 100 residents and minute:

| Good            | Level    | Before | Now |
| --------------- | -------- | ------ | --- |
| ComfortFood     | Ecos3    | 200    | 150 |
| ComfortFood     | Ecos4    | 125    | 110 |
| HealthDrink     | Ecos3    | 185    | 150 |
| HealthDrink     | Ecos4    | 200    | 110 |
| Toys            | Tycoons2 | 350    | 300 |
| Toys            | Tycoons3 | 250    | 200 |
| Toys            | Tycoons4 | 160    | 120 |
| LuxuryMeal      | Tycoons3 | 130    | 120 |
| Champagne       | Tycoons3 | 185    | 120 |
| Champagne       | Tycoons4 | 125    | 90  |
| Jewelry         | Tycoons4 | 250    | 200 |
| Pharmaceuticals | Tycoons4 | 200    | 175 |

Buildings, in the units of the game files:

| Building                           | GUID  | Value                             | Before          | Now     |
| ---------------------------------- | ----- | --------------------------------- | --------------- | ------- |
| Sawmill                            | 10037 | Production time (ms)              | 45000           | 60000   |
| River sewage treatment plant       | 10123 | Build cost: glass (kg)            | 12000           | 25000   |
| River sewage treatment plant       | 10123 | Build cost: tools (kg)            | 2000            | 40000   |
| River sewage treatment plant       | 10123 | Build cost: wood (kg)             | 12000           | 20000   |
| Functional food factory            | 10194 | Active maintenance                | 50              | 40      |
| Functional food factory            | 10194 | Inactive maintenance              | 25              | 20      |
| Coffee plantation                  | 10195 | Active maintenance                | 70              | 40      |
| Coffee plantation                  | 10195 | Inactive maintenance              | 35              | 20      |
| Energy drink factory               | 10197 | Active maintenance                | 90              | 60      |
| Energy drink factory               | 10197 | Inactive maintenance              | 45              | 30      |
| Black Smoker Gold collection point | 10206 | Inactive maintenance              | None            | 75      |
| Black smoker miner copper          | 10207 | Inactive maintenance              | None            | 50      |
| Black smoker miner uranium         | 10208 | Inactive maintenance              | None            | 100     |
| Black smoker miner uranium         | 10208 | Production time (ms)              | 20000 (default) | 60000   |
| Black Smoker miner iron            | 10269 | Inactive maintenance              | None            | 50      |
| Deep sea warehouse                 | 10033 | Build cost: building modules (kg) | 3000            | 8000    |
| Deep sea warehouse                 | 10033 | Build cost: credits               | 400             | 600     |
| Deep sea warehouse                 | 10033 | Build cost: tools (kg)            | 2000            | 4000    |
| Warehouse                          | 10063 | Active maintenance                | 15              | 20      |
| Warehouse                          | 10063 | Inactive maintenance              | 15              | 20      |
| Warehouse                          | 10064 | Active maintenance                | 20              | 30      |
| Warehouse                          | 10064 | Inactive maintenance              | 20              | 30      |
| Depot                              | 10065 | Active maintenance                | 20              | 10      |
| Depot                              | 10065 | Inactive maintenance              | 20              | 10      |
| Depot                              | 10066 | Active maintenance                | 30              | 15      |
| Depot                              | 10066 | Inactive maintenance              | 30              | 15      |
| Deep sea warehouse                 | 10067 | Build cost: credits               | 600             | 800     |
| Harbour defence turret             | 10101 | Build cost: building modules (kg) | 2000            | 8000    |
| Harbour defence turret             | 10101 | Build cost: credits               | 600             | 800     |
| Harbour defence turret             | 10101 | Build cost: tools (kg)            | 3000            | 5000    |
| Harbour defence turret             | 10101 | Build cost: weapons (kg)          | 4000            | 5000    |
| Clearance terminal                 | 10109 | Active maintenance                | 100             | 60      |
| Clearance terminal                 | 10109 | Build cost: building modules (kg) | 15000           | 5000    |
| Clearance terminal                 | 10109 | Build cost: credits               | 2000            | 1000    |
| Harbor depot                       | 10131 | Active maintenance                | 30              | 20      |
| Leisure center                     | 10213 | Inactive maintenance              | 500             | 1000    |
| Leisure center                     | 10213 | Inactive eco effect               | -81920          | -163840 |
| Leisure center                     | 10213 | Inactive energy cost              | 614400          | 1228800 |
| Corporate headquarter              | 10217 | Inactive maintenance              | 500             | 1000    |
| Corporate headquarter              | 10217 | Inactive eco effect               | -122880         | -245760 |
| Corporate headquarter              | 10217 | Inactive energy cost              | 614400          | 1228800 |
| Underwater warehouse               | 10238 | Active energy cost                | None            | 12288   |
| Underwater warehouse               | 10238 | Build cost: building modules (kg) | 12000           | 8000    |
| Underwater warehouse               | 10238 | Inactive energy cost              | None            | 4096    |
| Underwater warehouse               | 10238 | Build cost: tools (kg)            | 6000            | 4000    |

Getting the data again
---

1. Install Anno 2070 and unpack `data/config/game/assets.xml` and
   `properties.xml` from the newest `patch*.rda` that holds them, see
   [Later game versions](#later-game-versions).
2. Read them as described in this document. The old importer in the Git history
   shows the exact XPath queries and special cases.
3. Cut the icons out of the atlases and name them as described above.

<!-- cspell:ignore defence -->
