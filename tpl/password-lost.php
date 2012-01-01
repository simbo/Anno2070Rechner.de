<?php

$approve = isset($_POST['approve']) ? $_POST['approve'] : ( isset($_GET['approve']) ? $_GET['approve'] : false);

if( $approve ) {

	$data = explode(':',base64_decode($approve));

	$user_id = intval( isset($data[0]) ? $data[0] : 0 );
	$verification_key = isset($data[1]) ? $data[1] : '';

	$user = User::getById($user_id);

}

if( isset($user) && $user && $user->verificationKeyIsValid() && $user->getVerificationKey()==$verification_key ) {

	$errors = array();

	if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

		if( empty($_POST['pwd']) )
			$errors['pwd'] = __('Gib ein Passwort ein');
		elseif( !User::isValidPassword($_POST['pwd']) )
			$errors['pwd'] = __('Mindestens 8 Zeichen');
		
		if( !empty($_POST['pwd']) && empty($_POST['pwd2']) )
			$errors['pwd2'] = __('Gib das Passwort nochmal ein');
		elseif( ( !empty($_POST['pwd']) || empty($_POST['pwd']) ) && $_POST['pwd']!=$_POST['pwd2'] )
			$errors['pwd2'] = __('Die Passw&ouml;rter stimmen nicht &uuml;berein');

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
			
			$success_msg = false;
					
			if( empty($errors) && $user ) {
				$user->setPassword($_POST['pwd']);
				$user->unsetVerificationKey();
				$user->save();
				$success_msg = __('Dein Passwort wurde ge&auml;ndert.')
					.'<br/><br/><a href="'.i18n::url('login').'">'.__('zur Anmeldung').'</a></p>';
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
		'<h2 class="user">'.__($page->getTitle()).'</h2>',
		'<form id="'.$page->getIdSanitized().'-change-form" action="'.i18n::url($page->getId()).'" method="post">',
			'<fieldset class="blue">'
	);
	if( isset($success_msg) && $success_msg )
		$page->addContent( $success_msg );
	else
		$page->addContent(
				'<input type="hidden" name="approve" value="'.$approve.'" />',
				'<dl>',
					'<dt>',
						'<label>'.__('Benutzername').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" readonly="readonly" value="'.$user->getLogin().'" />',
					'</dd>',
					'<dt>',
						'<label>'.__('Neues Passwort').'</label>',
					'</dt>',
					'<dd>',
						'<input type="password" class="'.( isset($_POST['pwd']) ? ( isset($errors['pwd']) ? ' invalid' : ' valid' ) : '' ).'" name="pwd" value="" tabindex="1" placeholder="'.__('mind. 8 Zeichen').'" />',
						'<span class="error">'.( isset($errors['pwd']) ? $errors['pwd'] : '' ).'</span>',
					'</dd>',
					'<dd>',
						'<input type="password" class="'.( isset($_POST['pwd2']) ? ( isset($errors['pwd2']) ? ' invalid' : ( !empty($_POST['pwd2']) ? ' valid' : '' ) ) : '' ).'" name="pwd2" value="" tabindex="2" placeholder="'.__('Passwort wiederholen').'" />',
						'<span class="error">'.( isset($errors['pwd2']) ? $errors['pwd2'] : '' ).'</span>',
					'</dd>',
					'<dd>',
						'<input type="submit" value="'.__('&Auml;ndern').'" tabindex="3" />',
					'</dd>',
				'</dl>'
		);
	$page->addContent(
			'</fieldset>',
		'</form>'
	);
	
}
else {

	$errors = array();

	if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

		if( empty($_POST['email']) )
			$errors['email'] = __('Gib deine E-Mailadresse ein');
		elseif( !_::isValidEmail($_POST['email']) )
			$errors['email'] = __('Ung&uuml;ltige E-Mailadresse');
		elseif( !$user = User::getByEmail($_POST['email']) )
			$errors['email'] = __('E-Mailadresse nicht registriert');

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
			
			$success_msg = false;
					
			if( empty($errors) && $user ) {
				$user->setVerificationKey();
				$user->save();
				$from = $site->getOption('title').' <'.$site->getOption('email').'>';
				$to = $user->getLogin().' <'.$user->getEmail().'>';
				$subject = __('Zugangsdaten wiederherstellen');
				$msg = "\n".sprintf( __('Die E-Mailadresse %s gehört zum Benutzer %s auf "%s".'), $user->getEmail(), $user->getLogin(), i18n::url($site->getOption('title')) )."\n"
					."\n".__('Öffne die folgende URL in deinem Browser, um ein neues Passwort für das Benutzerkonto festzulegen.')."\n"
					."\n".i18n::url( _::eslash($site->getOption('url')).$page->getId().'?approve='.base64_encode($user->getId().':'.$user->getVerificationKey()) )."\n";
				_::sendEmail( $to, $from, $subject, $msg );
				$success_msg = sprintf( __('Es wurde eine E-Mail an <em>%s</em> gesendet um die Wiederherstellung der Zugangsdaten zu best&auml;tigen.'), $user->getEmail() );
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
		'<h2 class="user">'.__($page->getTitle()).'</h2>',
		'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url($page->getId()).'" method="post">',
			'<fieldset class="blue">'
	);
	if( isset($success_msg) && $success_msg )
		$page->addContent( '<p>'.$success_msg.'</p>' );
	else
		$page->addContent(
				'<dl>',
					'<dt>',
						'<label>'.__('Deine E-Mail').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" class="'.( isset($_POST['email']) ? ( isset($errors['email']) ? ' invalid' : ' valid' ) : '' ).'" name="email" value="'.( isset($_POST['email']) ? $_POST['email'] : '' ).'" tabindex="1" placeholder="'.__('g&uuml;ltige E-mailadresse').'" />',
						'<span class="error">'.( isset($errors['email']) ? $errors['email'] : '' ).'</span>',
					'</dd>',
					'<dd>',
						'<input type="submit" value="'.__('Absenden').'" tabindex="2" />',
					'</dd>',
				'</dl>'
		);
	$page->addContent(
			'</fieldset>',
		'</form>'
	);

}

?>
