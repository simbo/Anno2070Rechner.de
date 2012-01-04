<?php

if( isset($_POST['p_guid']) ) {
	$pb = GameData::getProductionBuildingsForProduct( intval($_POST['p_guid']) );
	$_POST['pb_guid'] = $pb[0]->getGuid();
	$_POST['productivity'] = 100;
}

if( isset($_POST['pb_guid']) && isset($_POST['tpm_needed']) && isset($_POST['productivity']) ) {

	$tpm_needed = floatval($_POST['tpm_needed']);
	$pb_guid = intval($_POST['pb_guid']);
	foreach($_POST['productivity'] as $i => $p)
		$productivity[$i] = intval($p);

	$commodity_chain = GameData::getCommodityChain( $pb_guid, 1, $tpm_needed, $productivity );

	$commodity_chain_html = GameData::drawCommodityChain( $commodity_chain );
	
	$json = array(
		'html' => $commodity_chain_html
	);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();

}

$value_keys = array(
	'ecos0r','ecos1r','ecos2r','ecos3r','ecos4r','ecos-ls',
	'tycoons0r','tycoons1r','tycoons2r','tycoons3r','tycoons4r','tycoons-ls',
	'techs0r','techs1r','techs2r','techs-ls',
	'ecos0i','ecos1i','ecos2i','ecos3i','ecos4i',
	'tycoons0i','tycoons1i','tycoons2i','tycoons3i','tycoons4i',
	'techs0i','techs1i','techs2i',
	'ecos-max-upgrade','tycoons-max-upgrade','techs-max-upgrade',
	'show-residences','show-inhabitants','show-demands','show-production',
	'productivity_10045','productivity_10046','productivity_10048','productivity_10152','productivity_10156','productivity_10158','productivity_10159','productivity_10163','productivity_10168','productivity_10176','productivity_10180','productivity_10185','productivity_10186','productivity_10187','productivity_10191','productivity_10194','productivity_10197'
);

$inhabitants = array(
	'ecos1' => 0,
	'ecos2' => 0,
	'ecos3' => 0,
	'ecos4' => 0,
	'tycoons1' => 0,
	'tycoons2' => 0,
	'tycoons3' => 0,
	'tycoons4' => 0,
	'techs1' => 0,
	'techs2' => 0
);

$data = null;

if( User::isLoggedIn() ) {
	$cookie_name = 'a2r'.User::_()->getId().'popcalc';
	$data = isset( $_COOKIE[$cookie_name] ) ? explode('.',$_COOKIE[$cookie_name]) : array();
}

if( empty($data) ) {
	$cookie_name = 'a2r0popcalc';
	$data = isset( $_COOKIE[$cookie_name] ) ? explode('.',$_COOKIE[$cookie_name]) : array();
}

$values = array();
foreach( $value_keys as $i => $k ) {
	switch( $k ) {
		case substr($k,0,12)=='productivity':
			$default_value = 100;
			break;
		case 'ecos-max-upgrade':
		case 'tycoons-max-upgrade':
			$default_value = 4;
			break;
		case 'techs-max-upgrade':
			$default_value = 2;
			break;
		case 'show-inhabitants':
		case 'show-production':
			$default_value = 1;
			break;
		default:
			$default_value = 0;
			break;
	}
	$values[$k] = isset($_POST[$k]) ? intval($_POST[$k]) : ( isset($data[$i]) ? intval($data[$i]) : $default_value );
}

_::setCookie( 'a2r'.( User::isLoggedIn() ? User::_()->getId() : 0 ).'popcalc', implode('.',$values), 90 );

foreach($inhabitants as $l => $c)
	$inhabitants[$l] = isset($values[$l.'i']) ? intval($values[$l.'i']) : 0;

$all_demands = GameData::getDemands();
$demands = array();
$productions = array();
$productivity = array();
foreach( $all_demands as $p => $d ) {
	$demands[$p] = 0;
	foreach( $d as $l => $a ) {
		if( $inhabitants[$l]>0 )
			$demands[$p] += $inhabitants[$l]/100 * $a/1000;
	}
	$pb = GameData::getProductionBuildingsForProduct($p);
	$pb = $pb[0];
	$productivity[$pb->getGuid()] = $values['productivity_'.$pb->getGuid()];
	$productions[$pb->getGuid()] = $demands[$p]/($pb->getProductionTonsPerMinute()*$productivity[$pb->getGuid()]/100);
}

if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
	$json = array(
		'success' => true,
		'demands' => $demands,
		'productions' => $productions,
		'productivity' => $productivity
	);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();
}

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__('Bev&ouml;lkerung').'</h2>',
	'<form id="'.$page->getIdSanitized().'-form" method="post" action="'.i18n::url($page->getId()).'">',
		'<fieldset class="blue" id="residences-fieldset">',
			'<legend>'.__('Wohnh&auml;user').'</legend>',
			'<dl class="ecos">',
				'<dt class="ecos0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0">',
					'<input type="text" name="ecos0r" value="'.$values['ecos0r'].'" tabindex="1" />',
					'<div class="slider"></div>',
					'<input type="hidden" name="ecos-max-upgrade" value="'.$values['ecos-max-upgrade'].'" />',
				'</dd>',
				'<dt class="ecos1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="ecos1"><input type="text" name="ecos1r" value="'.$values['ecos1r'].'" tabindex="2" /></dd>',
				'<dt class="ecos2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="ecos2"><input type="text" name="ecos2r" value="'.$values['ecos2r'].'" tabindex="3" /></dd>',
				'<dt class="ecos3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="ecos3"><input type="text" name="ecos3r" value="'.$values['ecos3r'].'" tabindex="4" /></dd>',
				'<dt class="ecos4"><label>'.__('Executives').'</label></dt>',
				'<dd class="ecos4"><input type="text" name="ecos4r" value="'.$values['ecos4r'].'" tabindex="5" /></dd>',
				'<dt class="ecos-ls"><label>+12% '.__('Wohnraum').'</label></dt>',
				'<dd class="ecos-ls"><input type="checkbox" name="ecos-ls" value="1"'.($values['ecos-ls']==1?' checked="checked"':'').' tabindex="6" /></dd>',
			'</dl><dl class="tycoons">',
				'<dt class="tycoons0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="tycoons0">',
					'<input type="text" name="tycoons0r" value="'.$values['tycoons0r'].'" tabindex="7" />',
					'<div class="slider"></div>',
					'<input type="hidden" name="tycoons-max-upgrade" value="'.$values['tycoons-max-upgrade'].'" />',
				'</dd>',
				'<dt class="tycoons1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="tycoons1"><input type="text" name="tycoons1r" value="'.$values['tycoons1r'].'" tabindex="8" /></dd>',
				'<dt class="tycoons2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="tycoons2"><input type="text" name="tycoons2r" value="'.$values['tycoons2r'].'" tabindex="9" /></dd>',
				'<dt class="tycoons3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="tycoons3"><input type="text" name="tycoons3r" value="'.$values['tycoons3r'].'" tabindex="10" /></dd>',
				'<dt class="tycoons4"><label>'.__('Executives').'</label></dt>',
				'<dd class="tycoons4"><input type="text" name="tycoons4r" value="'.$values['tycoons4r'].'" tabindex="11" /></dd>',
				'<dt class="tycoons-ls"><label>+12% '.__('Wohnraum').'</label></dt>',
				'<dd class="tycoons-ls"><input type="checkbox" name="tycoons-ls" value="1"'.($values['tycoons-ls']==1?' checked="checked"':'').' tabindex="12" /></dd>',
			'</dl><dl class="techs">',
				'<dt class="techs0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0">',
					'<input type="text" name="techs0r" value="'.$values['techs0r'].'" tabindex="13" />',
					'<div class="slider"></div>',
					'<input type="hidden" name="techs-max-upgrade" value="'.$values['techs-max-upgrade'].'" />',
				'</dd>',
				'<dt class="techs1"><label>'.__('Laborgehilfen').'</label></dt>',
				'<dd class="techs1"><input type="text" name="techs1r" value="'.$values['techs1r'].'" tabindex="14" /></dd>',
				'<dt class="techs2"><label>'.__('Forscher').'</label></dt>',
				'<dd class="techs2"><input type="text" name="techs2r" value="'.$values['techs2r'].'" tabindex="15" /></dd>',
				'<dt class="techs-ls"><label>+12% '.__('Wohnraum').'</label></dt>',
				'<dd class="techs-ls"><input type="checkbox" name="techs-ls" value="1"'.($values['techs-ls']==1?' checked="checked"':'').' tabindex="16" /></dd>',
			'</dl>',
			'<a href="#" class="display-hide"></a>',
			'<input type="submit" value="'.__('Berechnen').'" />',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset class="blue" id="inhabitants-fieldset">',
			'<legend>'.__('Einwohner').'</legend>',
			'<dl class="ecos">',
				'<dt class="ecos1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="ecos1"><input type="text" name="ecos1i" value="'.$values['ecos1i'].'" tabindex="17" /></dd>',
				'<dt class="ecos2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="ecos2"><input type="text" name="ecos2i" value="'.$values['ecos2i'].'" tabindex="18" /></dd>',
				'<dt class="ecos3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="ecos3"><input type="text" name="ecos3i" value="'.$values['ecos3i'].'" tabindex="19" /></dd>',
				'<dt class="ecos4"><label>'.__('Executives').'</label></dt>',
				'<dd class="ecos4"><input type="text" name="ecos4i" value="'.$values['ecos4i'].'" tabindex="20" /></dd>',
				'<dt class="ecos0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0"><input type="text" name="ecos0i" value="'.$values['ecos0i'].'" readonly="readonly" /></dd>',
			'</dl><dl class="tycoons">',
				'<dt class="tycoons1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="tycoons1"><input type="text" name="tycoons1i" value="'.$values['tycoons1i'].'" tabindex="21" /></dd>',
				'<dt class="tycoons2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="tycoons2"><input type="text" name="tycoons2i" value="'.$values['tycoons2i'].'" tabindex="22" /></dd>',
				'<dt class="tycoons3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="tycoons3"><input type="text" name="tycoons3i" value="'.$values['tycoons3i'].'" tabindex="23" /></dd>',
				'<dt class="tycoons4"><label class="tycoons4">'.__('Executives').'</label></dt>',
				'<dd class="tycoons4"><input type="text" name="tycoons4i" value="'.$values['tycoons4i'].'" tabindex="24" /></dd>',
				'<dt class="tycoons0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="tycoons0"><input type="text" name="tycoons0i" value="'.$values['tycoons0i'].'" readonly="readonly" /></dd>',
			'</dl><dl class="techs">',
				'<dt class="techs1"><label>'.__('Laborgehilfen').'</label></dt>',
				'<dd class="techs1"><input type="text" name="techs1i" value="'.$values['tycoons1i'].'" tabindex="25" /></dd>',
				'<dt class="techs2"><label>'.__('Forscher').'</label></dt>',
				'<dd class="techs2"><input type="text" name="techs2i" value="'.$values['tycoons2i'].'" tabindex="26" /></dd>',
				'<dt class="techs0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="techs0"><input type="text" name="techs0i" value="'.$values['tycoons0i'].'" readonly="readonly" /></dd>',
			'</dl>',
			'<a href="#" class="display-hide"></a>',
			'<input type="submit" value="'.__('Berechnen').'" />',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset class="blue" id="demands-fieldset">',
			'<legend>'.__('Bed&uuml;rfnisse').'<span>('.__('Tonnen pro Minute').')</span></legend>',
			'<ol>'
);
$i = 0;
foreach( $demands as $product_guid => $demand ) {
	$c = $i==1 ? 'ecos' : ( $i==8 ? 'tycoons' : ( $i==15 ? 'techs' : false) ) ;
	$page->addContent(
				( $c ? '</ol><ol class="'.$c.'">' : '' ),
				'<li class="'.($demands[$product_guid]>0?'':'no-demand').'" data-guid="'.$product_guid.'" data-tpm-needed="'.str_replace(',','.',$demands[$product_guid]).'">',
					'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.GameData::getProduct($product_guid)->getIcon().'\')" title="'.GameData::getProduct($product_guid)->getLocal().'"></span></span>',
					'<span class="count">'.($demands[$product_guid]>0?round($demands[$product_guid],1):'').'</span>',
				'</li>'
	);
	$i++;
}
$page->addContent(			
			'</ol>',
			'<a href="#" class="display-hide"></a>',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset class="blue" id="production-fieldset">',
			'<legend>'.__('Produktionsgeb&auml;ude').'</legend>',
			'<ol>'
);
$i = 0;
foreach( $productions as $production_guid => $count ) {
	$pb = GameData::getProductionBuilding($production_guid);
	$c = $i==1 ? 'ecos' : ( $i==8 ? 'tycoons' : ( $i==15 ? 'techs' : false) ) ;
	$page->addContent(
				( $c ? '</ol><ol class="'.$c.'">' : '' ),
				'<li class="production '.($count>0?'':'no-demand').'" data-guid="'.$pb->getGuid().'" data-tpm="'.str_replace(',','.',$pb->getProductionTonsPerMinute()).'" data-tpm-needed="'.str_replace(',','.',$demands[$pb->getProduct()->getGuid()]).'">',
					'<span class="productivity" title="'.__('max. Produktivit&auml;t').'">',
						'<span>'.( $count>0 ? $values['productivity_'.$pb->getGuid()].'%' : '' ).'</span>',
						'<div class="slider-container"><div class="slider"></div></div>',
						'<input type="hidden" name="productivity_'.$pb->getGuid().'" value="'.$values['productivity_'.$pb->getGuid()].'" />',
					'</span>',
					'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.$pb->getIcon().'\')" title="'.$pb->getLocal().'"></span></span>',
					'<span class="count">'.($productions[$pb->getGuid()]>0?round($productions[$pb->getGuid()],1):'').'</span>',
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
			'<input type="hidden" name="show-residences" value="'.$values['show-residences'].'" />',
			'<input type="hidden" name="show-inhabitants" value="'.$values['show-inhabitants'].'" />',
			'<input type="hidden" name="show-demands" value="'.$values['show-demands'].'" />',
			'<input type="hidden" name="show-production" value="'.$values['show-production'].'" />',
		'</fieldset>',
	'</form>',
	'<div id="commodity-chain-container"></div>',
	'<ul id="display-options">',
		'<li><a href="#" class="show-residences'.($values['show-residences']>0?' active':'').'" title="'.__('Wohnh&auml;user anzeigen').'"></a></li>',
		'<li><a href="#" class="show-inhabitants'.($values['show-inhabitants']>0?' active':'').'" title="'.__('Einwohner anzeigen').'"></a></li>',
		'<li><a href="#" class="show-demands'.($values['show-demands']>0?' active':'').'" title="'.__('Bed&uuml;rfnisse anzeigen').'"></a></li>',
		'<li><a href="#" class="show-production'.($values['show-production']>0?' active':'').'" title="'.__('Produktionsbetriebe anzeigen').'"></a></li>',
	'</ul>'
);

?>
