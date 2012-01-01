<?php

if( isset($_REQUEST['search']) ) {

	$text = isset($_REQUEST['text']) && strlen($_REQUEST['text'])>=1 ? strtolower($_REQUEST['text']) : null;
	
	$text = str_replace('Ö','ö',$text);
	$text = str_replace('Ä','ä',$text);
	$text = str_replace('Ü','ü',$text);
	
	$buildings = array();
	$productionbuildings = array();
	$products = array();
	
	if( !empty($text) ) {
		$sql = "SELECT o.local_".i18n::getLang()." FROM game_objects WHERE LCASE(local_de) LIKE BINARY ".Database::_()->strPrep($text.'%');
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			array_push( $buildings, utf8_encode($row['local_'.i18n::getLang()]) );
		}
		usort( $json['results'], 'strnatcasecmp' );
	}

}
else {
	
}

$buildings = GameData::getBuildings();
$productionbuildings = GameData::getProductionBuildings();
$products = GameData::getProducts();

usort( $buildings, 'GameData::compareLocals' );
usort( $productionbuildings, 'GameData::compareLocals' );
usort( $products, 'GameData::compareLocals' );

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__($page->getTitle()).'</h2>',
	'<form id="'.$page->getIdSanitized().'-select-form" action="'.i18n::url($page->getId()).'" method="post" class="fright">',
		'<fieldset class="blue">',
			'<dl>',
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
					'<input type="text" name="search" value="" tabindex="1" data-autocomplete="'.i18n::url('search-autocomplete').'" />',
				'</dd>',
				'<dd>',
					'<input type="submit" value="'.__('Suchen').'" tabindex="2" />',
				'</dd>',
			'</dl>',
		'</fieldset>',
	'</form>',
	'<div class="results">'
);
$page->addContent(		
	'</div>'
);

?>
