<?php

if( isset($_POST['pb_guid']) && $pb = GameData::getProductionBuilding(intval($_POST['pb_guid'])) ) {

	$count = isset($_POST['count']) ? intval($_POST['count']) : 1;

	$tpm_needed = isset($_POST['tpm_needed']) ? floatval(preg_replace('/,/','.',$_POST['tpm_needed'])) : 0;

	$tpm_needed = $tpm_needed>0 ? $tpm_needed :  ( $pb->getProductionTonsPerMinute() * $count );

	$productivity = array();
	if( isset($_POST['productivity']) && is_array($_POST['productivity']) )
		foreach($_POST['productivity'] as $i => $p)
			$productivity[$i] = intval($p);

	$preferred = array();
	if( isset($_POST['preferred']) && is_array($_POST['preferred']) )
		foreach($_POST['preferred'] as $i => $p)
			$preferred[$i] = intval($p);

	$commodity_chain = GameData::getCommodityChain( $pb, 1, $tpm_needed, $productivity, $preferred );

	$commodity_chain_html = GameData::drawCommodityChain( $commodity_chain );
	
	$json = array(
		'html' => $commodity_chain_html
	);
	$page->addContent($json);

}

?>
