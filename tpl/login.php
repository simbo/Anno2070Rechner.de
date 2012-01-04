<?php

$errors = array();

if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

	if( empty($_POST['login']) )
		$errors['login'] = __('Gib deinen Benutzernamen ein');
	elseif( !User::isValidLogin($_POST['login']) )
		$errors['login'] = __('Ung&uuml;ltiger Benutzername');
	elseif( !$user = User::getByLogin($_POST['login']) )
		$errors['login'] = __('Benutzername existiert nicht');
	elseif( User::checkLoginPassword($user,$_POST['pwd']) && !$user->isActive() )
		$errors['login'] = __('Benutzerkonto ist nicht aktiviert');
	
	
	if( empty($_POST['pwd']) )
		$errors['pwd'] = __('Gib dein Passwort ein');
	elseif( !User::isValidPassword($_POST['pwd']) )
		$errors['pwd'] = __('Ung&uuml;ltiges Passwort');
	elseif( $user && !User::checkLoginPassword($user,$_POST['pwd']) )
		$errors['pwd'] = __('Falsches Passwort');
	
	if( isset($_POST['live_validate']) ) {
		$json = array(
			'valid' => isset($errors[$_POST['live_validate']]) ? false : true,
			'error' =>isset($errors[$_POST['live_validate']]) ? $errors[$_POST['live_validate']] : ''
		);
		$page->clearContent();
		$page->setType('json');
		$page->addContent($json);
		$site->output();
	}
	else {
	
		$hint = '<dd class="hint"><small>'
			.( isset($user) && User::checkLoginPassword($user,$_POST['pwd']) && !$user->isActive() ?
				'<a href="resend-activation">'.__('Benutzerkonto aktivieren').'</a>'
			:
				'<a href="password-lost">'.__('Zugangsdaten vergessen?').'</a>'
			)
			.'</small></dd>';

		$cookie = isset($_POST['cookie']) && intval($_POST['cookie'])==1 ? true : false;
	
		if( empty($errors) && $user ) {
			$user->auth();
			if( $cookie )
				$user->setLoginCookie();
		}
	
		$success_msg = __('Anmeldung erfolgreich');
		$redirect_to = i18n::url(BASEURL);

		if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
			$json = array(
				'success' => empty($errors) ? true : false,
				'errors' => $errors,
				'redirect_to' => $redirect_to,
				'hint' => $hint
			);
			$page->clearContent();
			$page->setType('json');
			$page->addContent($json);
			$site->output();
		}
		
	}

}

$page->addContent(
	'<h2 class="'.$page->getIdSanitized().'">'.__('Anmelden').'</h2>',
		'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url($page->getId()).'" method="post">',
			'<fieldset class="blue">'
);
if( empty($errors) && isset($success_msg) )
	$page->addContent(
		'<p>'.$success_msg.'</p>',
		'<p><a href="'.$redirect_to.'">'.__('zur Startseite').'</a></p>'
	);
else
	$page->addContent(
				'<dl>',
					'<dt>',
						'<label>'.__('Benutzername').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" class="first-focus'.( isset($_POST['login']) ? ( isset($errors['login']) ? ' invalid' : ' valid' ) : '' ).'" name="login" value="'.( isset($_POST['login']) ? $_POST['login'] : '' ).'" tabindex="1" />',
						'<span class="error">'.( isset($errors['login']) ? $errors['login'] : '' ).'</span>',
					'</dd>',
					'<dt>',
						'<label>'.__('Passwort').'</label>',
					'</dt>',
					'<dd>',
						'<input type="password" class="'.( isset($_POST['pwd']) ? ( isset($errors['pwd']) ? ' invalid' : ' valid' ) : '' ).'" name="pwd" value="" tabindex="2" />',
						'<span class="error">'.( isset($errors['pwd']) ? $errors['pwd'] : '' ).'</span>',
					'</dd>',
					'<dt>',
						'<label>'.__('angemeldet bleiben').'</label>',
					'</dt>',
					'<dd>',
						'<input type="checkbox" name="cookie" value="1" tabindex="3" />',
					'</dd>',
					'<dd>',
						'<input type="submit" value="'.__('Anmelden').'" tabindex="4" />',
					'</dd>',
					( isset($hint) ? $hint : '' ),
				'</dl>'
	);
$page->addContent(
		'</fieldset>',
	'</form>'
);

?>
