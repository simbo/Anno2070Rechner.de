<?php

if( isset($_POST['p_guid']) ) {
	$pb = GameData::getProductionBuildingsForProduct( intval($_POST['p_guid']) );
	$_POST['pb_guid'] = $pb[0]->getGuid();
	$_POST['productivity'] = 100;
}

if( isset($_POST['pb_guid']) && isset($_POST['tpm_needed']) && isset($_POST['productivity']) ) {

	$tpm_needed = floatval($_POST['tpm_needed']);
	$pb_guid = intval($_POST['pb_guid']);
	$productivity = array();
	if( isset($_POST['productivity']) && is_array($_POST['productivity']) )
		foreach($_POST['productivity'] as $i => $p)
			$productivity[$i] = intval($p);
	$preferred = array();
	if( isset($_POST['preferred']) && isset($_POST['preferred']) )
		foreach($_POST['preferred'] as $i => $p)
			$preferred[$i] = intval($p);

	$commodity_chain = GameData::getCommodityChain( $pb_guid, 1, $tpm_needed, $productivity, $preferred );

	$commodity_chain_html = GameData::drawCommodityChain( $commodity_chain );
	
	$json = array(
		'html' => $commodity_chain_html
	);
	$page->addContent($json);

}

?>
