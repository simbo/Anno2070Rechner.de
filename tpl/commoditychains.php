<?php

$productionbuilding_guid = isset($_REQUEST['productionbuilding']) ? intval($_REQUEST['productionbuilding']) : 0;

$productionbuilding = GameData::getProductionBuilding($productionbuilding_guid);

$count = isset($_REQUEST['count']) ? intval($_REQUEST['count']) : 0;

$count = max(1,$count);

if( $productionbuilding ) {

	$target_tpm = $productionbuilding->getProductionTonsPerMinute()*$count;

	$commodity_chain = GameData::getCommodityChain( $productionbuilding->getGuid(), $count );

	$commodity_chain_html = $productionbuilding ? GameData::drawCommodityChain( $commodity_chain ) : '';

}

if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
	$json = array(
		'success' => $productionbuilding ? true : false,
		'html' => isset( $commodity_chain_html ) ? $commodity_chain_html : ''
	);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();
}

$productionbuildings = GameData::getProductionBuildings();

usort( $productionbuildings, 'GameData::compareLocals' );

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__('Produktionsketten').'</h2>',
	'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url($page->getId()).'" method="get">',
		'<fieldset class="blue">',
			'<dl>',
				'<dt>',
					'<label>'.__('Produktionsgeb&auml;ude').'</label>',
				'</dt>',
				'<dd>',
					'<select name="productionbuilding" tabindex="1" class="full">'
);
foreach( $productionbuildings as $b )
	if( $b->getRaw1() || $b->getRaw2() )
		$page->addContent(
						'<option value="'.$b->getGuid().'"'.( $productionbuilding_guid==$b->getGuid() ? ' selected="selected"' : '' ).'>'.$b->getLocal(i18n::getShort()).'</option>'
		);
$page->addContent(
						'<option value="">&mdash;</option>'
);
foreach( $productionbuildings as $b )
	if( !$b->getRaw1() && !$b->getRaw2() )
		$page->addContent(
						'<option value="'.$b->getGuid().'"'.( $productionbuilding_guid==$b->getGuid() ? ' selected="selected"' : '' ).'>'.$b->getLocal(i18n::getShort()).'</option>'
		);
$page->addContent(
					'</select>',
				'</dd>',
				'<dt>',
					'<label>'.__('Anzahl').'</label>',
				'</dt>',
				'<dd>',
					'<input type="text" class="full" name="count" value="'.$count.'" tabindex="2" />',
				'</dd>',
				'<dd>',
					'<input type="submit" value="'.__('Berechnen').'" tabindex="3" class="full" />',
				'</dd>',
			'</dl>',
		'</fieldset>',
	'</form>',
	'<div id="commodity-chain-container">'.( $productionbuilding ? $commodity_chain_html : '' ).'</div>',
	'<div class="clear"></div>'
);

?>
