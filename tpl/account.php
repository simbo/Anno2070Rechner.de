<?php

$errors = array();

if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

	switch( $_POST['action'] ) {
		case 'email':
			if( empty($_POST['email']) )
				$errors['email'] = __('Gib deine E-Mailadresse ein');
			elseif( !_::isValidEmail($_POST['email']) )
				$errors['email'] = __('Ung&uuml;ltige E-Mailadresse');
			elseif( User::checkEmailExists($_POST['email']) )
				$errors['email'] = __('E-Mailadresse bereits registriert');
			break;
		case 'password':
			if( empty($_POST['pwd']) )
				$errors['pwd'] = __('Gib ein Passwort ein');
			elseif( !User::isValidPassword($_POST['pwd']) )
				$errors['pwd'] = __('Mindestens 8 Zeichen');
	
			if( !empty($_POST['pwd']) && empty($_POST['pwd2']) )
				$errors['pwd2'] = __('Gib das Passwort nochmal ein');
			elseif( ( !empty($_POST['pwd']) || empty($_POST['pwd']) ) && $_POST['pwd']!=$_POST['pwd2'] )
				$errors['pwd2'] = __('Die Passw&ouml;rter stimmen nicht &uuml;berein');
			break;
		default:
			break;
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
		
		$success_msg = false;
				
		if( empty($errors) ) {
			switch( $_POST['action'] ) {
				case 'email':
					User::_()->setVerificationKey();
					User::_()->save();
					$from = $site->getOption('title').' <'.$site->getOption('email').'>';
					$to = User::_()->getLogin().' <'.$_POST['email'].'>';
					$subject = __('E-Mailadresse ändern');
					$msg = "\n".sprintf( __('Der Benutzer %s auf "%s" möchte seine E-Mailadresse in %s ändern.'), User::_()->getLogin(), i18n::url($site->getOption('title')), $_POST['email'] )."\n"
						."\n".__('Öffne die folgende URL in deinem Browser, um die E-Mailadresse zu bestätigen und die Änderung abzuschließen.')."\n"
						."\n".i18n::url( _::eslash($site->getOption('url')).'change-email'.'?approve='.base64_encode(User::_()->getId().':'.User::_()->getVerificationKey().':'.$_POST['email']) )."\n";
					_::sendEmail( $to, $from, $subject, $msg );
					$success_msg = sprintf( __('Es wurde eine E-mail an <em>%s</em> gesendet um die neue Adresse zu best&auml;tigen.'), $_POST['email'] );
					break;
				case 'password':
					User::_()->setPassword($_POST['pwd']);
					User::_()->save();
					$success_msg = __('Dein Passwort wurde ge&auml;ndert.');
					break;
				default:
					break;
			}
		}
	
		if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
			$json = array(
				'action' => $_POST['action'],
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
	'<h2 class="user">'.__('Benutzerkonto').'</h2>',
	'<form id="'.$page->getIdSanitized().'-email-form" action="'.i18n::url($page->getId()).'" method="post" class="fright">',
		'<fieldset class="blue">'
);
if( isset($_POST['action']) && $_POST['action']=='email' && $success_msg )
	$page->addContent( $success_msg );
else
	$page->addContent(
			'<input type="hidden" name="action" value="email" />',
			'<dl>',
				'<dt>',
					'<label>'.__('Aktuelle E-Mail').'</label>',
				'</dt>',
				'<dd>',
					'<input type="text" class="" readonly="readonly" value="'.User::_()->getEmail().'" />',
				'</dd>',
				'<dt>',
					'<label>'.__('Neue E-Mail').'</label>',
				'</dt>',
				'<dd>',
					'<input type="text" class="'.( isset($_POST['email']) ? ( isset($errors['email']) ? ' invalid' : ' valid' ) : '' ).'" name="email" value="'.( isset($_POST['email']) ? $_POST['email'] : '' ).'" tabindex="4" placeholder="'.__('g&uuml;ltige E-mailadresse').'" />',
					'<span class="error">'.( isset($errors['email']) ? $errors['email'] : '' ).'</span>',
				'</dd>',
				'<dd>',
					'<input type="submit" value="'.__('&Auml;ndern').'" tabindex="5" class="" />',
				'</dd>',
			'</dl>'
	);
$page->addContent(
		'</fieldset>',
	'</form>',
	'<form id="'.$page->getIdSanitized().'-password-form" action="'.i18n::url($page->getId()).'" method="post">',
		'<fieldset class="blue">'
);
if( isset($_POST['action']) && $_POST['action']=='password' && $success_msg )
	$page->addContent( '<p>'.$success_msg.'</p>' );
else
	$page->addContent(
			'<input type="hidden" name="action" value="password" />',
			'<dl>',
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
	'</form>',
	'<div class="clear"></div>',
	'<p>',
		'<small>'.strftime( __('Registriert am %A, %e. %B %Y um %T'), User::_()->getTimeRegistered() ).'</small><br/>',
		'<small>'.strftime( __('Letzte Authentifizierung am %A, %e. %B %Y um %T'), User::_()->getTimeLastAuth() ).'</small>',
	'</p>'
);

?>
