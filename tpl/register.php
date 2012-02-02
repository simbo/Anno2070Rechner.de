<?php

if( isset($_GET['activate']) ) {

	$data = explode(':',base64_decode($_GET['activate']));
	
	$user_id = intval( isset($data[0]) ? $data[0] : 0 );
	$verification_key = isset($data[1]) ? $data[1] : '';

	$user = User::getById($user_id);
	
	if( $user && !$user->isActive() && $user->verificationKeyIsValid() && $user->getVerificationKey()==$verification_key ) {
		$user->activate();
		$user->save();
		$page->addContent(
			'<h2 class="happy">'.__('Aktivierung erfolgreich').'</h2>',
			'<p>'.__('Die Aktivierung des Benutzerkontos war erfolgreich.').'</p>',
			'<p><a href="'.i18n::url('login').'">'.__('zur Anmeldung').'</a></p>'
		);
	}
	elseif( $user && $user->isActive() ) {
		$page->addContent(
			'<h2 class="user">'.__('Aktivierung nicht m&ouml;glich').'</h2>',
			'<p>'.__('Das Benutzerkonto ist bereits aktiv.').'</p>'
		);
	}
	else {
		$page->addContent(
			'<h2 class="sad">'.__('Aktivierung fehlgeschlagen').'</h2>',
			'<p>'.__('Die Aktivierung des Benutzerkontos war nicht m&ouml;glich.').'</p>'
		);
	}

}
elseif( !$site->getOption('registrations') ) {

	$page->addContent(
		'<h2 class="'.$page->getIdSanitized().'">'.$page->getTitle().'</h2>',
		'<p>'.__('Neue Benutzerregistrierungen sind derzeit nicht m&ouml;glich.').'</p>'
	);


}
else {

	$errors = array();

	if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

		if( empty($_POST['login']) )
			$errors['login'] = __('Gib einen Benutzernamen ein');
		elseif( !User::isValidLogin($_POST['login']) )
			$errors['login'] = __('Ung&uuml;ltiger Benutzername');
		elseif( User::checkLoginExists($_POST['login']) )
			$errors['login'] = __('Benutzername bereits vergeben');
		
		if( empty($_POST['pwd']) )
			$errors['pwd'] = __('Gib ein Passwort ein');
		elseif( !User::isValidPassword($_POST['pwd']) )
			$errors['pwd'] = __('Mindestens 8 Zeichen');
		
		if( !empty($_POST['pwd']) && empty($_POST['pwd2']) )
			$errors['pwd2'] = __('Gib das Passwort nochmal ein');
		elseif( ( !empty($_POST['pwd']) || empty($_POST['pwd']) ) && $_POST['pwd']!=$_POST['pwd2'] )
			$errors['pwd2'] = __('Die Passw&ouml;rter stimmen nicht &uuml;berein');
		
		if( empty($_POST['email']) )
			$errors['email'] = __('Gib deine E-Mailadresse ein');
		elseif( !_::isValidEmail($_POST['email']) )
			$errors['email'] = __('Ung&uuml;ltige E-Mailadresse');
		elseif( User::checkEmailExists($_POST['email']) )
			$errors['email'] = __('E-Mailadresse bereits registriert');
		
		if( empty($_POST['recaptcha_response_field']) )
			$errors['recaptcha_response_field'] = __('Gib die beiden Worte im rechten Bild ein');
		elseif( !isset($_POST['live_validate']) ) {
			require_once ABSPATH.'inc/recaptchalib.php';
			$recaptcha_challenge = isset($_POST['recaptcha_challenge_field']) ? $_POST['recaptcha_challenge_field'] : '';
			$recaptcha_response = isset($_POST['recaptcha_response_field']) ? $_POST['recaptcha_response_field'] : '';
			$recaptcha = recaptcha_check_answer( $site->getOption('recaptcha_private'), $_SERVER['REMOTE_ADDR'], $recaptcha_challenge, $recaptcha_response );
			if( !$recaptcha->is_valid )
				$errors['recaptcha_response_field'] = __('Deine Eingabe war nicht korrekt');
		}
		
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
		
			$success_msg = '';
		
			if( empty($errors) ) {
				$user = User::create( $_POST['login'], $_POST['pwd'], $_POST['email'] );
				$from = $site->getOption('title').' <'.$site->getOption('email').'>';
				$to = $_POST['login'].' <'.$_POST['email'].'>';
				$subject = __('Benutzerkonto aktivieren');
				$msg = "\n".sprintf( __('Für die E-Mailadresse %s wurde ein Benutzerkonto auf "%s" erstellt.'), $user->getEmail(), i18n::url($site->getOption('title')) )."\n"
					."\n".__('Öffne die folgende URL in deinem Browser, um die E-Mailadresse zu bestätigen und das Benutzerkonto zu aktivieren.')."\n"
					."\n".i18n::url( _::eslash($site->getOption('url')).$page->getId().'?activate='.base64_encode($user->getId().':'.$user->getVerificationKey()) )."\n";
				_::sendEmail( $to, $from, $subject, $msg );
				$success_msg = sprintf( __('Es wurde eine E-Mail an <em>%s</em> gesendet um die E-Mailadresse zu best&auml;tigen und das Benutzerkonto zu aktivieren.'), $user->getEmail() );
			}
		
			if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
				$json = array(
					'success' => empty($errors) ? true : false,
					'errors' => $errors,
					'success_msg' => $success_msg
				);
				$page->clearContent();
				$page->setType('json');
				$page->addContent($json);
				$site->output();
			}
		}

	}

	$page->addContent(
		'<h2 class="'.$page->getIdSanitized().'">'.__('Registrieren').'</h2>',
		'<div class="fright">',
			'<p>'.__('Als angemeldeter Benutzer kannst du die eingegebenen Daten deiner Spiele speichern und jederzeit wieder aufrufen.').'</p>',
			'<p>'.__('Deine E-Mailadresse wird zur Freischaltung des Benutzerkontos ben&ouml;tigt und f&uuml;r den Fall, dass Du deine Zugangsdaten vergessen hast.').'</p>',
			'<p>'.__('Deine pers&ouml;nlichen Daten werden nicht an Dritte weitergegeben und du wirst von dieser Website keinen Spam erhalten.').'</p>',
			'<div class="recaptcha_image_holder"><a href="#" title="'.__('Neues Bild laden').'" id="recaptcha_image" title="" tabindex="7"></a></div>',
		'</div>',
		'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url($page->getId()).'" method="post">',
			'<fieldset class="blue">'
	);
	if( isset($success_msg) && $success_msg )
		$page->addContent( '<p>'.$success_msg.'</p>' );
	else
		$page->addContent(
				'<dl>',
					'<dt>',
						'<label>'.__('Benutzername').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" class="'.( isset($_POST['login']) ? ( isset($errors['login']) ? ' invalid' : ' valid' ) : '' ).'" name="login" value="'.( isset($_POST['login']) ? $_POST['login'] : '' ).'" tabindex="1" placeholder="'.__('mind. 3 Zeichen').'" />',
						'<span class="error">'.( isset($errors['login']) ? $errors['login'] : '' ).'</span>',
					'</dd>',
					'<dt>',
						'<label>'.__('Passwort').'</label>',
					'</dt>',
					'<dd>',
						'<input type="password" class="'.( isset($_POST['pwd']) ? ( isset($errors['pwd']) ? ' invalid' : ' valid' ) : '' ).'" name="pwd" value="" tabindex="2" placeholder="'.__('mind. 8 Zeichen').'" />',
						'<span class="error">'.( isset($errors['pwd']) ? $errors['pwd'] : '' ).'</span>',
					'</dd>',
					'<dd>',
						'<input type="password" class="'.( isset($_POST['pwd2']) ? ( isset($errors['pwd2']) ? ' invalid' : ( !empty($_POST['pwd2']) ? ' valid' : '' ) ) : '' ).'" name="pwd2" value="" tabindex="3" placeholder="'.__('Passwort wiederholen').'" />',
						'<span class="error">'.( isset($errors['pwd2']) ? $errors['pwd2'] : '' ).'</span>',
					'</dd>',
					'<dt>',
						'<label>'.__('E-Mail').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" class="'.( isset($_POST['email']) ? ( isset($errors['email']) ? ' invalid' : ' valid' ) : '' ).'" name="email" value="'.( isset($_POST['email']) ? $_POST['email'] : '' ).'" tabindex="4" placeholder="'.__('g&uuml;ltige E-mailadresse').'" />',
						'<span class="error">'.( isset($errors['email']) ? $errors['email'] : '' ).'</span>',
					'</dd>',
					'<dt>',
						'<label>'.__('Captcha').'</label>',
					'</dt>',
					'<dd>',
						'<span id="recaptcha_challenge_field_holder" style="display: none;"></span>',
						'<input type="text" class="'.( isset($_POST['recaptcha_response_field']) ? ( isset($errors['recaptcha_response_field']) ? ' invalid' : ' valid' ) : '' ).'" name="recaptcha_response_field" id="recaptcha_response_field" value="" tabindex="5" placeholder="'.__('zwei Worte im rechten Bild').'" />',
						'<span class="error">'.( isset($errors['recaptcha_response_field']) ? $errors['recaptcha_response_field'] : '' ).'</span>',
					'</dd>',
					'<dd>',
						'<input type="submit" value="'.__('Registrieren').'" tabindex="6" />',
					'</dd>',
				'</dl>'
		);
	$page->addContent(
			'</fieldset>',
		'</form>',
		'<div class="clear"></div>',
		'<script type="text/javascript" src="https://www.google.com/recaptcha/api/js/recaptcha_ajax.js"></script>',
		'<script type="text/javascript">/* <![CDATA[ */ var recaptcha_public_key=\''.$site->getOption('recaptcha_public').'\';/* ]]> */</script>'
	);

}

?>
