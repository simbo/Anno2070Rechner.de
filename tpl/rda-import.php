<?php

$json = array(
	'success' => false,
	'msg' => ''
);

if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

	if( GameData::readFromXml() && GameData::saveToDb() ) {
		$json['success'] = true;
		$json['msg'] = __('Daten erfolgreich importiert.').'<br/><br/>'
			.sprintf( __('%d Objekte in der Datenbank'), GameData::countObjects() ).'<br/>'
			.sprintf( __('%d Waren, %d Geb&auml;ude (davon %d Produktionsgeb&auml;ude)'), GameData::countProducts(), GameData::countBuildings(), GameData::countProductionBuildings() );
	}
	else
		$json['msg'] = __('Daten konnten nicht importiert werden.');

	if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
		$page->clearContent();
		$page->setType('json');
		$page->addContent($json);
		$site->output();
	}
	
}	

$page->addContent(
	'<h2 class="rda-import">'.__($page->getTitle()).'</h2>',
	'<ul class="checklist">'
);

$all_r = true;
foreach( GameData::getSrc() as $f ) {
	$r = _::isReadableFile(ABSPATH.$f['file']);
	$page->addContent(
		'<li class="'.( $r ? 'valid': 'invalid' ).'">',
			'<code>'.$f['rda_path'].'</code>',
			( !$r ? '<br/><small><strong>'.__('Datei nicht lesbar').':</strong> '.ABSPATH.$f['file'].'</small>' :'' ),
		'</li>'
	);
	if( !$r )
		$all_r = false;
}

$page->addContent(
	'</ul>',
	'<p>'.( !$all_r ? __('Eine oder mehrere Dateien sind nicht vorhanden oder nicht lesbar.') : __('Alle Dateien sind lesbar.') ).'</p>',
	'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url($page->getIdSanitized()).'" method="post">',
		'<fieldset class="buttons">',
			'<input type="submit" value="'.__('Daten importieren').'" />',
		'</fieldset>',
	'</form>',
	'<p id="response">'.( !empty($json['msg']) ? $json['msg'] : '' ).'</p>'
);

?>
