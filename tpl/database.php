<?php

$result_productionbuildings = array();
$result_buildings = array();
$result_products = array();

if( isset($_REQUEST['search']) ) {

	$text = isset($_REQUEST['search']) && strlen($_REQUEST['search'])>=1 ? strtolower($_REQUEST['search']) : '';
	
	$text = str_replace('Ö','ö',$text);
	$text = str_replace('Ä','ä',$text);
	$text = str_replace('Ü','ü',$text);
	
	if( !empty($text) ) {
		$sql = "SELECT pb.building_guid,o.local_de FROM game_productionbuildings AS pb, game_objects AS o WHERE o.guid=pb.building_guid AND LCASE(o.local_".i18n::getLang().") LIKE BINARY ".Database::_()->strPrep('%'.$text.'%');
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$o = GameData::getProductionBuilding( intval($row['building_guid']) );
			if( !in_array($o,$result_productionbuildings) )
				array_push( $result_productionbuildings, $o );
		}
		$sql = "SELECT b.object_guid FROM game_buildings AS b, game_objects AS o WHERE b.object_guid NOT IN ( SELECT building_guid FROM game_productionbuildings ) AND o.guid=b.object_guid AND LCASE(o.local_".i18n::getLang().") LIKE BINARY ".Database::_()->strPrep('%'.$text.'%');
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$o = GameData::getBuilding( intval($row['object_guid']) );
			if( !in_array($o,$result_buildings) )
				array_push( $result_buildings, $o );
		}
		$sql = "SELECT p.object_guid FROM game_products AS p, game_objects AS o WHERE o.guid=p.object_guid AND LCASE(o.local_".i18n::getLang().") LIKE BINARY ".Database::_()->strPrep('%'.$text.'%');
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$o = GameData::getProduct( intval($row['object_guid']) );
			if( !in_array($o,$result_products) )
				array_push( $result_products, $o );
		}
	}

}

if( isset($_REQUEST['productionbuilding']) ) {
	if( $_REQUEST['productionbuilding']=='all' )
		$result_productionbuildings = GameData::getProductionBuildings();
	elseif( $_REQUEST['productionbuilding']=='factory' ) {
		foreach( GameData::getProductionBuildings() as $pb )
			if( $pb->isFactory() && !in_array($pb,$result_productionbuildings) )
				array_push($result_productionbuildings,$pb);
	}
	elseif( $_REQUEST['productionbuilding']=='farm' ) {
		foreach( GameData::getProductionBuildings() as $pb )
			if( $pb->isFarm() && !in_array($pb,$result_productionbuildings) )
				array_push($result_productionbuildings,$pb);
	}
	elseif( $_REQUEST['productionbuilding']=='energy' ) {
		foreach( GameData::getProductionBuildings() as $pb )
			if( $pb->isEnergy() && !in_array($pb,$result_productionbuildings) )
				array_push($result_productionbuildings,$pb);
	}
	elseif( $_REQUEST['productionbuilding']=='eco' ) {
		foreach( GameData::getProductionBuildings() as $pb )
			if( $pb->isEco() && !in_array($pb,$result_productionbuildings) )
				array_push($result_productionbuildings,$pb);
	}
	else {
		$o = GameData::getProductionBuilding( intval($_REQUEST['productionbuilding']) );
		if( $o && !in_array($o,$result_productionbuildings) )
			array_push($result_productionbuildings,$o);
	}
}

if( isset($_REQUEST['building']) ) {
	if( $_REQUEST['building']=='all' )
		$result_buildings = GameData::getBuildings();
	else {
		$o = GameData::getBuilding( intval($_REQUEST['building']) );
		if( $o && !in_array($o,$result_buildings) )
			array_push($result_buildings,$o);
	}
}

if( isset($_REQUEST['product']) ) {
	if( $_REQUEST['product']=='all' )
		$result_products = GameData::getProducts();
	else {
		$o = GameData::getProduct( intval($_REQUEST['product']) );
		if( $o && !in_array($o,$result_products) )
			array_push($result_products,$o);
	}
}

usort( $result_buildings, 'GameData::compareLocals' );
usort( $result_productionbuildings, 'GameData::compareLocals' );
usort( $result_products, 'GameData::compareLocals' );

$results = '';

if( !empty($result_productionbuildings) ) {
	$results .= '<h3>'.__('Produktionsgeb&auml;ude').'</h3>';
	foreach( $result_productionbuildings as $b )
		$results .= GameData::drawBuilding( $b );
	$results .= '<div class="clear"></div>';
}

if( !empty($result_buildings) ) {
	$results .= '<h3>'.__('Geb&auml;ude').'</h3>';
	foreach( $result_buildings as $b )
		$results .= GameData::drawBuilding( $b );
	$results .= '<div class="clear"></div>';
}

if( !empty($result_products) ) {
	$results .= '<h3>'.__('Waren').'</h3>';
	foreach( $result_products as $b )
		$results .= GameData::drawProduct( $b );
	$results .= '<div class="clear"></div>';
}

if( strtolower($_SERVER['REQUEST_METHOD'])=='post' && isset($_POST['ajax']) && $_POST['ajax']==1 ) {
	$json = array(
		'html' => $results
	);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();
}

$buildings = GameData::getBuildings();
$productionbuildings = GameData::getProductionBuildings();
$products = GameData::getProducts();

usort( $buildings, 'GameData::compareLocals' );
usort( $productionbuildings, 'GameData::compareLocals' );
usort( $products, 'GameData::compareLocals' );

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__('Datenbank').'</h2>',
	'<form id="'.$page->getIdSanitized().'-select-form" action="'.i18n::url($page->getId()).'" method="post" class="fright">',
		'<fieldset class="blue">',
			'<dl>',
				'<dt>',
					'<label>'.__('Produktionsgeb&auml;ude').'</label>',
				'</dt>',
				'<dd>',
					'<select name="productionbuilding" tabindex="4">',
						'<option value="">&mdash;</option>',
						'<option value="all">('.__('alle').')</option>',
						'<option value="factory">('.__('alle Fabriken').')</option>',
						'<option value="farm">('.__('alle Farmen').')</option>',
						'<option value="energy">('.__('alle Energie erzeugenden').')</option>',
						'<option value="eco">('.__('alle &Ouml;kobilanz erzeugenden').')</option>'
);
foreach( $productionbuildings as $b )
	$page->addContent(
						'<option value="'.$b->getGuid().'">'.$b->getLocal(i18n::getLang()).'</option>'
	);
$page->addContent(
					'</select>',
				'</dd>',
				'<dt>',
					'<label>'.__('Geb&auml;ude').'</label>',
				'</dt>',
				'<dd>',
					'<select name="building" tabindex="4">',
						'<option value="">&mdash;</option>',
						'<option value="all">('.__('alle').')</option>'
);
foreach( $buildings as $b )
	$page->addContent(
						'<option value="'.$b->getGuid().'">'.$b->getLocal(i18n::getLang()).'</option>'
	);
$page->addContent(
					'</select>',
				'</dd>',
				'<dt>',
					'<label>'.__('Waren').'</label>',
				'</dt>',
				'<dd>',
					'<select name="product" tabindex="4">',
						'<option value="">&mdash;</option>',
						'<option value="all">('.__('alle').')</option>'
);
foreach( $products as $b )
	$page->addContent(
						'<option value="'.$b->getGuid().'">'.$b->getLocal(i18n::getLang()).'</option>'
	);
$page->addContent(
					'</select>',
				'</dd>',
			'</dl>',
		'</fieldset>',
	'</form>',
	'<form id="'.$page->getIdSanitized().'-search-form" action="'.$page->getId().'" method="post">',
		'<fieldset class="blue">',
			'<dl>',
				'<dt>',
					'<label>'.__('Suche nach').'</label>',
				'</dt>',
				'<dd>',
					'<input type="text" name="search" value="'.( isset($_REQUEST['search']) ? $_REQUEST['search'] : '' ).'" tabindex="1" data-autocomplete="'.i18n::url('search-autocomplete').'" />',
				'</dd>',
				'<dd>',
					'<input type="submit" value="'.__('Suchen').'" tabindex="2" />',
				'</dd>',
			'</dl>',
		'</fieldset>',
	'</form>',
	'<div class="results">'.$results.'</div>'
);

?>
