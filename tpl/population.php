<?php

$value_keys = array(
	'ecos0r','ecos1r','ecos2r','ecos3r','ecos4r','ecos_info',
	'tycoons0r','tycoons1r','tycoons2r','tycoons3r','tycoons4r','tycoons_info',
	'techs0r','techs1r','techs2r','techs_info',
	'ecos0i','ecos1i','ecos2i','ecos3i','ecos4i',
	'tycoons0i','tycoons1i','tycoons2i','tycoons3i','tycoons4i',
	'techs0i','techs1i','techs2i',
	'ecos_max_upgrade','tycoons_max_upgrade','techs_max_upgrade',
	'show_residences','show_inhabitants','show_demands','show_production',
	'productivity_10045','productivity_10046','productivity_10048','productivity_10152','productivity_10156','productivity_10158','productivity_10159','productivity_10163','productivity_10168','productivity_10176','productivity_10180','productivity_10185','productivity_10186','productivity_10187','productivity_10191','productivity_10194','productivity_10197'
);

$data = null;

$cookie_name = 'a2070r_popcalc';
$data = isset( $_COOKIE[$cookie_name] ) ? explode('.',$_COOKIE[$cookie_name]) : array();

$values = array();
foreach( $value_keys as $i => $k ) {
	switch( $k ) {
		case substr($k,0,12)=='productivity':
			$default_value = 100;
			break;
		case 'ecos_max_upgrade':
		case 'tycoons_max_upgrade':
			$default_value = 4;
			break;
		case 'techs_max_upgrade':
			$default_value = 2;
			break;
		case 'show_residences':
//		case 'show_inhabitants':
//		case 'show_demands':
		case 'show_production':
			$default_value = 1;
			break;
		default:
			$default_value = 0;
			break;
	}
	$values[$k] = strtolower($_SERVER['REQUEST_METHOD'])=='post' ? ( isset($_POST[$k]) ? intval($_POST[$k]) : $default_value ) : ( isset($data[$i]) ? intval($data[$i]) : $default_value );
}

_::setCookie( 'a2070r_popcalc', implode('.',$values), 90 );

if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
	$json = array('success' => $values);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();
}

$all_demands = GameData::getDemands();
$productions_by_product = array();
$productions = array();

foreach( $all_demands as $product_guid => $demand ) {
	$production_building = GameData::getProductionBuildingsForProduct($product_guid);
	$production_building = $production_building[0];
	$productions[$production_building->getGuid()] = $production_building;
	$productions_by_product[$product_guid] = array(
		'guid' => $production_building->getGuid(),
		'tpm' => $production_building->getProductionTonsPerMinute()
	);
}

$tabindex = 1;

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__('Bev&ouml;lkerung').'</h2>',
	'<form id="'.$page->getIdSanitized().'-form" method="post" action="'.i18n::url($page->getId()).'">',
		'<fieldset class="blue'.($values['show_residences']>0?'':' hidden').'" id="residences-fieldset">',
			'<legend>'.__('Wohnh&auml;user').'</legend>',
			'<dl class="ecos">',
				'<dt class="ecos0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0">',
					'<input type="text" name="ecos0r" value="'.$values['ecos0r'].'" value="'.$values['ecos0r'].'" autocomplete="off" tabindex="'.($tabindex++).'" />',
					'<div class="slider" data-tabindex="'.($tabindex++).'"></div>',
					'<input type="hidden" name="ecos_max_upgrade" value="'.$values['ecos_max_upgrade'].'" />',
				'</dd>',
				'<dt class="ecos1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="ecos1"><input type="text" name="ecos1r" value="'.$values['ecos1r'].'" data-value="'.$values['ecos1r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="ecos2"><input type="text" name="ecos2r" value="'.$values['ecos2r'].'" data-value="'.$values['ecos2r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="ecos3"><input type="text" name="ecos3r" value="'.$values['ecos3r'].'" data-value="'.$values['ecos3r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos4"><label>'.__('Executives').'</label></dt>',
				'<dd class="ecos4"><input type="text" name="ecos4r" value="'.$values['ecos4r'].'" data-value="'.$values['ecos4r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos_info"><label>'.__('Information').'</label></dt>',
				'<dd class="ecos_info info_channel">',
					'<a href="#" id="ecos_info_1" class="'.($values['ecos_info']==1?'active':'').'" data-value="1" title="+12% '.__('Wohnraum').'"></a>',
					'<a href="#" id="ecos_info_2" class="'.($values['ecos_info']==2?'active':'').'" data-value="2" title="-15% '.__('Bedarf nach Lifestyleprodukten').'"></a>',
					'<input type="hidden" name="ecos_info" value="'.$values['ecos_info'].'" tabindex="'.($tabindex++).'" />',
				'</dd>',
			'</dl><dl class="tycoons">',
				'<dt class="tycoons0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="tycoons0">',
					'<input type="text" name="tycoons0r" value="'.$values['tycoons0r'].'" tabindex="'.($tabindex++).'" />',
					'<div class="slider" data-tabindex="'.($tabindex++).'"></div>',
					'<input type="hidden" name="tycoons_max_upgrade" value="'.$values['tycoons_max_upgrade'].'" />',
				'</dd>',
				'<dt class="tycoons1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="tycoons1"><input type="text" name="tycoons1r" value="'.$values['tycoons1r'].'" data-value="'.$values['tycoons1r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="tycoons2"><input type="text" name="tycoons2r" value="'.$values['tycoons2r'].'" data-value="'.$values['tycoons2r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="tycoons3"><input type="text" name="tycoons3r" value="'.$values['tycoons3r'].'" data-value="'.$values['tycoons3r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons4"><label>'.__('Executives').'</label></dt>',
				'<dd class="tycoons4"><input type="text" name="tycoons4r" value="'.$values['tycoons4r'].'" data-value="'.$values['tycoons4r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons_info"><label>'.__('Information').'</label></dt>',
				'<dd class="tycoons_info info_channel">',
					'<a href="#" id="tycoons_info_1" class="'.($values['tycoons_info']==1?' active':'').'" data-value="1" title="+12% '.__('Wohnraum').'"></a>',
					'<input type="hidden" name="tycoons_info" value="'.$values['tycoons_info'].'" tabindex="'.($tabindex++).'" />',
				'</dd>',
			'</dl><dl class="techs">',
				'<dt class="techs0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="techs0">',
					'<input type="text" name="techs0r" value="'.$values['techs0r'].'" tabindex="'.($tabindex++).'" />',
					'<div class="slider" data-tabindex="'.($tabindex++).'"></div>',
					'<input type="hidden" name="techs_max_upgrade" value="'.$values['techs_max_upgrade'].'" />',
				'</dd>',
				'<dt class="techs1"><label>'.__('Laborgehilfen').'</label></dt>',
				'<dd class="techs1"><input type="text" name="techs1r" value="'.$values['techs1r'].'" data-value="'.$values['techs1r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="techs2"><label>'.__('Forscher').'</label></dt>',
				'<dd class="techs2"><input type="text" name="techs2r" value="'.$values['techs2r'].'" data-value="'.$values['techs2r'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="techs_info"><label>'.__('Information').'</label></dt>',
				'<dd class="techs_info info_channel">',
					'<a href="#" id="techs_info_1" class="'.($values['techs_info']==1?' active':'').'" data-value="1" title="+12% '.__('Wohnraum').'"></a>',
					'<input type="hidden" name="techs_info" value="'.$values['techs_info'].'" tabindex="'.($tabindex++).'" />',
				'</dd>',
			'</dl>',
			'<a href="#" class="display-hide"></a>',
			'<input type="button" class="reset" value="'.__('Zur&uuml;cksetzen').'" />',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset class="blue'.($values['show_inhabitants']>0?'':' hidden').'" id="inhabitants-fieldset">',
			'<legend>'.__('Einwohner').'</legend>',
			'<dl class="ecos">',
				'<dt class="ecos1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="ecos1"><input type="text" name="ecos1i" value="'.$values['ecos1i'].'" data-value="'.$values['ecos1i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="ecos2"><input type="text" name="ecos2i" value="'.$values['ecos2i'].'" data-value="'.$values['ecos2i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="ecos3"><input type="text" name="ecos3i" value="'.$values['ecos3i'].'" data-value="'.$values['ecos3i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos4"><label>'.__('Executives').'</label></dt>',
				'<dd class="ecos4"><input type="text" name="ecos4i" value="'.$values['ecos4i'].'" data-value="'.$values['ecos4i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="ecos0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0"><input type="text" name="ecos0i" value="'.$values['ecos0i'].'" readonly="readonly" /></dd>',
			'</dl><dl class="tycoons">',
				'<dt class="tycoons1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="tycoons1"><input type="text" name="tycoons1i" value="'.$values['tycoons1i'].'" data-value="'.$values['tycoons1i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="tycoons2"><input type="text" name="tycoons2i" value="'.$values['tycoons2i'].'" data-value="'.$values['tycoons2i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="tycoons3"><input type="text" name="tycoons3i" value="'.$values['tycoons3i'].'" data-value="'.$values['tycoons3i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons4"><label>'.__('Executives').'</label></dt>',
				'<dd class="tycoons4"><input type="text" name="tycoons4i" value="'.$values['tycoons4i'].'" data-value="'.$values['tycoons4i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="tycoons0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="tycoons0"><input type="text" name="tycoons0i" value="'.$values['tycoons0i'].'" readonly="readonly" /></dd>',
			'</dl><dl class="techs">',
				'<dt class="techs1"><label>'.__('Laborgehilfen').'</label></dt>',
				'<dd class="techs1"><input type="text" name="techs1i" value="'.$values['techs1i'].'" data-value="'.$values['techs1i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="techs2"><label>'.__('Forscher').'</label></dt>',
				'<dd class="techs2"><input type="text" name="techs2i" value="'.$values['techs2i'].'" data-value="'.$values['techs2i'].'" autocomplete="off" tabindex="'.($tabindex++).'" /></dd>',
				'<dt class="techs0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="techs0"><input type="text" name="techs0i" value="'.$values['techs0i'].'" readonly="readonly" /></dd>',
			'</dl>',
			'<a href="#" class="display-hide"></a>',
			'<input type="button" class="reset" value="'.__('Zur&uuml;cksetzen').'" />',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset class="blue'.($values['show_demands']>0?'':' hidden').'" id="demands-fieldset">',
			'<legend>'.__('Bed&uuml;rfnisse').'<span>('.__('Tonnen pro Minute').')</span></legend>',
			'<ol>'
);
$i = 0;
foreach( $all_demands as $product_guid => $demand ) {
	$c = $i==1 ? 'ecos' : ( $i==8 ? 'tycoons' : ( $i==15 ? 'techs' : false) ) ;
	$page->addContent(
				( $c ? '</ol><ol class="'.$c.'">' : '' ),
				'<li class="no-demand" data-guid="'.$product_guid.'">',
					'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.GameData::getProduct($product_guid)->getIcon().'\')" title="'.GameData::getProduct($product_guid)->getLocal().'"></span></span>',
					'<span class="count">0</span>',
				'</li>'
	);
	$i++;
}
$page->addContent(			
			'</ol>',
			'<a href="#" class="display-hide"></a>',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset class="blue'.($values['show_production']>0?'':' hidden').'" id="production-fieldset">',
			'<legend>'.__('Produktionsgeb&auml;ude').'</legend>',
#			'<dl>',
#				'<dt class="set_productivity"><label>'.__('Produktivit&auml;t').'</label></dt>',
#				'<dd class="set_productivity"><input type="text" name="set_productivity" value="100" tabindex="'.($tabindex++).'" /></dd>',
#			'</dl>',
			'<ol>'
);
$i = 0;
foreach( $productions as $production_guid => $count ) {
	$pb = GameData::getProductionBuilding($production_guid);
	$c = $i==1 ? 'ecos' : ( $i==8 ? 'tycoons' : ( $i==15 ? 'techs' : false) ) ;
	$page->addContent(
				( $c ? '</ol><ol class="'.$c.'">' : '' ),
				'<li class="no-demand" data-guid="'.$pb->getGuid().'" data-product-guid="'.$pb->getProduct()->getGuid().'">',
					'<span class="productivity" title="'.__('max. Produktivit&auml;t').'">',
						'<input type="text" name="productivity_'.$pb->getGuid().'" value="'.$values['productivity_'.$pb->getGuid()].'" /><span class="percent">%</span>',
						'<div class="slider-container hide"><div class="slider"></div></div>',
					'</span>',
					'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.$pb->getIcon().'\')" title="'.$pb->getLocal().'"></span></span>',
					'<span class="count" title="'.__('Anzahl der Produktionsgeb&auml;ude').'">&times;<span>0</span></span>',
					'<span class="efficiency" title="'.__('Effizienz').'">0%</span>',
				'</li>'
	);
	$i++;
}
$page->addContent(			
			'</ol>',
			'<a href="#" class="display-hide"></a>',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset id="hidden-fieldset">',
			'<input type="hidden" name="show_residences" value="'.$values['show_residences'].'" />',
			'<input type="hidden" name="show_inhabitants" value="'.$values['show_inhabitants'].'" />',
			'<input type="hidden" name="show_demands" value="'.$values['show_demands'].'" />',
			'<input type="hidden" name="show_production" value="'.$values['show_production'].'" />',
		'</fieldset>',
	'</form>',
	'<div id="commodity-chain-container"></div>',
	'<ul id="display-options">',
		'<li><a href="#" class="show_residences'.($values['show_residences']>0?' active':'').'" title="'.__('Wohnh&auml;user anzeigen').'"></a></li>',
		'<li><a href="#" class="show_inhabitants'.($values['show_inhabitants']>0?' active':'').'" title="'.__('Einwohner anzeigen').'"></a></li>',
		'<li><a href="#" class="show_demands'.($values['show_demands']>0?' active':'').'" title="'.__('Bed&uuml;rfnisse anzeigen').'"></a></li>',
		'<li><a href="#" class="show_production'.($values['show_production']>0?' active':'').'" title="'.__('Produktionsbetriebe anzeigen').'"></a></li>',
	'</ul>'
);

?>
