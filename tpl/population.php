<?php

$value_keys = array(
	'ecos0r','ecos1r','ecos2r','ecos3r','ecos4r','ecos-ls','tycoons0r','tycoons1r','tycoons2r','tycoons3r','tycoons4r','tycoons-ls','techs0r','techs1r','techs2r','techs-ls',
	'ecos0i','ecos1i','ecos2i','ecos3i','ecos4i','tycoons0i','tycoons1i','tycoons2i','tycoons3i','tycoons4i','techs0i','techs1i','techs2i',
	'show-residences','show-inhabitants','show-demands','show-production'
);

$values = array();
foreach( $value_keys as $k ) {
	switch( $k ) {
		case 'show-residences':
		case 'show-inhabitants':
		case 'show-demands':
		case 'show-production':
			$v = isset($_POST[$k]) ? intval($_POST[$k]) : 1;
			break;
		default:
			$v = isset($_POST[$k]) ? intval($_POST[$k]) : 0;
			break;
	}
	$values[$k] = $v;
}

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

foreach($inhabitants as $l => $c)
	$inhabitants[$l] = isset($values[$l.'i']) ? intval($values[$l.'i']) : 0;

$all_demands = GameData::getDemands();
$demands = array();
$productions = array();
foreach( $all_demands as $p => $d ) {
	$demands[$p] = 0;
	foreach( $d as $l => $a ) {
		if( $inhabitants[$l]>0 )
			$demands[$p] += $inhabitants[$l]/100 * $a/1000;
	}
	$pb = GameData::getProductionBuildingsForProduct($p);
	$pb = $pb[0];
	$productions[$pb->getGuid()] = $demands[$p]/$pb->getProductionTonsPerMinute();
}


if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
	$json = array(
		'success' => true,
		'demands' => $demands,
		'productions' => $productions
	);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();
}

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__($page->getTitle()).'</h2>',
	'<form id="'.$page->getIdSanitized().'-form" method="post" action="'.i18n::url($page->getId()).'">',
		'<fieldset class="blue" id="residences-fieldset">',
			'<legend>'.__('Wohnh&auml;user').'</legend>',
			'<dl class="ecos">',
				'<dt class="ecos0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0">',
					'<input type="text" name="ecos0r" value="'.$values['ecos0r'].'" tabindex="1" />',
					'<div class="slider"></div>',
					'<input type="hidden" name="ecos-max-upgrade" value="4" />',
				'</dd>',
				'<dt class="ecos1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="ecos1"><input type="text" name="ecos1r" value="'.$values['ecos1r'].'" tabindex="2" /></dd>',
				'<dt class="ecos2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="ecos2"><input type="text" name="ecos2r" value="'.$values['ecos2r'].'" tabindex="3" /></dd>',
				'<dt class="ecos3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="ecos3"><input type="text" name="ecos3r" value="'.$values['ecos3r'].'" tabindex="4" /></dd>',
				'<dt class="ecos4"><label>'.__('Executives').'</label></dt>',
				'<dd class="ecos4"><input type="text" name="ecos4r" value="'.$values['ecos4r'].'" tabindex="5" /></dd>',
				'<dt class="ecos-ls"><label>'.__('+12% Wohnraum').'</label></dt>',
				'<dd class="ecos-ls"><input type="checkbox" name="ecos-ls" value="1"'.($values['ecos-ls']==1?' checked="checked"':'').' tabindex="6" /></dd>',
			'</dl><dl class="tycoons">',
				'<dt class="tycoons0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="tycoons0">',
					'<input type="text" name="tycoons0i" value="'.$values['tycoons0r'].'" tabindex="7" />',
					'<div class="slider"></div>',
					'<input type="hidden" name="tycoons-max-upgrade" value="4" />',
				'</dd>',
				'<dt class="tycoons1"><label>'.__('Arbeiter').'</label></dt>',
				'<dd class="tycoons1"><input type="text" name="tycoons1r" value="'.$values['tycoons1r'].'" tabindex="8" /></dd>',
				'<dt class="tycoons2"><label>'.__('Angestellte').'</label></dt>',
				'<dd class="tycoons2"><input type="text" name="tycoons2r" value="'.$values['tycoons2r'].'" tabindex="9" /></dd>',
				'<dt class="tycoons3"><label>'.__('Ingenieure').'</label></dt>',
				'<dd class="tycoons3"><input type="text" name="tycoons3r" value="'.$values['tycoons3r'].'" tabindex="10" /></dd>',
				'<dt class="tycoons4"><label>'.__('Executives').'</label></dt>',
				'<dd class="tycoons4"><input type="text" name="tycoons4r" value="'.$values['tycoons4r'].'" tabindex="11" /></dd>',
				'<dt class="tycoons-ls"><label>'.__('+12% Wohnraum').'</label></dt>',
				'<dd class="tycoons-ls"><input type="checkbox" name="tycoons-ls" value="1"'.($values['tycoons-ls']==1?' checked="checked"':'').' tabindex="12" /></dd>',
			'</dl><dl class="techs">',
				'<dt class="techs0"><label>'.__('insgesamt').'</label></dt>',
				'<dd class="ecos0">',
					'<input type="text" name="techs0i" value="'.$values['techs0r'].'" tabindex="13" />',
					'<div class="slider"></div>',
					'<input type="hidden" name="techs-max-upgrade" value="2" />',
				'</dd>',
				'<dt class="techs1"><label>'.__('Laborgehilfen').'</label></dt>',
				'<dd class="techs1"><input type="text" name="techs1r" value="'.$values['techs1r'].'" tabindex="14" /></dd>',
				'<dt class="techs2"><label>'.__('Forscher').'</label></dt>',
				'<dd class="techs2"><input type="text" name="techs2r" value="'.$values['techs2r'].'" tabindex="15" /></dd>',
				'<dt class="techs-ls"><label>'.__('+12% Wohnraum').'</label></dt>',
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
				'<li class="'.($demands[$product_guid]>0?'':'no-demand').'" data-guid="'.$product_guid.'" data-tpm="'.$demands[$product_guid].'">',
					'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.GameData::getProduct($product_guid)->getIcon().'" title="'.GameData::getProduct($product_guid)->getLocal().'"></span></span>',
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
			'<legend>'.__('Produktionsbetriebe').'</legend>',
			'<ol>'
);
foreach( $productions as $production_guid => $count ) {
	$pb = GameData::getProductionBuilding($production_guid);
	$c = $i==1 ? 'ecos' : ( $i==8 ? 'tycoons' : ( $i==15 ? 'techs' : false) ) ;
	$page->addContent(
				( $c ? '</ol><ol class="'.$c.'">' : '' ),
				'<li class="'.($count>0?'':'no-demand').'" data-guid="'.$pb->getGuid().'" data-tpm="'.$pb->getProductionTonsPerMinute().'" data-tpm-needed="'.$demands[$pb->getProduct()->getGuid()].'">',
					'<span class="icon-32"><span style="background-image:url(\'img/icons/32/'.$pb->getIcon().'" title="'.$pb->getLocal().'"></span></span>',
					'<span class="productivity"></span>',
					'<span class="count">'.($productions[$pb->getGuid()]>0?round($productions[$pb->getGuid()],1):'').'</span>',
				'</li>'
	);
}
$page->addContent(			
			'</ol>',
			'<a href="#" class="display-hide"></a>',
			'<div class="clear"></div>',
		'</fieldset>',
		'<fieldset id="hidden-fieldset">',
			'<input type="hidden" name="show-residences" value="1" />',
			'<input type="hidden" name="show-inhabitants" value="1" />',
			'<input type="hidden" name="show-demands" value="1" />',
			'<input type="hidden" name="show-production" value="1" />',
		'</fieldset>',
	'</form>',
	'<ul id="display-options">',
		'<li><a href="#" class="show-residences active" title="'.__('Wohnh&auml;user anzeigen').'"></a></li>',
		'<li><a href="#" class="show-inhabitants active" title="'.__('Einwohner anzeigen').'"></a></li>',
		'<li><a href="#" class="show-demands active" title="'.__('Bed&uuml;rfnisse anzeigen').'"></a></li>',
		'<li><a href="#" class="show-production active" title="'.__('Produktionsbetriebe anzeigen').'"></a></li>',
	'</ul>'
);

?>
