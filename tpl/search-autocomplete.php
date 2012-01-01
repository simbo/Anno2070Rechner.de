<?php

	$json = array();
	$json['results'] = array();
	
	$text = isset($_REQUEST['text']) && strlen($_REQUEST['text'])>=1 ? strtolower($_REQUEST['text']) : null;
	
	$text = str_replace('Ö','ö',$text);
	$text = str_replace('Ä','ä',$text);
	$text = str_replace('Ü','ü',$text);
	
	if( !empty($text) ) {
		$sql = "SELECT local_".i18n::getLang()." FROM game_objects WHERE LCASE(local_".i18n::getLang().") LIKE BINARY ".Database::_()->strPrep($text.'%');
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$str = utf8_encode($row['local_'.i18n::getLang()]);
			if( !in_array($str,$json['results']) )
				array_push( $json['results'], $str );
		}
		usort( $json['results'], 'strnatcasecmp' );

	}

	$page->addContent($json);

?>
