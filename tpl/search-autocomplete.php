<?php

	$json = array();
	$json['results'] = array();

	$searchtype = isset($_REQUEST['type']) ? $_REQUEST['type'] : '';
	
	$text = isset($_REQUEST['text']) && strlen($_REQUEST['text'])>=1 ? strtolower($_REQUEST['text']) : null;
	
	$text = str_replace('Ö','ö',$text);
	$text = str_replace('Ä','ä',$text);
	$text = str_replace('Ü','ü',$text);
	
	if( !empty($text) ) {
		if( $searchtype=='production' ) {
			$sql = "SELECT o.guid,o.local_".i18n::getLang().",pb.building_guid,pb.product_guid FROM game_objects AS o, game_productionbuildings AS pb WHERE ( o.guid=pb.building_guid OR o.guid=pb.product_guid ) AND LCASE(local_".i18n::getLang().") LIKE BINARY ".Database::_()->strPrep($text.'%');
			$result = Database::_()->query($sql);
			while( $result && $row=$result->fetch_assoc() ) {
				$str = utf8_encode($row['local_'.i18n::getLang()]);
				$guid = intval($row['guid']);
				if( GameData::getProduct($guid) ) {
					foreach( GameData::getProductionBuildingsForProduct( $guid ) as $pb )
						if( !isset($json['results'][$pb->getGuid()]) )
							$json['results'][$pb->getGuid()] = array( $pb->getLocal(), $pb->getGuid() );
				}
				elseif( !isset($json['results'][$guid]) )
					$json['results'][$guid] = array( $str, $guid );
			}
			usort( $json['results'], function($a,$b){
				return strnatcasecmp($a[0],$b[0]);
			});
		}
		else {
			$sql = "SELECT local_".i18n::getLang()." FROM game_objects WHERE LCASE(local_".i18n::getLang().") LIKE BINARY ".Database::_()->strPrep($text.'%');
			$result = Database::_()->query($sql);
			while( $result && $row=$result->fetch_assoc() ) {
				$str = utf8_encode($row['local_'.i18n::getLang()]);
				if( !in_array($str,$json['results']) )
					array_push( $json['results'], $str );
			}
			usort( $json['results'], 'strnatcasecmp' );
		}
	}

	$page->addContent($json);

?>
