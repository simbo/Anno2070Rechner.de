<?php
/**
 * class-gamedata.php
 *
 * @package Anno2070Rechner
 */

/**
 * GameData
 *
 * @abstract
 * @package Anno2070Rechner
 */
abstract class GameData {

	private static $src = array(
			'assets' => array(
				'file' => 'rda-data/assets.xml',
				'rda_path' => 'patch1.rda/data/config/game/assets.xml'
			),
			'icons' => array(
				'file' => 'rda-data/icons.xml',
				'rda_path' => 'patch1.rda/data/config/game/icons.xml'
			),
			'properties' => array(
				'file' => 'rda-data/properties.xml',
				'rda_path' => 'patch1.rda/data/config/game/properties.xml'
			),
			'guids_en' => array(
				'file' => 'rda-data/eng/guids.txt',
				'rda_path' => 'eng0.rda/data/loca/eng/txt/guids.txt'
			),
			'icons_en' => array(
				'file' => 'rda-data/eng/icons.txt',
				'rda_path' => 'eng0.rda/data/loca/eng/txt/icons.txt'
			),
			'guids_de' => array(
				'file' => 'rda-data/ger/guids.txt',
				'rda_path' => 'ger0.rda/data/loca/ger/txt/guids.txt'
			),
			'icons_de' => array(
				'file' => 'rda-data/ger/icons.txt',
				'rda_path' => 'ger0.rda/data/loca/ger/txt/icons.txt'
			)
		),
		$icons_xml,
		$properties_xml,
		$assets_xml,
		$product_icon_xpath,
		$products,
		$buildings,
		$productionbuildings,
		$productionbuildings_by_product,
		$residencebuildings,
		$demands,
		$locals_en,
		$locals_de,
		$demands_order = array(
			2500004, // fish
			2500006, // tea
			2500019, // health food
			2500029, // communicator
			2500018, // comfort food
			2500023, // health drinks
			2500030, // 3d beamer
			2500031, // home robot
			2500007, // schnaps
			2500020, // convenience food
			2500026, // toy wip
			2500021, // luxury meal
			2500024, // champagner
			2500027, // jewelry
			2500028, // pharmaceuticals
			2500022, // functional food
			2500025  // functional meal
		);
	
	public static function getSrc() {
		return self::$src;
	}
	
	public static function getDemandsOrder() {
		return self::$demands_order;
	}
	
	public static function readFromXml() {
		self::$icons_xml = simplexml_load_file( ABSPATH.self::$src['icons']['file'] );
		self::$properties_xml = simplexml_load_file( ABSPATH.self::$src['properties']['file'] );
		self::$assets_xml = simplexml_load_file( ABSPATH.self::$src['assets']['file'] );
		self::$product_icon_xpath = self::$properties_xml->xpath("//DefaultValues/GUIBalancing/ProductIconGUID");
		self::$product_icon_xpath = is_array(self::$product_icon_xpath) && count(self::$product_icon_xpath)>=1 ? self::$product_icon_xpath[0] : null;
		self::$locals_en = self::parseLocals( self::$src['guids_en']['file'] );
		self::$locals_en += self::parseLocals( self::$src['icons_en']['file'] );
		self::$locals_de = self::parseLocals( self::$src['guids_de']['file'] );
		self::$locals_de += self::parseLocals( self::$src['icons_de']['file'] );
		if( self::$icons_xml
			&& self::$properties_xml
			&& self::$assets_xml
			&& self::$product_icon_xpath
			&& !empty(self::$locals_en)
			&& !empty(self::$locals_de)
		) {
			self::parseAssets();
			self::parseDemands();
			return true;
		}
		return false;
	}

	private static function parseLocals( $file ) {
		$values = array();
		if( $file = @file( $file ) )
			foreach( $file as $i => $line ) {
				$line = preg_replace( '/\x00/i', '', trim($line) );
				if( preg_match('/^[a-z0-9]+/',$line) && ($sep=strpos($line,'='))>0 )
					$values[ trim(substr($line,0,$sep)) ] = trim(substr($line,$sep+1));
			}
		return $values;
	}
	
	private static function parseDemands() {
		$elements = self::$properties_xml->xpath("//DefaultValues/Balancing/DemandAmount");
		self::$demands = array();
		foreach( $elements[0] as $level => $d ) {
			if( count($d)>=1 ) {
				$demand = array();
				foreach( $d as $product => $amount ) {
					$guid = self::getProductGuid( $product );
					if( isset(self::$products[$guid]) )
						array_push( $demand, array(
							'amount' => (int) $amount,
							'product_guid' => $guid
						) );
				}
				self::$demands[ (string) $level ] = $demand;
			}
		}
	}
	
	private static function parseAssets() {
		self::$productionbuildings = array();
		self::$residencebuildings = array();
		self::$buildings = array();
		self::$products = array();
		if( $groups = self::$assets_xml->xpath('/AssetList/Groups[1]/Group[Name/text() = "Objects"]/Groups[1]/Group[Name/text() = "Buildings"]/Groups[1]/Group') ) :
			foreach( $groups as $group ) :
				if( in_array( $group->Name, array('tycoons','ecos','techs','others') ) && $elements = $group->xpath('Groups/Group/Assets/Asset') ) :
					foreach( $elements as $e ) :
						$product = null;
						$product_guid = null;
						switch( $e->Template ) :
							case 'FarmfieldLinkedObject':
							case 'Ark':
							case 'SimpleBlocking':
							case 'SimpleObject':
								// these buildings are ignored
								break;
							case 'PublicBuilding':
							case 'SupportBuilding':
							case 'PropagandaBuilding':
							case 'AcademyBuilding':
							case 'Warehouse':
							case 'Markethouse':
							case 'WarehouseWithGuns':
							case 'WarehouseWithoutTrading':
							case 'MobileMilitaryTurret':
							case 'MobilePropagandaBuilding':	// shield generator
							case 'MilitaryBuilding':
							case 'Harbour':
							case 'RepairHarbourBuilding':
							case 'AirportBuilding':
							case 'SpecialActionBuilding':		// missile launching plattform
							case 'TaskBasedProductionBuilding':	// shipyards
							case 'Monument':
								$b = self::createBuildingFromXml( $e );
								if( $b->isValid() )
									self::$buildings[ $b->getGuid() ] = $b;
								break;
							case 'ResidenceBuilding':
								$b = self::createBuildingFromXml( $e, 'ResidenceBuilding' );
								if( property_exists( $e->Values, 'ResidenceBuilding' ) ) {
									if( property_exists( $e->Values->ResidenceBuilding, 'MinResidentCount' ) )
										$b->setMinResidents( $e->Values->ResidenceBuilding->MinResidentCount );
									if( property_exists( $e->Values->ResidenceBuilding, 'MaxResidentCount' ) )
										$b->setMaxResidents( $e->Values->ResidenceBuilding->MaxResidentCount );
								}
								if( $b->isValid() )
									self::$residencebuildings[ $b->getGuid() ] = $b;
								break;
							case 'SimpleProductionBuilding':		// eco effect buildings
							case 'LinkedObjectProductionBuilding':	// energy production
							case 'FactoryBuilding':
							case 'FarmBuilding':
								$b = self::createBuildingFromXml( $e, 'ProductionBuilding' );
								if( property_exists( $e->Values, 'WareProduction' ) && property_exists( $e->Values->WareProduction, 'Product' ) ) {
									$b->setType( ( (string) $e->Template )=='FarmBuilding' ? 'farm' : 'factory' );
									$product_guid = self::getProductGuid( $e->Values->WareProduction->Product );
								}
								elseif( property_exists( $e->Values, 'WareProduction' ) && property_exists( $e->Values->WareProduction, 'SpecialProductIcon' ) && ( (string)$e->Values->WareProduction->SpecialProductIcon=='Forest' ) ) {
									$b->setType('forest');
									$product_guid = 2503003; // Forest
								}
								elseif( property_exists( $e->Values->MaintenanceCost, 'ActiveEcoEffect' ) && intval($e->Values->MaintenanceCost->ActiveEcoEffect) > 0 ) {
									$b->setType('eco');
									$product_guid = 2600078; // Eco effect
									
								}
								elseif( property_exists( $e->Values->MaintenanceCost, 'ActiveEnergyProduction' ) && intval($e->Values->MaintenanceCost->ActiveEnergyProduction) > 0 ) {
									$b->setType('energy');
									$b->setMaintenanceCost( 'active_energy', intval($e->Values->MaintenanceCost->ActiveEnergyProduction)*-1 );
									$product_guid = 2600012; // Energy
								}
								if( $product_guid>0 ) {
									if( !isset( self::$products[$product_guid] ) ) {
										$product = self::createProductFromGuid($product_guid);
										if( $product->isValid() )
											self::$products[$product_guid] = $product;
									}
									if( isset( self::$products[$product_guid] ) ) {
										$b->setProduct( self::$products[$product_guid] );
										if( property_exists( $e->Values, 'WareProduction' ) ) {
											if( property_exists( $e->Values->WareProduction, 'ProductionTime' ) )
												$b->setProductionTime( $e->Values->WareProduction->ProductionTime );
											if( property_exists( $e->Values->WareProduction, 'ProductionCount' ) )
												$b->setProductionCount( $e->Values->WareProduction->ProductionCount );
										}
									}
								}
								if( property_exists( $e->Values, 'Factory') ) {
									if( property_exists( $e->Values->Factory, 'RawMaterial1' ) ) {
										$product_guid = self::getProductGuid( $e->Values->Factory->RawMaterial1 );
										if( !isset( self::$products[$product_guid] ) ) {
											$product = self::createProductFromGuid($product_guid);
											if( $product->isValid() )
												self::$products[$product_guid] = $product;
										}
										if( isset( self::$products[$product_guid] ) ) {
											$b->setRaw1( self::$products[$product_guid] );
											if( property_exists( $e->Values->Factory, 'RawNeeded1' ) )
												$b->setRaw1Need( $e->Values->Factory->RawNeeded1 );
										}
									}
									if( property_exists( $e->Values->Factory, 'RawMaterial2' ) ) {
										$product_guid = self::getProductGuid( $e->Values->Factory->RawMaterial2 );
										if( !isset( self::$products[$product_guid] ) ) {
											$product = self::createProductFromGuid($product_guid);
											if( $product->isValid() )
												self::$products[$product_guid] = $product;
										}
										if( isset( self::$products[$product_guid] ) ) {
											$b->setRaw2( self::$products[$product_guid] );
											if( property_exists( $e->Values->Factory, 'RawNeeded2' ) )
												$b->setRaw2Need( $e->Values->Factory->RawNeeded2 );
										}
									}
								}
								if( $b->isValid() )
									self::$productionbuildings[ $b->getGuid() ] = $b;
								break;
							default:
								/*
								header('Content-Type: text/plain;charset=utf-8');
								echo $e->Template)."\n"
								echo self::$locals_de[ (int) $e->Values->Standard->GUID ]."\n";
								print_r($e->Values->Standard);
								die();
								*/
								break;
						endswitch;
					endforeach;
				endif;
			endforeach;
		endif;
	}

	private static function createBuildingFromXml( $e, $class='Building' ) {
		$b = new $class( $e->Values->Standard->GUID );
		$b->setIcon( self::getIcon( $b->getGuid() ) );
		$b->setLocal( 'de', self::$locals_de[ $b->getGuid() ] );
		$b->setLocal( 'en', self::$locals_en[ $b->getGuid() ] );
		if( property_exists( $e->Values, 'BuildCost' ) ) {
			if( property_exists( $e->Values->BuildCost, 'ResourceCost' ) && property_exists( $e->Values->BuildCost->ResourceCost, 'Credits' ) )
				$b->setBuildcostsCredits( $e->Values->BuildCost->ResourceCost->Credits );
			if( property_exists( $e->Values->BuildCost, 'ProductCost' ) ) {
				foreach( $e->Values->BuildCost->ProductCost as $productcost ) {
					foreach( $productcost as $product_name => $costs ) {
						$product_guid = self::getProductGuid( $product_name );
						if( !isset( self::$products[$product_guid] ) ) {
							$product = new GameObject( $product_guid );
							$product->setIcon( self::getIcon( $product_guid ) );
							$product->setLocal( 'de', self::$locals_de[ $product_guid ] );
							$product->setLocal( 'en', self::$locals_en[ $product_guid ] );
							if( $product->isValid() )
								self::$products[$product_guid] = $product;
						}
						if( isset( self::$products[$product_guid] ) && !empty($costs) ) {
							$b->setBuildcostsProduct( self::$products[$product_guid], $costs );
						}
					}
				}
			}
		}
		if( property_exists( $e->Values, 'MaintenanceCost' ) ) {
			if( property_exists( $e->Values->MaintenanceCost, 'ActiveCost' ) )
				$b->setMaintenanceCost( 'active_cost', $e->Values->MaintenanceCost->ActiveCost );
			if( property_exists( $e->Values->MaintenanceCost, 'InactiveCost' ) )
				$b->setMaintenanceCost( 'inactive_cost', $e->Values->MaintenanceCost->InactiveCost );
			if( property_exists( $e->Values->MaintenanceCost, 'ActiveEcoEffect' ) )
				$b->setMaintenanceCost( 'active_eco', $e->Values->MaintenanceCost->ActiveEcoEffect );
			if( property_exists( $e->Values->MaintenanceCost, 'InactiveEcoEffect' ) )
				$b->setMaintenanceCost( 'inactive_eco', $e->Values->MaintenanceCost->InactiveEcoEffect );
			if( property_exists( $e->Values->MaintenanceCost, 'ActiveEnergyCost' ) )
				$b->setMaintenanceCost( 'active_energy', $e->Values->MaintenanceCost->ActiveEnergyCost );
			if( property_exists( $e->Values->MaintenanceCost, 'InactiveEnergyCost' ) )
				$b->setMaintenanceCost( 'inactive_energy', $e->Values->MaintenanceCost->InactiveEnergyCost );
		}
		if( property_exists( $e->Values, 'Hitpoints' ) && property_exists( $e->Values->Hitpoints, 'MaxHitpoints' ) )
			$b->setHitpoints( $e->Values->Hitpoints->MaxHitpoints );
		if( property_exists( $e->Values, 'Building' ) && property_exists( $e->Values->Building, 'BuildingLevel' ) )
			$b->setLevel( $e->Values->Building->BuildingLevel );
		return $b;
	}
	
	private static function createProductFromGuid( $product_guid ) {
		$product = new GameObject( $product_guid );
		$product->setIcon( self::getIcon( $product_guid ) );
		$product->setLocal( 'de', self::$locals_de[ $product_guid ] );
		$product->setLocal( 'en', self::$locals_en[ $product_guid ] );
		return $product;
	}
	
	private static function getIcon( $guid ) {
		$elements = self::$icons_xml->xpath("i[GUID/text() = $guid]");
		if( !$elements || count($elements)<1 || count($elements)>1 )
			return '';
		$icon = is_array( $elements[0]->Icons->i ) ? $elements[0]->Icons->i[0] : $elements[0]->Icons->i;
		return sprintf( 'icon_%d_%d.png', $icon->IconFileID, ( (int) $icon->IconIndex ) );
	}

	private static function getProductGuid( $product ) {
		return property_exists( self::$product_icon_xpath, $product ) && property_exists( self::$product_icon_xpath->$product, 'icon' ) ? (int) self::$product_icon_xpath->$product->icon : 0;
	}

	public static function saveToDb() {
		$db_objects = array();
		$db_products = array();
		$db_buildings = array();
		$db_buildcosts_products = array();
		$db_residencebuildings = array();
		$db_productionbuildings = array();
		$db_demands = array();
		$data = array(
			'products' => self::$products,
			'buildings' => self::$buildings,
			'productionbuildings' => self::$productionbuildings,
			'residencebuildings' => self::$residencebuildings,
			'demands' => self::$demands
		);
		foreach( $data as $k => $d ) :
			foreach( $d as $i => $o ) :
				if( $k=='demands' ) :
					foreach( $o as $d )
						array_push( $db_demands, 
							"(".Database::_()->strPrep( $i ).","
							.Database::_()->intPrep( $d['amount'] ).","
							.Database::_()->intPrep( $d['product_guid'] ).")"
						);
				else :
					array_push( $db_objects, 
						"(".Database::_()->intPrep( $o->getGuid() ).","
						.Database::_()->strPrep( $o->getLocal('en') ).","
						.Database::_()->strPrep( $o->getLocal('de') ).","
						.Database::_()->strPrep( $o->getIcon() ).")"
					);
					if( $k == 'products' ) :
						array_push( $db_products,
							"(".Database::_()->intPrep( $o->getGuid() ).")"
						);
					else :
						array_push( $db_buildings,
							"(".Database::_()->intPrep( $o->getGuid() ).","
							.Database::_()->intPrep( $o->getBuildcostsCredits() ).","
							.Database::_()->intPrep( $o->getMaintenanceCost('active_cost') ).","
							.Database::_()->intPrep( $o->getMaintenanceCost('inactive_cost') ).","
							.Database::_()->intPrep( $o->getMaintenanceCost('active_eco') ).","
							.Database::_()->intPrep( $o->getMaintenanceCost('inactive_eco') ).","
							.Database::_()->intPrep( $o->getMaintenanceCost('active_energy') ).","
							.Database::_()->intPrep( $o->getMaintenanceCost('inactive_energy') ).","
							.Database::_()->intPrep( $o->getHitpoints() ).","
							.Database::_()->strPrep( $o->getLevel() ).")"
				
						);
						foreach( $o->getBuildcostsProducts() as $p ) :
							array_push( $db_buildcosts_products,
								"(".Database::_()->intPrep( $o->getGuid() ).","
								.Database::_()->intPrep( $p[0]->getGuid() ).","
								.Database::_()->intPrep( $p[1] ).")"
							);
						endforeach;
						if( $k == 'productionbuildings' ) :
							array_push( $db_productionbuildings,
								"(".Database::_()->intPrep( $o->getGuid() ).","
								.Database::_()->intPrep( $o->getType() ).","
								.Database::_()->intPrep( $o->getProduct()->getGuid() ).","
								.Database::_()->intPrep( $o->getProductionTime() ).","
								.Database::_()->intPrep( $o->getProductionCount() ).","
								.( $o->getRaw1() ? Database::_()->intPrep( $o->getRaw1()->getGuid() ) : 'null' ).","
								.Database::_()->intPrep( $o->getRaw1Need() ).","
								.( $o->getRaw2() ? Database::_()->intPrep( $o->getRaw2()->getGuid() ) : 'null' ).","
								.Database::_()->intPrep( $o->getRaw2Need() ).")"
							);
						elseif( $k == 'residencebuildings' ) :
							array_push( $db_residencebuildings,
								"(".Database::_()->intPrep( $o->getGuid() ).","
								.Database::_()->intPrep( $o->getMinResidents() ).","
								.Database::_()->intPrep( $o->getMaxResidents() ).")"
							);
						endif;
					endif;
				endif;
			endforeach;
		endforeach;
		$sql = "TRUNCATE game_demands;"
			."TRUNCATE game_residencebuildings;"
			."TRUNCATE game_productionbuildings;"
			."TRUNCATE game_buildcosts_products;"
			."TRUNCATE game_buildings;"
			."TRUNCATE game_products;"
			."TRUNCATE game_objects;"
			."INSERT INTO game_objects ( guid, local_en, local_de, icon ) VALUES ".join(',',$db_objects).";"
			."INSERT INTO game_products ( object_guid ) VALUES ".join(',',$db_products).";"
			."INSERT INTO game_buildings ( object_guid, buildcosts_credits, mc_active_cost, mc_inactive_cost, mc_active_eco, mc_inactive_eco, mc_active_energy, mc_inactive_energy, hitpoints, level ) VALUES ".join(',',$db_buildings).";"
			."INSERT INTO game_buildcosts_products ( building_guid, product_guid, costs ) VALUES ".join(',',$db_buildcosts_products).";"
			."INSERT INTO game_productionbuildings ( building_guid, type, product_guid, production_time, production_count, raw1_guid, raw1_need, raw2_guid, raw2_need ) VALUES ".join(',',$db_productionbuildings).";"
			."INSERT INTO game_residencebuildings ( building_guid, min_residents, max_residents ) VALUES ".join(',',$db_residencebuildings).";"
			."INSERT INTO game_demands ( level, amount, product_guid ) VALUES ".join(',',$db_demands).";";
		Database::_()->multiQuery($sql);
		return !Database::_()->getError() ? true : false;
	}

	private static function countRows( $table, $column='*' ) {
		$sql = "SELECT COUNT(".$column.") FROM ".$table;
		$result = Database::_()->query($sql);
		if( $result && $row=$result->fetch_assoc() )
			return (int) $row['COUNT('.$column.')'];
		else
			return 0;
	}
	
	public static function countObjects() {
		return self::countRows('game_objects','guid');
	}

	public static function countProducts() {
		return self::countRows('game_products','object_guid');
	}

	public static function countBuildings() {
		return self::countRows('game_buildings','object_guid');
	}

	public static function countProductionBuildings() {
		return self::countRows('game_productionbuildings','building_guid');
	}

	public static function getBuildings() {
		if( empty(self::$buildings) )
			self::getBuildingsFromDb();
		return self::$buildings;
	}
	
	public static function getProductionBuildings() {
		if( empty(self::$productionbuildings) )
			self::getProductionBuildingsFromDb();
		return self::$productionbuildings;
	}
	
	public static function getProductionBuildingsByProduct() {
		if( empty(self::$productionbuildings_by_product) ) {
			self::$productionbuildings_by_product = array();
			foreach( self::getProductionBuildings() as $b ) {
				if( !isset( self::$productionbuildings_by_product[ $b->getProduct()->getGuid() ] ) )
					self::$productionbuildings_by_product[ $b->getProduct()->getGuid() ] = array();
				array_push( self::$productionbuildings_by_product[ $b->getProduct()->getGuid() ], $b );
			}
		}
		return self::$productionbuildings_by_product;
	}
	
	public static function getProducts() {
		if( empty(self::$products) )
			self::getProductsFromDb();
		return self::$products;
	}
	
	public static function getDemands( $population_key=null ) {
		$population_key = strtolower($population_key);
		if( empty(self::$demands) || ( !empty($population_key) && empty(self::$demands[$population_key]) ) )
			self::getDemandsFromDb($population_key);
		return self::$demands;
	}
	
	public static function getBuildingsFromDb() {
		self::getProducts();
		$sql = "SELECT o.*, b.* FROM game_buildings AS b, game_objects AS o WHERE b.object_guid NOT IN ( SELECT building_guid FROM game_productionbuildings ) AND o.guid=b.object_guid";
		self::$buildings = array();
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$building = new Building(
				(int) $row['guid'],
				$row['icon'],
				array(
					'en' => utf8_encode($row['local_en']),
					'de' => utf8_encode($row['local_de'])
				),
				(int) $row['buildcosts_credits'],
				null,
				array(
					'active_cost' => (int) $row['mc_active_cost'],
					'inactive_cost' => (int) $row['mc_inactive_cost'],
					'active_eco' => (int) $row['mc_active_eco'],
					'inactive_eco' => (int) $row['mc_inactive_eco'],
					'active_energy' => (int) $row['mc_active_energy'],
					'inactive_energy' => (int) $row['mc_inactive_energy']
				)
			);
			$sql2 = "SELECT * FROM game_buildcosts_products WHERE building_guid=".Database::_()->intPrep($building->getGuid())." ORDER BY product_guid ASC";
			$result2 = Database::_()->query($sql2);
			while( $result2 && $row2=$result2->fetch_assoc() ) {
				$product_guid = (int) $row2['product_guid'];
				if( isset( self::$products[$product_guid] ) )
					$building->setBuildcostsProduct( self::$products[$product_guid], (int) $row2['costs'] );
			}
			if( $building->isValid() )
				self::$buildings[ $building->getGuid() ] = $building;
		}
	}

	private static function getProductionBuildingsFromDb() {
		self::getProducts();
		$sql = "SELECT o.*, b.*, p.* FROM game_buildings AS b, game_objects AS o, game_productionbuildings AS p WHERE b.object_guid=p.building_guid AND o.guid=b.object_guid";
		self::$productionbuildings = array();
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$building = new ProductionBuilding(
				(int) $row['guid'],
				$row['icon'],
				array(
					'en' => utf8_encode($row['local_en']),
					'de' => utf8_encode($row['local_de'])
				),
				(int) $row['buildcosts_credits'],
				null,
				array(
					'active_cost' => (int) $row['mc_active_cost'],
					'inactive_cost' => (int) $row['mc_inactive_cost'],
					'active_eco' => (int) $row['mc_active_eco'],
					'inactive_eco' => (int) $row['mc_inactive_eco'],
					'active_energy' => (int) $row['mc_active_energy'],
					'inactive_energy' => (int) $row['mc_inactive_energy']
				),
				(int) $row['type'],
				isset( self::$products[ (int) $row['product_guid'] ] ) ? self::$products[ (int) $row['product_guid'] ] : null,
				(int) $row['production_time'],
				(int) $row['production_count'],
				isset( self::$products[ (int) $row['raw1_guid'] ] ) ? self::$products[ (int) $row['raw1_guid'] ] : null,
				(int) $row['raw1_need'],
				isset( self::$products[ (int) $row['raw2_guid'] ] ) ? self::$products[ (int) $row['raw2_guid'] ] : null,
				(int) $row['raw2_need']
			);
			$sql2 = "SELECT * FROM game_buildcosts_products WHERE building_guid=".Database::_()->intPrep($building->getGuid())." ORDER BY product_guid ASC";
			$result2 = Database::_()->query($sql2);
			while( $result2 && $row2=$result2->fetch_assoc() ) {
				$product_guid = (int) $row2['product_guid'];
				if( isset( self::$products[$product_guid] ) )
					$building->setBuildcostsProduct( self::$products[$product_guid], (int) $row2['costs'] );
			}
			if( $building->isValid() )
				self::$productionbuildings[ $building->getGuid() ] = $building;
		}
		
	}
	
	private static function getProductsFromDb() {
		$sql = "SELECT o.* FROM game_objects AS o, game_products AS p WHERE o.guid=p.object_guid";
		self::$products = array();
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$product = new GameObject(
				(int) $row['guid'],
				$row['icon'],
				array(
					'en' => utf8_encode($row['local_en']),
					'de' => utf8_encode($row['local_de'])
				)
			);
			if( $product->isValid() )
				self::$products[ $product->getGuid() ] = $product;
		}
	}
	
	private static function getDemandsFromDb() {
		self::getProducts();
		$sql = "SELECT * FROM game_demands ORDER BY product_guid ASC";
		$demands = array();
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() )
			$demands[ intval($row['product_guid']) ][ strtolower($row['level']) ] = intval($row['amount']);
		self::$demands = array();
		foreach( self::$demands_order as $d )
			if( isset($demands[$d]) )
				self::$demands[$d] = $demands[$d];
	}
	
	public static function compareLocals( $obj1, $obj2 ) {
		return strnatcasecmp( $obj1->getLocal(i18n::getLang()), $obj2->getLocal(i18n::getLang()) );
	}
	
	public static function getProductionBuilding( $guid ) {
		self::getProductionBuildings();
		return isset( self::$productionbuildings[$guid] ) ? self::$productionbuildings[$guid] : null;
	}

	public static function getProductionBuildingsForProduct( $guid ) {
		self::getProductionBuildingsByProduct();
		return isset( self::$productionbuildings_by_product[$guid] ) ? self::$productionbuildings_by_product[$guid] : array();
	}
	
	public static function getBuilding( $guid ) {
		self::getBuildings();
		return isset( self::$buildings[$guid] ) ? self::$buildings[$guid] : null;
	}
	
	public static function getProduct( $guid ) {
		self::getProducts();
		return isset( self::$products[$guid] ) ? self::$products[$guid] : null;
	}
	
	public static function getCommodityChain( $pb, $count=1, $target_tpm=null, $productivity=array(), $preferred=array() ) {
		$pb = is_a($pb,'ProductionBuilding') ? $pb : self::getProductionBuilding($pb);
		if( !$pb )
			return false;
		$count = intval($count);
		$pm = isset($productivity[$pb->getGuid()]) ? $productivity[$pb->getGuid()]/100 : 1;
		$target_tpm = $target_tpm===null ? $pb->getProductionTonsPerMinute()*$pm*$count : $target_tpm;
		$multiplier = $target_tpm / ($pb->getProductionTonsPerMinute()*$pm);
		$chain = array( 'x' => $multiplier, 't' => $target_tpm, 'p' => $pm, '_' => $pb, 'raw1' => array(), 'raw2' => array() );
		if( $pb->getRaw1() ) {
			$pbs = self::getProductionbuildingsForProduct( $pb->getRaw1()->getGuid() );
			foreach( $pbs as $i => $pref_pb )
				if( in_array($pref_pb->getGuid(),$preferred) ) {
					unset( $pbs[$i] );
					array_unshift($pbs,$pref_pb);
					break;
				}
			foreach( $pbs as $raw1_pb )
				array_push( $chain['raw1'], self::getCommodityChain( $raw1_pb->getGuid(), 1, $pb->getRaw1NeedTonsPerMinute()*$multiplier, $productivity, $preferred ) );
		}
		if( $pb->getRaw2() ) {
			$pbs = self::getProductionbuildingsForProduct( $pb->getRaw2()->getGuid() );
			foreach( $pbs as $i => $pref_pb )
				if( in_array($pref_pb->getGuid(),$preferred) ) {
					unset( $pbs[$i] );
					array_unshift($pbs,$pref_pb);
					break;
				}
			foreach( $pbs as $raw2_pb )
				array_push( $chain['raw2'], self::getCommodityChain( $raw2_pb->getGuid(), 1, $pb->getRaw2NeedTonsPerMinute()*$multiplier, $productivity, $preferred ) );
		}
		return $chain;
	}
	
	public static function drawCommodityChain( $chain, $first=true ) {
		$productions = '';
		$raws = '';
		$chain = $first ? array($chain) : $chain;
		foreach( $chain as $i => $c ) {
			$productions .= '<dd'.($i>0?' class="alt"':'').'>'.self::drawProduction($c['_'],$c['x'],$c['p'],$c['t']).'</dd>';
			if( !empty($c['raw1']) )
				$raws .= self::drawCommodityChain( $c['raw1'], false );
			if( !empty($c['raw2']) )
				$raws .= self::drawCommodityChain( $c['raw2'], false );
		}
		$html = '<div class="commodity-chain'.( !$first ? '-inner' : '' ).'">'
			.'<dl class="chain">'
			.'<dt><div class="product">'
			.'<span class="icon"><span style="background-image:url(\'img/icons/46/'.$chain[0]['_']->getProduct()->getIcon().'\');" title="'.$chain[0]['_']->getProduct()->getLocal().'"></span></span>';
			//.'<span class="tpm" title="'.i18n::__('Ist / Soll Tonnen pro Minute').'"><span class="actual">'.round( ( $chain[0]['_']->getProductionTonsPerMinute()*$chain[0]['p']*ceil($chain[0]['x']) ) ,1 ).'</span> / <span class="target">'.round( $chain[0]['t'], 1 ).'</span><span class="tpm_unit">tpm</span></span>'
		if( $chain[0]['_']->isEnergy() )
			$html .= '<span class="tpm" title="'.i18n::__('Energie').'"><span class="target">'.round( $chain[0]['t'], 1 ).'</span><span class="tpm_unit">'.i18n::__('Energie').'</span></span>';
		elseif( $chain[0]['_']->isEco() )
			$html .= '<span class="tpm" title="'.i18n::__('&Ouml;kobilanz').'"><span class="target">'.$chain[0]['t'].'</span><span class="tpm_unit">'.i18n::__('&Ouml;kobilanz').'</span></span>';
		else
			$html .= '<span class="tpm" title="'.i18n::__('Tonnen pro Minute').'"><span class="target">'.round( $chain[0]['t'], 1 ).'</span><span class="tpm_unit">tpm</span></span>';
		$html .= '</div></dt>'
			.$productions
			.'</dl>'
			.'<div class="clear"></div>'
			.$raws
			.'</div>';
		return $html;
	}
	
	public static function drawProduction( $pb, $multiplier=1, $productivity=1, $tpm=1 ) {
		$efficiency = round( ($multiplier/ceil($multiplier))*100 );
		if( $efficiency>80 )
			$efficiency_class = 'green';
		elseif( $efficiency>60 )
			$efficiency_class = 'lightgreen';
		elseif( $efficiency>40 )
			$efficiency_class = 'yellow';
		elseif( $efficiency>20 )
			$efficiency_class = 'orange';
		else
			$efficiency_class = 'red';
		$count = ceil($multiplier);
		$html = '<div class="production" data-guid="'.$pb->getGuid().'" data-count="'.$count.'" data-multiplier="'.str_replace(',','.',$multiplier).'" data-icon="'.$pb->getIcon().'" data-tpm="'.str_replace(',','.',$pb->getProductionTonsPerMinute()).'" data-tpm-needed="'.str_replace(',','.',$tpm).'">'
			.'<span class="alt-text">'.i18n::__('Alternatives Produktionsgebäude').'</span>'
			.'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.$pb->getIcon().'\');" title="'.$pb->getLocal().'"></span></span>'
			.'<span class="count">&times;'.$count.'</span>'
			.'<span class="name">'.$pb->getLocal().'</span>'
			.'<span class="efficiency '.$efficiency_class.'" title="'.i18n::__('Effizienz').'">'.$efficiency.'% <em>'.i18n::__('Effizienz').'</em></span>'
			.'<span class="productivity" title="'.i18n::__('max. Produktivit&auml;t').'">'
				.'<em>'.i18n::__('max. Produktivit&auml;t').'</em> '
				.'<input type="text" name="productivity_'.$pb->getGuid().'" value="'.round($productivity*100).'" /><span class="percent">%</span>'
				.'<div class="slider-container"><div class="slider"></div></div>'
			.'</span>'
			.'<ul class="build-costs">'
			.'<li class="credits" title="'.i18n::__('Credits').'">'.($pb->getBuildcostsCredits()*$count).'</li>';
		foreach( $pb->getBuildcostsProducts() as $c )
			$html .= '<li style="background-image:url(\'img/icons/16/'.$c[0]->getIcon().'\');" title="'.$c[0]->getLocal().'" data-guid="'.$c[0]->getGuid().'">'.(round($c[1]/1000)*$count).'</li>';
		$html .= '</ul>'
			.'<ul class="maintenance-costs">'
			.'<li class="credits" title="'.i18n::__('Bilanz').'">'.($pb->getMaintenanceCost('active_cost')<0?'+':'').($pb->getMaintenanceCost('active_cost')*$count*-1).' / '.($pb->getMaintenanceCost('inactive_cost')<0?'+':'').($pb->getMaintenanceCost('inactive_cost')*$count*-1).'</li>'
			.'<li class="energy" title="'.i18n::__('Energie').'">'.($pb->getMaintenanceCost('active_energy')<0?'+':'').round(($pb->getMaintenanceCost('active_energy')/4096)*$count*-1).' / '.($pb->getMaintenanceCost('inactive_energy')<0?'+':'').round(($pb->getMaintenanceCost('inactive_energy')/4096)*$count*-1).'</li>'
			.'<li class="eco" title="'.i18n::__('&Ouml;kobilanz').'">'.($pb->getMaintenanceCost('active_eco')>0?'+':'').round(($pb->getMaintenanceCost('active_eco')/4096)*$count).' / '.($pb->getMaintenanceCost('inactive_eco')>0?'+':'').round(($pb->getMaintenanceCost('inactive_eco')/4096)*$count).'</li>'
			.'</ul>'
			.'<div class="clear"></div>'
			.'</div>';
		return $html;
	}

	public static function drawBuilding( $b ) {
		$html = '<div class="building">'
			.'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.$b->getIcon().'\');" title="'.$b->getLocal().'"></span></span>'
			.'<span class="name">'.$b->getLocal().'</span>';
		if( is_a($b,'ProductionBuilding') )
			$html .= '<span class="details">'
				.i18n::__('produziert').' <a href="database'.(i18n::getLang()!='de'?'/'.i18n::getLang():'').'?product='.$b->getProduct()->getGuid().'">'.$b->getProduct()->getLocal().'</a>'
				.'</span><span class="details">'
				.'<a href="commoditychains'.(i18n::getLang()!='de'?'/'.i18n::getLang():'').'?pb_guid='.$b->getGuid().'">'.i18n::__('Produktionskette anzeigen').'</a><br/>'
				.'</span>';
		$html .= '<ul class="build-costs">'
			.'<li class="credits" title="'.i18n::__('Credits').'">'.$b->getBuildcostsCredits().'</li>';
		foreach( $b->getBuildcostsProducts() as $c )
			$html .= '<li style="background-image:url(\'img/icons/16/'.$c[0]->getIcon().'\');" title="'.$c[0]->getLocal().'" data-guid="'.$c[0]->getGuid().'">'.round($c[1]/1000).'</li>';
		$html .= '</ul>'
			.'<ul class="maintenance-costs">'
			.'<li class="credits" title="'.i18n::__('Bilanz').'">'.($b->getMaintenanceCost('active_cost')<0?'+':'').($b->getMaintenanceCost('active_cost')*-1).' / '.($b->getMaintenanceCost('inactive_cost')<0?'+':'').($b->getMaintenanceCost('inactive_cost')*-1).'</li>'
			.'<li class="energy" title="'.i18n::__('Energie').'">'.($b->getMaintenanceCost('active_energy')<0?'+':'').round(($b->getMaintenanceCost('active_energy')/4096)*-1).' / '.($b->getMaintenanceCost('inactive_energy')<0?'+':'').round(($b->getMaintenanceCost('inactive_energy')/4096)*-1).'</li>'
			.'<li class="eco" title="'.i18n::__('&Ouml;kobilanz').'">'.($b->getMaintenanceCost('active_eco')>0?'+':'').round($b->getMaintenanceCost('active_eco')/4096).' / '.($b->getMaintenanceCost('inactive_eco')>0?'+':'').round($b->getMaintenanceCost('inactive_eco')/4096).'</li>'
			.'</ul>'
			.'<div class="clear"></div>'
			.'</div>';
		return $html;
	}

	public static function drawProduct( $p ) {
		$pbs = self::getProductionBuildingsForProduct($p->getGuid());
		$html = '<div class="product">'
			.'<span class="name">'.$p->getLocal().'</span>'
			.'<span class="details">'.i18n::__('produziert von').' ';
		foreach( $pbs as $i => $pb )
			$html .= '<a href="database'.(i18n::getLang()!='de'?'/'.i18n::getLang():'').'?productionbuilding='.$pb->getGuid().'">'.$pb->getLocal().'</a>'
				.( $i<(count($pbs)-1) ? ', ' : '' );
		$html .= '</span>'
			.'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.$p->getIcon().'\');" title="'.$p->getLocal().'"></span></span>'
			.'<div class="clear"></div>'
			.'</div>';
		return $html;
	}

	
}

?>
