<?php

$errors = array();

if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

	if( empty($_POST['email']) )
		$errors['email'] = __('Gib deine E-Mailadresse ein');
	elseif( !_::isValidEmail($_POST['email']) )
		$errors['email'] = __('Ung&uuml;ltige E-Mailadresse');
	elseif( !$user = User::getByEmail($_POST['email']) )
		$errors['email'] = __('E-Mailadresse nicht registriert');
	elseif( $user && $user->isActive() )
		$errors['email'] = __('Benutzerkonto ist bereits aktiv');

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
			$user->deactivate();
			$user->save();
			$from = $site->getOption('title').' <'.$site->getOption('email').'>';
			$to = $user->getLogin().' <'.$user->getEmail().'>';
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
	'<h2 class="user">'.__('Benutzerkonto aktivieren').'</h2>',
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

?>
