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

The data was extracted around December 2011 to February 2012 from the game files
of Anno 2070 (Ubisoft / Related Designs) with patch 1 installed. The game stores
its files in `.rda` archives, which were unpacked with a third-party RDA tool.
Which tool was used is not recorded.

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

Getting the data again
---

1. Install Anno 2070 and unpack the files listed above from the `.rda` archives.
   Later patches and the expansions may have changed values and paths.
2. Read them as described in this document. The old importer in the Git history
   shows the exact XPath queries and special cases.
3. Cut the icons out of the atlases and name them as described above.
