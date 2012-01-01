<?php

$success = User::logout() ? true : false;
$redirect_to = i18n::url(BASEURL);

if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
	$json = array(
		'success' => $success,
		'redirect_to' => $redirect_to
	);
	$page->clearContent();
	$page->setType('json');
	$page->addContent($json);
	$site->output();
}

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__($page->getTitle()).'</h2>'
);

if( $success )
	$page->addContent(
		'<p>'.__('Abmeldung erfolgreich').'</p>',
		'<p><a href="'.$redirect_to.'">'.__('zur Startseite').'</a></p>'		
	);
else
	$page->addContent(
		'<p>'.__('Abmeldung fehlgeschlagen').'</p>'
	);

?>
