<?php

$productionbuilding_guid = isset($_REQUEST['pb_guid']) ? intval($_REQUEST['pb_guid']) : 0;

$count = isset($_REQUEST['count']) ? intval($_REQUEST['count']) : 0;

$count = max(1,$count);

$tpm_needed = isset($_REQUEST['target_tpm']) ? floatval(preg_replace('/,/','.',$_REQUEST['target_tpm'])) : '';

$productionbuildings = GameData::getProductionBuildings();

usort( $productionbuildings, 'GameData::compareLocals' );

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__('Produktionsketten').'</h2>',
	'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url('get-commoditychain').'" method="post">',
		'<fieldset class="blue">',
			'<dl>',
				'<dt>',
					'<label>'.__('Suche').'</label>',
				'</dt>',
				'<dd>',
					'<input type="text" name="search" value="" tabindex="1" data-guid="" data-autocomplete="'.i18n::url('search-autocomplete').'" placeholder="'.__('Geb&auml;ude oder Ware').'" />',
				'</dd>',
				'<dt>',
					'<label>'.__('Produktionsgeb&auml;ude').'</label>',
				'</dt>',
				'<dd>',
					'<select name="pb_guid" tabindex="1" class="full">'
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
				'<dt>',
					'<label title="'.__('Sollproduktion in Tonnen pro Minute').'">'.__('Soll TPM').'</label>',
				'</dt>',
				'<dd>',
					'<input type="text" class="full" name="tpm_needed" value="'.$tpm_needed.'" tabindex="2" placeholder="('.__('automatisch').')" />',
				'</dd>',
				'<dd>',
					'<input type="submit" value="'.__('Berechnen').'" tabindex="3" class="full" />',
				'</dd>',
			'</dl>',
		'</fieldset>',
	'</form>',
	'<div id="commodity-chain-container"></div>',
	'<div class="clear"></div>'
);

?>
